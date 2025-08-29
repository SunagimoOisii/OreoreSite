// src/effects/psx-jitter.js
// PS1/PSX風のジッター（量子化）表現

/**
 * 任意の値を指定ステップで丸める。
 * @param {number} v 対象値
 * @param {number} step 丸め間隔
 * @returns {number} 丸め後の値
 */
function snap(v, step)
{
  return Math.round(v / step) * step;
}

/**
 * カメラとオブジェクトに量子化ジッターを適用しPS1風の表現に寄せる。
 * @param {typeof import('three')} THREE three 名前空間
 * @param {THREE.Camera} camera カメラ
 * @param {THREE.Object3D} obj 対象オブジェクト
 * @param {object} cfg 設定（PS1_MODE を参照）
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
