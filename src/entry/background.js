// background.js
// 背景アニメーション：立方体内で球が跳ね回るシンプルなデモ
// - 既存の #bg-canvas 要素へ描画
// - 壁との反射と球同士の弾性衝突を実装

import * as THREE from "three";
import { createRenderer, setupResize } from "../core/renderer.js";
import { runFixedStepLoop } from "../core/loop.js";
import { BackgroundPhysics } from "../features/background/physics.js";

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
  count: 24, // 初期の球の数（20〜40くらいが見栄えと負荷のバランス◎）
  maxCount: 60, // 最大の球の数
  radius: 0.1, // 半径
  speed: 0.1, // 速度スケール
};

// -------- 枠（初期は立方体） --------
const boxGeo = new THREE.BoxGeometry(physicsCfg.bounds, physicsCfg.bounds, physicsCfg.bounds);
const edges = new THREE.EdgesGeometry(boxGeo);
const lineMat = new THREE.LineBasicMaterial({ color: 0x666666, transparent: true, opacity: 0.7 });
let boundsObj = new THREE.LineSegments(edges, lineMat);
scene.add(boundsObj);
 
// -------- 球（InstancedMesh で高速＆省メモリ） --------
const GEO = new THREE.SphereGeometry(physicsCfg.radius, 16, 12); // 低ポリ
// ※色は固定。減色やランダム色にしたければ THREE.InstancedMesh#setColorAt を使う
const MAT = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  metalness: 0.1,
  roughness: 0.6,
});
let BALLS = new THREE.InstancedMesh(GEO, MAT, physicsCfg.maxCount);
BALLS.count = physicsCfg.count;
BALLS.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
scene.add(BALLS);

// -------- 物理 --------
let physics = new BackgroundPhysics(THREE, BALLS, physicsCfg);

// -------- ループ（固定ステップ 20fps / 軽量） --------
const STEP = 1000 / 20; // 20fps
runFixedStepLoop(
  STEP,
  (dt) =>
  {
    // 枠の回転
    boundsObj.rotation.x += 0.0008;
    boundsObj.rotation.y -= 0.0012;

    // 物理更新
    physics.step(dt);
  },
  () =>
  {
    physics.sync();
    renderer.render(scene, camera);
  }
);

// リサイズ処理の設定
setupResize(renderer, canvas, camera, cfg);

/** 背景の球を増やす */
export function increaseBalls()
{
  physics.addBall();
}

/** 背景の球を減らす */
export function decreaseBalls()
{
  physics.removeBall();
}

/** 枠を球体にし群体を立方体化する */
export function switchToSphereMode()
{
  scene.remove(boundsObj);

  const radius = physicsCfg.bounds / 2;
  const points = new THREE.Path().absarc(0, 0, radius, 0, Math.PI * 2).getSpacedPoints(64);
  const geo = new THREE.BufferGeometry().setFromPoints(points);
  const ring1 = new THREE.LineLoop(geo, lineMat);
  const ring2 = new THREE.LineLoop(geo, lineMat);
  ring2.rotation.x = Math.PI / 2;
  boundsObj = new THREE.Group();
  boundsObj.add(ring1, ring2);
  scene.add(boundsObj);

  scene.remove(BALLS);
  const cubeGeo = new THREE.BoxGeometry(physicsCfg.radius * 2, physicsCfg.radius * 2, physicsCfg.radius * 2);
  BALLS = new THREE.InstancedMesh(cubeGeo, MAT, physicsCfg.maxCount);
  BALLS.count = physicsCfg.count;
  BALLS.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  scene.add(BALLS);

  physics = new BackgroundPhysics(THREE, BALLS, { ...physicsCfg, mode: 'sphere' });
}

