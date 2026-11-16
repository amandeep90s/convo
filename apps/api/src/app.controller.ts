import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { AppService } from '@/app.service';
import { ApiEndpoint } from '@/common/decorators/api-endpoint.decorator';
import { Public } from '@/common/decorators/public.decorator';

@Controller()
@ApiTags('Service')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Public()
  @ApiEndpoint('Get the API welcome message')
  getHello(): string {
    return this.appService.getHello();
  }
}
