// src/effects/psx-jitter.js
// PS1/PSX 風のジッター（粗い量子化風の揺れ）

/**
 * 任意の値を指定ステップで量子化します。
 * @param {number} v 対象値
 * @param {number} step 量子化ステップ
 * @returns {number} 量子化後の値
 */
function snap(v, step)
{
  return Math.round(v / step) * step;
}

/**
 * カメラとオブジェクトにジッターを適用してPS1風の表現に寄せます。
 * @param {typeof import('three')} THREE three オブジェクト
 * @param {THREE.Camera} camera カメラ
 * @param {THREE.Object3D} obj 対象オブジェクト
 * @param {object} cfg 設定（PS1_MODE が前提）
 */
export function applyPS1Jitter(THREE, camera, obj, cfg)
{
  if (!cfg.PS1_MODE)
    return;
  const posStep = 1 / 256;
  const rotStep = THREE.MathUtils.degToRad(1.0);
  camera.position.x = snap(camera.position.x, posStep);
  camera.position.y = snap(camera.position.y, posStep);
  camera.position.z = snap(camera.position.z, posStep);
  obj.rotation.x = snap(obj.rotation.x, rotStep);
  obj.rotation.y = snap(obj.rotation.y, rotStep);
  obj.rotation.z = snap(obj.rotation.z, rotStep);
}

