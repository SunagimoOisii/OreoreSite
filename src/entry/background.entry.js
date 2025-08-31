// background.js (entry)
// 背景描画の起点: features/background/controller に委譲

import * as THREE from 'three';
import { GRAPHICS as CONFIG } from '@config/graphics.js';
import { start as startBackground, setBackgroundFPS } from '@features/background/index.js';
import { onRetroChanged, getRetroEnabled } from '@core/state.js';

const canvas = document.getElementById('bg-canvas');
if (!canvas) console.warn('[bg] #bg-canvas not found');

const cfg = { ...CONFIG, PS1_MODE: true, CA_ENABLED: false };

// 旧実装の初期 FPS と同じ値を設定
setBackgroundFPS({ poly: 20, grid: 24, inner: 15 });

startBackground({ THREE, canvas, cfg, usePost: true });

// Retro状態の変化で背景を再起動（ポストプロセス ON/OFF）
onRetroChanged((enabled) =>
{
  const canvas2 = document.getElementById('bg-canvas');
  if (!canvas2) return;
  const nextCfg = { ...CONFIG, PS1_MODE: !!enabled, CA_ENABLED: enabled ? CONFIG.CA_ENABLED : false };
  try { startBackground({ THREE, canvas: canvas2, cfg: nextCfg, usePost: !!enabled }); } catch {}
});

