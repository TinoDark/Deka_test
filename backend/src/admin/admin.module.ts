import { Module } from '@nestjs/common';
import { PrismaModule } from '../common/prisma/prisma.module';
import { SyncAdminController } from './sync-admin.controller';
import { SyncAdminService } from './sync-admin.service';

@Module({
  imports: [PrismaModule],
  controllers: [SyncAdminController],
  providers: [SyncAdminService],
})
export class AdminModule {}
