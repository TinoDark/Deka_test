'use client';

import Link from 'next/link';

export default function SignupPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-3xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="rounded-[32px] border border-slate-200 bg-white p-10 shadow-sm">
          <p className="text-sm uppercase tracking-[0.3em] text-blue-600">Inscription</p>
          <h1 className="mt-4 text-4xl font-bold text-slate-900">Créer un compte</h1>
          <p className="mt-4 text-slate-600">Page d’inscription client pour démarrer sur la vitrine.</p>
          <div className="mt-10 grid gap-4">
            <Link href="/" className="inline-flex items-center justify-center rounded-3xl bg-blue-600 px-6 py-4 text-sm font-semibold text-white hover:bg-blue-700">
              Retour à la vitrine
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
