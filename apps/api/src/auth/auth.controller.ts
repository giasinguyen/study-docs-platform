import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SupabaseGuard } from './guards/supabase.guard';
import { User } from '@prisma/client';

interface RequestWithUser extends Request {
  user: User;
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('profile')
  @UseGuards(SupabaseGuard)
  async getProfile(@Request() req: RequestWithUser) {
    return this.authService.getProfile(req.user.id);
  }

  @Get('me')
  @UseGuards(SupabaseGuard)
  async getCurrentUser(@Request() req: RequestWithUser) {
    return req.user;
  }
}
