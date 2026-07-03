export function initRipple(canvas: HTMLCanvasElement): () => void {
  const ctx = canvas.getContext("2d")!;
  const dpr = Math.min(window.devicePixelRatio, 2);
  const FONT_SIZE = 14;
  const CELL_W = FONT_SIZE * 0.6;
  const CELL_H = FONT_SIZE;
  const CHARS = " .:-=+*#%@";
  const SCALE = (CHARS.length - 1) / 255;
  const DIST_DAMPING = 0.96;
  const TARGET_MS = 1000 / 30;

  const WAVES = [
    { freq: 0.10, amp: 90, speed: 0.012, dirX: 0.95, dirY: 0.31, phase: 0 },
    { freq: 0.07, amp: 60, speed: 0.008, dirX: 0.4,  dirY: 0.92, phase: 1.5 },
    { freq: 0.04, amp: 40, speed: 0.005, dirX: -0.55, dirY: 0.83, phase: 3.0 },
  ];

  let w = 0;
  let h = 0;
  let cols = 0;
  let rows = 0;
  let dist1 = new Float32Array(0);
  let dist2 = new Float32Array(0);
  let smooth = new Float32Array(0);
  let rafId = 0;
  let lastTime = 0;
  let simTime = 0;
  let wasRunning = false;
  let lastCellX = -1;
  let lastCellY = -1;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (rect.width < CELL_W || rect.height < CELL_H) return;
    w = rect.width * dpr;
    h = rect.height * dpr;
    canvas.width = w;
    canvas.height = h;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.font = `${FONT_SIZE}px 'Geist Mono', monospace`;
    ctx.textBaseline = "top";
    cols = Math.floor(rect.width / CELL_W);
    rows = Math.floor(rect.height / CELL_H);
    dist1 = new Float32Array(cols * rows);
    dist2 = new Float32Array(cols * rows);
    smooth = new Float32Array(cols * rows);
    simTime = 0;
    lastCellX = -1;
    lastCellY = -1;
  }

  function waveHeight(x: number, y: number): number {
    let h = 0;
    for (const w of WAVES) {
      h += w.amp * Math.sin(w.freq * (x * w.dirX + y * w.dirY) + w.phase + simTime * w.speed);
    }
    return h;
  }

  function disturb(x: number, y: number, mag: number) {
    if (x >= 0 && x < cols && y >= 0 && y < rows) {
      dist1[y * cols + x] = mag;
    }
  }

  function stepDisturbance() {
    const W = 5 / 3;
    for (let y = 1; y < rows - 1; y++) {
      for (let x = 1; x < cols - 1; x++) {
        const i = y * cols + x;
        const hSum = dist1[i - 1] + dist1[i + 1];
        const vSum = dist1[i - cols] + dist1[i + cols];
        dist2[i] = (hSum * W + vSum) / (W + 1) - dist2[i];
        dist2[i] *= DIST_DAMPING;
      }
    }
    [dist1, dist2] = [dist2, dist1];
  }

  function render() {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#c4b5fd";
    for (let y = 0; y < rows; y++) {
      let line = "";
      const base = y * cols;
      for (let x = 0; x < cols; x++) {
        const raw = waveHeight(x, y) + dist1[base + x];
        smooth[base + x] = smooth[base + x] * 0.75 + raw * 0.25;
        const idx = Math.min(Math.floor(Math.abs(smooth[base + x]) * SCALE), CHARS.length - 1);
        line += CHARS[idx];
      }
      ctx.fillText(line, 0, y * CELL_H);
    }
  }

  function tick(time: number) {
    rafId = requestAnimationFrame(tick);
    const dt = Math.min(time - lastTime, 100);
    if (dt < TARGET_MS) return;
    lastTime = time;
    simTime += dt / 1000;
    stepDisturbance();
    render();
  }

  function start() {
    if (rafId) return;
    lastTime = 0;
    rafId = requestAnimationFrame(tick);
  }

  function stop() {
    cancelAnimationFrame(rafId);
    rafId = 0;
  }

  function gridFromEvent(e: MouseEvent): [number, number] {
    const rect = canvas.getBoundingClientRect();
    return [
      Math.floor(((e.clientX - rect.left) / rect.width) * cols),
      Math.floor(((e.clientY - rect.top) / rect.height) * rows),
    ];
  }

  function onClick(e: MouseEvent) {
    const [x, y] = gridFromEvent(e);
    disturb(x, y, 400);
  }

  function onMouseMove(e: MouseEvent) {
    const [x, y] = gridFromEvent(e);
    if (x === lastCellX && y === lastCellY) return;
    lastCellX = x;
    lastCellY = y;
    disturb(x, y, 120);
  }

  resize();

  if (reducedMotion) {
    for (let y = 0; y < rows; y++) {
      let line = "";
      for (let x = 0; x < cols; x++) {
        const v = waveHeight(x, y);
        const idx = Math.min(Math.floor(Math.abs(v) * SCALE), CHARS.length - 1);
        line += CHARS[idx];
      }
      ctx.fillText(line, 0, y * CELL_H);
    }
  }

  const parent = canvas.parentElement;
  const ro = new ResizeObserver(() => {
    wasRunning = rafId !== 0;
    stop();
    resize();
    if (wasRunning && !reducedMotion) start();
  });
  if (parent) ro.observe(parent);

  const io = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting && !reducedMotion) start();
      else stop();
    },
    { threshold: 0 },
  );
  io.observe(canvas);

  if (!reducedMotion) {
    canvas.addEventListener("click", onClick);
    canvas.addEventListener("mousemove", onMouseMove);
  }

  return () => {
    stop();
    if (parent) ro.unobserve(parent);
    ro.disconnect();
    io.disconnect();
    canvas.removeEventListener("click", onClick);
    canvas.removeEventListener("mousemove", onMouseMove);
  };
}
