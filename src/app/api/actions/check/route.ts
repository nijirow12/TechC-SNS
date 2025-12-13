import { NextRequest, NextResponse } from 'next/server';
import { supabase, updatePlayer, recordAction } from '@/lib/supabase/poker';
import type { Player, GameRoom } from '@/lib/types/poker';

export async function POST(request: NextRequest) {
    try {
        const { player_id } = await request.json();

        if (!player_id) {
            return NextResponse.json(
                { success: false, error: 'プレイヤーIDが必要です' },
                { status: 400 }
            );
        }

        // プレイヤー情報を取得
        const { data: player, error: playerError } = await supabase
            .from('players')
            .select('*')
            .eq('id', player_id)
            .single();

        if (playerError || !player) {
            return NextResponse.json(
                { success: false, error: 'プレイヤーが見つかりません' },
                { status: 404 }
            );
        }

        const typedPlayer = player as Player;

        // ゲームルーム情報を取得
        const { data: room, error: roomError } = await supabase
            .from('game_rooms')
            .select('*')
            .eq('id', typedPlayer.room_id)
            .single();

        if (roomError || !room) {
            return NextResponse.json(
                { success: false, error: 'ルームが見つかりません' },
                { status: 404 }
            );
        }

        const typedRoom = room as GameRoom;

        // アクションを記録
        await recordAction(
            typedRoom.id,
            player_id,
            'check',
            0,
            typedRoom.current_round
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in check action API:', error);
        return NextResponse.json(
            { success: false, error: 'サーバーエラーが発生しました' },
            { status: 500 }
        );
    }
}
