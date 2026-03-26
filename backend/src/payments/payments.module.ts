import { Module } from '@nestjs/common';
import { PrismaModule } from '../common/prisma/prisma.module';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { PayGateGlobalService } from './paygateglobal.service';

@Module({
  imports: [PrismaModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, PayGateGlobalService],
  exports: [PaymentsService, PayGateGlobalService],
})
export class PaymentsModule {}
