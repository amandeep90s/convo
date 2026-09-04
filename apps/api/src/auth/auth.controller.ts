import { Body, Controller, Post } from '@nestjs/common';

import { RegisterUserDto } from './dtos/register.dto';
import { AuthService } from './providers/auth.service';

@Controller('auth')
export class AuthController {
  constructor(
    /**
     * Injecting AuthService
     */
    private readonly authService: AuthService,
  ) {}

  @Post('register')
  register(@Body() body: RegisterUserDto) {
    return this.authService.register(body);
  }
}
