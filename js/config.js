window.SpiralGalaxy = window.SpiralGalaxy || {};

window.SpiralGalaxy.Config = {
  camera: {
    fov: 52,
    near: 0.1,
    far: 5000,
    start: { azimuth: 0.0, elevation: 0.35, radius: 660 },
    targetOffset: 200,
    limits: {
      minElevation: -1.2,
      maxElevation: 1.3,
      minRadius: 220,
      maxRadius: 1400
    }
  },

  post: {
    bloom: {
      enabled: true,
      strength: 1.2,
      radius: 0.75,
      threshold: 0.45
    }
  },

  controls: {
    enabled: true,
    damping: 0.4,
    stopSpeed: 0.015,
    blendMs: 70,
    velocityGain: 0.22,
    spin360: true,
    spinDuration: 4.5
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
    disk:       { count: 32000, sizeBase: 2.4, opacity: 0.95, twinkle: 0.24 },
    diskHaze:   { count: 20000, sizeBase: 4.6, opacity: 0.32, twinkle: 0.22 },
    bar:        { count: 12000, sizeBase: 2.3, opacity: 0.95, twinkle: 0.26 },
    core:       { count: 9000,  sizeBase: 2.6, opacity: 1.0,  twinkle: 0.28 },
    halo:       { count: 22000, sizeBase: 2.8, opacity: 0.4,  twinkle: 0.28 },
    companion:  { count: 1200,  sizeBase: 2.2, opacity: 0.6,  twinkle: 0.26 },
    background: { count: 4000,  sizeBase: 2.2, opacity: 1.0,  twinkle: 0.5 },
    bgGalaxies: { count: 900,   sizeBase: 4.5, opacity: 1.0,  twinkle: 0.32 },
    bgGlow:     { count: 6,     sizeBase: 11,  opacity: 0.5,  twinkle: 0 },
    fgStars:    { count: 1000,  sizeBase: 4.0, opacity: 1.0,  twinkle: 0.8 }
  },

  bgSpin: {
    speed: 0.02
  },

  companion: {
    position: [260, 140, -80]
  },

  coreGlow: {
    size: 240,
    opacity: 0.9,
    color: 0xffb4be
  },

  galaxyDust: {
    count: 80,
    radiusMin: 30,
    radiusMax: 400,
    scaleMin: 130,
    scaleMax: 360,
    opacityMin: 0.18,
    opacityMax: 0.42,
    tints: [0x2fb0d8, 0x35c9d6, 0x3f9fd8, 0x6bd8ff, 0xff5bb8, 0xff4f7a, 0xff7aa8, 0xff6f9c]
  },

  nebulaField: {
    count: 26,
    radiusMin: 700,
    radiusMax: 2100,
    scaleMin: 500,
    scaleMax: 1300,
    opacityMin: 0.2,
    opacityMax: 0.42,
    tints: [0x2f9fd8, 0x35c9d6, 0x4fd8ff, 0x6bd8ff, 0xff4f7a, 0xff5bb8, 0xff6f9c]
  }
};