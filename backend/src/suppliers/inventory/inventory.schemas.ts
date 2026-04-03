import { z } from 'zod';

// DTO pour créer un produit manuellement
export const CreateProductDtoSchema = z.object({
  referenceInterne: z.string().min(1, 'La référence interne est requise'),
  nomProduit: z.string().min(2, 'Le nom du produit doit contenir au moins 2 caractères'),
  description: z.string().min(1, 'La description est requise'),
  caracteristique: z.string().optional(),
  categorie: z.string().optional(),
  imageUrl: z.string().url('L\'URL de l\'image doit être valide').optional(),
  prixVente: z.number().positive('Le prix de vente doit être positif'),
  commission: z.number().min(0, 'La commission doit être positive ou nulle'),
  pourcentageCommission: z.number().min(0).max(100, 'Le pourcentage de commission doit être entre 0 et 100'),
  stockQuantity: z.number().int().min(0, 'La quantité en stock doit être un entier positif'),
});

export type CreateProductDto = z.infer<typeof CreateProductDtoSchema>;

// DTO pour mettre à jour un produit manuellement
export const UpdateProductDtoSchema = z.object({
  referenceInterne: z.string().min(1, 'La référence interne est requise').optional(),
  nomProduit: z.string().min(2, 'Le nom du produit doit contenir au moins 2 caractères').optional(),
  description: z.string().min(1, 'La description est requise').optional(),
  caracteristique: z.string().optional(),
  categorie: z.string().optional(),
  imageUrl: z.string().url('L\'URL de l\'image doit être valide').optional(),
  prixVente: z.number().positive('Le prix de vente doit être positif').optional(),
  commission: z.number().min(0, 'La commission doit être positive ou nulle').optional(),
  pourcentageCommission: z.number().min(0).max(100, 'Le pourcentage de commission doit être entre 0 et 100').optional(),
  stockQuantity: z.number().int().min(0, 'La quantité en stock doit être un entier positif').optional(),
});

export type UpdateProductDto = z.infer<typeof UpdateProductDtoSchema>;

// DTO pour les statistiques d'inventaire
export const InventoryStatsDtoSchema = z.object({
  totalProducts: z.number(),
  activeProducts: z.number(),
  inactiveProducts: z.number(),
  totalStockValue: z.number(),
  lastSyncDate: z.string().nullable(),
});

export type InventoryStatsDto = z.infer<typeof InventoryStatsDtoSchema>;