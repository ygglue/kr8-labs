import * as THREE from 'three';
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export interface Services3D {
  activate(index: number): void;
  destroy(): void;
}

interface StraySystem {
  mesh: THREE.LineSegments;
  update(group: THREE.Object3D): void;
  dispose(): void;
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
  camera.position.z = 2.8;

  const { scenes, objects, strays, pointMat, lineMat, strayMat, dotTex } = buildScenes();
  let current = 0;
  canvasSlots[0].appendChild(renderer.domElement);

  const MAX_ANGLE = Math.PI / 10;
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

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let rafId = 0;
  let lastFrameTime = 0;
  const TARGET_INTERVAL = 1000 / 30;

  function tick(time: number) {
    rafId = requestAnimationFrame(tick);
    if (time - lastFrameTime < TARGET_INTERVAL) return;
    lastFrameTime = time;
    updateMeshRotation();
    strays[current].update(objects[current]);
    renderer.render(scenes[current], camera);
  }

  function start() { if (!rafId) rafId = requestAnimationFrame(tick); }
  function stop()  { cancelAnimationFrame(rafId); rafId = 0; }

  let stopObserver = () => {};
  let stopVisibility = () => {};

  if (reducedMotion) {
    renderer.render(scenes[current], camera);
  } else {
    let isIntersecting = false;

    const observer = new IntersectionObserver(
      ([entry]) => {
        isIntersecting = entry.isIntersecting;
        isIntersecting ? start() : stop();
      },
      { threshold: 0 },
    );
    observer.observe(stickyEl);
    stopObserver = () => observer.disconnect();

    const onVisibility = () => {
      if (!document.hidden && isIntersecting) start();
      else stop();
    };
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
    scenes.forEach((scene) => {
      scene.traverse((child) => {
        if (
          child instanceof THREE.Mesh ||
          child instanceof THREE.Line ||
          child instanceof THREE.Points
        ) {
          child.geometry.dispose();
        }
      });
    });
    strays.forEach(s => s.dispose());
    pointMat.dispose();
    lineMat.dispose();
    strayMat.dispose();
    dotTex.dispose();
    renderer.dispose();
  }

  return { activate, destroy };
}

// ── Shared materials ───────────────────────────────────────────────────
// Soft round sprite for each constellation dot (white core → transparent).
function createDotTexture(): THREE.CanvasTexture {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0,    'rgba(255,255,255,1)');
  g.addColorStop(0.35, 'rgba(236,230,255,0.85)');
  g.addColorStop(1,    'rgba(236,230,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

function createPointMaterial(tex: THREE.Texture): THREE.PointsMaterial {
  return new THREE.PointsMaterial({
    map: tex,
    color: 0xece6ff,
    size: 0.07,
    sizeAttenuation: true,
    transparent: true,
    depthWrite: false,
  });
}

function createLineMaterial(): THREE.LineBasicMaterial {
  return new THREE.LineBasicMaterial({
    color: 0x9a8fe0,
    transparent: true,
    opacity: 0.16,
    depthWrite: false,
  });
}

// Tendril material: per-vertex alpha so strays fade in/out instead of
// reading as hard scratches — keeps them coherent with the dotted web.
function createStrayMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uColor:   { value: new THREE.Color(0xc9bfff) },
      uOpacity: { value: 0.55 },
    },
    vertexShader: `
      attribute float alpha;
      varying float vAlpha;
      void main() {
        vAlpha = alpha;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uOpacity;
      varying float vAlpha;
      void main() {
        gl_FragColor = vec4(uColor, vAlpha * uOpacity);
      }
    `,
  });
}

// ── Stray tendril system ───────────────────────────────────────────────
// Short feelers that grow out of a cloud node and retract, fading in and
// out — they read as living extensions of the web, not stray scratches.
const STRAY_COUNT    = 10;
const STRAY_LIFETIME = 30 * 3;  // frames at 30fps (~3s breathe cycle)
const STRAY_MAXLEN   = 0.34;    // peak tendril length (model units)

function createStraySystem(
  samplePositions: THREE.Vector3[],
  strayMat: THREE.ShaderMaterial,
): StraySystem {
  // 2 vertices per tendril: [anchor (tracks rotation), free tip (extends out)]
  const positions = new Float32Array(STRAY_COUNT * 6);
  const alphas    = new Float32Array(STRAY_COUNT * 2);
  const localDir  = new Float32Array(STRAY_COUNT * 3); // outward dir in model space
  const anchorIdx = new Int32Array(STRAY_COUNT);
  const lives     = new Float32Array(STRAY_COUNT);

  const posAttr = new THREE.BufferAttribute(positions, 3);
  posAttr.setUsage(THREE.DynamicDrawUsage);
  const alphaAttr = new THREE.BufferAttribute(alphas, 1);
  alphaAttr.setUsage(THREE.DynamicDrawUsage);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', posAttr);
  geo.setAttribute('alpha', alphaAttr);
  const mesh = new THREE.LineSegments(geo, strayMat);

  for (let i = 0; i < STRAY_COUNT; i++) lives[i] = Math.random();

  const _anchor = new THREE.Vector3();
  const _dir    = new THREE.Vector3();

  function spawn(i: number) {
    anchorIdx[i] = Math.floor(Math.random() * samplePositions.length);
    const src = samplePositions[anchorIdx[i]];

    // Outward (away from local origin) biased, plus a random jitter.
    const dist = src.length();
    const ox = dist > 0 ? src.x / dist : 0;
    const oy = dist > 0 ? src.y / dist : 0;
    const oz = dist > 0 ? src.z / dist : 0;
    const theta = Math.random() * Math.PI * 2;
    const phi   = Math.acos(2 * Math.random() - 1);
    let dx = 0.65 * ox + 0.35 * Math.sin(phi) * Math.cos(theta);
    let dy = 0.65 * oy + 0.35 * Math.sin(phi) * Math.sin(theta);
    let dz = 0.65 * oz + 0.35 * Math.cos(phi);
    const len = Math.hypot(dx, dy, dz) || 1;
    localDir[i * 3]     = dx / len;
    localDir[i * 3 + 1] = dy / len;
    localDir[i * 3 + 2] = dz / len;
    lives[i] = 0;
  }

  function update(group: THREE.Object3D) {
    group.updateWorldMatrix(true, false);
    const lifeStep = 1 / STRAY_LIFETIME;
    for (let i = 0; i < STRAY_COUNT; i++) {
      lives[i] += lifeStep;
      if (lives[i] >= 1) {
        spawn(i);
        alphas[i * 2] = alphas[i * 2 + 1] = 0; // invisible until next frame
        continue;
      }
      const env = Math.sin(lives[i] * Math.PI); // 0 → 1 → 0 over lifetime
      const reach = STRAY_MAXLEN * env;

      // Anchor tracks the rotating cloud vertex.
      _anchor.copy(samplePositions[anchorIdx[i]]).applyMatrix4(group.matrixWorld);
      // Direction rotates with the shape so the tendril stays attached.
      _dir.set(localDir[i * 3], localDir[i * 3 + 1], localDir[i * 3 + 2])
        .applyQuaternion(group.quaternion);

      positions[i * 6]     = _anchor.x;
      positions[i * 6 + 1] = _anchor.y;
      positions[i * 6 + 2] = _anchor.z;
      positions[i * 6 + 3] = _anchor.x + _dir.x * reach;
      positions[i * 6 + 4] = _anchor.y + _dir.y * reach;
      positions[i * 6 + 5] = _anchor.z + _dir.z * reach;

      alphas[i * 2]     = env;        // bright at the rooted node
      alphas[i * 2 + 1] = env * 0.25; // fades toward the tip
    }
    posAttr.needsUpdate = true;
    alphaAttr.needsUpdate = true;
  }

  function dispose() { geo.dispose(); }

  return { mesh, update, dispose };
}

// ── Point-cloud network builder ────────────────────────────────────────
type WireItem = {
  geo: THREE.BufferGeometry;
  pos?: [number, number, number];
  rot?: [number, number, number];
};

const KNN      = 3;   // nearest neighbors each dot connects to
const MAX_LINK = 0.5; // drop links longer than this (model units)

type CloudOpts = {
  count?: number;       // surface dots (fill density)
  edgeSpacing?: number; // spacing of silhouette dots along hard edges
};

function makePointCloud(
  items: WireItem[],
  pointMat: THREE.PointsMaterial,
  lineMat: THREE.LineBasicMaterial,
  opts: CloudOpts = {},
): { group: THREE.Group; samplePositions: THREE.Vector3[] } {
  const count       = opts.count ?? 280;
  const edgeSpacing = opts.edgeSpacing ?? 0.13;
  const g = new THREE.Group();
  const _mat = new THREE.Matrix4();
  const _q   = new THREE.Quaternion();
  const _s   = new THREE.Vector3(1, 1, 1);
  const _e   = new THREE.Euler();

  // 1. Place each sub-geometry: clone (position-only) for surface sampling,
  //    and walk its hard edges to lay down silhouette dots (recognizability).
  const clones: THREE.BufferGeometry[] = [];
  const edgePts: number[] = [];
  const _a = new THREE.Vector3();
  const _b = new THREE.Vector3();
  for (const { geo, pos, rot } of items) {
    if (rot) _e.set(...rot); else _e.set(0, 0, 0);
    _q.setFromEuler(_e);
    _mat.compose(pos ? new THREE.Vector3(...pos) : new THREE.Vector3(), _q, _s);

    const c = geo.clone();
    for (const name of Object.keys(c.attributes)) {
      if (name !== 'position') c.deleteAttribute(name);
    }
    c.applyMatrix4(_mat);
    clones.push(c);

    // Silhouette dots along EdgesGeometry segments.
    const eg = new THREE.EdgesGeometry(geo);
    const ep = eg.attributes.position;
    for (let s = 0; s < ep.count; s += 2) {
      _a.set(ep.getX(s),     ep.getY(s),     ep.getZ(s)).applyMatrix4(_mat);
      _b.set(ep.getX(s + 1), ep.getY(s + 1), ep.getZ(s + 1)).applyMatrix4(_mat);
      const n = Math.max(1, Math.round(_a.distanceTo(_b) / edgeSpacing));
      for (let k = 0; k < n; k++) {
        const t = k / n; // [0,1): start inclusive, end exclusive to avoid corner pile-up
        edgePts.push(
          _a.x + (_b.x - _a.x) * t,
          _a.y + (_b.y - _a.y) * t,
          _a.z + (_b.z - _a.z) * t,
        );
      }
    }
    eg.dispose();
  }

  // 2. Merge for uniform area-weighted surface sampling.
  const merged = clones.length === 1 ? clones[0] : mergeGeometries(clones, false)!;
  const sampler = new MeshSurfaceSampler(new THREE.Mesh(merged)).build();

  // 3. Combine silhouette dots + surface fill into one position buffer.
  const edgeCount = edgePts.length / 3;
  const total = edgeCount + count;
  const positions = new Float32Array(total * 3);
  positions.set(edgePts, 0);
  const samplePositions: THREE.Vector3[] = [];
  for (let i = 0; i < edgeCount; i++) {
    samplePositions.push(new THREE.Vector3(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]));
  }
  const _p = new THREE.Vector3();
  for (let i = 0; i < count; i++) {
    sampler.sample(_p);
    const o = (edgeCount + i) * 3;
    positions[o] = _p.x; positions[o + 1] = _p.y; positions[o + 2] = _p.z;
    samplePositions.push(_p.clone());
  }

  // 4. Dot cloud.
  const pointGeo = new THREE.BufferGeometry();
  pointGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const points = new THREE.Points(pointGeo, pointMat);

  // 5. Connect each dot to its KNN nearest neighbors (deduped, length-capped).
  const seen = new Set<number>();
  const linkVerts: number[] = [];
  const maxLinkSq = MAX_LINK * MAX_LINK;
  const neighbors: { j: number; d2: number }[] = [];
  for (let i = 0; i < total; i++) {
    neighbors.length = 0;
    const ax = positions[i * 3], ay = positions[i * 3 + 1], az = positions[i * 3 + 2];
    for (let j = 0; j < total; j++) {
      if (j === i) continue;
      const dx = ax - positions[j * 3];
      const dy = ay - positions[j * 3 + 1];
      const dz = az - positions[j * 3 + 2];
      neighbors.push({ j, d2: dx * dx + dy * dy + dz * dz });
    }
    neighbors.sort((a, b) => a.d2 - b.d2);
    for (let k = 0; k < KNN && k < neighbors.length; k++) {
      const { j, d2 } = neighbors[k];
      if (d2 > maxLinkSq) break;
      const key = i < j ? i * total + j : j * total + i;
      if (seen.has(key)) continue;
      seen.add(key);
      linkVerts.push(
        ax, ay, az,
        positions[j * 3], positions[j * 3 + 1], positions[j * 3 + 2],
      );
    }
  }
  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(linkVerts), 3));
  const lines = new THREE.LineSegments(lineGeo, lineMat);

  g.add(points, lines);

  // Sampling geometry no longer needed.
  merged.dispose();
  for (const c of clones) if (c !== merged) c.dispose();

  return { group: g, samplePositions };
}

// ── Scene builder type ─────────────────────────────────────────────────
type SceneResult = { scene: THREE.Scene; obj: THREE.Object3D; stray: StraySystem };

// ── Icon: Development — < > brackets ──────────────────────────────────
function sceneDevelopment(p: THREE.PointsMaterial, l: THREE.LineBasicMaterial, s: THREE.ShaderMaterial): SceneResult {
  const scene = new THREE.Scene();
  const bar = () => new THREE.BoxGeometry(0.62, 0.11, 0.15);
  const { group: g, samplePositions } = makePointCloud([
    { geo: bar(), pos: [-0.52,  0.27, 0], rot: [0, 0,  Math.PI / 4] },
    { geo: bar(), pos: [-0.52, -0.27, 0], rot: [0, 0, -Math.PI / 4] },
    { geo: bar(), pos: [ 0.52,  0.27, 0], rot: [0, 0, -Math.PI / 4] },
    { geo: bar(), pos: [ 0.52, -0.27, 0], rot: [0, 0,  Math.PI / 4] },
  ], p, l, { count: 130, edgeSpacing: 0.075 });
  const stray = createStraySystem(samplePositions, s);
  scene.add(g, stray.mesh);
  return { scene, obj: g, stray };
}

// ── Icon: UI/UX — monitor frame ────────────────────────────────────────
function sceneUI(p: THREE.PointsMaterial, l: THREE.LineBasicMaterial, s: THREE.ShaderMaterial): SceneResult {
  const scene = new THREE.Scene();
  const { group: g, samplePositions } = makePointCloud([
    { geo: new THREE.BoxGeometry(1.8, 1.1, 0.12) },
    { geo: new THREE.BoxGeometry(1.8, 0.18, 0.14), pos: [0,  0.64, 0] },
    { geo: new THREE.BoxGeometry(0.35, 0.3, 0.09), pos: [0, -0.7,  0] },
    { geo: new THREE.BoxGeometry(0.8, 0.09, 0.22), pos: [0, -0.85, 0] },
  ], p, l, { count: 190, edgeSpacing: 0.1 });
  const stray = createStraySystem(samplePositions, s);
  scene.add(g, stray.mesh);
  return { scene, obj: g, stray };
}

// ── Icon: Cloud — sphere + two tilted torus rings ──────────────────────
function sceneCloud(p: THREE.PointsMaterial, l: THREE.LineBasicMaterial, s: THREE.ShaderMaterial): SceneResult {
  const scene = new THREE.Scene();
  const { group: g, samplePositions } = makePointCloud([
    { geo: new THREE.SphereGeometry(0.65, 12, 9) },
    { geo: new THREE.TorusGeometry(0.85, 0.06, 8, 28), rot: [ Math.PI / 4, 0,           0] },
    { geo: new THREE.TorusGeometry(0.85, 0.06, 8, 28), rot: [-Math.PI / 4, Math.PI / 2, 0] },
  ], p, l, { count: 320, edgeSpacing: 0.17 });
  const stray = createStraySystem(samplePositions, s);
  scene.add(g, stray.mesh);
  return { scene, obj: g, stray };
}

// ── Icon: Database — 3 stacked cylinder discs ──────────────────────────
function sceneDatabase(p: THREE.PointsMaterial, l: THREE.LineBasicMaterial, s: THREE.ShaderMaterial): SceneResult {
  const scene = new THREE.Scene();
  const { group: g, samplePositions } = makePointCloud([
    { geo: new THREE.CylinderGeometry(0.72, 0.72, 0.28, 20), pos: [0,  0.58, 0] },
    { geo: new THREE.CylinderGeometry(0.82, 0.82, 0.28, 20), pos: [0,  0,    0] },
    { geo: new THREE.CylinderGeometry(0.72, 0.72, 0.28, 20), pos: [0, -0.58, 0] },
  ], p, l, { count: 210, edgeSpacing: 0.12 });
  const stray = createStraySystem(samplePositions, s);
  scene.add(g, stray.mesh);
  return { scene, obj: g, stray };
}

// ── Icon: Security — extruded shield ───────────────────────────────────
function sceneSecurity(p: THREE.PointsMaterial, l: THREE.LineBasicMaterial, s: THREE.ShaderMaterial): SceneResult {
  const scene = new THREE.Scene();
  const shape = new THREE.Shape();
  shape.moveTo(-0.7,  0.85);
  shape.lineTo( 0.7,  0.85);
  shape.lineTo( 0.7,  0.15);
  shape.bezierCurveTo( 0.7, -0.55,    0, -0.95, 0, -0.95);
  shape.bezierCurveTo(   0, -0.95, -0.7, -0.55, -0.7, 0.15);
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.22, bevelEnabled: false });
  const { group: g, samplePositions } = makePointCloud([{ geo, pos: [0, -0.05, -0.11] }], p, l, { count: 190, edgeSpacing: 0.11 });
  const stray = createStraySystem(samplePositions, s);
  scene.add(g, stray.mesh);
  return { scene, obj: g, stray };
}

// ── Icon: Performance — extruded lightning bolt ─────────────────────────
function scenePerformance(p: THREE.PointsMaterial, l: THREE.LineBasicMaterial, s: THREE.ShaderMaterial): SceneResult {
  const scene = new THREE.Scene();
  const shape = new THREE.Shape();
  shape.moveTo( 0.28,  1.0);
  shape.lineTo(-0.12,  0.08);
  shape.lineTo( 0.22,  0.08);
  shape.lineTo(-0.28, -1.0);
  shape.lineTo( 0.12, -0.08);
  shape.lineTo(-0.22, -0.08);
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.2, bevelEnabled: false });
  const { group: g, samplePositions } = makePointCloud([{ geo, pos: [0, 0, -0.1] }], p, l, { count: 120, edgeSpacing: 0.07 });
  const stray = createStraySystem(samplePositions, s);
  scene.add(g, stray.mesh);
  return { scene, obj: g, stray };
}

// ── Assemble all scenes ────────────────────────────────────────────────
function buildScenes(): {
  scenes: THREE.Scene[];
  objects: THREE.Object3D[];
  strays: StraySystem[];
  pointMat: THREE.PointsMaterial;
  lineMat: THREE.LineBasicMaterial;
  strayMat: THREE.ShaderMaterial;
  dotTex: THREE.CanvasTexture;
} {
  const dotTex   = createDotTexture();
  const pointMat = createPointMaterial(dotTex);
  const lineMat  = createLineMaterial();
  const strayMat = createStrayMaterial();
  const built = [
    sceneDevelopment(pointMat, lineMat, strayMat),
    sceneUI(pointMat, lineMat, strayMat),
    sceneCloud(pointMat, lineMat, strayMat),
    sceneDatabase(pointMat, lineMat, strayMat),
    sceneSecurity(pointMat, lineMat, strayMat),
    scenePerformance(pointMat, lineMat, strayMat),
  ];
  return {
    scenes:  built.map(b => b.scene),
    objects: built.map(b => b.obj),
    strays:  built.map(b => b.stray),
    pointMat,
    lineMat,
    strayMat,
    dotTex,
  };
}
