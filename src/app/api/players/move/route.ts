import { NextRequest, NextResponse } from 'next/server';
import { updatePlayer } from '@/lib/supabase/poker';

export async function POST(request: NextRequest) {
    try {
        const { player_id, new_position } = await request.json();

        if (!player_id || new_position === undefined) {
            return NextResponse.json(
                { success: false, error: '無効なパラメータです' },
                { status: 400 }
            );
        }

        // プレイヤーの座席を更新
        await updatePlayer(player_id, { position: new_position });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error moving player:', error);
        return NextResponse.json(
            { success: false, error: 'サーバーエラーが発生しました' },
            { status: 500 }
        );
    }
}
