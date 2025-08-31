// src/features/background/index.js
// Background 機能の公開 API を再エクスポート（バレル化）

export
{
  start,
  increaseBalls,
  decreaseBalls,
  switchToSphereMode,
  toggleSphereMode,
  setBackgroundFPS,
  restartBackground,
} from './controller.js';

export { BackgroundPhysics } from './physics.js';

