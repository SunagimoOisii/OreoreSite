// src/features/avatar/mesh.js
// アバターメッシュの生成と形状切替

import { makeAffineMaterial, makePerspMaterial } from "../../effects/index.js";

/**
 * 初期ボックス形状＋テクスチャ付きマテリアルでアバターメッシュを生成します。
 * @returns {{mesh: import('three').Mesh, baseSize:number, texture: import('three').Texture}}
 */
export function createAvatarMesh(THREE, cfg, existingTexture)
{
  const baseSize = 2.25;
  const geo = new THREE.BoxGeometry(baseSize, baseSize, baseSize);

  let tex = existingTexture;
  if (!tex)
  {
    tex = new THREE.TextureLoader().load("img/me.jpg", t =>
    {
      t.colorSpace = THREE.SRGBColorSpace;
      if (cfg.PS1_MODE)
      {
        t.generateMipmaps = false;
        t.minFilter = THREE.NearestFilter;
        t.magFilter = THREE.NearestFilter;
        t.anisotropy = 0;
      }
    });
  }
  else
  {
    tex.colorSpace = THREE.SRGBColorSpace;
    if (cfg.PS1_MODE)
    {
      tex.generateMipmaps = false;
      tex.minFilter = THREE.NearestFilter;
      tex.magFilter = THREE.NearestFilter;
      tex.anisotropy = 0;
    }
    else
    {
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.generateMipmaps = true;
      tex.anisotropy = 0;
    }
    tex.needsUpdate = true;
  }

  const mat = cfg.PS1_MODE
    ? makeAffineMaterial(THREE, tex, cfg.AFFINE_STRENGTH, false)
    : makePerspMaterial(THREE, tex, false);

  const mesh = new THREE.Mesh(geo, mat);
  return { mesh, baseSize, texture: tex };
}

/**
 * アバターの形状をその場で切り替えます。
 */
export function changeAvatarShape(THREE, avatarMesh, baseSize, type)
{
  const { BoxGeometry, TetrahedronGeometry, SphereGeometry, TorusGeometry } = THREE;
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
