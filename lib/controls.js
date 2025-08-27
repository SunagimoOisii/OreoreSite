// lib/controls.js
// OrbitControls を薄くラップし、ズームやパンを禁止する
import { OrbitControls } from "https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js";

/**
 * マウス操作用の OrbitControls を生成。
 * @param {typeof import('three')} THREE three 名前空間
 * @param {THREE.Camera} camera 操作対象カメラ
 * @param {HTMLElement} dom 入力を受け付けるDOM
 * @param {object} cfg 設定値（未使用だが統一のため渡す）
 * @returns {OrbitControls}
 */
export function createControls(THREE, camera, dom, cfg){
  const controls = new OrbitControls(camera, dom);
  controls.enableZoom = false;
  controls.enablePan  = false;
  controls.autoRotate = false;
  controls.target.set(0,0,0);
  return controls;
}
