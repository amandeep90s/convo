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

@Controller('communities')
@ApiTags('Communities')
@ApiBearerAuth('access-token')
export class CommunitiesController {
  constructor(private readonly groupsService: GroupsService) {}

  @Get()
  @ApiEndpoint('List communities')
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() pagination: PaginationDto,
  ) {
    return this.groupsService.list(
      user.id,
      pagination.page ?? 1,
      pagination.limit ?? 20,
      'community',
    );
  }

  @Post()
  @ResponseMessage('Community created')
  @ApiCreatedEndpoint('Create a community')
  create(@CurrentUser() user: AuthenticatedUser, @Body() body: CreateGroupDto) {
    return this.groupsService.create(user.id, body, 'community');
  }

  @Get(':communityId')
  @ApiEndpoint('Get a community')
  get(
    @CurrentUser() user: AuthenticatedUser,
    @Param('communityId', ParseUUIDPipe) communityId: string,
  ) {
    return this.groupsService.get(user.id, communityId, 'community');
  }

  @Patch(':communityId')
  @ResponseMessage('Community updated')
  @ApiEndpoint('Update a community')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('communityId', ParseUUIDPipe) communityId: string,
    @Body() body: UpdateGroupDto,
  ) {
    return this.groupsService.update(user.id, communityId, body, 'community');
  }

  @Delete(':communityId')
  @ApiEndpoint('Delete a community')
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('communityId', ParseUUIDPipe) communityId: string,
  ) {
    return this.groupsService.remove(user.id, communityId, 'community');
  }
}
