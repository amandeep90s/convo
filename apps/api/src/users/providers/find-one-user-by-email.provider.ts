import { Injectable, RequestTimeoutException } from '@nestjs/common';
import { db, UserModel } from '@repo/db';

@Injectable()
export class FindOneUserByEmailProvider {
  public async findOneByEmail(email: string): Promise<UserModel | null> {
    try {
      return await db.user.findUnique({
        where: { email },
      });
    } catch (error) {
      throw new RequestTimeoutException(error, {
        description: 'Failed to find user by email',
      });
    }
  }
}
