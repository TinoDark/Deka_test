import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';

/**
 * Format d'une clé API agent : sk_<32 chars random>
 * Format de stockage : hash bcrypt de la clé
 */
@Injectable()
export class AgentKeyService {
  constructor(private prisma: PrismaService) {}

  /**
   * Génère une nouvelle clé API agent pour un fournisseur
   */
  async generateAgentKey(
    supplierId: string,
    name: string,
  ): Promise<{
    key: string; // La clé à garder secrète (ne sera jamais retournée après)
    keyId: string;
    keyPreview: string;
    createdAt: string;
  }> {
    // Valider le nom
    if (!name || name.trim().length === 0 || name.length > 100) {
      throw new BadRequestException('Agent key name must be 1-100 characters');
    }

    // Générer une clé aléatoire
    const randomPart = uuid().replace(/-/g, '').substring(0, 32);
    const key = `sk_${randomPart}`;
    const keyHash = await bcrypt.hash(key, 10);
    const keyPreview = `sk_${randomPart.substring(0, 8)}`;

    // Créer l'enregistrement
    const agentKey = await this.prisma.agentKey.create({
      data: {
        supplierId,
        keyHash,
        keyPreview: `${keyPreview}...`,
        name: name.trim(),
      },
    });

    return {
      key, // À transmettre une seule fois au fournisseur
      keyId: agentKey.id,
      keyPreview: agentKey.keyPreview,
      createdAt: agentKey.createdAt.toISOString(),
    };
  }

  /**
   * Valide une clé API agent
   */
  async validateAgentKey(supplierId: string, key: string): Promise<boolean> {
    // Chercher la clé (elle existe une seule fois)
    const agentKey = await this.prisma.agentKey.findFirst({
      where: {
        supplierId,
        isRevoked: false,
      },
    });

    if (!agentKey) {
      return false;
    }

    // Comparer la clé avec le hash
    const isValid = await bcrypt.compare(key, agentKey.keyHash);

    if (isValid) {
      // Mettre à jour lastUsedAt
      await this.prisma.agentKey.update({
        where: { id: agentKey.id },
        data: { lastUsedAt: new Date() },
      });
    }

    return isValid;
  }

  /**
   * Liste les clés API agent d'un fournisseur
   */
  async listAgentKeys(
    supplierId: string,
  ): Promise<
    Array<{
      id: string;
      name: string;
      keyPreview: string;
      isRevoked: boolean;
      createdAt: string;
      lastUsedAt: string | null;
    }>
  > {
    const keys = await this.prisma.agentKey.findMany({
      where: { supplierId },
      orderBy: { createdAt: 'desc' },
    });

    return keys.map((k: any) => ({
      id: k.id,
      name: k.name,
      keyPreview: k.keyPreview,
      isRevoked: k.isRevoked,
      createdAt: k.createdAt.toISOString(),
      lastUsedAt: k.lastUsedAt?.toISOString() || null,
    }));
  }

  /**
   * Révoque une clé API agent
   */
  async revokeAgentKey(supplierId: string, keyId: string): Promise<void> {
    const agentKey = await this.prisma.agentKey.findUniqueOrThrow({
      where: { id: keyId },
    });

    if (agentKey.supplierId !== supplierId) {
      throw new BadRequestException('Agent key not found');
    }

    if (agentKey.isRevoked) {
      throw new BadRequestException('Agent key is already revoked');
    }

    await this.prisma.agentKey.update({
      where: { id: keyId },
      data: {
        isRevoked: true,
        revokedAt: new Date(),
      },
    });
  }

  /**
   * Supprime une clé API agent
   */
  async deleteAgentKey(supplierId: string, keyId: string): Promise<void> {
    const agentKey = await this.prisma.agentKey.findUniqueOrThrow({
      where: { id: keyId },
    });

    if (agentKey.supplierId !== supplierId) {
      throw new BadRequestException('Agent key not found');
    }

    await this.prisma.agentKey.delete({
      where: { id: keyId },
    });
  }
}
