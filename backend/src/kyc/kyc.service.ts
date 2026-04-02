import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';

@Injectable()
export class KycService {
  private readonly logger = new Logger('KycService');

  constructor(private prisma: PrismaService) {}

  async submitKyc(userId: string, kycData: any) {
    try {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new Error('User not found');
      }

      // Store KYC document URL and set status to PENDING for review
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: {
          kycDocument: kycData.documentUrl || kycData.document,
          kycStatus: 'PENDING',
        },
      });

      this.logger.log(`KYC submitted for user ${userId}`);
      return {
        message: 'KYC submission received for review',
        status: 'PENDING',
        submittedAt: new Date(),
      };
    } catch (error: any) {
      this.logger.error(`KYC submission failed: ${error.message}`);
      throw error;
    }
  }

  async getKycStatus(userId: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          kycStatus: true,
          kycDocument: true,
          updatedAt: true,
        },
      });

      if (!user) {
        throw new Error('User not found');
      }

      return {
        status: user.kycStatus,
        documentUrl: user.kycDocument,
        lastUpdated: user.updatedAt,
      };
    } catch (error: any) {
      this.logger.error(`Failed to get KYC status: ${error.message}`);
      throw error;
    }
  }

  async getPendingKyc() {
    try {
      const pendingUsers = await this.prisma.user.findMany({
        where: { kycStatus: 'PENDING' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          kycStatus: true,
          kycDocument: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'asc' },
      });

      return {
        total: pendingUsers.length,
        users: pendingUsers,
      };
    } catch (error: any) {
      this.logger.error(`Failed to get pending KYC: ${error.message}`);
      throw error;
    }
  }

  async approveKyc(userId: string, notes?: string) {
    try {
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: {
          kycStatus: 'APPROVED',
          updatedAt: new Date(),
        },
      });

      this.logger.log(`KYC approved for user ${userId}`);
      return {
        message: 'KYC approved successfully',
        userId,
        status: 'APPROVED',
        approvedAt: new Date(),
        adminNotes: notes,
      };
    } catch (error: any) {
      this.logger.error(`KYC approval failed: ${error.message}`);
      throw error;
    }
  }

  async rejectKyc(userId: string, reason: string) {
    try {
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: {
          kycStatus: 'REJECTED',
          updatedAt: new Date(),
        },
      });

      this.logger.log(`KYC rejected for user ${userId}`);
      return {
        message: 'KYC rejected',
        userId,
        status: 'REJECTED',
        reason,
        rejectedAt: new Date(),
      };
    } catch (error: any) {
      this.logger.error(`KYC rejection failed: ${error.message}`);
      throw error;
    }
  }

  async getKycDetails(userId: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          kycStatus: true,
          kycDocument: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        throw new Error('User not found');
      }

      return user;
    } catch (error: any) {
      this.logger.error(`Failed to get KYC details: ${error.message}`);
      throw error;
    }
  }
}
