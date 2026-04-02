import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@Controller('wallet')
export class WalletController {
  constructor(private walletService: WalletService) {}

  /**
   * Get wallet balance for current user
   * GET /wallet/balance
   */
  @UseGuards(JwtAuthGuard)
  @Get('balance')
  async getBalance(@CurrentUser() user: any) {
    try {
      return await this.walletService.getBalance(user.id);
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to fetch balance',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Get transaction history
   * GET /wallet/history
   */
  @UseGuards(JwtAuthGuard)
  @Get('history')
  async getHistory(@CurrentUser() user: any) {
    try {
      return await this.walletService.getTransactionHistory(user.id);
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to fetch history',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Request withdrawal/payout
   * POST /wallet/withdraw
   */
  @UseGuards(JwtAuthGuard)
  @Post('withdraw')
  async requestWithdrawal(
    @CurrentUser() user: any,
    @Body() data: any,
  ) {
    try {
      return await this.walletService.requestWithdrawal(user.id, data);
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Withdrawal request failed',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Get payout history
   * GET /wallet/payouts
   */
  @UseGuards(JwtAuthGuard)
  @Get('payouts')
  async getPayoutHistory(@CurrentUser() user: any) {
    try {
      return await this.walletService.getPayoutHistory(user.id);
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to fetch payouts',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
