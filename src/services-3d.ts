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

  const { scenes, objects: _objects } = buildScenes();
  let current = 0;

  // Place canvas in first slot
  canvasSlots[0].appendChild(renderer.domElement);

  // ── Rotation target (filled in Task 6) ─────────────────────────────
  // rotation targets — written by cursor listener (Task 6), read by updateMeshRotation (Task 6)
  const rot = { x: 0, y: 0 };
  let cleanupCursor = () => {};

  function updateMeshRotation() {
    void rot; // Task 6 will read rot.x / rot.y here
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
