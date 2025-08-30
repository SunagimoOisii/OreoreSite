# 改善タスク（重複・拡張性・保守性・可読性）

目的別に改善タスクを整理しています。優先度が高い順に上から配置しています。実装前に粒度や依存を見直してください。

## 重複の削減

- [ ] CSS アニメ再トリガの共通化（小粒度）: `retriggerClass(el, className, durationMs)` を `src/utils/dom.js` に追加し、次を置き換える（他機能への横展開はしない）
  - `src/entry/avatar.entry.js` の `triggerAboutLoadingBar()`
  - `src/entry/works-gallery.entry.js` の `triggerWorksLoadingBar()`
- [ ] Carousel のクラス回転ロジック共通化（Works機能専用）: 位置クラス配列や付け替えを `src/features/works/carousel-util.js` に切り出し、`getOffset/rotateClasses` を置き換え（他機能へは流用しない）
- [ ] 固定ステップ実行の小ヘルパ: 3 つの FPS アキュムレータを「背景コントローラ内ローカル関数」で置換（`makeStepper(targetHz, fn)` などを `controller.js` 内部に実装し、外部には公開しない）

## 拡張性の向上

- [ ] Background コントローラのインスタンス化: モジュールスコープの状態（`scene/camera/renderer/inst/...`）をクラスに集約し、複数背景や将来のモード追加に備える（既存の関数APIは互換レイヤで維持）
- [ ] FPS/挙動の外部設定化: デフォルト値（`POLY_FPS/GRID_FPS/INNER_FPS/INST_MAX` など）を `src/features/background/config.js` に移動し、`start({...fps})` で上書き可能に（描画系の `@config/graphics.js` とは分離）

## 保守性の改善

- [ ] リサイズリスナーのクリーンアップ: `src/core/renderer.js` の `setupResize(...)` を cleanup 関数を返す形に変更し、`src/core/app.js` の `dispose()` で解除する
- [ ] Works ローダの空データ定数化: `src/features/works/loader.js` のフォールバック `{ ja: { game:[], tool:[], other:[] } }` を定数にして重複を排除、型（JSDoc）を明確化
- [ ] `background/controller.js` の関心分離: 生成（ジオメトリ/マテリアル）、更新（回転/グリッド/インナー）、破棄（dispose）を関数に分割
- [ ] マジックナンバーの定数化: CSS 遷移時間（例: 320ms, 1400ms）、ジオメトリ半径等を定数にまとめる

## 可読性の向上

- [ ] `doc/architecture.md` の文字化け修正: UTF-8 保存へ移行し、章構成を整理（エントリ→機能→コア→エフェクトの依存を図示）
- [ ] Entry スクリプトに JSDoc 追加: 主要なハンドラ（クリック、Carousel 更新）に一行コメントを補足
- [ ] README の補足: Import Maps の使い方、`*.entry.js` と `features/*` の責務分離を図解で追記

## 追加で検討（任意）

- [ ] ESLint ルール拡充: `no-unused-vars`/`no-implicit-globals` などを有効化し、モジュールスコープの漏れを検知
- [ ] 性能計測フック: `createThreeApp` にフレーム時間の簡易ロガー（`performance.now()` 差分）をオプションで注入できるようにする

---

実装メモ:
- 破壊的変更（API 変更）を伴う項目は `feat:` コミットで段階的に進める（まず内部のみ適用→公開関数更新→呼び出し側置換）。
- 既存の振る舞いを保持するため、デフォルト設定は現行値に合わせる。

## 設計ガイド

- 後方互換性は、最終的に気にしなくていい
- 機能ローカル化: 設定やユーティリティは可能な限り該当機能配下に置く。横断 `utils` は最小限・小粒度に留める。
- 純粋関数優先: three/DOM 副作用とロジックを分離。ロジックは純粋（引数→戻り値）に寄せ、UI刷新やレンダラ差し替えに耐える。
- オプトイン設計: 新モード/新ルールは既定で無効。既存挙動は保持する。
- 設定の境界: 描画系（エフェクト/レンダラ）と機能系（背景/Works）の設定を分離し、依存方向を一方向に保つ。
- ライフサイクル管理: リスナーやリソース（RT/Geo/Mat）は生成と廃棄の責務を分け、`dispose()` で確実に解放する。
- 名前付けと定数化: マジックナンバー（時間・半径・回転速度等）は意味のある定数名で一箇所に集約。
- エラーとフォールバック: ネットワーク/JSON 失敗時のフォールバックデータは定数で一元管理し、UI側も空ケースを考慮。
- 型とJSDoc: エントリポイント/主要APIには最小限のJSDocで契約（引数・戻り値・例外）を明示する。
- 過剰抽象化の回避: 抽象は「2つ以上の実利用」が揃ってから。第1ステップでは機能ローカルで小さく切り出す。
- 計測と実験フラグ: パフォーマンスや実験的機能は計測フック/フラグで独立させ、本流ロジックを汚さない。
