-- ============================================
-- TechC SNS Database Schema
-- X-like Social Network MVP
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. PROFILES TABLE
-- ユーザープロフィール情報
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL CHECK (char_length(username) >= 3 AND char_length(username) <= 20),
  display_name TEXT CHECK (char_length(display_name) <= 50),
  avatar_url TEXT,
  bio TEXT CHECK (char_length(bio) <= 160),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ユーザー名のインデックス
CREATE INDEX IF NOT EXISTS profiles_username_idx ON profiles(username);

-- ============================================
-- 2. POSTS TABLE
-- 投稿データ
-- ============================================
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) >= 1 AND char_length(content) <= 280),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- パフォーマンス用インデックス
CREATE INDEX IF NOT EXISTS posts_user_id_idx ON posts(user_id);
CREATE INDEX IF NOT EXISTS posts_created_at_idx ON posts(created_at DESC);

-- ============================================
-- 3. LIKES TABLE
-- いいね機能（将来拡張用）
-- ============================================
CREATE TABLE IF NOT EXISTS likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- インデックス
CREATE INDEX IF NOT EXISTS likes_post_id_idx ON likes(post_id);
CREATE INDEX IF NOT EXISTS likes_user_id_idx ON likes(user_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Profiles RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 全員が全てのプロフィールを閲覧可能
CREATE POLICY "Profiles are viewable by everyone" ON profiles
  FOR SELECT
  USING (true);

-- ユーザーは自分のプロフィールのみ作成可能
CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ユーザーは自分のプロフィールのみ更新可能
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Posts RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- 全員が全ての投稿を閲覧可能
CREATE POLICY "Posts are viewable by everyone" ON posts
  FOR SELECT
  USING (true);

-- 認証済みユーザーのみ投稿作成可能
CREATE POLICY "Authenticated users can create posts" ON posts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ユーザーは自分の投稿のみ削除可能
CREATE POLICY "Users can delete their own posts" ON posts
  FOR DELETE
  USING (auth.uid() = user_id);

-- Likes RLS
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- 全員がいいねを閲覧可能
CREATE POLICY "Likes are viewable by everyone" ON likes
  FOR SELECT
  USING (true);

-- 認証済みユーザーのみいいね可能
CREATE POLICY "Authenticated users can like posts" ON likes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ユーザーは自分のいいねのみ削除可能
CREATE POLICY "Users can unlike posts" ON likes
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- 新規ユーザー登録時に自動的にプロフィールを作成
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- トリガー: 新規ユーザー作成時
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at自動更新関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Profiles updated_at トリガー
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Posts updated_at トリガー
DROP TRIGGER IF EXISTS update_posts_updated_at ON posts;
CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SAMPLE DATA (開発用)
-- ============================================

-- サンプルプロフィール（実際のauth.usersが必要なのでコメントアウト）
-- INSERT INTO profiles (id, username, display_name, bio) VALUES
--   ('00000000-0000-0000-0000-000000000001', 'techc_admin', 'TechC Admin', 'Welcome to TechC SNS! 🚀'),
--   ('00000000-0000-0000-0000-000000000002', 'demo_user', 'Demo User', 'Just testing this awesome platform!');

-- サンプル投稿（実際のユーザーIDが必要なのでコメントアウト）
-- INSERT INTO posts (user_id, content) VALUES
--   ('00000000-0000-0000-0000-000000000001', 'Hello TechC SNS! This is our first post! 🎉'),
--   ('00000000-0000-0000-0000-000000000002', 'Loving this new platform! Can''t wait to share more.');

-- ============================================
-- VIEWS (便利なビュー)
-- ============================================

-- タイムライン用ビュー（投稿とユーザー情報を結合）
CREATE OR REPLACE VIEW timeline_view AS
SELECT 
  p.id,
  p.user_id,
  p.content,
  p.created_at,
  p.updated_at,
  pr.username,
  pr.display_name,
  pr.avatar_url,
  (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count
FROM posts p
JOIN profiles pr ON p.user_id = pr.id
ORDER BY p.created_at DESC;

-- ============================================
-- 完了メッセージ
-- ============================================
-- スキーマ作成完了！
-- 次のステップ: Supabaseダッシュボードでこのスクリプトを実行してください
