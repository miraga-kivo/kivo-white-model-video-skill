# Local preview and export

Copy the entire `assets/starter` directory, including its lockfile and the helper modules (`camera-rigs.mjs`, `mannequin.mjs`, `set-dressing.mjs`), into a new shot folder. Run the following in the copy. Node 22+, Chromium with WebGL, and a full FFmpeg/FFprobe build on PATH are required.

```sh
npm ci
npm run lint
npm run preview -- --background --no-open
```

Open the loopback URL printed by HyperFrames Studio. Play or scrub the shot. The sample shows a mannequin walking toward a closed door while the camera pushes in. Motion starts around 0.35 s, ends around 3.85 s, then the actor turns toward the door. Edit the `shot` settings or geometry in `scene.mjs` (import the helpers as [SKILL.md](../SKILL.md) describes) and reload the preview when needed. Use `npm run preview -- --stop` to stop this project's background preview.

Use `npx --no-install hyperframes doctor` to diagnose local dependencies. If the render cannot find FFmpeg or FFprobe, point `HYPERFRAMES_FFMPEG_PATH` and `HYPERFRAMES_FFPROBE_PATH` at the actual binaries. Encoding screenshots requires FFmpeg with the `image2pipe` demuxer and the `libx264` encoder. If the bundled browser cannot be found, run `npx --no-install hyperframes browser ensure` or set `HYPERFRAMES_BROWSER_PATH` to your local Chrome executable. On macOS a typical path is `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`. HyperFrames can use installed Chrome for screenshot capture. A blank or static canvas warrants checking Chromium WebGL, module loading and the paused timeline. Use `npm run prepare` if the local vendor files are missing after dependencies were installed with lifecycle scripts disabled.

## Scene conventions

- The starter uses metres, Y-up and a continuous perspective camera. The HTML composition ID maps to the paused GSAP timeline. Its linear clock calls `renderAt(seconds)` in both Studio and the headless renderer. Keep pose, prop and camera state seekable in any order. For rigs, sample the animation at the requested time. Avoid wall-clock motion or state accumulated frame by frame.
- Change `data-width`, `data-height`, `data-duration` and `data-fps` on the root to match the target shot. The canvas and camera read those values. If you change duration, adjust motion beats too. Use even pixel dimensions for H.264 and reframe the shot for vertical or square output. For multiple cuts, review each shot separately and combine them only when the intended reference depends on the cut timing.
- Use the simplest visible geometry that conveys the action. Keep pose, camera axes and light direction deliberate. For reference exports, omit visible editing UI and debug helpers.

## Export the approved revision

```sh
mkdir -p renders
npm run render -- --workers 1 --no-experimental-fast-capture -o renders/door-r01.mp4
```

The starter defaults to 1280×720, 24 fps and 5 seconds. Use a revisioned filename for each accepted export. Open the MP4 and run the beat-based self-QC in [SKILL.md](../SKILL.md) at the same beats used during review. The screenshot capture flag is useful with a WebGL canvas. Use more workers only if the renderer and available memory support it.

From the shot directory, set `SKILL_DIR` to the skill directory and run `node "$SKILL_DIR/scripts/inspect-mp4.mjs" renders/door-r01.mp4` to read the dimensions, duration, frame rate, actual byte size and SHA-256. Check Kivo's live video reference limits before transferring the file. Keep the local MP4 and source even if upload or generation will happen in another host.

[HyperFrames source and CLI](https://github.com/heygen-com/hyperframes) · [Seedance 2.5 clay-model prompt guide](https://docs.byteplus.com/en/docs/modelark/seedance-2-5-prompt-guide?redirect=1)
