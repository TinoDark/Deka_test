'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProductCard } from './ProductCard';
import { HeaderSearch } from './HeaderSearch';
import { type Product } from '@/lib/api';

interface StorefrontHomeProps {
  products: Product[];
}

export function StorefrontHome({ products }: StorefrontHomeProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  const categories = useMemo(() => {
    return Array.from(
      new Set(products.map((product) => product.categorie).filter((value): value is string => Boolean(value))),
    );
  }, [products]);

  const filteredProducts = useMemo(
    () =>
      products.filter((product) => {
        const query = search.toLowerCase();
        const name = (product.nom_produit || product.name || '').toLowerCase();
        const categoryName = (product.categorie || '').toLowerCase();

        return (
          (!query || name.includes(query) || categoryName.includes(query)) &&
          (!category || category === product.categorie)
        );
      }),
    [products, search, category],
  );

  const handleShopSearch = (slug: string) => {
    if (!slug) return;
    router.push(`/boutique/${encodeURIComponent(slug)}`);
  };

  return (
    <div className="space-y-8">
      <HeaderSearch
        categories={categories}
        onSearchChange={setSearch}
        onCategoryChange={setCategory}
        onShopSearch={handleShopSearch}
      />

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => <ProductCard key={product.id} product={product} />)
        ) : (
          <div className="rounded-[32px] border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600 shadow-sm">
            Aucune produit trouvé. Essayez une autre recherche ou catégorie.
          </div>
        )}
      </div>
    </div>
  );
}
