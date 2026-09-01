import { Test, TestingModule } from '@nestjs/testing';

import { CallParticipantsProvider } from './call-participants.provider';

describe('CallParticipantsProvider', () => {
  let provider: CallParticipantsProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CallParticipantsProvider],
    }).compile();

    provider = module.get<CallParticipantsProvider>(CallParticipantsProvider);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
