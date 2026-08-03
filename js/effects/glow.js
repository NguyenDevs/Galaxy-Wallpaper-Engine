window.SpiralGalaxy = window.SpiralGalaxy || {};

window.SpiralGalaxy.Glow = class Glow {
  constructor({ texture }) {
    this._texture = texture;
  }

  createSprite({ color, size, opacity }) {
    const mat = new THREE.SpriteMaterial({
      map: this._texture,
      color,
      transparent: true,
      opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(size, size, 1);
    return sprite;
  }
};