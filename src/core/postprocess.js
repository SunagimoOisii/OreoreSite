// src/core/postprocess.js
// 減色ディザと色収差を行うポストプロセスパイプライン
/**
 * ポストプロセスパイプラインを生成。
 * PS1_MODE なら減色ディザと色収差を適用し、無効なら素通し。
 * @param {typeof import('three')} THREE three 名前空間
 * @param {THREE.WebGLRenderer} renderer ベースレンダラー
 * @param {object} cfg 設定値
 * @returns {{render:(s:THREE.Scene,c:THREE.Camera)=>void, resize:(r:THREE.WebGLRenderer)=>void}}
 */
export function createPostPipeline(THREE, renderer, cfg)
{
  if (!cfg.PS1_MODE)
  {
    // PS1モードでないときはポスト無しでそのまま描画
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

      // 減色ディザ
      uRgbBits: { value: cfg.RGB_BITS },

      // ▼ 色収差パラメータ（CFG連動）
      uCAEnabled: { value: cfg.CA_ENABLED ? 1.0: 0.0 },
      uCAStr: { value: cfg.CA_STRENGTH }, // 強さ
      uCAAmpPow: { value: cfg.CA_POWER }, // 半径増幅の指数
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

      // 画面中心からの半径に応じてオフセット量を決定（端ほど強く）
      vec2 chromaOffset(vec2 uv){
        vec2  toC = uv - uCenter;
        float r   = length(toC);                // 0..~0.7
        float amp = pow(r, uCAAmpPow);          // r^pow
        // 解像度に依存しないズレ量にするため、最大辺でスケール
        float scale = uCAStr / max(uResolution.x, uResolution.y);
        return normalize(toC + 1e-6) * amp * scale;
      }

      void main(){
        // ===== 1) 色収差：RGBでUVを微妙にズラして取得 =====
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

        // ===== 2) 減色 + Bayer ディザ =====
        vec2 frag = vUv * uResolution;
        float t = (bayer4x4(frag) + 0.5) / 16.0;
        float levels = exp2(uRgbBits) - 1.0; // 2^bits - 1
        vec3 q = floor(baseRGB * levels + t) / levels;
        float a = texture2D(tSrc, vUv).a; //αは元のまま
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
    // ①シーンをRTへ
    renderer.setRenderTarget(rt);
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);
    // ②RTを色収差→減色ディザでフルスクリーン出力
    mat.uniforms.tSrc.value = rt.texture;
    renderer.render(fsScene, fsCam);
  }
  function resize(renderer)
  {
    const w = renderer.domElement.width, h = renderer.domElement.height;
    rt.setSize(w, h);
    mat.uniforms.uResolution.value.set(w, h);
  }
  return { render, resize };
}
