// src/features/background/controller.js
// 背景機能のコントローラ（three.js 初期化・更新・簡易API）

import * as THREE_NS from 'three';
import { createThreeApp } from '@core/app.js';

// モジュールスコープの状態
let appHandle = null;
let lastThree = THREE_NS;
let scene, camera, renderer;
let grid;
let polyGroup;
let currentShape = 'ico';
let inst;                // InstancedMesh（内側の小キューブ）
let instCount = 24;
const INST_MAX = 120;
const seeds = [];
const dummy = new THREE_NS.Object3D();
let elapsed = 0;
const INNER_Y_OFFSET = 1.0;

// 更新レート(Hz)
let POLY_FPS = 20;
let GRID_FPS = 24;
let INNER_FPS = 15;

// 汎用ステッパ（ローカルのみ・外部公開しない）
function makeStepper(getHz)
{
  let acc = 0;
  return {
    tick(dt, onStep)
    {
      const hz = getHz?.() ?? 0;
      if (!(hz > 0)) return;
      const step = 1 / hz;
      acc += dt;
      while (acc >= step)
      {
        onStep(step);
        acc -= step;
      }
    },
    reset() { acc = 0; }
  };
}
const polyStep = makeStepper(() => POLY_FPS);
const gridStep  = makeStepper(() => GRID_FPS);
const innerStep = makeStepper(() => INNER_FPS);

function disposeObject(obj)
{
  if (!obj) return;
  obj.traverse?.((o) =>
  {
    o.geometry?.dispose?.();
    o.material?.dispose?.();
  });
}

function disposeSceneObjects()
{
  try { if (polyGroup) { polyGroup.parent?.remove(polyGroup); disposeObject(polyGroup); } } catch {}
  try { if (grid)      { grid.parent?.remove(grid);       disposeObject(grid); } } catch {}
  try { if (inst)      { inst.parent?.remove(inst);       disposeObject(inst); } } catch {}
  polyGroup = undefined; grid = undefined; inst = undefined;
}

// 内側 Instanced を必要時に生成（初回のみ）
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

// 外側ワイヤーポリゴンの生成と差し替え
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
    obj = new THREE.Group(); obj.add(ring1, ring2);
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

function createGrid(THREE, s)
{
  grid = new THREE.GridHelper(120, 80, 0x335555, 0x224444);
  const mats = Array.isArray(grid.material) ? grid.material : [grid.material];
  mats.forEach((m) => { m.opacity = 0.28; m.transparent = true; });
  grid.position.y = -2.0; s.add(grid);
}

function updatePoly(dt)
{
  if (!polyGroup) return;
  polyStep.tick(dt, (step) =>
  {
    polyGroup.rotation.y += 0.18 * step;
    polyGroup.rotation.x += 0.05 * step;
  });
}

function updateGrid(dt)
{
  if (!grid) return;
  gridStep.tick(dt, (step) => { grid.rotation.y += 0.015 * step; });
}

function updateInner(dt)
{
  if (!inst) return;
  let updated = false;
  innerStep.tick(dt, (step) => { elapsed += step; updated = true; });
  if (!updated) return;
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

export function start({ THREE = THREE_NS, canvas, cfg, fps, usePost = true } = {})
{
  if (!canvas) { console.warn('[background] canvas not found'); return { stop() {} }; }
  if (fps) setBackgroundFPS(fps);
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
      createGrid(THREE, s);
      makeWirePoly(THREE, currentShape);
    },
    update: (dt) =>
    {
      if (prefersReduced) return;
      updatePoly(dt);
      updateGrid(dt);
      updateInner(dt);
    },
    render: ({ renderer: r, scene: s, camera: c }) => { r.render(s, c); }
  });

  appHandle = handle;
  return { stop: () => { try { appHandle?.dispose?.(); } catch {} try { disposeSceneObjects(); } catch {} } };
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
export const toggleSphereMode = switchToSphereMode;

export function setBackgroundFPS({ poly, inner, grid } = {})
{
  if (typeof poly === 'number') POLY_FPS = poly;
  if (typeof inner === 'number') INNER_FPS = inner;
  if (typeof grid === 'number') GRID_FPS = grid;
  polyStep.reset(); gridStep.reset(); innerStep.reset();
}

