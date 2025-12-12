# Clerk Authentication Setup Guide

## 🔐 Clerk統合完了

Clerk認証がNext.js App Routerに正しく統合されました。

## 📋 セットアップ手順

### 1. Clerkアカウントの作成

1. [Clerk Dashboard](https://dashboard.clerk.com/)にアクセス
2. サインアップまたはサインイン
3. 「Add application」をクリック
4. アプリケーション名を入力（例: TechC SNS）
5. 認証方法を選択（Email, Google, GitHubなど）

### 2. API Keysの取得

1. Clerkダッシュボードで作成したアプリケーションを選択
2. 左サイドバーの「API Keys」をクリック
3. 以下の情報をコピー：
   - **Publishable Key** (`pk_test_...` または `pk_live_...`)
   - **Secret Key** (`sk_test_...` または `sk_live_...`)

### 3. 環境変数の設定

`.env.local` ファイルを編集して、実際のキーを設定：

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

> ⚠️ **重要**: これらのキーは絶対にGitにコミットしないでください！`.env.local`は`.gitignore`に含まれています。

### 4. 開発サーバーの再起動

環境変数を読み込むため、サーバーを再起動：

```bash
# Ctrl+C でサーバーを停止
npm run dev
```

### 5. 動作確認

1. http://localhost:3000 にアクセス
2. 右上の「サインアップ」ボタンをクリック
3. アカウントを作成してサインイン
4. UserButtonが表示されることを確認

## ✨ 実装された機能

### 認証UI
- ✅ **SignInButton**: サインインボタン（モーダル表示）
- ✅ **SignUpButton**: サインアップボタン（モーダル表示）
- ✅ **UserButton**: ユーザープロフィールメニュー
- ✅ **SignedIn/SignedOut**: 認証状態による条件付きレンダリング

### ミドルウェア
- ✅ `middleware.ts` with `clerkMiddleware()`
- ✅ 自動的な認証状態管理
- ✅ 保護されたルートのサポート

### レイアウト
- ✅ `ClerkProvider` でアプリ全体をラップ
- ✅ 固定ヘッダーに認証UIを配置
- ✅ レスポンシブデザイン

## 🔒 保護されたページの作成

特定のページを認証必須にする例：

```typescript
// src/app/protected/page.tsx
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function ProtectedPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/");
  }

  return (
    <div>
      <h1>保護されたページ</h1>
      <p>ログインユーザーのみアクセス可能</p>
    </div>
  );
}
```

## 🎨 カスタマイズ

### テーマのカスタマイズ

```typescript
<ClerkProvider
  appearance={{
    variables: {
      colorPrimary: "#a855f7", // Purple
      colorBackground: "#000000",
      colorText: "#ffffff",
    },
  }}
>
```

### サインインページのカスタマイズ

```typescript
<SignInButton mode="modal">
  <button className="custom-button">
    カスタムサインインボタン
  </button>
</SignInButton>
```

## 🚀 次のステップ

1. ✅ Clerk認証の設定
2. 🔄 ユーザープロフィールページの作成
3. 🔄 データベースとの連携（Supabase + Clerk）
4. 🔄 保護されたAPIルートの実装
5. 🔄 ロールベースのアクセス制御

## 📚 参考リンク

- [Clerk Documentation](https://clerk.com/docs)
- [Next.js App Router Quickstart](https://clerk.com/docs/quickstarts/nextjs)
- [Clerk Components](https://clerk.com/docs/components/overview)
- [Middleware Configuration](https://clerk.com/docs/references/nextjs/clerk-middleware)

## 🐛 トラブルシューティング

### 環境変数が読み込まれない

1. `.env.local` のキーが正しいか確認
2. 開発サーバーを再起動
3. ブラウザのキャッシュをクリア

### サインインモーダルが表示されない

1. Clerkダッシュボードでアプリケーションが有効か確認
2. Publishable Keyが正しいか確認
3. ブラウザのコンソールでエラーを確認

### ミドルウェアエラー

1. `middleware.ts` が `src/` ディレクトリ内にあることを確認
2. `clerkMiddleware()` を使用していることを確認（`authMiddleware`は非推奨）
