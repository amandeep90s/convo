import { Test, TestingModule } from '@nestjs/testing';

import { GroupsProvider } from './groups.provider';

describe('GroupsProvider', () => {
  let provider: GroupsProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GroupsProvider],
    }).compile();

    provider = module.get<GroupsProvider>(GroupsProvider);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
