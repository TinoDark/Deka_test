import apiClient from '../api';

export interface KYCRequest {
  id: string;
  userId: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  data: {
    fullName: string;
    idType: string;
    idNumber: string;
    dateOfBirth: string;
    address: string;
    businessName?: string;
    registrationNumber?: string;
  };
}

export interface Dispute {
  id: string;
  orderId: string;
  reportedBy: string;
  reason: string;
  evidence: string[];
  status: 'open' | 'resolved' | 'closed';
  resolution?: string;
  createdAt: string;
}

export interface RemboursementJournal {
  id: string;
  remboursementId: string;
  orderId: string;
  montant: number;
  raison: string;
  autorisePar: string;
  dateAutorisation: string;
  statut: 'en_attente' | 'complété' | 'échoué';
}

export class AdminService {
  // KYC Management
  static async getKYCRequests(
    status?: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<{ data: KYCRequest[]; total: number }> {
    const response = await apiClient.get<{ data: KYCRequest[]; total: number }>(
      '/admin/kyc',
      {
        params: { status, limit, offset },
      }
    );
    return response.data;
  }

  static async approveKYC(userId: string): Promise<KYCRequest> {
    const response = await apiClient.patch<KYCRequest>(`/admin/kyc/${userId}`, {
      status: 'approved',
    });
    return response.data;
  }

  static async rejectKYC(userId: string, reason: string): Promise<KYCRequest> {
    const response = await apiClient.patch<KYCRequest>(`/admin/kyc/${userId}`, {
      status: 'rejected',
      reason,
    });
    return response.data;
  }

  // Dispute Management
  static async getDisputes(
    status?: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<{ data: Dispute[]; total: number }> {
    const response = await apiClient.get<{ data: Dispute[]; total: number }>(
      '/admin/disputes',
      {
        params: { status, limit, offset },
      }
    );
    return response.data;
  }

  static async resolveDispute(
    disputeId: string,
    resolution: string,
    refundAmount?: number
  ): Promise<Dispute> {
    const response = await apiClient.patch<Dispute>(`/admin/disputes/${disputeId}`, {
      status: 'resolved',
      resolution,
      refundAmount,
    });
    return response.data;
  }

  // Refund Management
  static async createManualRefund(
    orderId: string,
    amount: number,
    reason: string
  ): Promise<RemboursementJournal> {
    const response = await apiClient.post<RemboursementJournal>('/admin/refunds', {
      orderId,
      amount,
      reason,
    });
    return response.data;
  }

  static async getRefundJournal(
    limit: number = 50,
    offset: number = 0
  ): Promise<{ data: RemboursementJournal[]; total: number }> {
    const response = await apiClient.get<{ data: RemboursementJournal[]; total: number }>(
      '/admin/refunds/journal',
      {
        params: { limit, offset },
      }
    );
    return response.data;
  }

  // Analytics
  static async getDashboardStats(): Promise<{
    totalOrders: number;
    totalRevenue: number;
    activeSuppliers: number;
    activeResellers: number;
    pendingKYC: number;
    openDisputes: number;
  }> {
    const response = await apiClient.get('/admin/stats/dashboard');
    return response.data;
  }

  static async getRevenueAnalytics(
    period: 'daily' | 'weekly' | 'monthly'
  ): Promise<Array<{ date: string; revenue: number; orders: number }>> {
    const response = await apiClient.get('/admin/stats/revenue', {
      params: { period },
    });
    return response.data;
  }

  static async getUserStats(): Promise<{
    totalUsers: number;
    suppliers: number;
    resellers: number;
    delivery: number;
    kycApproved: number;
    kycPending: number;
    kycRejected: number;
  }> {
    const response = await apiClient.get('/admin/stats/users');
    return response.data;
  }

  // Content Moderation
  static async getReportedProducts(
    limit: number = 20,
    offset: number = 0
  ): Promise<{ data: any[]; total: number }> {
    const response = await apiClient.get('/admin/moderation/products', {
      params: { limit, offset },
    });
    return response.data;
  }

  static async removeProduct(productId: string, reason: string): Promise<void> {
    await apiClient.delete(`/admin/moderation/products/${productId}`, {
      data: { reason },
    });
  }

  // System Logs
  static async getSystemLogs(
    action?: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<{ data: any[]; total: number }> {
    const response = await apiClient.get('/admin/logs', {
      params: { action, limit, offset },
    });
    return response.data;
  }
}

export default AdminService;
