'use client';

import { useEffect, useState } from 'react';
import { ProductCard } from '@/components/ProductCard';
import { StoreOriginSetter } from '@/components/StoreOriginSetter';
import { fetchStore, fetchStoreProducts, type ProductResponse, type StoreResponse } from '@/lib/api';

export default function BoutiquePage({ params }: { params: { slug: string } }) {
  const [store, setStore] = useState<StoreResponse | null>(null);
  const [products, setProducts] = useState<ProductResponse['data']>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadStore() {
      setLoading(true);
      try {
        const [storeResponse, productsResponse] = await Promise.all([
          fetchStore(params.slug),
          fetchStoreProducts(params.slug),
        ]);

        if (!storeResponse) {
          setError('Boutique introuvable ou indisponible.');
          setStore(null);
          setProducts([]);
        } else {
          setStore(storeResponse);
          setProducts(productsResponse?.data ?? []);
          setError('');
        }
      } catch {
        setError('Impossible de charger la boutique. Réessayez plus tard.');
        setStore(null);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }

    loadStore();
  }, [params.slug]);

  return (
    <main className="min-h-screen bg-slate-50">
      <StoreOriginSetter slug={params.slug} />
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">Boutique</p>
              <h1 className="mt-3 text-4xl font-bold text-slate-900">{store?.name || params.slug}</h1>
              <p className="mt-3 text-slate-600 max-w-2xl">
                {store?.description || 'Découvrez tous les produits disponibles dans cette boutique.'}
              </p>
            </div>
            <div className="rounded-3xl bg-slate-50 px-6 py-4 text-sm text-slate-700">
              <p className="font-semibold">Localisation</p>
              <p>{store?.location || 'Non renseignée'}</p>
            </div>
          </div>

          {loading ? (
            <div className="rounded-[32px] border border-slate-200 bg-white p-10 text-center text-slate-600 shadow-sm">
              Chargement de la boutique...
            </div>
          ) : error ? (
            <div className="rounded-[32px] border border-red-200 bg-red-50 p-10 text-center text-red-700 shadow-sm">
              {error}
            </div>
          ) : products.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {products.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
          ) : (
            <div className="col-span-full rounded-[32px] border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600 shadow-sm">
              Aucun produit actif trouvé pour cette boutique.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
