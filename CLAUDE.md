# AGENTS.md

## セットアップ

### 技術スタック

- React
- Next.js App Router
- TypeScript
- Tailwind CSS
- Class Variance Authority (CVA)
- ESLint
- eslint-config-next
- eslint-plugin-unused-imports
- Prettier
- prettier-plugin-tailwindcss
- @trivago/prettier-plugin-sort-imports
- Lucide Icons

## フォーマットルール

- import を自動で並び替えること
- import の順序は以下とする
  1. Next.js / React
  2. サードパーティライブラリ
  3. プロジェクト内モジュール (`@/` など)
- 各グループ内はアルファベット順に並べること
- import 文の間に空行を入れないこと
- import は相対パス (`../`, `./`) ではなく絶対パス (`@/`) を使用すること
- import・className の並び順は Prettier の設定に従うこと
- ファイル末尾に改行 (EOF) を付与すること

---

## ディレクトリ構成

`src` 直下は「汎用（アプリケーション全体で利用する）機能」を扱う 1 つの feature とみなし、`src/features/**` と同じ構成を取る。`src/features/**` に適用されるルールは、`src` 直下にもそのまま適用される。

```text
src/
├── components/
│   └── Layout/
├── features/
│   ├── feature-a/
│   │   ├── components/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── providers/
│   │   ├── api.ts
│   │   ├── entity.ts
│   │   ├── hook.ts
│   │   └── library.ts
│   └── ...
├── layouts/
├── mocks/
├── providers/
├── tests/
├── api.ts
├── entity.ts
├── hook.ts
└── library.ts
```

- `api`：API クライアント・通信処理
- `components`：UI コンポーネント
- `entity.ts`：型・モデル・ドメインオブジェクト
- `hook.ts`：Hook
- `layouts`：複数ページ・複数コンポーネント間で共有するレイアウト用コンポーネント
- `library.ts`：ユーティリティ
- `mocks`：モックデータ・モック API 実装（`src/features` 直下には存在しない）
- `pages`：feature 固有の表示コンポーネント（`src` 直下には存在しない）
- `providers`：React Context の Provider コンポーネント
- `tests`：テストコード。テスト対象のファイルと同じディレクトリ構成を取る（`src/features` 直下には存在しない）

Header・Footer・Navigation など、ページ全体の構造を担うコンポーネントは `components/Layout` に配置すること。

単一ファイルで足りるうちはファイル名称に単数形（`entity.ts`・`hook.ts`・`library.ts` など）を用い、内容が増えて分割が必要になったら名称を複数形にしてディレクトリ化する（`entities/`・`hooks/`・`libraries/`）。

`components`・`layouts`・`pages`・`providers` はこの単数形→複数形化のルールの対象外とし、カテゴリ用のフォルダ（`components/`・`layouts/`・`pages/`・`providers/`）自体を最初からディレクトリとする。これは「命名規則」内の各ファイルへの命名ルール（例: `src/features/**/components` 内は `**` を Prefix にする等）が、複数ファイルが存在すること前提のルールであり、単一ファイルから始まる想定と噛み合わないため。

その他、`src` 直下には上記ルールに倣ったファイル・ディレクトリが置かれる。

---

## コーディングルール

### 関数

- コンポーネントは Function Declaration を使用すること（Arrow Function や Function Expression は使用しないこと）
- コンポーネント以外は Arrow Function を使用すること

### TypeScript

- オブジェクト型の定義には `interface` を使用すること
- Union 型・Utility Type が必要な場合のみ `type` を使用すること
- 文字列リテラルの Union 型は、`as const` を付けた配列から `(typeof ARRAY)[number]` で導出すること（配列と型の二重管理を避け、値の一覧を実行時にも利用できるようにするため）

```ts
// NG
export type CourseStatus = "public" | "archived";

// OK
export const COURSE_STATUSES = ["public", "archived"] as const;
export type CourseStatus = (typeof COURSE_STATUSES)[number];
```

- `any` は使用しないこと
- 非 null アサーション演算子 (`!`) は使用しないこと
- 型アサーション (`as`) は原則禁止とし、型で解決できない場合のみ使用すること
- Early Return はブロックで記述すること
- TSX 内で `map()` を使用する場合、利用するプロパティがオブジェクトであればコールバック引数は分割代入すること。また、この分割代入は第一引数の定義時に行うこと
  - 但し、オブジェクトそのものを内部で用いることがある場合は分割代入しない

```ts
// NG
items.map((item) => item.name);

// NG
items.map((item) => {
  const { name } = item;

  return name;
});

// OK
items.map(({ name }) => name);
```

- TSX 内で条件分岐による描画を行う場合、条件が偽のときに何も描画しない（`null`）のであれば `&&` を使用すること。偽の場合にも別の要素を描画する場合のみ三項演算子を使用すること

```tsx
// NG
{condition ? <div /> : null}

// OK
{condition && <div />}
```

- 配列に要素があるかどうかを判定する場合は `!!{配列}.length`（要素がある）・`!{配列}.length`（要素がない）を使用し、`.length > 0` や `.length === 0` は使用しないこと

```ts
// NG
items.length > 0;
items.length === 0;

// OK
!!items.length;
!items.length;
```

### コンポーネント

- コンポーネントファイルは以下の順で記述すること
  1. Props
  2. Hooks
  3. Event Handler
  4. Utility（定数・計算・派生値など）
  5. return
  6. export していない internal なコンポーネント
- コンポーネントの interface はコンポーネントの直前に記述すること
- DOM に描画しない場合は `null` を返すこと (`<></>` は使用しない)

### Props

- Props には interface を使うこと
- Props の interface は export しないこと
- 他ファイルから利用する場合のみ export を許可し、その理由をコメントで記述すること
- コンポーネントが固有に export していて、且つ Private な Props の interface 名は `Props` とすること
- コンポーネント内で Private に使われている子コンポーネントの Props もしくは Public な Props の interface 名は `{コンポーネント名}Props` とすること
- Optional にしないこと。どうしても Optional にせざるを得ない場合はユーザーに確認を取ること
  - 但し、共通コンポーネント（`src/components` 配下など）は Optional を許容する

### Export

- `default export` は使用しないこと
- export は名前付き export を使用すること
- 条件によって返却する JSX のルート要素や構造が異なる場合は Early Return を使用すること

```tsx
// NG
function Component() {
  return bool ? <div /> : <span />;
}

// OK
function Component() {
  if (!bool) {
    return <span />;
  }

  return <div />;
}
```

### App Router

- `app` 配下はルーティング・データ取得のみを担い、表示は `src/features/**/pages` に記述すること
- `app` 配下のページコンポーネントのみ `default export` を使用すること
- `app` 配下のページコンポーネント名は `Page` とすること
- Parallel Routes のスロット（`app/(xx)/@xx/**/page.tsx`）のコンポーネント名は `{Xx}Slot` とすること
  - 例: `app/(admin)/@breadcrumb/**/page.tsx` → `BreadcrumbSlot`
- ログイン要否によるルートグループは `app/(main)`（ログイン後にアクセスする画面）と `app/(auth)`（サインイン等、未ログインでアクセスする画面）に分けること

### 命名規則

- `src/features/**/pages` のコンポーネント名は `**Component` とすること
- ファイル内で代表的に export するコンポーネント名は、ファイル名と一致していること
  - 例: `Course.tsx` → `CourseComponent`（`pages` 配下は上記の `**Component` ルールを優先）
- ファイル内で private に定義するコンポーネント（internal・非 export）も、そのファイル名を Prefix として付けること
  - 例: `AdminUser.tsx` 内の private コンポーネント → `AdminUserPin`
- `src/features/**/components` 内の関数（コンポーネント）名には `**` を Prefix として付けること
  - 但し、admin 専用のコンポーネントは `Admin` を先頭に付けてよい
  - 例: `src/features/office/components` → `OfficeForm`（通常）, `AdminOfficeList`（admin 専用）
- 登録系は `register`、更新系は `update`、削除系は `delete` に統一すること（API 関数に限らず、ページ・コンポーネント・URL パス・変数名すべてに適用する）
  - `post`/`patch` などの HTTP メソッド名や、`create`/`edit`/`add`/`new` などの類義語は使わない
  - 例: API 関数 `registerUser`, `updateUser`, `deleteOffice` / URL パス `/admin/users/register`, `/admin/users/:userId/update` / 変数名 `userUpdate`（NG: `userEdit`）
- ディレクトリ・ファイル・関数などの名称に略語を使用しないこと
  - NG: `libs`
  - OK: `libraries`
- CVA (`cva()`) を代入する変数名は `cva{コンポーネント名}{機能名}` とすること
  - 例: `cvaInput`, `cvaSearchIcon`

### レイアウト

- import と本文の間は 1 行空けること
- Hooks の定義と後続の処理の間は 1 行空けること
- Early Return と後続の処理の間は 1 行空けること
- return の前は 1 行空けること
- ファイル末尾には改行 (EOF) を付与すること

### スタイル

- サイズ指定は px ではなく rem、または Tailwind のスペーシング/サイズスケール（`w-10`・`h-6` など）を使用すること
- Tailwind のクラスで表現できない箇所（`next/image` の `sizes` 属性など）も、px ではなく rem で指定すること

### アクセシビリティ

- セマンティックな HTML を使用すること
- アクセシビリティは WCAG AA 基準を満たすこと（特に `aria-label` を適切に付与すること）

### その他

- SVG を独自に作成せず、Lucide Icons を使用すること
- 不要なコメントは追加しないこと
- この MD 内で指示した必要なコメントは、プレフィックスに `NOTE: ` をつけること
- 未使用の import は残さないこと
- 未使用の変数は作成しないこと
- 既存の命名規則に合わせること
- 既存のディレクトリ構成を変更しないこと
- 必要以上にリファクタリングしないこと
- 指示された範囲以外のコードは変更しないこと
- コンポーネントは単一責務を意識すること
- 汎用的な UI（ボタン・アイコンなど、特定の feature のドメインに依存しないもの）は `src/components` に配置すること
- 特定の feature のドメインに依存する UI は、複数の feature から利用される場合であっても `src/features/**/components` に配置すること
- API 通信は `api` に記述すること
- コンポーネント内で直接 fetch を実装しないこと
- 共通処理は Hook または library に切り出すこと
