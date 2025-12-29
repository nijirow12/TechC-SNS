// チップ残高管理API
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUserAccountByClerkId, updateUserChips, adjustUserChips } from '@/lib/supabase/userAccount';

// GET: 現在のチップ残高を取得
export async function GET() {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'ログインが必要です' },
                { status: 401 }
            );
        }

        const userAccount = await getUserAccountByClerkId(userId);

        if (!userAccount) {
            return NextResponse.json(
                { success: false, error: 'ユーザーアカウントが見つかりません' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            chips: userAccount.total_chips,
            games_played: userAccount.games_played,
            games_won: userAccount.games_won,
        });
    } catch (error) {
        console.error('Error in GET /api/users/chips:', error);
        return NextResponse.json(
            { success: false, error: 'サーバーエラー' },
            { status: 500 }
        );
    }
}

// POST: チップ残高を更新
export async function POST(request: Request) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'ログインが必要です' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { action, amount } = body;

        if (!action || typeof amount !== 'number') {
            return NextResponse.json(
                { success: false, error: 'action と amount が必要です' },
                { status: 400 }
            );
        }

        const userAccount = await getUserAccountByClerkId(userId);

        if (!userAccount) {
            return NextResponse.json(
                { success: false, error: 'ユーザーアカウントが見つかりません' },
                { status: 404 }
            );
        }

        let success = false;

        switch (action) {
            case 'set':
                // チップを指定値に設定
                success = await updateUserChips(userAccount.id, amount);
                break;
            case 'add':
                // チップを加算
                success = await adjustUserChips(userAccount.id, amount);
                break;
            case 'subtract':
                // チップを減算
                success = await adjustUserChips(userAccount.id, -amount);
                break;
            default:
                return NextResponse.json(
                    { success: false, error: '無効なaction: set, add, subtract のいずれかを指定してください' },
                    { status: 400 }
                );
        }

        if (!success) {
            return NextResponse.json(
                { success: false, error: 'チップの更新に失敗しました' },
                { status: 500 }
            );
        }

        // 更新後のチップ残高を取得
        const updatedAccount = await getUserAccountByClerkId(userId);

        return NextResponse.json({
            success: true,
            chips: updatedAccount?.total_chips || 0,
        });
    } catch (error) {
        console.error('Error in POST /api/users/chips:', error);
        return NextResponse.json(
            { success: false, error: 'サーバーエラー' },
            { status: 500 }
        );
    }
}
