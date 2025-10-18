# アーキテクチャ（概要）

このサイトは three.js を用いたシンプルなフロントエンド構成です。ページ側に「エントリ（entry）」、機能ロジックは「features」、土台は「core」、描画効果は「effects」に分離しています。Import Maps で `@core/` などの別名を割り当て、可読性を高めています。

- エントリ: `src/entry/*.entry.js`（ページごとの起動コード）
- 機能: `src/features/*`（UIや三次元処理のまとまり）
- 土台: `src/core/*`（renderer/scene/loop/controlsなどの共通土台）
- 効果: `src/effects/*`（ポストプロセス、独自マテリアル等）
- 設定: `src/config/*`（描画設定）、`src/features/background/config.js`（機能ローカル設定）

## 依存関係（責務の分離）

- エントリ → 機能 →（必要に応じて）core/effects
- 機能同士は直接依存しない（共有は index.js などの公開API経由）
- Import Maps により `@core/*`, `@features/*`, `@effects/*`, `@config/*` を解決

## エントリの責務

- DOM から必要な要素を取得し、対応する機能を初期化する
- ページ固有のイベント結び付け（ボタンやタブなど）
- ビジネスロジックは持たず、機能APIを呼び出すのみ

## 機能の責務

- UI操作の具体的な実装・three.js での表現ロジック
- 公開関数は `features/<name>/index.js` もしくは `controller.js` でエクスポート
- 例）background: `start()/stop()/setBackgroundFPS()/toggleSphereMode()` など

## core/effects の責務

- core: three.js の初期化・固定ステップループ・リサイズ・操作（OrbitControls）
- effects: ポストプロセスやマテリアル、レトロ調ジッターなどの視覚効果

## Import Maps（例）

`index.html` に以下のような Import Map を記述します。

```
{
  "imports": {
    "three": "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js",
    "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/",
    "three-subdivide":"https://cdn.jsdelivr.net/npm/three-subdivide@1.1.5/build/index.module.js",
    "@core/": "./src/core/",
    "@features/": "./src/features/",
    "@effects/": "./src/effects/",
    "@config/": "./src/config/"
  }
}
```

## ディレクトリ構成

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
    retro-jitter.js
    index.js
  features/
    background/
      controller.js
      config.js
      physics.js
      index.js
    avatar/
      mesh.js
      update.js
      explode.js
      index.js
    works/
      loader.js
      carousel-util.js
      data.json
      index.js
    boot/
      overlay.js
  entry/
    background.entry.js
    avatar.entry.js
    works-gallery.entry.js
    title-tricks.entry.js
    easter-egg.entry.js
  utils/
    dom.js
```

## メモ（背景コントローラ）

- `features/background/controller.js` はクラス化され、生成/更新/破棄が内部で分離されています
- 既存の関数APIは互換層で提供（start/stop など）。必要に応じてクラスAPIへ移行可能
