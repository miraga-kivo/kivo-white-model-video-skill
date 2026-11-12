import * as THREE from './vendor/three.module.js';

export const CHEST_Y = 1.15;
export const HEAD_Y = 1.83;

export function smooth(t, a, b) {
  return THREE.MathUtils.smoothstep(t, a, b);
}

export function lerp(a, b, u) {
  if (a instanceof THREE.Vector3) return new THREE.Vector3().lerpVectors(a, b, u);
  return THREE.MathUtils.lerp(a, b, u);
}

/** Minimum camera distance so the head stays in frame with margin (Three.js fov is vertical). */
export function minDistanceForHeadroom({
  fov = 37, lookY = CHEST_Y, headY = HEAD_Y, margin = 0.35,
} = {}) {
  const rise = Math.max(0.05, (headY - lookY) + margin);
  return rise / Math.tan(THREE.MathUtils.degToRad(fov) / 2);
}

/** Offset from a subject. headingY is the facing used by the mannequin (0 = +Z). */
export function followOffset({ back = 3.2, right = 1.2, height = 1.62, headingY = 0 } = {}) {
  const forward = new THREE.Vector3(Math.sin(headingY), 0, Math.cos(headingY));
  const rightV = new THREE.Vector3(Math.cos(headingY), 0, -Math.sin(headingY));
  return new THREE.Vector3().addScaledVector(forward, -back).addScaledVector(rightV, right).setY(height);
}

export function followPosition(subject, opts) {
  const pos = subject instanceof THREE.Vector3 ? subject : new THREE.Vector3(...subject);
  const off = followOffset(opts);
  return new THREE.Vector3(pos.x + off.x, off.y, pos.z + off.z);
}

/** Horizontal orbit of constant radius. azimuth 0 is on +Z, increasing toward +X. */
export function orbitPosition(center, { radius, height, azimuth }) {
  const c = center instanceof THREE.Vector3 ? center : new THREE.Vector3(...center);
  return new THREE.Vector3(
    c.x + Math.sin(azimuth) * radius,
    height,
    c.z + Math.cos(azimuth) * radius,
  );
}

export function azimuthFrom(center, from) {
  const c = center instanceof THREE.Vector3 ? center : new THREE.Vector3(...center);
  const f = from instanceof THREE.Vector3 ? from : new THREE.Vector3(...from);
  return Math.atan2(f.x - c.x, f.z - c.z);
}

/**
 * End azimuth that reveals a new side of the subject.
 * Do not set the sweep equal to the character's own turn or the camera stays behind them.
 */
export function revealAzimuth(startAzimuth, { sweep = 2.3, direction = -1 } = {}) {
  return startAzimuth + Math.sign(direction || -1) * Math.abs(sweep);
}

export function dolly(fromPos, toPos, fromLook, toLook, u) {
  return { position: lerp(fromPos, toPos, u), look: lerp(fromLook, toLook, u) };
}

/** Raise the camera and recede from the look target. `up` and `back` are added in metres. */
export function cranePullBack(startPos, startLook, { up = 3.4, back = 5.2, u }) {
  const look = startLook.clone();
  const away = new THREE.Vector3(startPos.x - startLook.x, 0, startPos.z - startLook.z);
  if (away.lengthSq() < 1e-6) away.set(0, 0, 1);
  away.normalize();
  const startDist = Math.hypot(startPos.x - startLook.x, startPos.z - startLook.z);
  const position = new THREE.Vector3(
    startLook.x + away.x * (startDist + back * u),
    lerp(startPos.y, startPos.y + up, u),
    startLook.z + away.z * (startDist + back * u),
  );
  return { position, look };
}

export function blendCamera(a, b, u) {
  return { position: lerp(a.position, b.position, u), look: lerp(a.look, b.look, u) };
}

/**
 * Apply position and lookAt. If the camera is closer than the headroom distance,
 * it is pushed back on the horizontal view line (height is unchanged).
 */
export function applyCamera(camera, position, lookAt, {
  fov, headY = HEAD_Y, margin = 0.35,
} = {}) {
  const pos = position.clone();
  const look = lookAt instanceof THREE.Vector3 ? lookAt : new THREE.Vector3(...lookAt);
  const minD = minDistanceForHeadroom({ fov: fov ?? camera.fov, lookY: look.y, headY, margin });
  const dx = pos.x - look.x;
  const dz = pos.z - look.z;
  const horiz = Math.hypot(dx, dz);
  if (horiz < minD) {
    const scale = minD / Math.max(horiz, 1e-4);
    pos.x = look.x + dx * scale;
    pos.z = look.z + dz * scale;
  }
  camera.position.copy(pos);
  camera.lookAt(look);
}
