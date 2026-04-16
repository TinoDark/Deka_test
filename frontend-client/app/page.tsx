import { Metadata } from 'next';
import { StorefrontHome } from '@/components/StorefrontHome';
import { fetchProducts } from '@/lib/api';

export const metadata: Metadata = {
  title: 'DEKA | Vitrine',
  description: 'Découvrez les produits actifs de la marketplace DEKA.',
};

export const revalidate = 60;

export default async function HomePage() {
  const productsResponse = await fetchProducts();
  const products = productsResponse?.data ?? [];

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">Vitrine</p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Découvrez les meilleurs produits de la plateforme
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-slate-600">
              Parcourez les produits actifs, recherchez par nom ou catégorie et achetez en toute simplicité.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <a
              href="/panier"
              className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              Voir mon panier
            </a>
            <a
              href="/connexion"
              className="inline-flex items-center justify-center rounded-2xl border border-blue-600 bg-white px-6 py-3 text-sm font-semibold text-blue-600 transition hover:bg-blue-50"
            >
              Se connecter
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <StorefrontHome products={products} />
      </section>
    </main>
  );
}
