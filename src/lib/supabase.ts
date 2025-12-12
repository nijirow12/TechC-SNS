import { createClient } from '@supabase/supabase-js'

// 環境変数からSupabaseの設定を取得
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Supabaseクライアントを作成
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 使用例: 'vibes' テーブルから全てのデータを取得
export async function getVibes() {
    const { data, error } = await supabase
        .from('vibes')
        .select('*')

    if (error) {
        console.error('Bad Vibes...', error)
        return null
    }

    console.log('Good Vibes!', data)
    return data
}
