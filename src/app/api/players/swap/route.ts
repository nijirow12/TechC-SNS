import { NextRequest, NextResponse } from 'next/server';
import { supabase, getPlayers, updatePlayer } from '@/lib/supabase/poker';

export async function POST(request: NextRequest) {
    try {
        const { room_id, player1_id, player2_id } = await request.json();

        if (!room_id || !player1_id || !player2_id) {
            return NextResponse.json(
                { success: false, error: '無効なパラメータです' },
                { status: 400 }
            );
        }

        // プレイヤー情報を取得
        const players = await getPlayers(room_id);
        const player1 = players.find(p => p.id === player1_id);
        const player2 = players.find(p => p.id === player2_id);

        if (!player1 || !player2) {
            return NextResponse.json(
                { success: false, error: 'プレイヤーが見つかりません' },
                { status: 404 }
            );
        }

        // 座席を入れ替え
        const temp = player1.position;
        await updatePlayer(player1_id, { position: player2.position });
        await updatePlayer(player2_id, { position: temp });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error swapping players:', error);
        return NextResponse.json(
            { success: false, error: 'サーバーエラーが発生しました' },
            { status: 500 }
        );
    }
}
