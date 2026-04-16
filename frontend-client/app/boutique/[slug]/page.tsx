import { ProductCard } from '@/components/ProductCard';
import { StoreOriginSetter } from '@/components/StoreOriginSetter';
import { fetchStore, fetchStoreProducts } from '@/lib/api';

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const store = await fetchStore(params.slug);
  return {
    title: store ? `${store.name} | DEKA Boutique` : 'Boutique | DEKA',
  };
}

export default async function BoutiquePage({ params }: { params: { slug: string } }) {
  const store = await fetchStore(params.slug);
  const productsResponse = await fetchStoreProducts(params.slug);
  const products = productsResponse?.data ?? [];

  if (!store) {
    return (
      <main className="min-h-screen bg-slate-50">
        <section className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="rounded-[32px] border border-slate-200 bg-white p-10 text-center shadow-sm">
            <h1 className="text-3xl font-bold text-slate-900">Boutique introuvable</h1>
            <p className="mt-4 text-slate-600">La boutique que vous recherchez n’existe pas ou n’est pas active.</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <StoreOriginSetter slug={params.slug} />
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">Boutique</p>
              <h1 className="mt-3 text-4xl font-bold text-slate-900">{store.name}</h1>
              <p className="mt-3 text-slate-600 max-w-2xl">{store.description || 'Découvrez tous les produits disponibles dans cette boutique.'}</p>
            </div>
            <div className="rounded-3xl bg-slate-50 px-6 py-4 text-sm text-slate-700">
              <p className="font-semibold">Localisation</p>
              <p>{store.location || 'Non renseignée'}</p>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {products.length > 0 ? (
              products.map((product) => <ProductCard key={product.id} product={product} />)
            ) : (
              <div className="col-span-full rounded-[32px] border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600 shadow-sm">
                Aucun produit actif trouvé pour cette boutique.
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
