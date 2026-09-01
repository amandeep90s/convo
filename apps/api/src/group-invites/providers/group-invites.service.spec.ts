import { Test, TestingModule } from '@nestjs/testing';

import { GroupInvitesService } from './group-invites.service';

describe('GroupInvitesService', () => {
  let service: GroupInvitesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GroupInvitesService],
    }).compile();

    service = module.get<GroupInvitesService>(GroupInvitesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
