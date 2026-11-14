import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseEnv } from 'node:util';

export function findProjectDirectory(startDirectory) {
  let directory = startDirectory;
  while (true) {
    const packagePath = join(directory, 'package.json');
    if (existsSync(packagePath)) {
      const manifest = JSON.parse(readFileSync(packagePath, 'utf8'));
      if (manifest.name === 'discer-ia') return directory;
    }
    const parent = dirname(directory);
    if (parent === directory) return process.cwd();
    directory = parent;
  }
}

/**
 * Reads runtime secrets on the server, independently of CLI flags or working directory.
 * @param {{startDirectory?: string, environment?: NodeJS.ProcessEnv}} [options]
 * @returns {{apiKey: string, model: string}}
 */
export function loadChatbotConfiguration({
  startDirectory = dirname(fileURLToPath(import.meta.url)),
  environment = process.env,
} = {}) {
  const envPath = join(findProjectDirectory(startDirectory), '.env');
  const local = existsSync(envPath) ? parseEnv(readFileSync(envPath, 'utf8')) : {};
  return {
    apiKey: environment.OPENROUTER_API_KEY?.trim() || local.OPENROUTER_API_KEY?.trim() || '',
    model: environment.OPENROUTER_MODEL?.trim() || local.OPENROUTER_MODEL?.trim() ||
      'nvidia/nemotron-3-ultra-550b-a55b:free',
  };
}
