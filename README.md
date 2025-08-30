# SUNAGIMO HOUSE (OreoreSite)

> 更新印（メンテ強化）
> - core: `setupResize` がクリーンアップ関数を返すように変更し、`app.dispose()` で確実に解除（リーク防止）
> - utils: `retriggerClass()` 追加。`avatar.entry.js` と `works-gallery.entry.js` のCSS再トリガを共通化
> - background: `controller.js` にローカルFPSステッパ導入（POLY/GRID/INNERの更新を簡潔化）
> - works: ローダのフォールバックを定数化（`EMPTY_WORKS/EMPTY_LANG`）し重複排除
> - works: Carouselユーティリティを機能内に切り出し（クラス回転・初期配置の重複を排除）
> - background: 生成/更新/破棄の内部関数化で関心分離（`createGrid/update*/dispose`）

### 今回のメリット
- ライフサイクル安全性: リサイズリスナーの解除で多重登録・メモリリークを予防
- 重複削減: 同型のCSS再トリガ/フォールバック定義の一本化で変更点が明確に
- 可読性向上: FPSステッパ導入により更新ループの意図が明瞭、バグ混入余地を減少
- 将来拡張に強い: 設定の一元化・小粒度ユーティリティで段階的な機能追加が容易
 - UI保守性: Carouselの初期化/回転がユーティリティ化され、DOMやCSS変更に追従しやすい
 - ライフサイクルの明確化: 背景の生成/更新/破棄が分離され、停止時の後始末が確実

three.js を使ったフロントエンドのデモ兼ポートフォリオサイトです。開発はビルドレス（Import Maps）で動作し、エイリアスでパスを短縮しています。

## 特徴
- Import Maps でのビルドレス運用（`<script type="module">`）
- レイヤ分離（core / effects / features / entry）
- JSON データ（works）を fetch で読込
- CSS は Global と Feature で分割
- three 共通ブート `src/core/app.js` で起動・ループ・リサイズ等を提供
- エントリ命名の統一（`*.entry.js`）とバレル化（`features/*/index.js`, `effects/index.js`）

## 動かし方（ローカル）
- ルートの `index.html` にブラウザアクセス
- ローカルサーバが必要（`file://` では JSON fetch に失敗する場合あり）
  - Python: `python -m http.server -b 127.0.0.1 8080`
  - Node: `npx serve .`
  - VS Code: Live Server

## 依存
- three.js（Import Maps で CDN から読込）
- three-subdivide（アバター爆発の細分化処理）

## Import Maps（抜粋）
`index.html` に以下を定義しています。
```
{
  "imports": {
    "three": "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js",
    "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/",
    "three-subdivide":"https://cdn.jsdelivr.net/npm/three-subdivide@1.1.5/build/index.module.js",
    "@core/": "/src/core/",
    "@features/": "/src/features/",
    "@effects/": "/src/effects/",
    "@config/": "/src/config/"
  }
}
```

## ディレクトリ構成（抜粋）
```
index.html                  # ルートページ
src/
  config/                   # 設定
    graphics.js            # グラフィクス系設定
  core/                     # three 共通（DOMに非依存のロジック）
    app.js                 # 起動/メインループ等
    controls.js            # OrbitControls 薄ラッパ
    loop.js                # 固定ステップ/メインループ
    renderer.js            # WebGLRenderer 作成/サイズ調整
    scene.js               # Scene/Camera 雛形
  effects/                  # マテリアル/ポストプロセス等
    materials.js
    postprocess.js
    psx-jitter.js
    index.js               # バレル
  features/                 # 機能（DOM・データも含む）
    avatar/
      mesh.js
      update.js
      explode.js
      index.js             # バレル
    background/
      controller.js
      physics.js
      index.js             # バレル
    works/
      loader.js
      data.json
      index.js             # バレル
    boot/overlay.js
  entry/                    # ページ起点
    avatar.entry.js
    background.entry.js
    works-gallery.entry.js
    title-tricks.entry.js
    easter-egg.entry.js
styles/global/              # サイト全体のスタイル
img/                        # 画像
doc/architecture.md         # アーキテクチャ
```

## レイヤ間の依存方針
```
entry     -> features -> core/effects
effects   -> core
core      -> 依存なし（外部 three を除く）
```

## 最近の変更
- エントリを `*.entry.js` に統一し、`index.html` の読み込み先を更新
- `src/config/graphics.js` を追加して設定を分離
- `features/*/index.js`, `effects/index.js` を追加（バレル化）
- Import Maps に `@core/`, `@features/`, `@effects/`, `@config/` を追加

## Lint/Editor 設定
- EditorConfig: `.editorconfig`（改行/インデント/末尾改行など）
- ESLint(flat): `eslint.config.mjs`（必要に応じて有効化）

## ライセンス
- ライセンス表記は `LICENSE` を参照。`license.html` はスタイル調整済みの説明ページです。

## アーキテクチャ（責務の分離）
- エントリ（`src/entry/*.entry.js`）: ページ起動・DOM結線のみ。機能APIを呼ぶ。
- 機能（`src/features/*`）: UI/threeロジック本体。`index.js`/`controller.js` から公開。
- 土台（`src/core/*`）: three 初期化・ループ・リサイズ・操作。
- 効果（`src/effects/*`）: ポストプロセス・マテリアル等。

## Import Maps の使い方（例）
`index.html` の `<script type="importmap">` に以下を記述:
```
{
  "imports": {
    "three": "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js",
    "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/",
    "@core/": "/src/core/",
    "@features/": "/src/features/",
    "@effects/": "/src/effects/",
    "@config/": "/src/config/"
  }
}
```
