import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '@/common/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { InventoryController } from './inventory/inventory.controller';
import { InventoryService } from './inventory/inventory.service';
import { ImageProcessorService } from './inventory/image-processor.service';
import { StorageService } from './inventory/storage.service';
import { AgentKeyService } from './inventory/agent-key.service';

@Module({
  imports: [PrismaModule, ConfigModule, AuthModule],
  controllers: [InventoryController],
  providers: [InventoryService, ImageProcessorService, StorageService, AgentKeyService],
  exports: [InventoryService, ImageProcessorService, StorageService, AgentKeyService],
})
export class SuppliersModule {}
