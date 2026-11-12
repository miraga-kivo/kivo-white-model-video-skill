import * as THREE from './vendor/three.module.js';

export const palette = {
  clay: 0xe2e2e2,
  clayB: 0xc4c4c4,
  joints: 0xbcbcbc,
  jointsB: 0xa8a8a8,
  floor: 0xa1a1a1,
  walls: 0xc7c7c7,
  trim: 0x747474,
  metal: 0x8a8a8a,
  grass: 0x8d8d8d,
  path: 0xb3b3b3,
  canopy: 0x7c7c7c,
  trunk: 0x6a6a6a,
  nightBg: 0x3a3a40,
  nightFloor: 0x55555c,
  nightWall: 0x63636a,
  dayBg: 0xc9c9c9,
};

export function matte(color, roughness = 0.9) {
  return new THREE.MeshStandardMaterial({ color, roughness });
}

export function mesh(parent, geometry, material, x, y, z) {
  const object = new THREE.Mesh(geometry, material);
  object.position.set(x, y, z);
  object.castShadow = true;
  object.receiveShadow = true;
  parent.add(object);
  return object;
}

export function box(parent, material, dimensions, position) {
  return mesh(parent, new THREE.BoxGeometry(...dimensions), material, ...position);
}

/** Daylight close to the starter: directional key + hemisphere, shadows on. */
export function addDayLight(scene, { background = palette.dayBg } = {}) {
  scene.background = new THREE.Color(background);
  const light = new THREE.DirectionalLight(0xffffff, 2.5);
  light.position.set(-3, 7, 5);
  light.castShadow = true;
  light.shadow.mapSize.set(1024, 1024);
  Object.assign(light.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10, far: 32 });
  light.shadow.normalBias = 0.025;
  scene.add(light, new THREE.HemisphereLight(0xffffff, 0x999999, 1.5));
  return light;
}

/**
 * Readable night: mid-dark background, enough fill to keep silhouettes,
 * plus an optional practical SpotLight (streetlamp, desk, window).
 */
export function addNightLight(scene, { background = palette.nightBg, practical } = {}) {
  scene.background = new THREE.Color(background);
  const hemi = new THREE.HemisphereLight(0x9a9aa4, 0x2a2a30, 0.7);
  const fill = new THREE.DirectionalLight(0xc4c4cc, 0.7);
  fill.position.set(-4, 8, 3);
  fill.castShadow = true;
  fill.shadow.mapSize.set(1024, 1024);
  Object.assign(fill.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10, far: 32 });
  fill.shadow.normalBias = 0.03;
  scene.add(hemi, fill);
  let lamp = null;
  if (practical) {
    lamp = new THREE.SpotLight(0xffffff, practical.intensity ?? 7, practical.distance ?? 14,
      practical.angle ?? 0.7, practical.penumbra ?? 0.45, 1.1);
    lamp.position.copy(practical.position);
    lamp.target.position.copy(practical.target ?? new THREE.Vector3(practical.position.x, 0, practical.position.z));
    lamp.castShadow = true;
    lamp.shadow.mapSize.set(1024, 1024);
    lamp.shadow.camera.near = 0.4;
    lamp.shadow.camera.far = practical.distance ?? 14;
    scene.add(lamp, lamp.target);
  }
  return { fill, hemi, lamp };
}

export function addStreetlight(scene, { x = 1.05, z = 0, lit = true } = {}) {
  const metal = matte(palette.metal);
  box(scene, metal, [0.12, 3.2, 0.12], [x, 1.6, z]);
  box(scene, metal, [1.05, 0.07, 0.07], [x - 0.5, 3.18, z]);
  const bulb = mesh(scene, new THREE.SphereGeometry(0.09, 16, 12),
    new THREE.MeshStandardMaterial({
      color: 0xf2f2f2, emissive: lit ? 0xf5f5f5 : 0x333333,
      emissiveIntensity: lit ? 1.4 : 0, roughness: 1,
    }), x - 0.93, 3.08, z);
  bulb.castShadow = false;
  const puddle = matte(0x6e6e74, 0.35);
  const disc = mesh(scene, new THREE.CircleGeometry(1.15, 24), puddle, x - 0.93, 0.005, z);
  disc.rotation.x = -Math.PI / 2;
  return {
    bulb,
    aim: new THREE.Vector3(x - 0.93, 3.15, z),
    pool: new THREE.Vector3(x - 0.93, 0, z),
  };
}

export function addAlley(scene, { lightAt = { x: 1.05, z: 0 } } = {}) {
  const floor = matte(palette.nightFloor);
  const walls = matte(palette.nightWall);
  const trim = matte(0x4a4a50);
  const metal = matte(palette.metal);
  box(scene, floor, [7.2, 0.16, 16], [0, -0.08, 1.2]);
  box(scene, walls, [0.22, 4.2, 16], [-3.2, 2.1, 1.2]);
  box(scene, walls, [0.22, 4.2, 16], [3.2, 2.1, 1.2]);
  box(scene, trim, [0.12, 2.2, 0.9], [-3.06, 1.15, 2.6]);
  box(scene, trim, [0.12, 2.2, 0.9], [3.06, 1.15, 1.4]);
  box(scene, walls, [0.7, 0.9, 1.5], [-2.7, 0.45, -2.1]);
  box(scene, metal, [1.1, 1.15, 0.7], [2.35, 0.58, 2.8]);
  box(scene, metal, [0.95, 0.85, 0.55], [2.4, 0.43, 3.45]);
  return addStreetlight(scene, { x: lightAt.x, z: lightAt.z, lit: true });
}

function tree(scene, trunkMat, canopyMat, x, z, height, spread) {
  mesh(scene, new THREE.CylinderGeometry(0.16, 0.22, height, 10), trunkMat, x, height / 2, z);
  mesh(scene, new THREE.SphereGeometry(spread, 14, 10), canopyMat, x, height + spread * 0.15, z);
}

export function addPark(scene) {
  const grass = matte(palette.grass);
  const path = matte(palette.path);
  const trunk = matte(palette.trunk);
  const canopy = matte(palette.canopy);
  const benchMat = matte(0x7a7a7a);
  box(scene, grass, [22, 0.16, 16], [0, -0.08, 0]);
  box(scene, path, [16, 0.04, 2.2], [0, 0.02, 0]);
  box(scene, benchMat, [1.5, 0.08, 0.42], [3.1, 0.46, -1.55]);
  box(scene, benchMat, [1.5, 0.38, 0.08], [3.1, 0.23, -1.72]);
  box(scene, benchMat, [0.1, 0.42, 0.42], [2.45, 0.21, -1.55]);
  box(scene, benchMat, [0.1, 0.42, 0.42], [3.75, 0.21, -1.55]);
  box(scene, canopy, [3.4, 0.55, 0.55], [-5.2, 0.28, 2.6]);
  box(scene, canopy, [2.2, 0.45, 0.5], [5.0, 0.23, 2.2]);
  tree(scene, trunk, canopy, -5.2, -3.1, 2.3, 1.15);
  tree(scene, trunk, canopy, -3.4, 3.4, 2.6, 1.35);
  tree(scene, trunk, canopy, 2.6, 3.6, 2.4, 1.2);
  tree(scene, trunk, canopy, 5.4, -2.8, 2.7, 1.4);
  tree(scene, trunk, canopy, 6.2, 2.4, 2.1, 1.05);
  tree(scene, trunk, canopy, -6.0, 1.6, 2.2, 1.1);
  // Keep the start of a typical left-to-right path clear of canopy.
}

/** Dim office: window on +Z wall, desk and chair facing it or along X. */
export function addOffice(scene, { dim = true } = {}) {
  const walls = matte(dim ? 0x5c5c62 : palette.walls);
  const floor = matte(dim ? 0x6a6a70 : palette.floor);
  const trim = matte(palette.trim);
  const desk = matte(0x8a8a8a);
  box(scene, floor, [8, 0.16, 7], [0, -0.08, 0]);
  box(scene, walls, [8, 3.2, 0.16], [0, 1.6, -3.4]);
  box(scene, walls, [0.16, 3.2, 7], [-3.95, 1.6, 0]);
  box(scene, walls, [0.16, 3.2, 7], [3.95, 1.6, 0]);
  // Window wall on +Z: opening with a bright pane for silhouettes.
  box(scene, walls, [2.3, 3.2, 0.16], [-2.85, 1.6, 3.4]);
  box(scene, walls, [2.3, 3.2, 0.16], [2.85, 1.6, 3.4]);
  box(scene, walls, [3.4, 0.7, 0.16], [0, 2.85, 3.4]);
  box(scene, walls, [3.4, 0.55, 0.16], [0, 0.28, 3.4]);
  box(scene, trim, [3.5, 2.05, 0.08], [0, 1.55, 3.38]);
  const pane = mesh(scene, new THREE.PlaneGeometry(3.2, 1.85),
    new THREE.MeshStandardMaterial({
      color: 0xd8d8dc, emissive: dim ? 0xcfcfd4 : 0x000000,
      emissiveIntensity: dim ? 0.7 : 0, roughness: 1, side: THREE.DoubleSide,
    }), 0, 1.55, 3.32);
  pane.castShadow = false;
  // Desk and chair face the +Z window, leaving a walk path around the desk.
  box(scene, desk, [1.6, 0.08, 0.75], [0, 0.74, 1.05]);
  box(scene, desk, [0.08, 0.7, 0.7], [-0.72, 0.35, 1.05]);
  box(scene, desk, [0.08, 0.7, 0.7], [0.72, 0.35, 1.05]);
  box(scene, trim, [0.5, 0.08, 0.46], [0, 0.44, 0.42]);
  box(scene, trim, [0.08, 0.44, 0.46], [-0.22, 0.22, 0.42]);
  box(scene, trim, [0.08, 0.44, 0.46], [0.22, 0.22, 0.42]);
  if (dim) {
    const windowKey = new THREE.DirectionalLight(0xe8e8ee, 1.15);
    windowKey.position.set(0, 2.4, 5.2);
    windowKey.target.position.set(0, 1.2, 1);
    scene.add(windowKey, windowKey.target);
  }
  return {
    window: new THREE.Vector3(0, 1.5, 3.3),
    desk: new THREE.Vector3(0, 0, 1.05),
    chair: new THREE.Vector3(0, 0, 0.42),
    pane,
  };
}

/** Default starter room: back and left walls, a closed door, a low block. */
export function addDoorRoom(scene) {
  const floor = matte(palette.floor);
  const walls = matte(palette.walls);
  const frame = matte(palette.trim);
  const door = matte(palette.metal);
  const clay = matte(palette.clay);
  box(scene, floor, [9, 0.16, 7], [0, -0.08, 0]);
  box(scene, walls, [9, 3.0, 0.18], [0, 1.5, -2]);
  box(scene, walls, [0.18, 3.0, 4.4], [-4.4, 1.5, 0.25]);
  box(scene, frame, [1.25, 2.28, 0.15], [1.65, 1.14, -1.83]);
  box(scene, door, [1.05, 2.12, 0.07], [1.65, 1.07, -1.71]);
  box(scene, clay, [0.14, 0.04, 0.12], [1.95, 1.0, -1.62]);
  box(scene, walls, [1.25, 0.55, 0.65], [-2.9, 0.275, -1.3]);
}

/** Seekable rain streaks. Call update(t) from renderAt. */
export function createRain(scene, {
  count = 70, xMin = -2.8, xMax = 2.8, zMin = -5.2, zMax = 6.0,
  yTop = 5.2, depth = 5.6, speed = 5.6,
} = {}) {
  const mat = matte(0xc5c5ca);
  const drops = [];
  for (let i = 0; i < count; i += 1) {
    const streak = mesh(scene, new THREE.CylinderGeometry(0.008, 0.008, 0.38, 4), mat, 0, 0, 0);
    streak.castShadow = false;
    const u = (i * 17 % 57) / 57;
    const v = (i * 13 % 91) / 91;
    drops.push({
      streak,
      x: xMin + u * (xMax - xMin),
      z: zMin + v * (zMax - zMin),
      phase: (i * 0.37) % depth,
      speed: speed + (i % 5) * 0.35,
    });
  }
  return {
    update(t) {
      for (const drop of drops) {
        const y = yTop - ((drop.phase + t * drop.speed) % depth);
        drop.streak.position.set(drop.x, y, drop.z);
      }
    },
  };
}
