// src/core/assets.js
// 簡易アセットキャッシュ（主に Texture）

const textureCache = new Map(); // key: url, value: THREE.Texture

export function getTexture(THREE, url)
{
  if (textureCache.has(url))
    return textureCache.get(url);

  const tex = new THREE.TextureLoader().load(url, (t) =>
  {
    // 既定の色空間
    t.colorSpace = THREE.SRGBColorSpace;
  });
  textureCache.set(url, tex);
  return tex;
}

export function configureTextureForMode(THREE, texture, retroMode)
{
  if (!texture) return;
  texture.colorSpace = THREE.SRGBColorSpace;
  if (retroMode)
  {
    texture.generateMipmaps = false;
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
    texture.anisotropy = 0;
  }
  else
  {
    texture.generateMipmaps = true;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.anisotropy = 0;
  }
  texture.needsUpdate = true;
}
