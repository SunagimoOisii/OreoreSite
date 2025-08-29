// background.js
// 背景アニメーション実装（共通ブートで簡潔に）

import * as THREE from "three";
import { createThreeApp } from "../core/app.js";
import { BackgroundPhysics } from "../features/background/physics.js";

const canvas = document.getElementById("bg-canvas");
if (!canvas) console.warn("[bg] #bg-canvas not found");

// -------- 設定 --------
const cfg = { PS1_MODE: true, INTERNAL_SCALE: 1 };

// ライト/境界/インスタンス等はモジュールスコープで保持
const amb = new THREE.AmbientLight(0xffffff, 0.5);
const dir = new THREE.DirectionalLight(0xffffff, 0.6);
dir.position.set(1, 2, 3);

const physicsCfg = {
  bounds: 4.0,   // 空間の一辺
  count: 24,     // ボール数
  maxCount: 60,  // 最大
  radius: 0.1,   // 半径
  speed: 0.1,    // 速度スケール
};

// 枠（初期は立方体のエッジ）
const boxGeo = new THREE.BoxGeometry(physicsCfg.bounds, physicsCfg.bounds, physicsCfg.bounds);
const edges = new THREE.EdgesGeometry(boxGeo);
const lineMat = new THREE.LineBasicMaterial({ color: 0x666666, transparent: true, opacity: 0.7 });
let boundsObj = new THREE.LineSegments(edges, lineMat);

// ボール（InstancedMesh）
const GEO = new THREE.SphereGeometry(physicsCfg.radius, 16, 12);
const MAT = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.1, roughness: 0.6 });
let BALLS = new THREE.InstancedMesh(GEO, MAT, physicsCfg.maxCount);
BALLS.count = physicsCfg.count;
BALLS.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

let physics;
let scene, camera, renderer;

createThreeApp(THREE, {
  canvas,
  cfg,
  fixedStep: 1000 / 20, // 20fps 固定
  useControls: false,
  usePost: false,
  rendererOpts: { antialias: false, powerPreference: "low-power" },
  createScene: (THREE) =>
  {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.set(0, 0, 12);
    return { scene, camera };
  },
  init: ({ renderer: r, scene: s }) =>
  {
    renderer = r; scene = s;
    renderer.shadowMap.enabled = false;
    s.add(amb, dir);
    s.add(boundsObj);
    s.add(BALLS);
    physics = new BackgroundPhysics(THREE, BALLS, physicsCfg);
  },
  update: (dt) =>
  {
    // 枠の回転
    boundsObj.rotation.x += 0.0008;
    boundsObj.rotation.y -= 0.0012;
    // 物理更新
    physics.step(dt);
  },
  render: ({ renderer: r, scene: s, camera: c }) =>
  {
    physics.sync();
    r.render(s, c);
  }
});

/** 背景のボールを増やす */
export function increaseBalls()
{
  physics.addBall();
}

/** 背景のボールを減らす */
export function decreaseBalls()
{
  physics.removeBall();
}

/** 枠を球体モードに切り替える（お遊び機能） */
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

  // 既存の物理インスタンスを活かし、モード切替とメッシュ差し替えを行う
  physics.attachMesh(BALLS);
  physics.setMode('sphere');
}
