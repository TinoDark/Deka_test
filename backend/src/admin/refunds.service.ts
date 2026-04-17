import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';

@Injectable()
export class RefundsService {
  private readonly logger = new Logger('RefundsService');

  constructor(private prisma: PrismaService) {}

  async getAllRefunds(status?: string) {
    try {
      let query: any = {};
      if (status) {
        query.status = status;
      }

      const refunds = await this.prisma.refund.findMany({
        where: query,
        include: {
          user: { select: { email: true, firstName: true, lastName: true } },
          payment: { select: { amount: true, transactionId: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });

      return {
        total: refunds.length,
        refunds: refunds.map((r) => ({
          id: r.id,
          userId: r.userId,
          user: r.user,
          paymentId: r.paymentId,
          amount: r.amount,
          reason: r.reason,
          status: r.status,
          createdAt: r.createdAt,
          processedAt: r.processedAt,
          notes: r.notes,
        })),
      };
    } catch (error: any) {
      this.logger.error(`Failed to get refunds: ${error.message}`);
      throw error;
    }
  }

  async getRefundDetails(refundId: string) {
    try {
      const refund = await this.prisma.refund.findUnique({
        where: { id: refundId },
        include: {
          user: true,
          payment: true,
          payoutRequest: true,
        },
      });

      if (!refund) {
        throw new Error('Refund not found');
      }

      return refund;
    } catch (error: any) {
      this.logger.error(`Failed to get refund details: ${error.message}`);
      throw error;
    }
  }

  async createRefund(data: any, adminId: string) {
    try {
      // Verify payment exists
      const payment = await this.prisma.payment.findUnique({
        where: { id: data.paymentId },
      });

      if (!payment) {
        throw new Error('Payment not found');
      }

      if (!payment.userId) {
        throw new Error('Refund payment is not associated with a user');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: payment.userId },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Check refund amount doesn't exceed payment amount
      const amount = parseFloat(data.amount);
      if (amount <= 0 || amount > parseFloat(payment.amount.toString())) {
        throw new Error('Invalid refund amount');
      }

      // Create refund record
      const refund = await this.prisma.refund.create({
        data: {
          userId: payment.userId,
          paymentId: data.paymentId,
          amount: data.amount,
          reason: data.reason,
          adminId,
          status: 'pending',
          notes: data.notes,
        },
      });

      this.logger.log(`Refund created: ${refund.id} for user ${payment.userId}`);

      return {
        id: refund.id,
        amount: refund.amount,
        status: refund.status,
        createdAt: refund.createdAt,
        message: 'Refund created successfully and awaiting processing',
      };
    } catch (error: any) {
      this.logger.error(`Failed to create refund: ${error.message}`);
      throw error;
    }
  }

  async processRefund(refundId: string, adminId: string) {
    try {
      const refund = await this.prisma.refund.findUnique({
        where: { id: refundId },
        include: { user: true },
      });

      if (!refund) {
        throw new Error('Refund not found');
      }

      if (refund.status !== 'pending') {
        throw new Error(`Cannot process refund with status: ${refund.status}`);
      }

      // Create payout request for refund
      const payoutRequest = await this.prisma.payoutRequest.create({
        data: {
          userId: refund.userId,
          amount: refund.amount,
          mobileProvider: 'Mobile Money',
          mobileNumber: refund.user.phone || '',
          status: 'pending',
        },
      });

      // Update refund status
      const updatedRefund = await this.prisma.refund.update({
        where: { id: refundId },
        data: {
          status: 'completed',
          processedAt: new Date(),
          payoutRequestId: payoutRequest.id,
        },
      });

      // Add credit back to wallet
      await this.prisma.user.update({
        where: { id: refund.userId },
        data: {
          walletBalance: {
            increment: refund.amount,
          },
        },
      });

      this.logger.log(`Refund processed: ${refundId}`);

      return {
        id: updatedRefund.id,
        status: updatedRefund.status,
        payoutId: payoutRequest.id,
        processedAt: updatedRefund.processedAt,
        message: 'Refund processed successfully',
      };
    } catch (error: any) {
      this.logger.error(`Failed to process refund: ${error.message}`);
      throw error;
    }
  }
}
