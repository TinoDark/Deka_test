import { z } from 'zod';

/**
 * Schema de validation pour chaque ligne du fichier Excel
 * Basé sur les colonnes obligatoires listées dans CLAUDE.md section 12
 */
export const ExcelRowSchema = z.object({
  nom_produit: z
    .string()
    .min(2, 'Le nom du produit doit avoir au moins 2 caractères')
    .trim(),

  prix_vente: z
    .number({ coerce: true })
    .positive('Le prix de vente doit être positif'),

  commission: z
    .number({ coerce: true })
    .positive('La commission doit être positive'),

  pourcentage_commission: z
    .number({ coerce: true })
    .min(0, 'Le pourcentage ne peut pas être négatif')
    .max(100, 'Le pourcentage ne peut pas dépasser 100'),

  quantite_stock: z
    .number({ coerce: true })
    .int('La quantité doit être un nombre entier')
    .min(0, 'La quantité ne peut pas être négative'),

  description: z
    .string()
    .min(1, 'La description est obligatoire')
    .trim(),

  caracteristique: z.string().optional().nullable(),

  categorie: z.string().optional().nullable(),

  reference_interne: z
    .string()
    .min(1, 'La référence interne est obligatoire')
    .trim(),

  url_image: z
    .string()
    .url('L\'URL de l\'image doit être valide')
    .trim(),
});

export type ExcelRow = z.infer<typeof ExcelRowSchema>;

/**
 * Schema pour valider l'ensemble du fichier Excel
 */
export const ExcelFileSchema = z.object({
  rows: z.array(ExcelRowSchema),
});

export type ExcelFile = z.infer<typeof ExcelFileSchema>;

/**
 * Type pour les erreurs de validation d'une ligne
 */
export interface ExcelRowError {
  row: number;
  reference: string;
  reason: string;
}

/**
 * Type pour la réponse du sync report
 */
export interface SyncReportResponse {
  id: string;
  supplierId: string;
  syncedAt: string;
  source: 'EXCEL_UPLOAD' | 'AGENT' | 'DASHBOARD_MANUAL';
  productsCreated: number;
  productsUpdated: number;
  productsDeactivated: number;
  errors: ExcelRowError[];
}
