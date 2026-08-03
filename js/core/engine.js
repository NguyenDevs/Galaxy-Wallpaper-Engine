window.SpiralGalaxy = window.SpiralGalaxy || {};

window.SpiralGalaxy.Engine = class Engine {
  constructor({ container, camera: cameraCfg, post }) {
    this._post = post || {};

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
    this.resize();
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
};