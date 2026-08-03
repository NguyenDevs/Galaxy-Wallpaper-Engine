window.SpiralGalaxy = window.SpiralGalaxy || {};

window.SpiralGalaxy.Random = (() => {
  function rand(a, b) {
    return a + Math.random() * (b - a);
  }

  function gauss() {
    let s = 0;
    for (let i = 0; i < 3; i++) s += Math.random();
    return (s / 3 - 0.5) * 2;
  }

  return { rand, gauss };
})();
