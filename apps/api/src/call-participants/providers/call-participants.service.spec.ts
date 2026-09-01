import { Test, TestingModule } from '@nestjs/testing';

import { CallParticipantsService } from './call-participants.service';

describe('CallParticipantsService', () => {
  let service: CallParticipantsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CallParticipantsService],
    }).compile();

    service = module.get<CallParticipantsService>(CallParticipantsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
