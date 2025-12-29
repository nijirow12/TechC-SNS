// 現在のユーザー情報取得・自動作成API
import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { getOrCreateUserAccount, getUserAccountByClerkId } from '@/lib/supabase/userAccount';

// GET: 現在のユーザーアカウント情報を取得
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
            user: userAccount,
        });
    } catch (error) {
        console.error('Error in GET /api/users/me:', error);
        return NextResponse.json(
            { success: false, error: 'サーバーエラー' },
            { status: 500 }
        );
    }
}

// POST: ユーザーアカウントを取得または作成
export async function POST() {
    try {
        const { userId } = await auth();
        const user = await currentUser();

        if (!userId || !user) {
            return NextResponse.json(
                { success: false, error: 'ログインが必要です' },
                { status: 401 }
            );
        }

        // 表示名を決定（優先順位: username > firstName > emailの@前）
        const displayName =
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

        return NextResponse.json({
            success: true,
            user: userAccount,
        });
    } catch (error) {
        console.error('Error in POST /api/users/me:', error);
        return NextResponse.json(
            { success: false, error: 'サーバーエラー' },
            { status: 500 }
        );
    }
}
