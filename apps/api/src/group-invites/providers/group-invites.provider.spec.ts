import { Test, TestingModule } from '@nestjs/testing';

import { GroupInvitesProvider } from './group-invites.provider';

describe('GroupInvitesProvider', () => {
  let provider: GroupInvitesProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GroupInvitesProvider],
    }).compile();

    provider = module.get<GroupInvitesProvider>(GroupInvitesProvider);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
