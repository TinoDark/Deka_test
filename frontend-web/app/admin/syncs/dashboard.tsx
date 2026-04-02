'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle, Filter, Search } from 'lucide-react';

interface Sync {
  id: string;
  supplierId: string;
  supplierEmail: string;
  syncedAt: string;
  source: 'EXCEL_UPLOAD' | 'AGENT' | 'DASHBOARD_MANUAL';
  productsCreated: number;
  productsUpdated: number;
  productsDeactivated: number;
  errorsCount: number;
}

interface SyncStats {
  period: string;
  totalSyncs: number;
  totalProducts: {
    created: number;
    updated: number;
    deactivated: number;
  };
  syncsBySource: {
    EXCEL_UPLOAD: number;
    AGENT: number;
    DASHBOARD_MANUAL: number;
  };
  suppliersWithSyncs: number;
  averageErrorsPerSync: number;
}

export default function AdminSyncsDashboard() {
  const [syncs, setSyncs] = useState<Sync[]>([]);
  const [stats, setStats] = useState<SyncStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtres
  const [searchSupplier, setSearchSupplier] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string>('');
  const [daysFilter, setDaysFilter] = useState('30');
  const [limit] = useState('50');
  const [offset, setOffset] = useState('0');

  // Chargement initial
  useEffect(() => {
    fetchSyncsAndStats();
  }, [searchSupplier, sourceFilter, daysFilter, offset]);

  const fetchSyncsAndStats = async () => {
    setLoading(true);
    setError(null);

    try {
      // Construire les paramètres de requête
      const params = new URLSearchParams();
      if (searchSupplier) params.append('supplierId', searchSupplier);
      if (sourceFilter) params.append('source', sourceFilter);
      params.append('limit', limit);
      params.append('offset', offset);

      // Récupérer les syncs
      const syncsRes = await fetch(`/api/admin/syncs?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!syncsRes.ok) throw new Error('Erreur lors de la récupération des syncs');
      const syncsData = await syncsRes.json();
      setSyncs(syncsData.syncs || []);

      // Récupérer les statistiques
      const statsRes = await fetch(`/api/admin/syncs/stats?days=${daysFilter}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!statsRes.ok) throw new Error('Erreur lors de la récupération des stats');
      const statsData = await statsRes.json();
      setStats(statsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const getSourceBadgeColor = (source: string) => {
    switch (source) {
      case 'EXCEL_UPLOAD':
        return 'bg-blue-100 text-blue-800';
      case 'AGENT':
        return 'bg-green-100 text-green-800';
      case 'DASHBOARD_MANUAL':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'EXCEL_UPLOAD':
        return 'Upload Excel';
      case 'AGENT':
        return 'Agent local';
      case 'DASHBOARD_MANUAL':
        return 'Manual';
      default:
        return source;
    }
  };

  if (loading && syncs.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Chargement des syncs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Synchronisations
          </h1>
          <p className="text-lg text-slate-600">
            Visualisez et analysez toutes les synchronisations d'inventaire
          </p>
        </div>

        {/* Statistiques (si disponibles) */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-slate-600 font-semibold uppercase">
                Total Syncs
              </p>
              <p className="text-3xl font-bold text-slate-900 mt-2">
                {stats.totalSyncs}
              </p>
            </div>

            <div className="bg-green-50 rounded-lg shadow p-6 border border-green-200">
              <p className="text-sm text-green-700 font-semibold uppercase">
                Produits créés
              </p>
              <p className="text-3xl font-bold text-green-900 mt-2">
                {stats.totalProducts.created}
              </p>
            </div>

            <div className="bg-blue-50 rounded-lg shadow p-6 border border-blue-200">
              <p className="text-sm text-blue-700 font-semibold uppercase">
                Produits mis à jour
              </p>
              <p className="text-3xl font-bold text-blue-900 mt-2">
                {stats.totalProducts.updated}
              </p>
            </div>

            <div className="bg-amber-50 rounded-lg shadow p-6 border border-amber-200">
              <p className="text-sm text-amber-700 font-semibold uppercase">
                Fournisseurs
              </p>
              <p className="text-3xl font-bold text-amber-900 mt-2">
                {stats.suppliersWithSyncs}
              </p>
            </div>

            <div className="bg-red-50 rounded-lg shadow p-6 border border-red-200">
              <p className="text-sm text-red-700 font-semibold uppercase">
                Err/Sync (moy)
              </p>
              <p className="text-3xl font-bold text-red-900 mt-2">
                {stats.averageErrorsPerSync}
              </p>
            </div>
          </div>
        )}

        {/* Filtres */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
            <Filter className="w-5 h-5 mr-2" /> Filtres
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Recherche fournisseur */}
            <div className="relative">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Rechercher fournisseur
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Supplier ID ou email"
                  value={searchSupplier}
                  onChange={(e) => {
                    setSearchSupplier(e.target.value);
                    setOffset('0');
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Filtre source */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Source
              </label>
              <select
                value={sourceFilter}
                onChange={(e) => {
                  setSourceFilter(e.target.value);
                  setOffset('0');
                }}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="">Tous les types</option>
                <option value="EXCEL_UPLOAD">Upload Excel</option>
                <option value="AGENT">Agent local</option>
                <option value="DASHBOARD_MANUAL">🖱️ Manual</option>
              </select>
            </div>

            {/* Filtre période */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Période
              </label>
              <select
                value={daysFilter}
                onChange={(e) => {
                  setDaysFilter(e.target.value);
                  setOffset('0');
                }}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="7">7 derniers jours</option>
                <option value="30">30 derniers jours</option>
                <option value="90">90 derniers jours</option>
                <option value="365">1 année</option>
              </select>
            </div>

            {/* Bouton rafraîchir */}
            <div className="flex items-end">
              <button
                onClick={fetchSyncsAndStats}
                disabled={loading}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Chargement...' : 'Rafraîchir'}
              </button>
            </div>
          </div>
        </div>

        {/* Messages d'erreur */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Tableau des syncs */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                  Fournisseur
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                  Source
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">
                  Créés
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">
                  Mis à jour
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">
                  Erreurs
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {syncs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                    Aucune synchronisation trouvée
                  </td>
                </tr>
              ) : (
                syncs.map((sync) => (
                  <tr key={sync.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-slate-900">{sync.supplierEmail}</p>
                        <p className="text-xs text-slate-500">{sync.supplierId.substring(0, 8)}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {new Date(sync.syncedAt).toLocaleString('fr-FR')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getSourceBadgeColor(sync.source)}`}>
                        {getSourceLabel(sync.source)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-block px-2 py-1 bg-green-100 text-green-800 rounded text-sm font-medium">
                        +{sync.productsCreated}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm font-medium">
                        ~{sync.productsUpdated}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {sync.errorsCount > 0 ? (
                        <span className="inline-block px-2 py-1 bg-red-100 text-red-800 rounded text-sm font-medium">
                          {sync.errorsCount}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <a
                        href={`/admin/syncs/${sync.id}`}
                        className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                      >
                        Voir détails →
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-6 flex justify-between items-center">
          <p className="text-sm text-slate-600">
            Affichage de {syncs.length} résultat(s)
          </p>
          <div className="space-x-2">
            <button
              onClick={() => setOffset(String(Math.max(0, parseInt(offset) - parseInt(limit))))}
              disabled={parseInt(offset) === 0}
              className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg disabled:opacity-50 hover:bg-slate-300"
            >
              ← Précédent
            </button>
            <button
              onClick={() => setOffset(String(parseInt(offset) + parseInt(limit)))}
              disabled={syncs.length < parseInt(limit)}
              className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg disabled:opacity-50 hover:bg-slate-300"
            >
              Suivant →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
