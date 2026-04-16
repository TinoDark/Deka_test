'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/lib/cartStore';
import { createOrder } from '@/lib/api';

export default function PaymentPage() {
  const router = useRouter();
  const [paymentMethod, setPaymentMethod] = useState('mobile_money');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const items = useCartStore((state) => state.items);
  const deliveryAddress = useCartStore((state) => state.deliveryAddress);
  const clear = useCartStore((state) => state.clear);

  const total = items.reduce((sum, item) => sum + item.prix * item.quantite, 0);

  const handleOrder = async () => {
    if (!deliveryAddress) {
      setError('Veuillez saisir une adresse de livraison avant de commander.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const payload = {
        delivery_address: deliveryAddress,
        items: items.map((item) => ({
          product_id: item.productId,
          quantity: item.quantite,
        })),
        payment_method: paymentMethod,
      };

      const result = await createOrder(payload);
      clear();
      router.push(`/commande/confirmation/${result.id}`);
    } catch (err) {
      setError('Erreur lors de la création de la commande. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm uppercase tracking-[0.3em] text-blue-600">Paiement</p>
          <h1 className="mt-3 text-4xl font-bold text-slate-900">Sélectionnez votre méthode de paiement</h1>
          <p className="mt-2 text-slate-600">Votre commande sera préparée après validation du paiement.</p>

          <div className="mt-8 space-y-6">
            <div className="rounded-[32px] border border-slate-200 bg-slate-50 p-6">
              <label className="label">Montant total</label>
              <p className="text-3xl font-bold text-slate-900">{total.toFixed(0)} FCFA</p>
            </div>

            <div className="rounded-[32px] border border-slate-200 bg-white p-6">
              <label className="label">Méthode de paiement</label>
              <div className="space-y-4">
                <label className="flex items-center gap-4 rounded-3xl border border-slate-200 p-4">
                  <input
                    type="radio"
                    name="payment"
                    value="mobile_money"
                    checked={paymentMethod === 'mobile_money'}
                    onChange={() => setPaymentMethod('mobile_money')}
                  />
                  <span className="font-semibold text-slate-900">Mobile Money</span>
                </label>
                <label className="flex items-center gap-4 rounded-3xl border border-slate-200 p-4">
                  <input
                    type="radio"
                    name="payment"
                    value="cash_on_delivery"
                    checked={paymentMethod === 'cash_on_delivery'}
                    onChange={() => setPaymentMethod('cash_on_delivery')}
                  />
                  <span className="font-semibold text-slate-900">Paiement à la livraison</span>
                </label>
              </div>
            </div>

            {error && (
              <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={handleOrder}
              disabled={loading}
              className="w-full rounded-3xl bg-blue-600 px-6 py-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Validation en cours…' : 'Valider la commande'}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
