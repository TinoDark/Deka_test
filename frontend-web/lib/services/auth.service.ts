import apiClient from '../api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    role: 'admin' | 'supplier' | 'reseller' | 'delivery';
    kycStatus: 'pending' | 'approved' | 'rejected';
    walletBalance: number;
  };
}

export interface SignupData {
  email: string;
  password: string;
  fullName: string;
  role: 'supplier' | 'reseller';
  phone?: string;
}

export class AuthService {
  static async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/login', credentials);
    return response.data;
  }

  static async signup(data: SignupData): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/register', data);
    return response.data;
  }

  static async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  }

  static async getCurrentUser() {
    const response = await apiClient.get('/auth/me');
    return response.data;
  }

  static async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    const response = await apiClient.post('/auth/refresh', { refreshToken });
    return response.data;
  }

  static async verifyEmail(token: string): Promise<void> {
    await apiClient.post(`/auth/verify-email/${token}`);
  }

  static async requestPasswordReset(email: string): Promise<void> {
    await apiClient.post('/auth/forgot-password', { email });
  }

  static async resetPassword(token: string, newPassword: string): Promise<void> {
    await apiClient.post(`/auth/reset-password/${token}`, { newPassword });
  }

  static async submitKYC(data: any): Promise<void> {
    await apiClient.post('/auth/kyc', data);
  }
}

export default AuthService;
