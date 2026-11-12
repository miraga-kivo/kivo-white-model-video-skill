import * as THREE from './vendor/three.module.js';
import { smooth } from './camera-rigs.mjs';

function mesh(parent, geometry, material, x, y, z) {
  const object = new THREE.Mesh(geometry, material);
  object.position.set(x, y, z);
  object.castShadow = true;
  object.receiveShadow = true;
  parent.add(object);
  return object;
}

/**
 * Clay figure in metres, Y-up, default facing +Z (rotation.y = 0).
 * Options: coat, hat, bun — use only when they help the silhouette read.
 */
export function createMannequin(scene, {
  clay, joints, coat = false, hat = false, bun = false,
} = {}) {
  const root = new THREE.Group();
  scene.add(root);
  mesh(root, new THREE.CapsuleGeometry(0.21, 0.32, 6, 12), clay, 0, 1.15, 0);
  if (coat) mesh(root, new THREE.BoxGeometry(0.5, 0.92, 0.3), coat, 0, 1.08, 0.02);
  mesh(root, new THREE.SphereGeometry(0.15, 20, 14), clay, 0, 1.68, 0);
  // Small nose on +Z so front, profile and back stay distinguishable in QC frames.
  mesh(root, new THREE.SphereGeometry(0.045, 10, 8), clay, 0, 1.66, 0.14);
  mesh(root, new THREE.CylinderGeometry(0.07, 0.07, 0.14, 12), joints, 0, 1.48, 0);
  if (hat) {
    mesh(root, new THREE.CylinderGeometry(0.16, 0.16, 0.16, 16), hat, 0, 1.86, 0);
    mesh(root, new THREE.CylinderGeometry(0.24, 0.24, 0.035, 20), hat, 0, 1.79, 0);
  }
  if (bun) mesh(root, new THREE.SphereGeometry(0.08, 12, 10), clay, 0, 1.78, -0.12);

  function limb(x, y, length, radius) {
    const pivot = new THREE.Group();
    pivot.position.set(x, y, 0);
    root.add(pivot);
    mesh(pivot, new THREE.CapsuleGeometry(radius, length - 2 * radius, 5, 10),
      clay, 0, -length / 2, 0);
    return pivot;
  }

  return {
    root,
    leftLeg: limb(-0.12, 0.88, 0.88, 0.081),
    rightLeg: limb(0.12, 0.88, 0.88, 0.081),
    leftArm: limb(-0.27, 1.37, 0.56, 0.065),
    rightArm: limb(0.27, 1.37, 0.56, 0.065),
  };
}

/** Seekable walk (cadence ~1.35) or run (~1.85) swing in -1..1, eased in and out. */
export function gaitSwing(t, { start, stop, cadence = 1.35, ease = 0.22 } = {}) {
  const envelope = smooth(t, start, start + ease) * (1 - smooth(t, stop - ease, stop));
  return Math.sin((t - start) * 2 * Math.PI * cadence) * envelope;
}

/**
 * Place a figure. `swing` is from gaitSwing; use runAmp 0.42 for a run, else 0.34.
 * `sit` 0..1 drops the hips and folds the legs (chair seat ~0.45 m).
 * `reach` 0..1 lifts one or both arms (`reachSide`: 'left'|'right'|'both').
 */
export function poseMannequin(person, {
  x = 0, y = 0, z = 0, facingY = 0, swing = 0, run = false,
  sit = 0, leanZ = 0, reach = 0, reachSide = 'both',
} = {}) {
  const amp = run ? 0.42 : 0.34;
  const armAmp = run ? 0.32 : 0.25;
  person.root.position.set(x, y - 0.4 * sit + Math.abs(swing) * 0.025, z);
  person.root.rotation.set(0, facingY, leanZ);
  person.leftLeg.rotation.set(lerpAngle(-1.15 * sit, swing * amp, 1 - sit), 0, 0);
  person.rightLeg.rotation.set(lerpAngle(-1.15 * sit, -swing * amp, 1 - sit), 0, 0);
  const lift = -1.05 * reach;
  const leftReach = reachSide === 'right' ? 0 : lift;
  const rightReach = reachSide === 'left' ? 0 : lift;
  person.leftArm.rotation.set((-swing * armAmp) * (1 - sit - reach) + leftReach - 0.55 * sit, 0, 0);
  person.rightArm.rotation.set((swing * armAmp) * (1 - sit - reach) + rightReach - 0.55 * sit, 0, 0);
}

function lerpAngle(a, b, u) {
  return a + (b - a) * u;
}

/** Face each other on an axis, close the gap, wrap both arms. u is 0..1. */
export function poseHug(a, b, u, {
  aFrom, aTo, bFrom, bTo, aFacing = Math.PI / 2, bFacing = -Math.PI / 2,
} = {}) {
  const ua = new THREE.Vector3().lerpVectors(aFrom, aTo, u);
  const ub = new THREE.Vector3().lerpVectors(bFrom, bTo, u);
  poseMannequin(a, { x: ua.x, y: ua.y, z: ua.z, facingY: aFacing, leanZ: -0.06 * u });
  poseMannequin(b, { x: ub.x, y: ub.y, z: ub.z, facingY: bFacing, leanZ: 0.06 * u });
  const wrap = u * 1.05;
  a.leftArm.rotation.set(-1.15 * u, 0, wrap * 0.45);
  a.rightArm.rotation.set(-1.15 * u, 0, -wrap * 0.45);
  b.leftArm.rotation.set(-1.05 * u, 0, wrap * 0.4);
  b.rightArm.rotation.set(-1.05 * u, 0, -wrap * 0.4);
}

export function turnFacing(fromY, toY, t, start, end) {
  return THREE.MathUtils.lerp(fromY, toY, smooth(t, start, end));
}
