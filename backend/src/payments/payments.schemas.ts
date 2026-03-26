import { z } from 'zod';

/**
 * ============================================================================
 * PAYMENT VALIDATION SCHEMAS (Zod)
 * ============================================================================
 * Strict validation for all payment-related inputs.
 * Used by the controllers before passing to service layer.
 */

// ============================================================================
// PAYMENT CALLBACK (Webhook)
// ============================================================================

export const PaymentCallbackSchema = z.object({
  idempotencyKey: z
    .string()
    .min(1)
    .max(255)
    .describe('Unique key from Mobile Money provider'),

  orderId: z.string().uuid().describe('Order UUID'),

  amount: z
    .number()
    .positive()
    .describe('Transaction amount in local currency'),

  status: z
    .enum(['COMPLETED', 'FAILED', 'PENDING'])
    .describe('Payment status from provider'),

  provider: z
    .enum(['mix_by_yas', 'MOOV_MONEY', 'PAYGATEGLOBAL'])
    .describe('Mobile Money provider'),

  transactionId: z
    .string()
    .optional()
    .describe('Transaction ID from provider'),

  callbackData: z
    .string()
    .optional()
    .describe('Raw callback payload (for audit)'),

  signature: z
    .string()
    .optional()
    .describe('HMAC SHA256 signature for verification'),
});

export type PaymentCallbackDto = z.infer<typeof PaymentCallbackSchema>;

// ============================================================================
// REFUND REQUEST
// ============================================================================

export const RefundRequestSchema = z.object({
  reason: z
    .string()
    .min(10)
    .max(500)
    .describe('Reason for refund (human-readable)'),

  amount: z
    .number()
    .positive()
    .optional()
    .describe('Partial refund amount (if omitted, full refund)'),
});

export type RefundRequestDto = z.infer<typeof RefundRequestSchema>;

// ============================================================================
// PAYOUT REQUEST (Wallet withdrawal)
// ============================================================================

export const PayoutRequestSchema = z.object({
  amount: z
    .number()
    .positive()
    .describe('Amount to withdraw from wallet'),

  mobileProvider: z
    .enum(['mix_by_yas', 'MOOV_MONEY', 'PAYGATEGLOBAL'])
    .describe('Mobile Money provider'),

  mobileNumber: z
    .string()
    .regex(/^\+?[\d\s\-()]+$/)
    .min(7)
    .max(20)
    .describe('Destination mobile number'),
});

export type PayoutRequestDto = z.infer<typeof PayoutRequestSchema>;

// ============================================================================
// PAYOUT CALLBACK
// ============================================================================

export const PayoutCallbackSchema = z.object({
  status: z
    .enum(['COMPLETED', 'FAILED'])
    .describe('Payout completion status'),

  transactionId: z
    .string()
    .optional()
    .describe('Transaction ID from Mobile Money provider'),

  errorMessage: z
    .string()
    .optional()
    .describe('Error message if FAILED'),

  signature: z
    .string()
    .optional()
    .describe('Webhook signature for verification'),
});

export type PayoutCallbackDto = z.infer<typeof PayoutCallbackSchema>;

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export const PaymentResponseSchema = z.object({
  id: z.string().uuid(),
  orderId: z.string().uuid(),
  userId: z.string().uuid(),
  amount: z.string(), // Decimal as string
  status: z.enum(['PENDING', 'COMPLETED', 'FAILED']),
  provider: z.string(),
  transactionId: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type PaymentResponse = z.infer<typeof PaymentResponseSchema>;

export const RefundResponseSchema = z.object({
  id: z.string().uuid(),
  amount: z.string(),
  reason: z.string(),
  createdAt: z.date(),
});

export type RefundResponse = z.infer<typeof RefundResponseSchema>;

export const PayoutResponseSchema = z.object({
  id: z.string().uuid(),
  amount: z.string(),
  status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED']),
  mobileProvider: z.string(),
  mobileNumber: z.string(),
  createdAt: z.date(),
  completedAt: z.date().nullable(),
});

export type PayoutResponse = z.infer<typeof PayoutResponseSchema>;

// ============================================================================
// BATCH VALIDATION HELPER
// ============================================================================

export function validatePaymentCallback(data: unknown) {
  try {
    return PaymentCallbackSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors
        .map((e) => `${e.path.join('.')}: ${e.message}`)
        .join('; ');
      throw new Error(`Validation failed: ${messages}`);
    }
    throw error;
  }
}

export function validateRefundRequest(data: unknown) {
  try {
    return RefundRequestSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors
        .map((e) => `${e.path.join('.')}: ${e.message}`)
        .join('; ');
      throw new Error(`Validation failed: ${messages}`);
    }
    throw error;
  }
}

export function validatePayoutRequest(data: unknown) {
  try {
    return PayoutRequestSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors
        .map((e) => `${e.path.join('.')}: ${e.message}`)
        .join('; ');
      throw new Error(`Validation failed: ${messages}`);
    }
    throw error;
  }
}
