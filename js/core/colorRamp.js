window.SpiralGalaxy = window.SpiralGalaxy || {};

window.SpiralGalaxy.ColorRamp = class ColorRamp {
  constructor() {
    this._galaxyStops = [
      [0.0, 255, 190, 235],
      [0.2, 230, 165, 255],
      [0.45, 150, 155, 255],
      [0.7, 95, 175, 255],
      [1.0, 70, 115, 235]
    ];
    this._coreStops = [
      [0.0, 255, 246, 240],
      [0.35, 255, 218, 170],
      [0.7, 255, 175, 140],
      [1.0, 255, 140, 175]
    ];
  }

  compute(t, core) {
    t = Math.max(0, Math.min(1, t));
    const stops = core ? this._coreStops : this._galaxyStops;
    const [r, g, b] = this._sample(stops, t);
    return [r / 255, g / 255, b / 255];
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
