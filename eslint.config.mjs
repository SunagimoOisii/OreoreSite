// eslint flat config（ESLint v9 以降）
// - ブラウザ/ESM 前提の最小設定
// - 使い方: `npm i -D eslint` 後に `npx eslint .` を実行
// - CDN importmap（three など）環境を想定し、過度な import 解決チェックは行いません

export default [
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        // ブラウザ/DOM 環境
        window: "readonly",
        document: "readonly",
        console: "readonly",
        performance: "readonly",
        requestAnimationFrame: "readonly",
        cancelAnimationFrame: "readonly",
      },
    },
    linterOptions: {
      // 画像やバイナリなどを一括指定した `eslint .` 実行時の誤爆を抑制
      reportUnusedDisableDirectives: true,
    },
    rules: {
      // 品質系（安全サイドに）
      "no-undef": "error",
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "eqeqeq": ["error", "always"],
      "no-var": "error",
      "prefer-const": ["warn", { destructuring: "all" }],
      "object-shorthand": "warn",
      // ログは警告扱い。ただし warn/error は許可
      "no-console": ["warn", { allow: ["warn", "error"] }],
      // import 拡張子の強制（ブラウザ ESM 想定で .js を付ける運用）
      // プラグインなしのため、最低限の自己防衛として警告のみ
      // 実運用では eslint-plugin-import の導入を推奨
    },
    ignores: [
      // 解析対象外
      "**/*.html",
      "**/img/**",
      "**/.git/**",
      "**/node_modules/**",
    ],
  },
];

