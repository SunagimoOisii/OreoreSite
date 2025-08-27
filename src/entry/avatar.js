// avatar.js
// three.js アバター表示のエントリーポイント
// - レンダラー・シーングラフ・操作系・ポスト処理を初期化
// - ブートオーバーレイとリサイズ処理を管理
import * as THREE from "three";
const { BoxGeometry, TetrahedronGeometry, SphereGeometry, TorusGeometry } = THREE;
import { ExplodeModifier } from "three/addons/modifiers/ExplodeModifier.js";
import gsap from "https://cdn.skypack.dev/gsap@3.12.2";

import { CONFIG } from "../core/config.js";
import { createControls } from "../core/controls.js";
import { createPostPipeline } from "../core/postprocess.js";
import { createRenderer, setupResize } from "../core/renderer.js";
import { createSceneGraph } from "../core/scene.js";
import { applyPS1Jitter, runFixedStepLoop } from "../core/utils.js";
import { initBootOverlay } from "../core/boot-overlay.js";

const canvas = document.getElementById("avatar-canvas");
const renderer = createRenderer(THREE, canvas, CONFIG);
const { scene, camera, avatarMesh, tex, baseSize } = createSceneGraph(THREE, CONFIG);
const controls = createControls(THREE, camera, renderer.domElement, CONFIG);
const post = createPostPipeline(THREE, renderer, CONFIG); // { render(scene,camera), resize() }

let isExploded = false;
let isRotating = false;
let explodedMeshes = [];

// ブートオーバーレイ初期化
initBootOverlay();

// リサイズ処理の設定
setupResize(renderer, canvas, camera, CONFIG, post);

const shapeButtons = document.querySelectorAll(".avatar-shapes button");
shapeButtons.forEach(btn =>
{
  btn.addEventListener("click", () =>
  {
    if (isExploded)
    {
      explodedMeshes.forEach(m =>
      {
        m.geometry.dispose();
        scene.remove(m);
      });
      explodedMeshes = [];
      isExploded = false;
      isRotating = true;
      avatarMesh.visible = true;
      avatarMesh.rotation.set(0, 0, 0);
    }
    changeAvatarShape(btn.dataset.shape);
  });
});

canvas.addEventListener("click", () =>
{
  isRotating = !isRotating;
  if (isExploded)
  {
    return;
  }

  const modifier = new ExplodeModifier();
  const geo = avatarMesh.geometry.clone();
  modifier.modify(geo);
  const pos = geo.getAttribute("position");
  const uv = geo.getAttribute("uv");
  const norm = geo.getAttribute("normal");

  avatarMesh.visible = false;
  for (let i = 0; i < pos.count; i += 3)
  {
    const g = new THREE.BufferGeometry();
    const verts = new Float32Array(9);
    const uvs = new Float32Array(6);
    for (let j = 0; j < 3; j++)
    {
      verts[j * 3] = pos.getX(i + j);
      verts[j * 3 + 1] = pos.getY(i + j);
      verts[j * 3 + 2] = pos.getZ(i + j);
      if (uv)
      {
        uvs[j * 2] = uv.getX(i + j);
        uvs[j * 2 + 1] = uv.getY(i + j);
      }
    }
    g.setAttribute("position", new THREE.BufferAttribute(verts, 3));
    if (uv)
    {
      g.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
    }
    const mesh = new THREE.Mesh(g, avatarMesh.material);
    explodedMeshes.push(mesh);
    scene.add(mesh);

    const dir = new THREE.Vector3(
      norm.getX(i) + norm.getX(i + 1) + norm.getX(i + 2),
      norm.getY(i) + norm.getY(i + 1) + norm.getY(i + 2),
      norm.getZ(i) + norm.getZ(i + 1) + norm.getZ(i + 2)
    ).normalize().multiplyScalar(1.5);

    gsap.to(mesh.position, {
      x: dir.x,
      y: dir.y,
      z: dir.z,
      duration: 1,
      ease: "power2.out"
    });
  }
  isExploded = true;
});

function changeAvatarShape(type)
{
  avatarMesh.geometry.dispose();

  let geo;
  switch (type)
  {
    case "cube":
      geo = new BoxGeometry(baseSize, baseSize, baseSize);
      break;
    case "tetra":
      geo = new TetrahedronGeometry(baseSize * Math.sqrt(3 / 8));
      break;
    case "sphere":
      geo = new SphereGeometry(baseSize / 2, 16, 12);
      break;
    case "torus":
      geo = new TorusGeometry(baseSize * 0.35, baseSize * 0.15, 16, 48);
      break;
    default:
      geo = new BoxGeometry(baseSize, baseSize, baseSize);
  }

  avatarMesh.geometry = geo;
}

// ループ（PS1_MODE に合わせて分岐）
const ROT_SPEED = 0.007 * 60;
if (CONFIG.PS1_MODE)
{
  const STEP = 1000 / CONFIG.FIXED_FPS;
  runFixedStepLoop(
    STEP,
    (dt) =>
    {
      if (isRotating)
      {
        avatarMesh.rotation.y += ROT_SPEED * dt;
      }
      applyPS1Jitter(THREE, camera, avatarMesh, CONFIG);
    },
    () =>
    {
      post.render(scene, camera);
      controls.update();
    }
  );
}
else
{
  runFixedStepLoop(
    0,
    (dt) =>
    {
      if (isRotating)
      {
        avatarMesh.rotation.y += ROT_SPEED * dt;
      }
    },
    () =>
    {
      renderer.render(scene, camera); // 直接描画
      controls.update();
    }
  );
}
