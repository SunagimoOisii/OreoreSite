// src/effects/materials.js
// three.js 用マテリアル生成ユーティリティ
// - createShaderMaterial: 共通オプションをまとめたラッパー
// - makeAffineMaterial: 透視補正を外した“擬似アフィン”なUV補間（PS1風の床がにゅるっと伸びる歪み）
// - makePerspMaterial: 通常の透視補正（標準的な描画）
//
// 使い方：scene.js 側などで
//   import { makeAffineMaterial, makePerspMaterial } from "./materials.js";
//   const mat = makeAffineMaterial(THREE, texture, 0.65, /*toGray=*/false);

/**
 * ShaderMaterial を生成する共通ラッパー
 * @param {typeof import('three')} THREE - three 名前空間
 * @param {THREE.ShaderMaterialParameters} options - ShaderMaterial のパラメータ
 * @returns {THREE.ShaderMaterial}
 */
export function createShaderMaterial(THREE, options)
{
  return new THREE.ShaderMaterial({
    transparent: false,
    depthTest: true,
    depthWrite: true,
    ...options
  });
}

/**
 * アフィン歪みシェーダ（擬似）
 * @param {typeof import('three')} THREE - three 名前空間
 * @param {THREE.Texture} map - テクスチャ（sRGB 推奨）
 * @param {number} affineStrength - 0.0(透視)〜1.0(強アフィン) のミックス率
 * @param {boolean} [toGray=false] - グレースケール化するか（立方体の正面以外など）
 * @returns {THREE.ShaderMaterial}
 */
export function makeAffineMaterial(THREE, map, affineStrength, toGray = false)
{
  const vertexShader = `
      varying vec2 vUv_persp;     // 透視補正ありUV
      varying vec2 vUv_affineRaw; // アフィン用に w を掛けたUV
      varying float vFragW;       // クリップ後の w（frag側で割り戻し）

      void main () {
        vec4 clip = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        vFragW = clip.w;

        vUv_persp    = uv;
        vUv_affineRaw = uv * clip.w;

        gl_Position = clip;
      }
    `;
  const fragmentShader = `
      precision mediump float;
      uniform sampler2D map;
      uniform float uAffine;

      varying vec2 vUv_persp;
      varying vec2 vUv_affineRaw;
      varying float vFragW;

      void main () {
        // 透視補正UV
        vec2 uv_p = vUv_persp;

        // 擬似アフィンUV（w で割り戻し）
        vec2 uv_a = vUv_affineRaw / vFragW;

        // ミックス＋クランプで安定化（黒抜け防止）
        vec2 uv = mix(uv_p, uv_a, clamp(uAffine, 0.0, 1.0));
        uv = clamp(uv, 0.0, 1.0);

        vec4 c = texture2D(map, uv);
        ${toGray ? `
          float g = dot(c.rgb, vec3(0.2126, 0.7152, 0.0722));
          gl_FragColor = vec4(vec3(g), c.a);
        `: `
          gl_FragColor = c;
        `}
      }
    `;
  const uniforms = {
    map: { value: map },
    uAffine: { value: affineStrength }
  };
  return createShaderMaterial(THREE, {
    uniforms,
    vertexShader,
    fragmentShader
  });
}

/**
 * 通常の透視補正版（標準）
 * @param {typeof import('three')} THREE
 * @param {THREE.Texture} map
 * @param {boolean} [toGray=false]
 * @returns {THREE.ShaderMaterial}
 */
export function makePerspMaterial(THREE, map, toGray = false)
{
  const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv; // three が自動で透視補正補間してくれる
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;
  const fragmentShader = `
      precision mediump float;
      uniform sampler2D map;
      varying vec2 vUv;
      void main(){
        vec4 c = texture2D(map, vUv);
        ${toGray ? `
          float g = dot(c.rgb, vec3(0.2126, 0.7152, 0.0722));
          gl_FragColor = vec4(vec3(g), c.a);
        `: `
          gl_FragColor = c;
        `}
      }
    `;
  const uniforms = { map: { value: map } };
  return createShaderMaterial(THREE, {
    uniforms,
    vertexShader,
    fragmentShader
  });
}
