import { Test, TestingModule } from '@nestjs/testing';

import { ContactsProvider } from './contacts.provider';

describe('ContactsProvider', () => {
  let provider: ContactsProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ContactsProvider],
    }).compile();

    provider = module.get<ContactsProvider>(ContactsProvider);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
