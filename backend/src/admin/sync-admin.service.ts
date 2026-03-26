import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';

@Injectable()
export class SyncAdminService {
  constructor(private prisma: PrismaService) {}

  /**
   * Liste tous les syncs avec filtrage et pagination
   */
  async listSyncs(
    filters: any,
    limit: number,
    offset: number,
  ): Promise<{
    total: number;
    limit: number;
    offset: number;
    syncs: Array<{
      id: string;
      supplierId: string;
      supplierEmail: string;
      syncedAt: string;
      source: string;
      productsCreated: number;
      productsUpdated: number;
      productsDeactivated: number;
      errorsCount: number;
    }>;
  }> {
    const total = await this.prisma.syncReport.count({
      where: filters,
    });

    const syncs = await this.prisma.syncReport.findMany({
      where: filters,
      include: {
        supplier: {
          select: { id: true, email: true },
        },
      },
      orderBy: { syncedAt: 'desc' },
      take: limit,
      skip: offset,
    });

    return {
      total,
      limit,
      offset,
      syncs: syncs.map((s: any) => ({
        id: s.id,
        supplierId: s.supplierId,
        supplierEmail: s.supplier.email,
        syncedAt: s.syncedAt.toISOString(),
        source: s.source,
        productsCreated: s.productsCreated,
        productsUpdated: s.productsUpdated,
        productsDeactivated: s.productsDeactivated,
        errorsCount: JSON.parse(s.errors || '[]').length,
      })),
    };
  }

  /**
   * Récupère le détail complet d'un sync
   */
  async getSyncDetail(syncId: string): Promise<{
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
  }> {
    const sync = await this.prisma.syncReport.findUniqueOrThrow({
      where: { id: syncId },
      include: {
        supplier: {
          select: { email: true },
        },
      },
    });

    return {
      id: sync.id,
      supplierId: sync.supplierId,
      supplierEmail: sync.supplier.email,
      syncedAt: sync.syncedAt.toISOString(),
      source: sync.source,
      productsCreated: sync.productsCreated,
      productsUpdated: sync.productsUpdated,
      productsDeactivated: sync.productsDeactivated,
      errors: JSON.parse(sync.errors || '[]'),
    };
  }

  /**
   * Calcule les statistiques globales sur les syncs
   */
  async getSyncStats(days: number): Promise<{
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
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const syncs = await this.prisma.syncReport.findMany({
      where: {
        syncedAt: {
          gte: startDate,
        },
      },
    });

    const totalSyncsBySource = {
      EXCEL_UPLOAD: syncs.filter((s) => s.source === 'EXCEL_UPLOAD').length,
      AGENT: syncs.filter((s) => s.source === 'AGENT').length,
      DASHBOARD_MANUAL: syncs.filter((s) => s.source === 'DASHBOARD_MANUAL')
        .length,
    };

    const totalProducts = syncs.reduce(
      (acc, s) => ({
        created: acc.created + s.productsCreated,
        updated: acc.updated + s.productsUpdated,
        deactivated: acc.deactivated + s.productsDeactivated,
      }),
      { created: 0, updated: 0, deactivated: 0 },
    );

    const totalErrors = syncs.reduce((acc, s) => {
      const errors = JSON.parse(s.errors || '[]');
      return acc + errors.length;
    }, 0);

    const uniqueSuppliers = new Set(syncs.map((s) => s.supplierId));

    return {
      period: `Last ${days} days`,
      totalSyncs: syncs.length,
      totalProducts,
      syncsBySource: totalSyncsBySource,
      suppliersWithSyncs: uniqueSuppliers.size,
      averageErrorsPerSync:
        syncs.length > 0 ? Math.round(totalErrors / syncs.length) : 0,
    };
  }

  /**
   * Exporte un sync au format CSV (rapport détaillé avec erreurs)
   */
  async exportSyncAsCSV(syncId: string): Promise<string> {
    const sync = await this.getSyncDetail(syncId);

    // En-têtes CSV
    const headers = [
      'Rapport Synchronisation',
      '',
      `Fournisseur: ${sync.supplierEmail}`,
      `Date: ${sync.syncedAt}`,
      `Source: ${sync.source}`,
      '',
      'RÉSUMÉ',
      'Produits créés',
      'Produits mis à jour',
      'Produits désactivés',
      'Erreurs détectées',
      sync.productsCreated,
      sync.productsUpdated,
      sync.productsDeactivated,
      sync.errors.length,
    ];

    let csvContent = headers.map((h) => this.escapeCSV(h)).join('\n') + '\n\n';

    // Section erreurs si présentes
    if (sync.errors.length > 0) {
      csvContent += 'DÉTAILS DES ERREURS\n';
      csvContent += 'Ligne,Référence Produit,Raison\n';

      sync.errors.forEach((err) => {
        csvContent += `${err.row},${this.escapeCSV(err.reference)},${this.escapeCSV(err.reason)}\n`;
      });
    } else {
      csvContent += 'STATUS: Synchronisation réussie ✓\n';
      csvContent += `Tous les ${sync.productsCreated + sync.productsUpdated + sync.productsDeactivated} produits ont été traités sans erreur.\n`;
    }

    return csvContent;
  }

  /**
   * Échappe les valeurs pour CSV (guillemets si virgule/saut ligne)
   */
  private escapeCSV(value: string): string {
    if (value.includes(',') || value.includes('\n') || value.includes('"')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }
}

