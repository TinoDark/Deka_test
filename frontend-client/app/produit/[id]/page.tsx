import { ProductDetailClient } from '@/components/ProductDetailClient';
import { fetchProduct } from '@/lib/api';

export async function generateMetadata({ params }: { params: { id: string } }) {
  const product = await fetchProduct(params.id);
  return {
    title: product ? `${product.nom_produit} | DEKA` : 'Produit | DEKA',
  };
}

export default async function ProductPage({ params }: { params: { id: string } }) {
  const product = await fetchProduct(params.id);

  if (!product) {
    return (
      <main className="min-h-screen bg-slate-50">
        <section className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="rounded-[32px] border border-slate-200 bg-white p-10 text-center shadow-sm">
            <h1 className="text-3xl font-bold text-slate-900">Produit introuvable</h1>
            <p className="mt-4 text-slate-600">Ce produit n’est plus disponible ou a été retiré.</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            <img
              src={
                product.image_cdn_url ||
                product.image_url ||
                'https://via.placeholder.com/640x480?text=Image+manquante'
              }
              alt={product.nom_produit}
              className="h-[420px] w-full rounded-[28px] object-cover"
            />
            <div className="mt-6 space-y-4">
              <p className="text-sm uppercase tracking-[0.3em] text-blue-600">{product.categorie || 'Produit'}</p>
              <h1 className="text-4xl font-bold text-slate-900">{product.nom_produit}</h1>
              <p className="text-lg text-slate-600 leading-8">{product.description}</p>
              <div className="flex flex-wrap gap-3">
                <span className="rounded-3xl bg-slate-100 px-4 py-2 text-sm text-slate-700">Commission: {product.commission} FCFA</span>
                <span className="rounded-3xl bg-slate-100 px-4 py-2 text-sm text-slate-700">{product.pourcentage_commission}%</span>
              </div>
            </div>
          </div>

          <ProductDetailClient product={product} />
        </div>
      </section>
    </main>
  );
}
