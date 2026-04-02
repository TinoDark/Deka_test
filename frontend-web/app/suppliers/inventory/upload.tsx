'use client';

import React, { useState, useRef } from 'react';
import { Upload, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface SyncReport {
  id: string;
  syncedAt: string;
  source: 'EXCEL_UPLOAD' | 'AGENT' | 'DASHBOARD_MANUAL';
  productsCreated: number;
  productsUpdated: number;
  productsDeactivated: number;
  errors: Array<{
    row: number;
    reference: string;
    reason: string;
  }>;
}

export default function InventoryUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [report, setReport] = useState<SyncReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validation: doit être un fichier Excel
    const isValidFormat = 
      selectedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      selectedFile.type === 'application/vnd.ms-excel' ||
      selectedFile.name.endsWith('.xlsx') ||
      selectedFile.name.endsWith('.xls');

    if (!isValidFormat) {
      setError('Veuillez sélectionner un fichier Excel (.xlsx ou .xls)');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('Le fichier ne doit pas dépasser 10 MB');
      return;
    }

    setFile(selectedFile);
    setError(null);
    setReport(null);
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Veuillez sélectionner un fichier');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/suppliers/inventory/upload', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur serveur: ${response.status}`);
      }

      const data = await response.json();
      setReport(data);
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError(`Erreur lors de l'upload: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      const fakeEvent = {
        target: { files: [droppedFile] },
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      handleFileSelect(fakeEvent);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-2xl mx-auto">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Synchronisation Inventaire
          </h1>
          <p className="text-lg text-slate-600">
            Uploadez votre fichier Excel pour mettre à jour votre catalogue de produits
          </p>
        </div>

        {/* Zone de upload */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`border-3 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer ${
              file
                ? 'border-green-400 bg-green-50'
                : 'border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
              disabled={uploading}
            />

            {file ? (
              <div className="flex items-center justify-center space-x-3">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <div className="text-left">
                  <p className="font-semibold text-green-900">{file.name}</p>
                  <p className="text-sm text-green-700">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <Upload className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <p className="text-xl font-semibold text-slate-800 mb-2">
                  Glissez-déposez votre fichier Excel
                </p>
                <p className="text-slate-600 mb-4">ou</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  Sélectionner un fichier
                </button>
                <p className="text-sm text-slate-500 mt-4">
                  Format: .xlsx, .xls | Max: 10 MB
                </p>
              </div>
            )}
          </div>

          {/* Bouton upload (visible si fichier sélectionné) */}
          {file && !uploading && (
            <button
              onClick={handleUpload}
              className="w-full mt-6 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              ✓ Synchroniser l'inventaire
            </button>
          )}

          {uploading && (
            <div className="mt-6 flex items-center justify-center space-x-3">
              <Clock className="w-5 h-5 text-blue-600 animate-spin" />
              <span className="text-blue-600 font-medium">
                Synchronisation en cours...
              </span>
            </div>
          )}
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

        {/* Rapport de synchronisation */}
        {report && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">
Rapport de synchronisation
            </h2>

            {/* Résumé principal */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <p className="text-sm text-green-700 font-semibold uppercase">
                  Produits créés
                </p>
                <p className="text-4xl font-bold text-green-900">
                  {report.productsCreated}
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <p className="text-sm text-blue-700 font-semibold uppercase">
                  Produits mis à jour
                </p>
                <p className="text-4xl font-bold text-blue-900">
                  {report.productsUpdated}
                </p>
              </div>

              {report.productsDeactivated > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                  <p className="text-sm text-yellow-700 font-semibold uppercase">
                    Produits désactivés
                  </p>
                  <p className="text-4xl font-bold text-yellow-900">
                    {report.productsDeactivated}
                  </p>
                </div>
              )}

              {report.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                  <p className="text-sm text-red-700 font-semibold uppercase">
                    Erreurs détectées
                  </p>
                  <p className="text-4xl font-bold text-red-900">
                    {report.errors.length}
                  </p>
                </div>
              )}
            </div>

            {/* Détails du rapport */}
            <div className="space-y-4 text-sm text-slate-600">
              <div className="flex justify-between">
                <span>Date synchronisation:</span>
                <span className="font-medium text-slate-900">
                  {new Date(report.syncedAt).toLocaleString('fr-FR')}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Source:</span>
                <span className="font-medium text-slate-900">Upload manuel</span>
              </div>
            </div>

            {/* Tableau d'erreurs (si présentes) */}
            {report.errors.length > 0 && (
              <div className="mt-8 pt-8 border-t border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">
                  ⚠️ Détails des erreurs
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">
                          Ligne
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">
                          Référence
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">
                          Raison
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.errors.slice(0, 10).map((err, idx) => (
                        <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-3 px-4 text-slate-600">{err.row}</td>
                          <td className="py-3 px-4 font-mono text-slate-800">
                            {err.reference}
                          </td>
                          <td className="py-3 px-4 text-red-600">{err.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {report.errors.length > 10 && (
                  <p className="text-center text-slate-500 mt-4 text-xs">
                    ... et {report.errors.length - 10} autres erreurs
                  </p>
                )}
              </div>
            )}

            {/* Actions suivantes */}
            <div className="mt-8 pt-8 border-t border-slate-200">
              <button
                onClick={() => {
                  setReport(null);
                  setFile(null);
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
              >
                ↻ Nouvel upload
              </button>
            </div>
          </div>
        )}

        {/* Aide */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-2xl p-6">
          <h3 className="font-bold text-blue-900 mb-4">ℹ️ Guide du format Excel</h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li>✓ <strong>Colonnes requises:</strong> nom_produit, prix_vente, commission, quantite_stock, description, reference_interne, url_image</li>
            <li>✓ <strong>reference_interne:</strong> clé unique pour identifier vos produits (ne pas modifier une fois créé)</li>
            <li>✓ <strong>quantite_stock = 0</strong> désactive automatiquement le produit</li>
            <li>✓ <strong>url_image:</strong> doit commencer par https:// et être accessible publiquement</li>
            <li>✓ Consulter la documentation pour le modèle Excel complet</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
