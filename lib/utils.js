function snap(v, step){ return Math.round(v/step)*step; }
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
