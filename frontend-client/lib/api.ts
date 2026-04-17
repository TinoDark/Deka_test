const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface Product {
  id: string;
  nom_produit: string;
  description?: string;
  caracteristique?: string;
  categorie?: string;
  image_url?: string;
  image_cdn_url?: string;
  prix_vente?: number;
  commission?: number;
  pourcentage_commission?: number;
  stock_quantity?: number;
  store_slug?: string;
  name?: string;
}

export interface ProductResponse {
  data: Product[];
  total: number;
}

export interface StoreResponse {
  id: string;
  name: string;
  description?: string;
  location?: string;
}

export async function fetchProducts(limit = 24): Promise<ProductResponse> {
  try {
    const response = await fetch(`${apiUrl}/catalog?is_active=true&limit=${limit}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      return { data: [], total: 0 };
    }

    return (await response.json()) as ProductResponse;
  } catch (error) {
    console.error('fetchProducts failed:', error);
    return { data: [], total: 0 };
  }
}

export async function fetchStore(slug: string): Promise<StoreResponse | null> {
  try {
    const response = await fetch(`${apiUrl}/stores/${slug}`, {
      cache: 'no-store',
    });
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as StoreResponse;
  } catch (error) {
    console.error('fetchStore failed:', error);
    return null;
  }
}

export async function fetchStoreProducts(slug: string): Promise<ProductResponse> {
  try {
    const response = await fetch(`${apiUrl}/catalog?store=${encodeURIComponent(slug)}&is_active=true`, {
      cache: 'no-store',
    });
    if (!response.ok) {
      return { data: [], total: 0 };
    }
    return (await response.json()) as ProductResponse;
  } catch (error) {
    console.error('fetchStoreProducts failed:', error);
    return { data: [], total: 0 };
  }
}

export async function fetchProduct(id: string): Promise<Product | null> {
  try {
    const response = await fetch(`${apiUrl}/catalog/${id}`, {
      cache: 'no-store',
    });
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as Product;
  } catch (error) {
    console.error('fetchProduct failed:', error);
    return null;
  }
}

export async function createOrder(payload: Record<string, unknown>) {
  const response = await fetch(`${apiUrl}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Impossible de créer la commande.');
  }

  return response.json();
}
