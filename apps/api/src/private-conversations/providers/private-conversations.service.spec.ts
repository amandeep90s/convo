import { Test, TestingModule } from '@nestjs/testing';

import { PrivateConversationsService } from './private-conversations.service';

describe('PrivateConversationsService', () => {
  let service: PrivateConversationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrivateConversationsService],
    }).compile();

    service = module.get<PrivateConversationsService>(
      PrivateConversationsService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
