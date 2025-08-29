// src/features/background/physics.js
// 背景用の簡易物理シミュレーション（反射・衝突のみ）

/**
 * 背景用の粒子シミュレーション。
 * 位置更新と反射・衝突のみを提供します。
 */
export class BackgroundPhysics
{
  /**
   * @param {object} THREE three.js オブジェクト
    * @param {import('three').InstancedMesh} mesh 描画に使うインスタンスドメッシュ
   * @param {object} cfg 設定
   * @param {number} cfg.count 個数
   * @param {number} [cfg.maxCount] 上限
   * @param {number} cfg.bounds 箱の幅
   * @param {number} cfg.radius 粒子半径
   * @param {number} cfg.speed 速度スケール
   */
 constructor(THREE, mesh, cfg)
  {
    this.THREE = THREE;
    this.mesh = mesh;
    this.maxCount = cfg.maxCount ?? cfg.count;
    this.count = cfg.count;
    this.bounds = cfg.bounds;
    this.radius = cfg.radius;
    this.speed = cfg.speed;
    this.half = this.bounds / 2;
    this.mode = cfg.mode ?? 'cube';
    this.sphereRadius = this.half;

    this.pos = new Float32Array(this.maxCount * 3);
    this.vel = new Float32Array(this.maxCount * 3);
    this._dummy = new THREE.Object3D();

    this._init();
  }

  /** バッファと初期値をランダムに設定。 */
  _init()
  {
    for (let i = 0; i < this.count; i++)
    {
      this._placeRandom(i);
    }
  }

  /** 箱インデックスにランダム配置。 */
  _placeRandom(i)
  {
    const rand = (min, max) => min + Math.random() * (max - min);
    const r = this.radius;
    const half = this.half;
    let placed = false;
    let px = 0, py = 0, pz = 0;
    while (!placed)
    {
      const limit = half - r;
      px = rand(-limit, limit);
      py = rand(-limit, limit);
      pz = rand(-limit, limit);
      if (this.mode === 'sphere')
      {
        if (px * px + py * py + pz * pz > limit * limit) continue;
      }
      placed = true;
      for (let j = 0; j < i; j++)
      {
        const j3 = j * 3;
        const dx = px - this.pos[j3 + 0];
        const dy = py - this.pos[j3 + 1];
        const dz = pz - this.pos[j3 + 2];
        if (dx * dx + dy * dy + dz * dz < (2 * r) * (2 * r))
        {
          placed = false;
          break;
        }
      }
    }
    const i3 = i * 3;
    this.pos[i3 + 0] = px;
    this.pos[i3 + 1] = py;
    this.pos[i3 + 2] = pz;
    this.vel[i3 + 0] = rand(-1.0, 1.0);
    this.vel[i3 + 1] = rand(-1.0, 1.0);
    this.vel[i3 + 2] = rand(-1.0, 1.0);
  }

  /** 1個追加。 */
  addBall()
  {
    if (this.count >= this.maxCount) return;
    this._placeRandom(this.count);
    this.count++;
  }

  /** 1個削除。 */
  removeBall()
  {
    if (this.count <= 0) return;
    this.count--;
  }

  /** 壁/境界の反射。 */
  _reflect(i3)
  {
    if (this.mode === 'cube')
    {
      const limit = this.half - this.radius;
      for (let axis = 0; axis < 3; axis++)
      {
        const p = this.pos[i3 + axis];
        const v = this.vel[i3 + axis];
        if (p > limit)
        {
          this.pos[i3 + axis] = limit;
          this.vel[i3 + axis] = -Math.abs(v);
        }
        else if (p < -limit)
        {
          this.pos[i3 + axis] = -limit;
          this.vel[i3 + axis] = Math.abs(v);
        }
      }
    }
    else
    {
      const limit = this.sphereRadius - this.radius;
      const x = this.pos[i3];
      const y = this.pos[i3 + 1];
      const z = this.pos[i3 + 2];
      const r = Math.sqrt(x * x + y * y + z * z);
      if (r > limit)
      {
        const nx = x / r;
        const ny = y / r;
        const nz = z / r;
        this.pos[i3] = nx * limit;
        this.pos[i3 + 1] = ny * limit;
        this.pos[i3 + 2] = nz * limit;
        const vn = this.vel[i3] * nx + this.vel[i3 + 1] * ny + this.vel[i3 + 2] * nz;
        this.vel[i3] -= 2 * vn * nx;
        this.vel[i3 + 1] -= 2 * vn * ny;
        this.vel[i3 + 2] -= 2 * vn * nz;
      }
    }
  }

  /** 粒子間の衝突。 */
  _collide()
  {
    const r2 = (2 * this.radius) * (2 * this.radius);
    for (let i = 0; i < this.count; i++)
    {
      const i3 = i * 3;
      const ix = this.pos[i3], iy = this.pos[i3 + 1], iz = this.pos[i3 + 2];
      for (let j = i + 1; j < this.count; j++)
      {
        const j3 = j * 3;
        const dx = this.pos[j3] - ix;
        const dy = this.pos[j3 + 1] - iy;
        const dz = this.pos[j3 + 2] - iz;
        const d2 = dx * dx + dy * dy + dz * dz;
        if (d2 < r2 && d2 > 1e-9)
        {
          const d = Math.sqrt(d2);
          const nx = dx / d, ny = dy / d, nz = dz / d;
          const overlap = (2 * this.radius - d);
          const push = overlap * 0.5 + 1e-4;
          this.pos[i3] -= nx * push;
          this.pos[i3 + 1] -= ny * push;
          this.pos[i3 + 2] -= nz * push;
          this.pos[j3] += nx * push;
          this.pos[j3 + 1] += ny * push;
          this.pos[j3 + 2] += nz * push;

          const vin = this.vel[i3] * nx + this.vel[i3 + 1] * ny + this.vel[i3 + 2] * nz;
          const vjn = this.vel[j3] * nx + this.vel[j3 + 1] * ny + this.vel[j3 + 2] * nz;

          const ivx = this.vel[i3] - vin * nx;
          const ivy = this.vel[i3 + 1] - vin * ny;
          const ivz = this.vel[i3 + 2] - vin * nz;
          const jvx = this.vel[j3] - vjn * nx;
          const jvy = this.vel[j3 + 1] - vjn * ny;
          const jvz = this.vel[j3 + 2] - vjn * nz;

          this.vel[i3] = ivx + vjn * nx;
          this.vel[i3 + 1] = ivy + vjn * ny;
          this.vel[i3 + 2] = ivz + vjn * nz;
          this.vel[j3] = jvx + vin * nx;
          this.vel[j3 + 1] = jvy + vin * ny;
          this.vel[j3 + 2] = jvz + vin * nz;
        }
      }
    }
  }

  /** Δt 秒だけ物理シミュレーションを進める。 */
  step(dt)
  {
    const dtScaled = dt * this.speed;
    for (let i = 0; i < this.count; i++)
    {
      const i3 = i * 3;
      this.pos[i3] += this.vel[i3] * dtScaled;
      this.pos[i3 + 1] += this.vel[i3 + 1] * dtScaled;
      this.pos[i3 + 2] += this.vel[i3 + 2] * dtScaled;
      this._reflect(i3);
    }
    this._collide();
  }

  /** InstancedMesh へ座標を同期。 */
  sync()
  {
    for (let i = 0; i < this.count; i++)
    {
      const i3 = i * 3;
      this._dummy.position.set(this.pos[i3], this.pos[i3 + 1], this.pos[i3 + 2]);
      this._dummy.rotation.y += 0.00005;
      this._dummy.updateMatrix();
      this.mesh.setMatrixAt(i, this._dummy.matrix);
    }
    this.mesh.count = this.count;
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  /**
   * モードを切り替える（'cube' | 'sphere'）。必要なら位置をクランプ/スケール。
   * @param {'cube'|'sphere'} mode
   */
  setMode(mode)
  {
    this.mode = mode === 'sphere' ? 'sphere' : 'cube';
    // 既存位置を適切にクランプ
    for (let i = 0; i < this.count; i++)
    {
      const i3 = i * 3;
      if (this.mode === 'cube')
      {
        const limit = this.half - this.radius;
        this.pos[i3 + 0] = Math.max(-limit, Math.min(limit, this.pos[i3 + 0]));
        this.pos[i3 + 1] = Math.max(-limit, Math.min(limit, this.pos[i3 + 1]));
        this.pos[i3 + 2] = Math.max(-limit, Math.min(limit, this.pos[i3 + 2]));
      }
      else
      {
        const limit = this.sphereRadius - this.radius;
        const x = this.pos[i3 + 0];
        const y = this.pos[i3 + 1];
        const z = this.pos[i3 + 2];
        const r = Math.hypot(x, y, z) || 1;
        const scale = Math.min(1, limit / r);
        this.pos[i3 + 0] = x * scale;
        this.pos[i3 + 1] = y * scale;
        this.pos[i3 + 2] = z * scale;
      }
    }
  }

  /**
   * 描画用 InstancedMesh を付け替える（頂点配列の再利用と整合用）。
   * @param {import('three').InstancedMesh} mesh
   */
  attachMesh(mesh)
  {
    this.mesh = mesh;
    this.mesh.count = this.count;
    this.mesh.instanceMatrix.setUsage(this.THREE.DynamicDrawUsage);
  }
}

