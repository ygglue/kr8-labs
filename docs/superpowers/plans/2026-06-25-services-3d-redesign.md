# Services Section — 3D Icons Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the flat SVG service icons with Three.js 3D geometric compositions, add cursor-tracking tilt on desktop and auto-rotation on mobile, grained shadows, and convert the bottom dots navigation to a vertical scrollbar-style track on the right edge.

**Architecture:** A new `src/services-3d.ts` owns all Three.js logic — one shared `WebGLRenderer`, six scenes, animation loop. `services.ts` delegates 3D init and scene switching to it via a nullable `s3d` ref. CSS drives the slide layout (desktop row / mobile column) and vertical dots track.

**Tech Stack:** Three.js (npm), `@types/three` (dev), Vite (tree-shaking), vanilla TypeScript.

## Global Constraints

- 30 fps cap — `TARGET_INTERVAL = 1000 / 30` (~33 ms gate in rAF loop)
- One shared `WebGLRenderer` / canvas — canvas is moved into the active slide's `.service-icon-canvas` slot on `activate()`
- `devicePixelRatio`: `Math.min(window.devicePixelRatio, 2)` on desktop; forced to `1` when `window.innerWidth < 1024`
- Pause loop via `IntersectionObserver` on `.services-sticky` + `visibilitychange`; render one static frame under `prefers-reduced-motion`
- Grain shader via `MeshStandardMaterial.onBeforeCompile` — no full custom shader
- No shadow maps, no GLTF, no env maps
- Canvas display size: 240×240 px desktop, 160×160 px mobile (CSS-controlled; Three.js `setSize` called with `updateStyle: false`)
- Cursor tilt capped at `MAX_ANGLE = Math.PI / 10` (±18°), lerp factor `0.08`
- Mobile auto-rotation: `0.008 rad/frame` on Y axis (≈14°/s at 30 fps)
- Ghost number (`.service-num`) hidden on mobile

---

## File map

| File | Action | Responsibility |
|---|---|---|
| `src/services-3d.ts` | Create | Renderer, 6 scenes, material, grain shader, animation loop, cursor tracking |
| `src/sections/services.ts` | Modify | HTML template (canvas slots, dots repositioned), init 3D, scene switching |
| `src/style.css` | Modify | Slide layout, vertical dots track, canvas sizing, hide ghost number on mobile |
| `package.json` | Modify | Add `three` dependency |

---

### Task 1: Install Three.js

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install**
```bash
npm install three
npm install --save-dev @types/three
```

- [ ] **Step 2: Verify build compiles cleanly**
```bash
npm run build
```
Expected: exits 0, no type errors.

- [ ] **Step 3: Commit**
```bash
git add package.json package-lock.json
git commit -m "Add three.js dependency"
```

---

### Task 2: services-3d.ts — core scaffold

**Files:**
- Create: `src/services-3d.ts`

**Produces:**
- `initServices3D(stickyEl: HTMLElement, canvasSlots: HTMLElement[]): Services3D`
- `interface Services3D { activate(index: number): void; destroy(): void }`

- [ ] **Step 1: Create the file**

Create `src/services-3d.ts` with the full shell. Later tasks fill in `buildScenes`, `updateMeshRotation`, and the cursor listener:

```typescript
import * as THREE from 'three';

export interface Services3D {
  activate(index: number): void;
  destroy(): void;
}

const IS_MOBILE = window.innerWidth < 1024;
const CANVAS_SIZE = IS_MOBILE ? 160 : 240;

export function initServices3D(
  stickyEl: HTMLElement,
  canvasSlots: HTMLElement[],
): Services3D {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(IS_MOBILE ? 1 : Math.min(window.devicePixelRatio, 2));
  renderer.setSize(CANVAS_SIZE, CANVAS_SIZE, false);

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.z = 4;

  const { scenes, objects } = buildScenes();
  let current = 0;

  // Place canvas in first slot
  canvasSlots[0].appendChild(renderer.domElement);

  // ── Rotation target (filled in Task 6) ─────────────────────────────
  let targetRotX = 0;
  let targetRotY = 0;
  let cleanupCursor = () => {};

  function updateMeshRotation() {
    // filled in Task 6
  }

  // ── Animation loop (filled in Task 5) ──────────────────────────────
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let rafId = 0;
  let lastFrameTime = 0;
  const TARGET_INTERVAL = 1000 / 30;

  function tick(time: number) {
    rafId = requestAnimationFrame(tick);
    if (time - lastFrameTime < TARGET_INTERVAL) return;
    lastFrameTime = time;
    updateMeshRotation();
    renderer.render(scenes[current], camera);
  }

  function start() {
    if (rafId) return;
    rafId = requestAnimationFrame(tick);
  }
  function stop() {
    cancelAnimationFrame(rafId);
    rafId = 0;
  }

  if (reducedMotion) {
    renderer.render(scenes[current], camera);
  } else {
    const observer = new IntersectionObserver(([entry]) => {
      entry.isIntersecting ? start() : stop();
    }, { threshold: 0 });
    observer.observe(stickyEl);

    const onVisibility = () => {
      if (document.hidden) stop();
      else start();
    };
    document.addEventListener('visibilitychange', onVisibility);

    // store for destroy
    (cleanupCursor as unknown as { _obs: IntersectionObserver }) = Object.assign(
      cleanupCursor, { _obs: observer, _vis: onVisibility }
    );
  }

  function activate(index: number) {
    const prev = canvasSlots[current];
    if (renderer.domElement.parentElement === prev) prev.removeChild(renderer.domElement);
    canvasSlots[index].appendChild(renderer.domElement);
    current = index;
  }

  function destroy() {
    stop();
    cleanupCursor();
    renderer.dispose();
  }

  return { activate, destroy };
}

// ── Placeholder — replaced in Task 3 ──────────────────────────────────
function buildScenes(): { scenes: THREE.Scene[]; objects: THREE.Object3D[] } {
  const scene = new THREE.Scene();
  const obj = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshNormalMaterial());
  scene.add(obj);
  return { scenes: [scene], objects: [obj] };
}
```

- [ ] **Step 2: Verify no build errors**
```bash
npm run build
```
Expected: success.

- [ ] **Step 3: Commit**
```bash
git add src/services-3d.ts
git commit -m "Scaffold services-3d.ts with renderer, camera, loop shell"
```

---

### Task 3: buildScenes() — 6 icon geometries + shared material

**Files:**
- Modify: `src/services-3d.ts`

- [ ] **Step 1: Replace the placeholder `buildScenes` function entirely**

Replace the `// ── Placeholder` comment and the placeholder `buildScenes` function at the bottom of `src/services-3d.ts` with:

```typescript
// ── Lights ─────────────────────────────────────────────────────────────
function addLights(scene: THREE.Scene) {
  scene.add(new THREE.AmbientLight(0xffffff, 0.4));
  const dir = new THREE.DirectionalLight(0xffffff, 1.2);
  dir.position.set(2, 3, 3);
  scene.add(dir);
}

// ── Shared material (grain injected in Task 4) ─────────────────────────
function createMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color: 0x7c5af6, roughness: 0.35, metalness: 0.6 });
}

// ── Icon: Development — < > brackets ──────────────────────────────────
function sceneDevelopment(mat: THREE.MeshStandardMaterial): { scene: THREE.Scene; obj: THREE.Object3D } {
  const scene = new THREE.Scene();
  addLights(scene);
  const g = new THREE.Group();

  const bar = () => new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.11, 0.15), mat);

  const lt = bar(); lt.position.set(-0.52,  0.27, 0); lt.rotation.z =  Math.PI / 4;
  const lb = bar(); lb.position.set(-0.52, -0.27, 0); lb.rotation.z = -Math.PI / 4;
  const rt = bar(); rt.position.set( 0.52,  0.27, 0); rt.rotation.z = -Math.PI / 4;
  const rb = bar(); rb.position.set( 0.52, -0.27, 0); rb.rotation.z =  Math.PI / 4;

  g.add(lt, lb, rt, rb);
  scene.add(g);
  return { scene, obj: g };
}

// ── Icon: UI/UX — monitor frame ────────────────────────────────────────
function sceneUI(mat: THREE.MeshStandardMaterial): { scene: THREE.Scene; obj: THREE.Object3D } {
  const scene = new THREE.Scene();
  addLights(scene);
  const g = new THREE.Group();

  const body   = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.1, 0.12), mat);
  const topBar = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.18, 0.14), mat);
  topBar.position.y = 0.64;
  const stand  = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.3, 0.09), mat);
  stand.position.y = -0.7;
  const base   = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.09, 0.22), mat);
  base.position.y = -0.85;

  g.add(body, topBar, stand, base);
  scene.add(g);
  return { scene, obj: g };
}

// ── Icon: Cloud — sphere + two tilted torus rings ──────────────────────
function sceneCloud(mat: THREE.MeshStandardMaterial): { scene: THREE.Scene; obj: THREE.Object3D } {
  const scene = new THREE.Scene();
  addLights(scene);
  const g = new THREE.Group();

  const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.65, 16, 12), mat);

  const r1 = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.055, 8, 32), mat);
  r1.rotation.x = Math.PI / 4;

  const r2 = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.055, 8, 32), mat);
  r2.rotation.x = -Math.PI / 4;
  r2.rotation.y =  Math.PI / 2;

  g.add(sphere, r1, r2);
  scene.add(g);
  return { scene, obj: g };
}

// ── Icon: Database — 3 stacked cylinder discs ──────────────────────────
function sceneDatabase(mat: THREE.MeshStandardMaterial): { scene: THREE.Scene; obj: THREE.Object3D } {
  const scene = new THREE.Scene();
  addLights(scene);
  const g = new THREE.Group();

  const disc = (y: number, r: number) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.28, 24), mat);
    m.position.y = y;
    return m;
  };

  g.add(disc(0.58, 0.72), disc(0, 0.82), disc(-0.58, 0.72));
  scene.add(g);
  return { scene, obj: g };
}

// ── Icon: Security — extruded shield ───────────────────────────────────
function sceneSecurity(mat: THREE.MeshStandardMaterial): { scene: THREE.Scene; obj: THREE.Object3D } {
  const scene = new THREE.Scene();
  addLights(scene);

  const shape = new THREE.Shape();
  shape.moveTo(-0.7,  0.85);
  shape.lineTo( 0.7,  0.85);
  shape.lineTo( 0.7,  0.15);
  shape.bezierCurveTo( 0.7, -0.55,    0, -0.95, 0, -0.95);
  shape.bezierCurveTo(   0, -0.95, -0.7, -0.55, -0.7, 0.15);
  shape.closePath();

  const mesh = new THREE.Mesh(
    new THREE.ExtrudeGeometry(shape, {
      depth: 0.2, bevelEnabled: true,
      bevelSize: 0.05, bevelThickness: 0.05, bevelSegments: 2,
    }),
    mat,
  );
  mesh.position.set(0, -0.05, -0.1);
  scene.add(mesh);
  return { scene, obj: mesh };
}

// ── Icon: Performance — extruded lightning bolt ─────────────────────────
function scenePerformance(mat: THREE.MeshStandardMaterial): { scene: THREE.Scene; obj: THREE.Object3D } {
  const scene = new THREE.Scene();
  addLights(scene);

  const shape = new THREE.Shape();
  shape.moveTo( 0.28,  1.0);
  shape.lineTo(-0.12,  0.08);
  shape.lineTo( 0.22,  0.08);
  shape.lineTo(-0.28, -1.0);
  shape.lineTo( 0.12, -0.08);
  shape.lineTo(-0.22, -0.08);
  shape.closePath();

  const mesh = new THREE.Mesh(
    new THREE.ExtrudeGeometry(shape, {
      depth: 0.18, bevelEnabled: true,
      bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 2,
    }),
    mat,
  );
  mesh.position.z = -0.09;
  scene.add(mesh);
  return { scene, obj: mesh };
}

// ── Assemble all scenes ────────────────────────────────────────────────
function buildScenes(): { scenes: THREE.Scene[]; objects: THREE.Object3D[] } {
  const mat = createMaterial();
  const built = [
    sceneDevelopment(mat),
    sceneUI(mat),
    sceneCloud(mat),
    sceneDatabase(mat),
    sceneSecurity(mat),
    scenePerformance(mat),
  ];
  return {
    scenes:  built.map(b => b.scene),
    objects: built.map(b => b.obj),
  };
}
```

- [ ] **Step 2: Verify build**
```bash
npm run build
```
Expected: success.

- [ ] **Step 3: Commit**
```bash
git add src/services-3d.ts
git commit -m "Add 6 Three.js icon scenes (development, ui, cloud, database, security, performance)"
```

---

### Task 4: Grained shadow shader via onBeforeCompile

**Files:**
- Modify: `src/services-3d.ts`

- [ ] **Step 1: Add import at top of file**

Add to the imports at the top of `src/services-3d.ts`:
```typescript
import { getShaderNoiseTexture } from '@paper-design/shaders';
```

- [ ] **Step 2: Replace `createMaterial()` with grain-injecting version**

Replace the existing `createMaterial` function:

```typescript
function createMaterial(): THREE.MeshStandardMaterial {
  const mat = new THREE.MeshStandardMaterial({ color: 0x7c5af6, roughness: 0.35, metalness: 0.6 });

  const noiseImg = getShaderNoiseTexture();
  if (!noiseImg) return mat;

  const noiseTexture = new THREE.Texture(noiseImg);
  noiseTexture.wrapS = THREE.RepeatWrapping;
  noiseTexture.wrapT = THREE.RepeatWrapping;
  if (noiseImg.complete) {
    noiseTexture.needsUpdate = true;
  } else {
    noiseImg.addEventListener('load', () => { noiseTexture.needsUpdate = true; });
  }

  mat.onBeforeCompile = (shader) => {
    shader.uniforms.u_noiseTexture  = { value: noiseTexture };
    shader.uniforms.u_grainIntensity = { value: 0.18 };

    // Declare uniforms before void main()
    shader.fragmentShader = `
uniform sampler2D u_noiseTexture;
uniform float u_grainIntensity;
` + shader.fragmentShader;

    // Inject grain into shadow regions after Three.js dithering pass
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <dithering_fragment>',
      `#include <dithering_fragment>
      {
        float grain = texture2D(u_noiseTexture, gl_FragCoord.xy / 128.0).r;
        float lum   = dot(gl_FragColor.rgb, vec3(0.299, 0.587, 0.114));
        float shadow = 1.0 - smoothstep(0.1, 0.5, lum);
        gl_FragColor.rgb = mix(gl_FragColor.rgb, gl_FragColor.rgb * grain, shadow * u_grainIntensity);
      }`,
    );
  };

  return mat;
}
```

- [ ] **Step 3: Verify build**
```bash
npm run build
```
Expected: success.

- [ ] **Step 4: Commit**
```bash
git add src/services-3d.ts
git commit -m "Add grained shadow via MeshStandardMaterial.onBeforeCompile"
```

---

### Task 5: Animation loop — pause/resume, reduced-motion

**Files:**
- Modify: `src/services-3d.ts`

The scaffold in Task 2 has a basic loop. This task makes it production-ready: proper start/stop via `IntersectionObserver` and `visibilitychange`, and single-frame fallback for `prefers-reduced-motion`.

- [ ] **Step 1: Replace the animation + cleanup block inside `initServices3D`**

In `src/services-3d.ts`, inside `initServices3D`, replace the entire block from the `reducedMotion` constant down to the first definition of `destroy()`:

```typescript
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let rafId = 0;
  let lastFrameTime = 0;
  const TARGET_INTERVAL = 1000 / 30;

  function tick(time: number) {
    rafId = requestAnimationFrame(tick);
    if (time - lastFrameTime < TARGET_INTERVAL) return;
    lastFrameTime = time;
    updateMeshRotation();
    renderer.render(scenes[current], camera);
  }

  function start() { if (!rafId) rafId = requestAnimationFrame(tick); }
  function stop()  { cancelAnimationFrame(rafId); rafId = 0; }

  let stopObserver = () => {};
  let stopVisibility = () => {};

  if (reducedMotion) {
    renderer.render(scenes[current], camera);
  } else {
    const observer = new IntersectionObserver(
      ([entry]) => { entry.isIntersecting ? start() : stop(); },
      { threshold: 0 },
    );
    observer.observe(stickyEl);
    stopObserver = () => observer.disconnect();

    const onVisibility = () => { document.hidden ? stop() : start(); };
    document.addEventListener('visibilitychange', onVisibility);
    stopVisibility = () => document.removeEventListener('visibilitychange', onVisibility);
  }

  function activate(index: number) {
    const prev = canvasSlots[current];
    if (renderer.domElement.parentElement === prev) prev.removeChild(renderer.domElement);
    canvasSlots[index].appendChild(renderer.domElement);
    current = index;
  }

  function destroy() {
    stop();
    stopObserver();
    stopVisibility();
    cleanupCursor();
    renderer.dispose();
  }
```

Also remove the old `(cleanupCursor as unknown...)` assignment from Task 2's scaffold — it is no longer needed since `stopObserver` and `stopVisibility` handle cleanup.

- [ ] **Step 2: Verify build**
```bash
npm run build
```

- [ ] **Step 3: Commit**
```bash
git add src/services-3d.ts
git commit -m "Wire IntersectionObserver and visibilitychange pause/resume for 3D icons"
```

---

### Task 6: Cursor tracking (desktop) + auto-rotation (mobile)

**Files:**
- Modify: `src/services-3d.ts`

- [ ] **Step 1: Fill in `updateMeshRotation` inside `initServices3D`**

Replace the placeholder `updateMeshRotation` function:

```typescript
  const MAX_ANGLE = Math.PI / 10; // ±18°
  const LERP = 0.08;
  let targetRotX = 0;
  let targetRotY = 0;

  function updateMeshRotation() {
    const obj = objects[current];
    if (!obj) return;
    if (IS_MOBILE) {
      obj.rotation.y += 0.008;
    } else {
      obj.rotation.x += (targetRotX - obj.rotation.x) * LERP;
      obj.rotation.y += (targetRotY - obj.rotation.y) * LERP;
    }
  }
```

Remove the `let targetRotX = 0` and `let targetRotY = 0` lines that were in the Task 2 scaffold (they're now inside `updateMeshRotation`'s closure above).

- [ ] **Step 2: Fill in `cleanupCursor` with the desktop mouse listener**

Replace `let cleanupCursor = () => {};` in `initServices3D`:

```typescript
  let cleanupCursor = () => {};
  if (!IS_MOBILE) {
    const onMouseMove = (e: MouseEvent) => {
      const rect = stickyEl.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width)  * 2 - 1;
      const ny = ((e.clientY - rect.top)  / rect.height) * 2 - 1;
      targetRotY =  nx * MAX_ANGLE;
      targetRotX = -ny * MAX_ANGLE;
    };
    stickyEl.addEventListener('mousemove', onMouseMove);
    cleanupCursor = () => stickyEl.removeEventListener('mousemove', onMouseMove);
  }
```

- [ ] **Step 3: Verify build**
```bash
npm run build
```

- [ ] **Step 4: Commit**
```bash
git add src/services-3d.ts
git commit -m "Add cursor tracking and mobile auto-rotation to 3D icon scenes"
```

---

### Task 7: Update services.ts — HTML + 3D wiring

**Files:**
- Modify: `src/sections/services.ts`

**Consumes:** `initServices3D, Services3D` from `src/services-3d.ts`

- [ ] **Step 1: Add import**

At the top of `src/sections/services.ts`, add:
```typescript
import { initServices3D } from '../services-3d.ts';
import type { Services3D } from '../services-3d.ts';
```

- [ ] **Step 2: Update the `fromHTML` template**

Replace the entire template string inside `fromHTML(...)`:

```typescript
  const section = fromHTML(`
    <section class="services" id="services">
      <div class="services-sticky">

        <div class="services-top">
          <p class="eyebrow">02 · WHAT WE DO</p>
          <span class="service-counter">
            <span class="counter-cur">01</span> / 0${count}
          </span>
        </div>

        <div class="services-slides">
          ${SERVICES.map((s, i) => `
            <div class="service-slide${i === 0 ? " is-active" : ""}" data-index="${i}">
              <span class="service-num">0${i + 1}</span>
              <div class="service-body">
                <div class="service-icon-canvas" aria-hidden="true"></div>
                <h3 class="service-name">${s.title}</h3>
                <p class="service-desc">${s.description}</p>
              </div>
            </div>
          `).join("")}
        </div>

        <div class="services-dots" role="tablist" aria-label="Services">
          ${SERVICES.map((s, i) => `
            <button class="dot${i === 0 ? " is-active" : ""}"
                    role="tab" aria-label="${s.title}" data-dot="${i}"></button>
          `).join("")}
        </div>

        <div class="services-bottom">
          <p class="scroll-hint">Scroll to explore</p>
        </div>

      </div>
    </section>
  `);
```

- [ ] **Step 3: Declare `s3d` before `activate` and wire it in**

After the existing `let hinted = false;` line, add:
```typescript
  let s3d: Services3D | null = null;
```

Inside the existing `activate` function, add one line at the end:
```typescript
  function activate(index: number) {
    if (index === current) return;
    slides[current].classList.remove("is-active");
    dots[current].classList.remove("is-active");
    current = index;
    slides[current].classList.add("is-active");
    dots[current].classList.add("is-active");
    counter.textContent = String(index + 1).padStart(2, "0");
    s3d?.activate(index);
  }
```

- [ ] **Step 4: Init 3D after element is in the DOM**

Before `return section;`, add:
```typescript
  requestAnimationFrame(() => {
    const canvasSlots = Array.from(section.querySelectorAll<HTMLElement>('.service-icon-canvas'));
    const sticky = section.querySelector<HTMLElement>('.services-sticky')!;
    s3d = initServices3D(sticky, canvasSlots);
  });
```

- [ ] **Step 5: Verify build**
```bash
npm run build
```
Expected: success.

- [ ] **Step 6: Commit**
```bash
git add src/sections/services.ts
git commit -m "Wire 3D icon init and scene switching into services section"
```

---

### Task 8: CSS — vertical dots track

**Files:**
- Modify: `src/style.css`

- [ ] **Step 1: Make `.services-sticky` a positioning context**

In `src/style.css`, find `.services-sticky` and add `position: relative;`:
```css
.services-sticky {
  position: sticky;
  top: 0;
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 32px 0 40px;
  overflow: hidden;
  position: relative; /* add this */
}
```

- [ ] **Step 2: Replace `.services-dots` and `.dot` / `.dot.is-active` styles**

Find and replace the existing `.services-dots`, `.dot`, `.dot.is-active` blocks:

```css
.services-dots {
  position: absolute;
  right: -8px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  z-index: 2;
}

/* Hairline track */
.services-dots::before {
  content: '';
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 1px;
  background: var(--border);
  transform: translateX(-50%);
}

.dot {
  position: relative;
  z-index: 1;
  width: 6px;
  height: 6px;
  border-radius: 999px;
  border: none;
  background: rgba(255, 255, 255, 0.18);
  cursor: pointer;
  padding: 0;
  transition: background 0.35s var(--ease), height 0.35s var(--ease);
}

.dot.is-active {
  background: var(--purple-3);
  height: 24px;
  width: 6px;
}
```

- [ ] **Step 3: Remove `.services-bottom` flex children styles** that positioned dots + hint side-by-side (the hint is now the only child):
```css
.services-bottom {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}
```

- [ ] **Step 4: Verify build**
```bash
npm run build
```

- [ ] **Step 5: Commit**
```bash
git add src/style.css
git commit -m "Convert services dots to vertical scrollbar track"
```

---

### Task 9: CSS — slide layout (desktop row, mobile column)

**Files:**
- Modify: `src/style.css`

- [ ] **Step 1: Update `.service-slide` and `.service-body` for two-column desktop layout**

Replace the existing `.service-slide`, `.service-slide.is-active`, and `.service-body` blocks:

```css
.service-slide {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 48px;
  opacity: 0;
  transform: translateY(28px);
  transition: opacity 0.5s var(--ease), transform 0.5s var(--ease);
  pointer-events: none;
}
.service-slide.is-active {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

.service-body {
  position: relative;
  z-index: 1;
  flex: 1;
}

.service-icon-canvas {
  flex-shrink: 0;
  width: 240px;
  height: 240px;
  order: 2;
}

.service-icon-canvas canvas {
  display: block;
  width: 100% !important;
  height: 100% !important;
}
```

- [ ] **Step 2: Remove old `.service-icon-wrap` styles**

Delete the entire `.service-icon-wrap` CSS block from `src/style.css`.

- [ ] **Step 3: Add mobile overrides**

Inside the existing `@media (max-width: 1024px)` block (create it if it doesn't exist), add:

```css
@media (max-width: 1024px) {
  .service-slide {
    flex-direction: column;
    justify-content: center;
    gap: 24px;
  }

  .service-icon-canvas {
    order: 0;
    width: 160px;
    height: 160px;
  }

  .service-num {
    display: none;
  }
}
```

- [ ] **Step 4: Visual verification**

```bash
npm run dev
```

Open http://localhost:5174 and check:

**Desktop (≥1024px):**
- Service text (name + description) on the left, 3D canvas on the right
- Ghost number watermark visible behind text
- Dots vertical track on far right edge, active dot is taller pill
- Moving cursor over section tilts the 3D icon toward cursor
- Scrolling through services section cycles through icons smoothly
- No console WebGL errors

**Mobile (DevTools → 390px wide):**
- 3D canvas on top (160×160), text below
- Ghost number hidden
- Dots vertical track visible, active pill slides down as you scroll
- Icon rotates slowly on its own (no tilt)

- [ ] **Step 5: Commit**
```bash
git add src/style.css
git commit -m "Services slide layout: desktop row (text left, 3D right), mobile column (3D top)"
```
