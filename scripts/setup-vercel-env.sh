#!/bin/bash

# Vercel環境変数設定スクリプト
# .env.localの値をVercelに設定します

echo "🚀 Vercel環境変数を設定中..."

# .env.localから環境変数を読み込み
if [ ! -f .env.local ]; then
    echo "❌ .env.localファイルが見つかりません"
    exit 1
fi

# 環境変数を設定（production, preview, developmentすべてに適用）
set_env_var() {
    local key=$1
    local value=$2
    
    echo "Setting $key..."
    
    # Production
    echo "$value" | vercel env add "$key" production --force
    
    # Preview
    echo "$value" | vercel env add "$key" preview --force
    
    # Development
    echo "$value" | vercel env add "$key" development --force
}

# .env.localから値を抽出して設定
while IFS='=' read -r key value; do
    # コメント行と空行をスキップ
    [[ "$key" =~ ^#.*$ ]] && continue
    [[ -z "$key" ]] && continue
    
    # 前後の空白を削除
    key=$(echo "$key" | xargs)
    value=$(echo "$value" | xargs)
    
    # 環境変数を設定
    if [[ -n "$key" && -n "$value" ]]; then
        set_env_var "$key" "$value"
    fi
done < .env.local

echo "✅ 環境変数の設定が完了しました！"
echo "📦 変更を反映するには、Vercelに再デプロイしてください："
echo "   git push origin main"
