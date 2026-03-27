import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  HttpException,
  HttpStatus,
  Response,
} from '@nestjs/common';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RbacGuard } from '@/common/guards/rbac.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { SyncAdminService } from './sync-admin.service';

@Controller('admin/syncs')
@UseGuards(JwtAuthGuard, RbacGuard)
@Roles('ADMIN')
export class SyncAdminController {
  constructor(private syncAdminService: SyncAdminService) {}

  /**
   * GET /admin/syncs
   * Liste tous les syncs (admin uniquement)
   * Filtrage optionnel par :
   * - supplierId
   * - source (EXCEL_UPLOAD, AGENT, DASHBOARD_MANUAL)
   * - startDate (ISO 8601)
   * - endDate (ISO 8601)
   * - limit (défaut 50, max 500)
   * - offset (défaut 0)
   */
  @Get()
  async listAllSyncs(
    @Query('supplierId') supplierId?: string,
    @Query('source') source?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    try {
      const parsedLimit = Math.min(parseInt(limit || '50'), 500);
      const parsedOffset = parseInt(offset || '0');

      const filters: any = {};
      if (supplierId) filters.supplierId = supplierId;
      if (source) filters.source = source;

      if (startDate || endDate) {
        filters.syncedAt = {};
        if (startDate) filters.syncedAt.gte = new Date(startDate);
        if (endDate) filters.syncedAt.lte = new Date(endDate);
      }

      const result = await this.syncAdminService.listSyncs(
        filters,
        parsedLimit,
        parsedOffset,
      );

      return result;
    } catch (error) {
      throw new HttpException(
        {
          message: 'Erreur lors de la récupération des syncs',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * GET /admin/syncs/suppliers/:supplierId
   * Liste tous les syncs d'un fournisseur spécifique
   */
  @Get('suppliers/:supplierId')
  async listSupplierSyncs(
    @Param('supplierId') supplierId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    if (!supplierId) {
      throw new HttpException('Supplier ID is required', HttpStatus.BAD_REQUEST);
    }

    const parsedLimit = Math.min(parseInt(limit || '50'), 500);
    const parsedOffset = parseInt(offset || '0');

    const result = await this.syncAdminService.listSyncs(
      { supplierId },
      parsedLimit,
      parsedOffset,
    );

    return result;
  }

  /**
   * GET /admin/syncs/:syncId
   * Détail d'un sync avec tous les erreurs
   */
  @Get(':syncId')
  async getSyncDetail(@Param('syncId') syncId: string) {
    if (!syncId) {
      throw new HttpException('Sync ID is required', HttpStatus.BAD_REQUEST);
    }

    try {
      const sync = await this.syncAdminService.getSyncDetail(syncId);
      return sync;
    } catch (error) {
      throw new HttpException(
        {
          message: 'Sync not found',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        HttpStatus.NOT_FOUND,
      );
    }
  }

  /**
   * GET /admin/syncs/stats
   * Statistiques globales sur les syncs
   */
  @Get('stats')
  async getSyncStats(
    @Query('days') days?: string,
  ) {
    const parsedDays = parseInt(days || '30');

    try {
      const stats = await this.syncAdminService.getSyncStats(parsedDays);
      return stats;
    } catch (error) {
      throw new HttpException(
        {
          message: 'Erreur lors de la récupération des stats',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * GET /admin/syncs/:syncId/export-csv
   * Exporte un rapport de sync au format CSV
   */
  @Get(':syncId/export-csv')
  async exportSyncCSV(
    @Param('syncId') syncId: string,
    @Response() res: any,
  ) {
    if (!syncId) {
      throw new HttpException('Sync ID is required', HttpStatus.BAD_REQUEST);
    }

    try {
      const csvContent = await this.syncAdminService.exportSyncAsCSV(syncId);

      // Préparer la réponse CSV
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="sync-${syncId}.csv"`,
      );
      res.send(csvContent);
    } catch (error) {
      throw new HttpException(
        {
          message: 'Export CSV failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        HttpStatus.NOT_FOUND,
      );
    }
  }
}
