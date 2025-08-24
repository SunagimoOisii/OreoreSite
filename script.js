const message = document.getElementById("message");

// ボタンのクリックイベント
document.getElementById("btn").addEventListener("click", () => {
  message.textContent = "ボタンがクリックされました！";
});

// ナビゲーションリンクのクリックイベント
document.querySelectorAll("nav a").forEach((link) => {
  link.addEventListener("click", () => {
    message.textContent = `リンク「${link.textContent}」がクリックされました`;
  });
});

// スクロール時のフェードイン処理
const fadeElems = document.querySelectorAll(".fade-in");
const showElement = () => {
  fadeElems.forEach((el) => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.9) {
      el.classList.add("visible");
    }
  });
};

window.addEventListener("scroll", showElement);
showElement();

// 背景で回転するモーフィングオブジェクトの設定
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById("bg"),
  alpha: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);

const material = new THREE.MeshNormalMaterial();
const geometries = [
  new THREE.TetrahedronGeometry(1),
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.SphereGeometry(0.9, 32, 32),
];
let currentIndex = 0;
let mesh = new THREE.Mesh(geometries[currentIndex], material);
scene.add(mesh);

camera.position.z = 3;

function animate() {
  requestAnimationFrame(animate);
  mesh.rotation.x += 0.01;
  mesh.rotation.y += 0.01;
  renderer.render(scene, camera);
}
animate();

function morphShape() {
  const nextIndex = (currentIndex + 1) % geometries.length;
  const newMesh = new THREE.Mesh(geometries[nextIndex], material);
  newMesh.scale.set(0.01, 0.01, 0.01);
  scene.add(newMesh);

  const start = performance.now();
  const duration = 1000;

  function transition(time) {
    const t = Math.min((time - start) / duration, 1);
    mesh.scale.set(1 - t, 1 - t, 1 - t);
    newMesh.scale.set(t, t, t);
    if (t < 1) {
      requestAnimationFrame(transition);
    } else {
      scene.remove(mesh);
      mesh = newMesh;
      currentIndex = nextIndex;
    }
  }

  requestAnimationFrame(transition);
}

setInterval(morphShape, 4000);

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
