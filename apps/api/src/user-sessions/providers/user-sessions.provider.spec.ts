import { Test, TestingModule } from '@nestjs/testing';

import { UserSessionsProvider } from './user-sessions.provider';

describe('UserSessionsProvider', () => {
  let provider: UserSessionsProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserSessionsProvider],
    }).compile();

    provider = module.get<UserSessionsProvider>(UserSessionsProvider);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
