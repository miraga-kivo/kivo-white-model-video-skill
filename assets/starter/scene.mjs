import * as THREE from './vendor/three.module.js';
import { smooth, dolly, applyCamera } from './camera-rigs.mjs';
import { createMannequin, gaitSwing, poseMannequin, turnFacing } from './mannequin.mjs';
import { palette, matte, addDayLight, addDoorRoom } from './set-dressing.mjs';

// Default starter shot: a mannequin walks to a closed door, camera pushes in.
// Shot coordinates are in metres. Y is up. The actor walks along +X.
const shot = {
  actor: { from: -2.25, to: 0.75, z: 0.7, start: 0.35, stop: 3.85 },
  camera: {
    from: new THREE.Vector3(6.3, 3.7, 8.6),
    to: new THREE.Vector3(4.0, 2.65, 6.4),
    lookFrom: new THREE.Vector3(-0.45, 1.0, 0.2),
    lookTo: new THREE.Vector3(0.6, 1.05, 0.2),
    fov: 37,
  },
};

const root = document.querySelector('#white-model');
const width = Number(root.dataset.width);
const height = Number(root.dataset.height);
const duration = Number(root.dataset.duration);
root.style.width = width + "px";
root.style.height = height + "px";
const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#stage'),
  antialias: true,
});
renderer.setSize(width, height);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;

const scene = new THREE.Scene();
addDayLight(scene);
addDoorRoom(scene);
const camera = new THREE.PerspectiveCamera(shot.camera.fov, width / height, 0.1, 50);

const actor = createMannequin(scene, {
  clay: matte(palette.clay),
  joints: matte(palette.joints),
});

function renderAt(seconds) {
  const t = THREE.MathUtils.clamp(seconds, 0, duration);
  const { start, stop, from, to, z } = shot.actor;
  const walk = smooth(t, start, stop);
  poseMannequin(actor, {
    x: THREE.MathUtils.lerp(from, to, walk),
    z,
    facingY: turnFacing(Math.PI / 2, 2.78, t, stop - 0.1, stop + 0.4),
    swing: gaitSwing(t, { start, stop, cadence: 1.4 }),
  });
  const move = smooth(t, 0, duration);
  const cam = dolly(shot.camera.from, shot.camera.to, shot.camera.lookFrom, shot.camera.lookTo, move);
  applyCamera(camera, cam.position, cam.look, { fov: shot.camera.fov });
  renderer.render(scene, camera);
}

const clock = { seconds: 0 };
const timeline = window.gsap.timeline({ paused: true });
timeline.to(clock, {
  seconds: duration,
  duration,
  ease: 'none',
  onUpdate: () => renderAt(clock.seconds),
}, 0);
window.__timelines[root.dataset.compositionId] = timeline;
renderAt(0);
