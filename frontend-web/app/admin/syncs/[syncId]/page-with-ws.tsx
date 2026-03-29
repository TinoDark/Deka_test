'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import {
  ArrowLeft,
  Download,
  AlertCircle,
  CheckCircle2,
  Clock,
  BarChart3,
  Zap,
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

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';

export default function AdminSyncDetailPageWithWS() {
  const params = useParams();
  const syncId = params.syncId as string;

  const [sync, setSync] = useState<SyncDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportingCSV, setExportingCSV] = useState(false);
  const [wsStatus, setWsStatus] = useState<ConnectionStatus>('disconnected');
  const [realtimeUpdates, setRealtimeUpdates] = useState<string[]>([]);
  // const [socket, setSocket] = useState<Socket | null>(null); // WebSocket managed via useEffect

  // Chargement initial du sync
  useEffect(() => {
    fetchSyncDetail();
  }, [syncId]);

  // Configuration WebSocket
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId') || 'admin';

    const newSocket = io(
      process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'http://localhost:3000/notifications',
      {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      },
    );

    newSocket.on('connect', () => {
      setWsStatus('connecting');

      // Authentifier
      newSocket.emit('auth', {
        userId,
        token,
      });
    });

    newSocket.on('auth_success', () => {
      setWsStatus('connected');
      addRealtimeUpdate('✓ Connecté aux notifications');

      // S'abonner aux syncs admin
      newSocket.emit('subscribe', { room: 'admin-syncs' });
    });

    newSocket.on('auth_error', (err: any) => {
      setWsStatus('disconnected');
      addRealtimeUpdate(`✗ Auth failed: ${(err as any)?.message || 'Unknown error'}`);
    });

    newSocket.on('disconnect', () => {
      setWsStatus('disconnected');
      addRealtimeUpdate('✗ Déconnecté');
    });

    // Écouter les mises à jour de syncs temps réel
    newSocket.on('sync_completed', (report: any) => {
      addRealtimeUpdate(
        `✓ Sync complété: ${report.productsCreated} créés, ${report.errorsCount || 0} erreurs`,
      );

      // Mettre à jour localement si c'est le même sync
      if (report.id === syncId) {
        setSync((prev) =>
          prev
            ? {
                ...prev,
                productsCreated: report.productsCreated,
                productsUpdated: report.productsUpdated,
                productsDeactivated: report.productsDeactivated,
              }
            : prev,
        );
      }
    });

    newSocket.on('sync_failed', (data: any) => {
      addRealtimeUpdate(`✗ Sync échoué: ${data.error}`);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const addRealtimeUpdate = (message: string) => {
    const timestamp = new Date().toLocaleTimeString('fr-FR');
    setRealtimeUpdates((prev) => [
      `[${timestamp}] ${message}`,
      ...prev.slice(0, 9), // Garder 10 max
    ]);
  };

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

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sync-${syncId}-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
      addRealtimeUpdate('✓ Export CSV complété');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Export failed';
      setError(errorMsg);
      addRealtimeUpdate(`✗ Export failed: ${errorMsg}`);
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
              <h2 className="text-lg font-semibold text-red-900">Erreur</h2>
            </div>
            <p className="text-red-700">{error || 'Sync not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  const totalProcessed =
    sync.productsCreated + sync.productsUpdated + sync.productsDeactivated;

  const wsStatusColor =
    wsStatus === 'connected'
      ? 'bg-green-100 text-green-800'
      : wsStatus === 'connecting'
      ? 'bg-yellow-100 text-yellow-800'
      : 'bg-red-100 text-red-800';

  const wsStatusIcon =
    wsStatus === 'connected' ? (
      <CheckCircle2 className="w-4 h-4" />
    ) : wsStatus === 'connecting' ? (
      <Clock className="w-4 h-4 animate-spin" />
    ) : (
      <AlertCircle className="w-4 h-4" />
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* En-tête */}
        <div className="mb-8">
          <Link
            href="/admin/syncs/dashboard"
            className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Retour au tableau de bord
          </Link>

          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-2">
                📊 Détails de la synchronisation
              </h1>
              <p className="text-lg text-slate-600">
                {sync.supplierEmail} • {new Date(sync.syncedAt).toLocaleString('fr-FR')}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${wsStatusColor}`}>
                {wsStatusIcon}
                <span>{wsStatus === 'connected' ? 'En live' : wsStatus === 'connecting' ? 'Connexion...' : 'Hors ligne'}</span>
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
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Colonne principale (données détaillées) */}
          <div className="lg:col-span-2">
            {/* Cartes récapitulatifs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
                <p className="text-sm text-slate-600 font-semibold uppercase">Créés</p>
                <p className="text-3xl font-bold text-green-900 mt-2">
                  {sync.productsCreated}
                </p>
              </div>

              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
                <p className="text-sm text-slate-600 font-semibold uppercase">Mis à jour</p>
                <p className="text-3xl font-bold text-blue-900 mt-2">
                  {sync.productsUpdated}
                </p>
              </div>

              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
                <p className="text-sm text-slate-600 font-semibold uppercase">Désactivés</p>
                <p className="text-3xl font-bold text-yellow-900 mt-2">
                  {sync.productsDeactivated}
                </p>
              </div>

              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
                <p className="text-sm text-slate-600 font-semibold uppercase">Erreurs</p>
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
                  <p className="text-sm text-slate-600 font-semibold uppercase">Fournisseur</p>
                  <p className="text-lg text-slate-900 mt-1">{sync.supplierEmail}</p>
                </div>

                <div>
                  <p className="text-sm text-slate-600 font-semibold uppercase">Source</p>
                  <span className="inline-block mt-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    {sync.source === 'EXCEL_UPLOAD'
                      ? '📤 Upload Excel'
                      : sync.source === 'AGENT'
                      ? '🤖 Agent local'
                      : '🖱️ Manual'}
                  </span>
                </div>

                <div>
                  <p className="text-sm text-slate-600 font-semibold uppercase">Date & Heure</p>
                  <p className="text-lg text-slate-900 mt-1">
                    {new Date(sync.syncedAt).toLocaleString('fr-FR')}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-600 font-semibold uppercase">Total traité</p>
                  <p className="text-lg text-slate-900 mt-1">{totalProcessed} produits</p>
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
                          <td className="px-6 py-4 text-sm text-red-600">{err.reason}</td>
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
              </div>
            )}
          </div>

          {/* Colonne WebSocket (mises à jour temps réel) */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow overflow-hidden sticky top-8">
              <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-6">
                <h3 className="text-lg font-bold text-white flex items-center">
                  <Zap className="w-5 h-5 mr-2" /> Mises à jour temps réel
                </h3>
              </div>

              {/* Flux des mises à jour */}
              <div className="h-96 overflow-y-auto bg-slate-50 p-4 space-y-2">
                {realtimeUpdates.length === 0 ? (
                  <p className="text-sm text-slate-500 italic">
                    En attente de notifications...
                  </p>
                ) : (
                  realtimeUpdates.map((update, idx) => (
                    <div key={idx} className="text-sm font-mono text-slate-700 p-2 bg-white rounded border border-slate-200">
                      {update}
                    </div>
                  ))
                )}
              </div>

              {/* Statut de connexion */}
              <div className="border-t border-slate-200 p-4">
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${wsStatusColor}`}>
                  {wsStatusIcon}
                  <span>
                    {wsStatus === 'connected'
                      ? 'Connecté'
                      : wsStatus === 'connecting'
                      ? 'Connexion en cours...'
                      : 'Pas de connexion'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
