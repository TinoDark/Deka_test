import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { Public } from '@/common/decorators/public.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/rbac.guard';
import { Roles } from '@/common/decorators/roles.decorator';

@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger('PaymentsController');

  constructor(private paymentsService: PaymentsService) {}

  /**
   * ============================================================================
   * WEBHOOK ENDPOINT — Payment Callback from Mobile Money Provider
   * ============================================================================
   * POST /payments/callback
   *
   * This endpoint receives payment confirmations from Mobile Money providers
   * (MTN, Orange Money, Wave, etc.). It is:
   * - PUBLIC (no auth required, but signature verified)
   * - IDEMPOTENT (uses idempotencyKey to prevent double-charging)
   * - ATOMIC (creates Payment + updates Order + releases Escrow in one transaction)
   *
   * Request:
   * {
   *   "idempotencyKey": "unique-key-from-provider",
   *   "orderId": "order-uuid",
   *   "amount": 1198,
   *   "status": "COMPLETED",
   *   "provider": "MTN",
   *   "transactionId": "MTN-TXN-123456",
   *   "signature": "sha256-hex-string"
   * }
   *
   * Response 201:
   * {
   *   "id": "payment-uuid",
   *   "status": "COMPLETED",
   *   "orderId": "order-uuid",
   *   "isNewPayment": true
   * }
   */
  @Public()
  @Post('callback')
  @HttpCode(201)
  async handlePaymentCallback(
    @Body()
    body: {
      idempotencyKey: string;
      orderId: string;
      amount: number;
      status: 'COMPLETED' | 'FAILED' | 'PENDING';
      provider: 'MTN' | 'ORANGE' | 'WAVE';
      transactionId?: string;
      callbackData?: string;
      signature?: string;
    },
  ) {
    try {
      this.logger.log(
        `[handlePaymentCallback] Received callback: orderId=${body.orderId}, idempotencyKey=${body.idempotencyKey}`,
      );

      const result = await this.paymentsService.handlePaymentCallback(body);

      this.logger.log(
        `[handlePaymentCallback] ✅ Payment processed: paymentId=${result.id}, isNewPayment=${result.isNewPayment}`,
      );

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      this.logger.error(
        `[handlePaymentCallback] ❌ Error: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * ============================================================================
   * GET PAYMENT DETAILS
   * ============================================================================
   * GET /payments/:id
   *
   * Retrieve details of a specific payment.
   * Protected: User can only see their own payments (RBAC enforced in service)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get(':id')
  async getPaymentById(
    @Param('id') paymentId: string,
    @CurrentUser() user: any,
  ) {
    try {
      const payment = await this.paymentsService.getPaymentById(
        paymentId,
        user.id,
      );

      return {
        success: true,
        data: payment,
      };
    } catch (error) {
      this.logger.error(`[getPaymentById] Error: ${error.message}`);
      throw error;
    }
  }

  /**
   * ============================================================================
   * LIST PAYMENTS (Paginated)
   * ============================================================================
   * GET /payments?status=COMPLETED&limit=50&offset=0
   *
   * List all payments for the authenticated user (reseller/supplier).
   * Supports filtering by status and pagination.
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('RESELLER', 'SUPPLIER', 'ADMIN')
  @Get()
  async listPayments(
    @Query('status') status?: string,
    @Query('limit') limitStr?: string,
    @Query('offset') offsetStr?: string,
    @CurrentUser() user?: any,
  ) {
    try {
      const limit = Math.min(parseInt(limitStr || '50'), 500);
      const offset = parseInt(offsetStr || '0');

      // Admin can see all payments, users see only their own
      const userId = user.role === 'ADMIN' ? undefined : user.id;

      const result = await this.paymentsService.listPayments(
        userId,
        status,
        limit,
        offset,
      );

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      this.logger.error(`[listPayments] Error: ${error.message}`);
      throw error;
    }
  }

  /**
   * ============================================================================
   * REFUND PAYMENT
   * ============================================================================
   * POST /payments/:id/refund
   *
   * Process a refund for a completed payment.
   * Protected: Only ADMIN can refund payments
   *
   * Request:
   * {
   *   "reason": "Customer requested cancellation",
   *   "amount": 1198  // Optional: partial refund amount
   * }
   *
   * Response:
   * {
   *   "id": "refund-uuid",
   *   "amount": 1198,
   *   "createdAt": "2026-03-26T10:30:00Z"
   * }
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post(':id/refund')
  @HttpCode(201)
  async refundPayment(
    @Param('id') paymentId: string,
    @Body()
    body: {
      reason: string;
      amount?: number;
    },
    @CurrentUser() admin: any,
  ) {
    try {
      this.logger.log(
        `[refundPayment] Admin ${admin.id} requesting refund for payment ${paymentId}`,
      );

      const refund = await this.paymentsService.refundPayment(
        paymentId,
        {
          paymentId,
          reason: body.reason,
          amount: body.amount,
        },
        admin.id,
      );

      this.logger.log(
        `[refundPayment] ✅ Refund created: refundId=${refund.id}`,
      );

      return {
        success: true,
        data: refund,
      };
    } catch (error) {
      this.logger.error(`[refundPayment] Error: ${error.message}`);
      throw error;
    }
  }

  /**
   * ============================================================================
   * CREATE PAYOUT REQUEST (Wallet → Mobile Money)
   * ============================================================================
   * POST /payments/payouts
   *
   * Request withdrawal from wallet to Mobile Money account.
   * Protected: Authenticated users (REVENDEUR primarily)
   *
   * Request:
   * {
   *   "amount": 50000,
   *   "mobileProvider": "MTN",
   *   "mobileNumber": "+33612345678"
   * }
   *
   * Response 201:
   * {
   *   "id": "payout-uuid",
   *   "amount": 50000,
   *   "status": "PENDING",
   *   "createdAt": "2026-03-26T10:30:00Z"
   * }
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('RESELLER', 'SUPPLIER')
  @Post('payouts')
  @HttpCode(201)
  async createPayoutRequest(
    @Body()
    body: {
      amount: number;
      mobileProvider: 'MTN' | 'ORANGE' | 'WAVE';
      mobileNumber: string;
    },
    @CurrentUser() user: any,
  ) {
    try {
      this.logger.log(
        `[createPayoutRequest] User ${user.id} requesting payout: ${body.amount}`,
      );

      // Validate phone number format
      if (!body.mobileNumber || !/^\+?[\d\s\-()]+$/.test(body.mobileNumber)) {
        throw new HttpException(
          'Invalid mobile number format',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Validate amount
      if (body.amount <= 0) {
        throw new HttpException(
          'Payout amount must be positive',
          HttpStatus.BAD_REQUEST,
        );
      }

      const payout = await this.paymentsService.createPayoutRequest(
        user.id,
        body,
      );

      this.logger.log(
        `[createPayoutRequest] ✅ Payout created: payoutId=${payout.id}`,
      );

      return {
        success: true,
        data: payout,
        message: 'Payout request created. It will be processed shortly.',
      };
    } catch (error) {
      this.logger.error(`[createPayoutRequest] Error: ${error.message}`);
      throw error;
    }
  }

  /**
   * ============================================================================
   * LIST PAYOUTS
   * ============================================================================
   * GET /payments/payouts?status=PENDING&limit=50&offset=0
   *
   * List all payout requests for the authenticated user.
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('RESELLER', 'SUPPLIER')
  @Get('payouts')
  async listPayouts(
    @Query('status') status?: string,
    @Query('limit') limitStr?: string,
    @Query('offset') offsetStr?: string,
    @CurrentUser() user?: any,
  ) {
    try {
      const limit = Math.min(parseInt(limitStr || '50'), 500);
      const offset = parseInt(offsetStr || '0');

      const result = await this.paymentsService.listPayouts(
        user.id,
        status,
        limit,
        offset,
      );

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      this.logger.error(`[listPayouts] Error: ${error.message}`);
      throw error;
    }
  }

  /**
   * ============================================================================
   * HANDLE PAYOUT CALLBACK — Mobile Money confirms transfer
   * ============================================================================
   * POST /payments/payouts/:id/callback
   *
   * Called by Mobile Money provider to confirm payout completion/failure.
   * This is PUBLIC but signature-verified (like payment callback).
   * IDEMPOTENT: if already processed, returns existing result.
   */
  @Public()
  @Post('payouts/:id/callback')
  @HttpCode(200)
  async handlePayoutCallback(
    @Param('id') payoutId: string,
    @Body()
    body: {
      status: 'COMPLETED' | 'FAILED';
      transactionId?: string;
      errorMessage?: string;
      signature?: string;
    },
  ) {
    try {
      this.logger.log(
        `[handlePayoutCallback] Received callback: payoutId=${payoutId}, status=${body.status}`,
      );

      const result = await this.paymentsService.handlePayoutCallback(
        payoutId,
        body,
      );

      this.logger.log(
        `[handlePayoutCallback] ✅ Payout updated: payoutId=${payoutId}`,
      );

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      this.logger.error(`[handlePayoutCallback] Error: ${error.message}`);
      throw error;
    }
  }
}
