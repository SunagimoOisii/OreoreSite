// 背景：立方体内で球が跳ねあう（壁＆球-球の弾性衝突）
// 既存の #bg-canvas を使用。Boids は撤去してOK。

import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

const canvas = document.getElementById("bg-canvas");
if (!canvas) {
  console.warn("[bg] #bg-canvas not found");
}

// -------- 基本セットアップ（軽量・レトロ寄せ） --------
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: false,     // 粗さを残す
  alpha: true,          // 透過でページ背景を活かす
  powerPreference: "low-power",
});
renderer.setPixelRatio(1); // PS1風に寄せるなら 1 固定が相性良し
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

// 簡易ライト（MeshNormalMaterial なら不要。標準材用に薄く）
const amb = new THREE.AmbientLight(0xffffff, 0.5);
const dir = new THREE.DirectionalLight(0xffffff, 0.6);
dir.position.set(1, 2, 3);
scene.add(amb, dir);

// -------- 立方体ワイヤーフレーム（枠） --------
const BOUNDS = 4.0;                     // 立方体の一辺
const half = BOUNDS / 2;
const boxGeo = new THREE.BoxGeometry(BOUNDS, BOUNDS, BOUNDS);
const edges = new THREE.EdgesGeometry(boxGeo);
const lineMat = new THREE.LineBasicMaterial({ color: 0x666666, transparent:true, opacity:0.7 });
const box = new THREE.LineSegments(edges, lineMat);
scene.add(box);

// -------- 球（InstancedMesh で高速＆省メモリ） --------
const COUNT = 24;       // 球の数（20〜40くらいが見栄えと負荷のバランス◎）
const R = 0.1;         // 半径
const GEO = new THREE.SphereGeometry(R, 16, 12);  // 低ポリ
// ※色は固定。減色やランダム色にしたければ THREE.InstancedMesh#setColorAt を使う
const MAT = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  metalness: 0.1,
  roughness: 0.6,
});
const BALLS = new THREE.InstancedMesh(GEO, MAT, COUNT);
BALLS.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
scene.add(BALLS);

// 位置・速度（XYZ をフラット配列で管理）
const pos = new Float32Array(COUNT * 3);
const vel = new Float32Array(COUNT * 3);

// 初期化：重なりを避けつつランダム配置
function rand(min, max) { return min + Math.random() * (max - min); }
for (let i = 0; i < COUNT; i++) {
  // 位置
  let placed = false;
  let px = 0, py = 0, pz = 0;
  while (!placed) {
    px = rand(-half + R, half - R);
    py = rand(-half + R, half - R);
    pz = rand(-half + R, half - R);
    placed = true;
    for (let j = 0; j < i; j++) {
      const j3 = j * 3;
      const dx = px - pos[j3 + 0];
      const dy = py - pos[j3 + 1];
      const dz = pz - pos[j3 + 2];
      if (dx*dx + dy*dy + dz*dz < (2*R)*(2*R)) { placed = false; break; }
    }
  }
  const i3 = i * 3;
  pos[i3 + 0] = px;
  pos[i3 + 1] = py;
  pos[i3 + 2] = pz;

  // 速度（ほどよい速度で）
  vel[i3 + 0] = rand(-1.0, 1.0);
  vel[i3 + 1] = rand(-1.0, 1.0);
  vel[i3 + 2] = rand(-1.0, 1.0);
}

// 壁反射（完全弾性）
function reflectWalls(i3) {
  // 位置更新後に壁で反射。侵入した分は押し戻す。
  for (let axis = 0; axis < 3; axis++) {
    const p = pos[i3 + axis];
    const v = vel[i3 + axis];
    const limit = half - R;
    if (p > limit) { pos[i3 + axis] = limit; vel[i3 + axis] = -Math.abs(v); }
    else if (p < -limit) { pos[i3 + axis] = -limit; vel[i3 + axis] = Math.abs(v); }
  }
}

// 球-球の弾性衝突（同質量の簡易モデル）
function collidePairs(dt) {
  const minDist = 2 * R;
  const minDist2 = minDist * minDist;
  for (let i = 0; i < COUNT; i++) {
    const i3 = i * 3;
    const ix = pos[i3], iy = pos[i3 + 1], iz = pos[i3 + 2];
    for (let j = i + 1; j < COUNT; j++) {
      const j3 = j * 3;
      const dx = pos[j3] - ix;
      const dy = pos[j3 + 1] - iy;
      const dz = pos[j3 + 2] - iz;
      const d2 = dx*dx + dy*dy + dz*dz;
      if (d2 < minDist2 && d2 > 1e-9) {
        const d = Math.sqrt(d2);
        // 法線
        const nx = dx / d, ny = dy / d, nz = dz / d;

        // オーバーラップ分を押し戻す（半分ずつ）
        const overlap = (minDist - d);
        const push = overlap * 0.5 + 1e-4; // 少し余裕を持たせる
        pos[i3]     -= nx * push;
        pos[i3 + 1] -= ny * push;
        pos[i3 + 2] -= nz * push;
        pos[j3]     += nx * push;
        pos[j3 + 1] += ny * push;
        pos[j3 + 2] += nz * push;

        // 速度の法線成分を交換（同質量・完全弾性の近似）
        const vin = vel[i3]*nx + vel[i3+1]*ny + vel[i3+2]*nz;
        const vjn = vel[j3]*nx + vel[j3+1]*ny + vel[j3+2]*nz;

        const ivx = vel[i3]   - vin*nx;
        const ivy = vel[i3+1] - vin*ny;
        const ivz = vel[i3+2] - vin*nz;
        const jvx = vel[j3]   - vjn*nx;
        const jvy = vel[j3+1] - vjn*ny;
        const jvz = vel[j3+2] - vjn*nz;

        // 法線成分を入れ替え
        vel[i3]   = ivx + vjn*nx;
        vel[i3+1] = ivy + vjn*ny;
        vel[i3+2] = ivz + vjn*nz;
        vel[j3]   = jvx + vin*nx;
        vel[j3+1] = jvy + vin*ny;
        vel[j3+2] = jvz + vin*nz;
      }
    }
  }
}

// InstancedMesh へ座標を反映
const dummy = new THREE.Object3D();
function syncInstances() {
  for (let i = 0; i < COUNT; i++) {
    const i3 = i * 3;
    dummy.position.set(pos[i3], pos[i3+1], pos[i3+2]);
    // ほんの少し回しておくと見栄えが良い（任意）
    dummy.rotation.y += 0.01;
    dummy.updateMatrix();
    BALLS.setMatrixAt(i, dummy.matrix);
  }
  BALLS.instanceMatrix.needsUpdate = true;
}

// -------- ループ（固定ステップ 30fps / 軽量） --------
let raf = 0, last = performance.now(), acc = 0;
const STEP = 1000 / 20;     // 20fps
const SPEED = 0.1;          // 速度スケール（好みで）
function loop(now) {
  raf = requestAnimationFrame(loop);
  acc += (now - last); last = now;

  while (acc >= STEP) {
    const dt = (STEP / 1000) * SPEED;

    //立方体の回転
    box.rotation.x += 0.0008;
    box.rotation.y -= 0.0012;

    //球体の位置更新
    for (let i = 0; i < COUNT; i++) {
      const i3 = i * 3;
      pos[i3]     += vel[i3]   * dt;
      pos[i3 + 1] += vel[i3+1] * dt;
      pos[i3 + 2] += vel[i3+2] * dt;
      reflectWalls(i3);
    }

    // 球-球衝突
    collidePairs(dt);

    acc -= STEP;
  }

  syncInstances();
  renderer.render(scene, camera);
}
raf = requestAnimationFrame(loop);

// リサイズ
function fit() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w/h;
  camera.updateProjectionMatrix();
}
window.addEventListener("resize", fit);

// タブ非表示で停止（省電力）
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") {
    cancelAnimationFrame(raf);
  } else {
    last = performance.now(); acc = 0;
    raf = requestAnimationFrame(loop);
  }
});
