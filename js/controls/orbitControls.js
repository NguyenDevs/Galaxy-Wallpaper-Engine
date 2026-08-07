window.SpiralGalaxy = window.SpiralGalaxy || {};

window.SpiralGalaxy.OrbitControls = class OrbitControls {
  constructor({ element, camera, target, limits, initial, sensitivity, inertia, offset, drag }) {
    this._element = element;
    this._camera = camera;
    this._target = target || new THREE.Vector3();
    this._limits = limits;
    this._sensitivity = sensitivity || { orbit: 0.004, zoom: 0.4, touchOrbit: 0.006 };
    this._inertia = inertia || { enabled: false, damping: 0.08, stopSpeed: 0.0004, blendMs: 45 };
    this._offset = offset || 0;
    this._dragEnabled = drag !== undefined ? !!drag : true;
    if (this._offset) {
      // shift the orbit/zoom pivot to the LEFT of the galaxy (in world units),
      // so the galaxy sits offset right and zoom focuses on a point left of it
      this._target.x -= Math.abs(this._offset);
    }

    this.azimuth = initial.azimuth;
    this.elevation = initial.elevation;
    this.radius = initial.radius;

    this._vAzimuth = 0;
    this._vElevation = 0;
    this._inertiaRaf = null;

    this._isDragging = false;
    this._activePointerId = null;

    if (this._element.style) this._element.style.touchAction = 'none';

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
    const gain = this._inertia.velocityGain || 1;
    this._vAzimuth = this._vAzimuth * (1 - blend) + aVel * blend * gain;
    this._vElevation = this._vElevation * (1 - blend) + eVel * blend * gain;
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

    // Pointer Events with pointer capture: pointerup is guaranteed to be
    // delivered to the canvas even when the pointer leaves the window, so a
    // missed release can never leave the controls permanently "dragging".
    this._onPointerDown = (e) => {
      if (!this._dragEnabled) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      this._stopInertia();
      this._isDragging = true;
      this._activePointerId = e.pointerId;
      this._lastX = e.clientX;
      this._lastY = e.clientY;
      this._lastDragTime = performance.now();
      this._lastDragDt = 16;
      try {
        if (el.setPointerCapture) el.setPointerCapture(e.pointerId);
      } catch (err) {}
    };
    this._onPointerMove = (e) => {
      if (!this._isDragging || e.pointerId !== this._activePointerId) return;
      const now = performance.now();
      const dt = now - this._lastDragTime;
      this._lastDragDt = Math.max(4, dt);
      this._lastDragTime = now;
      const dx = e.clientX - this._lastX;
      const dy = e.clientY - this._lastY;
      this._lastX = e.clientX;
      this._lastY = e.clientY;
      const k = e.pointerType === 'touch' ? sens.touchOrbit : sens.orbit;
      this.azimuth -= dx * k;
      this.elevation += dy * k;
      this._trackVelocity(-dx * k * 1000 / dt, dy * k * 1000 / dt);
      this.apply();
    };
    this._onPointerUp = (e) => {
      if (e.pointerId !== this._activePointerId) return;
      this._isDragging = false;
      this._activePointerId = null;
      this._releaseCapture(e.pointerId);
      this._startInertia();
    };
    this._onPointerCancel = (e) => {
      if (e.pointerId !== this._activePointerId) return;
      this._isDragging = false;
      this._activePointerId = null;
      this._releaseCapture(e.pointerId);
      this._stopInertia();
    };
    this._onLostCapture = (e) => {
      if (e.pointerId !== this._activePointerId) return;
      this._isDragging = false;
      this._activePointerId = null;
      this._stopInertia();
    };
    // Another window (e.g. the Lively settings panel) stole focus: a mouseup
    // may never reach us, so reset the drag state instead of leaving it stuck.
    this._onBlur = () => {
      if (!this._isDragging) return;
      this._isDragging = false;
      this._activePointerId = null;
      this._stopInertia();
    };

    el.addEventListener('pointerdown', this._onPointerDown);
    window.addEventListener('pointermove', this._onPointerMove);
    window.addEventListener('pointerup', this._onPointerUp);
    window.addEventListener('pointercancel', this._onPointerCancel);
    el.addEventListener('lostpointercapture', this._onLostCapture);
    window.addEventListener('blur', this._onBlur);
  }

  _releaseCapture(pointerId) {
    const el = this._element;
    if (pointerId === null || pointerId === undefined) return;
    try {
      if (el.releasePointerCapture && el.hasPointerCapture && el.hasPointerCapture(pointerId)) {
        el.releasePointerCapture(pointerId);
      }
    } catch (err) {}
  }

  setDragEnabled(value) {
    this._dragEnabled = !!value;
    if (!this._dragEnabled) {
      this._isDragging = false;
      this._activePointerId = null;
      this._stopInertia();
    }
  }

  dispose() {
    this._stopInertia();
    this._releaseCapture(this._activePointerId);
    const el = this._element;
    el.removeEventListener('pointerdown', this._onPointerDown);
    window.removeEventListener('pointermove', this._onPointerMove);
    window.removeEventListener('pointerup', this._onPointerUp);
    window.removeEventListener('pointercancel', this._onPointerCancel);
    el.removeEventListener('lostpointercapture', this._onLostCapture);
    window.removeEventListener('blur', this._onBlur);
  }
};
