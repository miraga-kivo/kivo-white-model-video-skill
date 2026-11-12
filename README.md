# Kivo white-model video skill

An agent skill for turning a shot brief into an editable Three.js white-model or clay previs (白模 / 灰模), reviewing it locally with [HyperFrames](https://github.com/heygen-com/hyperframes), and — when authorized — uploading the approved MP4 to a [Kivo Studio](https://kivst.com) project library for use as a Seedance 2.5 video reference.

Homepage: [kivst.com](https://kivst.com). Related guidance: [kivo-studio-production-skill](https://github.com/miraga-kivo/kivo-studio-production-skill). This is independent community packaging of the workflow, not official documentation or a quality guarantee.

## Package

```text
kivo-white-model-video-skill/
├── SKILL.md
├── README.md
├── LICENSE
├── .gitignore
├── references/
│   ├── local-preview.md
│   └── kivo-mcp.md
├── scripts/
│   ├── inspect-mp4.mjs
│   └── upload-s3.mjs
└── assets/starter/
    ├── index.html
    ├── scene.mjs
    ├── camera-rigs.mjs
    ├── mannequin.mjs
    ├── set-dressing.mjs
    ├── stage-dependencies.mjs
    ├── package.json
    ├── package-lock.json
    └── .gitignore
```

`node_modules/`, generated `vendor/` files, local renders, macOS metadata, and any signed upload JSON are not part of the package. The starter door shot remains the default composition; new shots should import the helper modules and replace that door blocking.

## Requirements

- Node.js 22 or later
- A Chromium-based browser with WebGL
- FFmpeg and FFprobe on `PATH`, with the `image2pipe` demuxer and `libx264` encoder
- For the Kivo handoff: an authorized [Kivo Studio MCP](https://kivst.com/en/mcp) connection

Copy [assets/starter](assets/starter/) into a writable shot directory and follow [local preview and export](references/local-preview.md). In that copy:

```sh
npm ci
npm run lint
npm run preview -- --background --no-open
```

Open the loopback URL printed by HyperFrames Studio. The sample is a 1280×720, 24 fps, 5-second shot of a mannequin walking toward a closed door as the camera pushes in. Edit `scene.mjs` and `index.html`, then reload. Stop the preview with `npm run preview -- --stop`.

When a revision is accepted:

```sh
mkdir -p renders
npm run render -- --workers 1 --no-experimental-fast-capture -o renders/door-r01.mp4
node "$SKILL_DIR/scripts/inspect-mp4.mjs" renders/door-r01.mp4
```

Set `SKILL_DIR` to this skill directory. Inspect playback and self-QC frames at the named beats in [SKILL.md](SKILL.md).

## Upload to Kivo (optional, authorized only)

Follow [Kivo MCP handoff](references/kivo-mcp.md). Do not upload or start paid generation unless the user has authorized that project, confirmed rights to the file, and approved any spend. `scripts/upload-s3.mjs` posts an already-reviewed MP4 to the signed S3 form returned by `kivo_assets_prepare`. It contains no credentials. Pass the returned `upload` object on stdin, then delete that temporary file. Never commit `private-upload.json` or other signed fields.

```sh
node "$SKILL_DIR/scripts/upload-s3.mjs" renders/door-r01.mp4 "$APPROVED_SHA256" < private-upload.json
```

Discover live tool names and schemas on the connected host; prefixes can differ. Refresh catalog limits at runtime.

## License

The original skill package did not include a license file. **MIT is proposed** in [LICENSE](LICENSE) for this repository's own files, pending owner confirmation before publication. Third-party packages installed by the starter (`gsap`, `hyperframes`, `three`, and their dependencies) keep their own licenses.

## Boundaries

- Local preview and MP4 export need Node, a WebGL-capable browser, and FFmpeg on the machine that holds the shot files. A host without those tools should render in a local runner and move the reviewed file.
- Kivo upload and Seedance generation require an authorized connector, an authorized project, and — for paid jobs — explicit spending approval from the project payer. Creative approval of a previs is not spending approval.
- Catalog prices, reference limits, tool schemas and model IDs change. Check them live. Matching motion, timing and framing are review criteria, not a guarantee of generated output.
