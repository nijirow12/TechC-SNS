-- サイドポット機能用テーブル
-- リアルポーカーのコイン管理ツール用

-- side_potsテーブル作成
CREATE TABLE side_pots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES game_rooms(id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL,
    pot_index INTEGER NOT NULL, -- 0=メインポット, 1,2,...=サイドポット
    amount INTEGER NOT NULL DEFAULT 0,
    eligible_player_ids UUID[] NOT NULL, -- 参加可能なプレイヤーID配列（フォールド済みは除外）
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(room_id, round_number, pot_index)
);

-- インデックス作成
CREATE INDEX idx_side_pots_room_id ON side_pots(room_id);
CREATE INDEX idx_side_pots_round ON side_pots(room_id, round_number);

-- Realtime有効化
ALTER PUBLICATION supabase_realtime ADD TABLE side_pots;

-- REPLICA IDENTITY設定
ALTER TABLE side_pots REPLICA IDENTITY FULL;

-- RLS有効化
ALTER TABLE side_pots ENABLE ROW LEVEL SECURITY;

-- 読み取りポリシー
CREATE POLICY "Anyone can read side_pots"
    ON side_pots FOR SELECT
    USING (true);

-- 挿入ポリシー
CREATE POLICY "Anyone can insert side_pots"
    ON side_pots FOR INSERT
    WITH CHECK (true);

-- 更新ポリシー
CREATE POLICY "Anyone can update side_pots"
    ON side_pots FOR UPDATE
    USING (true);

-- 削除ポリシー
CREATE POLICY "Anyone can delete side_pots"
    ON side_pots FOR DELETE
    USING (true);
