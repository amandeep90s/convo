import { Test, TestingModule } from '@nestjs/testing';

import { MessagesProvider } from './messages.provider';

describe('MessagesProvider', () => {
  let provider: MessagesProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MessagesProvider],
    }).compile();

    provider = module.get<MessagesProvider>(MessagesProvider);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
