import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

export interface PayGateGlobalPaymentRequest {
  phone_number: string;
  amount: number;
  description?: string;
  identifier: string;
  network: 'FLOOZ' | 'TMONEY';
}

export interface PayGateGlobalPaymentResponse {
  tx_reference: string;
  status: number; // 0: success, 2: invalid token, 4: invalid params, 6: duplicate
}

export interface PayGateGlobalCallbackData {
  tx_reference: string;
  identifier: string;
  payment_reference: string;
  amount: number;
  datetime: string;
  payment_method: 'FLOOZ' | 'TMONEY';
  phone_number: string;
}

export interface PayGateGlobalStatusResponse {
  tx_reference: string;
  identifier: string;
  payment_reference: string;
  status: number; // 0: success, 2: pending, 4: expired, 6: cancelled
  datetime: string;
  payment_method: 'FLOOZ' | 'TMONEY';
}

export interface PayGateGlobalBalanceResponse {
  flooz: number;
  tmoney: number;
}

@Injectable()
export class PayGateGlobalService {
  private readonly logger = new Logger('PayGateGlobalService');
  private readonly httpClient: AxiosInstance;
  private readonly apiKey: string;
  private readonly baseUrl = 'https://paygateglobal.com/api/v1';

  constructor(private configService: ConfigService) {
    this.apiKey = '5c08692e-2c11-4839-a810-cccd34ca2edf'; // Provided API key
    this.httpClient = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  private get callbackUrl(): string {
    const configuredUrl = this.configService.get<string>('PAYGATEGLOBAL_CALLBACK_URL');
    if (configuredUrl) {
      return configuredUrl;
    }

    const appBaseUrl = this.configService.get<string>('APP_BASE_URL');
    if (appBaseUrl) {
      return `${appBaseUrl.replace(/\/$/, '')}/payments/paygateglobal/callback`;
    }

    return 'http://localhost:3000/payments/paygateglobal/callback';
  }

  getDefaultCallbackUrl(): string {
    return this.callbackUrl;
  }

  /**
   * Initiate a payment request (Method 1: Direct API call)
   */
  async initiatePayment(request: PayGateGlobalPaymentRequest): Promise<PayGateGlobalPaymentResponse> {
    try {
      this.logger.log(`Initiating PayGateGlobal payment for ${request.amount} FCFA to ${request.phone_number}`);

      const payload = {
        auth_token: this.apiKey,
        phone_number: request.phone_number,
        amount: request.amount,
        description: request.description || 'DEKA Payment',
        identifier: request.identifier,
        network: request.network,
      };

      const response = await this.httpClient.post('/pay', payload);

      this.logger.log(`PayGateGlobal payment initiated: ${response.data.tx_reference}`);

      return {
        tx_reference: response.data.tx_reference,
        status: response.data.status,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`PayGateGlobal payment initiation failed: ${errorMsg}`);
      throw new Error(`PayGateGlobal payment initiation failed: ${errorMsg}`);
    }
  }

  /**
   * Generate payment page URL (Method 2: Redirect to payment page)
   */
  generatePaymentPageUrl(params: {
    amount: number;
    description?: string;
    identifier: string;
    url?: string; // callback URL
    phone?: string;
    network?: 'FLOOZ' | 'TMONEY';
  }): string {
    const callbackUrl =
      params.url || this.configService.get<string>('PAYGATEGLOBAL_CALLBACK_URL') || this.callbackUrl;

    const queryParams = new URLSearchParams({
      token: this.apiKey,
      amount: params.amount.toString(),
      description: params.description || 'DEKA Payment',
      identifier: params.identifier,
      ...(callbackUrl && { url: callbackUrl }),
      ...(params.phone && { phone: params.phone }),
      ...(params.network && { network: params.network }),
    });

    return `https://paygateglobal.com/v1/page?${queryParams.toString()}`;
  }

  /**
   * Check payment status by tx_reference
   */
  async checkPaymentStatus(txReference: string): Promise<PayGateGlobalStatusResponse> {
    try {
      this.logger.log(`Checking PayGateGlobal payment status for ${txReference}`);

      const payload = {
        auth_token: this.apiKey,
        tx_reference: txReference,
      };

      const response = await this.httpClient.post('/status', payload);

      return {
        tx_reference: response.data.tx_reference,
        identifier: response.data.identifier,
        payment_reference: response.data.payment_reference,
        status: response.data.status,
        datetime: response.data.datetime,
        payment_method: response.data.payment_method,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`PayGateGlobal status check failed: ${errorMsg}`);
      throw new Error(`PayGateGlobal status check failed: ${errorMsg}`);
    }
  }

  /**
   * Check payment status by identifier (alternative method)
   */
  async checkPaymentStatusByIdentifier(identifier: string): Promise<PayGateGlobalStatusResponse> {
    try {
      this.logger.log(`Checking PayGateGlobal payment status by identifier ${identifier}`);

      const payload = {
        auth_token: this.apiKey,
        identifier: identifier,
      };

      const response = await this.httpClient.post('/v2/status', payload);

      return {
        tx_reference: response.data.tx_reference,
        identifier: identifier,
        payment_reference: response.data.payment_reference,
        status: response.data.status,
        datetime: response.data.datetime,
        payment_method: response.data.payment_method,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`PayGateGlobal status check by identifier failed: ${errorMsg}`);
      throw new Error(`PayGateGlobal status check by identifier failed: ${errorMsg}`);
    }
  }

  /**
   * Check account balance (requires whitelisted IP)
   */
  async checkBalance(): Promise<PayGateGlobalBalanceResponse> {
    try {
      this.logger.log('Checking PayGateGlobal account balance');

      const payload = {
        auth_token: this.apiKey,
      };

      const response = await this.httpClient.post('/check-balance', payload);

      return {
        flooz: response.data.flooz,
        tmoney: response.data.tmoney,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`PayGateGlobal balance check failed: ${errorMsg}`);
      throw new Error(`PayGateGlobal balance check failed: ${errorMsg}`);
    }
  }

  /**
   * Process callback data from PayGateGlobal
   */
  processCallback(callbackData: PayGateGlobalCallbackData): {
    txReference: string;
    identifier: string;
    amount: number;
    status: 'COMPLETED' | 'FAILED';
    paymentMethod: 'FLOOZ' | 'TMONEY';
    phoneNumber: string;
    datetime: string;
  } {
    // PayGateGlobal doesn't specify status codes in callback,
    // but we assume successful callbacks mean completed payments
    return {
      txReference: callbackData.tx_reference,
      identifier: callbackData.identifier,
      amount: callbackData.amount,
      status: 'COMPLETED', // Assuming callback = success
      paymentMethod: callbackData.payment_method,
      phoneNumber: callbackData.phone_number,
      datetime: callbackData.datetime,
    };
  }

  /**
   * Map PayGateGlobal status codes to our internal status
   */
  mapStatusCode(statusCode: number): 'COMPLETED' | 'PENDING' | 'FAILED' {
    switch (statusCode) {
      case 0:
        return 'COMPLETED';
      case 2:
        return 'PENDING';
      case 4:
      case 6:
        return 'FAILED';
      default:
        return 'PENDING';
    }
  }

  /**
   * Validate PayGateGlobal configuration
   */
  validateConfiguration(): boolean {
    if (!this.apiKey) {
      this.logger.error('PayGateGlobal API key not configured');
      return false;
    }
    return true;
  }
}