// background.js (entry)
// 背景描画の起点: features/background/controller に委譲

import * as THREE from 'three';
import { CONFIG } from '../core/config.js';
import { start as startBackground, setBackgroundFPS } from '../features/background/controller.js';

const canvas = document.getElementById('bg-canvas');
if (!canvas) console.warn('[bg] #bg-canvas not found');

const cfg = { ...CONFIG, PS1_MODE: true, CA_ENABLED: false };

// 旧実装の初期 FPS と同じ値を設定
setBackgroundFPS({ poly: 20, grid: 24, inner: 15 });

startBackground({ THREE, canvas, cfg, usePost: true });

