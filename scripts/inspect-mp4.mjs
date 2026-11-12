import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { basename, resolve } from 'node:path';

const [file] = process.argv.slice(2);
if (!file) {
  console.error('Usage: node inspect-mp4.mjs FILE.mp4');
  process.exit(2);
}

try {
  const path = resolve(file);
  const fileStat = await stat(path);
  const probe = process.env.HYPERFRAMES_FFPROBE_PATH || 'ffprobe';
  const { streams, format } = JSON.parse(execFileSync(probe, [
    '-v', 'error', '-show_streams', '-show_format', '-of', 'json', path,
  ], { encoding: 'utf8' }));
  const video = streams.find((stream) =>
    stream.codec_type === 'video' && !stream.disposition?.attached_pic);
  const durationSeconds = Number(format.duration);
  if (!fileStat.isFile() || !format.format_name.split(',').includes('mp4') ||
      !video?.width || !video?.height || !Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    throw new Error('Expected a playable MP4 video with a positive duration.');
  }

  const hash = createHash('sha256');
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  const finalStat = await stat(path);
  if (fileStat.size !== finalStat.size || fileStat.mtimeMs !== finalStat.mtimeMs) {
    throw new Error('File changed during inspection.');
  }
  console.log(JSON.stringify({
    name: basename(path),
    byteSize: fileStat.size,
    durationSeconds,
    width: video.width,
    height: video.height,
    aspectRatio: video.width / video.height,
    frameRate: video.avg_frame_rate,
    videoCodec: video.codec_name,
    pixelFormat: video.pix_fmt,
    audio: streams.some((stream) => stream.codec_type === 'audio'),
    sha256: hash.digest('hex'),
  }, null, 2));
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
