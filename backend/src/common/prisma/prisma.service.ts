import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient {
  private readonly logger = new Logger('PrismaService');

  async onModuleInit() {
    this.logger.log('🔄 Connecting to PostgreSQL database...');
    try {
      await this.$connect();
      this.logger.log('✅ Connected to PostgreSQL successfully');
    } catch (error) {
      this.logger.error('❌ Failed to connect to PostgreSQL:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    this.logger.log('🔌 Disconnecting from PostgreSQL...');
    try {
      await this.$disconnect();
      this.logger.log('✅ Disconnected from PostgreSQL successfully');
    } catch (error) {
      this.logger.error('❌ Error disconnecting from PostgreSQL:', error);
    }
  }
}
