import { Test, TestingModule } from '@nestjs/testing';

import { ConversationMembersProvider } from './conversation-members.provider';

describe('ConversationMembersProvider', () => {
  let provider: ConversationMembersProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConversationMembersProvider],
    }).compile();

    provider = module.get<ConversationMembersProvider>(
      ConversationMembersProvider,
    );
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
