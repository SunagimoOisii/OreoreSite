// bg.js
// 背景アニメーション：立方体内で球が跳ね回るシンプルなデモ
// - 既存の #bg-canvas 要素へ描画
// - 壁との反射と球同士の弾性衝突を実装

import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { createRenderer, fitToCanvas } from "./lib/renderer.js";
import { runFixedStepLoop } from "./lib/utils.js";
import { BgPhysics } from "./lib/bgPhysics.js";

const canvas = document.getElementById("bg-canvas");
if (!canvas)
{
  console.warn("[bg] #bg-canvas not found");
}

// -------- 基本セットアップ（軽量・レトロ寄せ） --------
const cfg = { PS1_MODE: true, INTERNAL_SCALE: 1 };
const renderer = createRenderer(THREE, canvas, cfg, {
  antialias: false, // 粗さを残す
  powerPreference: "low-power",
});
renderer.shadowMap.enabled = false;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
    35,
    window.innerWidth / window.innerHeight,
    0.1,
    100);
camera.position.set(0, 0, 12);

// 簡易ライト（MeshNormalMaterial なら不要。標準材用に薄く）
const amb = new THREE.AmbientLight(0xffffff, 0.5);
const dir = new THREE.DirectionalLight(0xffffff, 0.6);
dir.position.set(1, 2, 3);
scene.add(amb, dir);
 
// -------- 設定 --------
const physicsCfg = {
  bounds: 4.0, // 立方体の一辺
  count: 24, // 球の数（20〜40くらいが見栄えと負荷のバランス◎）
  radius: 0.1, // 半径
  speed: 0.1, // 速度スケール
};

// -------- 立方体ワイヤーフレーム（枠） --------
const boxGeo = new THREE.BoxGeometry(physicsCfg.bounds, physicsCfg.bounds, physicsCfg.bounds);
const edges = new THREE.EdgesGeometry(boxGeo);
const lineMat = new THREE.LineBasicMaterial({ color: 0x666666, transparent: true, opacity: 0.7 });
const box = new THREE.LineSegments(edges, lineMat);
scene.add(box);
 
// -------- 球（InstancedMesh で高速＆省メモリ） --------
const GEO = new THREE.SphereGeometry(physicsCfg.radius, 16, 12); // 低ポリ
// ※色は固定。減色やランダム色にしたければ THREE.InstancedMesh#setColorAt を使う
const MAT = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  metalness: 0.1,
  roughness: 0.6,
});
const BALLS = new THREE.InstancedMesh(GEO, MAT, physicsCfg.count);
BALLS.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
scene.add(BALLS);

// -------- 物理 --------
const physics = new BgPhysics(THREE, BALLS, physicsCfg);

// -------- ループ（固定ステップ 20fps / 軽量） --------
const STEP = 1000 / 20; // 20fps
runFixedStepLoop(
  STEP,
  (dt) =>
  {
    // 立方体の回転
    box.rotation.x += 0.0008;
    box.rotation.y -= 0.0012;

    // 物理更新
    physics.step(dt);
  },
  () =>
  {
    physics.sync();
    renderer.render(scene, camera);
  }
);

// リサイズ
function fit()
{
  fitToCanvas(renderer, canvas, cfg);
  const rect = canvas.getBoundingClientRect();
  camera.aspect = rect.width / rect.height;
  camera.updateProjectionMatrix();
}
window.addEventListener("resize", fit);
fit();
