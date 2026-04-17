import Link from 'next/link';
import { type Product } from '@/lib/api';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Link href={`/produit/${product.id}`} className="group block overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <div className="aspect-[4/3] overflow-hidden bg-slate-100">
        <img
          src={
            product.image_cdn_url ||
            product.image_url ||
            'https://via.placeholder.com/640x480?text=Image+manquante'
          }
          alt={product.nom_produit}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />
      </div>
      <div className="p-5">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">{product.categorie || 'Produit'}</p>
        <h3 className="mt-3 text-xl font-semibold text-slate-900">{product.nom_produit}</h3>
        <p className="mt-3 text-sm leading-6 text-slate-600 line-clamp-2">{product.description || 'Description non disponible.'}</p>
        <div className="mt-5 flex items-center justify-between gap-4">
          <span className="text-lg font-bold text-slate-900">{product.prix_vente?.toFixed?.(2) ?? product.prix_vente} FCFA</span>
          <span className="text-sm text-slate-500">+ livraison</span>
        </div>
      </div>
    </Link>
  );
}
