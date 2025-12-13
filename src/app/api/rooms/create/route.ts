import { NextResponse } from 'next/server';
import { createGameRoom } from '@/lib/supabase/poker';

export async function POST() {
    try {
        const room = await createGameRoom();

        if (!room) {
            return NextResponse.json(
                { success: false, error: 'ルームの作成に失敗しました' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            room_code: room.room_code,
        });
    } catch (error) {
        console.error('Error in create room API:', error);
        return NextResponse.json(
            { success: false, error: 'サーバーエラーが発生しました' },
            { status: 500 }
        );
    }
}
