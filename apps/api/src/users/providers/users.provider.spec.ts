import { Test, TestingModule } from '@nestjs/testing';

import { UsersProvider } from './users.provider';

describe('UsersProvider', () => {
  let provider: UsersProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersProvider],
    }).compile();

    provider = module.get<UsersProvider>(UsersProvider);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
