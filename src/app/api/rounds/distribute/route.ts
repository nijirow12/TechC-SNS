import { NextRequest, NextResponse } from 'next/server';
import { supabase, updatePlayer, updateGameRoom, getPlayers, getSidePots } from '@/lib/supabase/poker';
import { updateUserChips } from '@/lib/supabase/userAccount';
import type { Player, GameRoom, PotWinnerSelection } from '@/lib/types/poker';

export async function POST(request: NextRequest) {
    try {
        const { room_id, pot_winners } = await request.json();

        // バリデーション
        if (!room_id || !pot_winners || !Array.isArray(pot_winners)) {
            return NextResponse.json(
                { success: false, error: 'ルームIDとポット勝者情報が必要です' },
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

        // サイドポットを取得
        const sidePots = await getSidePots(room_id, typedRoom.current_round);

        // 各プレイヤーの獲得額を計算
        const playerWinnings = new Map<string, number>();

        for (const potWinner of pot_winners as PotWinnerSelection[]) {
            const pot = sidePots.find(p => p.pot_index === potWinner.pot_index);
            if (!pot) continue;

            const winners = potWinner.winner_ids;
            if (winners.length === 0) continue;

            // ポット金額を勝者で分配
            const baseAmount = Math.floor(pot.amount / winners.length);
            const remainder = pot.amount % winners.length;

            // ディーラーに近い順にソート
            const sortedWinners = winners
                .map(id => players.find(p => p.id === id))
                .filter((p): p is Player => p !== undefined)
                .sort((a, b) => {
                    const dealerPos = typedRoom.dealer_position;
                    const distA = (a.position - dealerPos + 6) % 6;
                    const distB = (b.position - dealerPos + 6) % 6;
                    return distA - distB;
                });

            // 各勝者に配分
            sortedWinners.forEach((winner, index) => {
                const extraChip = index < remainder ? 1 : 0;
                const winAmount = baseAmount + extraChip;
                const currentWinnings = playerWinnings.get(winner.id) || 0;
                playerWinnings.set(winner.id, currentWinnings + winAmount);
            });
        }

        // 全プレイヤーのチップとステータスを更新
        for (const player of players) {
            const winnings = playerWinnings.get(player.id) || 0;
            const newChips = player.chips + winnings;

            await updatePlayer(player.id, {
                chips: newChips,
                current_bet: 0,
                status: 'active',
            });

            // ユーザーアカウントのチップ残高も更新（永続化）
            // Note: player.user_account_id はDB上で取得される
            const { data: playerData } = await supabase
                .from('players')
                .select('user_account_id')
                .eq('id', player.id)
                .single();

            if (playerData?.user_account_id) {
                await updateUserChips(playerData.user_account_id, newChips);
            }
        }

        // サイドポットを削除
        await supabase
            .from('side_pots')
            .delete()
            .eq('room_id', room_id)
            .eq('round_number', typedRoom.current_round);

        // ゲームルームをリセット（新しいラウンド）
        const maxPlayers = typedRoom.max_players || 6;
        const nextDealerPosition = (typedRoom.dealer_position + 1) % maxPlayers;

        // SB/BBポジションを座席順で次に移動（チップ0のプレイヤーはスキップ）
        let nextSbPosition = null;
        let nextBbPosition = null;

        // チップが0より大きいプレイヤーのみを対象
        const eligiblePlayers = players
            .map(p => ({
                ...p,
                chips: p.chips + (playerWinnings.get(p.id) || 0)
            }))
            .filter(p => p.chips > 0);

        if (eligiblePlayers.length >= 2) {
            const currentSbPos = typedRoom.sb_position;
            const currentBbPos = typedRoom.bb_position;

            if (currentSbPos !== null && currentBbPos !== null) {
                let foundSb = false;
                let foundBb = false;

                for (let i = 1; i <= maxPlayers && (!foundSb || !foundBb); i++) {
                    const candidatePos = (currentSbPos + i) % maxPlayers;
                    const candidatePlayer = eligiblePlayers.find(p => p.position === candidatePos);

                    if (candidatePlayer) {
                        if (!foundSb) {
                            nextSbPosition = candidatePos;
                            foundSb = true;
                        } else if (!foundBb) {
                            nextBbPosition = candidatePos;
                            foundBb = true;
                        }
                    }
                }
            } else {
                const sortedEligible = eligiblePlayers.sort((a, b) => a.position - b.position);
                nextSbPosition = sortedEligible[0].position;
                nextBbPosition = sortedEligible[1].position;
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
            const updatedPlayers = await getPlayers(room_id);
            const sbPlayer = updatedPlayers.find(p => p.position === nextSbPosition);
            const bbPlayer = updatedPlayers.find(p => p.position === nextBbPosition);

            if (sbPlayer && bbPlayer) {
                const sbAmount = Math.min(sbPlayer.chips, typedRoom.small_blind);
                await updatePlayer(sbPlayer.id, {
                    chips: sbPlayer.chips - sbAmount,
                    current_bet: sbAmount,
                });

                const bbAmount = Math.min(bbPlayer.chips, typedRoom.big_blind);
                await updatePlayer(bbPlayer.id, {
                    chips: bbPlayer.chips - bbAmount,
                    current_bet: bbAmount,
                });

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
