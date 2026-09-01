import { Test, TestingModule } from '@nestjs/testing';

import { MessageReceiptsService } from './message-receipts.service';

describe('MessageReceiptsService', () => {
  let service: MessageReceiptsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MessageReceiptsService],
    }).compile();

    service = module.get<MessageReceiptsService>(MessageReceiptsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
