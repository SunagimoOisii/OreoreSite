# TODO（設計・拡張のためのタスク）

このリストは将来の開発・拡張を阻害しない方針でのタスクスタブです。進捗はチェックボックスに反映します。

## 進捗
- [x] エントリ初期化の重複排除（core/app.js 追加、`avatar.js`/`background.js` 置換）
- [x] `license.html` の CSS パスを `src/styles/global/*` に修正
- [x] ESLint（flat）/EditorConfig の導入（`eslint.config.mjs` / `.editorconfig` / `.eslintignore`）
- [x] 背景物理APIの拡張（`BackgroundPhysics#setMode` / `attachMesh` を追加、呼び出し側を更新）
- [x] Title Tricks の登録補助（`registerTrickByChar` を追加）
- [x] Works ローダの基本バリデーションを追加（不正時はフォールバック＋ログ）

## 残タスク
- CONFIG の整理: 用途別ネームスペース化または JSDoc 強化。利用側へは必要最小限のみ渡す（疎結合化）。
- Works データの分割: `src/features/works/data.json` を言語別に分割（`data.ja.json` / `data.en.json`）し、ローダで統合する戦略を検討。
- 画像アセット配置整理: `img/` → `public/assets/img/` の移行計画（相対参照の影響範囲を棚卸し）。
- 型安全/ドキュメンテーション: 主要エクスポートに JSDoc を付与し、英語一文サマリを併記。

## 段階導入の目安
- P1: 重複排除（core/app.js）/ ライセンス参照修正 / Lint 設定（完了）
- P2: i18n / Works スキーマ検証・分割 / Title Tricks 改修適用
- P3: 画像配置整理 / コメント整備 / 細部リファクタ（CONFIG 分離など）

