import { NextRequest, NextResponse } from 'next/server';
import { getGameRoom, addPlayer, getNextAvailablePosition } from '@/lib/supabase/poker';

export async function POST(request: NextRequest) {
    try {
        const { room_code, nickname } = await request.json();

        if (!room_code || !nickname) {
            return NextResponse.json(
                { success: false, error: 'ルームコードとニックネームが必要です' },
                { status: 400 }
            );
        }

        // ルームの存在確認
        const room = await getGameRoom(room_code);
        if (!room) {
            return NextResponse.json(
                { success: false, error: 'ルームが見つかりません' },
                { status: 404 }
            );
        }

        // 利用可能な座席位置を取得
        const position = await getNextAvailablePosition(room.id);
        if (position === null) {
            return NextResponse.json(
                { success: false, error: 'ルームが満員です（最大6人）' },
                { status: 400 }
            );
        }

        // プレイヤーを追加
        const player = await addPlayer(room.id, nickname, position);
        if (!player) {
            return NextResponse.json(
                { success: false, error: 'プレイヤーの追加に失敗しました' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            player,
        });
    } catch (error) {
        console.error('Error in join room API:', error);
        return NextResponse.json(
            { success: false, error: 'サーバーエラーが発生しました' },
            { status: 500 }
        );
    }
}
