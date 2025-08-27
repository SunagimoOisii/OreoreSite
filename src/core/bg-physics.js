/**
 * 背景用の球体物理シミュレーション。
 * 球の位置更新と衝突判定を担当する。
 */
export class BgPhysics {
  /**
   * @param {object} THREE three.js モジュール
   * @param {import('three').InstancedMesh} mesh 座標を書き込むインスタンスメッシュ
   * @param {object} cfg 設定
   * @param {number} cfg.count 初期の球の数
   * @param {number} [cfg.maxCount] 最大の球の数
   * @param {number} cfg.bounds 立方体の一辺
   * @param {number} cfg.radius 球の半径
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

  /** 初期配置と速度をランダムに設定する。 */
  _init()
  {
    for (let i = 0; i < this.count; i++)
    {
      this._placeRandom(i);
    }
  }

  /** 指定インデックスに球をランダム配置する。 */
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

  /** 球を 1 個追加する。 */
  addBall()
  {
    if (this.count >= this.maxCount) return;
    this._placeRandom(this.count);
    this.count++;
  }

  /** 球を 1 個削除する。 */
  removeBall()
  {
    if (this.count <= 0) return;
    this.count--;
  }

  /** 指定インデックスの球と壁との衝突を処理する。 */
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

  /** 球同士の衝突を処理する。 */
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

  /** 時間 dt 分だけシミュレーションを進める。 */
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

  /** InstancedMesh へ座標を反映する。 */
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
}

