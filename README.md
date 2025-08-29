# SUNAGIMO HOUSE (OreoreSite)

個人サイト用のフロントエンド資材です。ビルドレス（CDN importmap）で three.js を用い、トップページではアバター表示・背景演出・作品ギャラリーを提供します。

## 特徴
- ビルド不要（`<script type="module">` ＋ importmap）
- 責務分離（core/effects/features）で保守しやすい構成
- 作品データを JSON 化（UI からデータを分離）
- CSS も Global と Feature 専用に分割

## すぐ試す
- GitHub Pages 上では `index.html`（リポジトリのルート直下）にアクセス
- ローカルで開く場合は、簡易サーバを使って配信してください（JSON fetch を使うため file:// 直開きでは動作しない場合があります）
  - Python: `python -m http.server -b 127.0.0.1 8080`
  - Node (任意): `npx serve .`
  - VS Code: Live Server 拡張

## 依存
- three.js（importmap で CDN から読み込み）
- three-subdivide（アバター爆散の頂点細分化に使用）

## 構成（抜粋）
```
index.html                  # ルート直下（GitHub Pages 要件）
src/
  core/                     # 基盤（DOM非依存・機能中立）
  effects/                  # 見た目の表現（シェーダ/ポストプロセス等）
  features/                 # 機能（DOM連携・スタイル・データを隣接配置）
  entry/                    # ページの起動スクリプト
  styles/global/            # サイト横断スタイル（トークン/レイアウト）
img/                        # 画像（将来 public/assets/ へ移行余地）
doc/architecture.md         # 設計の詳細（レイヤ責務・依存・起動フロー）
```

レイヤの依存は一方向です。
```
features ──▶ core
        └──▶ effects
effects  ──▶ core
core     ──▶（他レイヤへ依存しない）
```

## 作品データ（Works）
- `src/features/works/data.json` に言語→カテゴリ→配列の三層で定義
- ローダ `src/features/works/loader.js` が `loadWorks()`／`getList(lang, category)` を提供
- UI からはローダの関数のみを呼び出し、データ構造の変更はローダ内で吸収

## CSS 方針
- Global: `src/styles/global/*` に :root トークン・レイアウト
- Feature: `src/features/<feature>/*.css` に機能専用スタイル（`.boot-`, `.works-`, `.avatar-`）

## 開発メモ
- three のバージョンは importmap で固定
- 将来 Vite 等のビルドに移行する場合も、エントリ/フォルダ構成はそのまま活かせます

## ライセンス
- ライセンス表記は `LICENSE` および `license.html` を参照してください

