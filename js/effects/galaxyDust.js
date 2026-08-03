window.SpiralGalaxy = window.SpiralGalaxy || {};

window.SpiralGalaxy.GalaxyDust = class GalaxyDust {
  constructor({ group, texture, config }) {
    this._group = group;
    this._config = config;
    this._texture = texture;
    this._clouds = [];
    this._build();
  }

  _build() {
    const { rand } = window.SpiralGalaxy.Random;
    const cfg = this._config;
    const { count, radiusMin, radiusMax, scaleMin, scaleMax, opacityMin, opacityMax, tints } = cfg;

    for (let i = 0; i < count; i++) {
      const r = rand(radiusMin, radiusMax);
      const ang = rand(0, Math.PI * 2);
      const thickness = rand(-46, 46) * (1 - r / radiusMax);

      const mat = new THREE.MeshBasicMaterial({
        map: this._texture,
        color: tints[Math.floor(Math.random() * tints.length)],
        transparent: true,
        opacity: rand(opacityMin, opacityMax),
        depthWrite: false,
        blending: THREE.AdditiveBlending
      });

      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
      const scale = rand(scaleMin, scaleMax);
      mesh.scale.set(scale, scale * rand(0.5, 1.15), 1);
      mesh.position.set(Math.cos(ang) * r, thickness, Math.sin(ang) * r);
      mesh.rotation.set(0, 0, ang + rand(-0.5, 0.5));

      this._group.add(mesh);
      this._clouds.push(mesh);
    }
  }
};