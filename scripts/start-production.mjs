/**
 * Picks the correct production entry (standalone) for the environment:
 * - Docker: standalone is copied to WORKDIR, so `server.js` is next to `package.json`.
 * - Buildpacks / k8s from repo: after `next build`, use `.next/standalone/server.js`.
 * - Fallback: `next start` if `node_modules/next` and a `.next` build exist (no standalone in artifact).
 */
import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(new URL(import.meta.url))), '..');

const candidates = [
  join(root, 'server.js'),
  join(root, '.next', 'standalone', 'server.js'),
];

const serverPath = candidates.find((p) => existsSync(p));

function listenEnv() {
  // Container/K8s often set HOSTNAME to the pod name; Next / Node HTTP servers may bind incorrectly.
  return {
    ...process.env,
    HOSTNAME: '0.0.0.0',
  };
}

if (serverPath) {
  const child = spawn(process.execPath, [serverPath], {
    stdio: 'inherit',
    env: listenEnv(),
    cwd: dirname(serverPath),
  });
  child.on('exit', (code) => process.exit(code ?? 0));
} else {
  const nextCli = join(root, 'node_modules', 'next', 'dist', 'bin', 'next');
  const hasBuild = existsSync(join(root, '.next', 'BUILD_ID'));
  if (hasBuild && existsSync(nextCli)) {
    const child = spawn(process.execPath, [nextCli, 'start', '-H', '0.0.0.0'], {
      stdio: 'inherit',
      env: listenEnv(),
      cwd: root,
    });
    child.on('exit', (code) => process.exit(code ?? 0));
  } else {
    console.error(
      [
        'No production server was found. This project uses `output: "standalone"` in `next.config.ts`.',
        '',
        '1) In your build phase, run `npm run build` and deploy the result so you have `server.js` in the',
        '   app root (Docker) or `.next/standalone/server.js` (other hosts),',
        '2) Or use the project Dockerfile: it copies standalone to `/app` and runs `node server.js`.',
        '3) Do not start the run container from source without the `.next` build output in the same image/folder.',
        `Checked: ${candidates.join(', ')}`,
        `App root: ${root}`,
      ].join('\n')
    );
    process.exit(1);
  }
}
