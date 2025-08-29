// src/features/background/controller.js
// 背景機能のコントローラ: three.js の初期化と更新ループ、
// UI から操作するための公開 API をここに集約します。

import * as THREE_NS from 'three';
import { createThreeApp } from '../../core/app.js';

// 内部状態（モジュールスコープ）
let appHandle = null;
let lastThree = THREE_NS;
let scene, camera, renderer;
let grid;
let polyGroup;
let currentShape = 'ico';
let inst;                // 内側のオブジェクト用 InstancedMesh
let instCount = 24;
const INST_MAX = 120;
const seeds = [];
const dummy = new THREE_NS.Object3D();
let elapsed = 0;
const INNER_Y_OFFSET = 1.0;

// FPS（サブシステムごとの更新レート）
let POLY_FPS = 20;   // ワイヤーフレーム形状の回転
let GRID_FPS = 24;   // グリッドの回転
let INNER_FPS = 15;  // 内側 Instanced の移動

// 固定ステップ処理用アキュムレータ
let accPoly = 0;
let accGrid = 0;
let accInner = 0;

function disposeObject(obj)
{
  if (!obj) return;
  obj.traverse?.((o) =>
  {
    o.geometry?.dispose?.();
    o.material?.dispose?.();
  });
}

// 内側の Instanced オブジェクト群を生成（初回のみ）
function ensureInnerObjects(THREE)
{
  if (inst) return;
  const geo = new THREE.BoxGeometry(0.08, 0.08, 0.08);
  const mat = new THREE.MeshBasicMaterial({ color: 0x224444, transparent: true, opacity: 0.65 });
  inst = new THREE.InstancedMesh(geo, mat, INST_MAX);
  inst.count = instCount;
  polyGroup.add(inst);

  for (let i = 0; i < INST_MAX; i++)
  {
    seeds[i] = {
      a0: Math.random() * Math.PI * 2,
      b0: Math.random() * Math.PI * 2,
      sa: 0.4 + Math.random() * 0.6,
      sb: 0.2 + Math.random() * 0.5,
      r0: 0.35 + Math.random() * 0.75,
      rr: 0.06 + Math.random() * 0.10,
      spin: (Math.random() * 1.5)
    };
  }
}

// 外側のワイヤーフレーム形状を生成・差し替え
function makeWirePoly(THREE, shape = 'ico')
{
  if (polyGroup)
  {
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
  else
  {
    const geo = new THREE.TetrahedronGeometry(2.0, 0);
    obj = new THREE.LineSegments(new THREE.WireframeGeometry(geo), mat);
  }

  obj.position.set(0, 1.25, 0);
  polyGroup.add(obj);
  scene.add(polyGroup);

  if (inst)
  {
    scene.remove(inst);
    polyGroup.add(inst);
  }

  ensureInnerObjects(THREE);
}

/**
 * 背景シーンを開始します。
 * @param {Object} opts
 * @param {typeof import('three')} opts.THREE three モジュール
 * @param {HTMLCanvasElement} opts.canvas 描画先キャンバス
 * @param {object} opts.cfg グラフィクス系設定
 * @param {{poly?:number,grid?:number,inner?:number}} [opts.fps] 各サブ系の更新レート(Hz)
 * @param {boolean} [opts.usePost=true] ポストプロセスを有効化
 */
export function start({ THREE = THREE_NS, canvas, cfg, fps, usePost = true } = {})
{
  if (!canvas) {
    console.warn('[background] canvas not found');
    return { stop() {} };
  }
  if (fps)
    setBackgroundFPS(fps);
  lastThree = THREE;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const handle = createThreeApp(THREE, {
    canvas,
    cfg,
    fixedStep: 1000 / 30,
    useControls: false,
    usePost: usePost,
    rendererOpts: { antialias: true, powerPreference: 'low-power', alpha: true },
    createScene: () =>
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

      // 床グリッド
      grid = new THREE.GridHelper(120, 80, 0x335555, 0x224444);
      const mats = Array.isArray(grid.material) ? grid.material : [grid.material];
      mats.forEach((m) => { m.opacity = 0.28; m.transparent = true; });
      grid.position.y = -2.0;
      s.add(grid);

      makeWirePoly(THREE, currentShape);
    },
    update: (dt) =>
    {
      if (prefersReduced) return;

      // ワイヤーフレームの回転更新
      if (polyGroup && POLY_FPS !== 0)
      {
        const step = (POLY_FPS && POLY_FPS > 0) ? (1 / POLY_FPS) : dt;
        accPoly += dt;
        while (accPoly >= step)
        {
          polyGroup.rotation.y += 0.18 * step;
          polyGroup.rotation.x += 0.05 * step;
          accPoly -= step;
        }
      }

      // グリッドの回転更新
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

      // 内側 Instanced の位置更新
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
          const limitR = (currentShape === 'ico') ? 0.8 : 0.65;
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

  appHandle = handle;
  return { stop: () => { try { appHandle?.dispose?.(); } catch {} } };
}

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
  makeWirePoly(lastThree, currentShape);
}

// 互換エイリアス（ドキュメント側の表記に合わせる）
export const toggleSphereMode = switchToSphereMode;

/**
 * 背景の更新レートを設定します。0 以下で各サブシステムを停止。
 */
export function setBackgroundFPS({ poly, inner, grid } = {})
{
  if (typeof poly === 'number') POLY_FPS = poly;
  if (typeof inner === 'number') INNER_FPS = inner;
  if (typeof grid === 'number') GRID_FPS = grid;
  accPoly = accGrid = accInner = 0;
}
