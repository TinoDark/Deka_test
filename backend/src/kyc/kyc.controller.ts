import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  UseGuards,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { KycService } from './kyc.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';

@Controller('kyc')
export class KycController {
  constructor(private kycService: KycService) {}

  /**
   * Submit KYC documents for user verification
   * POST /kyc/submit
   */
  @UseGuards(JwtAuthGuard)
  @Post('submit')
  async submitKyc(
    @CurrentUser() user: any,
    @Body() kycData: any,
  ) {
    try {
      return await this.kycService.submitKyc(user.id, kycData);
    } catch (error: any) {
      throw new HttpException(
        error.message || 'KYC submission failed',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Get KYC status for current user
   * GET /kyc/status
   */
  @UseGuards(JwtAuthGuard)
  @Get('status')
  async getKycStatus(@CurrentUser() user: any) {
    return await this.kycService.getKycStatus(user.id);
  }

  /**
   * List all pending KYC submissions (Admin only)
   * GET /kyc/pending
   */
  @UseGuards(JwtAuthGuard)
  @Roles('ADMIN')
  @Get('pending')
  async getPendingKyc() {
    return await this.kycService.getPendingKyc();
  }

  /**
   * Approve KYC submission (Admin only)
   * PUT /kyc/:userId/approve
   */
  @UseGuards(JwtAuthGuard)
  @Roles('ADMIN')
  @Put(':userId/approve')
  async approveKyc(
    @Param('userId') userId: string,
    @Body() data: { notes?: string },
  ) {
    try {
      return await this.kycService.approveKyc(userId, data.notes);
    } catch (error: any) {
      throw new HttpException(
        error.message || 'KYC approval failed',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Reject KYC submission (Admin only)
   * PUT /kyc/:userId/reject
   */
  @UseGuards(JwtAuthGuard)
  @Roles('ADMIN')
  @Put(':userId/reject')
  async rejectKyc(
    @Param('userId') userId: string,
    @Body() data: { reason: string },
  ) {
    try {
      return await this.kycService.rejectKyc(userId, data.reason);
    } catch (error: any) {
      throw new HttpException(
        error.message || 'KYC rejection failed',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Get KYC details by user ID (Admin only)
   * GET /kyc/:userId
   */
  @UseGuards(JwtAuthGuard)
  @Roles('ADMIN')
  @Get(':userId')
  async getKycDetails(@Param('userId') userId: string) {
    return await this.kycService.getKycDetails(userId);
  }
}
