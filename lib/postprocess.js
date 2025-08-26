export function createPostPipeline(THREE, renderer, cfg){
  if (!cfg.PS1_MODE){
    return {
      render: (scene, camera)=>renderer.render(scene, camera),
      resize: ()=>{}
    };
  }
  const rt = new THREE.WebGLRenderTarget(2,2,{ minFilter:THREE.NearestFilter, magFilter:THREE.NearestFilter });
  const fsScene = new THREE.Scene();
  const fsCam   = new THREE.OrthographicCamera(-1,1,1,-1,0,1);
  const mat = new THREE.ShaderMaterial({
  uniforms: {
    tSrc:       { value: null },
    uResolution:{ value: new THREE.Vector2(2,2) },
    uRgbBits:   { value: cfg.RGB_BITS }
    // 将来ここに色収差パラメータを追加する
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position.xy, 0.0, 1.0);
    }
  `,
  fragmentShader: `
    precision mediump float;

    uniform sampler2D tSrc;
    uniform vec2  uResolution;
    uniform float uRgbBits;
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

    void main(){
      vec4 col = texture2D(tSrc, vUv);

      // 画素座標からディザ閾値を決める
      vec2 frag = vUv * uResolution;
      float t = (bayer4x4(frag) + 0.5) / 16.0;

      float levels = exp2(uRgbBits) - 1.0; // 2^bits - 1
      vec3  q = floor(col.rgb * levels + t) / levels;

      gl_FragColor = vec4(q, col.a);
    }
  `
});
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2,2), mat);
  fsScene.add(quad);

  function render(scene, camera){
    renderer.setRenderTarget(rt);
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);
    mat.uniforms.tSrc.value = rt.texture;
    renderer.render(fsScene, fsCam);
  }
  function resize(renderer){
    const w = renderer.domElement.width, h = renderer.domElement.height;
    rt.setSize(w,h);
    mat.uniforms.uResolution.value.set(w,h);
  }
  return { render, resize };
}
