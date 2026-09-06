import { createHash } from 'node:crypto';

import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';

import { HashingProvider } from './hashing.provider';

@Injectable()
export class Argon2Provider implements HashingProvider {
  public async hashPassword(data: string | Buffer): Promise<string> {
    return argon2.hash(data);
  }

  public async comparePassword(
    data: string | Buffer,
    encrypted: string,
  ): Promise<boolean> {
    return argon2.verify(encrypted, data);
  }

  public hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
