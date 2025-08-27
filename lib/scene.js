// lib/scene.js
// シーングラフの生成：テクスチャ付き立方体を配置
import { makeAffineMaterial,
  makePerspMaterial } from "./materials.js";

/**
 * シーン・カメラ・メッシュを構築して返す。
 * @param {typeof import('three')} THREE three 名前空間
 * @param {object} cfg 設定値
 * @returns {{scene:THREE.Scene,camera:THREE.PerspectiveCamera,cube:THREE.Mesh}}
 */
export function createSceneGraph(THREE, cfg)
{
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 5);

  const cubeSize = 2.25;
  const geo = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);

  const tex = new THREE.TextureLoader().load("img/me.jpg", t => {
    t.colorSpace = THREE.SRGBColorSpace;
    if (cfg.PS1_MODE)
    {
      t.generateMipmaps = false;
      t.minFilter = THREE.NearestFilter;
      t.magFilter = THREE.NearestFilter;
      t.anisotropy = 0;
    }
  });

  let matColor, matGray;
  if (cfg.PS1_MODE)
  {
    matColor = makeAffineMaterial(THREE, tex, cfg.AFFINE_STRENGTH, false);
    matGray = makeAffineMaterial(THREE, tex, cfg.AFFINE_STRENGTH, true);
  }
  else
  {
    matColor = makePerspMaterial(THREE, tex, false);
    matGray = makePerspMaterial(THREE, tex, true);
  }
  const materials = [ matGray, matGray, matGray, matGray, matColor, matGray ];
  const cube = new THREE.Mesh(geo, materials);
  scene.add(cube);

  return { scene, camera, cube };
}
