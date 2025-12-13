import { NextRequest, NextResponse } from 'next/server';
import { collectBlinds, updateGameRoom } from '@/lib/supabase/poker';

export async function POST(request: NextRequest) {
    try {
        const { room_id } = await request.json();

        if (!room_id) {
            return NextResponse.json(
                { success: false, error: 'ルームIDが必要です' },
                { status: 400 }
            );
        }

        // ブラインド徴収
        const success = await collectBlinds(room_id);

        if (!success) {
            return NextResponse.json(
                { success: false, error: 'ブラインドの徴収に失敗しました。SB/BBが設定されているか確認してください' },
                { status: 400 }
            );
        }

        // ゲームステータスを'playing'に更新
        await updateGameRoom(room_id, { status: 'playing' });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in collect blinds API:', error);
        return NextResponse.json(
            { success: false, error: 'サーバーエラーが発生しました' },
            { status: 500 }
        );
    }
}
