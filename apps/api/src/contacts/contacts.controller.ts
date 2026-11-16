import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import {
  ApiCreatedEndpoint,
  ApiEndpoint,
} from '@/common/decorators/api-endpoint.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';
import {
  CreateContactDto,
  PaginationDto,
  UpdateContactDto,
} from '@/common/dtos/api.dto';
import type { AuthenticatedUser } from '@/common/types/authenticated-user';
import { ContactsService } from '@/contacts/providers/contacts.service';

@Controller('contacts')
@ApiTags('Contacts')
@ApiBearerAuth('access-token')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Get()
  @ApiEndpoint('List contacts')
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() pagination: PaginationDto,
  ) {
    return this.contactsService.list(
      user.id,
      pagination.page ?? 1,
      pagination.limit ?? 20,
    );
  }

  @Post()
  @ResponseMessage('Contact added')
  @ApiCreatedEndpoint('Add a contact')
  add(@CurrentUser() user: AuthenticatedUser, @Body() body: CreateContactDto) {
    return this.contactsService.add(
      user.id,
      body.contact_user_id,
      body.nickname,
    );
  }

  @Patch(':contactUserId')
  @ResponseMessage('Contact updated')
  @ApiEndpoint('Update a contact nickname')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('contactUserId', ParseUUIDPipe) contactUserId: string,
    @Body() body: UpdateContactDto,
  ) {
    return this.contactsService.update(user.id, contactUserId, body.nickname);
  }

  @Delete(':contactUserId')
  @ApiEndpoint('Remove a contact')
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('contactUserId', ParseUUIDPipe) contactUserId: string,
  ) {
    return this.contactsService.remove(user.id, contactUserId);
  }
}
