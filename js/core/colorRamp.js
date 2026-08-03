window.SpiralGalaxy = window.SpiralGalaxy || {};

window.SpiralGalaxy.ColorRamp = class ColorRamp {
  constructor() {
    // Vivid galaxy palette: warm ivory core -> hot pink -> magenta -> violet -> electric blue
    this._galaxyStops = [
      [0.0, 255, 240, 232],
      [0.12, 255, 205, 232],
      [0.26, 255, 172, 255],
      [0.42, 228, 152, 255],
      [0.58, 178, 152, 255],
      [0.76, 130, 200, 255],
      [1.0, 82, 132, 255]
    ];
    // Golden warm core palette
    this._coreStops = [
      [0.0, 255, 254, 250],
      [0.22, 255, 228, 190],
      [0.5, 255, 186, 142],
      [0.78, 255, 150, 180],
      [1.0, 255, 128, 210]
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