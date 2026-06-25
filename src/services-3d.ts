import * as THREE from 'three';
import { getShaderNoiseTexture } from '@paper-design/shaders';

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

  // ── Rotation target ─────────────────────────────────────────────────
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

  return { activate, destroy };
}

// ── Lights ─────────────────────────────────────────────────────────────
function addLights(scene: THREE.Scene) {
  scene.add(new THREE.AmbientLight(0xffffff, 0.4));
  const dir = new THREE.DirectionalLight(0xffffff, 1.2);
  dir.position.set(2, 3, 3);
  scene.add(dir);
}

// ── Shared material (grain injected in Task 4) ─────────────────────────
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
