import { Test, TestingModule } from '@nestjs/testing';
import { ConversationMembersController } from './conversation-members.controller';

describe('ConversationMembersController', () => {
  let controller: ConversationMembersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConversationMembersController],
    }).compile();

    controller = module.get<ConversationMembersController>(
      ConversationMembersController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
