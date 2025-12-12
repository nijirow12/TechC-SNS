# TechC SNS - セットアップガイド

## 🎉 完成したSNS MVP

X（旧Twitter）風のシンプルなSNSが完成しました！

## 📋 セットアップ手順

### 1. Supabaseデータベースのセットアップ

1. [Supabase Dashboard](https://supabase.com/dashboard)にアクセス
2. プロジェクトを選択
3. **SQL Editor**を開く
4. `supabase-sns-schema.sql`の内容をコピー&ペースト
5. **Run**をクリックして実行

これにより以下が作成されます：
- `profiles` テーブル（ユーザープロフィール）
- `posts` テーブル（投稿）
- `likes` テーブル（いいね機能）
- RLSポリシー（セキュリティ）
- トリガー（自動プロフィール作成）

### 2. 環境変数の確認

`.env.local`ファイルに以下が設定されていることを確認：

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. 開発サーバーの起動

```bash
npm run dev
```

### 4. アプリケーションの使用

1. http://localhost:3000 にアクセス
2. `/signup` でアカウント作成
3. ログイン後、タイムラインが表示されます

## ✨ 実装された機能

### 認証
- ✅ メール/パスワードでサインアップ
- ✅ ログイン/ログアウト
- ✅ セッション管理
- ✅ 自動プロフィール作成

### 投稿機能
- ✅ テキスト投稿（280文字制限）
- ✅ 文字数カウンター
- ✅ リアルタイム投稿
- ✅ 投稿削除（自分の投稿のみ）

### タイムライン
- ✅ 全ユーザーの投稿表示
- ✅ リアルタイム更新（Supabase Realtime）
- ✅ 時系列ソート
- ✅ ユーザー情報表示

### UI/UX
- ✅ レスポンシブデザイン
- ✅ ダークテーマ
- ✅ グラデーション背景
- ✅ ローディング状態
- ✅ エラーハンドリング

## 📁 プロジェクト構造

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx      # ログインページ
│   │   └── signup/page.tsx     # サインアップページ
│   ├── layout.tsx              # ルートレイアウト
│   └── page.tsx                # タイムライン（メインページ）
├── components/
│   ├── auth/
│   │   ├── SignInForm.tsx      # サインインフォーム
│   │   └── SignUpForm.tsx      # サインアップフォーム
│   └── posts/
│       ├── PostCard.tsx        # 投稿カード
│       ├── PostComposer.tsx    # 投稿作成フォーム
│       └── Timeline.tsx        # タイムラインフィード
└── lib/
    └── supabase.ts             # Supabaseクライアント・DB操作
```

## 🔒 セキュリティ

### Row Level Security (RLS)

すべてのテーブルでRLSが有効化されています：

- **Profiles**: 全員が閲覧可能、本人のみ更新可能
- **Posts**: 全員が閲覧可能、認証ユーザーのみ作成可能、本人のみ削除可能
- **Likes**: 全員が閲覧可能、認証ユーザーのみ作成・削除可能

## 🚀 次のステップ

### 実装可能な追加機能

1. **いいね機能の有効化**
   - PostCardコンポーネントにいいねボタンの実装
   - `likePost()` / `unlikePost()` 関数の使用

2. **プロフィールページ**
   - `/profile/[username]` ページの作成
   - ユーザーの投稿一覧表示

3. **画像アップロード**
   - Supabase Storageを使用
   - 投稿に画像を添付

4. **フォロー機能**
   - `follows` テーブルの追加
   - フォロー/フォロワー管理

5. **通知機能**
   - リアルタイム通知
   - いいね・返信の通知

6. **検索機能**
   - ユーザー検索
   - 投稿検索

## 📝 使用方法

### 新規ユーザー登録

1. `/signup` にアクセス
2. ユーザー名（3-20文字、英数字とアンダースコア）
3. 表示名（任意）
4. メールアドレス
5. パスワード（6文字以上）

### 投稿の作成

1. タイムライン上部の入力欄に文字を入力
2. 280文字以内で投稿
3. 「投稿」ボタンをクリック
4. リアルタイムでタイムラインに表示

### 投稿の削除

1. 自分の投稿にホバー
2. 「削除」ボタンをクリック
3. 確認ダイアログで承認

## 🐛 トラブルシューティング

### ログインできない

1. Supabaseダッシュボードで**Authentication**を確認
2. Email認証が有効か確認
3. ユーザーが作成されているか確認

### 投稿が表示されない

1. `supabase-sns-schema.sql`が正しく実行されたか確認
2. RLSポリシーが設定されているか確認
3. ブラウザのコンソールでエラーを確認

### リアルタイム更新が動作しない

1. Supabaseダッシュボードで**Database** → **Replication**を確認
2. `posts`テーブルのRealtimeが有効か確認

## 📚 参考リンク

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [Next.js Documentation](https://nextjs.org/docs)
