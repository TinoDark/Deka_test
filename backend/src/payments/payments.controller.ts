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
import { RbacGuard } from '@/common/guards/rbac.guard';
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
   * (mix_by_yas, Moov Money, PayGateGlobal, etc.). It is:
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
   *   "provider": "mix_by_yas",
   *   "transactionId": "mix_by_yas-TXN-123456",
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
      provider: 'mix_by_yas' | 'MOOV_MONEY' | 'PAYGATEGLOBAL';
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
        `[handlePaymentCallback] ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
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
  @UseGuards(JwtAuthGuard, RbacGuard)
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
      this.logger.error(`[getPaymentById] Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
  @UseGuards(JwtAuthGuard, RbacGuard)
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
      this.logger.error(`[listPayments] Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
  @UseGuards(JwtAuthGuard, RbacGuard)
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
      this.logger.error(`[refundPayment] Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
   *   "mobileProvider": "mix_by_yas",
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
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Roles('RESELLER', 'SUPPLIER')
  @Post('payouts')
  @HttpCode(201)
  async createPayoutRequest(
    @Body()
    body: {
      amount: number;
      mobileProvider: 'mix_by_yas' | 'MOOV_MONEY' | 'PAYGATEGLOBAL';
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
      this.logger.error(`[createPayoutRequest] Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
  @UseGuards(JwtAuthGuard, RbacGuard)
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
      this.logger.error(`[listPayouts] Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      this.logger.error(`[handlePayoutCallback] Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }
  /**
   * ============================================================================
   * INITIATE PAYGATEGLOBAL PAYMENT
   * ============================================================================
   * POST /payments/paygateglobal/initiate
   *
   * Initiates a payment request to PayGateGlobal for FLOOZ/TMONEY.
   * Protected: Authenticated users (RESELLER primarily)
   *
   * Request:
   * {
   *   "orderId": "order-uuid",
   *   "paymentMethod": "payment_page" // or "direct"
   * }
   *
   * Response:
   * {
   *   "success": true,
   *   "paymentUrl": "https://paygateglobal.com/pay/...",
   *   "txReference": "PGG-order123-1234567890"
   * }
   */
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Roles('RESELLER', 'ADMIN')
  @Post('paygateglobal/initiate')
  async initiatePayGateGlobalPayment(
    @Body() body: { orderId: string; paymentMethod?: 'direct' | 'payment_page' },
  ) {
    try {
      this.logger.log(
        `[initiatePayGateGlobalPayment] orderId=${body.orderId}, method=${body.paymentMethod || 'payment_page'}`,
      );

      const result = await this.paymentsService.initiatePayGateGlobalPayment(
        body.orderId,
        body.paymentMethod || 'payment_page',
      );

      if (result.success) {
        this.logger.log(
          `[initiatePayGateGlobalPayment] ✅ Payment initiated. txReference=${result.txReference}`,
        );

        return {
          success: true,
          data: {
            paymentUrl: result.paymentUrl,
            txReference: result.txReference,
          },
        };
      } else {
        this.logger.error(
          `[initiatePayGateGlobalPayment] ❌ Payment initiation failed: ${result.error}`,
        );

        throw new HttpException(
          {
            success: false,
            error: result.error,
          },
          HttpStatus.BAD_REQUEST,
        );
      }
    } catch (error) {
      this.logger.error(`[initiatePayGateGlobalPayment] Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  /**
   * ============================================================================
   * PAYGATEGLOBAL CALLBACK WEBHOOK
   * ============================================================================
   * POST /payments/paygateglobal/callback
   *
   * Receives payment confirmations from PayGateGlobal.
   * This endpoint is PUBLIC (no auth required) but should be protected by IP whitelist.
   *
   * Expected callback data:
   * {
   *   "tx_reference": "PGG-order123-1234567890",
   *   "status": "SUCCESS",
   *   "amount": 1000,
   *   "currency": "XOF",
   *   "phone_number": "22890123456",
   *   "payment_type": "FLOOZ",
   *   "transaction_id": "TXN123456",
   *   "payment_date": "2024-01-01 12:00:00"
   * }
   */
  @Public()
  @Post('paygateglobal/callback')
  @HttpCode(200)
  async handlePayGateGlobalCallback(@Body() callbackData: any) {
    try {
      this.logger.log(
        `[handlePayGateGlobalCallback] Received callback for tx_reference=${callbackData.tx_reference}`,
      );

      const result = await this.paymentsService.handlePayGateGlobalCallback(callbackData);

      if (result.success) {
        this.logger.log(
          `[handlePayGateGlobalCallback] ✅ Callback processed. orderId=${result.orderId}, paymentId=${result.paymentId}`,
        );

        return {
          success: true,
          message: 'Callback processed successfully',
          orderId: result.orderId,
          paymentId: result.paymentId,
        };
      } else {
        this.logger.error(
          `[handlePayGateGlobalCallback] ❌ Callback processing failed: ${result.error}`,
        );

        throw new HttpException(
          {
            success: false,
            error: result.error,
          },
          HttpStatus.BAD_REQUEST,
        );
      }
    } catch (error) {
      this.logger.error(`[handlePayGateGlobalCallback] Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }
}

