export function createRenderer(THREE, canvas, cfg){
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  fitToCanvas(renderer, canvas, cfg);
  return renderer;
}
export function fitToCanvas(renderer, canvas, cfg){
  const rect = canvas.getBoundingClientRect();
  const w = Math.max(1, rect.width|0);
  const h = Math.max(1, rect.height|0);
  if (cfg.PS1_MODE){
    renderer.setPixelRatio(1);
    renderer.setSize((w * cfg.INTERNAL_SCALE)|0, (h * cfg.INTERNAL_SCALE)|0, false);
    renderer.domElement.style.imageRendering = "pixelated";
  } else {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1, 2));
    renderer.setSize(w, h, false);
    renderer.domElement.style.imageRendering = "";
  }
}
