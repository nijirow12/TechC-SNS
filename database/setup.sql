-- Supabase Database Setup for MVP Testing
-- このSQLをSupabaseのSQL Editorで実行してください

-- vibesテーブルの作成
CREATE TABLE IF NOT EXISTS vibes (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  content TEXT NOT NULL,
  user_name TEXT DEFAULT 'Anonymous'
);

-- Row Level Security (RLS) を有効化
ALTER TABLE vibes ENABLE ROW LEVEL SECURITY;

-- 全員が読み取り可能
CREATE POLICY "Enable read access for all users" ON vibes
  FOR SELECT
  USING (true);

-- 全員が挿入可能（MVP用、本番環境では認証を追加）
CREATE POLICY "Enable insert access for all users" ON vibes
  FOR INSERT
  WITH CHECK (true);

-- 全員が削除可能（MVP用、本番環境では認証を追加）
CREATE POLICY "Enable delete access for all users" ON vibes
  FOR DELETE
  USING (true);

-- サンプルデータの挿入
INSERT INTO vibes (content, user_name) VALUES
  ('Hello from Supabase! 🎉', 'System'),
  ('Database connection is working perfectly!', 'Admin'),
  ('This is a test vibe', 'TestUser');

-- インデックスの作成（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS vibes_created_at_idx ON vibes(created_at DESC);
