// background.entry.js
// 背景描画の起動と初期設定

import { GRAPHICS as CONFIG } from '@config/graphics.js';
import { background } from '@features/background/index.js';

const canvas = document.getElementById('bg-canvas');
if (!canvas)
{
  console.warn('[bg] #bg-canvas not found');
}

const cfg = { ...CONFIG, PS1_MODE: true, CA_ENABLED: false };

// 初期 FPS を設定
background.setFPS({ poly: 20, grid: 24, inner: 15 });

// 背景開始
background.start({ canvas, cfg, usePost: true });

