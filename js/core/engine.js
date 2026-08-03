window.SpiralGalaxy = window.SpiralGalaxy || {};

window.SpiralGalaxy.Engine = class Engine {
  constructor({ container, camera: cameraCfg }) {
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

    this._onResize = () => this.resize();
    window.addEventListener('resize', this._onResize);
    this.resize();
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
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
};
