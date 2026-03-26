import apiClient from '../api';

export interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  packageCode: string;
  status: 'pending' | 'prepared' | 'collected' | 'at_hub' | 'delivered' | 'rejected';
}

export interface Order {
  id: string;
  resellerId: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'paid' | 'processing' | 'delivered' | 'cancelled';
  escrowBalance: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderDTO {
  items: Array<{ productId: string; quantity: number }>;
  totalAmount: number;
}

export class OrderService {
  static async createOrder(data: CreateOrderDTO): Promise<Order> {
    const response = await apiClient.post<Order>('/orders', data);
    return response.data;
  }

  static async getOrder(orderId: string): Promise<Order> {
    const response = await apiClient.get<Order>(`/orders/${orderId}`);
    return response.data;
  }

  static async listOrders(
    status?: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<{ data: Order[]; total: number }> {
    const response = await apiClient.get<{ data: Order[]; total: number }>('/orders', {
      params: { status, limit, offset },
    });
    return response.data;
  }

  static async cancelOrder(orderId: string, reason: string): Promise<void> {
    await apiClient.patch(`/orders/${orderId}/cancel`, { reason });
  }

  static async getOrderTracking(orderId: string): Promise<any> {
    const response = await apiClient.get(`/orders/${orderId}/tracking`);
    return response.data;
  }

  // Supplier endpoints
  static async getSupplierOrders(
    status?: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<{ data: Order[]; total: number }> {
    const response = await apiClient.get<{ data: Order[]; total: number }>(
      '/suppliers/orders',
      {
        params: { status, limit, offset },
      }
    );
    return response.data;
  }

  static async confirmOrderPreparation(orderId: string): Promise<void> {
    await apiClient.patch(`/suppliers/orders/${orderId}/prepared`);
  }

  static async getPackageCode(itemId: string): Promise<{ packageCode: string }> {
    const response = await apiClient.get<{ packageCode: string }>(
      `/orders/items/${itemId}/package-code`
    );
    return response.data;
  }
}

export default OrderService;
