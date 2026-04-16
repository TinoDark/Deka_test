'use client';

import { ProductCard } from './ProductCard';
import { useMemo, useState } from 'react';

interface StorefrontHomeProps {
  products: Array<any>;
}

export function StorefrontHome({ products }: StorefrontHomeProps) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  const categories = useMemo(
    () => Array.from(new Set(products.map((product) => product.categorie).filter(Boolean))),
    [products],
  );

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

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-[1.5fr_0.8fr]">
        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
          <label className="label">Rechercher un produit</label>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Nom, catégorie, description..."
            className="input"
          />
        </div>
        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
          <label className="label">Filtrer par catégorie</label>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="input"
          >
            <option value="">Toutes les catégories</option>
            {categories.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
      </div>

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
