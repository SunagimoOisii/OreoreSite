# TODOs（優先度つきタスクスタブ）

このファイルは構成/命名の見直しに伴う作業計画のスタブです。実装に踏み込む前の粒度で記載しています。

## P0（最優先）

- [x] entry 間依存の解消（Background API 抽出）
  - 新規: `src/features/background/controller.js`
    - [x] `start(canvas, cfg)` を実装（シーン生成・ループ開始・状態保持）
    - [x] `increaseBalls()`, `decreaseBalls()`, `toggleSphereMode()` を公開
  - 変更: `src/entry/background.js`
    - [x] 内部状態と副作用を `controller.js` へ移譲
    - [x] エントリは `controller.start()` を呼ぶだけにする
  - 変更: `src/entry/title-tricks.js`
    - [x] import 元を `src/features/background/controller.js` に切替
    - [x] 動作確認（クリック時の連携）

## P1（高）

- [ ] Config の分割準備
  - 新規: `src/config/graphics.js` を作成し、`core/config.js` のグラフィクス系キーを移す
  - 変更: 参照側（`entry/*`, `features/*`, `core/*`）を段階的に置換
  - 既存 `core/config.js` は互換エクスポートを暫定提供（破壊的変更を避ける）

- [ ] 文字コードの統一（UTF-8）
  - 対象: `src/**/*.js`, `src/**/*.css`, `*.html`
  - 手順: エディタ/リント設定見直し、必要に応じて再保存

## P2（中）

- [ ] Works データのロケール分割
  - 新規: `src/features/works/data.ja.json`
  - 変更: `loader.js` でロケールファイルを選択可能に

- [ ] Avatar のバレル化
  - 新規: `src/features/avatar/index.js`（既存3モジュールを再エクスポート）
  - 変更: `src/entry/avatar.js` を `index.js` から import する形に整理

## P3（低）

- [ ] entry ファイル命名の統一（`.entry.js` サフィックス）
  - 変更: `src/entry/*.js` を `*.entry.js` にリネーム
  - 変更: HTML 側の `<script>` パス更新

- [ ] import エイリアス導入（ビルド採用時）
  - 例: `@core`, `@features`, `@effects`, `@config`
  - Vite 等の設定で `resolve.alias` を設定

## 受け入れ基準（抜粋）

- entry 同士に import が存在しない
- Background の UI 操作用 API は `features/background/controller.js` のみが公開面
- `CONFIG` 参照は `@config/graphics`（将来）に集約できる土台がある
- 現行ページの表示・インタラクションが既存同等に動作
