import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';

@Injectable()
export class WalletService {
  private readonly logger = new Logger('WalletService');

  constructor(private prisma: PrismaService) {}

  async getBalance(userId: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          walletBalance: true,
          id: true,
          email: true,
        },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Calculate pending commission from orders
      const pendingOrders = await this.prisma.order.findMany({
        where: {
          resellerId: userId,
          status: 'PROCESSING',
        },
        select: { totalAmount: true },
      });

      const pendingCommission = pendingOrders.reduce(
        (sum, order) => sum + parseFloat(order.totalAmount.toString()),
        0,
      );

      return {
        userId: user.id,
        balance: user.walletBalance,
        pendingCommission: pendingCommission * 0.15, // 15% commission
        totalEarned: user.walletBalance,
        currency: 'XAF',
      };
    } catch (error: any) {
      this.logger.error(`Failed to get balance: ${error.message}`);
      throw error;
    }
  }

  async getTransactionHistory(userId: string) {
    try {
      const payments = await this.prisma.payment.findMany({
        where: { userId },
        include: { order: true },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      return {
        total: payments.length,
        transactions: payments.map((payment) => ({
          id: payment.id,
          orderId: payment.orderId,
          amount: payment.amount,
          status: payment.status,
          date: payment.createdAt,
          transactionId: payment.transactionId,
        })),
      };
    } catch (error: any) {
      this.logger.error(`Failed to get transaction history: ${error.message}`);
      throw error;
    }
  }

  async requestWithdrawal(userId: string, data: any) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { walletBalance: true },
      });

      if (!user) {
        throw new Error('User not found');
      }

      const amount = parseFloat(data.amount);
      const walletBalance = parseFloat(user.walletBalance.toString());
      if (amount <= 0 || amount > walletBalance) {
        throw new Error('Invalid withdrawal amount');
      }

      // Create payout request
      const payoutRequest = await this.prisma.payoutRequest.create({
        data: {
          userId,
          amount,
          mobileProvider: data.method || 'mobile_money',
          mobileNumber: data.phoneNumber,
          status: 'pending',
        },
      });

      // Deduct from wallet (optional - can be done after completing payout)
      // await this.prisma.user.update({
      //   where: { id: userId },
      //   data: { walletBalance: user.walletBalance - amount },
      // });

      this.logger.log(`Withdrawal requested: ${amount} for user ${userId}`);

      return {
        payoutId: payoutRequest.id,
        amount,
        status: 'pending',
        method: data.method,
        phoneNumber: data.phoneNumber,
        requestedAt: payoutRequest.createdAt,
        message: 'Withdrawal request submitted successfully',
      };
    } catch (error: any) {
      this.logger.error(`Withdrawal request failed: ${error.message}`);
      throw error;
    }
  }

  async getPayoutHistory(userId: string) {
    try {
      const payouts = await this.prisma.payoutRequest.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      return {
        total: payouts.length,
        payouts: payouts.map((payout) => ({
          id: payout.id,
          amount: payout.amount,
          status: payout.status,
          method: payout.mobileProvider,
          phoneNumber: payout.mobileNumber,
          requestedAt: payout.createdAt,
          processedAt: payout.processedAt,
          completedAt: payout.completedAt,
        })),
      };
    } catch (error: any) {
      this.logger.error(`Failed to get payout history: ${error.message}`);
      throw error;
    }
  }
}
