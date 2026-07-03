import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

export interface Services3D {
  destroy(): void;
}

const CANVAS_SIZE = 160;
const CAMERA_Z = 3.0;
const FOV = 45;

function createWireframeMaterial(opacity: number): THREE.LineBasicMaterial {
  return new THREE.LineBasicMaterial({
    color: 0xc4b5fd,
    transparent: true,
    opacity,
    depthTest: true,
  });
}

type SceneBuilder = () => { scene: THREE.Scene; group: THREE.Group };

function sceneDevelopment(): ReturnType<SceneBuilder> {
  const scene = new THREE.Scene();
  const group = new THREE.Group();
  const mat = createWireframeMaterial(0.7);
  const bar = () => new THREE.BoxGeometry(0.62, 0.11, 0.15);
  const placements: [number, number, number, number, number, number][] = [
    [-0.52,  0.27, 0, 0, 0,  Math.PI / 4],
    [-0.52, -0.27, 0, 0, 0, -Math.PI / 4],
    [ 0.52,  0.27, 0, 0, 0, -Math.PI / 4],
    [ 0.52, -0.27, 0, 0, 0,  Math.PI / 4],
  ];
  for (const [x, y, z, rx, ry, rz] of placements) {
    const geo = new THREE.EdgesGeometry(bar());
    const lines = new THREE.LineSegments(geo, mat);
    lines.position.set(x, y, z);
    lines.rotation.set(rx, ry, rz);
    group.add(lines);
  }
  scene.add(group);
  return { scene, group };
}

function sceneUI(): ReturnType<SceneBuilder> {
  const scene = new THREE.Scene();
  const group = new THREE.Group();
  const mat = createWireframeMaterial(0.7);
  const items: { geo: THREE.BufferGeometry; pos?: [number, number, number] }[] = [
    { geo: new THREE.BoxGeometry(1.8, 1.1, 0.12) },
    { geo: new THREE.BoxGeometry(1.8, 0.18, 0.14), pos: [0,  0.64, 0] },
    { geo: new THREE.BoxGeometry(0.35, 0.3, 0.09), pos: [0, -0.7,  0] },
    { geo: new THREE.BoxGeometry(0.8, 0.09, 0.22), pos: [0, -0.85, 0] },
  ];
  for (const { geo, pos } of items) {
    const eg = new THREE.EdgesGeometry(geo);
    const lines = new THREE.LineSegments(eg, mat);
    if (pos) lines.position.set(...pos);
    group.add(lines);
  }
  scene.add(group);
  return { scene, group };
}

function sceneCloud(): ReturnType<SceneBuilder> {
  const scene = new THREE.Scene();
  const group = new THREE.Group();
  const mat = createWireframeMaterial(0.7);
  const main = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.SphereGeometry(0.65, 8, 6)), mat);
  group.add(main);
  const torus1 = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.TorusGeometry(0.85, 0.06, 8, 20)), createWireframeMaterial(0.35));
  torus1.rotation.set(Math.PI / 4, 0, 0);
  group.add(torus1);
  const torus2 = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.TorusGeometry(0.85, 0.06, 8, 20)), createWireframeMaterial(0.35));
  torus2.rotation.set(-Math.PI / 4, Math.PI / 2, 0);
  group.add(torus2);
  scene.add(group);
  return { scene, group };
}

function sceneDatabase(): ReturnType<SceneBuilder> {
  const scene = new THREE.Scene();
  const group = new THREE.Group();
  const mat = createWireframeMaterial(0.7);
  const tiers: [number, number, number, number, number, number][] = [
    [0.72, 0.72, 0.28, 0,  0.58, 0],
    [0.82, 0.82, 0.28, 0,  0,    0],
    [0.72, 0.72, 0.28, 0, -0.58, 0],
  ];
  for (const [rt, rb, h, x, y, z] of tiers) {
    const geo = new THREE.CylinderGeometry(rt, rb, h, 24);
    const eg = new THREE.EdgesGeometry(geo);
    const lines = new THREE.LineSegments(eg, mat);
    lines.position.set(x, y, z);
    group.add(lines);
  }
  scene.add(group);
  return { scene, group };
}

function sceneSecurity(): ReturnType<SceneBuilder> {
  const scene = new THREE.Scene();
  const group = new THREE.Group();
  const mat = createWireframeMaterial(0.7);
  const shape = new THREE.Shape();
  shape.moveTo(-0.7,  0.85);
  shape.lineTo( 0.7,  0.85);
  shape.lineTo( 0.7,  0.15);
  shape.bezierCurveTo( 0.7, -0.55,    0, -0.95, 0, -0.95);
  shape.bezierCurveTo(   0, -0.95, -0.7, -0.55, -0.7, 0.15);
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.22, bevelEnabled: false });
  const eg = new THREE.EdgesGeometry(geo);
  const lines = new THREE.LineSegments(eg, mat);
  lines.position.set(0, -0.05, -0.11);
  group.add(lines);
  scene.add(group);
  return { scene, group };
}

function scenePerformance(): ReturnType<SceneBuilder> {
  const scene = new THREE.Scene();
  const group = new THREE.Group();
  const mat = createWireframeMaterial(0.7);
  const shape = new THREE.Shape();
  shape.moveTo( 0.28,  1.0);
  shape.lineTo(-0.12,  0.08);
  shape.lineTo( 0.22,  0.08);
  shape.lineTo(-0.28, -1.0);
  shape.lineTo( 0.12, -0.08);
  shape.lineTo(-0.22, -0.08);
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.2, bevelEnabled: false });
  const eg = new THREE.EdgesGeometry(geo);
  const lines = new THREE.LineSegments(eg, mat);
  lines.position.set(0, 0, -0.1);
  group.add(lines);
  scene.add(group);
  return { scene, group };
}

const BUILDERS: SceneBuilder[] = [
  sceneDevelopment,
  sceneUI,
  sceneCloud,
  sceneDatabase,
  sceneSecurity,
  scenePerformance,
];

export function initServices3D(canvasSlots: HTMLElement[]): Services3D {
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);
  camera.position.z = CAMERA_Z;

  const scenes = BUILDERS.map(build => build());

  const renderers = canvasSlots.map((slot) => {
    const w = slot.clientWidth;
    const h = slot.clientHeight;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h, false);
    renderer.setClearColor(0x000000, 1);
    slot.appendChild(renderer.domElement);
    return renderer;
  });

  const composers = scenes.map((s, i) => {
    const w = canvasSlots[i].clientWidth;
    const h = canvasSlots[i].clientHeight;
    const composer = new EffectComposer(renderers[i]);
    composer.addPass(new RenderPass(s.scene, camera));
    const bloom = new UnrealBloomPass(
      new THREE.Vector2(w, h),
      1.0, 0.8, 0,
    );
    composer.addPass(bloom);
    return composer;
  });

  const SPEEDS = [0.003, 0.005, 0.004, 0.006, 0.0045, 0.0055];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let rafId = 0;

  function tick() {
    rafId = requestAnimationFrame(tick);
    for (let i = 0; i < scenes.length; i++) {
      if (!reducedMotion) scenes[i].group.rotation.y += SPEEDS[i];
      composers[i].render();
    }
  }

  function start() { if (!rafId) rafId = requestAnimationFrame(tick); }
  function stop()  { cancelAnimationFrame(rafId); rafId = 0; }

  const grid = canvasSlots[0].closest<HTMLElement>(".services-grid")!;
  const observer = new IntersectionObserver(
    ([entry]) => {
      entry.isIntersecting && !reducedMotion ? start() : stop();
    },
    { threshold: 0 },
  );
  observer.observe(grid);

  if (reducedMotion) {
    for (let i = 0; i < scenes.length; i++) {
      composers[i].render();
    }
  }

  function destroy() {
    stop();
    observer.disconnect();
    scenes.forEach((s) => {
      s.scene.traverse((child) => {
        if (child instanceof THREE.Mesh || child instanceof THREE.Line) {
          child.geometry.dispose();
        }
      });
    });
    composers.forEach(c => c.dispose());
    renderers.forEach(r => r.dispose());
  }

  return { destroy };
}
