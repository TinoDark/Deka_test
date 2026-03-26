import apiClient from '../api';

export interface Product {
  id: string;
  reference_interne: string;
  nom_produit: string;
  description: string;
  prix_vente: number;
  commission: number;
  pourcentage_commission: number;
  stock_quantity: number;
  is_active: boolean;
  image_cdn_url: string;
  categorie?: string;
  caracteristique?: string;
}

export interface CatalogQuery {
  category?: string;
  search?: string;
  limit?: number;
  offset?: number;
  supplierId?: string;
}

export class CatalogService {
  static async getProducts(query?: CatalogQuery) {
    const response = await apiClient.get<{ data: Product[]; total: number }>('/catalog', {
      params: query,
    });
    return response.data;
  }

  static async getProductById(productId: string): Promise<Product> {
    const response = await apiClient.get<Product>(`/catalog/${productId}`);
    return response.data;
  }

  static async getCategories(): Promise<string[]> {
    const response = await apiClient.get<string[]>('/catalog/categories');
    return response.data;
  }

  // Supplier only
  static async createProduct(data: Partial<Product>): Promise<Product> {
    const response = await apiClient.post<Product>('/catalog/products', data);
    return response.data;
  }

  static async updateProduct(productId: string, data: Partial<Product>): Promise<Product> {
    const response = await apiClient.patch<Product>(`/catalog/products/${productId}`, data);
    return response.data;
  }

  static async deactivateProduct(productId: string): Promise<void> {
    await apiClient.patch(`/catalog/products/${productId}`, { is_active: false });
  }

  static async uploadCatalog(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post('/suppliers/inventory/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  static async getSyncReport(): Promise<any> {
    const response = await apiClient.get('/suppliers/inventory/sync-report');
    return response.data;
  }
}

export default CatalogService;
