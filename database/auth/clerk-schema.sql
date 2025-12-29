-- ============================================
-- TechC SNS Database Schema (Clerk Version)
-- X-like Social Network MVP with Clerk Auth
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. PROFILES TABLE
-- ユーザープロフィール情報（Clerk User IDを使用）
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY, -- Clerk User ID
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
  user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) >= 1 AND char_length(content) <= 280),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- パフォーマンス用インデックス
CREATE INDEX IF NOT EXISTS posts_user_id_idx ON posts(user_id);
CREATE INDEX IF NOT EXISTS posts_created_at_idx ON posts(created_at DESC);

-- ============================================
-- 3. LIKES TABLE
-- いいね機能
-- ============================================
CREATE TABLE IF NOT EXISTS likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
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

-- 誰でもプロフィールを作成可能（Clerk Webhookで使用）
CREATE POLICY "Anyone can insert profiles" ON profiles
  FOR INSERT
  WITH CHECK (true);

-- プロフィールは誰でも更新可能（簡易版、本番では制限を追加）
CREATE POLICY "Anyone can update profiles" ON profiles
  FOR UPDATE
  USING (true);

-- Posts RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- 全員が全ての投稿を閲覧可能
CREATE POLICY "Posts are viewable by everyone" ON posts
  FOR SELECT
  USING (true);

-- 誰でも投稿作成可能（アプリ側で認証チェック）
CREATE POLICY "Anyone can create posts" ON posts
  FOR INSERT
  WITH CHECK (true);

-- 誰でも投稿削除可能（アプリ側で所有者チェック）
CREATE POLICY "Anyone can delete posts" ON posts
  FOR DELETE
  USING (true);

-- Likes RLS
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- 全員がいいねを閲覧可能
CREATE POLICY "Likes are viewable by everyone" ON likes
  FOR SELECT
  USING (true);

-- 誰でもいいね可能（アプリ側で認証チェック）
CREATE POLICY "Anyone can like posts" ON likes
  FOR INSERT
  WITH CHECK (true);

-- 誰でもいいね削除可能（アプリ側で所有者チェック）
CREATE POLICY "Anyone can unlike posts" ON likes
  FOR DELETE
  USING (true);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

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
