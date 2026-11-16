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
  CreateGroupDto,
  PaginationDto,
  UpdateGroupDto,
} from '@/common/dtos/api.dto';
import type { AuthenticatedUser } from '@/common/types/authenticated-user';
import { GroupsService } from '@/groups/providers/groups.service';

@Controller('groups')
@ApiTags('Groups')
@ApiBearerAuth('access-token')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Get()
  @ApiEndpoint('List groups')
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() pagination: PaginationDto,
  ) {
    return this.groupsService.list(
      user.id,
      pagination.page ?? 1,
      pagination.limit ?? 20,
    );
  }

  @Post()
  @ResponseMessage('Group created')
  @ApiCreatedEndpoint('Create a group')
  create(@CurrentUser() user: AuthenticatedUser, @Body() body: CreateGroupDto) {
    return this.groupsService.create(user.id, body);
  }

  @Get(':conversationId')
  @ApiEndpoint('Get a group')
  get(
    @CurrentUser() user: AuthenticatedUser,
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
  ) {
    return this.groupsService.get(user.id, conversationId);
  }

  @Patch(':conversationId')
  @ResponseMessage('Group updated')
  @ApiEndpoint('Update a group')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
    @Body() body: UpdateGroupDto,
  ) {
    return this.groupsService.update(user.id, conversationId, body);
  }

  @Delete(':conversationId')
  @ApiEndpoint('Delete a group')
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
  ) {
    return this.groupsService.remove(user.id, conversationId);
  }
}
