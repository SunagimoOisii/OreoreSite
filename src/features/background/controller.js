// src/features/background/controller.js
// 背景機能のコントローラ（three.js 初期化・更新・簡易API）

import * as THREE_NS from 'three';
import { createThreeApp } from '@core/app.js';
import { BACKGROUND_DEFAULTS } from './config.js';

const MIN_INNER_RADIUS = 0.4;
const SHAPE_RADIUS_LIMITS = {
  ico: 0.8,
  default: 0.65
};

function getShapeRadiusLimit(shape)
{
  return SHAPE_RADIUS_LIMITS[shape] ?? SHAPE_RADIUS_LIMITS.default;
}

// Inner instanced cubes orbit with a soft wobble; isolate the math for readability.
function computeInnerTransform({ seed, elapsedSeconds, shape, instanceIndex, innerYOffset })
{
  const angleAround = seed.a0 + elapsedSeconds * seed.sa;
  const angleTilt = seed.b0 + elapsedSeconds * seed.sb;
  const wobble = Math.sin(elapsedSeconds * 0.8 + instanceIndex) * seed.rr;
  const baseRadius = seed.r0 + wobble;
  const limitedRadius = Math.min(getShapeRadiusLimit(shape), Math.max(MIN_INNER_RADIUS, baseRadius));

  const sinTilt = Math.sin(angleTilt);
  const cosTilt = Math.cos(angleTilt);
  const sinAround = Math.sin(angleAround);
  const cosAround = Math.cos(angleAround);

  return {
    position: {
      x: limitedRadius * sinTilt * cosAround,
      y: limitedRadius * cosTilt * 0.6 + innerYOffset,
      z: limitedRadius * sinTilt * sinAround
    },
    rotation: {
      x: angleAround * 0.5,
      y: angleTilt * 0.5,
      z: (angleAround + angleTilt) * 0.25
    }
  };
}

class BackgroundController
{
  constructor(THREE, defaults = BACKGROUND_DEFAULTS)
  {
    this.THREE = THREE || THREE_NS;
    this.defaults = defaults;
    this.appHandle = null;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.grid = null;
    this.polyGroup = null;
    this.currentShape = 'ico';
    this.inst = null;
    this.instCount = 24;
    this.seeds = [];
    this.dummy = new this.THREE.Object3D();
    this.elapsed = 0;
    this.fps = { ...defaults.FPS };
    this.lastCanvas = null;
    this.lastCfg = null;
    this.lastUsePost = true;

    const makeStepper = (getHz) =>
    {
      let acc = 0; return {
        tick: (dt, onStep) => { const hz = getHz() || 0; if (!(hz > 0)) return; const step = 1 / hz; acc += dt; while (acc >= step) { onStep(step); acc -= step; } },
        reset: () => { acc = 0; }
      };
    };
    this.polyStep = makeStepper(() => this.fps.poly);
    this.gridStep = makeStepper(() => this.fps.grid);
    this.innerStep = makeStepper(() => this.fps.inner);
  }

  disposeObject(obj)
  {
    if (!obj) return;
    obj.traverse?.((o) => { o.geometry?.dispose?.(); o.material?.dispose?.(); });
  }

  disposeSceneObjects()
  {
    try { if (this.polyGroup) { this.polyGroup.parent?.remove(this.polyGroup); this.disposeObject(this.polyGroup); } } catch {}
    try { if (this.grid)      { this.grid.parent?.remove(this.grid);         this.disposeObject(this.grid); } } catch {}
    try { if (this.inst)      { this.inst.parent?.remove(this.inst);         this.disposeObject(this.inst); } } catch {}
    this.polyGroup = this.grid = this.inst = null;
  }

  ensureInnerObjects()
  {
    if (this.inst) return;
    const THREE = this.THREE;
    const geo = new THREE.BoxGeometry(0.08, 0.08, 0.08);
    const mat = new THREE.MeshBasicMaterial({ color: 0x224444, transparent: true, opacity: 0.65 });
    this.inst = new THREE.InstancedMesh(geo, mat, this.defaults.INST_MAX);
    this.inst.count = this.instCount;
    this.polyGroup.add(this.inst);
    for (let i = 0; i < this.defaults.INST_MAX; i++)
    {
      this.seeds[i] = {
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

  makeWirePoly(shape = 'ico')
  {
    const THREE = this.THREE;
    if (this.polyGroup)
    {
      if (this.inst && this.polyGroup.children.includes(this.inst))
      {
        this.polyGroup.remove(this.inst);
        this.scene.add(this.inst);
      }
      const old = this.polyGroup; this.polyGroup = null; old.parent?.remove(old); this.disposeObject(old);
    }

    this.polyGroup = new THREE.Group();
    let obj; const mat = new THREE.LineBasicMaterial({ color: 0xfe4040, transparent: true, opacity: 0.55 });
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
      const ring2 = new THREE.LineLoop(geo, mat); ring2.rotation.x = Math.PI / 2;
      obj = new THREE.Group(); obj.add(ring1, ring2);
    }
    else
    {
      const geo = new THREE.TetrahedronGeometry(2.0, 0);
      obj = new THREE.LineSegments(new THREE.WireframeGeometry(geo), mat);
    }
    obj.position.set(0, 1.25, 0);
    this.polyGroup.add(obj);
    this.scene.add(this.polyGroup);
    if (this.inst) { this.scene.remove(this.inst); this.polyGroup.add(this.inst); }
    this.ensureInnerObjects();
  }

  createGrid(scene)
  {
    const THREE = this.THREE;
    this.grid = new THREE.GridHelper(120, 80, 0x335555, 0x224444);
    const mats = Array.isArray(this.grid.material) ? this.grid.material : [this.grid.material];
    mats.forEach((m) => { m.opacity = 0.28; m.transparent = true; });
    this.grid.position.y = -2.0; scene.add(this.grid);
  }

  updatePoly(dt)
  {
    if (!this.polyGroup) return;
    this.polyStep.tick(dt, (step) =>
    {
      this.polyGroup.rotation.y += 0.18 * step;
      this.polyGroup.rotation.x += 0.05 * step;
    });
  }
  updateGrid(dt)
  {
    if (!this.grid) return;
    this.gridStep.tick(dt, (step) => { this.grid.rotation.y += 0.015 * step; });
  }
  updateInner(dt)
  {
    if (!this.inst) return;

    let advanced = false;
    this.innerStep.tick(dt, (step) =>
    {
      this.elapsed += step;
      advanced = true;
    });
    if (!advanced) return;

    const innerYOffset = this.defaults.INNER_Y_OFFSET;
    for (let instanceIndex = 0; instanceIndex < this.inst.count; instanceIndex++)
    {
      const seed = this.seeds[instanceIndex];
      const { position, rotation } = computeInnerTransform({
        seed,
        elapsedSeconds: this.elapsed,
        shape: this.currentShape,
        instanceIndex,
        innerYOffset
      });

      this.dummy.position.set(position.x, position.y, position.z);
      this.dummy.rotation.set(rotation.x, rotation.y, rotation.z);
      this.dummy.updateMatrix();
      this.inst.setMatrixAt(instanceIndex, this.dummy.matrix);
    }

    this.inst.instanceMatrix.needsUpdate = true;
  }

  start({ canvas, cfg, fps, usePost = true })
  {
    if (!canvas) { console.warn('[background] canvas not found'); return { stop() {} }; }
    if (fps) this.setFPS(fps);
    this.lastCanvas = canvas;
    this.lastCfg = cfg;
    this.lastUsePost = !!usePost;
    const THREE = this.THREE;
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
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(40, 1, 0.1, 300);
        this.camera.position.set(0, 4.5, 10); this.camera.lookAt(0, 0.5, 0);
        return { scene: this.scene, camera: this.camera };
      },
      init: ({ renderer: r, scene: s }) =>
      {
        this.renderer = r; this.scene = s; this.renderer.shadowMap.enabled = false; this.createGrid(s); this.makeWirePoly(this.currentShape);
      },
      update: (dt) => { if (prefersReduced) return; this.updatePoly(dt); this.updateGrid(dt); this.updateInner(dt); },
      render: ({ renderer: r, scene: s, camera: c }) => { r.render(s, c); }
    });
    this.appHandle = handle;
    return { stop: () => this.stop() };
  }

  stop()
  {
    try { this.appHandle?.dispose?.(); } catch {}
    this.appHandle = null;
    try { this.disposeSceneObjects(); } catch {}
  }

  increaseBalls() { if (!this.inst) return; this.instCount = Math.min(this.defaults.INST_MAX, this.instCount + 1); this.inst.count = this.instCount; }
  decreaseBalls() { if (!this.inst) return; this.instCount = Math.max(0, this.instCount - 1); this.inst.count = this.instCount; }
  switchToSphereMode() { this.currentShape = (this.currentShape === 'ico') ? 'ring' : 'ico'; this.makeWirePoly(this.currentShape); }
  toggleSphereMode() { this.switchToSphereMode(); }
  setFPS({ poly, inner, grid } = {}) { if (typeof poly === 'number') this.fps.poly = poly; if (typeof inner === 'number') this.fps.inner = inner; if (typeof grid === 'number') this.fps.grid = grid; this.polyStep.reset(); this.gridStep.reset(); this.innerStep.reset(); }

  reconfigure({ cfg = this.lastCfg, usePost = this.lastUsePost } = {})
  {
    if (!this.lastCanvas)
    {
      console.warn('[background] reconfigure called before start');
      return;
    }
    try { this.stop(); } catch {}
    this.start({ canvas: this.lastCanvas, cfg, usePost, fps: this.fps });
  }
}

// 互換レイヤ（既存の関数API）
let singleton = null;
let lastThree = THREE_NS;
function getInstance(THREE) { if (!singleton) singleton = new BackgroundController(THREE || lastThree || THREE_NS); return singleton; }

export function start({ THREE = THREE_NS, canvas, cfg, fps, usePost = true } = {})
{
  lastThree = THREE || THREE_NS;
  try { singleton?.stop?.(); } catch {}
  singleton = new BackgroundController(lastThree);
  return singleton.start({ canvas, cfg, fps, usePost });
}

export function increaseBalls() { getInstance().increaseBalls(); }
export function decreaseBalls() { getInstance().decreaseBalls(); }
export function switchToSphereMode() { getInstance().switchToSphereMode(); }
export const toggleSphereMode = switchToSphereMode;
export function setBackgroundFPS({ poly, inner, grid } = {}) { getInstance().setFPS({ poly, inner, grid }); }
export function restartBackground({ cfg, usePost } = {}) { getInstance().reconfigure({ cfg, usePost }); }

export { BackgroundController };

