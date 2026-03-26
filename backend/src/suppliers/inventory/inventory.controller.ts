import {
  Controller,
  Post,
  Get,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
  Param,
  BadRequestException,
  HttpException,
  HttpStatus,
  Headers,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RbacGuard } from '@/common/guards/rbac.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { InventoryService } from './inventory.service';
import { AgentKeyService } from './agent-key.service';
import { SyncReportResponse } from './schemas';
import * as path from 'path';
import * as fs from 'fs';
import { diskStorage } from 'multer';
import { v4 as uuid } from 'uuid';

@Controller('suppliers/inventory')
@UseGuards(JwtAuthGuard, RbacGuard)
@Roles('SUPPLIER')
export class InventoryController {
  constructor(
    private inventoryService: InventoryService,
    private agentKeyService: AgentKeyService,
  ) {}

  /**
   * POST /suppliers/inventory/upload
   * Upload un fichier Excel et synchronise l'inventaire
   */
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req: any, file: any, cb: any) => {
          const uploadDir = path.join(process.cwd(), 'uploads', 'excel');
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }
          cb(null, uploadDir);
        },
        filename: (req: any, file: any, cb: any) => {
          const uniqueSuffix = `${Date.now()}-${uuid()}`;
          cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
        },
      }),
      fileFilter: (req: any, file: any, cb: any) => {
        // Accepter uniquement xlsx et xls
        if (
          file.mimetype ===
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
          file.mimetype === 'application/vnd.ms-excel' ||
          file.originalname.endsWith('.xlsx') ||
          file.originalname.endsWith('.xls')
        ) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              'Seuls les fichiers Excel (.xlsx, .xls) sont acceptés',
            ),
            false,
          );
        }
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max
      },
    }),
  )
  async uploadInventory(
    @CurrentUser() user: any,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<SyncReportResponse> {
    if (!file) {
      throw new BadRequestException('Aucun fichier ne a été uploadé');
    }

    try {
      // Parser le fichier Excel
      const parsedData = this.inventoryService.parseExcelFile(file.path);

      // Effectuer la synchronisation
      const syncReport = await this.inventoryService.syncInventory(
        user.id,
        parsedData,
      );

      // Supprimer le fichier
      fs.unlinkSync(file.path);

      return syncReport;
    } catch (error) {
      // Nettoyer le fichier en cas d'erreur
      if (file && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }

      throw new HttpException(
        {
          message: 'Erreur lors du traitement du fichier Excel',
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * GET /suppliers/inventory/sync-report
   * Récupère le dernier rapport de synchronisation
   */
  @Get('sync-report')
  async getSyncReport(@CurrentUser() user: any): Promise<SyncReportResponse | null> {
    return this.inventoryService.getSyncReport(user.id);
  }

  /**
   * POST /suppliers/inventory/agent-sync
   * Synchronise les diffs envoyés par l'agent local
   * Utilisé pour les fournisseurs avancés (Mode B)
   *
   * Body:
   * {
   *   "diffs": [
   *     {
   *       "reference_interne": "REF-001",
   *       "field": "quantite_stock",
   *       "new_value": 42
   *     }
   *   ]
   * }
   */
  @Post('agent-sync')
  async agentSync(
    @CurrentUser() user: any,
    @Body() body: { diffs: any[] },
    @Headers('X-Agent-Key') agentKey?: string,
  ): Promise<SyncReportResponse> {
    // Valider la clé API agent
    if (!agentKey) {
      throw new BadRequestException('X-Agent-Key header is required');
    }

    const isValidKey = await this.agentKeyService.validateAgentKey(
      user.id,
      agentKey,
    );
    if (!isValidKey) {
      throw new BadRequestException('Invalid or revoked agent key');
    }

    if (!body.diffs || !Array.isArray(body.diffs)) {
      throw new BadRequestException(
        'Body must contain a "diffs" array of changes',
      );
    }

    try {
      const syncReport = await this.inventoryService.syncAgentDiffs(
        user.id,
        body.diffs,
      );
      return syncReport;
    } catch (error) {
      throw new HttpException(
        {
          message: 'Erreur lors de la synchronisation des diffs',
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * POST /suppliers/inventory/agent-keys
   * Génère une nouvelle clé API agent
   */
  @Post('agent-keys')
  async generateAgentKey(
    @CurrentUser() user: any,
    @Body() body: { name: string },
  ): Promise<{
    key: string;
    keyId: string;
    keyPreview: string;
    createdAt: string;
    message: string;
  }> {
    if (!body.name) {
      throw new BadRequestException('Agent key name is required');
    }

    const result = await this.agentKeyService.generateAgentKey(
      user.id,
      body.name,
    );

    return {
      ...result,
      message:
        'La clé API a été générée. Assurez-vous de la stocker en lieu sûr, elle ne sera plus affichée après.',
    };
  }

  /**
   * GET /suppliers/inventory/agent-keys
   * Liste les clés API agent du fournisseur
   */
  @Get('agent-keys')
  async listAgentKeys(@CurrentUser() user: any): Promise<any[]> {
    return this.agentKeyService.listAgentKeys(user.id);
  }

  /**
   * DELETE /suppliers/inventory/agent-keys/:keyId
   * Révoque une clé API agent
   */
  @Delete('agent-keys/:keyId')
  async revokeAgentKey(@CurrentUser() user: any, @Param('keyId') keyId: string): Promise<{ message: string }> {
    await this.agentKeyService.revokeAgentKey(user.id, keyId);
    return { message: 'Agent key revoked successfully' };
  }
}
