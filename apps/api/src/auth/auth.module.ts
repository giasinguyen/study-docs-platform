import { Module, Global } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { SupabaseGuard } from './guards/supabase.guard';

@Global()
@Module({
  controllers: [AuthController],
  providers: [AuthService, SupabaseGuard],
  exports: [AuthService, SupabaseGuard],
})
export class AuthModule {}
