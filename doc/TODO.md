# TODO（設計・拡張のためのタスク）

このリストは将来の開発・拡張を阻害しない方針でのタスクスタブです。進捗はチェックボックスに反映します。

## 進捗
- [x] エントリ初期化の重複排除（core/app.js 追加、`avatar.js`/`background.js` 置換）
- [x] `license.html` の CSS パスを `src/styles/global/*` に修正
- [x] ESLint（flat）/EditorConfig の導入（`eslint.config.mjs` / `.editorconfig` / `.eslintignore`）

## 残タスク
- CONFIG の整理: 用途別ネームスペース化または JSDoc 強化。利用側へは必要最小限のみ渡す（疎結合化）。
- Works データのスキーマ化: JSON Schema を導入し、読み込み時に検証（`ja.json`/`en.json` 分割に備える）。検証失敗時はフォールバック＋明示ログ。
- i18n 導入: UI テキスト（`index.html`、`license.html`、モバイル警告など）を `i18n/ja.json`/`en.json` に分離し、`t(key)` ヘルパで置換。
- Title Tricks の拡張性改善: 文字インデックス直指定をやめ、キー名/データ属性で紐付け（例: `registerTrick('S', handler)`）。
- 背景物理のモード切替 API: `BackgroundPhysics#setMode('cube'|'sphere')` を追加し、切替処理を内部に集約。
- 画像アセット配置整理: `img/` → `public/assets/img/` の移行計画（相対参照の影響範囲を棚卸し）。
- 型安全/ドキュメンテーション: 主要エクスポートに JSDoc を付与し、英語一文サマリを併記。

## 段階導入の目安
- P1: 重複排除（core/app.js）/ ライセンス参照修正 / Lint 設定（←一部完了）
- P2: i18n / Works スキーマ検証 / Title Tricks 改修
- P3: 画像配置整理 / 背景物理 API 化 / コメント整備
