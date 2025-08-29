// src/features/avatar/update.js
// アバターの更新挙動: 回転とPSX風ジッター、爆散時の移動委譲

import { applyPS1Jitter } from "../../effects/psx-jitter.js";

/**
 * アバターの更新処理を提供します。
 */
export function createAvatarUpdater(THREE, camera, avatarMesh, cfg, explosion)
{
  const ROT_SPEED = 0.007 * 60; // dt秒にスケールされた回転速度
  let isRotating = true;

  function setRotating(v) { isRotating = !!v; }

  function update(dt)
  {
    if (explosion && explosion.isExploded())
    {
      explosion.tick(dt);
    }
    else
    {
      if (isRotating)
        avatarMesh.rotation.y += ROT_SPEED * dt;

      if (cfg.PS1_MODE)
        applyPS1Jitter(THREE, camera, avatarMesh, cfg);
    }
  }

  return { update, setRotating };
}
