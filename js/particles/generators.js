window.SpiralGalaxy = window.SpiralGalaxy || {};

window.SpiralGalaxy.Generators = class Generators {
  constructor({ config, random, ramp }) {
    this._cfg = config;
    this._random = random;
    this._ramp = ramp;
  }

  disk() {
    const cfg = this._cfg.galaxy;
    const { rand, gauss } = this._random;

    const hotTints = [
      [1.3, 0.85, 1.0],
      [0.75, 0.95, 1.3],
      [1.25, 1.05, 0.85]
    ];

    const armsData = [];
    for (let a = 0; a < cfg.arms; a++) {
      const knots = [];
      for (let k = 0; k < 6; k++) {
        knots.push({
          r: Math.pow(Math.random(), 0.7) * cfg.maxRadius,
          width: rand(18, 42),
          tint: hotTints[Math.floor(Math.random() * hotTints.length)]
        });
      }
      armsData.push({ knots });
    }

    return () => {
      const armIndex = Math.floor(Math.random() * cfg.arms);
      const armOffset = (armIndex / cfg.arms) * Math.PI * 2;
      const arm = armsData[armIndex];

      const rr = Math.pow(Math.random(), 0.65) * cfg.maxRadius;

      const twist = rr * (cfg.armTwist / cfg.maxRadius) * Math.PI * 2;
      const wobble =
        Math.sin(rr * 0.012 + armIndex * 2.1) * 0.35 +
        Math.sin(rr * 0.027 + armIndex * 4.7) * 0.18;
      const scatter = 0.1 + (rr / cfg.maxRadius) * 0.38;
      const angle = armOffset + twist + wobble + gauss() * scatter;

      const rJitter = gauss() * (7 + rr * 0.07);
      const r = Math.max(2, rr + rJitter);

      const thickness = gauss() * (2.5 + rr * cfg.diskFlare);
      const warp = cfg.diskWarp * Math.pow(rr / cfg.maxRadius, 2.2) * Math.sin(angle + armIndex * 1.9);
      const mid = Math.sin(rr * 0.04 + armIndex * 2.7) * 1.5;
      const y = warp + thickness + mid;

      let colorT = Math.min(1, r / cfg.maxRadius) * rand(0.8, 1.15);
      colorT = Math.max(0, colorT);
      const [baseR, baseG, baseB] = this._ramp.compute(colorT, false);

      const warmth = Math.sin(rr * 0.016 + armIndex * 2.3);
      let cr = baseR, cg = baseG, cb = baseB;
      if (warmth > 0) { cr *= 1.12; cg *= 1.03; cb *= 0.85; }
      else { cr *= 0.92; cg *= 1.02; cb *= 1.12; }

      let knotBoost = 0;
      let knotTint = [1, 1, 1];
      for (const k of arm.knots) {
        const d = Math.abs(rr - k.r);
        if (d < k.width) {
          const w = 1 - d / k.width;
          if (w > knotBoost) { knotBoost = w; knotTint = k.tint; }
        }
      }
      const knotW = knotBoost * knotBoost;
      const brightness = 1 + knotW * 0.9;
      const size = rand(0.8, 2.2) * (1 - 0.28 * (r / cfg.maxRadius)) * (1 + knotW * 0.9);

      const t = Math.random() < knotW
        ? knotTint
        : [rand(0.92, 1.08), rand(0.92, 1.08), rand(0.92, 1.08)];

      return {
        x: Math.cos(angle) * r,
        y: y,
        z: Math.sin(angle) * r,
        r: cr * t[0] * brightness, g: cg * t[1] * brightness, b: cb * t[2] * brightness,
        size,
        phase: rand(0, Math.PI * 2)
      };
    };
  }

  core() {
    const { rand, gauss } = this._random;

    const knots = [];
    for (let i = 0; i < 8; i++) {
      knots.push({
        r: Math.pow(Math.random(), 1.5) * 45,
        width: rand(8, 18),
        tint: [rand(1.0, 1.4), rand(0.8, 1.1), rand(0.9, 1.3)]
      });
    }

    return () => {
      const rr = Math.pow(Math.random(), 2.0) * 52;
      const angle = rand(0, Math.PI * 2);
      const thickness = gauss() * (rr * 0.45 + 3);
      const colorT = Math.min(0.55, (rr / 52) * 0.55);
      const [cr, cg, cb] = this._ramp.compute(colorT, true);

      let boost = 0;
      for (const k of knots) {
        const d = Math.abs(rr - k.r);
        if (d < k.width) {
          const w = 1 - d / k.width;
          if (w > boost) boost = w;
        }
      }
      const b = 1 + boost * 0.7;
      const size = rand(1.0, 2.6) * (1.5 - rr / 66) * (1 + boost * 0.4);

      return {
        x: Math.cos(angle) * rr,
        y: thickness,
        z: Math.sin(angle) * rr,
        r: cr * b, g: cg * b, b: cb * b,
        size,
        phase: rand(0, Math.PI * 2)
      };
    };
  }

  halo() {
    const { rand, gauss } = this._random;
    const maxRadius = this._cfg.galaxy.maxRadius;

    return () => {
      const rr = rand(maxRadius * 0.4, maxRadius * 1.6);
      const angle = rand(0, Math.PI * 2);
      const thickness = gauss() * rr * 0.5;
      const tint = rand(0.75, 1.0);

      return {
        x: Math.cos(angle) * rr,
        y: thickness,
        z: Math.sin(angle) * rr,
        r: 0.7 * tint, g: 0.78 * tint, b: 1.0 * tint,
        size: rand(0.3, 1.1),
        phase: rand(0, Math.PI * 2)
      };
    };
  }

  companion() {
    const { rand, gauss } = this._random;

    return () => {
      const rr = Math.pow(Math.random(), 1.6) * 55;
      const ang = rand(0, Math.PI * 2);
      const t = Math.min(1, rr / 55) * 0.3;
      const [cr, cg, cb] = this._ramp.compute(0.15 + t, false);

      return {
        x: Math.cos(ang) * rr,
        y: gauss() * 10,
        z: Math.sin(ang) * rr * 0.6,
        r: cr, g: cg, b: cb,
        size: rand(0.5, 1.4) * (1.3 - rr / 70),
        phase: rand(0, Math.PI * 2)
      };
    };
  }

  background() {
    const { rand } = this._random;
    const tints = [
      [1.0, 1.0, 1.0],
      [0.9, 0.95, 1.15],
      [1.05, 0.85, 0.95],
      [1.1, 0.95, 0.8],
      [0.85, 1.1, 1.0],
      [0.95, 0.9, 1.1]
    ];

    return () => {
      const radius = rand(1200, 2300);
      const theta = rand(0, Math.PI * 2);
      const phi = Math.acos(rand(-1, 1));
      const t = tints[Math.floor(Math.random() * tints.length)];
      const bright = Math.random() < 0.08;
      const boost = rand(0.9, 1.25);

      return {
        x: radius * Math.sin(phi) * Math.cos(theta),
        y: radius * Math.cos(phi),
        z: radius * Math.sin(phi) * Math.sin(theta),
        r: t[0] * boost, g: t[1] * boost, b: t[2] * boost,
        size: bright ? rand(4.5, 7) : rand(0.9, 2.6),
        phase: rand(0, Math.PI * 2)
      };
    };
  }

  fgStars() {
    const { rand } = this._random;
    const tints = [
      [1.0, 1.0, 1.0],
      [0.85, 0.9, 1.2],
      [1.2, 0.9, 1.0],
      [1.15, 1.0, 0.85]
    ];

    return () => {
      const radius = rand(700, 1300);
      const theta = rand(0, Math.PI * 2);
      const phi = Math.acos(rand(-1, 1));
      const t = tints[Math.floor(Math.random() * tints.length)];
      const bright = Math.random() < 0.1;
      const boost = rand(0.9, 1.3);

      return {
        x: radius * Math.sin(phi) * Math.cos(theta),
        y: radius * Math.cos(phi),
        z: radius * Math.sin(phi) * Math.sin(theta),
        r: t[0] * boost, g: t[1] * boost, b: t[2] * boost,
        size: bright ? rand(5, 8) : rand(1.2, 3.2),
        phase: rand(0, Math.PI * 2)
      };
    };
  }

  bgGalaxies() {
    const { rand } = this._random;
    const galColors = [
      [1.0, 0.95, 0.85],
      [0.85, 0.88, 1.0],
      [1.0, 0.82, 0.9],
      [0.9, 0.85, 1.0]
    ];

    const galaxies = [];
    const N = 70;
    for (let i = 0; i < N; i++) {
      const radius = rand(1100, 2100);
      const theta = rand(0, Math.PI * 2);
      const phi = Math.acos(rand(-1, 1));
      galaxies.push({
        x: radius * Math.sin(phi) * Math.cos(theta),
        y: radius * Math.cos(phi),
        z: radius * Math.sin(phi) * Math.sin(theta),
        scale: rand(20, 65),
        tiltX: rand(0, Math.PI),
        color: galColors[Math.floor(Math.random() * galColors.length)]
      });
    }

    return () => {
      const g = galaxies[Math.floor(Math.random() * galaxies.length)];
      const rr = Math.pow(Math.random(), 1.4) * g.scale;
      const ang = rand(0, Math.PI * 2);
      const cy = Math.sin(ang) * rr * 0.5;
      const cr = Math.cos(ang) * rr;
      const dim = rand(0.85, 1.15);

      return {
        x: g.x + cr * Math.cos(g.tiltX),
        y: g.y + cy + cr * Math.sin(g.tiltX) * 0.6,
        z: g.z + cr * Math.sin(g.tiltX),
        r: g.color[0] * dim, g: g.color[1] * dim, b: g.color[2] * dim,
        size: rand(0.6, 1.8),
        phase: rand(0, Math.PI * 2)
      };
    };
  }
};