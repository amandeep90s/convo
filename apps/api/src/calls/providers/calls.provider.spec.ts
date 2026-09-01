import { Test, TestingModule } from '@nestjs/testing';

import { CallsProvider } from './calls.provider';

describe('CallsProvider', () => {
  let provider: CallsProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CallsProvider],
    }).compile();

    provider = module.get<CallsProvider>(CallsProvider);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
