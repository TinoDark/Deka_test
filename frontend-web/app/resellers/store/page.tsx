'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { Card } from '@/components/Card';
import Link from 'next/link';

export default function ResellerStoreProducts() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [storeProducts, setStoreProducts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'available' | 'store'>('available');

  useEffect(() => {
    if (user?.role?.toLowerCase() !== 'reseller') {
      router.push('/login');
    } else {
      loadProducts();
    }
  }, [user, router]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      // Fetch available products from catalog
      const response = await fetch('/api/catalog/products?limit=50', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProducts(data.data || []);
      }

      // Fetch reseller's store products
      const storeResponse = await fetch('/api/resellers/store/products', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (storeResponse.ok) {
        const storeData = await storeResponse.json();
        setStoreProducts(storeData.data || []);
      }
    } catch (err: any) {
      setError(err.message || 'Error loading products');
    } finally {
      setLoading(false);
    }
  };

  const addToStore = async (productId: string) => {
    try {
      const response = await fetch('/api/resellers/store/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({ productId }),
      });

      if (response.ok) {
        await loadProducts();
      } else {
        setError('Failed to add product to store');
      }
    } catch (err: any) {
      setError(err.message || 'Error adding product');
    }
  };

  const removeFromStore = async (productId: string) => {
    try {
      const response = await fetch(`/api/resellers/store/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (response.ok) {
        await loadProducts();
      } else {
        setError('Failed to remove product');
      }
    } catch (err: any) {
      setError(err.message || 'Error removing product');
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.nom_produit?.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Loading store...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manage Your Store</h1>
            <p className="text-gray-600 mt-2">Add or remove products from your store</p>
          </div>
          <Link
            href="/resellers/dashboard"
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
          >
            Back to Dashboard
          </Link>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab('available')}
            className={`px-6 py-2 font-medium rounded-lg transition ${
              activeTab === 'available'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300'
            }`}
          >
            Available Products ({filteredProducts.length})
          </button>
          <button
            onClick={() => setActiveTab('store')}
            className={`px-6 py-2 font-medium rounded-lg transition ${
              activeTab === 'store'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300'
            }`}
          >
            My Store ({storeProducts.length})
          </button>
        </div>

        {/* Available Products Tab */}
        {activeTab === 'available' && (
          <div>
            <div className="mb-6">
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {filteredProducts.length === 0 ? (
              <Card className="text-center py-12">
                <p className="text-gray-600">No products available</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <Card key={product.id} className="flex flex-col">
                    {product.image_cdn_url && (
                      <img
                        src={product.image_cdn_url}
                        alt={product.nom_produit}
                        className="w-full h-40 object-cover rounded-lg mb-4"
                      />
                    )}
                    <h3 className="text-lg font-semibold text-gray-900">{product.nom_produit}</h3>
                    <p className="text-sm text-gray-600 mt-1">{product.description}</p>
                    <div className="mt-4 flex justify-between items-center">
                      <div>
                        <p className="text-sm text-gray-500">Price</p>
                        <p className="text-lg font-bold text-gray-900">{product.prix_vente} XAF</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Commission</p>
                        <p className="text-lg font-bold text-green-600">+{product.commission} XAF</p>
                      </div>
                    </div>
                    <button
                      onClick={() => addToStore(product.id)}
                      disabled={storeProducts.some((p) => p.productId === product.id)}
                      className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {storeProducts.some((p) => p.productId === product.id)
                        ? 'Already in Store'
                        : 'Add to Store'}
                    </button>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* My Store Tab */}
        {activeTab === 'store' && (
          <div>
            {storeProducts.length === 0 ? (
              <Card className="text-center py-12">
                <p className="text-gray-600">Your store is empty. Add products from the available list.</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {storeProducts.map((storeProduct: any) => (
                  <Card key={storeProduct.id} className="flex flex-col">
                    {storeProduct.product?.image_cdn_url && (
                      <img
                        src={storeProduct.product.image_cdn_url}
                        alt={storeProduct.product.nom_produit}
                        className="w-full h-40 object-cover rounded-lg mb-4"
                      />
                    )}
                    <h3 className="text-lg font-semibold text-gray-900">
                      {storeProduct.product?.nom_produit}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">{storeProduct.product?.description}</p>
                    <div className="mt-4 flex justify-between items-center">
                      <div>
                        <p className="text-sm text-gray-500">Price</p>
                        <p className="text-lg font-bold text-gray-900">
                          {storeProduct.product?.prix_vente} XAF
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Commission</p>
                        <p className="text-lg font-bold text-green-600">
                          +{storeProduct.product?.commission} XAF
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromStore(storeProduct.productId)}
                      className="mt-4 w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700"
                    >
                      Remove from Store
                    </button>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
