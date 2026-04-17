'use client';

import { useState } from 'react';

interface HeaderSearchProps {
  categories: string[];
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onShopSearch: (slug: string) => void;
}

export function HeaderSearch({ categories, onSearchChange, onCategoryChange, onShopSearch }: HeaderSearchProps) {
  const [shopQuery, setShopQuery] = useState('');

  const handleSubmit = () => {
    const slug = shopQuery.trim().toLowerCase().replace(/\s+/g, '-');
    if (!slug) return;
    onShopSearch(slug);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
          <label className="label">Rechercher un produit</label>
          <input
            type="search"
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Nom, catégorie, description..."
            className="input"
          />
        </div>
        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
          <label className="label">Filtrer par catégorie</label>
          <select onChange={(event) => onCategoryChange(event.target.value)} className="input">
            <option value="">Toutes les catégories</option>
            {categories.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm lg:max-w-3xl">
        <p className="label">Rechercher une boutique</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="text"
            value={shopQuery}
            onChange={(event) => setShopQuery(event.target.value)}
            placeholder="Entrez le nom ou le slug de la boutique"
            className="input flex-1"
          />
          <button
            type="button"
            onClick={handleSubmit}
            className="rounded-3xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Rechercher la boutique
          </button>
        </div>
        <p className="mt-3 text-sm text-slate-500">
          Si la boutique existe, vous serez redirigé vers sa page. Sinon, vérifiez le slug de la boutique.
        </p>
      </div>
    </div>
  );
}
