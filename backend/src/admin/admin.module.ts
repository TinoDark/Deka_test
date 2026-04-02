import { Module } from '@nestjs/common';
import { PrismaModule } from '../common/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { SyncAdminController } from './sync-admin.controller';
import { SyncAdminService } from './sync-admin.service';
import { DisputesController } from './disputes.controller';
import { DisputesService } from './disputes.service';
import { RefundsController } from './refunds.controller';
import { RefundsService } from './refunds.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [SyncAdminController, DisputesController, RefundsController],
  providers: [SyncAdminService, DisputesService, RefundsService],
})
export class AdminModule {}
