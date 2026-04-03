'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, Upload, AlertCircle, CheckCircle, Clock, Package, DollarSign, BarChart3 } from 'lucide-react';

interface Product {
  id: string;
  referenceInterne: string;
  nomProduit: string;
  description: string;
  caracteristique?: string;
  categorie?: string;
  prixVente: number;
  commission: number;
  pourcentageCommission: number;
  stockQuantity: number;
  isActive: boolean;
  imageUrl?: string;
  imageCdnUrl?: string;
  lastSyncedAt?: string;
  syncSource: string;
}

interface SyncReport {
  id: string;
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

export default function InventoryManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncReport, setSyncReport] = useState<SyncReport | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    referenceInterne: '',
    nomProduit: '',
    description: '',
    caracteristique: '',
    categorie: '',
    prixVente: '',
    commission: '',
    pourcentageCommission: '',
    stockQuantity: '',
    imageUrl: ''
  });

  // Charger les produits et le rapport de sync
  useEffect(() => {
    loadProducts();
    loadSyncReport();
  }, []);

  const loadProducts = async () => {
    try {
      const response = await fetch('/api/suppliers/inventory/products', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      } else {
        console.error('Erreur lors du chargement des produits');
        setProducts([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des produits:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const loadSyncReport = async () => {
    try {
      const response = await fetch('/api/suppliers/inventory/sync-report', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSyncReport(data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement du rapport:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const productData = {
        referenceInterne: formData.referenceInterne,
        nomProduit: formData.nomProduit,
        description: formData.description,
        caracteristique: formData.caracteristique || undefined,
        categorie: formData.categorie || undefined,
        prixVente: parseFloat(formData.prixVente),
        commission: parseFloat(formData.commission),
        pourcentageCommission: parseFloat(formData.pourcentageCommission),
        stockQuantity: parseInt(formData.stockQuantity),
        imageUrl: formData.imageUrl || undefined,
      };

      const url = editingProduct
        ? `/api/suppliers/inventory/products/${editingProduct.id}`
        : '/api/suppliers/inventory/products';

      const method = editingProduct ? 'POST' : 'POST'; // Utilise POST pour les deux (Next.js)

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la sauvegarde');
      }

      // Recharger les produits
      await loadProducts();

      // Réinitialiser le formulaire
      resetForm();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('Erreur lors de la sauvegarde: ' + (error as Error).message);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) return;

    try {
      const response = await fetch(`/api/suppliers/inventory/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la suppression');
      }

      // Recharger les produits
      await loadProducts();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression: ' + (error as Error).message);
    }
  };

  const resetForm = () => {
    setFormData({
      referenceInterne: '',
      nomProduit: '',
      description: '',
      caracteristique: '',
      categorie: '',
      prixVente: '',
      commission: '',
      pourcentageCommission: '',
      stockQuantity: '',
      imageUrl: ''
    });
    setShowAddForm(false);
    setEditingProduct(null);
  };

  const startEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      referenceInterne: product.referenceInterne,
      nomProduit: product.nomProduit,
      description: product.description,
      caracteristique: product.caracteristique || '',
      categorie: product.categorie || '',
      prixVente: product.prixVente.toString(),
      commission: product.commission.toString(),
      pourcentageCommission: product.pourcentageCommission.toString(),
      stockQuantity: product.stockQuantity.toString(),
      imageUrl: product.imageUrl || ''
    });
    setShowAddForm(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <Clock className="w-6 h-6 text-blue-600 animate-spin" />
          <span className="text-lg text-slate-600">Chargement de l'inventaire...</span>
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
            Gestion de l'Inventaire
          </h1>
          <p className="text-lg text-slate-600">
            Gérez vos produits : ajoutez, modifiez ou supprimez des articles
          </p>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center space-x-3">
              <Package className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-slate-600">Total Produits</p>
                <p className="text-2xl font-bold text-slate-900">{products.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-slate-600">Produits Actifs</p>
                <p className="text-2xl font-bold text-slate-900">
                  {products.filter(p => p.isActive).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center space-x-3">
              <DollarSign className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-sm text-slate-600">Valeur Stock</p>
                <p className="text-2xl font-bold text-slate-900">
                  {products.reduce((sum, p) => sum + (p.prixVente * p.stockQuantity), 0).toLocaleString()} XOF
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center space-x-3">
              <BarChart3 className="w-8 h-8 text-orange-600" />
              <div>
                <p className="text-sm text-slate-600">Dernière Sync</p>
                <p className="text-sm font-medium text-slate-900">
                  {syncReport ? new Date(syncReport.syncedAt).toLocaleDateString('fr-FR') : 'Jamais'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions principales */}
        <div className="flex flex-wrap gap-4 mb-8">
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Ajouter un Produit</span>
          </button>

          <a
            href="/suppliers/inventory/upload"
            className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
          >
            <Upload className="w-5 h-5" />
            <span>Importer Excel</span>
          </a>

          {syncReport && (
            <button
              onClick={() => loadSyncReport()}
              className="flex items-center space-x-2 px-6 py-3 bg-slate-600 text-white rounded-lg font-semibold hover:bg-slate-700 transition-colors"
            >
              <BarChart3 className="w-5 h-5" />
              <span>Voir Rapport Sync</span>
            </button>
          )}
        </div>

        {/* Formulaire d'ajout/édition */}
        {showAddForm && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900">
                {editingProduct ? 'Modifier le Produit' : 'Ajouter un Produit'}
              </h2>
              <button
                onClick={resetForm}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Référence Interne *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.referenceInterne}
                    onChange={(e) => setFormData({...formData, referenceInterne: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="REF-001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Nom du Produit *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nomProduit}
                    onChange={(e) => setFormData({...formData, nomProduit: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="T-shirt Blanc"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={3}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Description détaillée du produit"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Caractéristiques
                  </label>
                  <input
                    type="text"
                    value={formData.caracteristique}
                    onChange={(e) => setFormData({...formData, caracteristique: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Taille M, Blanc"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Catégorie
                  </label>
                  <input
                    type="text"
                    value={formData.categorie}
                    onChange={(e) => setFormData({...formData, categorie: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Vêtements"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Prix de Vente (XOF) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.prixVente}
                    onChange={(e) => setFormData({...formData, prixVente: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="15000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Commission (XOF) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.commission}
                    onChange={(e) => setFormData({...formData, commission: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="1500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Pourcentage Commission (%) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.pourcentageCommission}
                    onChange={(e) => setFormData({...formData, pourcentageCommission: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="10"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Quantité en Stock *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.stockQuantity}
                    onChange={(e) => setFormData({...formData, stockQuantity: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="50"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    URL de l'Image
                  </label>
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  {editingProduct ? 'Modifier' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Liste des produits */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-200">
            <h2 className="text-2xl font-bold text-slate-900">
              Mes Produits ({products.length})
            </h2>
          </div>

          {products.length === 0 ? (
            <div className="px-8 py-12 text-center">
              <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                Aucun produit
              </h3>
              <p className="text-slate-600 mb-6">
                Commencez par ajouter votre premier produit ou importer un fichier Excel
              </p>
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>Ajouter un Produit</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-8 py-4 text-left text-sm font-semibold text-slate-700">
                      Produit
                    </th>
                    <th className="px-8 py-4 text-left text-sm font-semibold text-slate-700">
                      Référence
                    </th>
                    <th className="px-8 py-4 text-left text-sm font-semibold text-slate-700">
                      Prix
                    </th>
                    <th className="px-8 py-4 text-left text-sm font-semibold text-slate-700">
                      Stock
                    </th>
                    <th className="px-8 py-4 text-left text-sm font-semibold text-slate-700">
                      Statut
                    </th>
                    <th className="px-8 py-4 text-left text-sm font-semibold text-slate-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-slate-50">
                      <td className="px-8 py-4">
                        <div className="flex items-center space-x-3">
                          {product.imageCdnUrl && (
                            <img
                              src={product.imageCdnUrl}
                              alt={product.nomProduit}
                              className="w-10 h-10 rounded-lg object-cover"
                            />
                          )}
                          <div>
                            <div className="font-medium text-slate-900">
                              {product.nomProduit}
                            </div>
                            <div className="text-sm text-slate-600">
                              {product.categorie}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-4 text-sm text-slate-600">
                        {product.referenceInterne}
                      </td>
                      <td className="px-8 py-4 text-sm text-slate-900">
                        {product.prixVente.toLocaleString()} XOF
                      </td>
                      <td className="px-8 py-4 text-sm text-slate-900">
                        {product.stockQuantity}
                      </td>
                      <td className="px-8 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          product.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {product.isActive ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td className="px-8 py-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => startEdit(product)}
                            className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                            title="Modifier"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Rapport de synchronisation (si disponible) */}
        {syncReport && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mt-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">
              Dernière Synchronisation
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-700 font-semibold">Créés</p>
                <p className="text-2xl font-bold text-green-900">{syncReport.productsCreated}</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700 font-semibold">Mis à jour</p>
                <p className="text-2xl font-bold text-blue-900">{syncReport.productsUpdated}</p>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-700 font-semibold">Désactivés</p>
                <p className="text-2xl font-bold text-yellow-900">{syncReport.productsDeactivated}</p>
              </div>
            </div>

            <div className="text-sm text-slate-600">
              <p>Date: {new Date(syncReport.syncedAt).toLocaleString('fr-FR')}</p>
              <p>Source: {syncReport.source === 'EXCEL_UPLOAD' ? 'Upload Excel' : syncReport.source}</p>
            </div>

            {syncReport.errors.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">
                  Erreurs ({syncReport.errors.length})
                </h3>
                <div className="space-y-2">
                  {syncReport.errors.slice(0, 5).map((error, index) => (
                    <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-red-900">
                            Ligne {error.row} - {error.reference}
                          </p>
                          <p className="text-sm text-red-700">{error.reason}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}