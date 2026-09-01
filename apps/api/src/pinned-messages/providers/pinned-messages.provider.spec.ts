import { Test, TestingModule } from '@nestjs/testing';

import { PinnedMessagesProvider } from './pinned-messages.provider';

describe('PinnedMessagesProvider', () => {
  let provider: PinnedMessagesProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PinnedMessagesProvider],
    }).compile();

    provider = module.get<PinnedMessagesProvider>(PinnedMessagesProvider);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
