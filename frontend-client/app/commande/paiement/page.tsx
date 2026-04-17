'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/lib/cartStore';
import { createOrder } from '@/lib/api';

export default function PaymentPage() {
  const router = useRouter();
  const [paymentMethod, setPaymentMethod] = useState('mobile_money');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
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
        deliveryAddress,
        distanceKm: 1,
        deliveryType: 'DIRECT',
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantite,
        })),
        paymentMethod,
      };

      const result = await createOrder(payload);
      clear();

      if (result.payment?.paymentUrl) {
        setOrderId(result.order.id);
        setPaymentUrl(result.payment.paymentUrl);
        return;
      }

      router.push(`/commande/confirmation/${result.order.id}`);
    } catch {
      setError('Erreur lors de la création de la commande. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!paymentUrl) return;

    const timer = window.setTimeout(() => {
      window.location.href = paymentUrl;
    }, 4000);

    return () => window.clearTimeout(timer);
  }, [paymentUrl]);

  if (paymentUrl) {
    return (
      <main className="min-h-screen bg-slate-50">
        <section className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-sm uppercase tracking-[0.3em] text-blue-600">Paiement</p>
            <h1 className="mt-3 text-4xl font-bold text-slate-900">Préparation du paiement</h1>
            <p className="mt-2 text-slate-600">
              Votre commande <span className="font-semibold">{orderId}</span> a bien été créée.
            </p>
            <div className="mt-8 rounded-[32px] border border-slate-200 bg-slate-50 p-6 text-slate-800">
              <p className="text-lg font-semibold">Redirection vers PayGateGlobal</p>
              <p className="mt-3 text-sm text-slate-600">
                Vous allez être redirigé vers la page de paiement dans quelques instants.
              </p>
              <p className="mt-4 text-sm text-slate-500">
                Si la redirection ne démarre pas automatiquement, cliquez sur le bouton ci-dessous.
              </p>
            </div>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <button
                type="button"
                onClick={() => {
                  window.location.href = paymentUrl;
                }}
                className="inline-flex items-center justify-center rounded-3xl bg-blue-600 px-6 py-4 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Payer maintenant
              </button>
              <button
                type="button"
                onClick={() => router.push(`/commande/confirmation/${orderId}`)}
                className="inline-flex items-center justify-center rounded-3xl border border-slate-200 bg-white px-6 py-4 text-sm font-semibold text-slate-900 hover:bg-slate-100"
              >
                Finaliser sans payer
              </button>
            </div>
          </div>
        </section>
      </main>
    );
  }

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
