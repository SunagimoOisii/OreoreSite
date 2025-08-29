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

- [x] Config の分割（互換レイヤ廃止）
  - 新規: `src/config/graphics.js` を作成（グラフィクス系キーを集約）
  - 変更: 参照側（`src/entry/avatar.js`, `src/entry/background.js`）を `../config/graphics.js` に置換
  - 削除: `src/core/config.js`（再エクスポートの互換レイヤは不要のため削除）

- [x] 文字コードの統一（UTF-8）
  - 対象: `src/core/*`, `src/effects/*`, 一部 `src/features/*`
  - 対応: コメント/JSDoc の文字化けを修正、`.editorconfig` の `charset = utf-8` を確認
  - 備考: HTML 文面の一部に文字化けが残るため、必要なら `index.html`/`license.html`/`game.html` の本文も順次手直し可

## P2（中）

- [x] Avatar のバレル化
  - 新規: `src/features/avatar/index.js`（既存3モジュールを再エクスポート）
  - 変更: `src/entry/avatar.js` を `index.js` から import する形に整理
  
- [x] Background のバレル化
  - 新規: `src/features/background/index.js`
  - 変更: `src/entry/background.js`, `src/entry/title-tricks.js` の import を `../features/background` に短縮

- [x] Works のバレル化
  - 新規: `src/features/works/index.js`
  - 変更: `src/entry/works-gallery.js` の import を `../features/works` に短縮

- [x] Effects のバレル化
  - 新規: `src/effects/index.js`
  - 変更: `src/core/app.js`, `src/features/avatar/*` の import を `../effects`/`../../effects` に短縮

## P3（低）

- [x] entry ファイル命名の統一（`.entry.js` サフィックス）
  - 変更: `src/entry/*.js` を `*.entry.js` にリネーム
  - 変更: HTML 側の `<script>` パス更新

- [x] import エイリアス導入（Import Maps）
  - 追加: `@core/`, `@features/`, `@effects/`, `@config/` を `index.html` の importmap に設定
  - 変更: 主要ファイルの import をエイリアスへ置換

## 受け入れ基準（抜粋）

- entry 同士に import が存在しない
- Background の UI 操作用 API は `features/background/controller.js` のみが公開面
- `CONFIG` 参照は `@config/graphics`（将来）に集約できる土台がある
- 現行ページの表示・インタラクションが既存同等に動作
