# アーキテクチャ（現状）

three.js を用いた小規模サイト。ページごとに「エントリ（起点）」を置き、機能は `features/*` で提供、コアは `core/*` にまとめる。エフェクトは `effects/*`、スタイルは `styles/*` に配置。

本リポジトリは以下を導入済みです。
- エントリ命名の統一: `*.entry.js`
- バレル化: `features/*/index.js`, `effects/index.js`
- 設定の分離: `src/config/graphics.js`
- Import Maps によるエイリアス: `@core/`, `@features/`, `@effects/`, `@config/`

## 現状の構成（概要）

- `src/core/`: three.js 共通（`app.js`, `renderer.js`, `scene.js`, `loop.js`, `controls.js`）
- `src/effects/`: ポストプロセス・マテリアル等（`postprocess.js`, `materials.js`, `psx-jitter.js`, `index.js`）
- `src/features/`: 機能（`avatar/*`, `background/*`, `boot/overlay.js`, `works/*` など）
- `src/entry/`: ページ起点（`*.entry.js`）
- `src/config/`: 設定（`graphics.js`）
- `src/styles/`: CSS

## 命名と依存の方針

- エントリ: `*.entry.js`（例: `background.entry.js`, `avatar.entry.js`）
- バレル化: 機能の公開面は `index.js` に集約（外部はそれのみを import）
- 依存方向: `entry -> features -> core/effects`
- 設定: `@config/graphics.js` を参照

## 公開 API の考え方

- UI から呼ぶ副作用系（例: 背景の個数変更、モード切替）は `features/<feature>/index.js` または `controller.js` の公開関数に限定
- エントリから実装詳細（個別ファイル）を直接 import しない

## Import Maps（エイリアス）

`index.html` に Import Map を定義済み。

```
"imports": {
  "@core/": "/src/core/",
  "@features/": "/src/features/",
  "@effects/": "/src/effects/",
  "@config/": "/src/config/"
}
```

## ディレクトリ例（現状）

```
src/
  config/
    graphics.js
  core/
    app.js
    renderer.js
    loop.js
    scene.js
    controls.js
  effects/
    postprocess.js
    materials.js
    psx-jitter.js
    index.js
  features/
    background/
      controller.js
      physics.js
      index.js
    avatar/
      mesh.js
      update.js
      explode.js
      index.js
    boot/overlay.js
    works/
      loader.js
      data.json
      index.js
  entry/
    background.entry.js
    avatar.entry.js
    works-gallery.entry.js
    title-tricks.entry.js
    easter-egg.entry.js
```

## 将来の選択肢

- ロケール分割（例: `works/data.ja.json`, `works/data.en.json`）
- Vite 導入（`resolve.alias` でのエイリアス、最適化ビルド）
