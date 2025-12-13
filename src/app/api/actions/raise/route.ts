import { NextRequest, NextResponse } from 'next/server';
import { supabase, updatePlayer, updateGameRoom, recordAction, getPlayers } from '@/lib/supabase/poker';
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

        // 全プレイヤーを取得して最高ベット額を確認
        const players = await getPlayers(typedRoom.id);
        const maxBet = Math.max(...players.map(p => p.current_bet), 0);

        // レイズバリデーション
        const newTotalBet = typedPlayer.current_bet + amount;

        if (newTotalBet <= maxBet) {
            return NextResponse.json(
                { success: false, error: `レイズは現在の最高ベット額(${maxBet})を上回る必要があります` },
                { status: 400 }
            );
        }

        // ミニマムレイズチェック（簡易版：最高ベット額の2倍以上）
        const minRaise = maxBet * 2;
        if (newTotalBet < minRaise && newTotalBet < typedPlayer.chips + typedPlayer.current_bet) {
            return NextResponse.json(
                { success: false, error: `最低レイズ額は${minRaise}チップです` },
                { status: 400 }
            );
        }

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
            newChips === 0 ? 'all_in' : 'raise',
            amount,
            typedRoom.current_round
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in raise action API:', error);
        return NextResponse.json(
            { success: false, error: 'サーバーエラーが発生しました' },
            { status: 500 }
        );
    }
}
