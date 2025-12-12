# Supabase Database Test MVP

## 🎯 概要

このMVPは、Supabaseデータベースの接続状態を検証し、基本的なCRUD操作をテストするためのページです。

## 📋 セットアップ手順

### 1. Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com)にアクセスしてサインイン
2. 「New Project」をクリック
3. プロジェクト名、データベースパスワードを設定
4. リージョンを選択（推奨: Northeast Asia (Tokyo)）

### 2. データベーステーブルの作成

1. Supabaseダッシュボードで「SQL Editor」を開く
2. `supabase-setup.sql` の内容をコピー&ペースト
3. 「Run」をクリックして実行

これにより以下が作成されます：
- `vibes` テーブル
- Row Level Security (RLS) ポリシー
- サンプルデータ
- パフォーマンス用インデックス

### 3. 環境変数の設定

1. Supabaseダッシュボードで「Settings」→「API」を開く
2. 以下の情報をコピー：
   - **Project URL**
   - **anon public key**

3. `.env.local` ファイルを編集：

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. 開発サーバーの起動

```bash
# 環境変数を読み込むため、サーバーを再起動
npm run dev
```

### 5. テストページへアクセス

ブラウザで以下のURLを開く：
- ローカル: http://localhost:3000/db-test
- または、トップページの「🔍 データベーステスト」ボタンをクリック

## ✨ 機能

### 接続テスト
- データベース接続状態のリアルタイム確認
- タイムスタンプ付きステータス表示
- 再テストボタン

### CRUD操作
- ✅ **Create**: 新しいVibeを投稿
- ✅ **Read**: Vibes一覧の表示
- ✅ **Delete**: Vibeの削除
- 🔄 **リアルタイム更新**: 手動リフレッシュボタン

### UI/UX
- レスポンシブデザイン
- ローディングアニメーション
- ホバーエフェクト
- エラーハンドリング

## 📊 データベーススキーマ

```sql
CREATE TABLE vibes (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  content TEXT NOT NULL,
  user_name TEXT DEFAULT 'Anonymous'
);
```

## 🔒 セキュリティ

現在のMVPでは、すべてのユーザーが読み取り・書き込み・削除が可能です。

**本番環境では以下を実装してください：**
- ユーザー認証（Supabase Auth）
- 適切なRLSポリシー
- データバリデーション
- レート制限

## 🚀 次のステップ

1. ✅ データベース接続確認
2. ✅ CRUD操作のテスト
3. 🔄 認証機能の追加
4. 🔄 リアルタイム同期（Supabase Realtime）
5. 🔄 画像アップロード機能
6. 🔄 本番環境へのデプロイ

## 📝 トラブルシューティング

### 接続エラーが出る場合

1. `.env.local` の設定を確認
2. Supabase URLとキーが正しいか確認
3. 開発サーバーを再起動
4. ブラウザのキャッシュをクリア

### テーブルが見つからない場合

1. `supabase-setup.sql` を実行したか確認
2. Supabaseダッシュボードの「Table Editor」でテーブルを確認
3. SQL Editorでエラーがないか確認

### RLSエラーが出る場合

1. RLSポリシーが正しく設定されているか確認
2. SQL Editorで以下を実行：

```sql
-- RLSを一時的に無効化（開発用のみ）
ALTER TABLE vibes DISABLE ROW LEVEL SECURITY;
```

## 📚 参考リンク

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
