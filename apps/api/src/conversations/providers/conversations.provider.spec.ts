import { Test, TestingModule } from '@nestjs/testing';

import { ConversationsProvider } from './conversations.provider';

describe('ConversationsProvider', () => {
  let provider: ConversationsProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConversationsProvider],
    }).compile();

    provider = module.get<ConversationsProvider>(ConversationsProvider);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
