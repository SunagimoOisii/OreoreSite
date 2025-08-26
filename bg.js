import * as THREE from "three";

// 背景用のキャンバスを取得
const canvas = document.getElementById("bg-canvas");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

// シーンとカメラを用意
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 80);

// Boids が活動する立方体領域
const BOUNDS = 40;
const boxGeo = new THREE.BoxGeometry(BOUNDS, BOUNDS, BOUNDS);
const edges = new THREE.EdgesGeometry(boxGeo);
const lineMat = new THREE.LineBasicMaterial({ color: 0x444444 });
const box = new THREE.LineSegments(edges, lineMat);
scene.add(box);

// Boid を表すクラス
class Boid {
  constructor() {
    // 位置と速度を乱数で初期化
    this.position = new THREE.Vector3(
      (Math.random() - 0.5) * BOUNDS,
      (Math.random() - 0.5) * BOUNDS,
      (Math.random() - 0.5) * BOUNDS
    );
    this.velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2
    );

    // 三角錐のメッシュを作成
    const geo = new THREE.ConeGeometry(0.4, 0.8, 3);
    geo.translate(0, 0.4, 0); // 先端を原点に合わせる
    const mat = new THREE.MeshNormalMaterial();
    this.mesh = new THREE.Mesh(geo, mat);
    scene.add(this.mesh);
  }

  // Boids アルゴリズムで更新
  update(boids) {
    const separation = new THREE.Vector3();
    const alignment = new THREE.Vector3();
    const cohesion = new THREE.Vector3();
    let count = 0;

    for (const other of boids) {
      if (other === this) continue;
      const dist = this.position.distanceTo(other.position);
      if (dist < 5) {
        // 分離
        separation.add(this.position.clone().sub(other.position).divideScalar(dist));
      }
      if (dist < 10) {
        // 整列・結合
        alignment.add(other.velocity);
        cohesion.add(other.position);
        count++;
      }
    }

    if (count > 0) {
      alignment.divideScalar(count).sub(this.velocity).multiplyScalar(0.05);
      cohesion.divideScalar(count).sub(this.position).multiplyScalar(0.01);
    }
    separation.multiplyScalar(0.1);

    // 速度を更新
    this.velocity.add(separation).add(alignment).add(cohesion);

    // 速度制限
    const maxSpeed = 0.5;
    if (this.velocity.length() > maxSpeed) {
      this.velocity.setLength(maxSpeed);
    }

    // 位置を更新
    this.position.add(this.velocity);

    // 立方体からはみ出さないよう反射
    const half = BOUNDS / 2;
    ["x", "y", "z"].forEach(axis => {
      if (this.position[axis] > half) {
        this.position[axis] = half;
        this.velocity[axis] *= -1;
      } else if (this.position[axis] < -half) {
        this.position[axis] = -half;
        this.velocity[axis] *= -1;
      }
    });

    // メッシュに反映し進行方向を向ける
    this.mesh.position.copy(this.position);
    this.mesh.lookAt(this.position.clone().add(this.velocity));
  }
}

// Boid を多数生成
const BOID_COUNT = 80;
const boids = Array.from({ length: BOID_COUNT }, () => new Boid());

function animate() {
  requestAnimationFrame(animate);
  boids.forEach(b => b.update(boids));
  renderer.render(scene, camera);
}
animate();

// リサイズ対応
function onResize() {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}
window.addEventListener("resize", onResize);
