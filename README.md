# Music Player

## 概要

音楽配信サービスの API を利用した音楽プレイヤーです。Google アカウントでログインし、自分のプレイリストの曲を検索・追加・再生できます。

外部サービスとの連携は adapter 層（`src/service`）を介して行っており、現在は YouTube を利用する実装（`src/service/vendors/youtube`）が有効になっています。他のサービスに差し替える場合は、同じ構成で vendor を追加してください（詳細は [アダプタ実装ガイド](./docs/アダプタ実装ガイド.md) を参照）。

機能の詳細は [機能仕様書](./docs/機能仕様書.md) を参照してください。

## iframe での埋め込み

他の Web サービスの画面に iframe で埋め込むこともでき、埋め込み元でログイン済みであれば、iframe 内で改めて Google ログインしなくても再生できます（詳細は [埋め込み表示](#埋め込み表示) を参照）。

## 技術スタック

- Next.js 16 (App Router) / React 19 / TypeScript
- Auth.js (NextAuth v5) + Google OAuth
- Tailwind CSS 4 / Class Variance Authority (CVA)
- YouTube Data API v3 / YouTube IFrame Player API（現在有効な vendor）

## セットアップ

### 環境変数

`.env.local` に以下を設定してください。

```bash
AUTH_SECRET=                  # `npx auth secret` などで生成
AUTH_GOOGLE_ID=               # Google Cloud Console で発行
AUTH_GOOGLE_SECRET=           # Google Cloud Console で発行
EMBED_SECRET=                 # 埋め込み表示用の共有鍵。埋め込み元がチケットの暗号化に使う値と同じにします
```

Google Cloud Console の OAuth クライアントには、認可済みリダイレクト URI として `http://localhost:3000/api/auth/callback/google`（本番環境では `https://<ドメイン>/api/auth/callback/google`）を登録してください。また、YouTube Data API v3 を有効化する必要があります。

### 埋め込み表示

`/embed?ticket=<チケット>` を開くと、Google ログインなしで iframe 内に表示できます。チケットは埋め込み元が `EMBED_SECRET` で暗号化した Google の refresh token とユーザー情報（有効期限 5 分）で、受け取ると暗号化したまま `SameSite=None; Partitioned` の Cookie に保存します。Cookie の有効期限は 30 日で、`proxy.ts` がアクセスのたびに延長します。埋め込み元は同じ OAuth クライアントで YouTube のスコープを許可済みである必要があります。

埋め込み元では以下を用意してください。

1. `EMBED_SECRET` と同じ共有鍵（`openssl rand -base64 32` などで生成し、両方の環境変数に同じ値を設定します）
2. 共有鍵の SHA-256 ハッシュを鍵とし、`{ refreshToken, user: { name, email, avatarUrl } }` を `jose` の `EncryptJWT`（`alg: "dir"`・`enc: "A256GCM"`、有効期限 5 分）で暗号化したチケット
3. チケットを付けた URL を `src` に指定した iframe

```html
<iframe
  src="https://<このアプリのドメイン>/embed?ticket=<チケット>"
  title="ミュージックプレーヤー"
  allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
></iframe>
```

`color` パラメータに Tailwind のカラー名（例: `pink`・`sky`）を付けると、背景・文字の色を変更できます。濃さは指定せず、背景・文字のグレー（既定は `zinc`）が指定した色の同じ段階に置き換わります。アクセントカラー（`purple-500`）は変わりません。指定がない場合や該当するカラーがない場合は、既定の色（`zinc`）で表示します。

`theme` パラメータに `light` を付けるとライトモードで表示します（`dark` または指定なしの場合はダークモード）。`color` と組み合わせることもできます（例: `?ticket=<チケット>&color=pink&theme=light`）。

```html
<iframe
  src="https://<このアプリのドメイン>/embed?ticket=<チケット>&color=pink"
  title="ミュージックプレーヤー"
  allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
></iframe>
```

共有鍵を変えると既存の埋め込み用 Cookie は無効になりますが、埋め込み元が新しいチケットで iframe を開き直せば表示が戻ります。

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
- [アダプタ実装ガイド](./docs/アダプタ実装ガイド.md)
- [コーディング規約 (CLAUDE.md)](./CLAUDE.md)
