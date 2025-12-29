-- ユーザーアカウントテーブル（Clerk連携）
-- Clerkで認証されたユーザーのチップデータを永続的に保存

-- 既存のテーブルがあれば削除（開発用）
-- DROP TABLE IF EXISTS user_accounts CASCADE;

CREATE TABLE IF NOT EXISTS user_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_user_id TEXT UNIQUE NOT NULL,  -- Clerk's user_id
    display_name TEXT NOT NULL,
    email TEXT,
    total_chips INTEGER NOT NULL DEFAULT 1000,  -- 永続チップ残高
    games_played INTEGER NOT NULL DEFAULT 0,
    games_won INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_user_accounts_clerk_user_id ON user_accounts(clerk_user_id);

-- updated_at自動更新用のトリガー
CREATE OR REPLACE FUNCTION update_user_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_accounts_updated_at ON user_accounts;
CREATE TRIGGER update_user_accounts_updated_at
    BEFORE UPDATE ON user_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_user_accounts_updated_at();

-- RLSを有効化
ALTER TABLE user_accounts ENABLE ROW LEVEL SECURITY;

-- 全員が読み取り可能
CREATE POLICY "Anyone can read user_accounts"
    ON user_accounts FOR SELECT
    USING (true);

-- 全員が挿入可能（Webhookまたはサーバーサイドから）
CREATE POLICY "Anyone can insert user_accounts"
    ON user_accounts FOR INSERT
    WITH CHECK (true);

-- 全員が更新可能
CREATE POLICY "Anyone can update user_accounts"
    ON user_accounts FOR UPDATE
    USING (true);

-- playersテーブルにuser_account_id列を追加（まだ存在しない場合）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'players' AND column_name = 'user_account_id'
    ) THEN
        ALTER TABLE players ADD COLUMN user_account_id UUID REFERENCES user_accounts(id) ON DELETE SET NULL;
        CREATE INDEX idx_players_user_account_id ON players(user_account_id);
    END IF;
END $$;

-- Realtime有効化
ALTER PUBLICATION supabase_realtime ADD TABLE user_accounts;
