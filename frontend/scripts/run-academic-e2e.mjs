import { fork, spawn } from 'node:child_process';
import { once } from 'node:events';
const server = fork('scripts/serve-academic-e2e.mjs', [], { stdio: ['ignore', 'inherit', 'inherit', 'ipc'] });
let timer;
try {
  await Promise.race([
    once(server, 'message'),
    once(server, 'exit').then(() => { throw new Error('No se pudo iniciar el servidor E2E.'); }),
    new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Tiempo de inicio agotado.')), 30000); }),
  ]);
  clearTimeout(timer);
  const runner = spawn(process.execPath, ['node_modules/@playwright/test/cli.js', 'test', ...process.argv.slice(2)], { stdio: 'inherit' });
  const [code] = await once(runner, 'exit');
  process.exitCode = code ?? 1;
} finally {
  clearTimeout(timer);
  if (server.connected) { const stopped = once(server, 'exit'); server.send('stop'); await stopped; }
}
