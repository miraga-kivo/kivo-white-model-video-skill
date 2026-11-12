import { createHash } from 'node:crypto';
import { openAsBlob, readFileSync } from 'node:fs';
import { basename } from 'node:path';

const [file, expectedHash] = process.argv.slice(2);
if (!file || !/^[a-f0-9]{64}$/i.test(expectedHash ?? '')) {
  console.error('Usage: node upload-s3.mjs FILE.mp4 APPROVED_SHA256 < upload.json');
  process.exit(2);
}

try {
  const { url, fields } = JSON.parse(readFileSync(0, 'utf8'));
  const target = new URL(url);
  const s3Host = /^(?:[a-z0-9.-]+\.)?s3(?:[.-][a-z0-9-]+)?\.amazonaws\.com$/;
  if (target.protocol !== 'https:' || !s3Host.test(target.hostname) ||
      target.username || target.password || target.port || target.search || target.hash) {
    throw new Error('Expected the HTTPS S3 form endpoint returned by Kivo.');
  }
  if (fields?.['Content-Type'] !== 'video/mp4' || typeof fields.key !== 'string' ||
      !fields.key.startsWith('uploads/') || Object.hasOwn(fields, 'file') ||
      !Object.values(fields).every((value) => typeof value === 'string')) {
    throw new Error('Expected the original video/mp4 form fields returned by Kivo.');
  }

  const blob = await openAsBlob(file, { type: 'video/mp4' });
  const hash = createHash('sha256');
  for await (const chunk of blob.stream()) hash.update(chunk);
  if (hash.digest('hex') !== expectedHash.toLowerCase()) {
    throw new Error('File bytes differ from the approved render.');
  }

  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) form.append(key, value);
  form.append('file', blob, basename(file));
  const result = await fetch(target, {
    method: 'POST',
    body: form,
    redirect: 'error',
    signal: AbortSignal.timeout(120_000),
  }).catch(() => {
    throw new Error('Upload response unavailable. Reconcile the existing Kivo asset before retrying.');
  });
  if (!result.ok) throw new Error('S3 rejected the upload (HTTP ' + result.status + ').');
  console.log('Upload accepted by S3. Complete the existing asset through Kivo MCP.');
} catch (error) {
  // Parser and URL exceptions may include snippets of signed fields. Suppress those details.
  console.error(error instanceof SyntaxError || error instanceof TypeError
    ? 'Invalid upload data or unreadable file. Check the Kivo POST object and local MP4.'
    : error.message);
  process.exitCode = 1;
}
