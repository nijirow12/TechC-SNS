// ユーザーアカウント管理用のヘルパー関数

import { supabase } from './poker';

export interface UserAccount {
    id: string;
    clerk_user_id: string;
    display_name: string;
    email: string | null;
    total_chips: number;
    games_played: number;
    games_won: number;
    created_at: string;
    updated_at: string;
}

// Clerk user_idからユーザーアカウントを取得
export async function getUserAccountByClerkId(clerkUserId: string): Promise<UserAccount | null> {
    const { data, error } = await supabase
        .from('user_accounts')
        .select('*')
        .eq('clerk_user_id', clerkUserId)
        .single();

    if (error) {
        if (error.code === 'PGRST116') {
            // レコードが見つからない場合
            return null;
        }
        console.error('Error fetching user account:', error);
        return null;
    }

    return data as UserAccount;
}

// ユーザーアカウントを作成
export async function createUserAccount(
    clerkUserId: string,
    displayName: string,
    email?: string
): Promise<UserAccount | null> {
    const { data, error } = await supabase
        .from('user_accounts')
        .insert({
            clerk_user_id: clerkUserId,
            display_name: displayName,
            email: email || null,
            total_chips: 1000,
            games_played: 0,
            games_won: 0,
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating user account:', error);
        return null;
    }

    return data as UserAccount;
}

// ユーザーアカウントを取得または作成
export async function getOrCreateUserAccount(
    clerkUserId: string,
    displayName: string,
    email?: string
): Promise<UserAccount | null> {
    // まず既存のアカウントを探す
    const existing = await getUserAccountByClerkId(clerkUserId);
    if (existing) {
        return existing;
    }

    // 見つからなければ新規作成
    return createUserAccount(clerkUserId, displayName, email);
}

// ユーザーのチップ残高を更新
export async function updateUserChips(
    userAccountId: string,
    newChips: number
): Promise<boolean> {
    const { error } = await supabase
        .from('user_accounts')
        .update({ total_chips: newChips })
        .eq('id', userAccountId);

    if (error) {
        console.error('Error updating user chips:', error);
        return false;
    }

    return true;
}

// ユーザーのチップ残高を増減
export async function adjustUserChips(
    userAccountId: string,
    adjustment: number
): Promise<boolean> {
    // 現在のチップを取得
    const { data: user, error: fetchError } = await supabase
        .from('user_accounts')
        .select('total_chips')
        .eq('id', userAccountId)
        .single();

    if (fetchError || !user) {
        console.error('Error fetching user for chip adjustment:', fetchError);
        return false;
    }

    const newChips = Math.max(0, user.total_chips + adjustment);
    return updateUserChips(userAccountId, newChips);
}

// ゲーム統計を更新
export async function updateGameStats(
    userAccountId: string,
    won: boolean
): Promise<boolean> {
    const { data: user, error: fetchError } = await supabase
        .from('user_accounts')
        .select('games_played, games_won')
        .eq('id', userAccountId)
        .single();

    if (fetchError || !user) {
        console.error('Error fetching user for stats update:', fetchError);
        return false;
    }

    const { error } = await supabase
        .from('user_accounts')
        .update({
            games_played: user.games_played + 1,
            games_won: won ? user.games_won + 1 : user.games_won,
        })
        .eq('id', userAccountId);

    if (error) {
        console.error('Error updating game stats:', error);
        return false;
    }

    return true;
}

// プレイヤーのuser_account_idを設定
export async function linkPlayerToUserAccount(
    playerId: string,
    userAccountId: string
): Promise<boolean> {
    const { error } = await supabase
        .from('players')
        .update({ user_account_id: userAccountId })
        .eq('id', playerId);

    if (error) {
        console.error('Error linking player to user account:', error);
        return false;
    }

    return true;
}
