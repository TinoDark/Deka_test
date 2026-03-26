import apiClient from '../api';

export interface Payment {
  id: string;
  orderId: string;
  supplierId: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  amount: number;
  provider: string;
  transactionId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Refund {
  id: string;
  paymentId: string;
  reason: string;
  amount: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
}

export interface Payout {
  id: string;
  userId: string;
  amount: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  mobileProvider: string;
  mobileNumber: string;
  createdAt: string;
}

export interface PaymentCallbackDTO {
  idempotencyKey: string;
  orderId: string;
  amount: number;
  status: 'COMPLETED' | 'FAILED';
  provider: string;
  transactionId: string;
  signature: string;
}

export class PaymentService {
  // Get payment details
  static async getPayment(paymentId: string): Promise<Payment> {
    const response = await apiClient.get<Payment>(`/payments/${paymentId}`);
    return response.data;
  }

  // List payments for user with pagination
  static async listPayments(
    status?: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<{ data: Payment[]; total: number }> {
    const response = await apiClient.get<{ data: Payment[]; total: number }>('/payments', {
      params: { status, limit, offset },
    });
    return response.data;
  }

  // Refund payment (admin only)
  static async refundPayment(
    paymentId: string,
    reason: string,
    amount?: number
  ): Promise<Refund> {
    const response = await apiClient.post<Refund>(`/payments/${paymentId}/refund`, {
      reason,
      amount,
    });
    return response.data;
  }

  // Request payout (supplier/reseller)
  static async requestPayout(
    amount: number,
    mobileProvider: string,
    mobileNumber: string
  ): Promise<Payout> {
    const response = await apiClient.post<Payout>('/payments/payouts', {
      amount,
      mobileProvider,
      mobileNumber,
    });
    return response.data;
  }

  // List payouts
  static async listPayouts(
    status?: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<{ data: Payout[]; total: number }> {
    const response = await apiClient.get<{ data: Payout[]; total: number }>(
      '/payments/payouts',
      {
        params: { status, limit, offset },
      }
    );
    return response.data;
  }

  // Get payout details
  static async getPayout(payoutId: string): Promise<Payout> {
    const response = await apiClient.get<Payout>(`/payments/payouts/${payoutId}`);
    return response.data;
  }

  // Calculate commission for order
  static async calculateCommission(orderId: string): Promise<{ totalCommission: number }> {
    const response = await apiClient.get<{ totalCommission: number }>(
      `/payments/commission/${orderId}`
    );
    return response.data;
  }

  // Get payment callback response (for OAuth integrations)
  static async getPaymentStatus(transactionId: string): Promise<any> {
    const response = await apiClient.get(`/payments/status/${transactionId}`);
    return response.data;
  }
}

export default PaymentService;
