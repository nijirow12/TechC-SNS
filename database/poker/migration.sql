-- ポーカーシステム - マイグレーションSQL
-- 既存のテーブルに新しいカラムを追加

-- game_roomsテーブルに新しいカラムを追加（存在しない場合のみ）
DO $$ 
BEGIN
    -- small_blind カラムを追加
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='game_rooms' AND column_name='small_blind') THEN
        ALTER TABLE game_rooms ADD COLUMN small_blind INTEGER NOT NULL DEFAULT 50;
    END IF;

    -- big_blind カラムを追加
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='game_rooms' AND column_name='big_blind') THEN
        ALTER TABLE game_rooms ADD COLUMN big_blind INTEGER NOT NULL DEFAULT 100;
    END IF;

    -- sb_position カラムを追加
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='game_rooms' AND column_name='sb_position') THEN
        ALTER TABLE game_rooms ADD COLUMN sb_position INTEGER;
    END IF;

    -- bb_position カラムを追加
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='game_rooms' AND column_name='bb_position') THEN
        ALTER TABLE game_rooms ADD COLUMN bb_position INTEGER;
    END IF;

    -- max_players カラムを追加
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='game_rooms' AND column_name='max_players') THEN
        ALTER TABLE game_rooms ADD COLUMN max_players INTEGER NOT NULL DEFAULT 6 CHECK (max_players >= 2 AND max_players <= 10);
    END IF;
END $$;

-- playersテーブルのposition制約を更新
DO $$
BEGIN
    -- 既存の制約を削除
    ALTER TABLE players DROP CONSTRAINT IF EXISTS players_position_check;
    
    -- 新しい制約を追加（0-9）
    ALTER TABLE players ADD CONSTRAINT players_position_check CHECK (position >= 0 AND position <= 9);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- coin_transfersテーブルを作成（存在しない場合のみ）
CREATE TABLE IF NOT EXISTS coin_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES game_rooms(id) ON DELETE CASCADE,
    from_player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    to_player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL CHECK (amount > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックスを作成（存在しない場合のみ）
CREATE INDEX IF NOT EXISTS idx_coin_transfers_room_id ON coin_transfers(room_id);
CREATE INDEX IF NOT EXISTS idx_coin_transfers_from_player_id ON coin_transfers(from_player_id);
CREATE INDEX IF NOT EXISTS idx_coin_transfers_to_player_id ON coin_transfers(to_player_id);

-- Realtime機能を有効化（既に有効な場合はエラーを無視）
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE coin_transfers;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Row Level Security (RLS) を有効化
ALTER TABLE coin_transfers ENABLE ROW LEVEL SECURITY;

-- RLSポリシーを作成（存在しない場合のみ）
DO $$
BEGIN
    -- 読み取りポリシー
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'coin_transfers' AND policyname = 'Anyone can read coin_transfers') THEN
        CREATE POLICY "Anyone can read coin_transfers"
            ON coin_transfers FOR SELECT
            USING (true);
    END IF;

    -- 挿入ポリシー
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'coin_transfers' AND policyname = 'Anyone can insert coin_transfers') THEN
        CREATE POLICY "Anyone can insert coin_transfers"
            ON coin_transfers FOR INSERT
            WITH CHECK (true);
    END IF;
END $$;

-- 既存のデフォルト値を更新（必要に応じて）
DO $$
BEGIN
    -- small_blindのデフォルト値を50に更新
    ALTER TABLE game_rooms ALTER COLUMN small_blind SET DEFAULT 50;
    
    -- big_blindのデフォルト値を100に更新
    ALTER TABLE game_rooms ALTER COLUMN big_blind SET DEFAULT 100;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;
