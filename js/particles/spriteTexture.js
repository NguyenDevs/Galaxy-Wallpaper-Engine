window.SpiralGalaxy = window.SpiralGalaxy || {};

window.SpiralGalaxy.SpriteTexture = (() => {
  function create(size = 64, spread = 0.3) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d');
    const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grad.addColorStop(0.0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.18, 'rgba(255,255,255,0.95)');
    grad.addColorStop(spread * 0.5, 'rgba(255,255,255,0.6)');
    grad.addColorStop(spread * 0.9, 'rgba(255,255,255,0.2)');
    grad.addColorStop(1.0, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.Texture(c);
    tex.needsUpdate = true;
    return tex;
  }

  return { create };
})();