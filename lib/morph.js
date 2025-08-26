export function createMorphPoints(THREE, count = 600){
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  geometry.setAttribute('position', new THREE.BufferAttribute(positions,3));

  const material = new THREE.PointsMaterial({ color: 0x888888, size: 0.05 });
  const points = new THREE.Points(geometry, material);

  // 形状ごとのターゲット座標を生成
  const forms = [
    generateTetra(),
    generateCube(),
    generateSphere()
  ];
  let current = 0;
  let next = 1;
  let start = performance.now();
  const DURATION = 3000; // ms

  function update(time){
    const t = (time - start) / DURATION;
    if(t >= 1){
      start = time;
      current = next;
      next = (next + 1) % forms.length;
    }
    const k = Math.min(t,1);
    for(let i=0;i<count;i++){
      const a = forms[current][i];
      const b = forms[next][i];
      positions[i*3]   = THREE.MathUtils.lerp(a.x, b.x, k);
      positions[i*3+1] = THREE.MathUtils.lerp(a.y, b.y, k);
      positions[i*3+2] = THREE.MathUtils.lerp(a.z, b.z, k);
    }
    geometry.attributes.position.needsUpdate = true;
  }

  return { points, update };

  function generateCube(){
    const arr = [];
    const SCALE = 8, Z_SHIFT = -20;
    for(let i=0;i<count;i++){
      const x = (Math.random()*2 - 1) * SCALE;
      const y = (Math.random()*2 - 1) * SCALE;
      const z = (Math.random()*2 - 1) * SCALE + Z_SHIFT;
      arr.push(new THREE.Vector3(x,y,z));
    }
    return arr;
  }

  function generateSphere(){
    const arr = [];
    const R = 8, Z_SHIFT = -20;
    for(let i=0;i<count;i++){
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2*v - 1);
      const x = R * Math.sin(phi) * Math.cos(theta);
      const y = R * Math.sin(phi) * Math.sin(theta);
      const z = R * Math.cos(phi) + Z_SHIFT;
      arr.push(new THREE.Vector3(x,y,z));
    }
    return arr;
  }

  function generateTetra(){
    const arr = [];
    const verts = [
      new THREE.Vector3(1,1,1),
      new THREE.Vector3(-1,-1,1),
      new THREE.Vector3(-1,1,-1),
      new THREE.Vector3(1,-1,-1)
    ];
    const SCALE = 8, Z_SHIFT = -20;
    for(let i=0;i<count;i++){
      let r1 = Math.random();
      let r2 = Math.random();
      let r3 = Math.random();
      if(r1 + r2 + r3 > 1){
        r1 = 1 - r1;
        r2 = 1 - r2;
        r3 = 1 - r3;
      }
      const p = new THREE.Vector3().copy(verts[0])
        .addScaledVector(verts[1].clone().sub(verts[0]), r1)
        .addScaledVector(verts[2].clone().sub(verts[0]), r2)
        .addScaledVector(verts[3].clone().sub(verts[0]), r3);
      p.multiplyScalar(SCALE/2); // 調整
      p.z += Z_SHIFT;
      arr.push(p);
    }
    return arr;
  }
}
