// src/features/avatar/mesh.js
// アバターメッシュの生成と形状切替

import { makeAffineMaterial, makePerspMaterial } from "../../effects/index.js";
import { getTexture, configureTextureForMode } from "@core/assets.js";

const DEFAULT_AVATAR_SHAPE = "cube";
const SHAPE_FACTORIES = Object.freeze({
  cube: (THREE, size) => new THREE.BoxGeometry(size, size, size),
  tetra: (THREE, size) => new THREE.TetrahedronGeometry(size * Math.sqrt(3 / 8)),
  sphere: (THREE, size) => new THREE.SphereGeometry(size / 2, 16, 12),
  torus: (THREE, size) => new THREE.TorusGeometry(size * 0.35, size * 0.15, 16, 48),
});

function createGeometry(THREE, baseSize, type = DEFAULT_AVATAR_SHAPE)
{
  const key = typeof type === "string" ? type.toLowerCase() : DEFAULT_AVATAR_SHAPE;
  const factory = SHAPE_FACTORIES[key] || SHAPE_FACTORIES[DEFAULT_AVATAR_SHAPE];
  return factory(THREE, baseSize);
}

/**
 * 初期ボックス形状＋テクスチャ付きマテリアルでアバターメッシュを生成します。
 * @returns {{mesh: import('three').Mesh, baseSize:number, texture: import('three').Texture}}
 */
export function createAvatarMesh(THREE, cfg, existingTexture)
{
  const baseSize = 2.25;
  const geo = createGeometry(THREE, baseSize, DEFAULT_AVATAR_SHAPE);

  let tex = existingTexture || getTexture(THREE, "img/me.jpg");
  configureTextureForMode(THREE, tex, !!cfg.RETRO_MODE);

  const mat = cfg.RETRO_MODE
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
  avatarMesh.geometry.dispose();
  avatarMesh.geometry = createGeometry(THREE, baseSize, type);
}
