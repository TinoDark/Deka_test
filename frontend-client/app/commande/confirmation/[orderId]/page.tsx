'use client';

import Link from 'next/link';
import { useCartStore } from '@/lib/cartStore';
import { useEffect } from 'react';

interface OrderConfirmationPageProps {
  params: {
    orderId: string;
  };
}

export default function OrderConfirmationPage({ params }: OrderConfirmationPageProps) {
  const clear = useCartStore((state) => state.clear);

  useEffect(() => {
    clear();
  }, [clear]);

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-blue-600">Confirmation</p>
          <h1 className="mt-4 text-4xl font-bold text-slate-900">Commande réussie !</h1>
          <p className="mt-4 text-slate-600">Votre commande a bien été prise en compte.</p>
          <div className="mt-8 inline-flex rounded-3xl bg-slate-50 px-6 py-4 text-left text-sm text-slate-800 shadow-sm">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Numéro de commande</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{params.orderId}</p>
            </div>
          </div>
          <div className="mt-8 space-y-4">
            <Link
              href={`/commande/${params.orderId}/suivi`}
              className="inline-flex w-full justify-center rounded-3xl bg-blue-600 px-6 py-4 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Suivre ma commande
            </Link>
            <Link
              href="/"
              className="inline-flex w-full justify-center rounded-3xl border border-slate-200 bg-white px-6 py-4 text-sm font-semibold text-slate-900 hover:bg-slate-50"
            >
              Retour à la vitrine
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
