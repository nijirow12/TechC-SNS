-- ポーカーコイン管理システム - データベーススキーマ
-- Supabase PostgreSQL

-- 既存のテーブルを削除（クリーンスタート）
DROP TABLE IF EXISTS game_actions CASCADE;
DROP TABLE IF EXISTS players CASCADE;
DROP TABLE IF EXISTS game_rooms CASCADE;

-- ゲームルームテーブル
CREATE TABLE game_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_code TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'playing', 'finished')),
    current_pot INTEGER NOT NULL DEFAULT 0,
    current_round INTEGER NOT NULL DEFAULT 1,
    dealer_position INTEGER NOT NULL DEFAULT 0,
    small_blind INTEGER NOT NULL DEFAULT 50,
    big_blind INTEGER NOT NULL DEFAULT 100,
    sb_position INTEGER,
    bb_position INTEGER,
    max_players INTEGER NOT NULL DEFAULT 6 CHECK (max_players >= 2 AND max_players <= 10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- プレイヤーテーブル
CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES game_rooms(id) ON DELETE CASCADE,
    nickname TEXT NOT NULL,
    position INTEGER NOT NULL CHECK (position >= 0 AND position <= 9),
    chips INTEGER NOT NULL DEFAULT 1000,
    current_bet INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'folded', 'all_in')),
    is_connected BOOLEAN NOT NULL DEFAULT true,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(room_id, position)
);

-- アクション履歴テーブル
CREATE TABLE game_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES game_rooms(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL CHECK (action_type IN ('bet', 'raise', 'call', 'fold', 'check', 'all_in')),
    amount INTEGER NOT NULL DEFAULT 0,
    round_number INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- コイン譲渡履歴テーブル
CREATE TABLE coin_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES game_rooms(id) ON DELETE CASCADE,
    from_player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    to_player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL CHECK (amount > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス作成（パフォーマンス向上）
CREATE INDEX idx_players_room_id ON players(room_id);
CREATE INDEX idx_game_actions_room_id ON game_actions(room_id);
CREATE INDEX idx_game_actions_player_id ON game_actions(player_id);
CREATE INDEX idx_game_rooms_room_code ON game_rooms(room_code);
CREATE INDEX idx_coin_transfers_room_id ON coin_transfers(room_id);
CREATE INDEX idx_coin_transfers_from_player_id ON coin_transfers(from_player_id);
CREATE INDEX idx_coin_transfers_to_player_id ON coin_transfers(to_player_id);

-- updated_at自動更新用のトリガー関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- game_roomsテーブルにトリガーを設定
CREATE TRIGGER update_game_rooms_updated_at
    BEFORE UPDATE ON game_rooms
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Realtime機能を有効化
ALTER PUBLICATION supabase_realtime ADD TABLE game_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE players;
ALTER PUBLICATION supabase_realtime ADD TABLE game_actions;
ALTER PUBLICATION supabase_realtime ADD TABLE coin_transfers;

-- Row Level Security (RLS) を有効化
ALTER TABLE game_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE coin_transfers ENABLE ROW LEVEL SECURITY;

-- 全てのユーザーが読み取り可能なポリシー
CREATE POLICY "Anyone can read game_rooms"
    ON game_rooms FOR SELECT
    USING (true);

CREATE POLICY "Anyone can read players"
    ON players FOR SELECT
    USING (true);

CREATE POLICY "Anyone can read game_actions"
    ON game_actions FOR SELECT
    USING (true);

-- 全てのユーザーが挿入可能なポリシー
CREATE POLICY "Anyone can insert game_rooms"
    ON game_rooms FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Anyone can insert players"
    ON players FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Anyone can insert game_actions"
    ON game_actions FOR INSERT
    WITH CHECK (true);

-- 全てのユーザーが更新可能なポリシー
CREATE POLICY "Anyone can update game_rooms"
    ON game_rooms FOR UPDATE
    USING (true);

CREATE POLICY "Anyone can update players"
    ON players FOR UPDATE
    USING (true);

-- 全てのユーザーがコイン譲渡を読み取り可能なポリシー
CREATE POLICY "Anyone can read coin_transfers"
    ON coin_transfers FOR SELECT
    USING (true);

-- 全てのユーザーがコイン譲渡を挿入可能なポリシー
CREATE POLICY "Anyone can insert coin_transfers"
    ON coin_transfers FOR INSERT
    WITH CHECK (true);

-- テスト用のサンプルデータ挿入（オプション）
-- INSERT INTO game_rooms (room_code, status) VALUES ('ABC123', 'waiting');
