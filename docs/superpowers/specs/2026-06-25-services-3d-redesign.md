# Services Section — 3D Icon Redesign

**Date:** 2026-06-25
**Status:** Approved for implementation

---

## Overview

Replace the flat SVG icons in the scroll-locked Services section with small Three.js 3D compositions. The sticky scroll structure and vertical-dots scrollbar are retained; the icon area and dots UI are redesigned.

---

## Layout changes

### Vertical dots scrollbar
- The current bottom-row dots move to a fixed vertical track on the **right edge** of `.services-sticky`.
- The track is a thin hairline (`var(--border)`), full height of the sticky panel.
- The active indicator is a pill that slides along the track proportional to scroll progress — doubles as a scrubber (click/tap a dot to jump to that service).
- Dot click scrolls to the same target as before (`sectionTop + (i/count) * range`).
- The "Scroll to explore" hint and counter (`01 / 06`) stay in their current positions.

### Icon area
- `.service-icon-wrap` is replaced by a `<canvas>` element: `200×200px` on desktop, `160×160px` on mobile.
- Canvas has `pointer-events: none` and a transparent background (no border, no background fill — the 3D scene provides its own depth/shadow).

---

## Three.js setup

### Renderer
- One shared `WebGLRenderer` (`antialias: true`, `alpha: true`) created once when the section mounts.
- Canvas is reused across all 6 scenes — on service activate, the renderer's DOM canvas is moved into the active slide's icon slot, and `renderer.render(scene, camera)` switches to that scene.
- `renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))` on desktop; forced to `1` on mobile (`window.innerWidth < 1024`).

### Animation loop — 30 fps cap
```ts
const TARGET_INTERVAL = 1000 / 30; // ~33ms
let lastFrameTime = 0;

function tick(time: number) {
  rafId = requestAnimationFrame(tick);
  if (time - lastFrameTime < TARGET_INTERVAL) return;
  lastFrameTime = time;
  updateRotation();
  renderer.render(scenes[current], camera);
}
```

### Pause/resume
- `IntersectionObserver` on `.services` — cancel `requestAnimationFrame` when section leaves viewport, resume when it enters.
- `document.addEventListener('visibilitychange')` — pause when tab hidden.
- `prefers-reduced-motion: reduce` — skip animation loop entirely, render one static frame.

### Camera
- Single `PerspectiveCamera` (fov 45, near 0.1, far 100) shared across all scenes, positioned at `z = 4`.

---

## 3D icon compositions

All icons use `MeshStandardMaterial` with:
- `color: #7c5af6` (mid-purple)
- `roughness: 0.35`
- `metalness: 0.6`
- `envMapIntensity: 0` (no env map needed — lit by scene lights)

Each scene has:
- `AmbientLight` at intensity `0.4`
- `DirectionalLight` from top-right at intensity `1.2`

| Service | Composition |
|---|---|
| Development | Two mirrored angled rectangular prisms (`BoxGeometry`) forming `< >` brackets |
| UI / UX | Flat rounded rect (thin `BoxGeometry`) with a thinner horizontal bar across the top — monitor frame |
| Cloud | Low-poly sphere with two torus rings at tilted axes |
| Database | Three stacked `CylinderGeometry` discs, decreasing radius toward top |
| Security | Shield silhouette built from a `ShapeGeometry` + `ExtrudeGeometry` |
| Performance | Elongated diamond / lightning bolt from `ConeGeometry` halves mirrored on Y |

---

## Grained shadow shader

Use `MeshStandardMaterial` extended via `onBeforeCompile` to inject grain into the shadow regions — avoids writing a full shader from scratch while keeping Three.js's PBR lighting:

1. In the injected fragment chunk, sample the 128×128 noise texture at `gl_FragCoord.xy / 128.0` to get a grain value `[0, 1]`.
2. Compute a shadow factor from the existing `totalDiffuse` / `totalSpecular` output.
3. In shadow regions, modulate the fragment color by `mix(1.0, grainValue, u_grainIntensity)` — grain visible in shadow only, invisible in highlights.
4. `u_grainIntensity: 0.18` — subtle, matches page grain level.

The noise texture is already loaded by the background shader; it is passed into Three.js as a `THREE.Texture` wrapping the same `HTMLImageElement`.

---

## Cursor tracking

### Desktop
- `mousemove` listener on the `.services-sticky` container.
- Normalise cursor to `[-1, 1]` within the container bounds.
- Lerp mesh group rotation toward `targetX = cursorY * MAX_ANGLE`, `targetY = cursorX * MAX_ANGLE` each frame (lerp factor `0.08`).
- `MAX_ANGLE = Math.PI / 10` (18°).

### Mobile
- No cursor tracking.
- Continuous slow Y-axis rotation: `mesh.rotation.y += 0.008` per frame (at 30fps ≈ ~14° per second, full revolution in ~26s).

---

## File changes

| File | Change |
|---|---|
| `src/sections/services.ts` | Replace icon HTML with `<canvas>` slot; mount Three.js on init; add cursor listener; move dots to vertical track |
| `src/style.css` | Update `.service-icon-wrap` → `.service-icon-canvas`; add `.services-dots` vertical layout |
| `src/services-3d.ts` (new) | All Three.js: renderer, scenes, geometries, shader, animation loop, cursor tracking |
| `package.json` | Add `three` dependency |

---

## Out of scope

- Cast shadows from icons onto the slide background (shadow maps) — not needed, grain shader handles depth perception.
- GLTF model loading.
- Works/portfolio section (tracked separately in memory).
