---
name: kivo-white-model-video
description: Use when the user asks for a previs, white-model, clay, or greybox shot; camera blocking, staging, or motion paths from a text prompt; or a local reference video for Kivo Studio. Builds an editable Three.js scene, a reviewable preview, and an MP4; uploads or starts Seedance generation only with authorization.
---

# Kivo white-model video

Turn a shot brief into an editable Three.js scene and a reviewable local preview. Use the accepted animation as a video reference in Kivo Studio. Three.js defines the scene and motion. HyperFrames supplies the same seekable timeline for browser review and MP4 export.

## 1. First pass from one text prompt

- Defaults for a first pass: one continuous shot, 1280×720, 24 fps, 5–8 seconds, even pixel sizes, metres, Y-up. Prefer clear silhouettes, distinct grayscale values, contact shadows, and landmarks that explain movement.
- Write a beat table before modelling: each row is `time (s) | action | camera`. Cover the start hold, every named action, and the end. If you change `data-duration` in `index.html`, adjust the beats to match.
- Copy the whole [assets/starter](assets/starter/) folder, including `camera-rigs.mjs`, `mannequin.mjs`, `set-dressing.mjs` and the lockfile, into a writable shot directory. Follow [local preview and export](references/local-preview.md). Replace the default door geometry, motion and camera unless the prompt *is* that shot. Edit `scene.mjs` and `index.html`. Keep every pose and camera state seekable from the requested timestamp — no wall-clock or frame-accumulated motion. Keep the beat table, scene source and exports together.
- Import the starter helpers instead of inventing one-off math. Use a rig or local GLB only when the action needs it, and load it before the first seek.
- After a first render, self-QC the named beats (section 3). If the user asked for a video, render, or end-to-end previs — not only a live preview — export that first pass after self-QC even when there is no separate approval beat. Still start HyperFrames Studio and report its loopback URL with the beat times.

## 2. Camera, figures and set

All helpers are seekable and import from the shot folder (after `npm ci`, they resolve `./vendor/three.module.js`).

**Camera — `camera-rigs.mjs`.** Drive the camera from `renderAt(t)` with `smooth` / `lerp`, then `applyCamera(camera, position, look, { fov })`, which looks at the chest and pushes the camera back if the head would clip. Plan distance with `minDistanceForHeadroom({ fov, lookY, headY })` and never shrink below it.

- Follow/track: `followPosition(subject, { back, right, height, headingY })`. Use the subject's current facing as `headingY` so the camera travels with them; keep `height` slightly above chest height.
- True orbit: pick a constant `radius >= minDistanceForHeadroom`, a constant `height`, and `orbitPosition(center, { radius, height, azimuth })`. Sweep azimuth with `revealAzimuth(start, { sweep: 2.2–2.5 })` (about 125–145°). The sweep must not match the character's turn, or the camera stays on their back — end on a profile or front with headroom. Start azimuth is `azimuthFrom(center, fromPosition)`.
- Push-in / dolly: `dolly(fromPos, toPos, fromLook, toLook, u)`.
- Crane up and pull back: `cranePullBack(startPos, startLook, { up, back, u })`. The end frame must be clearly higher and further than the start of the move.
- Blend segments with `blendCamera(a, b, smooth(t, t0, t1))`. Do not lerp an orbit into a shorter radius.

**Figures — `mannequin.mjs`.** `createMannequin(scene, { clay, joints, coat, hat, bun })` builds a clay figure facing +Z, with a small nose on +Z so a front, profile and back can be told apart. Give additional characters a different grey (`palette.clay` vs `palette.clayB`). Animate with `gaitSwing(t, { start, stop, cadence })` — walk ≈ 1.35, run ≈ 1.85 — and `poseMannequin(person, { x, y, z, facingY, swing, run, sit, reach, reachSide, leanZ })`. Turn with `turnFacing(fromY, toY, t, start, end)`. For a meeting hug, `poseHug(a, b, u, { aFrom, aTo, bFrom, bTo, aFacing, bFacing })` closes the gap and wraps both arms. Use `sit` 1→0 for sit-to-stand, `reach` for a window or prop, `hat`/`coat`/`bun` only when they help the silhouette.

**Set — `set-dressing.mjs`.** `matte(color)` and `palette` are the shared greys. Day: `addDayLight(scene)`. Night: `addNightLight(scene, { practical })` — mid-dark background (`palette.nightBg`), enough fill that silhouettes still read; add a practical only as a key, not the only light. Recipes: `addAlley(scene)` (walls, landmarks, streetlight and ground pool), `addStreetlight`, `addPark(scene)` (path, trees, bench — keep the action path clear at the opening frame), `addOffice(scene, { dim: true })` (desk, chair, bright window pane for a silhouette), `addDoorRoom(scene)` (the starter room). Rain: `const rain = createRain(scene, opts); rain.update(t)` in `renderAt`.

## 3. Preview, self-QC and export

```sh
npm ci
npm run lint
npm run preview -- --background --no-open
```

Give the user the printed Studio URL and the beat times. Stop with `npm run preview -- --stop`. If vendor files are missing, `npm run prepare`. See [local preview and export](references/local-preview.md) for FFmpeg, Chrome and doctor notes.

**Self-QC (fail and revise the scene if any fire).** Render or screenshot the first pass, then extract a frame at every named beat. Fail when:

- A named action or camera move is not readable in its frame.
- An orbit does not reveal a new side of the subject (back stays back), or the head is clipped, or radius shrinks through the move.
- A crane/pull-back does not end clearly higher and further; a track does not travel with the subject; a push-in does not get closer.
- A subject is fully hidden by set dressing at the start, or night lighting is so dark the silhouette cannot be read.
- Heads are cut off, motion pops, or state depends on anything other than the requested timestamp.

Revise the same shot folder and re-check the same beats. Keep intermediate renders local.

```sh
mkdir -p renders
npm run render -- --workers 1 --no-experimental-fast-capture -o renders/shot-r01.mp4
node "$SKILL_DIR/scripts/inspect-mp4.mjs" renders/shot-r01.mp4
```

Set `SKILL_DIR` to the installed skill directory. Record filename, duration, dimensions, frame rate, byte size and SHA-256. If later feedback arrives, start from that accepted render path.

## 4. Upload and optionally generate

Identify the authorized Kivo project and verify access and the live model catalog. Follow [Kivo MCP handoff](references/kivo-mcp.md). Upload only when the user has authorized that transfer and confirmed rights to the file. Stop after reporting the library asset if they asked only for a reference. For Seedance generation, give the white-model video the camera, blocking and timing role; put character, material and atmosphere in separate image references or prose. Quote the exact Draft and get spending authorization from the project payer before any paid job.

The package works in agents that can load skill files, run Node/Chromium/FFmpeg where the shot files live, and call an authorized Kivo MCP connector. Read the host notes in [Kivo MCP handoff](references/kivo-mcp.md) when setting up a new client.
