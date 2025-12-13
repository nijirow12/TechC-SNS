import { NextRequest, NextResponse } from 'next/server';
import { supabase, updatePlayer, updateGameRoom, recordAction } from '@/lib/supabase/poker';
import type { Player, GameRoom } from '@/lib/types/poker';

export async function POST(request: NextRequest) {
    try {
        const { player_id, amount } = await request.json();

        if (!player_id || amount === undefined || amount <= 0) {
            return NextResponse.json(
                { success: false, error: '無効なパラメータです' },
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

        // チップが足りるか確認
        if (typedPlayer.chips < amount) {
            return NextResponse.json(
                { success: false, error: 'チップが不足しています' },
                { status: 400 }
            );
        }

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

        // プレイヤーのチップを減らし、ベット額を更新
        const newChips = typedPlayer.chips - amount;
        const newBet = typedPlayer.current_bet + amount;

        await updatePlayer(player_id, {
            chips: newChips,
            current_bet: newBet,
            status: newChips === 0 ? 'all_in' : 'active',
        });

        // ポットに追加
        await updateGameRoom(typedRoom.id, {
            current_pot: typedRoom.current_pot + amount,
        });

        // アクションを記録
        await recordAction(
            typedRoom.id,
            player_id,
            newChips === 0 ? 'all_in' : 'bet',
            amount,
            typedRoom.current_round
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in bet action API:', error);
        return NextResponse.json(
            { success: false, error: 'サーバーエラーが発生しました' },
            { status: 500 }
        );
    }
}
