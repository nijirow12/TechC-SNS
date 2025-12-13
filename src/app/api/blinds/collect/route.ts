import { NextRequest, NextResponse } from 'next/server';
import { collectBlinds, updateGameRoom, supabase } from '@/lib/supabase/poker';

export async function POST(request: NextRequest) {
    try {
        const { room_id } = await request.json();

        if (!room_id) {
            return NextResponse.json(
                { success: false, error: 'ルームIDが必要です' },
                { status: 400 }
            );
        }

        // ルーム情報を取得
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

        // プレイヤーを取得
        const { data: players } = await supabase
            .from('players')
            .select('*')
            .eq('room_id', room_id)
            .order('position', { ascending: true });

        if (!players || players.length < 2) {
            return NextResponse.json(
                { success: false, error: '最低2人のプレイヤーが必要です' },
                { status: 400 }
            );
        }

        // チップが0より大きいプレイヤーのみを対象
        const eligiblePlayers = players.filter((p: any) => p.chips > 0);

        if (eligiblePlayers.length < 2) {
            return NextResponse.json(
                { success: false, error: 'チップを持つプレイヤーが2人以上必要です' },
                { status: 400 }
            );
        }

        // 座席順で最初の2人をSB/BBに設定
        const sbPlayer = eligiblePlayers[0];
        const bbPlayer = eligiblePlayers[1];

        // SB/BBポジションを設定
        await updateGameRoom(room_id, {
            sb_position: sbPlayer.position,
            bb_position: bbPlayer.position,
        });

        // ブラインド徴収
        const success = await collectBlinds(room_id);

        if (!success) {
            return NextResponse.json(
                { success: false, error: 'ブラインドの徴収に失敗しました' },
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
