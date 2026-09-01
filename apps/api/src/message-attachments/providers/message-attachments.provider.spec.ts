import { Test, TestingModule } from '@nestjs/testing';

import { MessageAttachmentsProvider } from './message-attachments.provider';

describe('MessageAttachmentsProvider', () => {
  let provider: MessageAttachmentsProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MessageAttachmentsProvider],
    }).compile();

    provider = module.get<MessageAttachmentsProvider>(
      MessageAttachmentsProvider,
    );
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
