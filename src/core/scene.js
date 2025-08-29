// src/core/scene.js
// シーン雛形（Scene/Camera のみ）

/**
 * シーンとカメラの雛形を生成して返します。
 * @param {typeof import('three')} THREE three オブジェクト
 * @param {object} cfg 設定（必要なら将来拡張）
 * @returns {{scene:THREE.Scene,camera:THREE.PerspectiveCamera}}
 */
export function createSceneBase(THREE, cfg)
{
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 5);
  return { scene, camera };
}

