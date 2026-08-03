window.SpiralGalaxy = window.SpiralGalaxy || {};

window.SpiralGalaxy.ColorRamp = class ColorRamp {
  constructor() {
    // Galaxy disk: warm ivory core -> gold -> pink HII band -> light blue (young stars) -> blue -> deep blue rim
    this._galaxyStops = [
      [0.0, 255, 247, 242],
      [0.14, 255, 230, 208],
      [0.28, 255, 200, 235],
      [0.46, 200, 215, 255],
      [0.66, 140, 175, 255],
      [0.85, 100, 140, 255],
      [1.0, 70, 105, 240]
    ];
    // Golden bulge palette: white -> ivory -> pale gold -> yellow-orange -> orange (old stars, dense)
    this._coreStops = [
      [0.0, 255, 253, 250],
      [0.25, 255, 247, 224],
      [0.55, 255, 234, 182],
      [0.8, 255, 214, 150],
      [1.0, 255, 195, 150]
    ];
    this._vibrance = 1.18;
  }

  compute(t, core) {
    t = Math.max(0, Math.min(1, t));
    const stops = core ? this._coreStops : this._galaxyStops;
    let [r, g, b] = this._sample(stops, t);
    r /= 255; g /= 255; b /= 255;

    // Saturation / vibrance boost around the luminance axis
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const v = this._vibrance;
    r = lum + (r - lum) * v;
    g = lum + (g - lum) * v;
    b = lum + (b - lum) * v;

    // Gentle lift so midtones don't fall too dark
    const lift = 1.04;
    return [
      Math.min(1, r * lift),
      Math.min(1, g * lift),
      Math.min(1, b * lift)
    ];
  }

  _sample(stops, t) {
    const last = stops[stops.length - 1];
    if (t <= stops[0][0]) return [stops[0][1], stops[0][2], stops[0][3]];
    if (t >= last[0]) return [last[1], last[2], last[3]];

    for (let i = 0; i < stops.length - 1; i++) {
      const a = stops[i];
      const b = stops[i + 1];
      if (t >= a[0] && t <= b[0]) {
        const k = (t - a[0]) / (b[0] - a[0]);
        return [
          a[1] + (b[1] - a[1]) * k,
          a[2] + (b[2] - a[2]) * k,
          a[3] + (b[3] - a[3]) * k
        ];
      }
    }
    return [last[1], last[2], last[3]];
  }
};