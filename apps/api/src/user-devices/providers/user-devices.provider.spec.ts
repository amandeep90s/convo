import { Test, TestingModule } from '@nestjs/testing';

import { UserDevicesProvider } from './user-devices.provider';

describe('UserDevicesProvider', () => {
  let provider: UserDevicesProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserDevicesProvider],
    }).compile();

    provider = module.get<UserDevicesProvider>(UserDevicesProvider);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
