import { Controller, Post, Body, HttpCode, Param } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from '../common/decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(200)
  async login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body.email, body.password);
  }

  @Public()
  @Post('register')
  async register(
    @Body()
    body: {
      email: string;
      password: string;
      phone: string;
      role?: string;
    },
  ) {
    return this.authService.register(
      body.email,
      body.password,
      body.phone,
      body.role as any,
    );
  }

  @Public()
  @Post('verify-token')
  async verifyToken(@Body() body: { token: string }) {
    return this.authService.verifyToken(body.token);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(200)
  async forgotPassword(@Body() body: { email: string }) {
    return this.authService.requestPasswordReset(body.email);
  }

  @Public()
  @Post('reset-password/:token')
  @HttpCode(200)
  async resetPassword(
    @Param('token') token: string,
    @Body() body: { newPassword: string },
  ) {
    return this.authService.resetPassword(token, body.newPassword);
  }
}
