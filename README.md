# SUNAGIMO HOUSE (OreoreSite)

個人サイト用のフロントエンドです。ビルドレス（CDN importmap）で three.js を用い、トップページではアバター表示・背景アニメーション・作品ギャラリーを提供します。

## 特徴
- ビルドレス構成（`<script type="module">` + importmap）
- 責務分割（core/effects/features/entry）
- 作品データは JSON（UI はローダ API だけを利用）
- CSS は Global と Feature の二層
- 共通ブート `src/core/app.js` によりエントリ初期化の重複を解消

## 使い方（ローカル）
- GitHub Pages では `index.html` に直接アクセス
- ローカル検証は簡易サーバを使用（`file://` では JSON fetch が失敗する場合があります）
  - Python: `python -m http.server -b 127.0.0.1 8080`
  - Node: `npx serve .`
  - VS Code: Live Server

## 依存
- three.js（importmap で CDN 読み込み）
- three-subdivide（アバター爆発の分割に使用）

## 構成
```
index.html                  # ルートページ
src/
  core/                     # 基盤（DOMに非依存のロジック）
    app.js                  # three アプリ共通ブート（新規）
    config.js               # 設定値
    controls.js             # OrbitControls ラッパ
    loop.js                 # 固定ステップ/メインループ
    renderer.js             # WebGLRenderer 作成/リサイズ
    scene.js                # Scene/Camera の最小生成
  effects/                  # 表現（シェーダ/ポストプロセス等）
  features/                 # 機能（DOMアグリゲート/データ）
  entry/                    # ページのエントリスクリプト
  styles/global/            # サイト共通スタイル（トークン/レイアウト）
img/                        # 画像（将来 public/assets/ に移行予定）
doc/architecture.md         # 設計ドキュメント
```

設計の依存は以下を維持します。
```
features → core（必要に応じて effects）
effects  → core
core     → 外部（DOM）へ非依存
```

## 最近の変更
- 共通ブート `src/core/app.js` を導入し、`src/entry/avatar.js` と `src/entry/background.js` の初期化～ループ重複を解消
- `license.html` の CSS 参照を `src/styles/global/*` に修正

## ライセンス
- ライセンス表記は `LICENSE` および `license.html` を参照してください

