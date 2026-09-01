import { Test, TestingModule } from '@nestjs/testing';
import { PrivateConversationsController } from './private-conversations.controller';

describe('PrivateConversationsController', () => {
  let controller: PrivateConversationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PrivateConversationsController],
    }).compile();

    controller = module.get<PrivateConversationsController>(
      PrivateConversationsController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
