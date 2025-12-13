import { NextRequest, NextResponse } from 'next/server';
import { transferCoins, getPlayers } from '@/lib/supabase/poker';

export async function POST(request: NextRequest) {
    try {
        const { room_id, from_player_id, to_player_id, amount } = await request.json();

        // バリデーション
        if (!room_id || !from_player_id || !to_player_id || !amount) {
            return NextResponse.json(
                { success: false, error: '全てのフィールドが必要です' },
                { status: 400 }
            );
        }

        if (amount <= 0) {
            return NextResponse.json(
                { success: false, error: '譲渡額は正の数である必要があります' },
                { status: 400 }
            );
        }

        if (from_player_id === to_player_id) {
            return NextResponse.json(
                { success: false, error: '自分自身にコインを譲渡することはできません' },
                { status: 400 }
            );
        }

        // プレイヤーの存在確認
        const players = await getPlayers(room_id);
        const fromPlayer = players.find(p => p.id === from_player_id);
        const toPlayer = players.find(p => p.id === to_player_id);

        if (!fromPlayer || !toPlayer) {
            return NextResponse.json(
                { success: false, error: 'プレイヤーが見つかりません' },
                { status: 404 }
            );
        }

        if (fromPlayer.chips < amount) {
            return NextResponse.json(
                { success: false, error: 'チップが不足しています' },
                { status: 400 }
            );
        }

        // コイン譲渡実行
        const transfer = await transferCoins(room_id, from_player_id, to_player_id, amount);

        if (!transfer) {
            return NextResponse.json(
                { success: false, error: 'コイン譲渡に失敗しました' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, transfer });
    } catch (error) {
        console.error('Error in transfer coins API:', error);
        return NextResponse.json(
            { success: false, error: 'サーバーエラーが発生しました' },
            { status: 500 }
        );
    }
}
