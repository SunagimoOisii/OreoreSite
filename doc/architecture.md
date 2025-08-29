# OreoreSite アーキテクチャ概要

このドキュメントは、現在のファイル構成・依存関係・起動フロー・各レイヤの責務と Feature 契約（方針）をまとめたものです。GitHub Pages 上でのビルドレス配信（CDN importmap）を前提にしています。

## 目的と基本方針
- 表示ロジックとデータ、基盤と機能を明確に分離して保守性を高める
- 依存の方向を一方向に保つ（循環を避ける）
- 将来、Vite 等のビルドへ移行してもパス置換だけで乗り換えられる

## ディレクトリ構成（抜粋）

```
index.html                     # ルート直下（GH Pages 要件）
src/
  core/                        # 基盤（DOM非依存・機能中立）
    config.js                  # 表示/挙動の設定値
    controls.js                # three の操作ラッパ
    loop.js                    # 固定ステップのメインループ
    renderer.js                # WebGLRenderer 生成/リサイズ
    scene.js                   # シーン/カメラの土台のみ（createSceneBase）
  effects/                     # 見た目の表現（シェーダ/ポストプロセス等）
    materials.js
    postprocess.js
    psx-jitter.js
  features/                    # 機能（DOM連携も含む）
    boot/
      overlay.js               # ブート演出の初期化
      boot.css                 # ブート演出のスタイル
    background/
      physics.js               # 背景の簡易物理（InstancedMesh 用）
    avatar/
      mesh.js                  # メッシュ生成/形状切替
      explode.js               # 爆散の生成/復元/更新
      update.js                # 回転/PSXジッター/爆散委譲
    works/
      data.json                # 作品データ（言語→カテゴリ→配列）
      loader.js                # JSON ローダ（fetch + キャッシュ）
    about/
      about.css
  entry/                       # ページの起動スクリプト
    avatar.js                  # Avatar の初期化/配線のみ
    background.js
    works-gallery.js
    title-tricks.js
    easter-egg.js
  styles/
    global/
      base.css                 # :root トークン/リセット等
      layout.css               # サイト横断のレイアウト
img/                           # 画像（将来 public/assets/ へ移行予定）
doc/
  architecture.md              # 本ファイル
```

## レイヤの責務と依存ポリシー

- core: three/WebGL の基盤。DOM非依存・機能名を含めない。小さく安定させる。
  - 例: `renderer.js`, `loop.js`, `scene.js`
- effects: 見た目の表現。シェーダ、ポストプロセス、量子化ジッター等。
  - 例: `effects/materials.js`, `effects/postprocess.js`, `effects/psx-jitter.js`
- features: 機能固有の状態や DOM 連携。スタイルやデータも隣接配置。
  - 例: `features/boot/*`, `features/avatar/*`, `features/works/*`

依存の方向（厳守）:

```
features ──▶ core
        └──▶ effects (必要に応じて)
effects  ──▶ core（型・three参照のみ）
core     ──▶（他レイヤへ依存しない）
```

## 主要依存と読込方法
- three.js: CDN importmap で固定バージョンを読み込み
- three-subdivide: Avatar 爆散の細分化で使用
- ブラウザ標準 API: Web Animations（ブート演出のフェード等）

> 依存はすべて ESM モジュールとして `index.html` の importmap を通じて読み込み。

## 起動フロー（トップページ）
1. `index.html` が読み込まれる
2. CSS: global と feature のスタイルを `<link>` で適用
3. JS: エントリモジュールを `<script type="module">` で順に実行
   - `entry/avatar.js`
     - `createSceneBase` で土台作成 → `createAvatarMesh` をシーンに追加
     - `createAvatarExplosion` と `createAvatarUpdater` で更新/演出を配線
     - リサイズ/ブート演出の初期化
   - `entry/background.js`
     - 背景レンダリングと `BackgroundPhysics` の更新
   - `entry/works-gallery.js`
     - `loadWorks()` で JSON を fetch → `getList()` で描画

## Feature 契約（方針）

機能モジュールは、以下のいずれかの形で他所に依存されます。

- 初期化関数（例）
  - `init(container|deps): { dispose(): void }`
  - 例: `features/boot/overlay.js` の `initBootOverlay()` は副作用型の初期化を提供
- ファクトリ関数（現実装）
  - `createAvatarMesh(THREE,cfg) -> { mesh, baseSize, texture }`
  - `createAvatarExplosion(THREE, scene, mesh, baseSize) -> { explode, restore, tick, isExploded }`
  - `createAvatarUpdater(THREE, camera, mesh, cfg, explosion) -> { update, setRotating }`
  - `BackgroundPhysics`（クラス）: `step(dt)`, `sync()` を提供
  - `works/loader.js`: `loadWorks()`, `getList(lang, category)`

推奨ルール:
- 入口（エントリ）から機能へ依存し、機能間はなるべく直接依存しない
- 機能の公開 API は最小限にし、内部状態は隠蔽
- DOM セレクタや CSS は機能のルート要素内にスコープする

## データと国際化

- 作品データは `features/works/data.json` に分離
  - 形: `lang -> category -> Item[]`
  - 取得: `loadWorks()` で 1 回 fetch（メモ化）。`getList()` が UI からの安定 API
- 将来の拡張
  - 言語別 JSON（`data.ja.json` / `data.en.json`）に分割し、言語だけ fetch
  - JSON Schema で簡易バリデーションを追加

## スタイル指針

- グローバル: `styles/global/*` にサイト横断スタイル
- 機能別: `features/<name>/*.css` に機能専用スタイル（接頭辞 `.boot-`, `.works-`, `.avatar-` 等）
- 変数: `:root` に色/余白等のトークンを定義し、横断利用
- アニメ抑制: `@media (prefers-reduced-motion: reduce)` で重い演出に代替を用意

## ビルド/配信

- 現状: ビルドレス構成、CDN importmap、`index.html` はリポジトリのルート（GitHub Pages 要件）
- 将来: Vite 等に移行しても、レイヤ分離により移行コストが低い（エントリ/パスの集約済み）

## 今後の改善候補

- Feature の init/dispose 契約へ段階移行（今はファクトリ中心）
- 画像パスの `public/assets/img/` への移行と参照の一本化
- ESLint（flat config）/EditorConfig を導入（コード規約の明確化）
- 軽量 i18n（`i18n/ja.json`/`en.json`）の導入

## プログラム関係図（Mermaid）

下図は主要モジュール間の依存関係を示します。矢印は「利用する（import する）」を意味します。

```mermaid
flowchart TD
  %% レイヤ
  subgraph Entry
    EA[entry/avatar.js]
    EB[entry/background.js]
    EW[entry/works-gallery.js]
    ET[entry/title-tricks.js]
    EE[entry/easter-egg.js]
  end

  subgraph Core
    CScene[core/scene.js\n(createSceneBase)]
    CRenderer[core/renderer.js]
    CLoop[core/loop.js]
    CControls[core/controls.js]
    CConfig[core/config.js]
  end

  subgraph Effects
    EMat[effects/materials.js]
    EPost[effects/postprocess.js]
    EJit[effects/psx-jitter.js]
  end

  subgraph Features
    FAvMesh[features/avatar/mesh.js]
    FAvExplode[features/avatar/explode.js]
    FAvUpdate[features/avatar/update.js]
    FBoot[features/boot/overlay.js]
    FBg[features/background/physics.js]
    FWorksLdr[features/works/loader.js]
  end

  subgraph Styles
    SBase[styles/global/base.css]
    SLayout[styles/global/layout.css]
    SBoot[features/boot/boot.css]
    SWorks[features/works/works.css]
    SAbout[features/about/about.css]
  end

  subgraph Data
    DWorks[features/works/data.json]
  end

  %% Entry -> 使用先
  EA --> CScene
  EA --> CRenderer
  EA --> CControls
  EA --> CLoop
  EA --> EPost
  EA --> FAvMesh
  EA --> FAvExplode
  EA --> FAvUpdate
  EA --> FBoot

  EB --> CRenderer
  EB --> CLoop
  EB --> FBg

  EW --> FWorksLdr

  ET --> SBase
  EE --> SBase

  %% Features -> Effects/Core
  FAvMesh --> EMat
  FAvUpdate --> EJit
  FAvExplode --> CScene
  FBoot --> SBoot
  FBg --> CScene
  FWorksLdr --> DWorks

  %% Effects -> Core（表現は three/Core を前提）
  EMat --> CConfig
  EPost --> CRenderer
  EJit --> CConfig
```

補足:
- Entry はページの配線のみを担い、Features/Efffects/Core を初期化順に呼び出します。
- Features は見た目（Effects）や基盤（Core）へ依存しますが、逆方向はありません。
- Data は Features のローダが取得します（UI からはローダの安定 API のみを使用）。

