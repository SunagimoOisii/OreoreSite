// lib/utils.js
// PS1 風のジッター処理など補助関数群
/**
 * 値を指定ステップで丸める。
 * @param {number} v 対象値
 * @param {number} step 丸め単位
 * @returns {number} 丸め後の値
 */
function snap(v, step){ return Math.round(v/step)*step; }

/**
 * カメラとオブジェクトに量子化ジッターを適用し、PS1 風の粗さを再現。
 * @param {typeof import('three')} THREE three 名前空間
 * @param {THREE.Camera} camera 対象カメラ
 * @param {THREE.Object3D} cube 対象オブジェクト
 * @param {object} cfg 設定値
 */
export function applyPS1Jitter(THREE, camera, cube, cfg){
  if(!cfg.PS1_MODE) return;
  const posStep = 1/256;
  const rotStep = THREE.MathUtils.degToRad(1.0);
  camera.position.x = snap(camera.position.x, posStep);
  camera.position.y = snap(camera.position.y, posStep);
  camera.position.z = snap(camera.position.z, posStep);
  cube.rotation.x = snap(cube.rotation.x, rotStep);
  cube.rotation.y = snap(cube.rotation.y, rotStep);
  cube.rotation.z = snap(cube.rotation.z, rotStep);
}
