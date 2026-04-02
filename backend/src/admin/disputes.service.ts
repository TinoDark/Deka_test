import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';

@Injectable()
export class DisputesService {
  private readonly logger = new Logger('DisputesService');

  // In-memory store for disputes (in production, should use database)
  private disputes: Map<string, any> = new Map();
  private disputeIdCounter = 1;

  constructor(private prisma: PrismaService) {}

  private generateDisputeId(): string {
    return `DSP-${Date.now()}-${this.disputeIdCounter++}`;
  }

  async getAllDisputes(status?: string) {
    try {
      let filteredDisputes = Array.from(this.disputes.values());

      if (status) {
        filteredDisputes = filteredDisputes.filter(
          (d) => d.status.toLowerCase() === status.toLowerCase(),
        );
      }

      return {
        total: filteredDisputes.length,
        disputes: filteredDisputes.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
      };
    } catch (error: any) {
      this.logger.error(`Failed to get disputes: ${error.message}`);
      throw error;
    }
  }

  async getDisputeDetails(disputeId: string) {
    try {
      const dispute = this.disputes.get(disputeId);
      if (!dispute) {
        throw new Error('Dispute not found');
      }

      return dispute;
    } catch (error: any) {
      this.logger.error(`Failed to get dispute details: ${error.message}`);
      throw error;
    }
  }

  async createDispute(data: any, userId: string) {
    try {
      const disputeId = this.generateDisputeId();

      const dispute = {
        id: disputeId,
        orderId: data.orderId,
        customerId: userId,
        subject: data.subject,
        description: data.description,
        priority: data.priority || 'medium',
        status: 'open',
        resolution: null,
        notes: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        resolvedAt: null,
      };

      this.disputes.set(disputeId, dispute);
      this.logger.log(`Dispute created: ${disputeId}`);

      return dispute;
    } catch (error: any) {
      this.logger.error(`Failed to create dispute: ${error.message}`);
      throw error;
    }
  }

  async resolveDispute(
    disputeId: string,
    resolution: string,
    notes: string,
    adminId: string,
  ) {
    try {
      const dispute = this.disputes.get(disputeId);
      if (!dispute) {
        throw new Error('Dispute not found');
      }

      dispute.status = 'resolved';
      dispute.resolution = resolution;
      dispute.notes.push({
        author: adminId,
        text: notes,
        timestamp: new Date(),
      });
      dispute.updatedAt = new Date();
      dispute.resolvedAt = new Date();

      this.disputes.set(disputeId, dispute);
      this.logger.log(`Dispute resolved: ${disputeId}`);

      return dispute;
    } catch (error: any) {
      this.logger.error(`Failed to resolve dispute: ${error.message}`);
      throw error;
    }
  }

  async closeDispute(disputeId: string, reason: string) {
    try {
      const dispute = this.disputes.get(disputeId);
      if (!dispute) {
        throw new Error('Dispute not found');
      }

      dispute.status = 'closed';
      dispute.notes.push({
        author: 'system',
        text: `Dispute closed: ${reason}`,
        timestamp: new Date(),
      });
      dispute.updatedAt = new Date();

      this.disputes.set(disputeId, dispute);
      this.logger.log(`Dispute closed: ${disputeId}`);

      return dispute;
    } catch (error: any) {
      this.logger.error(`Failed to close dispute: ${error.message}`);
      throw error;
    }
  }
}
