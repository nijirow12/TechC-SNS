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

        // SB/BBポジションを自動的に次のプレイヤーに移動（チップ0のプレイヤーはスキップ）
        let nextSbPosition = null;
        let nextBbPosition = null;

        // チップが0より大きいアクティブプレイヤーのみを対象
        const eligiblePlayers = players.filter(p => p.chips > 0);
        const eligiblePositions = eligiblePlayers.map(p => p.position).sort((a, b) => a - b);

        if (eligiblePositions.length >= 2) {
            // ディーラーポジションから次のプレイヤーを探す
            let sbIndex = -1;
            let bbIndex = -1;

            // ディーラーの次のポジションを探す（チップがあるプレイヤー）
            for (let i = 1; i <= maxPlayers; i++) {
                const candidatePos = (nextDealerPosition + i) % maxPlayers;
                if (eligiblePositions.includes(candidatePos)) {
                    if (sbIndex === -1) {
                        sbIndex = eligiblePositions.indexOf(candidatePos);
                        nextSbPosition = candidatePos;
                    } else if (bbIndex === -1) {
                        bbIndex = eligiblePositions.indexOf(candidatePos);
                        nextBbPosition = candidatePos;
                        break;
                    }
                }
            }
        }

        // ルーム情報を更新
        await updateGameRoom(room_id, {
            current_pot: 0,
            current_round: typedRoom.current_round + 1,
            dealer_position: nextDealerPosition,
            sb_position: nextSbPosition,
            bb_position: nextBbPosition,
        });

        // 新しいラウンドのブラインドを自動徴収
        if (nextSbPosition !== null && nextBbPosition !== null) {
            const sbPlayer = players.find(p => p.position === nextSbPosition);
            const bbPlayer = players.find(p => p.position === nextBbPosition);

            if (sbPlayer && bbPlayer) {
                // SBを徴収（残高が不足している場合はオールイン）
                const sbAmount = Math.min(sbPlayer.chips, typedRoom.small_blind);
                await updatePlayer(sbPlayer.id, {
                    chips: sbPlayer.chips - sbAmount,
                    current_bet: sbAmount,
                });

                // BBを徴収（残高が不足している場合はオールイン）
                const bbAmount = Math.min(bbPlayer.chips, typedRoom.big_blind);
                await updatePlayer(bbPlayer.id, {
                    chips: bbPlayer.chips - bbAmount,
                    current_bet: bbAmount,
                });

                // ポットに追加
                await updateGameRoom(room_id, {
                    current_pot: sbAmount + bbAmount,
                });
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in distribute pot API:', error);
        return NextResponse.json(
            { success: false, error: 'サーバーエラーが発生しました' },
            { status: 500 }
        );
    }
}
