/**
 * three-layer.js — tasteful, cheap ambient WebGL: a soft floating-particle
 * field ("dust in mall light") plus a slow light-beam shader, with mouse
 * parallax (±2°). Sits behind the content sections, never over the hero.
 *
 * Guards: paused via IntersectionObserver when the content area is off-screen,
 * paused when the tab is hidden, DPR capped at 1.5, disabled entirely on
 * prefers-reduced-motion and on low-end / save-data devices. All GPU resources
 * are disposed on teardown.
 */
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Clock,
  Color,
  Mesh,
  PerspectiveCamera,
  PlaneGeometry,
  Points,
  PointsMaterial,
  Scene,
  ShaderMaterial,
  WebGLRenderer,
} from 'three';
import { prefersReducedMotion, isLowEnd } from './utils.js';

const PARTICLE_COUNT = 640;

export function initAmbient() {
  const canvas = document.getElementById('ambient-canvas');
  if (!canvas) return () => {};

  if (prefersReducedMotion() || isLowEnd()) {
    canvas.style.display = 'none';
    return () => {};
  }

  let renderer;
  try {
    renderer = new WebGLRenderer({
      canvas,
      alpha: true,
      antialias: false,
      powerPreference: 'low-power',
    });
  } catch (err) {
    console.warn('[ambient] WebGL unavailable', err);
    canvas.style.display = 'none';
    return () => {};
  }

  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  renderer.setPixelRatio(dpr);
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.setClearColor(0x000000, 0);

  const scene = new Scene();
  const camera = new PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 120);
  camera.position.set(0, 0, 9);

  /* ---------------- soft round sprite texture ---------------- */
  const sprite = (() => {
    const c = document.createElement('canvas');
    c.width = 64;
    c.height = 64;
    const g = c.getContext('2d');
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.4, 'rgba(255,255,255,0.35)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
    const tex = new CanvasTexture(c);
    return tex;
  })();

  /* ---------------- dust particle field ---------------- */
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const speeds = new Float32Array(PARTICLE_COUNT);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 42;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 26;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 34 - 4;
    speeds[i] = 0.15 + Math.random() * 0.5;
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(positions, 3));

  const material = new PointsMaterial({
    color: 0xe8b25a,
    size: 0.11,
    map: sprite,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
    blending: AdditiveBlending,
    sizeAttenuation: true,
  });
  const points = new Points(geometry, material);
  scene.add(points);

  /* ---------------- slow light-beam shader ---------------- */
  const beamUniforms = {
    uTime: { value: 0 },
    uColor: { value: new Color(0xf0c98a) },
  };
  const beamMaterial = new ShaderMaterial({
    uniforms: beamUniforms,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform vec3 uColor;
      varying vec2 vUv;
      void main() {
        float w = smoothstep(0.5, 0.02, abs(vUv.x - 0.5));
        float h = smoothstep(0.0, 0.35, vUv.y) * smoothstep(1.0, 0.55, vUv.y);
        float flicker = 0.82 + 0.18 * sin(uTime * 0.6 + vUv.y * 4.0);
        gl_FragColor = vec4(uColor, w * h * 0.085 * flicker);
      }
    `,
  });
  const beamGeometry = new PlaneGeometry(7, 16);
  const beam = new Mesh(beamGeometry, beamMaterial);
  beam.position.set(-3.4, 2.2, -7);
  beam.rotation.z = 0.16;
  scene.add(beam);

  const beam2 = new Mesh(beamGeometry, beamMaterial);
  beam2.position.set(4.2, 1.4, -11);
  beam2.rotation.z = -0.12;
  scene.add(beam2);

  /* ---------------- mouse parallax (±2 degrees) ---------------- */
  const MAX_TILT = (2 * Math.PI) / 180;
  let targetX = 0;
  let targetY = 0;
  const onPointerMove = (e) => {
    targetX = (e.clientY / window.innerHeight - 0.5) * 2 * MAX_TILT;
    targetY = (e.clientX / window.innerWidth - 0.5) * 2 * MAX_TILT;
  };
  window.addEventListener('pointermove', onPointerMove, { passive: true });

  /* ---------------- visibility management ---------------- */
  let running = false;
  let rafId = 0;
  const clock = new Clock();

  const content = document.getElementById('main');
  const io = new IntersectionObserver(
    (entries) => {
      const visible = entries.some((en) => en.isIntersecting);
      if (visible && !document.hidden) start();
      else stop();
    },
    { threshold: 0 },
  );
  if (content) io.observe(content);

  const onVisibility = () => (document.hidden ? stop() : start());
  document.addEventListener('visibilitychange', onVisibility);

  function start() {
    if (running) return;
    running = true;
    clock.start();
    const loop = () => {
      if (!running) return;
      rafId = requestAnimationFrame(loop);
      const t = clock.getElapsedTime();
      beamUniforms.uTime.value = t;
      // gentle drift + bob
      points.rotation.y = t * 0.012;
      points.position.y = Math.sin(t * 0.18) * 0.35;
      // eased parallax
      camera.rotation.x += (targetX - camera.rotation.x) * 0.03;
      camera.rotation.y += (targetY - camera.rotation.y) * 0.03;
      renderer.render(scene, camera);
    };
    rafId = requestAnimationFrame(loop);
  }
  function stop() {
    running = false;
    cancelAnimationFrame(rafId);
  }

  /* ---------------- resize ---------------- */
  const onResize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(w, h, false);
  };
  window.addEventListener('resize', onResize);

  start();

  /* ---------------- teardown: dispose everything ---------------- */
  return function teardown() {
    stop();
    io.disconnect();
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('resize', onResize);
    window.removeEventListener('pointermove', onPointerMove);
    scene.remove(points, beam, beam2);
    geometry.dispose();
    material.dispose();
    beamGeometry.dispose();
    beamMaterial.dispose();
    sprite.dispose();
    renderer.dispose();
  };
}
