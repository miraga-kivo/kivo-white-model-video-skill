import { copyFile, mkdir } from 'node:fs/promises';

const build = new URL('./node_modules/three/build/', import.meta.url);
const vendor = new URL('./vendor/', import.meta.url);
await mkdir(vendor, { recursive: true });
for (const file of ['three.module.js', 'three.core.js']) {
  await copyFile(new URL(file, build), new URL(file, vendor));
}
await copyFile(new URL('./node_modules/gsap/dist/gsap.min.js', import.meta.url),
  new URL('gsap.min.js', vendor));
