import { Body, Controller, Post } from '@nestjs/common';

import { RegisterUserDto } from '@/auth/dtos/register.dto';
import { AuthService } from '@/auth/providers/auth.service';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    /**
     * Injecting AuthService
     */
    private readonly authService: AuthService,
  ) {}

  @Post('register')
  @ResponseMessage('User registered successfully')
  register(@Body() body: RegisterUserDto) {
    return this.authService.register(body);
  }
}
