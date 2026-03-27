import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { ExcelRow, ExcelRowSchema, ExcelRowError, SyncReportResponse } from './schemas';
import { ImageProcessorService } from './image-processor.service';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import { createHash } from 'crypto';

interface ParsedExcelData {
  rows: ExcelRow[];
  errors: ExcelRowError[];
}

@Injectable()
export class InventoryService {
  constructor(
    private prisma: PrismaService,
    private imageProcessor: ImageProcessorService,
  ) {}

  /**
   * Parse un fichier Excel et extrait les données
   * Normalise les en-têtes (lowercase, trim, sans accents)
   */
  parseExcelFile(filePath: string): ParsedExcelData {
    const workbook = XLSX.readFile(filePath);
    
    // Lire la première feuille ou celle nommée "Inventaire"
    const worksheetName =
      workbook.SheetNames.find((name: string) => name.toLowerCase() === 'inventaire') ||
      workbook.SheetNames[0];
    
    const worksheet = workbook.Sheets[worksheetName];
    const rawData = XLSX.utils.sheet_to_json(worksheet);

    const rows: ExcelRow[] = [];
    const errors: ExcelRowError[] = [];

    rawData.forEach((rawRow: any, index: number) => {
      // Normaliser les clés (lowercase, trim, sans accents)
      const normalizedRow = this.normalizeRowKeys(rawRow);

      // Valider chaque ligne avec le schéma zod
      const validation = ExcelRowSchema.safeParse(normalizedRow);

      if (!validation.success) {
        errors.push({
          row: index + 2, // Excel line number (header = 1)
          reference: normalizedRow.reference_interne || 'UNKNOWN',
          reason: validation.error.errors.map((e: any) => e.message).join('; '),
        });
      } else {
        rows.push(validation.data);
      }
    });

    return { rows, errors };
  }

  /**
   * Normalise les clés d'une ligne Excel
   * - Rend minuscule
   * - Trim les espaces
   * - Supprime les accents
   */
  private normalizeRowKeys(row: any): any {
    const normalized: any = {};
    const expectedKeys = [
      'nom_produit',
      'prix_vente',
      'commission',
      'pourcentage_commission',
      'quantite_stock',
      'description',
      'caracteristique',
      'categorie',
      'reference_interne',
      'url_image',
    ];

    for (const key of Object.keys(row)) {
      let normalizedKey = key
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '_')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, ''); // Remove accents

      // Chercher une clé correspondante
      const matchingKey = expectedKeys.find(
        (k) =>
          k.toLowerCase().replace(/[éèê]/g, 'e').replace(/[àâ]/g, 'a') ===
          normalizedKey
            .replace(/[éèê]/g, 'e')
            .replace(/[àâ]/g, 'a'),
      );

      if (matchingKey) {
        normalized[matchingKey] = row[key];
      }
    }

    return normalized;
  }

  /**
   * Effectue la synchronisation des produits
   * Crée, met à jour, ou désactive les produits
   */
  async syncInventory(
    supplierId: string,
    parsedData: ParsedExcelData,
  ): Promise<SyncReportResponse> {
    let productsCreated = 0;
    let productsUpdated = 0;
    let productsDeactivated = 0;
    const allErrors = [...parsedData.errors];

    // ÉTAPE 1 — Pour chaque ligne valide
    for (const row of parsedData.rows) {
      try {
        // Chercher le produit existant
        const existingProduct = await this.prisma.product.findUnique({
          where: {
            supplierId_referenceInterne: {
              supplierId,
              referenceInterne: row.reference_interne,
            },
          },
        });

        if (!existingProduct) {
          // CAS A — Produit inexistant → CRÉATION
          const newProduct = await this.prisma.product.create({
            data: {
              supplierId,
              referenceInterne: row.reference_interne,
              nomProduit: row.nom_produit,
              description: row.description,
              caracteristique: row.caracteristique || null,
              categorie: row.categorie || null,
              imageUrl: row.url_image,
              imageCdnUrl: null, // Sera mis à jour après le traitement
              prixVente: row.prix_vente,
              commission: row.commission,
              pourcentageCommission: row.pourcentage_commission,
              stockQuantity: row.quantite_stock,
              isActive: row.quantite_stock > 0,
              syncSource: 'EXCEL_UPLOAD',
              lastSyncedAt: new Date(),
            },
          });

          // Traiter l'image de manière asynchrone
          if (row.url_image) {
            const cdnUrl = await this.imageProcessor.processAndUploadImage(
              row.url_image,
              supplierId,
              row.reference_interne,
            );

            if (cdnUrl) {
              await this.prisma.product.update({
                where: { id: newProduct.id },
                data: { imageCdnUrl: cdnUrl },
              });
            }
          }

          productsCreated++;
        } else {
          // CAS B — Produit existant → MISE À JOUR
          await this.prisma.product.update({
            where: { id: existingProduct.id },
            data: {
              nomProduit: row.nom_produit,
              description: row.description,
              caracteristique: row.caracteristique || null,
              categorie: row.categorie || null,
              imageUrl: row.url_image,
              // imageCdnUrl sera traité ci-dessous si l'URL a changé
              prixVente: row.prix_vente,
              commission: row.commission,
              pourcentageCommission: row.pourcentage_commission,
              stockQuantity: row.quantite_stock,
              isActive: row.quantite_stock > 0, // Réactivation automatique si stock > 0
              syncSource: 'EXCEL_UPLOAD',
              lastSyncedAt: new Date(),
            },
          });

          // Si l'URL d'image a changé, traiter la nouvelle image
          if (row.url_image !== existingProduct.imageUrl) {
            const cdnUrl = await this.imageProcessor.processAndUploadImage(
              row.url_image,
              supplierId,
              row.reference_interne,
            );

            if (cdnUrl) {
              await this.prisma.product.update({
                where: { id: existingProduct.id },
                data: { imageCdnUrl: cdnUrl },
              });
            }
          }

          productsUpdated++;
        }
      } catch (error) {
        allErrors.push({
          row: parsedData.rows.indexOf(row) + 2,
          reference: row.reference_interne,
          reason: `Erreur de sync: ${(error as Error).message}`,
        });
      }
    }

    // ÉTAPE 2 — Produits absents du fichier → Désactiver
    const referencesInFile = parsedData.rows.map((r) => r.reference_interne);
    const productsToDeactivate = await this.prisma.product.findMany({
      where: {
        supplierId,
        referenceInterne: { notIn: referencesInFile },
        isActive: true,
      },
    });

    for (const product of productsToDeactivate) {
      await this.prisma.product.update({
        where: { id: product.id },
        data: { isActive: false },
      });
      productsDeactivated++;
    }

    // ÉTAPE 3 — Créer le rapport de sync
    const syncReport = await this.prisma.syncReport.create({
      data: {
        supplierId,
        source: 'EXCEL_UPLOAD',
        productsCreated,
        productsUpdated,
        productsDeactivated,
        errors: JSON.stringify(allErrors),
      },
    });

    // Ajouter variable filePath manquante - elle vient de l'appel du contrôleur
    // FIXED: filePath doit être passé en paramètre

    return {
      id: syncReport.id,
      supplierId: syncReport.supplierId,
      syncedAt: syncReport.syncedAt.toISOString(),
      source: syncReport.source,
      productsCreated: syncReport.productsCreated,
      productsUpdated: syncReport.productsUpdated,
      productsDeactivated: syncReport.productsDeactivated,
      errors: JSON.parse(syncReport.errors),
    };
  }

  /**
   * Obtient le dernier rapport de sync pour un fournisseur
   */
  async getSyncReport(supplierId: string): Promise<SyncReportResponse | null> {
    const report = await this.prisma.syncReport.findFirst({
      where: { supplierId },
      orderBy: { syncedAt: 'desc' },
    });

    if (!report) return null;

    return {
      id: report.id,
      supplierId: report.supplierId,
      syncedAt: report.syncedAt.toISOString(),
      source: report.source,
      productsCreated: report.productsCreated,
      productsUpdated: report.productsUpdated,
      productsDeactivated: report.productsDeactivated,
      errors: JSON.parse(report.errors),
    };
  }

  /**
   * Synchronise les diffs envoyés par l'agent local (Mode B)
   * Applique uniquement les changements transmis, pas un sync complet
   */
  async syncAgentDiffs(
    supplierId: string,
    diffs: Array<{
      reference_interne: string;
      field: string;
      new_value: any;
    }>,
  ): Promise<SyncReportResponse> {
    let productsUpdated = 0;
    const allErrors: ExcelRowError[] = [];

    // Champs autorisés pour la mise à jour via agent
    const allowedFields = [
      'quantite_stock',
      'prix_vente',
      'commission',
      'pourcentage_commission',
      'nom_produit',
      'description',
      'caracteristique',
      'categorie',
      'url_image',
      'is_active',
    ];

    for (const diff of diffs) {
      try {
        // Valider le champ
        if (!allowedFields.includes(diff.field)) {
          allErrors.push({
            row: 0,
            reference: diff.reference_interne,
            reason: `Field "${diff.field}" is not allowed for agent sync`,
          });
          continue;
        }

        // Chercher le produit
        const existingProduct = await this.prisma.product.findUnique({
          where: {
            supplierId_referenceInterne: {
              supplierId,
              referenceInterne: diff.reference_interne,
            },
          },
        });

        if (!existingProduct) {
          allErrors.push({
            row: 0,
            reference: diff.reference_interne,
            reason: `Product not found`,
          });
          continue;
        }

        // Préparer l'update
        const updateData: any = {};

        if (diff.field === 'quantite_stock') {
          updateData.stockQuantity = diff.new_value;
          // Réactiver/désactiver automatiquement
          updateData.isActive = diff.new_value > 0;
        } else if (diff.field === 'prix_vente') {
          updateData.prixVente = diff.new_value;
        } else if (diff.field === 'commission') {
          updateData.commission = diff.new_value;
        } else if (diff.field === 'pourcentage_commission') {
          updateData.pourcentageCommission = diff.new_value;
        } else if (diff.field === 'nom_produit') {
          updateData.nomProduit = diff.new_value;
        } else if (diff.field === 'description') {
          updateData.description = diff.new_value;
        } else if (diff.field === 'caracteristique') {
          updateData.caracteristique = diff.new_value;
        } else if (diff.field === 'categorie') {
          updateData.categorie = diff.new_value;
        } else if (diff.field === 'url_image') {
          updateData.imageUrl = diff.new_value;
          // Traiter l'image si l'URL a changé
          const cdnUrl = await this.imageProcessor.processAndUploadImage(
            diff.new_value,
            supplierId,
            diff.reference_interne,
          );
          if (cdnUrl) {
            updateData.imageCdnUrl = cdnUrl;
          }
        } else if (diff.field === 'is_active') {
          updateData.isActive = diff.new_value;
        }

        updateData.syncSource = 'AGENT';
        updateData.lastSyncedAt = new Date();

        // Appliquer la mise à jour
        await this.prisma.product.update({
          where: { id: existingProduct.id },
          data: updateData,
        });

        productsUpdated++;
      } catch (error) {
        allErrors.push({
          row: 0,
          reference: diff.reference_interne,
          reason: `Error: ${(error as Error).message}`,
        });
      }
    }

    // Créer le rapport de sync
    const syncReport = await this.prisma.syncReport.create({
      data: {
        supplierId,
        source: 'AGENT',
        productsCreated: 0,
        productsUpdated,
        productsDeactivated: 0,
        errors: JSON.stringify(allErrors),
      },
    });

    return {
      id: syncReport.id,
      supplierId: syncReport.supplierId,
      syncedAt: syncReport.syncedAt.toISOString(),
      source: syncReport.source,
      productsCreated: syncReport.productsCreated,
      productsUpdated: syncReport.productsUpdated,
      productsDeactivated: syncReport.productsDeactivated,
      errors: JSON.parse(syncReport.errors),
    };
  }

  /**
   * Vérifie si une URL est accessible
   */
  async isUrlAccessible(url: string, timeoutMs: number = 5000): Promise<boolean> {
    try {
      // Use node-fetch or built-in fetch (Node 18+)
      const controller = new (AbortController as any)();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await (fetch as any)(url, {
        method: 'HEAD',
        signal: controller.signal,
      });

      (clearTimeout as any)(timeoutId);
      return (response as any).ok;
    } catch (error) {
      return false;
    }
  }
}
