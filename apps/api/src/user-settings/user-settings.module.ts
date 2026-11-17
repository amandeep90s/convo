import { Module } from '@nestjs/common';

import { UserSettingsProvider } from './providers/user-settings.provider';
import { UserSettingsService } from './providers/user-settings.service';
import { UserSettingsController } from './user-settings.controller';

@Module({
  controllers: [UserSettingsController],
  providers: [UserSettingsService, UserSettingsProvider],
})
export class UserSettingsModule {}
