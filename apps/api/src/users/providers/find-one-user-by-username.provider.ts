import { Injectable, RequestTimeoutException } from '@nestjs/common';
import { db, UserModel } from '@repo/db';

@Injectable()
export class FindOneUserByUsernameProvider {
  public async findOneByUsername(username: string): Promise<UserModel | null> {
    try {
      return await db.user.findUnique({
        where: { username },
      });
    } catch (error) {
      throw new RequestTimeoutException(error, {
        description: 'Failed to find user by username',
      });
    }
  }
}
