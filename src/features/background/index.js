// src/features/background/index.js
// 背景機能の公開API（互換レイヤ廃止、直接インスタンスを公開）

export { BackgroundController } from './controller.js';
export { BackgroundPhysics } from './physics.js';

import { BackgroundController as _BackgroundController } from './controller.js';

// 単純な共有インスタンス（必要に応じてアプリ側で別インスタンスを作成可能）
export const background = new _BackgroundController();

