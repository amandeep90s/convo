import { Module } from '@nestjs/common';

import { UserSettingsService } from './providers/user-settings.service';

@Module({
  providers: [UserSettingsService],
})
export class UserSettingsModule {}
