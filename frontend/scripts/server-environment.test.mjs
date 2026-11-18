import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { afterEach, beforeEach, test } from 'node:test';
import { loadChatbotConfiguration } from '../src/server/server-environment.mjs';

let project;
beforeEach(() => {
  project = mkdtempSync(join(tmpdir(), 'disceria-env-'));
  writeFileSync(join(project, 'package.json'), JSON.stringify({ name: 'discer-ia' }));
});
afterEach(() => {
  assert.equal(dirname(resolve(project)), resolve(tmpdir()));
  assert.ok(basename(project).startsWith('disceria-env-'));
  rmSync(project, { recursive: true, force: true });
});

for (const folders of [['src', 'server'], ['dist', 'DiscerIA', 'server']]) {
  test(`carga la clave local sin flags desde ${folders.join('/')}`, () => {
    const startDirectory = join(project, ...folders);
    mkdirSync(startDirectory, { recursive: true });
    writeFileSync(join(project, '.env'), 'OPENROUTER_API_KEY=test-local-key\nOPENROUTER_MODEL=test-model\n');
    const configuration = loadChatbotConfiguration({ startDirectory, environment: {} });
    assert.equal(configuration.apiKey, 'test-local-key');
    assert.equal(configuration.model, 'test-model');
  });
}

test('da prioridad a las variables del despliegue sin modificar process.env', () => {
  writeFileSync(join(project, '.env'), 'OPENROUTER_API_KEY=test-local-key\n');
  const environment = { OPENROUTER_API_KEY: 'test-deployment-key', OPENROUTER_MODEL: 'deployment-model' };
  assert.deepEqual(loadChatbotConfiguration({ startDirectory: project, environment }), {
    apiKey: 'test-deployment-key', model: 'deployment-model',
  });
  assert.equal(environment.OPENROUTER_API_KEY, 'test-deployment-key');
});

test('recupera una clave local aunque la variable heredada esté vacía', () => {
  writeFileSync(join(project, '.env'), 'OPENROUTER_API_KEY=test-local-key\n');
  assert.equal(loadChatbotConfiguration({
    startDirectory: project, environment: { OPENROUTER_API_KEY: '  ' },
  }).apiKey, 'test-local-key');
});

test('detecta una configuración guardada después de iniciar la API', () => {
  const options = { startDirectory: project, environment: {} };
  assert.equal(loadChatbotConfiguration(options).apiKey, '');
  writeFileSync(join(project, '.env'), 'OPENROUTER_API_KEY=test-added-key\n');
  assert.equal(loadChatbotConfiguration(options).apiKey, 'test-added-key');
});
