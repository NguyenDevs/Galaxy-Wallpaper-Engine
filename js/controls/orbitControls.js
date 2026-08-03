window.SpiralGalaxy = window.SpiralGalaxy || {};

window.SpiralGalaxy.OrbitControls = class OrbitControls {
  constructor({ element, camera, target, limits, initial, sensitivity }) {
    this._element = element;
    this._camera = camera;
    this._target = target || new THREE.Vector3();
    this._limits = limits;
    this._sensitivity = sensitivity || { orbit: 0.004, zoom: 0.4, touchOrbit: 0.006 };

    this.azimuth = initial.azimuth;
    this.elevation = initial.elevation;
    this.radius = initial.radius;

    this._bind();
    this.apply();
  }

  _clamp() {
    this.elevation = Math.max(
      this._limits.minElevation,
      Math.min(this._limits.maxElevation, this.elevation)
    );
    this.radius = Math.max(
      this._limits.minRadius,
      Math.min(this._limits.maxRadius, this.radius)
    );
  }

  apply() {
    this._clamp();
    const c = Math.cos(this.elevation);
    this._camera.position.set(
      this.radius * c * Math.sin(this.azimuth) + this._target.x,
      this.radius * Math.sin(this.elevation) + this._target.y,
      this.radius * c * Math.cos(this.azimuth) + this._target.z
    );
    this._camera.lookAt(this._target);
  }

  _bind() {
    const el = this._element;
    const sens = this._sensitivity;

    this._onPointerDown = (e) => {
      this._isDragging = true;
      this._lastX = e.clientX;
      this._lastY = e.clientY;
    };
    this._onPointerUp = () => {
      this._isDragging = false;
    };
    this._onPointerMove = (e) => {
      if (!this._isDragging) return;
      const dx = e.clientX - this._lastX;
      const dy = e.clientY - this._lastY;
      this._lastX = e.clientX;
      this._lastY = e.clientY;
      this.azimuth -= dx * sens.orbit;
      this.elevation += dy * sens.orbit;
      this.apply();
    };
    this._onWheel = (e) => {
      this.radius += e.deltaY * sens.zoom;
      this.apply();
    };
    this._onTouchStart = (e) => {
      if (e.touches.length === 1) {
        this._touchLastX = e.touches[0].clientX;
        this._touchLastY = e.touches[0].clientY;
      }
    };
    this._onTouchMove = (e) => {
      if (e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - this._touchLastX;
      const dy = e.touches[0].clientY - this._touchLastY;
      this._touchLastX = e.touches[0].clientX;
      this._touchLastY = e.touches[0].clientY;
      this.azimuth -= dx * sens.touchOrbit;
      this.elevation += dy * sens.touchOrbit;
      this.apply();
    };

    el.addEventListener('mousedown', this._onPointerDown);
    window.addEventListener('mouseup', this._onPointerUp);
    window.addEventListener('mousemove', this._onPointerMove);
    el.addEventListener('wheel', this._onWheel, { passive: true });
    el.addEventListener('touchstart', this._onTouchStart, { passive: true });
    el.addEventListener('touchmove', this._onTouchMove, { passive: true });
  }

  dispose() {
    const el = this._element;
    el.removeEventListener('mousedown', this._onPointerDown);
    window.removeEventListener('mouseup', this._onPointerUp);
    window.removeEventListener('mousemove', this._onPointerMove);
    el.removeEventListener('wheel', this._onWheel);
    el.removeEventListener('touchstart', this._onTouchStart);
    el.removeEventListener('touchmove', this._onTouchMove);
  }
};