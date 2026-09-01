import { Test, TestingModule } from '@nestjs/testing';

import { PinnedMessagesService } from './pinned-messages.service';

describe('PinnedMessagesService', () => {
  let service: PinnedMessagesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PinnedMessagesService],
    }).compile();

    service = module.get<PinnedMessagesService>(PinnedMessagesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
