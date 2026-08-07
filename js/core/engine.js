window.SpiralGalaxy = window.SpiralGalaxy || {};

window.SpiralGalaxy.Engine = class Engine {
  constructor({ container, camera: cameraCfg, post }) {
    this._post = post || {};
    this._contextCallbacks = { onLost: null, onRestored: null };

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setClearColor(0x000000, 1);
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      cameraCfg.fov,
      1,
      cameraCfg.near,
      cameraCfg.far
    );

    this._setupComposer();

    this._onResize = () => this.resize();
    window.addEventListener('resize', this._onResize);

    this._onContextLost = (e) => {
      if (e && e.preventDefault) e.preventDefault();
      if (this._contextCallbacks.onLost) this._contextCallbacks.onLost();
    };
    this._onContextRestored = () => {
      if (this._contextCallbacks.onRestored) this._contextCallbacks.onRestored();
    };
    this.renderer.domElement.addEventListener('webglcontextlost', this._onContextLost, false);
    this.renderer.domElement.addEventListener('webglcontextrestored', this._onContextRestored, false);

    this.resize();
  }

  setContextCallbacks(callbacks) {
    this._contextCallbacks = callbacks || {};
  }

  _setupComposer() {
    this._composer = null;
    this._bloomPass = null;

    const bloom = this._post.bloom;
    const hasPostLibs =
      window.THREE.EffectComposer && window.THREE.RenderPass && window.THREE.UnrealBloomPass;

    if (bloom && bloom.enabled && hasPostLibs) {
      this._composer = new THREE.EffectComposer(this.renderer);
      this._composer.addPass(new THREE.RenderPass(this.scene, this.camera));

      this._bloomPass = new THREE.UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        bloom.strength,
        bloom.radius,
        bloom.threshold
      );
      this._composer.addPass(this._bloomPass);
    }
  }

  get pixelRatio() {
    return Math.min(window.devicePixelRatio || 1, 2);
  }

  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    // Guard against 0-sized windows (e.g. while Lively resizes the wallpaper);
    // zero-size render targets make the bloom pass output black frames.
    if (!isFinite(w) || !isFinite(h) || w <= 0 || h <= 0) return;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);

    if (this._composer) {
      this._composer.setSize(w, h);
    }
  }

  render() {
    if (this._composer) {
      this._composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }

  dispose() {
    window.removeEventListener('resize', this._onResize);

    if (this.renderer && this.renderer.domElement) {
      this.renderer.domElement.removeEventListener('webglcontextlost', this._onContextLost);
      this.renderer.domElement.removeEventListener('webglcontextrestored', this._onContextRestored);
    }

    this.scene.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) {
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        for (const m of mats) {
          if (m.map) m.map.dispose();
          m.dispose();
        }
      }
    });

    if (this._composer && this._composer.dispose) this._composer.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
};