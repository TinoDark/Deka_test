'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo } from 'react';
import { useCartStore } from '@/lib/cartStore';

export default function CartPage() {
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);

  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.prix * item.quantite, 0),
    [items],
  );

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-blue-600">Panier</p>
              <h1 className="mt-3 text-4xl font-bold text-slate-900">Votre panier</h1>
              <p className="mt-2 text-slate-600">Vérifiez vos articles avant de passer au paiement.</p>
            </div>
            <div className="rounded-3xl bg-slate-50 px-6 py-4 text-sm text-slate-700">
              <p className="font-semibold">Total estimé</p>
              <p className="text-2xl font-bold text-slate-900">{total.toFixed(0)} FCFA</p>
            </div>
          </div>

          {items.length === 0 ? (
            <div className="rounded-[32px] border border-dashed border-slate-300 bg-slate-50 p-14 text-center text-slate-600">
              Votre panier est vide.
              <div className="mt-6">
                <Link
                  href="/"
                  className="inline-flex items-center justify-center rounded-3xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Retour à la vitrine
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {items.map((item) => (
                <div key={item.productId} className="flex flex-col gap-4 rounded-[28px] border border-slate-200 bg-white p-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <Image
                      src={
                        item.image_cdn_url ||
                        'https://via.placeholder.com/240x240?text=Image+manquante'
                      }
                      alt={item.nom}
                      width={96}
                      height={96}
                      className="rounded-3xl object-cover"
                    />
                    <div>
                      <h2 className="text-xl font-semibold text-slate-900">{item.nom}</h2>
                      <p className="text-sm text-slate-600">{item.prix.toFixed(0)} FCFA</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.productId, item.quantite - 1)}
                      className="rounded-full border border-slate-300 px-3 py-2 text-slate-700 hover:bg-slate-100"
                    >
                      −
                    </button>
                    <span className="w-10 text-center text-lg font-semibold">{item.quantite}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.productId, item.quantite + 1)}
                      className="rounded-full border border-slate-300 px-3 py-2 text-slate-700 hover:bg-slate-100"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      onClick={() => removeItem(item.productId)}
                      className="rounded-3xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 hover:bg-red-100"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}

              <div className="flex flex-col gap-4 rounded-[32px] border border-slate-200 bg-slate-50 p-6 text-right sm:flex-row sm:items-center sm:justify-between">
                <p className="text-lg text-slate-700">Total</p>
                <p className="text-3xl font-bold text-slate-900">{total.toFixed(0)} FCFA</p>
              </div>

              <Link
                href="/commande/livraison"
                className="inline-flex w-full justify-center rounded-3xl bg-blue-600 px-6 py-4 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Continuer vers la livraison
              </Link>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
