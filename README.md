# ポーカーコイン管理システム

リアルタイムで6人までポーカーのコイン処理ができるWebアプリケーション

## 🎮 機能

- **ルーム管理**: 6桁のコードでゲームルームを作成・参加
- **リアルタイム同期**: Supabase Realtimeで全プレイヤーの状態を同期
- **コイン処理**: ベット、レイズ、コール、フォールド、チェック、オールイン
- **ラウンド管理**: ポット配分と新ラウンドの自動準備
- **認証不要**: ニックネーム入力のみで参加可能

## 🚀 セットアップ手順

### 1. 依存関係のインストール

```bash
npm install
```

### 2. Supabaseプロジェクトの設定

1. [Supabase](https://supabase.com)でプロジェクトを作成
2. SQL Editorで `database/poker/schema.sql` を実行してテーブルを作成
3. プロジェクトのURLとAnon Keyを取得

### 3. 環境変数の設定

`.env.local` ファイルを作成し、以下を設定:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで `http://localhost:3000` を開く

## 📱 使い方

### ゲームの開始

1. **ルーム作成**: ホーム画面で「ルームを作成」をクリック
2. **ルームコード共有**: 生成された6桁のコードを他のプレイヤーに共有
3. **参加**: 他のプレイヤーはルームコードとニックネームを入力して参加

### ゲームプレイ

1. **アクション実行**: 自分のターンでベット、チェック、フォールド、オールインを選択
2. **ラウンド終了**: 全員がアクションを完了したら、勝者を選択してポット配分
3. **次のラウンド**: 自動的に新しいラウンドが開始

## 🏗️ 技術スタック

- **フロントエンド**: Next.js 16 + React 19 + TypeScript
- **スタイリング**: Tailwind CSS
- **データベース**: Supabase (PostgreSQL)
- **リアルタイム**: Supabase Realtime

## 📂 プロジェクト構造

```
src/
├── app/
│   ├── api/
│   │   ├── rooms/
│   │   │   ├── create/route.ts    # ルーム作成API
│   │   │   └── join/route.ts      # ルーム参加API
│   │   ├── actions/
│   │   │   ├── bet/route.ts       # ベットAPI
│   │   │   ├── fold/route.ts      # フォールドAPI
│   │   │   └── check/route.ts     # チェックAPI
│   │   └── rounds/
│   │       └── distribute/route.ts # ポット配分API
│   ├── room/[roomCode]/page.tsx   # ゲームルームページ
│   ├── layout.tsx                  # ルートレイアウト
│   └── page.tsx                    # ホームページ
├── components/
│   └── poker/
│       ├── PlayerCard.tsx          # プレイヤーカード
│       ├── ActionPanel.tsx         # アクションパネル
│       └── PotDisplay.tsx          # ポット表示
└── lib/
    ├── types/poker.ts              # 型定義
    └── supabase/poker.ts           # Supabaseヘルパー関数
```

## 🎯 ゲームルール

- **初期チップ**: 各プレイヤー1000チップ
- **最大人数**: 6人
- **アクション**: ベット、レイズ、コール、フォールド、チェック、オールイン
- **ポット**: 全てのベットが集まる
- **勝者**: ラウンド終了時に手動で選択してポット配分

## 🔧 トラブルシューティング

### リアルタイム同期が動作しない

1. Supabaseプロジェクトでリアルタイム機能が有効か確認
2. `database/poker/schema.sql`の最後の部分が実行されているか確認
3. ブラウザのコンソールでエラーを確認

### プレイヤーが参加できない

1. ルームコードが正しいか確認
2. ルームが満員（6人）でないか確認
3. ネットワーク接続を確認

## 📝 ライセンス

MIT
