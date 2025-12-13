import { NextRequest, NextResponse } from 'next/server';
import { supabase, updatePlayer, updateGameRoom, recordAction, getPlayers } from '@/lib/supabase/poker';
import type { Player, GameRoom } from '@/lib/types/poker';

export async function POST(request: NextRequest) {
    try {
        const { room_id, winner_id } = await request.json();

        if (!room_id || !winner_id) {
            return NextResponse.json(
                { success: false, error: 'ルームIDと勝者IDが必要です' },
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

        // 勝者情報を取得
        const { data: winner, error: winnerError } = await supabase
            .from('players')
            .select('*')
            .eq('id', winner_id)
            .single();

        if (winnerError || !winner) {
            return NextResponse.json(
                { success: false, error: '勝者が見つかりません' },
                { status: 404 }
            );
        }

        const typedWinner = winner as Player;

        // ポットを勝者に配分
        await updatePlayer(winner_id, {
            chips: typedWinner.chips + typedRoom.current_pot,
        });

        // 全プレイヤーのベット額とステータスをリセット
        const players = await getPlayers(room_id);
        for (const player of players) {
            await updatePlayer(player.id, {
                current_bet: 0,
                status: 'active',
            });
        }

        // ゲームルームをリセット（新しいラウンド）
        await updateGameRoom(room_id, {
            current_pot: 0,
            current_round: typedRoom.current_round + 1,
            dealer_position: (typedRoom.dealer_position + 1) % 6,
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
