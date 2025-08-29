// background.js
// サイト全体の背景: 遠近グリッド + ワイヤーフレーム多面体（軽量）

import * as THREE from 'three';
import { createThreeApp } from '../core/app.js';
import { CONFIG } from '../core/config.js';

const canvas = document.getElementById('bg-canvas');
if (!canvas) console.warn('[bg] #bg-canvas not found');

// -------- 設定 --------
const cfg = { ...CONFIG, PS1_MODE: true, CA_ENABLED: false };

// ---- 個別FPS（Hz）設定: 0以下で停止、null/undefinedでループ依存（既定=30）
let POLY_FPS = 20;   // 多面体の回転更新レート
let GRID_FPS = 24;   // 遠近グリッドの回転更新レート
let INNER_FPS = 15;  // 内部キューブ群の軌道更新レート

// 内部用の時間アキュムレータ
let accPoly = 0;
let accGrid = 0;
let accInner = 0;

let scene, camera, renderer;
let grid;            // 遠近グリッド（GridHelper）
let polyGroup; // 形状を差し替えるためのグループ
let currentShape = 'ico';
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
// 内部オブジェクト（小さな図形群）
let inst;              // InstancedMesh
let instCount = 24;    // 現在の個数
const INST_MAX = 120;  // 上限
const seeds = [];      // それぞれの軌道用シード
const dummy = new THREE.Object3D();
let elapsed = 0;       // 経過時間（秒）
const INNER_Y_OFFSET = 1.0; // 内部キューブ群の中心を外殻の中心に合わせる

function disposeObject(obj)
{
  if (!obj) return;
  obj.traverse?.((o) =>
  {
    o.geometry?.dispose?.();
    o.material?.dispose?.();
  });
}

function makeWirePoly(shape = 'ico')
{
  // 既存を破棄
  if (polyGroup)
  {
    // 先に内部インスタンスを退避して破棄対象から外す
    if (inst && polyGroup.children.includes(inst))
    {
      polyGroup.remove(inst);
      scene.add(inst);
    }
    const old = polyGroup;
    polyGroup = undefined;
    old.parent?.remove(old);
    disposeObject(old);
  }

  polyGroup = new THREE.Group();
  let obj;
  const mat = new THREE.LineBasicMaterial({ color: 0xfe4040, transparent: true, opacity: 0.55 });

  if (shape === 'ico')
  {
    const geo = new THREE.IcosahedronGeometry(1.8, 0);
    obj = new THREE.LineSegments(new THREE.WireframeGeometry(geo), mat);
  }
  else if (shape === 'ring')
  {
    const radius = 2.2;
    const points = new THREE.Path().absarc(0, 0, radius, 0, Math.PI * 2).getSpacedPoints(72);
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const ring1 = new THREE.LineLoop(geo, mat);
    const ring2 = new THREE.LineLoop(geo, mat);
    ring2.rotation.x = Math.PI / 2;
    obj = new THREE.Group();
    obj.add(ring1, ring2);
  }
  else // fallback (tetra)
  {
    const geo = new THREE.TetrahedronGeometry(2.0, 0);
    obj = new THREE.LineSegments(new THREE.WireframeGeometry(geo), mat);
  }

  obj.position.set(0, 1.25, 0);
  polyGroup.add(obj);
  scene.add(polyGroup);
  // 既に内部オブジェクトがあるなら戻す
  if (inst)
  {
    scene.remove(inst);
    polyGroup.add(inst);
  }
  // 内部の図形群をポリグループ配下に保持（外側と一緒に回転）
  ensureInnerObjects();
}

function ensureInnerObjects()
{
  if (inst) return;
  // 小さなキューブの群（初期は控えめサイズ）
  const geo = new THREE.BoxGeometry(0.08, 0.08, 0.08);
  const mat = new THREE.MeshBasicMaterial({ color: 0x224444, transparent: true, opacity: 0.65 });
  inst = new THREE.InstancedMesh(geo, mat, INST_MAX);
  inst.count = instCount;
  polyGroup.add(inst);

  // 軌道パラメータを仕込む
  for (let i = 0; i < INST_MAX; i++)
  {
    seeds[i] = {
      a0: Math.random() * Math.PI * 2,         // 初期位相A
      b0: Math.random() * Math.PI * 2,         // 初期位相B
      sa: 0.4 + Math.random() * 0.6,           // A方向の角速度(ラジアン/秒)
      sb: 0.2 + Math.random() * 0.5,           // B方向の角速度
      r0: 0.35 + Math.random() * 0.75,         // 基本半径（中心寄り）
      rr: 0.06 + Math.random() * 0.10,         // 半径変動幅（小さめ）
      spin: (Math.random() * 1.5)              // 自転速度
    };
  }
}

createThreeApp(THREE, {
  canvas,
  cfg,
  fixedStep: 1000 / 30, // 30fps相当で十分
  useControls: false,
  usePost: true,
  rendererOpts: { antialias: true, powerPreference: 'low-power', alpha: true },
  createScene: (THREE) =>
  {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(40, 1, 0.1, 300);
    camera.position.set(0, 4.5, 10);
    camera.lookAt(0, 0.5, 0);
    return { scene, camera };
  },
  init: ({ renderer: r, scene: s }) =>
  {
    renderer = r; scene = s;
    renderer.shadowMap.enabled = false;

    // 遠近グリッド（GridHelper）
    grid = new THREE.GridHelper(120, 80, 0x335555, 0x224444);
    const mats = Array.isArray(grid.material) ? grid.material : [grid.material];
    mats.forEach((m) => { m.opacity = 0.28; m.transparent = true; });
    grid.position.y = -2.0;
    s.add(grid);

    // 初期形状
    makeWirePoly(currentShape);
  },
  update: (dt) =>
  {
    if (prefersReduced) return; // 低モーション環境では静止

    // ---- 多面体の更新 ----
    if (polyGroup && POLY_FPS !== 0)
    {
      const step = (POLY_FPS && POLY_FPS > 0) ? (1 / POLY_FPS) : dt;
      accPoly += dt;
      while (accPoly >= step)
      {
        // 1ステップあたりの角度（rad/s を step 秒分）
        polyGroup.rotation.y += 0.18 * step;
        polyGroup.rotation.x += 0.05 * step;
        accPoly -= step;
      }
    }

    // ---- グリッドの更新 ----
    if (grid && GRID_FPS !== 0)
    {
      const step = (GRID_FPS && GRID_FPS > 0) ? (1 / GRID_FPS) : dt;
      accGrid += dt;
      while (accGrid >= step)
      {
        grid.rotation.y += 0.015 * step;
        accGrid -= step;
      }
    }

    // ---- 内部オブジェクト（InstancedMesh）更新 ----
    if (inst && INNER_FPS !== 0)
    {
      const step = (INNER_FPS && INNER_FPS > 0) ? (1 / INNER_FPS) : dt;
      accInner += dt;
      let updated = false;
      while (accInner >= step)
      {
        elapsed += step;
        updated = true;
        accInner -= step;
      }
      if (updated)
      {
        const limitR = (currentShape === 'ico') ? 0.8 : 0.65; // 収まり半径
        for (let i = 0; i < inst.count; i++)
        {
          const s = seeds[i];
          const a = s.a0 + elapsed * s.sa;
          const b = s.b0 + elapsed * s.sb;
          const r = s.r0 + Math.sin(elapsed * 0.8 + i) * s.rr;

          const cr = Math.min(limitR, Math.max(0.4, r));
          const x = cr * Math.sin(b) * Math.cos(a);
          const y = cr * Math.cos(b) * 0.6 + INNER_Y_OFFSET;
          const z = cr * Math.sin(b) * Math.sin(a);

          dummy.position.set(x, y, z);
          dummy.rotation.set(a * 0.5, b * 0.5, (a + b) * 0.25);
          dummy.updateMatrix();
          inst.setMatrixAt(i, dummy.matrix);
        }
        inst.instanceMatrix.needsUpdate = true;
      }
    }
  },
  render: ({ renderer: r, scene: s, camera: c }) =>
  {
    r.render(s, c);
  }
});

// ---- API互換（タイトルの小ネタ用） ----
export function increaseBalls()
{
  if (!inst) return;
  instCount = Math.min(INST_MAX, instCount + 1);
  inst.count = instCount;
}

export function decreaseBalls()
{
  if (!inst) return;
  instCount = Math.max(0, instCount - 1);
  inst.count = instCount;
}

export function switchToSphereMode()
{
  currentShape = (currentShape === 'ico') ? 'ring' : 'ico';
  makeWirePoly(currentShape);
  // instanced は維持。見切れないように次フレームで半径制限が反映される。
}

/**
 * 背景アニメの個別FPSを設定する（Hz）。
 * 例: setBackgroundFPS({ poly: 15, inner: 20, grid: 10 })
 * - 値 <= 0 で対象の更新を停止
 * - null/undefined は変更しない
 */
export function setBackgroundFPS({ poly, inner, grid } = {})
{
  if (typeof poly === 'number') POLY_FPS = poly;
  if (typeof inner === 'number') INNER_FPS = inner;
  if (typeof grid === 'number') GRID_FPS = grid;
  // アキュムレータはリセット（カクつきを避ける）
  accPoly = accGrid = accInner = 0;
}



