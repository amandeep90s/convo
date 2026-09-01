import { Test, TestingModule } from '@nestjs/testing';

import { MessageReceiptsProvider } from './message-receipts.provider';

describe('MessageReceiptsProvider', () => {
  let provider: MessageReceiptsProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MessageReceiptsProvider],
    }).compile();

    provider = module.get<MessageReceiptsProvider>(MessageReceiptsProvider);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
