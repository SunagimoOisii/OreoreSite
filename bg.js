import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { createRenderer, fitToCanvas } from "./lib/renderer.js";
import { createMorphPoints } from "./lib/morph.js";
import { CONFIG } from "./lib/config.js";

const canvas = document.getElementById("bg-canvas");
const renderer = createRenderer(THREE, canvas, CONFIG);
renderer.setClearColor(0x000000, 1);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
camera.position.set(0, 0, 0);

const morph = createMorphPoints(THREE);
scene.add(morph.points);

function resize() {
  fitToCanvas(renderer, canvas, CONFIG);
  camera.aspect = canvas.clientWidth / canvas.clientHeight;
  camera.updateProjectionMatrix();
}
window.addEventListener("resize", resize);
resize();

function animate(time) {
  requestAnimationFrame(animate);
  morph.update(time);
  renderer.render(scene, camera);
}
requestAnimationFrame(animate);
