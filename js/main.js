window.SpiralGalaxy = window.SpiralGalaxy || {};

window.SpiralGalaxy.create = function create() {
  const Config = window.SpiralGalaxy.Config;

  const engine = new window.SpiralGalaxy.Engine({
    container: document.body,
    camera: Config.camera
  });

  const random = window.SpiralGalaxy.Random;
  const ramp = new window.SpiralGalaxy.ColorRamp();
  const pointTex = window.SpiralGalaxy.SpriteTexture.create(128, 0.35);

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
  addPoints(engine.scene, { ...P.bgGalaxies, generator: generators.bgGalaxies() });
  addPoints(engine.scene, { ...P.fgStars, generator: generators.fgStars() });

  new window.SpiralGalaxy.NebulaField({
    scene: engine.scene,
    config: Config.nebulaField
  });

  const controls = new window.SpiralGalaxy.OrbitControls({
    element: engine.renderer.domElement,
    camera: engine.camera,
    limits: Config.camera.limits,
    initial: Config.camera.start
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

    engine.render();
  }
  animate();
};
