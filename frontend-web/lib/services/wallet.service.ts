import apiClient from '../api';

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  currency: string;
  totalEarnings: number;
  totalWithdrawals: number;
  totalCommissions: number;
  updatedAt: string;
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  type: 'commission' | 'withdrawal' | 'refund' | 'bonus';
  amount: number;
  reference: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
}

export class WalletService {
  static async getWallet(): Promise<Wallet> {
    const response = await apiClient.get<Wallet>('/wallet');
    return response.data;
  }

  static async getTransactions(
    type?: string,
    status?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ data: WalletTransaction[]; total: number }> {
    const response = await apiClient.get<{ data: WalletTransaction[]; total: number }>(
      '/wallet/transactions',
      {
        params: { type, status, limit, offset },
      }
    );
    return response.data;
  }

  static async getBalance(): Promise<{ balance: number; currency: string }> {
    const response = await apiClient.get('/wallet/balance');
    return response.data;
  }

  static async getEarningsStats(): Promise<{
    dailyEarnings: number;
    weeklyEarnings: number;
    monthlyEarnings: number;
    totalEarnings: number;
  }> {
    const response = await apiClient.get('/wallet/earnings-stats');
    return response.data;
  }

  static async exportTransactions(format: 'csv' | 'pdf'): Promise<Blob> {
    const response = await apiClient.get(`/wallet/export?format=${format}`, {
      responseType: 'blob',
    });
    return response.data;
  }
}

export default WalletService;
