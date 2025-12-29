-- Supabase Realtime有効化スクリプト
-- CHANNEL_ERRORを解決するための設定

-- ステップ1: Realtime Publicationにテーブルを追加
-- 既存のテーブルがある場合はエラーを無視
DO $$
BEGIN
    -- game_roomsを追加
    ALTER PUBLICATION supabase_realtime ADD TABLE game_rooms;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    -- playersを追加
    ALTER PUBLICATION supabase_realtime ADD TABLE players;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    -- game_actionsを追加
    ALTER PUBLICATION supabase_realtime ADD TABLE game_actions;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    -- coin_transfersを追加
    ALTER PUBLICATION supabase_realtime ADD TABLE coin_transfers;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ステップ2: REPLICA IDENTITYを設定（必須）
ALTER TABLE game_rooms REPLICA IDENTITY FULL;
ALTER TABLE players REPLICA IDENTITY FULL;
ALTER TABLE game_actions REPLICA IDENTITY FULL;
ALTER TABLE coin_transfers REPLICA IDENTITY FULL;

-- ステップ3: 確認クエリ
-- 以下のクエリを実行して、テーブルがRealtimeに追加されているか確認
SELECT 
    schemaname,
    tablename
FROM 
    pg_publication_tables
WHERE 
    pubname = 'supabase_realtime'
ORDER BY 
    tablename;

-- 期待される結果:
-- coin_transfers
-- game_actions
-- game_rooms
-- players
