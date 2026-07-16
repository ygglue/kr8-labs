/**
 * Adapted from Originkit's BlackHole component (React/Framer) into a vanilla
 * canvas module. The accretion-disk orbit is replaced with a lemniscate
 * (figure-eight / infinity symbol) path: particles ride a single fixed-size
 * curve rather than nested orbits at varying radii, each offset a small,
 * random distance to either side of that curve (a "tube" around the path).
 * Keeping the tube thin relative to the curve's scale is what leaves the
 * inside of each lobe empty — a true hollow "∞" instead of a filled blob.
 * showCenter is always off here — this is a pure particle-trail background,
 * no event-horizon sphere to occlude.
 */

type Particle = {
  angle: number; // position along the curve (0–2π)
  perpOffset: number; // signed distance from the curve, across the tube
  height: number; // vertical (Y) displacement off the loop plane
  speedOffset: number;
  sprite: HTMLCanvasElement; // precomputed glow sprite (white → purple mix)
};

const PERSPECTIVE = 1300;
// The curve's outer edge sits at SHAPE_PCT + (SHAPE_PCT * TUBE_PCT) of the
// canvas half-width (tube offset pushes past the base curve) — kept under 1
// so the loops don't clip against the canvas/section bounds.
const SHAPE_PCT = 0.78; // curve size, as a fraction of the canvas half-width
const TUBE_PCT = 0.2; // tube radius, as a fraction of the curve's scale
const PARTICLE_COUNT = 650;
const PARTICLE_SIZE = 1.0; // small, bright dots — the glow does the rest
const ORBIT_SPEED = 0.9;
const TRAIL_ALPHA = 0.04; // lower = longer-lingering light trails
const SPRITE_SIZE = 28; // px, offscreen glow-sprite canvas — drawImage scales it per particle
const SPRITE_SCALE = 5; // destination sprite diameter = particle "size" × this
const SPRITE_COLOR_STEPS = 4; // discrete white→purple buckets, pre-rendered once
const TILT_DEG = 60;
const TILT_SIDEWAY_DEG = 180;
const GLOW_COLOR: [number, number, number] = [196, 181, 253]; // --accent-lavender — the colored halo
const DOT_COLOR: [number, number, number] = [230, 224, 255]; // pale lavender-white — most particles' base color
const CURVE_EPS = 0.001; // finite-difference step for the curve tangent

// A pre-rendered radial-gradient dot: bright core fading to transparent.
// Blitting this via drawImage per particle is far cheaper than the
// equivalent ctx.shadowBlur pass (notoriously expensive in Canvas2D,
// especially on mobile), so this is what actually fixes mobile frame drops.
function buildGlowSprite(color: [number, number, number]): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = SPRITE_SIZE;
  c.height = SPRITE_SIZE;
  const sctx = c.getContext("2d")!;
  const cx = SPRITE_SIZE / 2;
  const [r, g, b] = color;
  const grad = sctx.createRadialGradient(cx, cx, 0, cx, cx, cx);
  grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 1)`);
  grad.addColorStop(0.35, `rgba(${r}, ${g}, ${b}, 0.85)`);
  grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
  sctx.fillStyle = grad;
  sctx.beginPath();
  sctx.arc(cx, cx, cx, 0, Math.PI * 2);
  sctx.fill();
  return c;
}

function buildSprites(): HTMLCanvasElement[] {
  const sprites: HTMLCanvasElement[] = [];
  for (let i = 0; i < SPRITE_COLOR_STEPS; i++) {
    const t = i / (SPRITE_COLOR_STEPS - 1);
    const [dr, dg, db] = DOT_COLOR;
    const [gr, gg, gb] = GLOW_COLOR;
    sprites.push(
      buildGlowSprite([
        Math.round(dr + (gr - dr) * t),
        Math.round(dg + (gg - dg) * t),
        Math.round(db + (gb - db) * t),
      ]),
    );
  }
  return sprites;
}

export function initBlackHole(canvas: HTMLCanvasElement): () => void {
  const ctx = canvas.getContext("2d")!;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

  const tiltRad = (TILT_DEG * Math.PI) / 180;
  const tiltSidewayRad = (TILT_SIDEWAY_DEG * Math.PI) / 180;
  const cosTilt = Math.cos(tiltRad);
  const sinTilt = Math.sin(tiltRad);
  const cosSide = Math.cos(tiltSidewayRad);
  const sinSide = Math.sin(tiltSidewayRad);

  const sprites = buildSprites();

  let W = 0;
  let H = 0;
  let particles: Particle[] = [];
  let rafId = 0;
  let inView: boolean | null = null;
  let lastTime = 0;
  let particleSize = PARTICLE_SIZE;
  let particleCount = PARTICLE_COUNT;

  function shapeScale() {
    return SHAPE_PCT * (W / 2);
  }

  function seedParticles() {
    const tubeR = TUBE_PCT * shapeScale();
    const pts: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      // Skewed toward 0 (white) so purple-leaning particles stay a minority accent.
      const bucket = Math.min(SPRITE_COLOR_STEPS - 1, Math.floor(Math.pow(Math.random(), 2.2) * SPRITE_COLOR_STEPS));
      pts.push({
        angle: Math.random() * Math.PI * 2,
        // Sum of two uniforms clusters particles toward the curve's centerline
        // (denser core, soft falloff toward the tube's edge) instead of a flat
        // band, which reads as a cleaner stroke.
        perpOffset: (Math.random() + Math.random() - 1) * tubeR,
        height: (Math.random() - 0.5) * 16,
        speedOffset: 0.85 + Math.random() * 0.3,
        sprite: sprites[bucket],
      });
    }
    particles = pts;
  }

  // Lemniscate of Bernoulli — traces a figure eight along the X axis.
  function curvePoint(t: number, scale: number) {
    const denom = 1 + Math.sin(t) * Math.sin(t);
    return {
      x: (scale * Math.cos(t)) / denom,
      z: (scale * Math.sin(t) * Math.cos(t)) / denom,
    };
  }

  function project(p: Particle) {
    const scale = shapeScale();
    const c0 = curvePoint(p.angle, scale);
    const c1 = curvePoint(p.angle + CURVE_EPS, scale);

    // Offset perpendicular to the curve's tangent so particles form a thin
    // tube around the path rather than filling the lobes solid.
    const tx = c1.x - c0.x;
    const tz = c1.z - c0.z;
    const tLen = Math.hypot(tx, tz) || 1;
    const nx = -tz / tLen;
    const nz = tx / tLen;

    const xBase = c0.x + nx * p.perpOffset;
    const zBase = c0.z + nz * p.perpOffset;
    const yBase = p.height;

    const y1 = yBase * cosTilt + zBase * sinTilt;
    const z1 = -yBase * sinTilt + zBase * cosTilt;

    const x3d = xBase * cosSide - y1 * sinSide;
    const y3d = xBase * sinSide + y1 * cosSide;
    const z3d = z1;

    const scale3d = PERSPECTIVE / (PERSPECTIVE + z3d);
    return {
      x: W / 2 + x3d * scale3d,
      y: H / 2 + y3d * scale3d,
      size: Math.max(0.3, particleSize * scale3d),
      z: z3d,
    };
  }

  // Blits a pre-rendered glow sprite per particle instead of stroking a
  // shape with ctx.shadowBlur — drawImage is cheap even on weak mobile GPUs,
  // where shadowBlur is one of the most expensive Canvas2D operations.
  function drawGlow(pts: { x: number; y: number; size: number; alpha: number; sprite: HTMLCanvasElement }[]) {
    for (const p of pts) {
      const d = p.size * SPRITE_SCALE;
      ctx.globalAlpha = p.alpha;
      ctx.drawImage(p.sprite, p.x - d / 2, p.y - d / 2, d, d);
    }
    ctx.globalAlpha = 1;
  }

  function renderStatic() {
    if (W <= 0 || H <= 0) return;
    ctx.clearRect(0, 0, W, H);
    drawGlow(particles.map((p) => ({ ...project(p), alpha: 0.7, sprite: p.sprite })));
  }

  function draw(now: number) {
    rafId = requestAnimationFrame(draw);
    const dt = Math.min((now - lastTime) / 16.667, 3);
    lastTime = now;
    if (W <= 0 || H <= 0) return;

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = `rgba(0, 0, 0, ${TRAIL_ALPHA})`;
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = "source-over";

    const outerR = shapeScale();
    const projected: { x: number; y: number; size: number; alpha: number; z: number; sprite: HTMLCanvasElement }[] = [];

    for (const p of particles) {
      p.angle += ORBIT_SPEED * p.speedOffset * 0.012 * dt;

      const pt = project(p);
      if (pt.x < -30 || pt.x > W + 30 || pt.y < -30 || pt.y > H + 30) continue;

      const alpha = Math.max(0.45, 1 - ((pt.z + outerR) / (2 * outerR)) * 0.4);
      projected.push({ x: pt.x, y: pt.y, size: pt.size, alpha, z: pt.z, sprite: p.sprite });
    }

    projected.sort((a, b2) => b2.z - a.z);
    drawGlow(projected);
  }

  function start() {
    if (rafId || reducedMotion) return;
    lastTime = performance.now();
    rafId = requestAnimationFrame(draw);
  }
  function stop() {
    cancelAnimationFrame(rafId);
    rafId = 0;
  }
  function updatePlayState() {
    if (!reducedMotion && particles.length > 0 && inView !== false) start();
    else stop();
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    W = rect.width;
    H = rect.height;
    if (W <= 0 || H <= 0) return;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // Smaller dots on narrow viewports — the same absolute size reads much
    // chunkier on a phone-width canvas than on a wide desktop one.
    particleSize = W < 480 ? PARTICLE_SIZE * 0.55 : W < 768 ? PARTICLE_SIZE * 0.75 : PARTICLE_SIZE;
    // A lighter cut on mobile now that drawImage (not shadowBlur) does the
    // glow work — too few particles leaves visible gaps along the curve
    // instead of a continuous streak, so this stays close to the full count.
    particleCount = W < 480 ? Math.round(PARTICLE_COUNT * 0.7) : W < 768 ? Math.round(PARTICLE_COUNT * 0.85) : PARTICLE_COUNT;
    seedParticles();
    if (reducedMotion) renderStatic();
  }

  resize();
  updatePlayState();

  const ro = new ResizeObserver(() => {
    stop();
    resize();
    updatePlayState();
  });
  ro.observe(canvas);

  // Same detached-element caveat as the hero's observers: ignore the initial
  // isIntersecting:false so a canvas appended already-mounted isn't
  // permanently locked out.
  const io = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting && inView === null) return;
      inView = entry.isIntersecting;
      updatePlayState();
    },
    { threshold: 0 },
  );
  io.observe(canvas);

  return () => {
    stop();
    ro.disconnect();
    io.disconnect();
  };
}
