'use client';

import { useState } from 'react';
import { useCartStore } from '@/lib/cartStore';

interface ProductDetailClientProps {
  product: any;
}

export function ProductDetailClient({ product }: ProductDetailClientProps) {
  const addItem = useCartStore((state) => state.addItem);
  const [message, setMessage] = useState('');

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      nom: product.nom_produit,
      prix: Number(product.prix_vente) || 0,
      image_cdn_url:
        product.image_cdn_url ||
        product.image_url ||
        'https://via.placeholder.com/640x480?text=Image+manquante',
      shopOrigin: product.store_slug || null,
    });
    setMessage('Article ajouté au panier.');
    window.setTimeout(() => setMessage(''), 2500);
  };

  return (
    <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
      <div className="space-y-5">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-blue-600">Détails produit</p>
          <h2 className="mt-3 text-3xl font-bold text-slate-900">{product.nom_produit}</h2>
        </div>

        <div className="grid gap-4">
          <div className="rounded-3xl bg-slate-50 p-6">
            <p className="text-sm text-slate-600">Prix</p>
            <p className="mt-3 text-4xl font-bold text-slate-900">{Number(product.prix_vente).toFixed(0)} FCFA</p>
          </div>
          <div className="rounded-3xl bg-slate-50 p-6">
            <p className="text-sm text-slate-600">Stock disponible</p>
            <p className="mt-3 text-2xl font-semibold text-slate-900">{product.stock_quantity ?? 'N/A'}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleAddToCart}
          className="w-full rounded-3xl bg-blue-600 px-6 py-4 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Ajouter au panier
        </button>

        {message && (
          <div className="rounded-3xl bg-green-50 p-4 text-sm text-green-700">{message}</div>
        )}
      </div>
    </div>
  );
}
