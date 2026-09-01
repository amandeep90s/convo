import { Test, TestingModule } from '@nestjs/testing';

import { UserSettingsProvider } from './user-settings.provider';

describe('UserSettingsProvider', () => {
  let provider: UserSettingsProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserSettingsProvider],
    }).compile();

    provider = module.get<UserSettingsProvider>(UserSettingsProvider);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
