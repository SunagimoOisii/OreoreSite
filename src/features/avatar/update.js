// src/features/avatar/update.js
// �A�o�^�[�̍X�V����: ��]�E���q3D���W�b�^�[�E�����̈ړ�����

import { applyRetroJitter } from "../../effects/index.js";

/**
 * �A�o�^�[�̍X�V������񋟂��܂��B
 */
export function createAvatarUpdater(THREE, camera, avatarMesh, cfg, explosion)
{
  const ROT_SPEED = 0.007 * 60; // dt�b�ɃX�P�[�����ꂽ��]���x
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

      if (cfg.RETRO_MODE)
        applyRetroJitter(THREE, camera, avatarMesh, cfg);
    }
  }

  return { update, setRotating };
}

