window.SpiralGalaxy = window.SpiralGalaxy || {};

window.SpiralGalaxy.NebulaField = (() => {
  function hash(x, y) {
    let h = (x * 374761393 + y * 668265263) | 0;
    h = ((h ^ (h >> 13)) * 1274126177) | 0;
    return ((h ^ (h >> 16)) >>> 0) / 4294967295;
  }

  function smooth(t) {
    return t * t * (3 - 2 * t);
  }

  function valueNoise(x, y) {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const xf = x - xi;
    const yf = y - yi;
    const a = hash(xi, yi);
    const b = hash(xi + 1, yi);
    const c = hash(xi, yi + 1);
    const d = hash(xi + 1, yi + 1);
    const u = smooth(xf);
    const v = smooth(yf);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }

  function makeTexture(size = 256) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d');
    const img = ctx.createImageData(size, size);
    const octaves = 4;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const u = x / size;
        const v = y / size;
        let n = 0;
        let amp = 0.5;
        let f = 3;
        let sum = 0;
        for (let o = 0; o < octaves; o++) {
          n += valueNoise(u * f, v * f) * amp;
          sum += amp;
          amp *= 0.5;
          f *= 2;
        }
        n /= sum;

        const dx = (u - 0.5) * 2;
        const dy = (v - 0.5) * 2;
        const edge = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy));
        const n2 = Math.max(0, (n - 0.38) / 0.3);
        const a = Math.pow(n2, 1.3) * edge;

        const idx = (y * size + x) * 4;
        img.data[idx] = 255;
        img.data[idx + 1] = 255;
        img.data[idx + 2] = 255;
        img.data[idx + 3] = Math.min(1, a) * 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    const tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    return tex;
  }

  class NebulaField {
    constructor({ scene, config }) {
      this._scene = scene;
      this._config = config;
      this._texture = makeTexture();
      this._clouds = [];
      this._build();
    }

    _build() {
      const { rand } = window.SpiralGalaxy.Random;
      const cfg = this._config;

      for (let i = 0; i < cfg.count; i++) {
        const radius = rand(cfg.radiusMin, cfg.radiusMax);
        const theta = rand(0, Math.PI * 2);
        const phi = Math.acos(rand(-1, 1));

        const mat = new THREE.MeshBasicMaterial({
          map: this._texture,
          color: cfg.tints[Math.floor(Math.random() * cfg.tints.length)],
          transparent: true,
          opacity: rand(cfg.opacityMin, cfg.opacityMax),
          depthWrite: false,
          blending: THREE.AdditiveBlending
        });

        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
        const scale = rand(cfg.scaleMin, cfg.scaleMax);
        mesh.scale.set(scale, scale * rand(0.55, 1.25), 1);
        mesh.position.set(
          radius * Math.sin(phi) * Math.cos(theta),
          radius * Math.cos(phi),
          radius * Math.sin(phi) * Math.sin(theta)
        );
        mesh.rotation.set(rand(0, Math.PI), rand(0, Math.PI), rand(0, Math.PI));

        this._scene.add(mesh);
        this._clouds.push(mesh);
      }
    }
  }

  NebulaField.makeTexture = makeTexture;

  return NebulaField;
})();
