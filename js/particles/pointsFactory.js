window.SpiralGalaxy = window.SpiralGalaxy || {};

window.SpiralGalaxy.PointsFactory = class PointsFactory {
  constructor({ texture, pixelRatio }) {
    this._texture = texture;
    this._pixelRatio = pixelRatio;
  }

  build({ count, sizeBase, opacity, generator, twinkle = 0 }) {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const phases = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const p = generator(i);
      positions[i * 3 + 0] = p.x;
      positions[i * 3 + 1] = p.y;
      positions[i * 3 + 2] = p.z;
      colors[i * 3 + 0] = p.r;
      colors[i * 3 + 1] = p.g;
      colors[i * 3 + 2] = p.b;
      sizes[i] = p.size;
      phases[i] = p.phase !== undefined ? p.phase : Math.random() * Math.PI * 2;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: this._texture },
        uOpacity: { value: opacity },
        uSizeBase: { value: sizeBase },
        uPixelRatio: { value: this._pixelRatio },
        uTime: { value: 0 },
        uTwinkle: { value: twinkle }
      },
      vertexShader: `
        attribute float aSize;
        attribute float aPhase;
        varying vec3 vColor;
        uniform float uSizeBase;
        uniform float uPixelRatio;
        uniform float uTime;
        uniform float uTwinkle;
        void main() {
          float s1 = sin(uTime * 2.6 + aPhase);
          float s2 = sin(uTime * 5.1 + aPhase * 2.3);
          float tw = 1.0 + uTwinkle * (0.62 * s1 * s1 * s1 + 0.38 * s2);
          vColor = color * tw;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          float dist = -mvPosition.z;
          gl_PointSize = aSize * uSizeBase * uPixelRatio * (320.0 / dist);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform sampler2D uTexture;
        uniform float uOpacity;
        varying vec3 vColor;
        void main() {
          vec4 tex = texture2D(uTexture, gl_PointCoord);
          gl_FragColor = vec4(vColor, 1.0) * tex * uOpacity;
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true
    });

    return new THREE.Points(geo, mat);
  }
};
