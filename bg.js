// 背景：GPU ベース流体シミュレーション（WebGL 計算シェーダ風）
// 既存の #bg-canvas を使用。

import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { GPUComputationRenderer } from "https://unpkg.com/three@0.160.0/examples/jsm/misc/GPUComputationRenderer.js";

const canvas = document.getElementById("bg-canvas");
if (!canvas) {
  console.warn("[bg] #bg-canvas not found");
}

// -------- 基本セットアップ（軽量・レトロ寄せ） --------
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: false,
  alpha: true,
  powerPreference: "low-power",
});
renderer.setPixelRatio(1);
renderer.setSize(window.innerWidth, window.innerHeight, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = false;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  35,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.set(0, 0, 12);

// 簡易ライト
const amb = new THREE.AmbientLight(0xffffff, 0.5);
const dir = new THREE.DirectionalLight(0xffffff, 0.6);
dir.position.set(1, 2, 3);
scene.add(amb, dir);

// -------- 立方体ワイヤーフレーム（枠） --------
const BOUNDS = 4.0; // 立方体の一辺
const boxGeo = new THREE.BoxGeometry(BOUNDS, BOUNDS, BOUNDS);
const edges = new THREE.EdgesGeometry(boxGeo);
const lineMat = new THREE.LineBasicMaterial({ color: 0x666666, transparent: true, opacity: 0.7 });
const box = new THREE.LineSegments(edges, lineMat);
scene.add(box);

// -------- GPU 計算セットアップ --------
const COUNT = 256; // 粒子数
const R = 0.06; // 表示半径
const TEX_WIDTH = Math.ceil(Math.sqrt(COUNT));
const TEX_HEIGHT = TEX_WIDTH;

const gpuCompute = new GPUComputationRenderer(TEX_WIDTH, TEX_HEIGHT, renderer);

function createTexture(initializer) {
  const tex = gpuCompute.createTexture();
  const data = tex.image.data;
  for (let i = 0; i < COUNT; i++) {
    const idx = i * 4;
    initializer(data, idx);
  }
  return tex;
}

const posTex = createTexture((data, idx) => {
  data[idx] = (Math.random() - 0.5) * (BOUNDS - R * 2);
  data[idx + 1] = (Math.random() - 0.5) * (BOUNDS - R * 2);
  data[idx + 2] = (Math.random() - 0.5) * (BOUNDS - R * 2);
  data[idx + 3] = 1;
});
const velTex = createTexture((data, idx) => {
  data[idx] = (Math.random() - 0.5) * 0.4;
  data[idx + 1] = (Math.random() - 0.5) * 0.4;
  data[idx + 2] = (Math.random() - 0.5) * 0.4;
  data[idx + 3] = 1;
});

const velocityFragmentShader = `
  uniform float delta;
  const float H = 0.4;
  const float K = 2.0;
  const float MU = 0.1;
  const float GRAV = 0.4;
  const float R = ${R};
  const float BOUNDS = ${BOUNDS};
  const int COUNT = ${COUNT};
  void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec4 pos = texture2D(texturePosition, uv);
    vec4 vel = texture2D(textureVelocity, uv);
    vec3 acc = vec3(0.0, -GRAV, 0.0);
    for (int i = 0; i < COUNT; i++) {
      vec2 ref = vec2(float(i % ${TEX_WIDTH}) / ${TEX_WIDTH}.0 + 0.5/${TEX_WIDTH}.0,
                       float(i / ${TEX_WIDTH}) / ${TEX_HEIGHT}.0 + 0.5/${TEX_HEIGHT}.0);
      vec3 p2 = texture2D(texturePosition, ref).xyz;
      vec3 d = p2 - pos.xyz;
      float dist2 = dot(d, d);
      if (dist2 < H*H && dist2 > 1e-6) {
        float dist = sqrt(dist2);
        float q = 1.0 - dist / H;
        vec3 n = d / dist;
        float press = K * q * q;
        acc -= press * n;
        vec3 rv = texture2D(textureVelocity, ref).xyz - vel.xyz;
        float visc = MU * q;
        acc += rv * visc;
      }
    }
    vel.xyz += acc * delta;
    vec3 p = pos.xyz + vel.xyz * delta;
    float limit = BOUNDS * 0.5 - R;
    if (p.x > limit || p.x < -limit) vel.x *= -0.5;
    if (p.y > limit || p.y < -limit) vel.y *= -0.5;
    if (p.z > limit || p.z < -limit) vel.z *= -0.5;
    gl_FragColor = vel;
  }
`;

const positionFragmentShader = `
  uniform float delta;
  const float R = ${R};
  const float BOUNDS = ${BOUNDS};
  void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec4 pos = texture2D(texturePosition, uv);
    vec4 vel = texture2D(textureVelocity, uv);
    vec3 p = pos.xyz + vel.xyz * delta;
    float limit = BOUNDS * 0.5 - R;
    p = clamp(p, vec3(-limit), vec3(limit));
    gl_FragColor = vec4(p, 1.0);
  }
`;

const velVar = gpuCompute.addVariable("textureVelocity", velocityFragmentShader, velTex);
const posVar = gpuCompute.addVariable("texturePosition", positionFragmentShader, posTex);

gpuCompute.setVariableDependencies(velVar, [velVar, posVar]);
gpuCompute.setVariableDependencies(posVar, [velVar, posVar]);

velVar.material.uniforms.delta = { value: 0 };
posVar.material.uniforms.delta = { value: 0 };

const error = gpuCompute.init();
if (error !== null) {
  console.error(error);
}

// -------- パーティクル描画 --------
const particleGeo = new THREE.BufferGeometry();
const positions = new Float32Array(COUNT * 3);
const refs = new Float32Array(COUNT * 2);
for (let i = 0; i < COUNT; i++) {
  positions[i * 3] = 0;
  positions[i * 3 + 1] = 0;
  positions[i * 3 + 2] = 0;
  const u = (i % TEX_WIDTH) / TEX_WIDTH + 0.5 / TEX_WIDTH;
  const v = Math.floor(i / TEX_WIDTH) / TEX_HEIGHT + 0.5 / TEX_HEIGHT;
  refs[i * 2] = u;
  refs[i * 2 + 1] = v;
}
particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
particleGeo.setAttribute("reference", new THREE.BufferAttribute(refs, 2));

const particleMat = new THREE.ShaderMaterial({
  uniforms: {
    texturePosition: { value: null },
    size: { value: R * 80 }
  },
  vertexShader: `
    uniform sampler2D texturePosition;
    uniform float size;
    attribute vec2 reference;
    void main() {
      vec3 pos = texture2D(texturePosition, reference).xyz;
      vec4 mv = modelViewMatrix * vec4(pos, 1.0);
      gl_PointSize = size / -mv.z;
      gl_Position = projectionMatrix * mv;
    }
  `,
  fragmentShader: `
    void main() {
      float d = length(gl_PointCoord - 0.5);
      if (d > 0.5) discard;
      gl_FragColor = vec4(0.33, 0.53, 1.0, 1.0);
    }
  `,
  transparent: false
});

const particles = new THREE.Points(particleGeo, particleMat);
scene.add(particles);

// -------- ループ --------
let raf = 0, last = performance.now(), accTime = 0;
const STEP = 1000 / 20; // 20fps
const SPEED = 0.1;      // 速度スケール
function loop(now) {
  raf = requestAnimationFrame(loop);
  accTime += (now - last); last = now;

  while (accTime >= STEP) {
    const dt = (STEP / 1000) * SPEED;
    box.rotation.x += 0.0008;
    box.rotation.y -= 0.0012;

    velVar.material.uniforms.delta.value = dt;
    posVar.material.uniforms.delta.value = dt;
    gpuCompute.compute();

    accTime -= STEP;
  }

  particleMat.uniforms.texturePosition.value = gpuCompute.getCurrentRenderTarget(posVar).texture;
  renderer.render(scene, camera);
}
raf = requestAnimationFrame(loop);

// リサイズ
function fit() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener("resize", fit);

// タブ非表示で停止（省電力）
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") {
    cancelAnimationFrame(raf);
  } else {
    last = performance.now(); accTime = 0;
    raf = requestAnimationFrame(loop);
  }
});
