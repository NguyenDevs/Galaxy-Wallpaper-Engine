window.SpiralGalaxy = window.SpiralGalaxy || {};

window.SpiralGalaxy.Config = {
  camera: {
    fov: 52,
    near: 0.1,
    far: 5000,
    start: { azimuth: 0.0, elevation: 0.35, radius: 660 },
    limits: {
      minElevation: -1.2,
      maxElevation: 1.3,
      minRadius: 220,
      maxRadius: 1400
    }
  },

  galaxy: {
    arms: 3,
    armTwist: 3.1,
    maxRadius: 300,
    inclinationX: 1.15,
    inclinationZ: -0.35,
    rotationSpeed: 0.03,
    haloRotationFactor: 0.25,
    companionRotationFactor: 0.4,
    diskFlare: 0.045,
    diskWarp: 13
  },

  particles: {
    disk:       { count: 26000, sizeBase: 3.2, opacity: 0.95, twinkle: 0.06 },
    core:       { count: 8000,  sizeBase: 3.4, opacity: 1.0,  twinkle: 0.12 },
    halo:       { count: 5000,  sizeBase: 2.0, opacity: 0.45, twinkle: 0.35 },
    companion:  { count: 900,   sizeBase: 2.6, opacity: 0.55, twinkle: 0.1 },
    background: { count: 3500,  sizeBase: 7.0, opacity: 1.0,  twinkle: 0.5 },
    bgGalaxies: { count: 5000,  sizeBase: 5.5, opacity: 0.8,  twinkle: 0.15 },
    fgStars:    { count: 900,   sizeBase: 7.5, opacity: 1.0,  twinkle: 0.8 }
  },

  companion: {
    position: [260, 140, -80]
  },

  nebulaField: {
    count: 14,
    radiusMin: 800,
    radiusMax: 1900,
    scaleMin: 400,
    scaleMax: 900,
    opacityMin: 0.25,
    opacityMax: 0.5,
    tints: [0x7a5cff, 0xff6f9c, 0x4fd8ff, 0x8b6cff]
  }
};
