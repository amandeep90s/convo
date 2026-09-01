import { Test, TestingModule } from '@nestjs/testing';

import { MessageReceiptsController } from './message-receipts.controller';

describe('MessageReceiptsController', () => {
  let controller: MessageReceiptsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MessageReceiptsController],
    }).compile();

    controller = module.get<MessageReceiptsController>(
      MessageReceiptsController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
