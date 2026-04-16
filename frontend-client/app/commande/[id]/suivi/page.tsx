'use client';

import Link from 'next/link';

interface TrackingPageProps {
  params: {
    id: string;
  };
}

const steps = [
  { label: 'Commande reçue', completed: true },
  { label: 'Préparation en cours', completed: true },
  { label: 'En route', completed: false },
  { label: 'Livrée', completed: false },
];

export default function TrackingPage({ params }: TrackingPageProps) {
  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm uppercase tracking-[0.3em] text-blue-600">Suivi de commande</p>
          <h1 className="mt-4 text-4xl font-bold text-slate-900">Commande {params.id}</h1>
          <p className="mt-3 text-slate-600">Suivez l’état de votre livraison en temps réel.</p>

          <div className="mt-10 space-y-6">
            {steps.map((step) => (
              <div key={step.label} className="flex items-start gap-4">
                <div className={`mt-1 h-4 w-4 rounded-full ${step.completed ? 'bg-blue-600' : 'bg-slate-300'}`} />
                <div>
                  <p className="font-semibold text-slate-900">{step.label}</p>
                  <p className="text-sm text-slate-600">{step.completed ? 'Terminé' : 'En attente'}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-3xl bg-blue-600 px-6 py-4 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Retour à la vitrine
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
