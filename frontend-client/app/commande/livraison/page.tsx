'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapComponent } from '@/components/MapComponent';
import { useCartStore } from '@/lib/cartStore';

export default function DeliveryAddressPage() {
  const router = useRouter();
  const [adresse, setAdresse] = useState('');
  const [repere, setRepere] = useState('');
  const [telephone, setTelephone] = useState('');
  const [lat, setLat] = useState(3.8667);
  const [lng, setLng] = useState(11.5167);
  const [error, setError] = useState('');
  const setDeliveryAddress = useCartStore((state) => state.setDeliveryAddress);

  useEffect(() => {
    if (!adresse && !telephone) {
      setTelephone('');
    }
  }, []);

  const handleLocationSelect = (location: { lat: number; lng: number; address: string }) => {
    setLat(location.lat);
    setLng(location.lng);
    setAdresse(location.address);
  };

  const handleContinue = () => {
    if (!adresse || !telephone) {
      setError('Veuillez renseigner une adresse et un numéro de téléphone.');
      return;
    }

    setDeliveryAddress({
      lat,
      lng,
      adresse_texte: adresse,
      repere,
      telephone,
    });

    router.push('/commande/paiement');
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm uppercase tracking-[0.3em] text-blue-600">Adresse de livraison</p>
          <h1 className="mt-3 text-3xl font-bold text-slate-900">Où souhaitez-vous être livré ?</h1>
          <p className="mt-2 text-slate-600">Sélectionnez une adresse ou cliquez sur la carte.</p>
        </div>

        {error && (
          <div className="mb-6 rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="h-[360px] w-full rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <MapComponent onLocationSelect={handleLocationSelect} height="100%" />
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
              <label className="label">Adresse</label>
              <textarea
                value={adresse}
                onChange={(event) => setAdresse(event.target.value)}
                placeholder="Rue, quartier, repère..."
                className="input h-28 resize-none"
              />
            </div>
            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
              <label className="label">Repère</label>
              <input
                value={repere}
                onChange={(event) => setRepere(event.target.value)}
                placeholder="Par exemple : en face du marché"
                className="input"
              />
            </div>
            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
              <label className="label">Téléphone</label>
              <input
                value={telephone}
                onChange={(event) => setTelephone(event.target.value)}
                placeholder="+228 90 00 00 00"
                className="input"
              />
            </div>
            <button
              type="button"
              onClick={handleContinue}
              className="w-full rounded-3xl bg-blue-600 px-6 py-4 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Continuer vers le paiement
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
