import { unlink } from 'node:fs/promises';
import path from 'node:path';

import { BadRequestException } from '@nestjs/common';

export async function removeMessageFiles(
  uploadDir: string,
  keys: Array<string | null>,
) {
  const paths = [...new Set(keys.filter((key) => key !== null))].map((key) => {
    if (!key || path.basename(key) !== key || key === '.' || key === '..') {
      throw new BadRequestException('Invalid attachment storage key');
    }
    return path.join(uploadDir, key);
  });
  for (const filePath of paths) {
    try {
      await unlink(filePath);
    } catch (error) {
      if (
        typeof error !== 'object' ||
        error === null ||
        !('code' in error) ||
        error.code !== 'ENOENT'
      ) {
        throw error;
      }
    }
  }
}
