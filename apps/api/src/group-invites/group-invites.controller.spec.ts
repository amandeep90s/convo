import { Test, TestingModule } from '@nestjs/testing';
import { GroupInvitesController } from './group-invites.controller';

describe('GroupInvitesController', () => {
  let controller: GroupInvitesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GroupInvitesController],
    }).compile();

    controller = module.get<GroupInvitesController>(GroupInvitesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
