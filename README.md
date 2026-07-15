# YouTube Music Player

YouTube Data API を利用した音楽プレイヤーです。Google アカウントでログインし、自分の YouTube プレイリストの曲を検索・追加・再生できます。

機能の詳細は [機能仕様書](./docs/機能仕様書.md) を参照してください。

## 技術スタック

- Next.js 16 (App Router) / React 19 / TypeScript
- Auth.js (NextAuth v5) + Google OAuth
- Tailwind CSS 4 / Class Variance Authority (CVA)
- YouTube Data API v3 / YouTube IFrame Player API

## セットアップ

### 環境変数

`.env.local` に以下を設定してください。

```bash
AUTH_SECRET=                  # `npx auth secret` などで生成
AUTH_GOOGLE_CLIENT_ID=        # Google Cloud Console で発行
AUTH_GOOGLE_CLIENT_SECRET=    # Google Cloud Console で発行
```

Google Cloud Console の OAuth クライアントには、認可済みリダイレクト URI として `http://localhost:3000/api/auth/callback/google`（本番環境では `https://<ドメイン>/api/auth/callback/google`）を登録してください。また、YouTube Data API v3 を有効化する必要があります。

### 開発サーバーの起動

```bash
bun install
bun dev
```

[http://localhost:3000](http://localhost:3000) で確認できます。

### その他のコマンド

```bash
bun run build   # 本番ビルド
bun run start   # 本番ビルドの起動
bun run lint    # ESLint
```

## ドキュメント

- [機能仕様書](./docs/機能仕様書.md)
- [コーディング規約 (CLAUDE.md)](./CLAUDE.md)
