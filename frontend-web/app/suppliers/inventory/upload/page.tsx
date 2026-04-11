'use client';

import React, { useState } from 'react';

export default function InventoryUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<Array<{ row: number; reference: string; reason: string }>>([]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setFile(event.target.files[0]);
      setMessage(null);
      setErrors([]);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!file) {
      setMessage('Veuillez sélectionner un fichier Excel à importer.');
      return;
    }

    setUploading(true);
    setMessage(null);
    setErrors([]);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/suppliers/inventory/upload', {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error || result.message || 'Erreur lors de l\'importation');
        return;
      }

      setMessage('Importation réussie !');
      setErrors(result.errors || []);
      setFile(null);
    } catch (error) {
      console.error('Upload error:', error);
      setMessage('Erreur interne lors de l\'importation du fichier.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Importer l'inventaire</h1>
          <p className="text-slate-600">Choisissez votre fichier Excel (.xlsx, .xls, .ods) pour synchroniser votre catalogue.</p>
        </div>

        <div className="bg-white shadow rounded-3xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="inventoryFile" className="block text-sm font-medium text-slate-700 mb-2">
                Fichier Excel
              </label>
              <input
                id="inventoryFile"
                type="file"
                accept=".xlsx,.xls,.ods"
                onChange={handleFileChange}
                className="block w-full text-sm text-slate-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>

            <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50">
              <p className="text-sm text-slate-600">
                Taille maximale : 10 Mo. Le fichier doit contenir les colonnes suivantes :
              </p>
              <ul className="mt-3 grid gap-2 text-slate-700 text-sm">
                <li>nom_produit</li>
                <li>prix_vente</li>
                <li>Commission</li>
                <li>Pourcentage_commission</li>
                <li>quantite_stock</li>
                <li>description</li>
                <li>reference_interne</li>
                <li>url_image</li>
              </ul>
            </div>

            {message && (
              <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50 text-slate-800">
                {message}
              </div>
            )}

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="submit"
                disabled={uploading}
                className="inline-flex items-center justify-center rounded-full bg-blue-600 px-6 py-3 text-white font-semibold shadow-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {uploading ? 'Importation...' : 'Importer'}
              </button>
              <a
                href="/suppliers/inventory"
                className="text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                Retour à la gestion d'inventaire
              </a>
            </div>
          </form>

          {errors.length > 0 && (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4">
              <h2 className="text-sm font-semibold text-red-900 mb-3">Erreurs détectées</h2>
              <ul className="space-y-2 text-sm text-red-800">
                {errors.slice(0, 10).map((error, index) => (
                  <li key={index}>
                    Ligne {error.row} - {error.reference} : {error.reason}
                  </li>
                ))}
              </ul>
              {errors.length > 10 && (
                <p className="text-xs text-red-700 mt-2">Affichage limité aux 10 premières erreurs.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
