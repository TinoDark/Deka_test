'use client';

import Link from 'next/link';

export default function ConnexionPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-3xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="rounded-[32px] border border-slate-200 bg-white p-10 shadow-sm text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">Connexion</p>
          <h1 className="mt-4 text-4xl font-bold text-slate-900">Accédez à votre espace client</h1>
          <p className="mt-4 text-slate-600">Connectez-vous pour suivre votre commande ou consulter votre panier.</p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-3xl bg-blue-600 px-6 py-4 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Se connecter
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-3xl border border-slate-200 bg-white px-6 py-4 text-sm font-semibold text-slate-900 hover:bg-slate-50"
            >
              Créer un compte
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
