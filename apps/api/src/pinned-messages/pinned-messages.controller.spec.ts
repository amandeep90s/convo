import { Test, TestingModule } from '@nestjs/testing';

import { PinnedMessagesController } from './pinned-messages.controller';

describe('PinnedMessagesController', () => {
  let controller: PinnedMessagesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PinnedMessagesController],
    }).compile();

    controller = module.get<PinnedMessagesController>(PinnedMessagesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
