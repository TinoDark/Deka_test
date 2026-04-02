import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { RefundsService } from './refunds.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';

@Controller('admin/refunds')
@UseGuards(JwtAuthGuard)
@Roles('ADMIN')
export class RefundsController {
  constructor(private refundsService: RefundsService) {}

  /**
   * Get all refunds with filtering
   * GET /admin/refunds?status=pending
   */
  @Get()
  async getAllRefunds(@Query('status') status?: string) {
    try {
      return await this.refundsService.getAllRefunds(status);
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to fetch refunds',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Get refund details
   * GET /admin/refunds/:id
   */
  @Get(':id')
  async getRefundDetails(@Param('id') refundId: string) {
    try {
      return await this.refundsService.getRefundDetails(refundId);
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Refund not found',
        HttpStatus.NOT_FOUND,
      );
    }
  }

  /**
   * Create manual refund
   * POST /admin/refunds
   */
  @Post()
  async createRefund(
    @Body() data: any,
    @CurrentUser() user: any,
  ) {
    try {
      return await this.refundsService.createRefund(data, user.id);
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to create refund',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Process refund payment
   * POST /admin/refunds/:id/process
   */
  @Post(':id/process')
  async processRefund(
    @Param('id') refundId: string,
    @CurrentUser() user: any,
  ) {
    try {
      return await this.refundsService.processRefund(refundId, user.id);
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to process refund',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
