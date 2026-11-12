# Kivo white-model video skill

An agent skill that turns a shot prompt into a local white-model (clay / greybox) previs: an editable Three.js scene, a reviewable preview, and an MP4 you can inspect before any optional Kivo upload.

Homepage: [kivst.com](https://kivst.com). Independent community packaging, not official documentation or a quality guarantee.

## Install

Copy the folder that contains `SKILL.md` (this package) into your agent's skills directory, keeping the folder name `kivo-white-model-video`. Restart the agent if it does not pick up the skill right away.

### Codex

Codex loads local skills from these locations, as documented in [Build skills](https://developers.openai.com/codex/skills/):

- **User (all your projects):** `$HOME/.agents/skills/kivo-white-model-video/`
- **Project (this repository):** `.agents/skills/kivo-white-model-video/` at the repo root, or in the folder from which you launch Codex

```sh
mkdir -p ~/.agents/skills
cp -R kivo-white-model-video-skill ~/.agents/skills/kivo-white-model-video
```

In Codex CLI or the IDE extension you can mention the skill with `$` or open `/skills`, or just describe the shot and let Codex match the skill `description`.

### Claude Code

Claude Code loads skills from the paths in [Extend Claude with skills](https://code.claude.com/docs/en/skills):

- **Personal (all your projects on this machine):** `~/.claude/skills/kivo-white-model-video/`
- **Project (this repository):** `.claude/skills/kivo-white-model-video/`

```sh
mkdir -p ~/.claude/skills
cp -R kivo-white-model-video-skill ~/.claude/skills/kivo-white-model-video
```

Ask Claude to use the skill, or invoke it with `/kivo-white-model-video`.

### Cursor

[Cursor's Agent Skills docs](https://cursor.com/docs/skills) load project skills from `.agents/skills/` or `.cursor/skills/`, and user skills from `~/.agents/skills/` or `~/.cursor/skills/`. You can also type `/` in Agent chat and select the skill by name.

Other hosts that implement the Agent Skills `SKILL.md` layout can mount this same folder; follow that host's own skill documentation.

## Prerequisites

The agent needs these on the machine where it will preview and render (usually your local machine):

- Node.js 22 or later
- Chrome or Chromium with WebGL
- FFmpeg and FFprobe on `PATH`, including the `image2pipe` demuxer and `libx264` encoder

Preview and export will not work in a host that cannot run those tools where the shot files live. In that case, copy the shot folder to a machine that can, or use a local runner.

## Optional: Kivo MCP

Local previs does not need a [Kivo Studio](https://kivst.com) account. Connect Kivo MCP only if you want the agent to upload an approved MP4 to a project library or start Seedance generation. Setup is in the [Kivo connection guide](https://kivst.com/en/mcp). This package does not include API keys or credentials. Upload and paid generation need your authorization for the project, confirmation of rights to the file, and — for any spend — approval from the project payer.

## How to use

Install the skill, then talk to the agent in plain language. You can name the skill, or just ask for a previs / white-model / greybox shot.

**You type:**

> Use the kivo-white-model-video skill: a detective walks down a rainy alley at night, stops under a streetlight, and turns as the camera orbits around him.

**The agent should:**

1. Write a short beat table (time, action, camera).
2. Copy the starter into a writable shot folder, build the scene, and keep the motion seekable.
3. Start a local HyperFrames preview and give you the loopback URL plus the beat times to review.
4. If you asked for a video or an end-to-end previs, render an MP4, inspect it, and return the file path, duration, size, and a checksum.
5. Stop after the local preview/MP4 unless you also authorized a Kivo upload or a paid generation.

You can then ask for revisions (“make the orbit wider”, “hold the hug longer”) on the same shot folder.

### Example prompts

- `Use the kivo-white-model-video skill: a detective walks down a rainy alley at night, stops under a streetlight, and turns as the camera orbits around him.`
- `White-model previs: two people meet in a park; one runs toward the other, they hug, and the camera cranes up and pulls back. Render the MP4.`
- `Greybox blocking for Kivo: a woman sits at a desk in a dim office, stands up, walks to the window, and the camera tracks alongside her then slowly pushes in on her silhouette.`

## Tips

- Give one continuous shot, with a clear action and a named camera move (track, orbit, crane, push-in). The first pass is 1280×720, 24 fps, about 5–8 seconds unless you ask otherwise.
- Review the preview or the MP4 at the beat times the agent lists. If a named action or camera move is not readable, ask for a revision of that same shot.
- Keep the shot folder; it is the source for later changes.
- Do not ask the agent to upload or generate in Kivo until you are ready to authorize that step. A previs approval is not a spending approval.
- If the preview is a blank or static canvas, the usual causes are missing WebGL, missing `vendor/` files after install (`npm run prepare` in the shot folder), or FFmpeg/Chrome not on `PATH`. See [local preview and export](references/local-preview.md).

## What's inside

```text
kivo-white-model-video-skill/
├── SKILL.md              # instructions the agent follows
├── README.md
├── LICENSE
├── references/           # local preview notes and Kivo MCP handoff
├── scripts/              # inspect an MP4; optional authorized S3 upload
└── assets/starter/       # Three.js starter the agent copies for each shot
```

The starter includes a sample “walk to the door” composition and helper modules the agent imports for camera moves, figures, and set dressing. `node_modules/`, generated `vendor/` files, local renders, and any signed upload JSON are not part of the package.

Related: [kivo-studio-production-skill](https://github.com/miraga-kivo/kivo-studio-production-skill).

## License

**MIT is proposed** in [LICENSE](LICENSE) for this repository's own files, pending owner confirmation before publication. Third-party packages installed by the starter (`gsap`, `hyperframes`, `three`, and their dependencies) keep their own licenses.
