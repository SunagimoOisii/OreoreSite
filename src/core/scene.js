// src/core/scene.js
// シーン土台（Scene/Camera のみ）

/**
 * シーンとカメラの土台を生成して返す。
 * @param {typeof import('three')} THREE three 名前空間
 * @param {object} cfg 設定（将来ライト等に反映する余地）
 * @returns {{scene:THREE.Scene,camera:THREE.PerspectiveCamera}}
 */
export function createSceneBase(THREE, cfg)
{
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 5);
  return { scene, camera };
}

