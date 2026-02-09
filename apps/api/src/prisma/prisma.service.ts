import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private pool: Pool | null = null;

  constructor() {
    const url = process.env.DATABASE_URL;
    const hasValidUrl = url && !url.includes('[YOUR-');

    if (hasValidUrl) {
      const pool = new Pool({ connectionString: url });
      const adapter = new PrismaPg(pool);
      super({ adapter });
      // Store pool reference for cleanup
      (this as any)._pool = pool;
    } else {
      // Create a dummy adapter with a non-functional pool
      // This allows the app to start without DB for AI-only features
      const dummyPool = new Pool({ connectionString: 'postgresql://localhost:5432/dummy' });
      const adapter = new PrismaPg(dummyPool);
      super({ adapter });
      (this as any)._pool = dummyPool;
    }
  }

  async onModuleInit() {
    const url = process.env.DATABASE_URL;
    const hasValidUrl = url && !url.includes('[YOUR-');

    if (!hasValidUrl) {
      this.logger.warn(
        'DATABASE_URL not configured – DB features disabled. AI features will still work.',
      );
      return;
    }

    try {
      await this.$connect();
      this.logger.log('Database connected');
    } catch (error) {
      this.logger.warn(
        'Database connection failed – modules requiring Prisma will not work. ' +
          'Set a valid DATABASE_URL in .env to enable DB features.',
      );
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
      const pool = (this as any)._pool as Pool | undefined;
      if (pool) {
        await pool.end();
      }
    } catch {
      // already disconnected or never connected
    }
  }
}
