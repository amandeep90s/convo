import { Test, TestingModule } from '@nestjs/testing';

import { PrivateConversationsProvider } from './private-conversations.provider';

describe('PrivateConversationsProvider', () => {
  let provider: PrivateConversationsProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrivateConversationsProvider],
    }).compile();

    provider = module.get<PrivateConversationsProvider>(
      PrivateConversationsProvider,
    );
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
