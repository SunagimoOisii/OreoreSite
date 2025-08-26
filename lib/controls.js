import { OrbitControls } from "https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js";
export function createControls(THREE, camera, dom, cfg){
  const controls = new OrbitControls(camera, dom);
  controls.enableZoom = false;
  controls.enablePan  = false;
  controls.autoRotate = false;
  controls.target.set(0,0,0);
  return controls;
}
