import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { Decimal } from 'decimal.js';
import * as crypto from 'crypto';
import { PayGateGlobalService } from './paygateglobal.service';

export interface PaymentCallbackDto {
  idempotencyKey: string;
  orderId: string;
  amount: number;
  status: 'COMPLETED' | 'FAILED' | 'PENDING';
  provider: 'mix_by_yas' | 'MOOV_MONEY' | 'PAYGATEGLOBAL';
  transactionId?: string;
  callbackData?: string;
  signature?: string;
}

export interface RefundRequestDto {
  paymentId: string;
  reason: string;
  amount?: number; // Partial refund if specified
}

export interface PayoutRequestDto {
  amount: number;
  mobileProvider: 'mix_by_yas' | 'MOOV_MONEY' | 'PAYGATEGLOBAL';
  mobileNumber: string;
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger('PaymentsService');
  private readonly webhookSecret = this.configService.get<string>(
    'PAYMENT_WEBHOOK_SECRET',
  );

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private payGateGlobalService: PayGateGlobalService,
  ) {}

  /**
   * ============================================================================
   * CALLBACK WEBHOOK (Mobile Money → Platform)
   * ============================================================================
   * Handles idempotent payment callbacks from Mobile Money providers.
   * Uses idempotencyKey to prevent double-charging.
   *
   * Flow:
   * 1. Verify webhook signature
   * 2. Check if idempotencyKey already processed (return cached result)
   * 3. Fetch order and validate amount
   * 4. Create Payment record + release escrow in SINGLE transaction
   * 5. Emit WebSocket event to update frontend
   */
  async handlePaymentCallback(
    dto: PaymentCallbackDto,
  ): Promise<{
    id: string;
    status: string;
    orderId: string;
    isNewPayment: boolean;
  }> {
    this.logger.log(
      `[handlePaymentCallback] idempotencyKey=${dto.idempotencyKey}, orderId=${dto.orderId}`,
    );

    // ✅ STEP 1: Verify webhook signature (if provided)
    if (dto.signature) {
      this.verifyWebhookSignature(dto);
    }

    // ✅ STEP 2: Check if already processed (idempotency)
    const existingPayment = await this.prisma.payment.findUnique({
      where: { idempotencyKey: dto.idempotencyKey },
      select: {
        id: true,
        status: true,
        orderId: true,
      },
    });

    if (existingPayment) {
      this.logger.warn(
        `[handlePaymentCallback] Duplicate callback detected. idempotencyKey=${dto.idempotencyKey}`,
      );
      return {
        ...existingPayment,
        isNewPayment: false,
      };
    }

    // ✅ STEP 3: Validate order exists
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      include: {
        items: true,
        reseller: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order ${dto.orderId} not found`);
    }

    if (!order.resellerId) {
      throw new BadRequestException(`Order ${dto.orderId} has no reseller attached`);
    }

    // ✅ STEP 4: Validate amount matches
    if (
      new Decimal(dto.amount).toNumber() !== order.totalAmount.toNumber()
    ) {
      throw new BadRequestException(
        `Amount mismatch: expected ${order.totalAmount}, got ${dto.amount}`,
      );
    }

    // ✅ STEP 5: Create Payment + Release Escrow (ATOMIC TRANSACTION)
    const payment = await this.prisma.$transaction(async (tx: any) => {
      // Create payment record
      const newPayment = await tx.payment.create({
        data: {
          orderId: dto.orderId,
          userId: order.resellerId || '',
          amount: new Decimal(dto.amount),
          status: dto.status === 'COMPLETED' ? 'COMPLETED' : 'FAILED',
          provider: dto.provider,
          transactionId: dto.transactionId,
          idempotencyKey: dto.idempotencyKey,
          callbackData: dto.callbackData
            ? JSON.stringify(dto.callbackData)
            : null,
        },
        select: {
          id: true,
          status: true,
          orderId: true,
        },
      });

      // If COMPLETED: Update order status + release escrow
      if (dto.status === 'COMPLETED') {
        await tx.order.update({
          where: { id: dto.orderId },
          data: {
            status: 'PAID',
            escrowBalance: new Decimal(0),
          },
        });

        this.logger.log(
          `[handlePaymentCallback] ✅ Payment completed. orderId=${dto.orderId}, paymentId=${newPayment.id}`,
        );
      } else {
        // FAILED: Mark order as cancelled
        await tx.order.update({
          where: { id: dto.orderId },
          data: {
            status: 'CANCELLED',
            escrowBalance: new Decimal(0),
          },
        });

        this.logger.warn(
          `[handlePaymentCallback] ❌ Payment failed. orderId=${dto.orderId}`,
        );
      }

      return newPayment;
    });

    return {
      ...payment,
      isNewPayment: true,
    };
  }

  /**
   * ============================================================================
   * INITIATE PAYGATEGLOBAL PAYMENT
   * ============================================================================
   * Initiates a payment request to PayGateGlobal for FLOOZ/TMONEY.
   *
   * Flow:
   * 1. Validate order exists and is PENDING
   * 2. Generate unique tx_reference
   * 3. Call PayGateGlobal API (direct or payment page)
   * 4. Return payment URL or direct response
   */
  async initiatePayGateGlobalPayment(
    orderId: string,
    paymentMethod: 'direct' | 'payment_page' = 'payment_page',
  ): Promise<{
    success: boolean;
    paymentUrl?: string;
    txReference?: string;
    error?: string;
  }> {
    this.logger.log(
      `[initiatePayGateGlobalPayment] orderId=${orderId}, method=${paymentMethod}`,
    );

    // ✅ STEP 1: Validate order
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        reseller: true,
        items: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    if (order.status !== 'PENDING') {
      throw new BadRequestException(
        `Order status must be PENDING, current: ${order.status}`,
      );
    }

    // ✅ STEP 2: Generate unique tx_reference
    const txReference = `PGG-${orderId}-${Date.now()}`;

    try {
      // ✅ STEP 3: Call PayGateGlobal service
      if (paymentMethod === 'direct') {
        // For direct payment, we need phone number from user profile
        // This would typically come from the request body
        throw new BadRequestException(
          'Direct payment requires phone number. Use payment_page method instead.',
        );
      } else {
        // Payment page method - redirect user to PayGateGlobal hosted page
        const callbackUrl =
          this.configService.get<string>('PAYGATEGLOBAL_CALLBACK_URL') ||
          this.payGateGlobalService.getDefaultCallbackUrl();

        const paymentUrl = await this.payGateGlobalService.generatePaymentPageUrl({
          amount: order.totalAmount.toNumber(),
          description: `DEKA Order ${orderId}`,
          identifier: txReference,
          url: callbackUrl,
        });

        this.logger.log(
          `[initiatePayGateGlobalPayment] ✅ Payment page URL generated. txReference=${txReference}`,
        );

        this.logger.log(
          `[initiatePayGateGlobalPayment] Using callback URL: ${callbackUrl}`,
        );

        return {
          success: true,
          paymentUrl,
          txReference,
        };
      }
    } catch (error) {
      this.logger.error(
        `[initiatePayGateGlobalPayment] ❌ Failed to initiate payment. txReference=${txReference}`,
        error,
      );

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to initiate PayGateGlobal payment',
      };
    }
  }

  /**
   * ============================================================================
   * HANDLE PAYGATEGLOBAL CALLBACK
   * ============================================================================
   * Processes webhook callbacks from PayGateGlobal payment gateway.
   *
   * Expected callback data structure:
   * {
   *   "tx_reference": "PGG-order123-1234567890",
   *   "status": "SUCCESS" | "FAILED" | "PENDING",
   *   "amount": 1000,
   *   "currency": "XOF",
   *   "phone_number": "22890123456",
   *   "payment_type": "FLOOZ" | "TMONEY",
   *   "transaction_id": "TXN123456",
   *   "payment_date": "2024-01-01 12:00:00"
   * }
   */
  async handlePayGateGlobalCallback(callbackData: any): Promise<{
    success: boolean;
    orderId?: string;
    paymentId?: string;
    error?: string;
  }> {
    this.logger.log(
      `[handlePayGateGlobalCallback] tx_reference=${callbackData.tx_reference}, status=${callbackData.status}`,
    );

    try {
      // ✅ STEP 1: Process callback data using PayGateGlobal service
      const processedData = this.payGateGlobalService.processCallback(callbackData);

      // ✅ STEP 2: Extract order ID from tx_reference (format: PGG-{orderId}-{timestamp})
      const txReferenceParts = processedData.txReference.split('-');
      if (txReferenceParts.length < 3 || txReferenceParts[0] !== 'PGG') {
        throw new BadRequestException(`Invalid tx_reference format: ${processedData.txReference}`);
      }
      const orderId = txReferenceParts.slice(1, -1).join('-'); // Handle order IDs with hyphens

      // ✅ STEP 3: Process payment callback using existing logic
      const result = await this.handlePaymentCallback({
        idempotencyKey: processedData.txReference,
        orderId,
        amount: processedData.amount,
        status: processedData.status,
        provider: 'PAYGATEGLOBAL',
        transactionId: processedData.identifier,
        callbackData: JSON.stringify(callbackData),
      });

      this.logger.log(
        `[handlePayGateGlobalCallback] ✅ Callback processed. orderId=${orderId}, paymentId=${result.id}`,
      );

      return {
        success: true,
        orderId,
        paymentId: result.id,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to process PayGateGlobal callback';
      this.logger.error(
        `[handlePayGateGlobalCallback] ❌ Callback processing failed`,
        error,
      );

      return {
        success: false,
        error: errorMsg,
      };
    }
  }

  /**
   * ============================================================================
   * GET PAYMENT DETAILS
   * ============================================================================
   */
  async getPaymentById(paymentId: string, userId?: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        order: {
          select: {
            id: true,
            status: true,
            totalAmount: true,
            resellerId: true,
            createdAt: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException(`Payment ${paymentId} not found`);
    }

    // Authorization check (if userId provided)
    if (userId && payment.userId !== userId) {
      throw new BadRequestException('Unauthorized to access this payment');
    }

    return payment;
  }

  /**
   * ============================================================================
   * LIST PAYMENTS (Paginated with filters)
   * ============================================================================
   */
  async listPayments(
    userId?: string,
    status?: string,
    limit: number = 50,
    offset: number = 0,
  ) {
    const where: any = {};
    if (userId) where.userId = userId;
    if (status) where.status = status;

    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        select: {
          id: true,
          orderId: true,
          amount: true,
          status: true,
          provider: true,
          createdAt: true,
          order: {
            select: { id: true, status: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.payment.count({ where }),
    ]);

    return { payments, total, limit, offset };
  }

  /**
   * ============================================================================
   * REFUND PAYMENT
   * ============================================================================
   * Process refunds with proper wallet credit and journal entry.
   *
   * Flow:
   * 1. Validate payment is COMPLETED
   * 2. Create Refund record
   * 3. Debit escrow (if applicable)
   * 4. Credit user wallet (commission refund)
   * 5. Create journal entry (audit trail)
   */
  async refundPayment(
    paymentId: string,
    dto: RefundRequestDto,
    adminId: string,
  ): Promise<any> {
    this.logger.log(
      `[refundPayment] paymentId=${paymentId}, reason=${dto.reason}`,
    );

    // ✅ STEP 1: Get payment
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        order: {
          include: {
            items: true,
          },
        },
        user: true,
      },
    });

    if (!payment) {
      throw new NotFoundException(`Payment ${paymentId} not found`);
    }

    if (payment.status !== 'COMPLETED') {
      throw new UnprocessableEntityException(
        `Cannot refund payment with status ${payment.status}`,
      );
    }

    // ✅ STEP 2: Calculate refund amount (full or partial)
    const refundAmount = dto.amount
      ? new Decimal(dto.amount)
      : payment.amount;

    if (refundAmount.greaterThan(payment.amount)) {
      throw new BadRequestException(
        `Refund amount ${refundAmount} exceeds payment ${payment.amount}`,
      );
    }

    // ✅ STEP 3: Process refund in transaction
    const refund = await this.prisma.$transaction(async (tx: any) => {
      // Create refund record
      const newRefund = await tx.refund.create({
        data: {
          userId: payment.userId,
          amount: refundAmount,
          reason: dto.reason,
          adminId, // Track who authorized the refund
          paymentId,
        },
        select: {
          id: true,
          amount: true,
          createdAt: true,
        },
      });

      // Credit user wallet
      await tx.user.update({
        where: { id: payment.userId },
        data: {
          walletBalance: {
            increment: refundAmount,
          },
        },
      });

      // Update order back to pending if partial refund, or cancelled if full
      if (refundAmount.equals(payment.amount)) {
        await tx.order.update({
          where: { id: payment.orderId },
          data: {
            status: 'CANCELLED',
          },
        });
      }

      // Log in audit trail
      await tx.paymentAudit.create({
        data: {
          paymentId,
          action: 'REFUND',
          amount: refundAmount,
          performedBy: adminId,
          details: JSON.stringify({
            reason: dto.reason,
            orderId: payment.orderId,
          }),
        },
      });

      this.logger.log(
        `[refundPayment] ✅ Refund created. refundId=${newRefund.id}, amount=${refundAmount}`,
      );

      return newRefund;
    });

    return refund;
  }

  /**
   * ============================================================================
   * PAYOUT REQUEST (Revendeur withdrawal)
   * ============================================================================
   * Process withdrawal request from revendeur wallet to Mobile Money.
   *
   * Flow:
   * 1. Validate KYC status (APPROVED)
   * 2. Validate wallet balance >= amount
   * 3. Create PayoutRequest
   * 4. Debit wallet (mark as pending)
   * 5. Queue for Mobile Money API call (async)
   */
  async createPayoutRequest(
    userId: string,
    dto: PayoutRequestDto,
  ): Promise<any> {
    this.logger.log(
      `[createPayoutRequest] userId=${userId}, amount=${dto.amount}`,
    );

    // ✅ STEP 1: Get user and validate KYC
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        walletBalance: true,
        kycStatus: true,
        email: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.kycStatus !== 'APPROVED') {
      throw new BadRequestException(
        `KYC status must be APPROVED, current: ${user.kycStatus}`,
      );
    }

    // ✅ STEP 2: Validate balance
    const amount = new Decimal(dto.amount);
    if (user.walletBalance.lessThan(amount)) {
      throw new BadRequestException(
        `Insufficient balance. Available: ${user.walletBalance}, Requested: ${amount}`,
      );
    }

    // ✅ STEP 3: Create payout request in transaction
    const payout = await this.prisma.$transaction(async (tx: any) => {
      const newPayout = await tx.payoutRequest.create({
        data: {
          userId,
          amount,
          status: 'PENDING',
          mobileProvider: dto.mobileProvider,
          mobileNumber: dto.mobileNumber,
        },
        select: {
          id: true,
          amount: true,
          status: true,
          createdAt: true,
        },
      });

      // Debit wallet (mark as in-progress)
      await tx.user.update({
        where: { id: userId },
        data: {
          walletBalance: {
            decrement: amount,
          },
        },
      });

      this.logger.log(
        `[createPayoutRequest] ✅ Payout created. payoutId=${newPayout.id}`,
      );

      return newPayout;
    });

    // TODO: Queue async task to send to Mobile Money provider
    // await this.queuePayoutJob(payout.id, dto);

    return payout;
  }

  /**
   * ============================================================================
   * HANDLE PAYOUT CALLBACK (Mobile Money confirms transfer)
   * ============================================================================
   * Updates payout status when Mobile Money completes the transfer.
   */
  async handlePayoutCallback(
    payoutId: string,
    dto: {
      status: 'COMPLETED' | 'FAILED';
      transactionId?: string;
      errorMessage?: string;
    },
  ) {
    this.logger.log(
      `[handlePayoutCallback] payoutId=${payoutId}, status=${dto.status}`,
    );

    const payout = await this.prisma.payoutRequest.findUnique({
      where: { id: payoutId },
      select: {
        id: true,
        userId: true,
        amount: true,
        status: true,
      },
    });

    if (!payout) {
      throw new NotFoundException(`Payout ${payoutId} not found`);
    }

    if (payout.status !== 'PENDING') {
      this.logger.warn(
        `[handlePayoutCallback] Payout already processed. payoutId=${payoutId}`,
      );
      return payout;
    }

    // Update payout status
    const updated = await this.prisma.$transaction(async (tx: any) => {
      const updatedPayout = await tx.payoutRequest.update({
        where: { id: payoutId },
        data: {
          status: dto.status,
          payoutId: dto.transactionId,
          processedAt: new Date(),
          completedAt: dto.status === 'COMPLETED' ? new Date() : null,
        },
        select: {
          id: true,
          status: true,
          amount: true,
        },
      });

      // If FAILED: credit back to wallet
      if (dto.status === 'FAILED') {
        await tx.user.update({
          where: { id: payout.userId },
          data: {
            walletBalance: {
              increment: payout.amount,
            },
          },
        });

        this.logger.warn(
          `[handlePayoutCallback] Payout failed, credited back to wallet. userId=${payout.userId}`,
        );
      } else {
        this.logger.log(
          `[handlePayoutCallback] ✅ Payout completed. payoutId=${payoutId}`,
        );
      }

      return updatedPayout;
    });

    return updated;
  }

  /**
   * ============================================================================
   * LIST PAYOUTS
   * ============================================================================
   */
  async listPayouts(
    userId: string,
    status?: string,
    limit: number = 50,
    offset: number = 0,
  ) {
    const where: any = { userId };
    if (status) where.status = status;

    const [payouts, total] = await Promise.all([
      this.prisma.payoutRequest.findMany({
        where,
        select: {
          id: true,
          amount: true,
          status: true,
          mobileProvider: true,
          mobileNumber: true,
          createdAt: true,
          completedAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.payoutRequest.count({ where }),
    ]);

    return { payouts, total, limit, offset };
  }

  /**
   * ============================================================================
   * UTILITY METHODS
   * ============================================================================
   */

  /**
   * Verify webhook signature from Mobile Money provider
   */
  private verifyWebhookSignature(dto: PaymentCallbackDto) {
    if (!this.webhookSecret) {
      this.logger.warn(
        'PAYMENT_WEBHOOK_SECRET not configured, skipping signature verification',
      );
      return;
    }

    if (!dto.signature) {
      throw new BadRequestException('Webhook signature required');
    }

    // Create payload for signature verification
    const payload = `${dto.orderId}:${dto.amount}:${dto.status}`;
    const expectedSignature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(payload)
      .digest('hex');

    if (dto.signature !== expectedSignature) {
      throw new BadRequestException('Invalid webhook signature');
    }

    this.logger.log(
      '[verifyWebhookSignature] ✅ Signature verified successfully',
    );
  }

  /**
   * Calculate commission splits (for order items)
   */
  async calculateCommission(orderId: string): Promise<any> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: {
              select: {
                commission: true,
                supplierId: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    // Group by supplier
    const commissions: Record<string, Decimal> = {};
    for (const item of order.items) {
      const supplierId = item.product.supplierId;
      if (!commissions[supplierId]) {
        commissions[supplierId] = new Decimal(0);
      }
      commissions[supplierId] = commissions[supplierId].plus(
        item.product.commission,
      );
    }

    return commissions;
  }
}
