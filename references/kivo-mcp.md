# Kivo Studio MCP handoff

Use the authorized Kivo connection at `https://kivst.com/mcp` over Streamable HTTP. The [Kivo connection guide](https://kivst.com/en/mcp) covers client setup and browser OAuth. Reuse an existing connection. Discover the exposed tool names and schemas since host prefixes can differ. Upload uses read and write access. Generation additionally needs the capability to quote and create jobs.

## Host setup

- Codex can discover this package from its skills directory. Claude Code can load the whole folder as a project or personal skill. For both clients, follow the Kivo connection guide for the remote server.
- For Grok Bot and DeepSeek Harness, import or mount the whole folder through the host's skill mechanism, or provide the folder and ask the agent to read its entrypoint. Configure Kivo as an OAuth-capable remote MCP server in the host. Use the host's local execution capability for preview and upload. If a host cannot read the folder or complete OAuth, render in a local runner and move the reviewed file to a client that can finish the handoff, or use Kivo Studio's web uploader.
- Preserve the relative paths from `SKILL.md`. Verify the connection with `kivo_catalog_get` and authorized project reads before attempting a write.

[Claude Code Skills](https://code.claude.com/docs/en/skills) · [DeepSeek Harness Skills](https://deepseek-harness.github.io/deepseek-harness/en/reference/subsystems/skills) · [DeepSeek Harness MCP](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/mcp.md)

## Publish the approved MP4 to the library

1. Confirm the exact project, clip revision and right to upload. Use `kivo_projects_get` for project permissions and payer information. Use `kivo_catalog_get` to check Seedance 2.5's current video reference limits, including duration, total video duration, size and aspect ratio.
2. Inspect the MP4 with `scripts/inspect-mp4.mjs`. Call `kivo_assets_prepare` with the chosen `projectId`, a stable revisioned asset `name`, `contentType: "video/mp4"`, the exact `byteSize`, `category: "scene"` and authorized `rightsConfirmed: true`. Set `noRealPeople: true` only for a wholly synthetic scene with no real-person likeness.
3. Submit the actual file bytes with the returned `upload.url` and every `upload.fields` value. The S3 request is multipart POST with the file field last. If using the included uploader, extract only the returned `upload` object into a temporary file readable only by you. Pass it via stdin and remove it after use. The uploader checks the reviewed SHA-256 and does not print signed fields.
4. On a successful POST, call `kivo_assets_complete` with `assetId` set to the `id` returned by prepare. Poll `kivo_assets_list` until the asset is `ready`. If necessary, use `scope: "all"` to check an upload still being inspected. A ready uploaded reference belongs in the project library. `kivo_assets_addToLibrary` is for generated results.
5. Record the revision, digest and asset ID. If the POST response was lost, reconcile the existing asset and try completion for that ID before preparing a second upload. If inspection fails, report the current state and safe error details. For expired credentials with no uploaded object, prepare a replacement for the same approved bytes. Keep the local MP4 available.

```sh
node "$SKILL_DIR/scripts/upload-s3.mjs" renders/door-r01.mp4 "$APPROVED_SHA256" < private-upload.json
```

Set `SKILL_DIR` to the installed skill directory and `APPROVED_SHA256` to the digest of the reviewed MP4.

## Bind it as a Seedance 2.5 reference

Use the current model ID from the catalog. A white-model MP4 is a video reference. Name the reference's role in the prompt. Put the asset ID in `referenceIds` and bind the same ID in `text` when calling `kivo_prompts_save`. The following is an example with placeholders for ready Kivo asset IDs.

> Follow @[Door blockout](asset:WHITE_MODEL_ASSET_ID) for camera path, shot size, actor trajectory, timing and the final turn. Keep one continuous shot and preserve the actor's starting and stopping positions. Use @[Character design](asset:CHARACTER_IMAGE_ASSET_ID) for appearance and wardrobe. Render the room as a dimly lit concrete hallway, with soft overhead light and a dark wooden door.

For a requested paid shot, quote a small Draft using the saved `promptId` and `promptVersion`. Show the payer the quote, then submit only within the approved scope. Use `acceptedCredits`, `billingVersion` and `modelVersion` from the quote and a stable `idempotencyKey` for that submission. Track existing jobs before retrying an uncertain request. After a successful Draft, quote the production upgrade using that Kivo Draft job ID as `sourceJobId`. Inspect framing, action and timing on the Draft and again after the final.

[Production Skill](https://github.com/miraga-kivo/kivo-studio-production-skill) · [Seedance 2.5 model documentation](https://seed.bytedance.com/en/seedance2_5)
