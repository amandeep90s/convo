import { Test, TestingModule } from '@nestjs/testing';

import { BlockedUsersProvider } from './blocked-users.provider';

describe('BlockedUsersProvider', () => {
  let provider: BlockedUsersProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BlockedUsersProvider],
    }).compile();

    provider = module.get<BlockedUsersProvider>(BlockedUsersProvider);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
