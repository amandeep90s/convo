import { Test, TestingModule } from '@nestjs/testing';

import { MessageReactionsProvider } from './message-reactions.provider';

describe('MessageReactionsProvider', () => {
  let provider: MessageReactionsProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MessageReactionsProvider],
    }).compile();

    provider = module.get<MessageReactionsProvider>(MessageReactionsProvider);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
