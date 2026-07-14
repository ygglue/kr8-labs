type Particle = {
  homeX: number;
  homeY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  phase: number;
  freq: number;
  excite: number;
};

const GAP = 3; // px between sampled source pixels — controls particle density
const SIZE = 1.5; // px, drawn as a small square (matches the design system's sharp corners)
const IDLE_AMP = 1.5; // px of ambient shimmer around the home position
const REPEL_RADIUS = 70;
const REPEL_FORCE = 1400;
const SPRING = 0.055; // lower = slower to settle back into place after repulsion releases
const DAMPING = 0.82;
const RESIZE_DEBOUNCE_MS = 150;
const TOUCH_IDLE_MS = 220; // auto-release the repulsion zone if no touchend/mouseleave arrives
const COLOR: [number, number, number] = [196, 181, 253]; // --accent-lavender
const BRIGHT_COLOR: [number, number, number] = [255, 255, 255]; // disrupted-particle target color
// A particle only spends a couple of frames near the cursor before repulsion
// pushes it past REPEL_RADIUS (where targetExcite drops to 0), so the rise
// has to be steep to read as a visible flash in that short window.
const EXCITE_RISE = 0.55; // brighten quickly on disruption
const EXCITE_FALL = 0.06; // fade back to base color gently

/**
 * Adapted from Originkit's SVG Particle component: samples an image's alpha
 * channel into a particle field that assembles into the shape, drifts gently
 * at rest, and scatters away from the cursor on hover. The canvas can span a
 * much larger area than the logo itself — `anchor` marks the sub-rect (e.g.
 * an invisible layout placeholder) the image is fit into.
 *
 * Sampling and per-frame painting are both bounded to the anchor's rect
 * (plus a margin for repulsion travel), not the full canvas, and painting
 * writes into a single ImageData buffer instead of one fillRect per
 * particle — the canvas can be section-sized while the actual work stays
 * proportional to the logo's footprint.
 */
export function initParticles(canvas: HTMLCanvasElement, imageUrl: string, anchor: HTMLElement): () => void {
  const ctx = canvas.getContext("2d")!;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  let particles: Particle[] = [];
  let W = 0;
  let H = 0;
  let boundsX = 0;
  let boundsY = 0;
  let bufW = 0;
  let bufH = 0;
  let imgData: ImageData | null = null;
  let rafId = 0;
  let resizeTimer = 0;
  let inView: boolean | null = null;
  let lastMoveAt = 0;
  const mouseClient = { x: -9999, y: -9999, active: false };

  function targetRect() {
    const canvasRect = canvas.getBoundingClientRect();
    const anchorRect = anchor.getBoundingClientRect();
    if (anchorRect.width <= 0 || anchorRect.height <= 0) {
      return { x: 0, y: 0, w: canvasRect.width, h: canvasRect.height };
    }
    return {
      x: anchorRect.left - canvasRect.left,
      y: anchorRect.top - canvasRect.top,
      w: anchorRect.width,
      h: anchorRect.height,
    };
  }

  function sampleParticles(img: HTMLImageElement) {
    const rect = canvas.getBoundingClientRect();
    W = rect.width;
    H = rect.height;
    if (W <= 0 || H <= 0) return;

    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const target = targetRect();
    const offW = Math.max(1, Math.round(target.w));
    const offH = Math.max(1, Math.round(target.h));

    const imgAspect = img.naturalWidth / img.naturalHeight;
    const boxAspect = offW / offH;
    let dw: number, dh: number;
    if (imgAspect > boxAspect) {
      dw = offW * 0.8;
      dh = dw / imgAspect;
    } else {
      dh = offH * 0.8;
      dw = dh * imgAspect;
    }
    const dx = (offW - dw) / 2;
    const dy = (offH - dh) / 2;

    // Sized to the anchor rect, not the full (now section-sized) canvas —
    // getImageData over a section-wide canvas would allocate/read a huge
    // mostly-transparent buffer for no benefit.
    const off = document.createElement("canvas");
    off.width = offW;
    off.height = offH;
    const octx = off.getContext("2d", { willReadFrequently: true })!;
    octx.drawImage(img, dx, dy, dw, dh);
    const data = octx.getImageData(0, 0, offW, offH).data;

    const next: Particle[] = [];
    for (let y = 0; y < offH; y += GAP) {
      for (let x = 0; x < offW; x += GAP) {
        const i = (y * offW + x) * 4;
        if (data[i + 3] < 40) continue;
        const hx = target.x + x + (Math.random() - 0.5) * GAP;
        const hy = target.y + y + (Math.random() - 0.5) * GAP;
        next.push({
          homeX: hx,
          homeY: hy,
          x: hx,
          y: hy,
          vx: 0,
          vy: 0,
          phase: Math.random() * Math.PI * 2,
          freq: 0.4 + Math.random() * 0.4,
          excite: 0,
        });
      }
    }
    particles = next;

    // Paint buffer covers the anchor rect plus enough margin for particles
    // to be pushed into by repulsion, so per-frame work stays proportional
    // to the logo's footprint instead of the whole section.
    const margin = REPEL_RADIUS + 60;
    boundsX = target.x - margin;
    boundsY = target.y - margin;
    const boundsW = target.w + margin * 2;
    const boundsH = target.h + margin * 2;
    bufW = Math.max(1, Math.round(boundsW * dpr));
    bufH = Math.max(1, Math.round(boundsH * dpr));
    imgData = ctx.createImageData(bufW, bufH);

    // One-time full clear in case the bounds shrank since the last sample
    // (e.g. a resize) and would otherwise leave stale pixels behind.
    ctx.clearRect(0, 0, W, H);
  }

  function render(timeSec: number) {
    if (!imgData) return;
    const buf = imgData.data;
    buf.fill(0);

    // Touch devices have no hover: a tap sets active=true but there's no
    // reliable "leave" event to clear it (touchend/touchcancel can be
    // missed, e.g. if the gesture turns into a scroll). Auto-release after
    // a short idle window so the repulsion hole always springs shut instead
    // of sticking open.
    if (mouseClient.active && performance.now() - lastMoveAt > TOUCH_IDLE_MS) {
      mouseClient.active = false;
    }

    // Re-read the canvas rect once per frame (not per mousemove) so mouse
    // coordinates stay correct across scrolling without a layout read on
    // every pointer event.
    const canvasRect = canvas.getBoundingClientRect();
    const mx = mouseClient.x - canvasRect.left;
    const my = mouseClient.y - canvasRect.top;

    const psz = Math.max(1, Math.round(SIZE * dpr));
    const [r, g, b] = COLOR;

    for (const p of particles) {
      if (reducedMotion) {
        p.x = p.homeX;
        p.y = p.homeY;
      } else {
        const tx = p.homeX + Math.sin(timeSec * p.freq + p.phase) * IDLE_AMP;
        const ty = p.homeY + Math.cos(timeSec * p.freq + p.phase) * IDLE_AMP;
        let fx = (tx - p.x) * SPRING;
        let fy = (ty - p.y) * SPRING;
        let targetExcite = 0;
        if (mouseClient.active) {
          const dx = p.x - mx;
          const dy = p.y - my;
          const distSq = dx * dx + dy * dy;
          if (distSq < REPEL_RADIUS * REPEL_RADIUS && distSq > 0.01) {
            const dist = Math.sqrt(distSq);
            const falloff = 1 - dist / REPEL_RADIUS;
            const push = (REPEL_FORCE * falloff) / dist;
            fx += dx * push * 0.02;
            fy += dy * push * 0.02;
            targetExcite = falloff;
          }
        }
        p.vx = (p.vx + fx) * DAMPING;
        p.vy = (p.vy + fy) * DAMPING;
        p.x += p.vx;
        p.y += p.vy;
        p.excite += (targetExcite - p.excite) * (targetExcite > p.excite ? EXCITE_RISE : EXCITE_FALL);
      }

      const cr = r + (BRIGHT_COLOR[0] - r) * p.excite;
      const cg = g + (BRIGHT_COLOR[1] - g) * p.excite;
      const cb = b + (BRIGHT_COLOR[2] - b) * p.excite;

      const bx = Math.round((p.x - boundsX) * dpr);
      const by = Math.round((p.y - boundsY) * dpr);
      for (let ddy = 0; ddy < psz; ddy++) {
        const iy = by + ddy;
        if (iy < 0 || iy >= bufH) continue;
        const row = iy * bufW;
        for (let ddx = 0; ddx < psz; ddx++) {
          const ix = bx + ddx;
          if (ix < 0 || ix >= bufW) continue;
          const idx = (row + ix) * 4;
          buf[idx] = cr;
          buf[idx + 1] = cg;
          buf[idx + 2] = cb;
          buf[idx + 3] = 255;
        }
      }
    }

    ctx.putImageData(imgData, Math.round(boundsX * dpr), Math.round(boundsY * dpr));
  }

  function tick(t: number) {
    rafId = requestAnimationFrame(tick);
    render(t / 1000);
  }

  function start() {
    if (rafId || reducedMotion) return;
    rafId = requestAnimationFrame(tick);
  }
  function stop() {
    cancelAnimationFrame(rafId);
    rafId = 0;
  }
  function shouldRun() {
    return !reducedMotion && particles.length > 0 && inView !== false;
  }
  function updatePlayState() {
    if (shouldRun()) start();
    else stop();
  }

  const img = new Image();
  img.onload = () => {
    sampleParticles(img);
    if (reducedMotion) render(0);
    updatePlayState();
  };
  img.src = imageUrl;

  const ro = new ResizeObserver(() => {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      resizeTimer = 0;
      if (!img.complete || img.naturalWidth === 0) return;
      stop();
      sampleParticles(img);
      if (reducedMotion) render(0);
      updatePlayState();
    }, RESIZE_DEBOUNCE_MS);
  });
  ro.observe(canvas);
  ro.observe(anchor);

  // Same detached-element caveat as the rest of the hero's observers: ignore
  // the initial isIntersecting:false so a canvas appended already-mounted
  // isn't permanently locked out.
  const io = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting && inView === null) return;
      inView = entry.isIntersecting;
      updatePlayState();
    },
    { threshold: 0 },
  );
  io.observe(canvas);

  function activateAt(clientX: number, clientY: number) {
    mouseClient.x = clientX;
    mouseClient.y = clientY;
    mouseClient.active = true;
    lastMoveAt = performance.now();
  }
  function onMouseMove(e: MouseEvent) {
    activateAt(e.clientX, e.clientY);
  }
  function onMouseLeave() {
    mouseClient.active = false;
  }
  // Touch: a tap fires touchstart with no accompanying touchmove, and
  // touchend/touchcancel aren't guaranteed (a tap-turned-scroll can eat
  // them) — the TOUCH_IDLE_MS check in render() is the real fallback.
  function onTouchStartOrMove(e: TouchEvent) {
    const t = e.touches[0];
    if (!t) return;
    activateAt(t.clientX, t.clientY);
  }
  function onTouchEnd() {
    mouseClient.active = false;
  }
  if (!reducedMotion) {
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseleave", onMouseLeave);
    canvas.addEventListener("touchstart", onTouchStartOrMove, { passive: true });
    canvas.addEventListener("touchmove", onTouchStartOrMove, { passive: true });
    canvas.addEventListener("touchend", onTouchEnd);
    canvas.addEventListener("touchcancel", onTouchEnd);
  }

  return () => {
    stop();
    if (resizeTimer) clearTimeout(resizeTimer);
    ro.disconnect();
    io.disconnect();
    canvas.removeEventListener("mousemove", onMouseMove);
    canvas.removeEventListener("mouseleave", onMouseLeave);
    canvas.removeEventListener("touchstart", onTouchStartOrMove);
    canvas.removeEventListener("touchmove", onTouchStartOrMove);
    canvas.removeEventListener("touchend", onTouchEnd);
    canvas.removeEventListener("touchcancel", onTouchEnd);
  };
}
