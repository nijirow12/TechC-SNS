import { NextRequest, NextResponse } from 'next/server';
import { supabase, updateGameRoom } from '@/lib/supabase/poker';

export async function POST(request: NextRequest) {
    try {
        const { room_id, sb_position, bb_position } = await request.json();

        if (!room_id || sb_position === undefined || bb_position === undefined) {
            return NextResponse.json(
                { success: false, error: '無効なパラメータです' },
                { status: 400 }
            );
        }

        // ブラインド位置を更新
        await updateGameRoom(room_id, {
            sb_position,
            bb_position,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating blinds:', error);
        return NextResponse.json(
            { success: false, error: 'サーバーエラーが発生しました' },
            { status: 500 }
        );
    }
}
