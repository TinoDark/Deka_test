const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function fetchProducts(limit = 24) {
  try {
    const response = await fetch(`${apiUrl}/catalog?is_active=true&limit=${limit}`, {
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      return { data: [], total: 0 };
    }

    return (await response.json()) as { data: Array<any>; total: number };
  } catch (error) {
    console.error('fetchProducts failed:', error);
    return { data: [], total: 0 };
  }
}

export async function fetchStore(slug: string) {
  try {
    const response = await fetch(`${apiUrl}/stores/${slug}`, {
      next: { revalidate: 60 },
    });
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as any;
  } catch (error) {
    console.error('fetchStore failed:', error);
    return null;
  }
}

export async function fetchStoreProducts(slug: string) {
  try {
    const response = await fetch(`${apiUrl}/catalog?store=${encodeURIComponent(slug)}&is_active=true`, {
      next: { revalidate: 60 },
    });
    if (!response.ok) {
      return { data: [], total: 0 };
    }
    return (await response.json()) as { data: Array<any>; total: number };
  } catch (error) {
    console.error('fetchStoreProducts failed:', error);
    return { data: [], total: 0 };
  }
}

export async function fetchProduct(id: string) {
  try {
    const response = await fetch(`${apiUrl}/catalog/${id}`, {
      next: { revalidate: 60 },
    });
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as any;
  } catch (error) {
    console.error('fetchProduct failed:', error);
    return null;
  }
}

export async function createOrder(payload: any) {
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
