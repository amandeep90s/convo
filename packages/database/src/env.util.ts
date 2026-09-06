import fs from 'node:fs';
import path from 'node:path';

/**
 * Finds the monorepo root directory by searching upward for a root marker file (`pnpm-workspace.yaml`).
 * Falls back to process.cwd() if not found.
 */
export function getRootDir(startDir: string = process.cwd()): string {
  let current = path.resolve(startDir);

  while (true) {
    if (
      fs.existsSync(path.join(current, 'pnpm-workspace.yaml')) ||
      fs.existsSync(path.join(current, 'turbo.json'))
    ) {
      return current;
    }

    const parent = path.dirname(current);
    if (parent === current) {
      break;
    }
    current = parent;
  }

  return path.resolve(startDir);
}

/**
 * Resolves the absolute path to the root-level .env file (or specified env file).
 */
export function getRootEnvPath(fileName = '.env'): string {
  return path.join(getRootDir(), fileName);
}
