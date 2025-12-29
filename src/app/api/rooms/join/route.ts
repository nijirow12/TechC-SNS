import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { getGameRoom, addPlayer, getNextAvailablePosition, updatePlayer } from '@/lib/supabase/poker';
import { getOrCreateUserAccount, linkPlayerToUserAccount } from '@/lib/supabase/userAccount';

export async function POST(request: NextRequest) {
    try {
        const { room_code, nickname } = await request.json();

        if (!room_code) {
            return NextResponse.json(
                { success: false, error: 'ルームコードが必要です' },
                { status: 400 }
            );
        }

        // 認証チェック
        const { userId } = await auth();
        const user = await currentUser();

        if (!userId || !user) {
            return NextResponse.json(
                { success: false, error: 'ログインが必要です' },
                { status: 401 }
            );
        }

        // ユーザーアカウントを取得または作成
        const displayName = nickname ||
            user.username ||
            user.firstName ||
            user.emailAddresses[0]?.emailAddress?.split('@')[0] ||
            'Player';

        const email = user.emailAddresses[0]?.emailAddress || undefined;
        const userAccount = await getOrCreateUserAccount(userId, displayName, email);

        if (!userAccount) {
            return NextResponse.json(
                { success: false, error: 'ユーザーアカウントの作成に失敗しました' },
                { status: 500 }
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

        // プレイヤーを追加（ユーザーの永続チップ残高を使用）
        const startingChips = userAccount.total_chips;
        const playerNickname = nickname || userAccount.display_name;

        const player = await addPlayer(room.id, playerNickname, position);
        if (!player) {
            return NextResponse.json(
                { success: false, error: 'プレイヤーの追加に失敗しました' },
                { status: 500 }
            );
        }

        // プレイヤーをユーザーアカウントに紐づけ
        await linkPlayerToUserAccount(player.id, userAccount.id);

        // チップ残高を更新（永続チップを使用）
        await updatePlayer(player.id, { chips: startingChips });

        return NextResponse.json({
            success: true,
            player: {
                ...player,
                chips: startingChips,
                user_account_id: userAccount.id,
            },
            user_account: {
                id: userAccount.id,
                display_name: userAccount.display_name,
                total_chips: userAccount.total_chips,
            },
        });
    } catch (error) {
        console.error('Error in join room API:', error);
        return NextResponse.json(
            { success: false, error: 'サーバーエラーが発生しました' },
            { status: 500 }
        );
    }
}

