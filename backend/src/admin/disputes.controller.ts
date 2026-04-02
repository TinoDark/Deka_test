import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { DisputesService } from './disputes.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';

@Controller('admin/disputes')
@UseGuards(JwtAuthGuard)
@Roles('ADMIN')
export class DisputesController {
  constructor(private disputesService: DisputesService) {}

  /**
   * Get all disputes with optional filtering
   * GET /admin/disputes?status=open
   */
  @Get()
  async getAllDisputes(@Query('status') status?: string) {
    try {
      return await this.disputesService.getAllDisputes(status);
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to fetch disputes',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Get dispute details
   * GET /admin/disputes/:id
   */
  @Get(':id')
  async getDisputeDetails(@Param('id') disputeId: string) {
    try {
      return await this.disputesService.getDisputeDetails(disputeId);
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Dispute not found',
        HttpStatus.NOT_FOUND,
      );
    }
  }

  /**
   * Create new dispute (from customer)
   * POST /admin/disputes
   */
  @Post()
  async createDispute(
    @Body() data: any,
    @CurrentUser() user: any,
  ) {
    try {
      return await this.disputesService.createDispute(data, user.id);
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to create dispute',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Resolve dispute
   * PUT /admin/disputes/:id/resolve
   */
  @Put(':id/resolve')
  async resolveDispute(
    @Param('id') disputeId: string,
    @Body() data: any,
    @CurrentUser() user: any,
  ) {
    try {
      return await this.disputesService.resolveDispute(
        disputeId,
        data.resolution,
        data.notes,
        user.id,
      );
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to resolve dispute',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Close dispute
   * PUT /admin/disputes/:id/close
   */
  @Put(':id/close')
  async closeDispute(
    @Param('id') disputeId: string,
    @Body() data: any,
  ) {
    try {
      return await this.disputesService.closeDispute(disputeId, data.reason);
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to close dispute',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
