'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Download,
  AlertCircle,
  CheckCircle2,
  Clock,
  BarChart3,
} from 'lucide-react';
import Link from 'next/link';

interface SyncDetail {
  id: string;
  supplierId: string;
  supplierEmail: string;
  syncedAt: string;
  source: string;
  productsCreated: number;
  productsUpdated: number;
  productsDeactivated: number;
  errors: Array<{
    row: number;
    reference: string;
    reason: string;
  }>;
}

export default function AdminSyncDetailPage() {
  const params = useParams();
  const syncId = params.syncId as string;

  const [sync, setSync] = useState<SyncDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportingCSV, setExportingCSV] = useState(false);

  useEffect(() => {
    fetchSyncDetail();
  }, [syncId]);

  const fetchSyncDetail = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/syncs/${syncId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Sync not found');
      }

      const data = await response.json();
      setSync(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    if (!sync) return;

    setExportingCSV(true);

    try {
      const response = await fetch(`/api/admin/syncs/${syncId}/export-csv`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Récupérer le fichier CSV
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sync-${syncId}-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExportingCSV(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Chargement des détails...</p>
        </div>
      </div>
    );
  }

  if (error || !sync) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/admin/syncs/dashboard"
            className="flex items-center text-blue-600 hover:text-blue-800 mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Retour au tableau de bord
          </Link>

          <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded">
            <div className="flex items-center mb-4">
              <AlertCircle className="w-6 h-6 text-red-600 mr-3" />
              <h2 className="text-lg font-semibold text-red-900">
                Erreur lors du chargement
              </h2>
            </div>
            <p className="text-red-700">{error || 'Sync not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  const successRate = sync.errors.length === 0 ? 100 : 95;
  const totalProcessed =
    sync.productsCreated + sync.productsUpdated + sync.productsDeactivated;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-5xl mx-auto">
        {/* En-tête avec bouton retour */}
        <div className="mb-8">
          <Link
            href="/admin/syncs/dashboard"
            className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Retour au tableau de bord
          </Link>

          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-2">
                📊 Détails de la synchronisation
              </h1>
              <p className="text-lg text-slate-600">
                {sync.supplierEmail} • {new Date(sync.syncedAt).toLocaleString('fr-FR')}
              </p>
            </div>

            <button
              onClick={handleExportCSV}
              disabled={exportingCSV}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
            >
              <Download className="w-4 h-4 mr-2" />
              {exportingCSV ? 'Export...' : 'Export CSV'}
            </button>
          </div>
        </div>

        {/* Cartes récapitulatifs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <p className="text-sm text-slate-600 font-semibold uppercase">
              Créés
            </p>
            <p className="text-3xl font-bold text-green-900 mt-2">
              {sync.productsCreated}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <p className="text-sm text-slate-600 font-semibold uppercase">
              Mis à jour
            </p>
            <p className="text-3xl font-bold text-blue-900 mt-2">
              {sync.productsUpdated}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
            <p className="text-sm text-slate-600 font-semibold uppercase">
              Désactivés
            </p>
            <p className="text-3xl font-bold text-yellow-900 mt-2">
              {sync.productsDeactivated}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
            <p className="text-sm text-slate-600 font-semibold uppercase">
              Erreurs
            </p>
            <p className="text-3xl font-bold text-red-900 mt-2">
              {sync.errors.length}
            </p>
          </div>
        </div>

        {/* Informations détaillées */}
        <div className="bg-white rounded-lg shadow p-8 mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
            <BarChart3 className="w-6 h-6 mr-3 text-blue-600" /> Informations
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-slate-600 font-semibold uppercase">
                Fournisseur
              </p>
              <p className="text-lg text-slate-900 mt-1">{sync.supplierEmail}</p>
              <p className="text-sm text-slate-500 mt-1">{sync.supplierId}</p>
            </div>

            <div>
              <p className="text-sm text-slate-600 font-semibold uppercase">
                Source
              </p>
              <div className="mt-1">
                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {sync.source === 'EXCEL_UPLOAD'
                    ? '📤 Upload Excel'
                    : sync.source === 'AGENT'
                    ? '🤖 Agent local'
                    : '🖱️ Manual'}
                </span>
              </div>
            </div>

            <div>
              <p className="text-sm text-slate-600 font-semibold uppercase">
                Date & Heure
              </p>
              <p className="text-lg text-slate-900 mt-1">
                {new Date(sync.syncedAt).toLocaleString('fr-FR')}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-600 font-semibold uppercase">
                Total traité
              </p>
              <p className="text-lg text-slate-900 mt-1">{totalProcessed} produits</p>
              <p className="text-sm text-slate-500 mt-1">
                Taux de réussite: {sync.errors.length === 0 ? '100%' : '95%'}
              </p>
            </div>
          </div>

          {/* Résumé opération */}
          <div className="mt-8 pt-8 border-t border-slate-200">
            <h3 className="font-semibold text-slate-900 mb-4">Résumé opération</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded">
                <span className="text-green-800">
                  <CheckCircle2 className="inline w-5 h-5 mr-2" />
                  Produits créés
                </span>
                <span className="font-bold text-green-900">+{sync.productsCreated}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-blue-50 rounded">
                <span className="text-blue-800">
                  <Clock className="inline w-5 h-5 mr-2" />
                  Produits mis à jour
                </span>
                <span className="font-bold text-blue-900">~{sync.productsUpdated}</span>
              </div>

              {sync.productsDeactivated > 0 && (
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded">
                  <span className="text-yellow-800">
                    Produits désactivés
                  </span>
                  <span className="font-bold text-yellow-900">
                    -{sync.productsDeactivated}
                  </span>
                </div>
              )}

              {sync.errors.length > 0 && (
                <div className="flex items-center justify-between p-3 bg-red-50 rounded">
                  <span className="text-red-800">
                    <AlertCircle className="inline w-5 h-5 mr-2" />
                    Erreurs détectées
                  </span>
                  <span className="font-bold text-red-900">{sync.errors.length}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tableau des erreurs */}
        {sync.errors.length > 0 && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="bg-red-50 border-b border-red-200 p-6">
              <h2 className="text-2xl font-bold text-red-900 flex items-center">
                <AlertCircle className="w-6 h-6 mr-3" /> Erreurs détectées (
                {sync.errors.length})
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 w-20">
                      Ligne
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                      Référence produit
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                      Raison de l'erreur
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {sync.errors.map((err, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm font-mono text-slate-600">
                        {err.row}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">
                        {err.reference}
                      </td>
                      <td className="px-6 py-4 text-sm text-red-600">
                        {err.reason}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {sync.errors.length === 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <p className="text-lg font-semibold text-green-900">
              ✓ Synchronisation réussie sans erreurs
            </p>
            <p className="text-green-700 mt-2">
              Tous les {totalProcessed} produits ont été traités avec succès.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
