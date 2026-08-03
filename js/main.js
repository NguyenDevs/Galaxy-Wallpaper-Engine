window.SpiralGalaxy = window.SpiralGalaxy || {};

window.SpiralGalaxy.create = function create() {
  const Config = window.SpiralGalaxy.Config;

  const engine = new window.SpiralGalaxy.Engine({
    container: document.body,
    camera: Config.camera,
    post: Config.post
  });

  const random = window.SpiralGalaxy.Random;
  const ramp = new window.SpiralGalaxy.ColorRamp();
  const pointTex = window.SpiralGalaxy.SpriteTexture.create(64, 0.3);
  const cloudTex = window.SpiralGalaxy.NebulaField.makeTexture();

  const factory = new window.SpiralGalaxy.PointsFactory({
    texture: pointTex,
    pixelRatio: engine.pixelRatio
  });

  const generators = new window.SpiralGalaxy.Generators({ config: Config, random, ramp });

  const systems = [];
  function addPoints(group, opts) {
    const points = factory.build(opts);
    systems.push(points);
    group.add(points);
    return points;
  }

  const galaxy = new THREE.Group();
  galaxy.rotation.x = Config.galaxy.inclinationX;
  galaxy.rotation.z = Config.galaxy.inclinationZ;
  galaxy.scale.set(1.08, 1, 0.94);
  engine.scene.add(galaxy);

  const P = Config.particles;

  addPoints(galaxy, { ...P.disk, generator: generators.disk() });
  addPoints(galaxy, { ...P.diskHaze, generator: generators.diskHaze() });
  addPoints(galaxy, { ...P.bar, generator: generators.bar() });
  addPoints(galaxy, { ...P.core, generator: generators.core() });

  const halo = new THREE.Group();
  halo.rotation.copy(galaxy.rotation);
  engine.scene.add(halo);
  addPoints(halo, { ...P.halo, generator: generators.halo() });

  const companion = new THREE.Group();
  companion.position.set(...Config.companion.position);
  companion.rotation.copy(galaxy.rotation);
  engine.scene.add(companion);
  addPoints(companion, { ...P.companion, generator: generators.companion() });

  addPoints(engine.scene, { ...P.background, generator: generators.background() });
  addPoints(engine.scene, { ...P.fgStars, generator: generators.fgStars() });

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

    addPoints(inner, { ...P.bgGalaxies, generator: generators.bgGalaxy(g) });
    addPoints(inner, { ...P.bgGlow, generator: generators.bgGalaxyGlow(g) });

    engine.scene.add(outer);
    bgSpinGroups.push(inner);
  }

  const glow = new window.SpiralGalaxy.Glow({ texture: pointTex });
  const coreGlow = glow.createSprite({
    color: Config.coreGlow.color,
    size: Config.coreGlow.size,
    opacity: Config.coreGlow.opacity
  });
  galaxy.add(coreGlow);

  new window.SpiralGalaxy.GalaxyDust({
    group: galaxy,
    texture: cloudTex,
    config: Config.galaxyDust
  });

  new window.SpiralGalaxy.NebulaField({
    scene: engine.scene,
    config: Config.nebulaField
  });

  const controls = new window.SpiralGalaxy.OrbitControls({
    element: engine.renderer.domElement,
    camera: engine.camera,
    limits: Config.camera.limits,
    initial: Config.camera.start,
    inertia: Config.controls
  });

  const clock = new THREE.Clock();
  let elapsed = 0;

  function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.05);
    elapsed += dt;

    galaxy.rotation.y += Config.galaxy.rotationSpeed * dt;
    halo.rotation.y += Config.galaxy.rotationSpeed * Config.galaxy.haloRotationFactor * dt;
    companion.rotation.y += Config.galaxy.rotationSpeed * Config.galaxy.companionRotationFactor * dt;

    for (const s of systems) {
      s.material.uniforms.uTime.value = elapsed;
    }

    for (const grp of bgSpinGroups) {
      grp.rotation.y += bgSpin.speed * grp.userData.spin * dt;
    }

    engine.render();
  }
  animate();
};
