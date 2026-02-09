import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  private supabase: SupabaseClient;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.supabase = createClient(
      this.configService.get<string>('NEXT_PUBLIC_SUPABASE_URL')!,
      this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY')!,
    );
  }

  async validateUser(userId: string) {
    // Find or create user in our database
    let user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      // Get user info from Supabase
      const { data: supabaseUser } = await this.supabase.auth.admin.getUserById(
        userId,
      );

      if (supabaseUser?.user) {
        user = await this.prisma.user.create({
          data: {
            id: userId,
            email: supabaseUser.user.email!,
            name: supabaseUser.user.user_metadata?.name,
            avatarUrl: supabaseUser.user.user_metadata?.avatar_url,
          },
        });
      }
    }

    return user;
  }

  async getProfile(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        subjects: true,
        _count: {
          select: {
            documents: true,
          },
        },
      },
    });
  }
}
