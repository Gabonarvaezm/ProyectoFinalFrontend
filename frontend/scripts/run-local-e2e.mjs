import { spawn } from 'node:child_process';
import { once } from 'node:events';
const server = spawn(process.execPath, ['node_modules/@angular/cli/bin/ng.js', 'serve', '--configuration', 'local', '--host', '127.0.0.1', '--port', '4311'], { stdio: 'inherit' });
try {
  const deadline = Date.now() + 120000;
  let ready = false;
  while (!ready && Date.now() < deadline && server.exitCode === null) {
    try { ready = (await fetch('http://127.0.0.1:4311/login')).ok; }
    catch (error) { if (error.cause?.code !== 'ECONNREFUSED') throw error; }
    if (!ready) await new Promise((resolve) => setTimeout(resolve, 500));
  }
  if (!ready) throw new Error('ng serve no estuvo disponible dentro del plazo.');
  const runner = spawn(process.execPath, ['node_modules/@playwright/test/cli.js', 'test', '--config', 'playwright.local.config.mjs', ...process.argv.slice(2)], { stdio: 'inherit' });
  const [code] = await once(runner, 'exit'); process.exitCode = code ?? 1;
} finally {
  if (server.exitCode === null) { const stopped = once(server, 'exit'); server.kill(); await stopped; }
}
