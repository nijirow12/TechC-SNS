import { NextRequest, NextResponse } from 'next/server';
import { setBlinds, getPlayers, supabase } from '@/lib/supabase/poker';

export async function POST(request: NextRequest) {
    try {
        const { room_id, sb_position, bb_position } = await request.json();

        // バリデーション
        if (room_id === undefined || sb_position === undefined || bb_position === undefined) {
            return NextResponse.json(
                { success: false, error: 'ルームIDとSB/BBポジションが必要です' },
                { status: 400 }
            );
        }

        if (sb_position === bb_position) {
            return NextResponse.json(
                { success: false, error: 'SBとBBは異なるプレイヤーである必要があります' },
                { status: 400 }
            );
        }

        // ルームの状態確認
        const { data: room } = await supabase
            .from('game_rooms')
            .select('*')
            .eq('id', room_id)
            .single();

        if (!room) {
            return NextResponse.json(
                { success: false, error: 'ルームが見つかりません' },
                { status: 404 }
            );
        }

        if (room.status !== 'waiting') {
            return NextResponse.json(
                { success: false, error: 'ゲーム開始前のみブラインドを設定できます' },
                { status: 400 }
            );
        }

        // プレイヤーの存在確認
        const players = await getPlayers(room_id);
        const sbPlayer = players.find(p => p.position === sb_position);
        const bbPlayer = players.find(p => p.position === bb_position);

        if (!sbPlayer || !bbPlayer) {
            return NextResponse.json(
                { success: false, error: '指定されたポジションにプレイヤーがいません' },
                { status: 400 }
            );
        }

        // ブラインド設定
        const success = await setBlinds(room_id, sb_position, bb_position);

        if (!success) {
            return NextResponse.json(
                { success: false, error: 'ブラインドの設定に失敗しました' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in set blinds API:', error);
        return NextResponse.json(
            { success: false, error: 'サーバーエラーが発生しました' },
            { status: 500 }
        );
    }
}
