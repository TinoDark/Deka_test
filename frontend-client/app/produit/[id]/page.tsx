'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { ProductDetailClient } from '@/components/ProductDetailClient';
import { fetchProduct, type Product } from '@/lib/api';

export default function ProductPage({ params }: { params: { id: string } }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadProduct() {
      setLoading(true);
      try {
        const productResponse = await fetchProduct(params.id);
        if (!productResponse) {
          setError('Produit introuvable ou indisponible.');
          setProduct(null);
        } else {
          setProduct(productResponse);
          setError('');
        }
      } catch {
        setError('Impossible de charger le produit. Réessayez plus tard.');
        setProduct(null);
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
  }, [params.id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50">
        <section className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="rounded-[32px] border border-slate-200 bg-white p-10 text-center text-slate-600 shadow-sm">
            Chargement du produit...
          </div>
        </section>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="min-h-screen bg-slate-50">
        <section className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="rounded-[32px] border border-slate-200 bg-white p-10 text-center shadow-sm">
            <h1 className="text-3xl font-bold text-slate-900">Produit introuvable</h1>
            <p className="mt-4 text-slate-600">{error || 'Ce produit n’est plus disponible ou a été retiré.'}</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="relative h-[420px] w-full overflow-hidden rounded-[28px] bg-slate-100">
              <Image
                src={
                  product.image_cdn_url ||
                  product.image_url ||
                  'https://via.placeholder.com/640x480?text=Image+manquante'
                }
                alt={product.nom_produit}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 720px"
              />
            </div>
            <div className="mt-6 space-y-4">
              <p className="text-sm uppercase tracking-[0.3em] text-blue-600">{product.categorie || 'Produit'}</p>
              <h1 className="text-4xl font-bold text-slate-900">{product.nom_produit}</h1>
              <p className="text-lg text-slate-600 leading-8">{product.description}</p>
              <div className="flex flex-wrap gap-3">
                <span className="rounded-3xl bg-slate-100 px-4 py-2 text-sm text-slate-700">Commission: {product.commission} FCFA</span>
                <span className="rounded-3xl bg-slate-100 px-4 py-2 text-sm text-slate-700">{product.pourcentage_commission}%</span>
              </div>
            </div>
          </div>

          <ProductDetailClient product={product} />
        </div>
      </section>
    </main>
  );
}
