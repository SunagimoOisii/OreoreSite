// src/effects/postprocess.js
// 量子化ディザと色収差を行うポストプロセス パイプライン

/**
 * ポストプロセス パイプラインを生成します。
 * PS1_MODE なら量子化ディザと色収差を適用し、そうでなければ素の描画。
 * @param {typeof import('three')} THREE three オブジェクト
 * @param {THREE.WebGLRenderer} renderer ベースレンダラー
 * @param {object} cfg 設定
 * @returns {{render:(s:THREE.Scene,c:THREE.Camera)=>void, resize:(r:THREE.WebGLRenderer)=>void}}
 */
export function createPostPipeline(THREE, renderer, cfg)
{
  if (!cfg.PS1_MODE)
  {
    // PS1モードでなければポスト処理なしでそのまま描画
    return {
      render: (scene, camera) => renderer.render(scene, camera),
      resize: () => { }
    };
  }

  // --- Render Target & FS Quad ---
  const rt = new THREE.WebGLRenderTarget(2, 2, {
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter
  });
  const fsScene = new THREE.Scene();
  const fsCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const mat = new THREE.ShaderMaterial({
    uniforms: {
      // 入力
      tSrc: { value: null },
      uResolution: { value: new THREE.Vector2(2, 2) },

      // 量子化ディザ
      uRgbBits: { value: cfg.RGB_BITS },

      // 可変: 色収差パラメータ（CFG 由来）
      uCAEnabled: { value: cfg.CA_ENABLED ? 1.0: 0.0 },
      uCAStr: { value: cfg.CA_STRENGTH }, // 強さ
      uCAAmpPow: { value: cfg.CA_POWER }, // 半径変化の指数
      uCenter: { value: new THREE.Vector2(0.5, 0.5) } // 中心
    },
    vertexShader: `
      varying vec2 vUv;
      void main(){
        vUv = uv;
        gl_Position = vec4(position.xy, 0.0, 1.0);
      }
    `,
    fragmentShader: `
      precision mediump float;

      uniform sampler2D tSrc;
      uniform vec2  uResolution;
      uniform float uRgbBits;

      uniform float uCAEnabled;
      uniform float uCAStr;
      uniform float uCAAmpPow;
      uniform vec2  uCenter;

      varying vec2 vUv;

      // 4x4 Bayer 行列
      float bayer4x4(vec2 ip){
        int x = int(mod(ip.x, 4.0));
        int y = int(mod(ip.y, 4.0));
        int idx = y*4 + x;
        int mat[16];
        mat[0]=0; mat[1]=8; mat[2]=2; mat[3]=10;
        mat[4]=12; mat[5]=4; mat[6]=14; mat[7]=6;
        mat[8]=3; mat[9]=11; mat[10]=1; mat[11]=9;
        mat[12]=15; mat[13]=7; mat[14]=13; mat[15]=5;
        return float(mat[idx]);
      }

      // 中心からの半径に応じてオフセット量を算出（可変指数）
      vec2 chromaOffset(vec2 uv){
        vec2  toC = uv - uCenter;
        float r   = length(toC);                // 0..~0.7
        float amp = pow(r, uCAAmpPow);          // r^pow
        // 内部解像度に依存しないように、長辺でスケール
        float scale = uCAStr / max(uResolution.x, uResolution.y);
        return normalize(toC + 1e-6) * amp * scale;
      }

      void main(){
        // 1) 色収差: RGB それぞれの UV をずらして取得
        vec3 baseRGB;
        if(uCAEnabled > 0.5){
          vec2 off = chromaOffset(vUv);
          float r = texture2D(tSrc, clamp(vUv + off, 0.0, 1.0)).r;
          float g = texture2D(tSrc, clamp(vUv      , 0.0, 1.0)).g;
          float b = texture2D(tSrc, clamp(vUv - off, 0.0, 1.0)).b;
          baseRGB = vec3(r,g,b);
        } else {
          baseRGB = texture2D(tSrc, vUv).rgb;
        }

        // 2) 量子化 + Bayer ディザ
        vec2 frag = vUv * uResolution;
        float t = (bayer4x4(frag) + 0.5) / 16.0;
        float levels = exp2(uRgbBits) - 1.0; // 2^bits - 1
        vec3 q = floor(baseRGB * levels + t) / levels;
        float a = texture2D(tSrc, vUv).a; // 透明度はそのまま
        gl_FragColor = vec4(q, a);
      }
    `,
    depthTest: false,
    depthWrite: false
  });

  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
  fsScene.add(quad);

  function render(scene, camera)
  {
    // 1) シーンをRTへ
    renderer.setRenderTarget(rt);
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);
    // 2) RTを色収差+量子化ディザでフルスクリーンクアッドへ
    mat.uniforms.tSrc.value = rt.texture;
    renderer.render(fsScene, fsCam);
  }
  function resize(renderer)
  {
    const w0 = renderer.domElement.width, h0 = renderer.domElement.height;
    const w = Math.max(1, w0 | 0);
    const h = Math.max(1, h0 | 0);
    rt.setSize(w, h);
    mat.uniforms.uResolution.value.set(w, h);
  }
  return { render, resize };
}

