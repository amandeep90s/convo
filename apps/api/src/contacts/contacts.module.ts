import { Module } from '@nestjs/common';

import { ContactsController } from './contacts.controller';
import { ContactsProvider } from './providers/contacts.provider';
import { ContactsService } from './providers/contacts.service';

@Module({
  controllers: [ContactsController],
  providers: [ContactsService, ContactsProvider],
})
export class ContactsModule {}
