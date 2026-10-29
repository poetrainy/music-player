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
ABLY_API_KEY=                 # リモート再生用。Ably のダッシュボードで発行した API キー
DISCORD_PUBLIC_KEY=           # Discord からの操作用。Discord のアプリの Public Key
DISCORD_ALLOWED_USER_IDS=     # Discord から操作できるユーザーの ID（カンマ区切り）
DISCORD_PLAYBACK_EMAIL=       # Discord から操作する再生先を開いている Google アカウントのメールアドレス
DISCORD_PLAYBACK_REFRESH_TOKEN= # Discord からの操作でプレイリストを取得する Google アカウントの refresh token
DISCORD_PLAYBACK_DEVICE_ID=   # Discord から操作する再生先のデバイスの ID（例: room）
```

Google Cloud Console の OAuth クライアントには、認可済みリダイレクト URI として `http://localhost:3999/api/auth/callback/google`（本番環境では `https://<ドメイン>/api/auth/callback/google`）を登録してください。また、YouTube Data API v3 を有効化する必要があります。

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

以下のパラメータに Tailwind のカラー名（例: `pink`・`sky`）を付けると、色を変更できます。濃さは指定しません。指定がない場合や該当するカラーがない場合は、既定の色で表示します。

| パラメータ | 変更対象         | 既定     | 置き換わり方                                                       |
| ---------- | ---------------- | -------- | ------------------------------------------------------------------ |
| `base`     | 背景・文字       | `zinc`   | アプリ内で使っている各段階が、指定した色の同じ段階に置き換わります |
| `brand`    | アクセントカラー | `purple` | 指定した色の `500` に置き換わります                                |

`theme` パラメータに `light` を付けるとライトモードで表示します（`dark` または指定なしの場合はダークモード）。`base`・`brand` と組み合わせることもできます（例: `?ticket=<チケット>&base=stone&brand=pink&theme=light`）。

```html
<iframe
  src="https://<このアプリのドメイン>/embed?ticket=<チケット>&base=stone&brand=pink"
  title="ミュージックプレーヤー"
  allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
></iframe>
```

共有鍵を変えると既存の埋め込み用 Cookie は無効になりますが、埋め込み元が新しいチケットで iframe を開き直せば表示が戻ります。

埋め込み表示は、操作 UI のないプレーヤー画面（`/player`）を開きます。`device`・`base`・`brand` は Cookie に保存せず、`/player` のクエリとして引き継ぎます（`theme` のみ Cookie に保存します）。`device` がない、または登録されていないデバイスの場合、`/player` は何も表示しません。サイト本体から直接 `/player` を開いた場合も同様です。

プレーヤー画面は再生状態を保存・復元しないため、サイト本体の再生とは独立しています。カードを押すと、新しいタブで `/?device=<id>` を開き、再生先がそのデバイスになったサイト本体の画面から曲を選べます。

### リモート再生

`device` パラメータに `src/features/remote-playback/devices.json` の `id`（例: `room`）を付けて埋め込むと、その埋め込み表示が再生先のデバイスになります（例: `?ticket=<チケット>&device=room`）。再生先になるのは埋め込みのプレーヤー画面だけで、サイト本体の画面は iframe 内で開かれても再生先になりません。スマートフォンなど通常の画面では、ヘッダーの再生先ボタンからデバイスを選ぶと、再生・一時停止・曲送り・シーク・音量・シャッフル・リピートの操作がそのデバイスに送られ、画面にはそのデバイスで再生中の曲が表示されます。再生中にデバイスを切り替えると、手元の再生を止めて同じ位置から再生先に引き継ぎます。

- 命令は Ably でリアルタイムに届けます。オフラインのデバイス宛ての命令は保存せず、破棄されます
- 操作できない端末で再生するため、Chromium などのブラウザは `--autoplay-policy=no-user-gesture-required` を付けて起動してください。付けない場合、一度も操作していないページでは音の出る再生をブラウザが止めます

### Discord からの操作

Discord で `/p` を実行すると、プレイリストがボタンで表示され、押したプレイリストを[リモート再生](#リモート再生)のデバイスで再生します。再生を始めるとメッセージが操作パネル（🔁 ◀️ ⏺️/⏹️ ▶️ 🔀）に変わり、リピート・前の曲・再生/一時停止・次の曲・シャッフルを操作できます。詳細は [機能仕様書](./docs/機能仕様書.md#discord-からの操作) を参照してください。

1. [Discord Developer Portal](https://discord.com/developers/applications) でアプリを作り、「General Information」の Application ID と Public Key を控えます。Public Key を `DISCORD_PUBLIC_KEY` に設定します
2. 「Bot」で Bot のトークンを発行し、次のコマンドで `/p` を登録します（トークンは登録にだけ使い、環境変数には設定しません）

   ```bash
   curl -X PUT \
     -H "Authorization: Bot <Bot のトークン>" \
     -H "Content-Type: application/json" \
     -d '[{"name":"p","description":"プレイリストを再生する","type":1}]' \
     https://discord.com/api/v10/applications/<Application ID>/commands
   ```

3. 「Installation」の Guild Install で、スコープに `applications.commands` を選んだインストール用のリンクから、使うサーバーにアプリを追加します
4. 操作を許可する人の Discord のユーザー ID（Discord の設定で開発者モードを有効にし、ユーザーを右クリックして「ユーザー ID をコピー」）を `DISCORD_ALLOWED_USER_IDS` に設定します
5. [OAuth 2.0 Playground](https://developers.google.com/oauthplayground) で、このアプリと同じ OAuth クライアント（`AUTH_GOOGLE_ID`・`AUTH_GOOGLE_SECRET`）を使い、スコープ `https://www.googleapis.com/auth/youtube.readonly` の refresh token を発行して `DISCORD_PLAYBACK_REFRESH_TOKEN` に設定します（OAuth クライアントの承認済みのリダイレクト URI に `https://developers.google.com/oauthplayground` を追加し、OAuth 同意画面はテストモードだと 7 日で失効するため本番環境にします）
6. 再生先のデバイスを開いている Google アカウントのメールアドレスを `DISCORD_PLAYBACK_EMAIL`、デバイスの ID を `DISCORD_PLAYBACK_DEVICE_ID` に設定してデプロイします
7. 「General Information」の Interactions Endpoint URL に `https://<このアプリのドメイン>/api/discord/interactions` を設定して保存します（保存時に Discord が受け口を確認します）

### 開発サーバーの起動

```bash
bun install
bun dev
```

[http://localhost:3999](http://localhost:3999) で確認できます。

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
