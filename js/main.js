window.SpiralGalaxy = window.SpiralGalaxy || {};

(function () {
  const baseConfig = window.SpiralGalaxy.Config;
  const overrides = {};
  let eff = deepMerge(baseConfig, {}); // effective (base + overrides) config
  let current = null;
  let engine = null; // persistent renderer/composer reused across rebuilds
  let rafId = 0;

  // Live (non-generation) tweaks applied without a rebuild.
  const live = {
    radius: baseConfig.camera.start.radius,
    posX: 0,
    posY: 0,
    size: baseConfig.galaxy.size || 1.08,
    brightness: 1.0,
    tint: { r: 1, g: 1, b: 1 },
    tintBg: false,
    particleSize: 1.0,
    dragEnabled: true
  };

  function deepMerge(base, obj) {
    const out = Array.isArray(base) ? base.slice() : Object.assign({}, base);
    for (const k in obj) {
      if (!Object.prototype.hasOwnProperty.call(obj, k)) continue;
      const v = obj[k];
      const b = out[k];
      if (
        v && typeof v === 'object' && !Array.isArray(v) &&
        b && typeof b === 'object' && !Array.isArray(b)
      ) {
        out[k] = deepMerge(b, v);
      } else {
        out[k] = v;
      }
    }
    return out;
  }

  function hextoRgb(hex) {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '');
    if (!m) return { r: 1, g: 1, b: 1 };
    return {
      r: parseInt(m[1], 16) / 255,
      g: parseInt(m[2], 16) / 255,
      b: parseInt(m[3], 16) / 255
    };
  }

  function rebuildFromConfig(props) {
    const num = (v, def) => (v === undefined || v === null || v === '') ? def : parseFloat(v);
    const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

    // ---- Generation-scoped settings (need a rebuild) ----
    overrides.particleMultiplier = clamp(num(props.particleamount, 100), 10, 300) / 100;
    overrides.post = overrides.post || {};
    overrides.post.bloom = overrides.post.bloom || {};
    overrides.post.bloom.radius = baseConfig.post.bloom.radius * (num(props.bloomradius, 100) / 100);

    // ---- Everything else is live-applied ----
    live.radius = clamp(num(props.galaxyzoom, 660), baseConfig.camera.limits.minRadius, baseConfig.camera.limits.maxRadius);
    live.posX = num(props.galaxyposx, 0);
    live.posY = num(props.galaxyposy, 0);
    live.size = clamp(num(props.galaxysize, 108), 30, 200) / 100;
    live.brightness = clamp(num(props.galaxybrightness, 100), 0, 300) / 100;

    // rotation speed (live; read from eff each frame)
    overrides.galaxy = overrides.galaxy || {};
    overrides.galaxy.rotationSpeed =
      baseConfig.galaxy.rotationSpeed * (num(props.rotationspeed, 100) / 100);

    // bloom strength (live)
    overrides.post.bloom.strength =
      baseConfig.post.bloom.strength * (num(props.bloomstrength, 100) / 100);

    // particle size scale (live)
    live.particleSize = Math.max(0.1, num(props.particlesize, 100) / 100);

    // galaxy color tint (live)
    const tint = hextoRgb(props.galaxycolor);
    live.tint = tint;
    live.tintBg = props.galaxytintbg ? !!props.galaxytintbg : false;

    // mouse interaction (live)
    live.dragEnabled = props.mousefollow !== false;

    eff = deepMerge(baseConfig, overrides);
  }

  function disposeMaterial(material) {
    const mats = Array.isArray(material) ? material : [material];
    for (const m of mats) {
      if (m.map) m.map.dispose();
      m.dispose();
    }
  }

  function disposeObject(o) {
    if (o.geometry) o.geometry.dispose();
    if (o.material) disposeMaterial(o.material);
  }

  // Remove and free the current scene objects, but KEEP the renderer so we
  // never exhaust the browser's limited number of WebGL contexts (which caused
  // the galaxy to render black after repeated config-driven rebuilds).
  function clearScene() {
    if (!current) return;
    cancelAnimationFrame(rafId);
    rafId = 0;
    if (current.controls) current.controls.dispose();
    if (engine) {
      engine.scene.traverse(disposeObject);
      while (engine.scene.children.length) {
        engine.scene.remove(engine.scene.children[0]);
      }
    }
    current = null;
  }

  // Tear down everything, including the persistent renderer.
  function dispose() {
    clearScene();
    if (engine) {
      engine.dispose();
      engine = null;
    }
  }

  // ---------------------- Build the scene ----------------------
  function build() {
    clearScene();
    const Config = eff;
    current = {};
    const C = current;

    if (!engine) {
      engine = new window.SpiralGalaxy.Engine({
        container: document.body,
        camera: Config.camera,
        post: Config.post
      });
    }
    C.engine = engine;

    const random = window.SpiralGalaxy.Random;
    const ramp = new window.SpiralGalaxy.ColorRamp();
    const pointTex = window.SpiralGalaxy.SpriteTexture.create(64, 0.3);
    const cloudTex = window.SpiralGalaxy.NebulaField.makeTexture();

    const factory = new window.SpiralGalaxy.PointsFactory({
      texture: pointTex,
      pixelRatio: engine.pixelRatio
    });
    const generators = new window.SpiralGalaxy.Generators({ config: Config, random, ramp });

    const pm = Config.particleMultiplier != null ? Config.particleMultiplier : 1;
    const cnt = (n) => Math.max(1, Math.round(n * pm));

    const systems = [];
    const galaxy = new THREE.Group();
    galaxy.rotation.x = Config.galaxy.inclinationX;
    galaxy.rotation.z = Config.galaxy.inclinationZ;
    engine.scene.add(galaxy);

    const P = Config.particles;

    function addPoints(group, opts, tintGroup) {
      const points = factory.build(opts);
      points.userData.tintGroup = tintGroup;
      points.userData.sizeBase = opts.sizeBase;
      systems.push(points);
      group.add(points);
      return points;
    }

    addPoints(galaxy, { ...P.disk, count: cnt(P.disk.count), generator: generators.disk() }, 'galaxy');
    addPoints(galaxy, { ...P.diskHaze, count: cnt(P.diskHaze.count), generator: generators.diskHaze() }, 'galaxy');
    addPoints(galaxy, { ...P.bar, count: cnt(P.bar.count), generator: generators.bar() }, 'galaxy');
    addPoints(galaxy, { ...P.core, count: cnt(P.core.count), generator: generators.core() }, 'galaxy');

    const halo = new THREE.Group();
    halo.rotation.copy(galaxy.rotation);
    engine.scene.add(halo);
    addPoints(halo, { ...P.halo, count: cnt(P.halo.count), generator: generators.halo() }, 'galaxy');

    const companion = new THREE.Group();
    companion.position.set(...Config.companion.position);
    companion.rotation.copy(galaxy.rotation);
    engine.scene.add(companion);
    addPoints(companion, { ...P.companion, count: cnt(P.companion.count), generator: generators.companion() }, 'galaxy');

    addPoints(engine.scene, { ...P.background, count: cnt(P.background.count), generator: generators.background() }, 'bg');
    addPoints(engine.scene, { ...P.fgStars, count: cnt(P.fgStars.count), generator: generators.fgStars() }, 'bg');

    const bgSpinGroups = [];
    const bgSpin = Config.bgSpin;
    for (const g of generators.bgGalaxiesList()) {
      const outer = new THREE.Group();
      outer.position.set(g.x, g.y, g.z);
      outer.rotation.x = g.tiltX;
      outer.rotation.z = g.tiltY;

      const inner = new THREE.Group();
      inner.userData.spin = g.spin;
      outer.add(inner);

      addPoints(inner, { ...P.bgGalaxies, count: cnt(P.bgGalaxies.count), generator: generators.bgGalaxy(g) }, 'bg');
      addPoints(inner, { ...P.bgGlow, count: cnt(P.bgGlow.count), generator: generators.bgGalaxyGlow(g) }, 'bg');

      engine.scene.add(outer);
      bgSpinGroups.push(inner);
    }

    const glow = new window.SpiralGalaxy.Glow({ texture: pointTex });
    const coreGlow = glow.createSprite({
      color: Config.coreGlow.color,
      size: Config.coreGlow.size,
      opacity: Config.coreGlow.opacity
    });
    coreGlow.material.userData.baseColor = new THREE.Color(Config.coreGlow.color);
    galaxy.add(coreGlow);

    const dustMeshes = new window.SpiralGalaxy.GalaxyDust({
      group: galaxy,
      texture: cloudTex,
      config: Config.galaxyDust
    }).meshes;

    const nebulaMeshes = new window.SpiralGalaxy.NebulaField({
      scene: engine.scene,
      config: Config.nebulaField
    }).meshes;

    const controls = new window.SpiralGalaxy.OrbitControls({
      element: engine.renderer.domElement,
      camera: engine.camera,
      limits: Config.camera.limits,
      initial: Config.camera.start,
      inertia: Config.controls,
      offset: Config.camera.targetOffset,
      drag: live.dragEnabled
    });

    const clock = new THREE.Clock();
    let elapsed = 0;

    C.controls = controls;
    C.galaxy = galaxy;
    C.halo = halo;
    C.companion = companion;
    C.bgSpinGroups = bgSpinGroups;
    C.systems = systems;
    C.coreGlow = coreGlow;
    C.meshes = dustMeshes.concat(nebulaMeshes);

    function animate() {
      rafId = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);
      elapsed += dt;

      galaxy.rotation.y += eff.galaxy.rotationSpeed * dt;
      halo.rotation.y += eff.galaxy.rotationSpeed * eff.galaxy.haloRotationFactor * dt;
      companion.rotation.y += eff.galaxy.rotationSpeed * eff.galaxy.companionRotationFactor * dt;

      for (const s of systems) {
        s.material.uniforms.uTime.value = elapsed;
      }
      for (const grp of bgSpinGroups) {
        grp.rotation.y += Config.bgSpin.speed * grp.userData.spin * dt;
      }

      engine.render();
    }
    animate();
  }

  // ------------------- Live adjustments (no rebuild) --------
  function applyLive() {
    const C = current;
    if (!C) return;

    const bt = live.brightness;
    const tintR = live.tint.r * bt;
    const tintG = live.tint.g * bt;
    const tintB = live.tint.b * bt;

    for (const pts of C.systems) {
      const isBg = pts.userData.tintGroup === 'bg';
      const useTint = !isBg || live.tintBg;
      const r = useTint ? tintR : bt;
      const g = useTint ? tintG : bt;
      const b2 = useTint ? tintB : bt;
      const tintU = pts.material.uniforms.uTint.value;
      tintU.r = r; tintU.g = g; tintU.b = b2;
      pts.material.uniforms.uSizeBase.value = pts.userData.sizeBase * live.particleSize;
    }

    const tintVec = new THREE.Color(tintR, tintG, tintB);
    for (const mesh of C.meshes) {
      const base = mesh.material.userData.baseColor;
      if (base) {
        mesh.material.color.copy(base).multiply(tintVec);
      } else {
        mesh.material.color.setRGB(tintR, tintG, tintB);
      }
    }

    if (C.coreGlow && C.coreGlow.material) {
      const base = C.coreGlow.material.userData.baseColor || new THREE.Color(1, 1, 1);
      C.coreGlow.material.color.copy(base).multiply(tintVec);
    }

    // static layout
    C.galaxy.position.set(live.posX, live.posY, 0);
    C.halo.position.set(live.posX, live.posY, 0);
    const cpos = baseConfig.companion.position;
    C.companion.position.set(live.posX + cpos[0], live.posY + cpos[1], cpos[2]);

    const s = live.size;
    C.galaxy.scale.set(s, 1, s * 0.87037);
    C.halo.scale.set(s, 1, s * 0.87037);
    C.companion.scale.set(s, 1, s * 0.87037);

    // zoom / camera distance
    if (C.controls) {
      if (C.controls.setDragEnabled) C.controls.setDragEnabled(live.dragEnabled);
      C.controls.radius = Math.max(
        baseConfig.camera.limits.minRadius,
        Math.min(baseConfig.camera.limits.maxRadius, live.radius)
      );
      C.controls.apply();
    }

    // bloom strength + radius (live)
    if (C.engine && C.engine._bloomPass && eff.post.bloom) {
      C.engine._bloomPass.strength = eff.post.bloom.strength;
      C.engine._bloomPass.radius = eff.post.bloom.radius;
    }
  }

  // ------------------- Public API --------------------------
  let lastGenKey = null;

  // Only generation-scoped settings require a rebuild. Everything else is
  // applied live, so rebuilds (and new renderers) stay rare.
  function genKey() {
    return String(overrides.particleMultiplier || 1);
  }

  window.SpiralGalaxy.create = function () {
    rebuildFromConfig({});
    build();
    lastGenKey = genKey();
    window.SpiralGalaxy.applyLive();
  };

  window.SpiralGalaxy.applyLive = applyLive;

  // Called by the Lively Wallpaper property listener.
  let pendingBuild = null;
  window.SpiralGalaxy.applyWallpaperProperties = function (props, forceBuild) {
    const prevKey = lastGenKey;
    rebuildFromConfig(props || {});

    const nowKey = genKey();
    const needBuild = forceBuild || nowKey !== prevKey || !current;

    // Always apply live tweaks immediately.
    applyLive();

    if (needBuild) {
      if (pendingBuild) clearTimeout(pendingBuild);
      pendingBuild = setTimeout(function () {
        pendingBuild = null;
        build();
        lastGenKey = nowKey;
        applyLive();
      }, 250);
    }
  };

  window.SpiralGalaxy.dispose = dispose;
  window.SpiralGalaxy.current = function () { return current; };
})();