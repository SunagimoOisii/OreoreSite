import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { OrbitControls } from "https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js";

const canvas = document.getElementById("avatar-canvas");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.outputColorSpace = THREE.SRGBColorSpace;

// ===== トグル =====
const PS1_MODE = true;         // ← ここでPS1風ON/OFF
const AFFINE_STRENGTH = 0.65;  // 0.0=透視補正, 1.0=強アフィン（PS1_MODE=true時のみ使用）

// ===== レンダラーをCSSサイズに同期 =====
function resizeRendererToDisplaySize() {
  const rect = canvas.getBoundingClientRect();
  const w = Math.max(1, rect.width | 0);
  const h = Math.max(1, rect.height | 0);

  if (PS1_MODE) {
    renderer.setPixelRatio(1); // 高DPIオフでジャギ感🎮
    const scale = 0.5;         // 内部解像度を下げる（0.5〜0.85）
    renderer.setSize((w * scale) | 0, (h * scale) | 0, false);
    renderer.domElement.style.imageRendering = "pixelated";
  } else {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);
    renderer.domElement.style.imageRendering = "";
  }
  return { w, h };
}

const scene = new THREE.Scene();

// ===== カメラ =====
const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
camera.position.set(0, 0, 5);
camera.lookAt(0, 0, 0);

// ===== 立方体 =====
const cubeSize = 1.8;
const boxGeo = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);

// ===== テクスチャ =====
const texture = new THREE.TextureLoader().load("img/me.jpg", (tex) => {
  tex.colorSpace = THREE.SRGBColorSpace;
  if (PS1_MODE) {
    // PS1味：ニアレスト & ミップ無し
    tex.generateMipmaps = false;
    tex.minFilter = THREE.NearestFilter;
    tex.magFilter = THREE.NearestFilter;
    tex.anisotropy = 0;
  }
});

// ===== シェーダ（アフィン／通常） =====

// アフィン（擬似）：透視UVとアフィンUVをmix + clamp（黒抜け防止）
function makeAffineMaterial(map, toGray = false) {
  return new THREE.ShaderMaterial({
    uniforms: {
      map: { value: map },
      uAffine: { value: AFFINE_STRENGTH }
    },
    vertexShader: `
      varying vec2 vUv_persp;
      varying vec2 vUv_affineRaw;
      varying float vFragW;
      void main () {
        vec4 clip = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        vFragW = clip.w;
        vUv_persp = uv;
        vUv_affineRaw = uv * clip.w;
        gl_Position = clip;
      }
    `,
    fragmentShader: `
      precision mediump float;
      uniform sampler2D map;
      uniform float uAffine;
      varying vec2 vUv_persp;
      varying vec2 vUv_affineRaw;
      varying float vFragW;
      void main () {
        vec2 uv_p = vUv_persp;
        vec2 uv_a = vUv_affineRaw / vFragW;
        vec2 uv = mix(uv_p, uv_a, clamp(uAffine, 0.0, 1.0));
        uv = clamp(uv, 0.0, 1.0);
        vec4 c = texture2D(map, uv);
        ${toGray
          ? `float g = dot(c.rgb, vec3(0.2126, 0.7152, 0.0722));
             gl_FragColor = vec4(vec3(g), c.a);`
          : `gl_FragColor = c;`
        }
      }
    `,
    transparent: false,
    depthTest: true,
    depthWrite: true
  });
}

// 透視補正アリ（通常）：three標準のvaryingでOK
function makePerspMaterial(map, toGray = false) {
  return new THREE.ShaderMaterial({
    uniforms: { map: { value: map } },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv; // threeが自動で透視補正して補間
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      precision mediump float;
      uniform sampler2D map;
      varying vec2 vUv;
      void main() {
        vec4 c = texture2D(map, vUv);
        ${toGray
          ? `float g = dot(c.rgb, vec3(0.2126, 0.7152, 0.0722));
             gl_FragColor = vec4(vec3(g), c.a);`
          : `gl_FragColor = c;`
        }
      }
    `,
    transparent: false,
    depthTest: true,
    depthWrite: true
  });
}

// ===== マテリアル割り当て（PS1_MODEで切替） =====
// 面順序: +X, -X, +Y, -Y, +Z(正面), -Z
let matColor, matGray;
if (PS1_MODE) {
  matColor = makeAffineMaterial(texture, false); // 正面カラー(アフィン)
  matGray  = makeAffineMaterial(texture, true);  // 他グレー(アフィン)
} else {
  matColor = makePerspMaterial(texture, false);  // 正面カラー(通常)
  matGray  = makePerspMaterial(texture, true);   // 他グレー(通常)
}

const materials = [
  matGray,  // +X
  matGray,  // -X
  matGray,  // +Y
  matGray,  // -Y
  matColor, // +Z（正面カラー）
  matGray   // -Z
];

const cube = new THREE.Mesh(boxGeo, materials);
scene.add(cube);

// ===== OrbitControls =====
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableZoom = false;
controls.enablePan = false;
controls.autoRotate = true;
controls.autoRotateSpeed = 1.0;
controls.target.set(0, 0, 0);

// ===== 外接球フィット（回転でも切れない）=====
function fitCameraToBox() {
  const { w, h } = resizeRendererToDisplaySize();
  camera.aspect = w / h;
  camera.updateProjectionMatrix();

  const r = Math.sqrt(3) * (cubeSize / 2);
  const vFov = THREE.MathUtils.degToRad(camera.fov);
  const vDist = r / Math.tan(vFov / 2.0);
  const hFov  = 2.0 * Math.atan(Math.tan(vFov / 2.0) * camera.aspect);
  const hDist = r / Math.tan(hFov / 2.0);

  const margin = 1.1;
  const dist = Math.max(vDist, hDist) * margin;

  camera.position.set(0, 0, dist);
  camera.near = Math.max(0.1, dist - r * 4);
  camera.far  = dist + r * 6;
  camera.updateProjectionMatrix();

  controls.update();
}

// ===== PS1ゆらぎ（量子化）=====
function snap(v, step) { return Math.round(v / step) * step; }
function applyPS1Jitter() {
  if (!PS1_MODE) return;
  const posStep = 1 / 256;
  const rotStep = THREE.MathUtils.degToRad(1.0);

  camera.position.x = snap(camera.position.x, posStep);
  camera.position.y = snap(camera.position.y, posStep);
  camera.position.z = snap(camera.position.z, posStep);

  cube.rotation.x = snap(cube.rotation.x, rotStep);
  cube.rotation.y = snap(cube.rotation.y, rotStep);
  cube.rotation.z = snap(cube.rotation.z, rotStep);
}

// ===== 起動・ループ =====
fitCameraToBox();
window.addEventListener("resize", fitCameraToBox);

function animate() {
  requestAnimationFrame(animate);
  cube.rotation.y += 0.007;
  applyPS1Jitter();
  controls.update();
  renderer.render(scene, camera);
}
animate();
