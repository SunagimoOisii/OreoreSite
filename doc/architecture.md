# アーキテクチャと命名方針（提案）

本プロジェクトは three.js を用いた小規模 Web サイト構成です。現状のディレクトリ構成は機能別に概ね整理されていますが、将来の拡張に向けて「エントリ（ページ起点）」と「機能モジュール」の責務分離と API 化を進めると保守性が上がります。

## 現状の構成（概要）

- `src/core/`:
  - three.js の共通基盤（`app.js`, `renderer.js`, `scene.js`, `loop.js`, `controls.js`）
  - 設定値 `CONFIG`（`core/config.js`）
- `src/effects/`:
  - ポストプロセスやマテリアル関連ユーティリティ（`postprocess.js`, `materials.js`, `psx-jitter.js`）
- `src/features/`:
  - 機能単位の実装（`avatar/*`, `background/physics.js`, `boot/overlay.js`, `works/*` など）
- `src/entry/`:
  - 各ページの起点スクリプト（`avatar.js`, `background.js`, `works-gallery.js`, `title-tricks.js`, `easter-egg.js`）
- `src/styles/`:
  - グローバル CSS によるスタイル

特筆点:
- `src/entry/title-tricks.js` が `src/entry/background.js` のエクスポートを直接参照しており、エントリ同士が結合しています（責務がにじんでいる）。
- `core/config.js` はグラフィクス寄りの設定とレンダリング以外の設定が混在する余地があり、将来の分割候補です。

## 推奨する命名・構成ルール

1) ディレクトリ構造と役割
- `src/entry/` は「ページ起点」のみを置く。処理ロジックは `src/features/*` 側で提供する API を呼び出す。
- `src/features/<feature>/` は機能の実装と公開 API を持つ。外部公開点は `index.js`（または `controller.js`）に集約。
- `src/config/` を新設し、設定をドメインで分離（例: `graphics.js`, `app.js`）。当面は `core/config.js` を残しつつ段階的に移行。

2) ファイル命名
- エントリ名: `*.entry.js`（例: `background.entry.js`, `avatar.entry.js`）
- コントローラ/API: `controller.js` または `index.js`（機能の公開面）
- ユーティリティ: 名詞または動作を表すケバブケース（例: `postprocess.js`, `psx-jitter.js`）
- データ: ロケールごとにサフィックス（例: `works.ja.json`）。

3) 依存関係の方向
- `entry -> features -> core/effects` の一方向を厳守。`entry` 同士で import しない。

4) API 露出の一貫性
- UI から呼ばれる副作用関数は `features` のコントローラで公開する（例: 背景の玉個数増減、モード切替）。

## 具体的な整理提案

段階的移行を前提に、まずは API の抽出とエントリの結合解消から着手します。

1) Background の API を `features` に抽出
- 新設: `src/features/background/controller.js`
  - 公開関数（例）: `start(canvas, cfg)`, `increaseBalls()`, `decreaseBalls()`, `toggleSphereMode()`
  - 内部で three.js セットアップ・状態を保持し、`entry/background.js` はこれを利用するだけに簡素化。
- 影響: `src/entry/title-tricks.js` は `src/features/background/controller.js` から関数を import（`entry` 間依存を解消）。

2) Config の分割（将来）
- 新設: `src/config/graphics.js`（`PS1_MODE`, `AFFINE_STRENGTH`, `INTERNAL_SCALE`, `FIXED_FPS`, `RGB_BITS`, `CA_*`）
- 将来的にサイト全体の UI/機能設定が増えたら `src/config/app.js` を追加し、`entry` からは必要な設定だけを import。

3) Works データのロケール分離（任意）
- `src/features/works/data.ja.json` などに分割し、`loader.js` で言語ごとにロード切替できるように拡張。

4) バレルファイルの追加（任意）
- `src/features/avatar/index.js` で `createAvatarMesh`, `createAvatarExplosion`, `createAvatarUpdater` を再エクスポートし、利用側はエントリを簡素化。

## ディレクトリ例（将来像）

```
src/
  config/
    graphics.js
    app.js
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
  features/
    background/
      controller.js   // ← エントリから呼ぶ公開 API
      physics.js
    avatar/
      index.js        // メッシュ/更新/爆発を集約
      mesh.js
      update.js
      explode.js
    boot/overlay.js
    works/
      loader.js
      data.ja.json
  entry/
    background.entry.js
    avatar.entry.js
    works-gallery.entry.js
    title-tricks.entry.js
    easter-egg.entry.js
```

## メモ（現状から見えた改善余地）

- 文字化けしている日本語コメント（文字コード）の統一（UTF-8）
- `entry/background.js` が UI 用 API を直接 export しており、`entry/title-tricks.js` がそれを import しているため、機能境界を `features/background` へ移す
- 将来的にビルド導入（Vite 等）を検討する場合は、エイリアス解決（`@core`, `@features`）も導入すると import 可読性が向上

