import { createClient } from '@supabase/supabase-js'
import { auth } from '@clerk/nextjs/server'

// 環境変数からSupabaseの設定を取得
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Supabaseクライアントを作成（シングルトン）
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ============================================
// 型定義
// ============================================

export interface Profile {
    id: string
    username: string
    display_name: string | null
    avatar_url: string | null
    bio: string | null
    created_at: string
    updated_at: string
}

export interface Post {
    id: string
    user_id: string
    content: string
    created_at: string
    updated_at: string
}

export interface TimelinePost extends Post {
    username: string
    display_name: string | null
    avatar_url: string | null
    likes_count: number
}

// ============================================
// プロフィール関連
// ============================================

/**
 * ユーザー名でプロフィールを取得
 */
export async function getProfileByUsername(username: string): Promise<Profile | null> {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single()

    if (error) {
        if (error.code === 'PGRST116') return null // Not found
        throw error
    }
    return data
}

/**
 * Clerk User IDでプロフィールを取得
 */
export async function getProfileByClerkId(clerkId: string): Promise<Profile | null> {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', clerkId)
        .single()

    if (error) {
        if (error.code === 'PGRST116') return null // Not found
        throw error
    }
    return data
}

/**
 * プロフィールを更新
 */
export async function updateProfile(userId: string, updates: Partial<Profile>) {
    const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single()

    if (error) throw error
    return data
}

/**
 * プロフィールを作成（Clerk Webhook用）
 */
export async function createProfile(clerkId: string, username: string, displayName?: string, avatarUrl?: string) {
    const { data, error } = await supabase
        .from('profiles')
        .insert({
            id: clerkId,
            username,
            display_name: displayName || username,
            avatar_url: avatarUrl,
        })
        .select()
        .single()

    if (error) throw error
    return data
}

// ============================================
// 投稿関連
// ============================================

/**
 * 新しい投稿を作成
 */
export async function createPost(content: string, userId: string) {
    const { data, error } = await supabase
        .from('posts')
        .insert({
            user_id: userId,
            content,
        })
        .select()
        .single()

    if (error) throw error
    return data
}

/**
 * タイムラインを取得（全ユーザーの投稿）
 */
export async function getTimeline(limit = 50): Promise<TimelinePost[]> {
    const { data, error } = await supabase
        .from('timeline_view')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

    if (error) throw error
    return data as TimelinePost[]
}

/**
 * 特定ユーザーの投稿を取得
 */
export async function getUserPosts(userId: string, limit = 50): Promise<TimelinePost[]> {
    const { data, error } = await supabase
        .from('timeline_view')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

    if (error) throw error
    return data as TimelinePost[]
}

/**
 * 投稿を削除
 */
export async function deletePost(postId: string) {
    const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)

    if (error) throw error
}

// ============================================
// いいね関連
// ============================================

/**
 * 投稿にいいねする
 */
export async function likePost(postId: string, userId: string) {
    const { data, error } = await supabase
        .from('likes')
        .insert({
            user_id: userId,
            post_id: postId,
        })
        .select()
        .single()

    if (error) throw error
    return data
}

/**
 * いいねを取り消す
 */
export async function unlikePost(postId: string, userId: string) {
    const { error } = await supabase
        .from('likes')
        .delete()
        .eq('user_id', userId)
        .eq('post_id', postId)

    if (error) throw error
}

/**
 * ユーザーが投稿にいいねしているか確認
 */
export async function hasLikedPost(postId: string, userId: string): Promise<boolean> {
    const { data, error } = await supabase
        .from('likes')
        .select('id')
        .eq('user_id', userId)
        .eq('post_id', postId)
        .single()

    if (error) {
        if (error.code === 'PGRST116') return false // Not found
        throw error
    }
    return !!data
}

// ============================================
// リアルタイム購読
// ============================================

/**
 * タイムラインの変更を購読
 */
export function subscribeToTimeline(callback: (post: TimelinePost) => void) {
    return supabase
        .channel('timeline')
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'posts',
            },
            async (payload) => {
                // 新しい投稿のプロフィール情報を取得
                const { data } = await supabase
                    .from('timeline_view')
                    .select('*')
                    .eq('id', payload.new.id)
                    .single()

                if (data) {
                    callback(data as TimelinePost)
                }
            }
        )
        .subscribe()
}
