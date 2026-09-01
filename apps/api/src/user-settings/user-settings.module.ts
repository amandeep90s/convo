import { Module } from '@nestjs/common';

import { UserSettingsProvider } from './providers/user-settings.provider';
import { UserSettingsService } from './providers/user-settings.service';

@Module({
  providers: [UserSettingsService, UserSettingsProvider],
})
export class UserSettingsModule {}
