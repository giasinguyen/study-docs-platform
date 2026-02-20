import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class SupabaseGuard implements CanActivate {
  private supabase: SupabaseClient;
  private readonly logger = new Logger(SupabaseGuard.name);

  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    const url = this.configService.get<string>('NEXT_PUBLIC_SUPABASE_URL');
    const serviceKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

    if (!url || !serviceKey) {
      this.logger.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    }

    this.supabase = createClient(url!, serviceKey!);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader) {
      throw new UnauthorizedException('Missing Authorization header');
    }

    const token = authHeader.replace('Bearer ', '');

    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    try {
      // Use Supabase to verify the token and get the user
      const { data: { user: supabaseUser }, error } = await this.supabase.auth.getUser(token);

      if (error || !supabaseUser) {
        this.logger.warn(`Token verification failed: ${error?.message || 'No user found'}`);
        throw new UnauthorizedException('Invalid or expired token');
      }

      // Try to validate/sync user in our local database (Prisma)
      // If Prisma is not configured, fall back to Supabase user data
      let user: any = null;
      try {
        user = await this.authService.validateUser(supabaseUser.id);
      } catch (prismaError) {
        this.logger.warn(`Prisma validation skipped (DB may not be configured): ${prismaError}`);
        // Fallback: create a user-like object from Supabase data
        user = {
          id: supabaseUser.id,
          email: supabaseUser.email,
          name: supabaseUser.user_metadata?.name || supabaseUser.user_metadata?.full_name,
          avatarUrl: supabaseUser.user_metadata?.avatar_url,
        };
      }

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Attach user to request for downstream handlers
      request.user = user;
      return true;
    } catch (err) {
      if (err instanceof UnauthorizedException) {
        throw err;
      }
      this.logger.error(`Auth error: ${err}`);
      throw new UnauthorizedException('Authentication failed');
    }
  }
}
