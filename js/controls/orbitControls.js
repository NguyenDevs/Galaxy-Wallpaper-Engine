window.SpiralGalaxy = window.SpiralGalaxy || {};

window.SpiralGalaxy.OrbitControls = class OrbitControls {
  constructor({ element, camera, target, limits, initial, sensitivity, inertia }) {
    this._element = element;
    this._camera = camera;
    this._target = target || new THREE.Vector3();
    this._limits = limits;
    this._sensitivity = sensitivity || { orbit: 0.004, zoom: 0.4, touchOrbit: 0.006 };
    this._inertia = inertia || { enabled: false, damping: 0.08, stopSpeed: 0.0004, blendMs: 45 };

    this.azimuth = initial.azimuth;
    this.elevation = initial.elevation;
    this.radius = initial.radius;

    this._vAzimuth = 0;
    this._vElevation = 0;
    this._inertiaRaf = null;

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

  _trackVelocity(aVel, eVel) {
    const blend = Math.min(1, this._inertia.blendMs / Math.max(1, this._lastDragDt));
    this._vAzimuth = this._vAzimuth * (1 - blend) + aVel * blend;
    this._vElevation = this._vElevation * (1 - blend) + eVel * blend;
  }

  _stopInertia() {
    if (this._inertiaRaf !== null) {
      cancelAnimationFrame(this._inertiaRaf);
      this._inertiaRaf = null;
    }
    this._vAzimuth = 0;
    this._vElevation = 0;
  }

  _startInertia() {
    if (!this._inertia.enabled) return;
    const speed = Math.hypot(this._vAzimuth, this._vElevation);
    if (speed < this._inertia.stopSpeed) {
      this._vAzimuth = 0;
      this._vElevation = 0;
      return;
    }
    const dampPerSec = this._inertia.damping;
    const stopSpeed = this._inertia.stopSpeed;
    let last = performance.now();

    const step = () => {
      const now = performance.now();
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const damp = Math.pow(dampPerSec, dt);
      this._vAzimuth *= damp;
      this._vElevation *= damp;
      this.azimuth += this._vAzimuth * dt;
      this.elevation += this._vElevation * dt;
      this.apply();
      if (Math.hypot(this._vAzimuth, this._vElevation) < stopSpeed) {
        this._vAzimuth = 0;
        this._vElevation = 0;
        this._inertiaRaf = null;
        return;
      }
      this._inertiaRaf = requestAnimationFrame(step);
    };

    this._inertiaRaf = requestAnimationFrame(step);
  }

  _bind() {
    const el = this._element;
    const sens = this._sensitivity;

    this._onPointerDown = (e) => {
      this._stopInertia();
      this._isDragging = true;
      this._lastX = e.clientX;
      this._lastY = e.clientY;
      this._lastDragTime = performance.now();
      this._lastDragDt = 16;
    };
    this._onPointerUp = () => {
      this._isDragging = false;
      this._startInertia();
    };
    this._onPointerMove = (e) => {
      if (!this._isDragging) return;
      const now = performance.now();
      const dt = now - this._lastDragTime;
      this._lastDragDt = Math.max(4, dt);
      this._lastDragTime = now;
      const dx = e.clientX - this._lastX;
      const dy = e.clientY - this._lastY;
      this._lastX = e.clientX;
      this._lastY = e.clientY;
      this.azimuth -= dx * sens.orbit;
      this.elevation += dy * sens.orbit;
      this._trackVelocity(-dx * sens.orbit * 1000 / dt, dy * sens.orbit * 1000 / dt);
      this.apply();
    };
    this._onWheel = (e) => {
      this._stopInertia();
      this.radius += e.deltaY * sens.zoom;
      this.apply();
    };
    this._onTouchStart = (e) => {
      this._stopInertia();
      if (e.touches.length === 1) {
        this._touchLastX = e.touches[0].clientX;
        this._touchLastY = e.touches[0].clientY;
        this._lastDragTime = performance.now();
        this._lastDragDt = 16;
      }
    };
    this._onTouchMove = (e) => {
      if (e.touches.length !== 1) return;
      const now = performance.now();
      const dt = now - this._lastDragTime;
      this._lastDragDt = Math.max(4, dt);
      this._lastDragTime = now;
      const dx = e.touches[0].clientX - this._touchLastX;
      const dy = e.touches[0].clientY - this._touchLastY;
      this._touchLastX = e.touches[0].clientX;
      this._touchLastY = e.touches[0].clientY;
      this.azimuth -= dx * sens.touchOrbit;
      this.elevation += dy * sens.touchOrbit;
      this._trackVelocity(-dx * sens.touchOrbit * 1000 / dt, dy * sens.touchOrbit * 1000 / dt);
      this.apply();
    };
    this._onTouchEnd = (e) => {
      if (e.touches.length === 0) this._startInertia();
    };

    el.addEventListener('mousedown', this._onPointerDown);
    window.addEventListener('mouseup', this._onPointerUp);
    window.addEventListener('mousemove', this._onPointerMove);
    el.addEventListener('wheel', this._onWheel, { passive: true });
    el.addEventListener('touchstart', this._onTouchStart, { passive: true });
    el.addEventListener('touchmove', this._onTouchMove, { passive: true });
    el.addEventListener('touchend', this._onTouchEnd, { passive: true });
  }

  dispose() {
    this._stopInertia();
    const el = this._element;
    el.removeEventListener('mousedown', this._onPointerDown);
    window.removeEventListener('mouseup', this._onPointerUp);
    window.removeEventListener('mousemove', this._onPointerMove);
    el.removeEventListener('wheel', this._onWheel);
    el.removeEventListener('touchstart', this._onTouchStart);
    el.removeEventListener('touchmove', this._onTouchMove);
    el.removeEventListener('touchend', this._onTouchEnd);
  }
};
