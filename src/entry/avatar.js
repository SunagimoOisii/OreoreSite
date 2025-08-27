// avatar.js
// three.js アバター表示のエントリーポイント
// - レンダラー・シーングラフ・操作系・ポスト処理を初期化
// - ブートオーバーレイとリサイズ処理を管理
import * as THREE from "three";
const { BoxGeometry, TetrahedronGeometry, SphereGeometry, TorusGeometry } = THREE;
import { SubdivisionModifier } from "three/addons/modifiers/SubdivisionModifier.js";

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

// ブートオーバーレイ初期化
initBootOverlay();

// リサイズ処理の設定
setupResize(renderer, canvas, camera, CONFIG, post);

const shapeButtons = document.querySelectorAll(".avatar-shapes button");

const TARGET_PIECES = 200;     // 生成する破片の目標数

let isRotating = true;      // 回転継続フラグ
let isExploded = false;     // バラバラ状態か
let explodeGroup = null;    // 破片グループ
let pieceVelocity = [];     // 破片ごとの速度ベクトル

shapeButtons.forEach(btn =>
{
  btn.addEventListener("click", () =>
  {
    restoreAvatar();
    changeAvatarShape(btn.dataset.shape);
  });
});

canvas.addEventListener("click", () =>
{
  if (!isExploded)
    explodeAvatar();
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

// ジオメトリから TARGET_PIECES 個の頂点を取得する
function collectVertices(geometry)
{
  // 元ジオメトリを複製し、インデックスを外す
  let geo = geometry.clone().toNonIndexed();
  let pos = geo.attributes.position;

  // TARGET_PIECES に達するまで細分化を繰り返す
  while (pos.count < TARGET_PIECES)
  {
    const mod = new SubdivisionModifier(1);
    mod.modify(geo);
    pos = geo.attributes.position;
  }

  const vertices = [];

  if (pos.count > TARGET_PIECES)
  {
    // ランダムサンプリングで TARGET_PIECES 個の頂点を抽出
    const indices = [...Array(pos.count).keys()];
    for (let i = 0; i < TARGET_PIECES; i++)
    {
      const idx = Math.floor(Math.random() * indices.length);
      const vi = indices.splice(idx, 1)[0];
      vertices.push(new THREE.Vector3().fromBufferAttribute(pos, vi));
    }
  }
  else
  {
    // そのまま全頂点を使用
    for (let i = 0; i < pos.count; i++)
      vertices.push(new THREE.Vector3().fromBufferAttribute(pos, i));
  }

  return vertices;
}

function explodeAvatar()
{
  isExploded = true;
  isRotating = false;
  explodeGroup = new THREE.Group();
  explodeGroup.position.copy(avatarMesh.position);
  explodeGroup.rotation.copy(avatarMesh.rotation);

  const vertices = collectVertices(avatarMesh.geometry);
  const pieceGeo = new BoxGeometry(baseSize / 15, baseSize / 15, baseSize / 15);
  explodeGroup.userData.pieceGeo = pieceGeo;
  pieceVelocity = [];

  vertices.forEach(v =>
  {
    const m = new THREE.Mesh(pieceGeo, avatarMesh.material);
    m.position.copy(v);
    explodeGroup.add(m);

    const dir = v.clone();
    if (dir.lengthSq() === 0)
      dir.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5);
    dir.normalize().multiplyScalar(0.5);
    pieceVelocity.push(dir);
  });

  scene.add(explodeGroup);
  avatarMesh.visible = false;
}

function restoreAvatar()
{
  if (!isExploded)
    return;

  avatarMesh.rotation.set(0, 0, 0);
  avatarMesh.visible = true;
  scene.remove(explodeGroup);
  if (explodeGroup.userData.pieceGeo)
    explodeGroup.userData.pieceGeo.dispose();
  explodeGroup = null;
  pieceVelocity = [];
  isExploded = false;
  isRotating = true;
}

// ループ（PS1_MODE に合わせて分岐）
const ROT_SPEED = 0.007 * 60;

function updateAvatar(dt)
{
  if (isExploded && explodeGroup)
  {
    explodeGroup.children.forEach((m, i) =>
    {
      m.position.addScaledVector(pieceVelocity[i], dt);
    });
  }
  else
  {
    if (isRotating)
      avatarMesh.rotation.y += ROT_SPEED * dt;

    if (CONFIG.PS1_MODE)
      applyPS1Jitter(THREE, camera, avatarMesh, CONFIG);
  }
}

if (CONFIG.PS1_MODE)
{
  const STEP = 1000 / CONFIG.FIXED_FPS;
  runFixedStepLoop(
    STEP,
    (dt) =>
    {
      updateAvatar(dt);
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
      updateAvatar(dt);
    },
    () =>
    {
      renderer.render(scene, camera); // 直接描画
      controls.update();
    }
  );
}
