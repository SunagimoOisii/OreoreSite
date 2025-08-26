import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { createRenderer, fitToCanvas } from "./lib/renderer.js";
import { createSceneGraph } from "./lib/scene.js";
import { createControls } from "./lib/controls.js";
import { createPostPipeline } from "./lib/postprocess.js";
import { CONFIG } from "./lib/config.js";
import { applyPS1Jitter } from "./lib/utils.js";

const canvas = document.getElementById("avatar-canvas");
const renderer = createRenderer(THREE, canvas, CONFIG);
const { scene, camera, cube } = createSceneGraph(THREE, CONFIG);
const controls = createControls(THREE, camera, renderer.domElement, CONFIG);
const post = createPostPipeline(THREE, renderer, CONFIG); // { render(scene,camera), resize() }

function resize() {
  fitToCanvas(renderer, canvas, CONFIG);
  post.resize(renderer);
  camera.aspect = canvas.clientWidth / canvas.clientHeight;
  camera.updateProjectionMatrix();
}
window.addEventListener("resize", resize);
resize();

// ループ（PS1_MODEに合わせて分岐）
const ROT_SPEED = 0.007 * 60;
if (CONFIG.PS1_MODE) {
  const STEP = 1000 / CONFIG.FIXED_FPS;
  let acc=0, prev=performance.now();
  function loop(t){
    requestAnimationFrame(loop);
    acc += t - prev; prev = t;
    while (acc >= STEP) {
      cube.rotation.y += ROT_SPEED * (STEP/1000);
      applyPS1Jitter(THREE, camera, cube, CONFIG);
      acc -= STEP;
    }
    post.render(scene, camera);
    controls.update();
  }
  requestAnimationFrame(loop);
} else {
  function animate(){
    requestAnimationFrame(animate);
    cube.rotation.y += 0.007;
    renderer.render(scene, camera); // 直接描画
    controls.update();
  }
  animate();
}
