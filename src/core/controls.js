// src/core/controls.js
// OrbitControls を薄くラップし、用途に合わせた既定を提供します。

import { OrbitControls } from "three/addons/controls/OrbitControls.js";

/**
 * マウス操作用の OrbitControls を生成します。
 * - 本プロジェクトの既定ではパン・ズームを無効化し、回転のみ許可します。
 * - 既定ターゲットは原点 (0,0,0) に設定します。
 *
 * @param {typeof import('three')} THREE three オブジェクト
 * @param {THREE.Camera} camera 対象カメラ
 * @param {HTMLElement} dom 入力を受け付ける DOM 要素
 * @param {object} cfg 設定値（将来拡張のため受け取る）
 * @returns {OrbitControls}
 */
export function createControls(THREE, camera, dom, cfg)
{
  const controls = new OrbitControls(camera, dom);
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.autoRotate = false;
  controls.target.set(0, 0, 0);
  return controls;
}

