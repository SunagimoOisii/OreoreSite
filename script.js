// Minimal script for personal intro site
// Kept intentionally small — add interactive JS here if needed
document.addEventListener('DOMContentLoaded', () => {
    // placeholder: no 3D or boids
});
import * as THREE from "three";

// ========== 基本セットアップ ==========
const canvas = document.getElementById("bg");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.z = 80;

// 環境光
const ambient = new THREE.AmbientLight(0xffffff, 1.0);
scene.add(ambient);

// ========== キャラ画像のスプライト ==========
const texture = new THREE.TextureLoader().load("img/AlienChan.png");
const material = new THREE.SpriteMaterial({ map: texture, transparent: true });

const agents = [];
const COUNT = 25;

for (let i = 0; i < COUNT; i++) {
  const sprite = new THREE.Sprite(material);
  sprite.position.set(
    (Math.random() - 0.5) * 100,
    (Math.random() - 0.5) * 100,
  0
  );

  // サイズを大きめに変更
  const scale = 20;
  sprite.scale.set(20, scale, 1);

  scene.add(sprite);

  agents.push({
    sprite,
    velocity: new THREE.Vector3(0, 0, 0)
  });
}


// ========== マウス位置 ==========
let target = new THREE.Vector3(0, 0, 0);

document.addEventListener("mousemove", (event) => {
  const x = (event.clientX / window.innerWidth) * 2 - 1;
  const y = -(event.clientY / window.innerHeight) * 2 + 1;
  target.set(x * 50, y * 30, 0);
});

// ========== Boids風パラメータ ==========
const alignment = 0.01;   // 仲間との整列力（調整用）
const randomness = 0.0001; // ランダムゆらぎ

// 振る舞いパラメータ（近接吸引）
const attractRadius = 100;       // マウスからこの距離以内で引き寄せる
const attractStrength = 0.02;   // 引力の強さ（小さくして遅くする）
const damping = 0.94;           // 減衰（離れていると減速）
const maxSpeed = 0.16;          // 最大速度（さらに小さくして遅く）

// separation（重なり回避）パラメータ
const separationDistance = 15;   // これより近いと押しのける
const separationStrength = 0.02; // 押しのける力（やや弱め）

// ========== アニメーション ==========
function animate()
{
  requestAnimationFrame(animate);

  agents.forEach((a, i) =>
  {
    const pos = a.sprite.position;

    // マウスへのベクトルと距離
    const toMouse = target.clone().sub(pos);
    const dist = toMouse.length();

    if (dist < attractRadius)
    {
      // 距離に応じて強さを減衰させる（近いほど強く引く）
      const strength = attractStrength * (1 - dist / attractRadius);
      const force = toMouse.normalize().multiplyScalar(strength);
      a.velocity.add(force);
    }
    else
    {
      // マウスから遠いときは徐々に減速して停止に近づける
      a.velocity.multiplyScalar(damping);
    }

    // separation: 近すぎる仲間を押しのける（設定値を使用）
    let sep = new THREE.Vector3();
    agents.forEach((other) =>
    {
      if (other === a) return;
      const diff = pos.clone().sub(other.sprite.position);
      const d = diff.length();
      if (d > 0 && d < separationDistance)
      {
        sep.add(diff.normalize().divideScalar(d));
      }
    });
    if (sep.length() > 0)
    {
      sep.normalize().multiplyScalar(separationStrength);
      a.velocity.add(sep);
    }

    // Alignment: 仲間と向きをそろえる（半径20の範囲、alignment を使用）
    let neighborVel = new THREE.Vector3();
    let count = 0;
    agents.forEach((other, j) =>
    {
      if (i === j) return;
      const d = pos.distanceTo(other.sprite.position);
      if (d < 20)
      {
        neighborVel.add(other.velocity);
        count++;
      }
    });
    if (count > 0)
    {
      neighborVel.divideScalar(count);
      a.velocity.add(neighborVel.sub(a.velocity).multiplyScalar(alignment));
    }

    // わずかなランダムゆらぎを残す（randomness を使用）
  a.velocity.x += (Math.random() - 0.5) * randomness;
  a.velocity.y += (Math.random() - 0.5) * randomness;
  // z成分は2Dに固定するので常に0にする
  a.velocity.z = 0;

    // 速度制限（maxSpeed を使用）
    a.velocity.clampLength(0, maxSpeed);

  // 位置更新（zは常に0に固定）
  pos.add(a.velocity);
  pos.z = 0;
  });

  renderer.render(scene, camera);
}
animate();

// ========== リサイズ対応 ==========
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
