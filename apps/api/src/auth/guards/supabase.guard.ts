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

/**
 * Guard that validates Supabase JWT tokens using Supabase's own auth.getUser() API.
 * This is more reliable than local JWT verification because:
 * 1. No need to manage JWT_SECRET manually
 * 2. Automatically handles token expiration and revocation
 * 3. Works with all Supabase auth methods (email, OAuth, etc.)
 */
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

      // Validate/sync user in our database
      const user = await this.authService.validateUser(supabaseUser.id);

      if (!user) {
        throw new UnauthorizedException('User not found in database');
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
