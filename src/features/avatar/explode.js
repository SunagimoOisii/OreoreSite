// src/features/avatar/explode.js
// アバターの爆散演出: メッシュを小片に分割して外向きに移動させる

import { LoopSubdivision } from "three-subdivide";

/**
 * 爆散制御オブジェクトを生成します。
 */
export function createAvatarExplosion(THREE, scene, avatarMesh, baseSize)
{
  const TARGET_PIECES = 100;
  let isExploded = false;
  let explodeGroup = null;
  let pieceVelocity = [];

  // 破片の元となる頂点群を収集（必要に応じて細分化）
  function collectVertices(geometry)
  {
    let geo = geometry.clone().toNonIndexed();
    let pos = geo.attributes.position;

    // 破片数が目標に満たない場合は細分化で増やす
    while (pos.count < TARGET_PIECES)
    {
      let next;
      if (LoopSubdivision && typeof LoopSubdivision.modify === "function")
      {
        next = LoopSubdivision.modify(geo, 1, {});
      }
      else if (typeof LoopSubdivision === "function")
      {
        next = LoopSubdivision(geo, 1);
      }
      else
      {
        next = geo.clone();
      }

      if (next !== geo) geo.dispose();
      geo = next;
      pos = geo.attributes.position;
    }

    const vertices = [];
    if (pos.count > TARGET_PIECES)
    {
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
      for (let i = 0; i < pos.count; i++)
        vertices.push(new THREE.Vector3().fromBufferAttribute(pos, i));
    }

    geo.dispose();
    return vertices;
  }

  // 爆散を開始
  function explode()
  {
    if (isExploded) return;
    isExploded = true;
    explodeGroup = new THREE.Group();
    explodeGroup.position.copy(avatarMesh.position);
    explodeGroup.rotation.copy(avatarMesh.rotation);

    const vertices = collectVertices(avatarMesh.geometry);
    const pieceGeo = new THREE.BoxGeometry(baseSize / 15, baseSize / 15, baseSize / 15);
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

  // 元の状態に復元
  function restore()
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
  }

  // 爆散中の更新（破片を移動）
  function tick(dt)
  {
    if (isExploded && explodeGroup)
    {
      explodeGroup.children.forEach((m, i) =>
      {
        m.position.addScaledVector(pieceVelocity[i], dt);
      });
    }
  }

  return {
    explode,
    restore,
    tick,
    isExploded: () => isExploded,
  };
}
