import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { OrbitControls } from "https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js";

const canvas = document.getElementById("avatar-canvas");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.outputColorSpace = THREE.SRGBColorSpace;

// ===== トグル =====
const PS1_MODE = true;         // ← PS1風ON/OFF
const AFFINE_STRENGTH = 0.65;  // 0.0=透視補正, 1.0=強アフィン（PS1_MODE=true時のみ使用）

// ===== レンダラーをCSSサイズに同期 =====
function resizeRendererToDisplaySize() {
  const rect = canvas.getBoundingClientRect();
  const w = Math.max(1, rect.width | 0);
  const h = Math.max(1, rect.height | 0);

  if (PS1_MODE) {
    renderer.setPixelRatio(1); // 高DPIオフでジャギ感
    const scale = 0.5;         // 内部解像度を落とす（0.5〜0.85で好み調整）
    renderer.setSize((w * scale) | 0, (h * scale) | 0, false);
    renderer.domElement.style.imageRendering = "pixelated";
  } else {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);
    renderer.domElement.style.imageRendering = "";
  }

  // ポスト用RTを同期
  const internalW = renderer.domElement.width;   // 実際の描画バッファサイズ(px)
  const internalH = renderer.domElement.height;
  postRT.setSize(internalW, internalH);
  postMat.uniforms.uResolution.value.set(internalW, internalH);

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
    // PS1味：ニアレスト＆ミップ無し
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
    uniforms: { map: { value: map }, uAffine: { value: AFFINE_STRENGTH } },
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

// 透視補正アリ（通常）
function makePerspMaterial(map, toGray = false) {
  return new THREE.ShaderMaterial({
    uniforms: { map: { value: map } },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
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

const materials = [matGray, matGray, matGray, matGray, matColor, matGray];
const cube = new THREE.Mesh(boxGeo, materials);
scene.add(cube);

// ===== OrbitControls =====
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableZoom = false;
controls.enablePan = false;
controls.autoRotate = false; // ループ側で回転
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

// ===== ▼▼ 減色(Bayer 4x4)ポストプロセス ▼▼ =====
// RenderTarget
const postRT = new THREE.WebGLRenderTarget(2, 2, {
  minFilter: THREE.NearestFilter,
  magFilter: THREE.NearestFilter,
  depthBuffer: false,
  stencilBuffer: false
});
// FS Quad
const postScene = new THREE.Scene();
const postCam   = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const postMat   = new THREE.ShaderMaterial({
  uniforms: {
    tSrc:       { value: null },
    uResolution:{ value: new THREE.Vector2(2, 2) },
    uRgbBits:   { value: 5.0 }  // 5bit → RGB555
  },
  vertexShader: `
    varying vec2 vUv;
    void main(){
      vUv = uv;
      gl_Position = vec4(position.xy, 0.0, 1.0);
    }
  `,
  fragmentShader: `
    precision mediump float;
    uniform sampler2D tSrc;
    uniform vec2 uResolution;
    uniform float uRgbBits;
    varying vec2 vUv;

    // 4x4 Bayer行列（0..15）
    float bayer4x4(vec2 ip){
      int x = int(mod(ip.x, 4.0));
      int y = int(mod(ip.y, 4.0));
      int idx = y*4 + x;
      int mat[16];
      mat[0]=0; mat[1]=8; mat[2]=2; mat[3]=10;
      mat[4]=12; mat[5]=4; mat[6]=14; mat[7]=6;
      mat[8]=3; mat[9]=11; mat[10]=1; mat[11]=9;
      mat[12]=15; mat[13]=7; mat[14]=13; mat[15]=5;
      return float(mat[idx]);
    }

    void main(){
      // 元色
      vec4 c = texture2D(tSrc, vUv);

      // ピクセル座標（レンダリング解像度）
      vec2 frag = vUv * uResolution;

      // Bayerしきい値（0..1）
      float t = (bayer4x4(frag) + 0.5) / 16.0;

      // RGB555 量子化＋ベイヤーディザ
      float levels = exp2(uRgbBits) - 1.0; // 31
      vec3 q = floor(c.rgb * levels + t) / levels;

      gl_FragColor = vec4(q, c.a);
    }
  `,
  depthTest: false,
  depthWrite: false
});
const postQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), postMat);
postScene.add(postQuad);

// ===== 起動・ループ =====
fitCameraToBox();
window.addEventListener("resize", fitCameraToBox);

const ROT_SPEED = 0.007 * 60; // 秒あたりの回転速度（従来体感に近づけ）

if (PS1_MODE) {
  // --- 30fps固定 ---
  const FIXED_FPS = 30;
  const STEP_MS   = 1000 / FIXED_FPS;
  let accMs = 0, prevMs = performance.now();

  function update(dtSec) {
    cube.rotation.y += ROT_SPEED * dtSec;
    applyPS1Jitter();
  }
  function render() {
    // ① シーンをRTへ
    renderer.setRenderTarget(postRT);
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);

    // ② RTをRGB555+Bayerでフルスクリーンに
    postMat.uniforms.tSrc.value = postRT.texture;
    renderer.render(postScene, postCam);
  }
  function loop(nowMs) {
    requestAnimationFrame(loop);
    accMs += nowMs - prevMs;
    prevMs = nowMs;
    while (accMs >= STEP_MS) {
      update(STEP_MS / 1000);
      accMs -= STEP_MS;
    }
    render();
  }
  requestAnimationFrame(loop);

} else {
  // --- 通常の滑らかなfps（ブラウザ任せ）---
  function animate() {
    requestAnimationFrame(animate);
    cube.rotation.y += 0.007;

    // 直接描画（ポスト無し）
    controls.update();
    renderer.render(scene, camera);
  }
  animate();
}
