import { NextRequest, NextResponse } from 'next/server';
import { supabase, updatePlayer, updateGameRoom, recordAction, getPlayers } from '@/lib/supabase/poker';
import type { Player, GameRoom } from '@/lib/types/poker';

export async function POST(request: NextRequest) {
    try {
        const { room_id, winner_ids } = await request.json();

        // バリデーション
        if (!room_id || !winner_ids || !Array.isArray(winner_ids) || winner_ids.length === 0) {
            return NextResponse.json(
                { success: false, error: 'ルームIDと勝者ID（配列）が必要です' },
                { status: 400 }
            );
        }

        // ゲームルーム情報を取得
        const { data: room, error: roomError } = await supabase
            .from('game_rooms')
            .select('*')
            .eq('id', room_id)
            .single();

        if (roomError || !room) {
            return NextResponse.json(
                { success: false, error: 'ルームが見つかりません' },
                { status: 404 }
            );
        }

        const typedRoom = room as GameRoom;

        // 全プレイヤーを取得
        const players = await getPlayers(room_id);

        // 勝者の検証
        const winners: Player[] = [];
        for (const winnerId of winner_ids) {
            const winner = players.find(p => p.id === winnerId);
            if (!winner) {
                return NextResponse.json(
                    { success: false, error: `勝者が見つかりません: ${winnerId}` },
                    { status: 404 }
                );
            }
            if (winner.status === 'folded') {
                return NextResponse.json(
                    { success: false, error: `フォールド済みのプレイヤーは勝者にできません: ${winner.nickname}` },
                    { status: 400 }
                );
            }
            winners.push(winner);
        }

        // ポット分割計算
        const pot = typedRoom.current_pot;
        const winnerCount = winners.length;
        const baseAmount = Math.floor(pot / winnerCount);
        const remainder = pot % winnerCount;

        // ディーラーに近い順にソート（position順）
        const sortedWinners = [...winners].sort((a, b) => {
            const dealerPos = typedRoom.dealer_position;
            const distA = (a.position - dealerPos + 6) % 6;
            const distB = (b.position - dealerPos + 6) % 6;
            return distA - distB;
        });

        // 全プレイヤーのベット額とステータスをリセット
        for (const player of players) {
            const winnerIndex = sortedWinners.findIndex(w => w.id === player.id);

            if (winnerIndex !== -1) {
                // 勝者：ポットの分配額を追加
                const extraChip = winnerIndex < remainder ? 1 : 0;
                const winAmount = baseAmount + extraChip;

                await updatePlayer(player.id, {
                    chips: player.chips + winAmount,
                    current_bet: 0,
                    status: 'active',
                });
            } else {
                // 他のプレイヤー：ベット額とステータスのみリセット
                await updatePlayer(player.id, {
                    current_bet: 0,
                    status: 'active',
                });
            }
        }

        // ゲームルームをリセット（新しいラウンド）
        const maxPlayers = typedRoom.max_players || 6;
        const nextDealerPosition = (typedRoom.dealer_position + 1) % maxPlayers;

        // SB/BBポジションを自動的に次のプレイヤーに移動
        let nextSbPosition = null;
        let nextBbPosition = null;

        if (typedRoom.sb_position !== null && typedRoom.bb_position !== null) {
            // 現在のSBポジションから次のアクティブなプレイヤーを探す
            const activePlayers = players.filter(p => p.status !== 'folded');
            const activePositions = activePlayers.map(p => p.position).sort((a, b) => a - b);

            if (activePositions.length >= 2) {
                // ディーラーの次のプレイヤーをSBに
                const dealerIndex = activePositions.indexOf(nextDealerPosition);
                if (dealerIndex !== -1) {
                    nextSbPosition = activePositions[(dealerIndex + 1) % activePositions.length];
                    nextBbPosition = activePositions[(dealerIndex + 2) % activePositions.length];
                } else {
                    // ディーラーがアクティブプレイヤーにいない場合、最初の2人を使用
                    nextSbPosition = activePositions[0];
                    nextBbPosition = activePositions[1];
                }
            }
        }

        await updateGameRoom(room_id, {
            current_pot: 0,
            current_round: typedRoom.current_round + 1,
            dealer_position: nextDealerPosition,
            sb_position: nextSbPosition,
            bb_position: nextBbPosition,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in distribute pot API:', error);
        return NextResponse.json(
            { success: false, error: 'サーバーエラーが発生しました' },
            { status: 500 }
        );
    }
}
