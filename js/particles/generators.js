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
      [1.7, 1.05, 1.3],
      [0.95, 1.15, 1.6],
      [1.7, 1.15, 0.8],
      [1.5, 0.9, 1.05]
    ];

    const armsData = [];
    for (let a = 0; a < cfg.arms; a++) {
      const knots = [];
      for (let k = 0; k < 7; k++) {
        knots.push({
          r: Math.pow(Math.random(), 0.7) * cfg.maxRadius,
          width: rand(16, 44),
          tint: hotTints[Math.floor(Math.random() * hotTints.length)]
        });
      }
      armsData.push({ knots });
    }

    return () => {
      const armIndex = Math.floor(Math.random() * cfg.arms);
      const armOffset = (armIndex / cfg.arms) * Math.PI * 2;
      const arm = armsData[armIndex];

      // arms emanate from the ends of the bar, not from the exact center
      const barEnd = cfg.maxRadius * 0.26;
      const rr = barEnd + Math.pow(Math.random(), 0.7) * (cfg.maxRadius - barEnd);

      const twist = rr * (cfg.armTwist / cfg.maxRadius) * Math.PI * 2;
      const wobble =
        Math.sin(rr * 0.012 + armIndex * 2.1) * 0.35 +
        Math.sin(rr * 0.027 + armIndex * 4.7) * 0.18;
      const scatter = 0.12 + (rr / cfg.maxRadius) * 0.32;
      const angle = armOffset + twist + wobble + gauss() * scatter;

      const rJitter = gauss() * (6 + rr * 0.07);
      const r = Math.max(2, rr + rJitter);

      const thickness = gauss() * (2.5 + rr * cfg.diskFlare);
      const warp = cfg.diskWarp * Math.pow(rr / cfg.maxRadius, 2.2) * Math.sin(angle + armIndex * 1.9);
      const mid = Math.sin(rr * 0.04 + armIndex * 2.7) * 1.5;
      const y = warp + thickness + mid;

      const t = Math.min(1, r / cfg.maxRadius) * rand(0.7, 1.0);
      const [baseR, baseG, baseB] = this._ramp.compute(t, false);

      const warmth = Math.sin(rr * 0.016 + armIndex * 2.3);
      let cr = baseR, cg = baseG, cb = baseB;
      if (warmth > 0) { cr *= 1.15; cg *= 1.05; cb *= 0.78; }
      else { cr *= 0.82; cg *= 1.06; cb *= 1.2; }

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
      const brightness = 1 + knotW * 1.15 + 0.3 * (1 - r / cfg.maxRadius);
      const tColor = Math.random() < knotW
        ? knotTint
        : [rand(0.94, 1.07), rand(0.94, 1.07), rand(0.94, 1.07)];
      const size = rand(0.7, 1.8) * (1 - 0.22 * (r / cfg.maxRadius)) * (1 + knotW * 1.0);

      const cap = (x) => x > 1 ? 1 : x;

      return {
        x: Math.cos(angle) * r,
        y: y,
        z: Math.sin(angle) * r,
        r: cap(cr * tColor[0] * brightness),
        g: cap(cg * tColor[1] * brightness),
        b: cap(cb * tColor[2] * brightness),
        size,
        phase: rand(0, Math.PI * 2)
      };
    };
  }

  diskHaze() {
    const cfg = this._cfg.galaxy;
    const { rand, gauss } = this._random;

    return () => {
      const rr = Math.pow(Math.random(), 0.75) * cfg.maxRadius;
      const angle = rand(0, Math.PI * 2);
      const warp = cfg.diskWarp * Math.pow(rr / cfg.maxRadius, 2.2) * Math.sin(angle + 1.7);
      const wobble = Math.sin(rr * 0.05) * 2.4 + Math.sin(rr * 0.011) * 3.4;
      const thickness = gauss() * (4 + rr * cfg.diskFlare * 1.6);
      const y = warp + wobble + thickness;

      const t = Math.min(1, rr / cfg.maxRadius);
      const colorT = Math.max(0, t + rand(-0.14, 0.16));
      const [baseR, baseG, baseB] = this._ramp.compute(colorT, false);

      const warmth = Math.sin(rr * 0.02 + 2.0);
      let cr = baseR, cg = baseG, cb = baseB;
      if (warmth > 0) { cr *= 1.12; cg *= 1.03; cb *= 0.8; }
      else { cr *= 0.82; cg *= 1.05; cb *= 1.2; }

      // very even & faint: tiny variance in dim/size so the layer reads as smooth smoke
      const dim = rand(0.42, 0.55) * (1 - 0.18 * t);
      const size = rand(2.6, 3.4) * (1.35 - 0.4 * t);

      return {
        x: Math.cos(angle) * rr,
        y: y,
        z: Math.sin(angle) * rr,
        r: cr * dim, g: cg * dim, b: cb * dim,
        size,
        phase: rand(0, Math.PI * 2)
      };
    };
  }

  armGlow() {
    const cfg = this._cfg.galaxy;
    const { rand, gauss } = this._random;

    const tints = [
      [1.35, 0.9, 1.5],
      [0.95, 1.05, 1.6],
      [1.5, 1.05, 0.95],
      [1.4, 0.8, 1.2]
    ];

    const segs = [];
    for (let a = 0; a < cfg.arms; a++) {
      const armOffset = (a / cfg.arms) * Math.PI * 2;
      const segCount = 7;
      for (let s = 0; s < segCount; s++) {
        const r0 = ((s + 0.5) / segCount) * cfg.maxRadius;
        const bright = Math.random() < 0.3;
        segs.push({
          armOffset,
          rr: r0,
          tint: tints[Math.floor(Math.random() * tints.length)],
          glow: bright ? 1.5 : 1.0
        });
      }
    }

    return () => {
      const seg = segs[Math.floor(Math.random() * segs.length)];
      const rr = Math.max(6, seg.rr + gauss() * 12);
      const twist = rr * (cfg.armTwist / cfg.maxRadius) * Math.PI * 2;
      const wobble = Math.sin(rr * 0.012 + seg.armOffset * 1.7) * 0.4 +
        Math.sin(rr * 0.027 + seg.armOffset * 3.1) * 0.2;
      const angle = seg.armOffset + twist + wobble + gauss() * 0.12;

      const warp = cfg.diskWarp * Math.pow(rr / cfg.maxRadius, 2.2) * Math.sin(angle + seg.armOffset * 1.4);
      const y = warp + gauss() * (3 + rr * cfg.diskFlare);

      const cap = (x) => x > 1 ? 1 : x;
      const boost = seg.glow * rand(0.9, 1.15);
      const size = rand(5.5, 8.5) * (1.15 - 0.45 * (rr / cfg.maxRadius)) * (seg.glow > 1 ? 1.25 : 1);

      return {
        x: Math.cos(angle) * rr,
        y: y,
        z: Math.sin(angle) * rr,
        r: cap(seg.tint[0] * boost), g: cap(seg.tint[1] * boost), b: cap(seg.tint[2] * boost),
        size,
        phase: rand(0, Math.PI * 2)
      };
    };
  }

  bar() {
    const cfg = this._cfg.galaxy;
    const { rand, gauss } = this._random;
    const halfLen = cfg.maxRadius * 0.36;

    return () => {
      const bx = gauss() * halfLen;
      const bz = gauss() * (halfLen * 0.16 + 5);
      const by = gauss() * (halfLen * 0.11 + 4) * 1.5;
      const dist = Math.abs(bx) / halfLen;

      const t = rand(0, 0.5);
      const [cr, cg, cb] = this._ramp.compute(t, true);
      const density = 1 + 0.32 * (1 - 0.55 * dist);
      const size = rand(1.3, 2.5) * (1.5 - 0.5 * dist);

      const cap = (x) => x > 1 ? 1 : x;

      return {
        x: bx,
        y: by,
        z: bz,
        r: cap(cr * density), g: cap(cg * density), b: cap(cb * density),
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
        tint: [rand(1.1, 1.6), rand(0.85, 1.15), rand(0.9, 1.3)]
      });
    }

    return () => {
      const rr = Math.pow(Math.random(), 2.0) * 52;
      const angle = rand(0, Math.PI * 2);
      const thickness = gauss() * (rr * 0.68 + 5.5);
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
      const b = 1 + boost * 1.0;
      const size = rand(0.8, 1.8) * (1.5 - rr / 70) * (1 + boost * 0.4);

      const cap = (x) => x > 1 ? 1 : x;

      return {
        x: Math.cos(angle) * rr,
        y: thickness,
        z: Math.sin(angle) * rr,
        r: cap(cr * b), g: cap(cg * b), b: cap(cb * b),
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
      const tint = rand(0.8, 1.05);

      return {
        x: Math.cos(angle) * rr,
        y: thickness,
        z: Math.sin(angle) * rr,
        r: 0.75 * tint, g: 0.82 * tint, b: 1.0 * tint,
        size: rand(0.3, 0.9),
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
        size: rand(0.5, 1.3) * (1.3 - rr / 70),
        phase: rand(0, Math.PI * 2)
      };
    };
  }

  background() {
    const { rand } = this._random;
    const tints = [
      [1.0, 1.0, 1.0],
      [0.9, 0.95, 1.2],
      [1.1, 0.85, 1.0],
      [1.15, 0.95, 0.8],
      [0.8, 1.1, 1.05],
      [1.0, 0.9, 1.15],
      [0.9, 1.05, 1.1]
    ];

    return () => {
      const radius = rand(1200, 2300);
      const theta = rand(0, Math.PI * 2);
      const phi = Math.acos(rand(-1, 1));
      const t = tints[Math.floor(Math.random() * tints.length)];
      const bright = Math.random() < 0.1;
      const boost = rand(0.9, 1.35);

      return {
        x: radius * Math.sin(phi) * Math.cos(theta),
        y: radius * Math.cos(phi),
        z: radius * Math.sin(phi) * Math.sin(theta),
        r: t[0] * boost, g: t[1] * boost, b: t[2] * boost,
        size: bright ? rand(3.0, 4.5) : rand(1.0, 2.2),
        phase: rand(0, Math.PI * 2)
      };
    };
  }

  fgStars() {
    const { rand } = this._random;
    const tints = [
      [1.0, 1.0, 1.0],
      [0.8, 0.9, 1.25],
      [1.25, 0.9, 1.05],
      [1.2, 1.0, 0.8],
      [0.85, 1.15, 1.1]
    ];

    return () => {
      const radius = rand(700, 1300);
      const theta = rand(0, Math.PI * 2);
      const phi = Math.acos(rand(-1, 1));
      const t = tints[Math.floor(Math.random() * tints.length)];
      const bright = Math.random() < 0.12;
      const boost = rand(0.9, 1.4);

      return {
        x: radius * Math.sin(phi) * Math.cos(theta),
        y: radius * Math.cos(phi),
        z: radius * Math.sin(phi) * Math.sin(theta),
        r: t[0] * boost, g: t[1] * boost, b: t[2] * boost,
        size: bright ? rand(4, 6) : rand(1.4, 2.6),
        phase: rand(0, Math.PI * 2)
      };
    };
  }

  _bgList() {
    if (!this._bgListData) {
      const { rand } = this._random;
      const galPalettes = [
        [1.25, 0.62, 1.15],
        [0.82, 0.7, 1.3],
        [0.62, 0.9, 1.3],
        [0.6, 1.2, 1.15],
        [1.3, 0.95, 0.55],
        [1.3, 0.55, 0.8],
        [0.7, 1.05, 1.3],
        [1.2, 0.75, 1.0],
        [0.85, 1.25, 0.7],
        [1.05, 0.65, 1.3]
      ];

      const galaxies = [];
      const N = 16;
      const MIN_SEP = 330;
      for (let i = 0; i < N; i++) {
        const isDwarf = Math.random() < 0.25;
        const pal = galPalettes[Math.floor(Math.random() * galPalettes.length)];
        const jitter = (v) => Math.min(1.45, v * rand(0.88, 1.2));

        let x, y, z, accepted = false;
        for (let attempt = 0; attempt < 24 && !accepted; attempt++) {
          const radius = rand(800, 1850);
          const theta = rand(0, Math.PI * 2);
          const phi = Math.acos(rand(-1, 1));
          x = radius * Math.sin(phi) * Math.cos(theta);
          y = radius * Math.cos(phi);
          z = radius * Math.sin(phi) * Math.sin(theta);
          accepted = true;
          for (const other of galaxies) {
            if (Math.hypot(x - other.x, y - other.y, z - other.z) < MIN_SEP) {
              accepted = false;
              break;
            }
          }
        }

        galaxies.push({
          x, y, z,
          scale: isDwarf ? rand(16, 48) : rand(35, 115),
          core: isDwarf ? rand(2.5, 4.5) : rand(5, 14),
          arms: isDwarf ? 0 : 2 + Math.floor(Math.random() * 2),
          wind: isDwarf ? 0 : rand(0.7, 1.2),
          tiltX: rand(0, Math.PI),
          tiltY: rand(0, Math.PI),
          base: rand(0, Math.PI * 2),
          scatter: isDwarf ? rand(0.5, 0.7) : rand(0.08, 0.18),
          bulge: isDwarf ? 0.7 : 0.22,
          dwarf: isDwarf,
          spin: isDwarf ? rand(0.1, 0.25) : rand(0.5, 1.0),
          bright: rand(0.85, 1.3),
          color: [jitter(pal[0]), jitter(pal[1]), jitter(pal[2])]
        });
      }
      this._bgListData = galaxies;
    }
    return this._bgListData;
  }

  bgGalaxiesList() {
    return this._bgList();
  }

  bgGalaxy(g) {
    const { rand, gauss } = this._random;

    return () => {
      let rr, ang;
      const r = Math.random();
      if (r < g.bulge) {
        rr = Math.pow(Math.random(), 2.0) * g.core;
        ang = rand(0, Math.PI * 2);
      } else if (g.arms > 0) {
        const arm = Math.floor(rand(0, g.arms));
        rr = Math.pow(Math.random(), 0.9) * g.scale;
        ang = g.base + arm * ((Math.PI * 2) / g.arms) +
          (rr / g.scale) * g.wind * Math.PI * 2 +
          gauss() * g.scatter * (0.6 + rr / g.scale);
      } else {
        rr = Math.pow(Math.random(), 1.4) * g.scale;
        ang = rand(0, Math.PI * 2);
      }

      const lx = Math.cos(ang) * rr;
      const lz = Math.sin(ang) * rr;
      const ly = (Math.random() - 0.5) * (rr * 0.3 + g.core * 0.6);

      const dim = g.dwarf ? rand(0.8, 1.0) * g.bright : rand(0.9, 1.2) * g.bright;
      const cap = (x) => x > 1 ? 1 : x;

      return {
        x: lx, y: ly, z: lz,
        r: cap(g.color[0] * dim), g: cap(g.color[1] * dim), b: cap(g.color[2] * dim),
        size: rand(1.4, 2.8),
        phase: rand(0, Math.PI * 2)
      };
    };
  }

  bgGalaxyGlow(g) {
    const { rand } = this._random;

    return () => {
      const off = g.scale * 0.22;
      const dim = g.dwarf ? 0.8 * g.bright : rand(0.95, 1.15) * g.bright;
      const cap = (x) => x > 1 ? 1 : x;
      return {
        x: (Math.random() - 0.5) * off,
        y: (Math.random() - 0.5) * off * 0.7,
        z: (Math.random() - 0.5) * off,
        r: cap(g.color[0] * dim), g: cap(g.color[1] * dim), b: cap(g.color[2] * dim),
        size: rand(3.0, 5.5) * (0.5 + g.scale / 70),
        phase: rand(0, Math.PI * 2)
      };
    };
  }
};