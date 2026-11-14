import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const projectDirectory = fileURLToPath(new URL('../', import.meta.url));

const processes = [
  spawn(process.execPath, ['--watch', 'scripts/serve-api.mjs'], { cwd: projectDirectory, stdio: 'inherit' }),
  spawn(process.execPath, ['node_modules/@angular/cli/bin/ng.js', 'serve', ...process.argv.slice(2)], {
    stdio: 'inherit',
    cwd: projectDirectory,
  }),
];

let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of processes) child.kill();
  process.exitCode = code;
}

for (const child of processes) {
  child.on('error', () => stop(1));
  child.on('exit', (code) => stop(code ?? 1));
}
process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());
