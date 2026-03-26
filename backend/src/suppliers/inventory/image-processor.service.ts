import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuid } from 'uuid';
import { StorageService } from './storage.service';

@Injectable()
export class ImageProcessorService {
  constructor(
    private configService: ConfigService,
    private storageService: StorageService,
  ) {}

  /**
   * Traite une image : télécharge, redimensionne, convertit en WebP
   * et la met en cache sur le CDN MinIO/S3
   *
   * @param imageUrl URL de l'image à traiter
   * @param supplierId ID du fournisseur
   * @param productReference Référence interne du produit
   * @returns URL CDN finale ou null si erreur
   */
  async processAndUploadImage(
    imageUrl: string,
    supplierId: string,
    productReference: string,
  ): Promise<string | null> {
    const tempDir = path.join(process.cwd(), 'temp', 'images');
    const tempFilePath = path.join(tempDir, `${uuid()}.tmp`);

    try {
      // Créer le répertoire temporaire s'il n'existe pas
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // ÉTAPE 1 — Vérifier l'accessibilité de l'image
      const isAccessible = await this.isUrlAccessible(imageUrl);
      if (!isAccessible) {
        console.warn(
          `Image URL not accessible: ${imageUrl} for product ${productReference}`,
        );
        return null; // Warning dans le rapport, pas d'erreur bloquante
      }

      // ÉTAPE 2 — Télécharger l'image
      const imageBuffer = await this.downloadImage(imageUrl);
      if (!imageBuffer) {
        console.warn(
          `Failed to download image: ${imageUrl} for product ${productReference}`,
        );
        return null;
      }

      // ÉTAPE 3 — Analyser l'image avec sharp
      let metadata;
      try {
        metadata = await sharp(imageBuffer).metadata();
      } catch (error) {
        console.warn(
          `Invalid image format: ${imageUrl} for product ${productReference}`,
        );
        return null;
      }

      // ÉTAPE 4 — Redimensionner et convertir en WebP
      const processedImageBuffer = await sharp(imageBuffer)
        .resize(1200, 1200, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: 80 })
        .toBuffer();

      // ÉTAPE 5 — Upload sur MinIO/S3
      const cdnUrl = await this.storageService.uploadImage(
        processedImageBuffer,
        supplierId,
        productReference,
      );

      if (!cdnUrl) {
        console.warn(
          `Failed to upload image to storage: ${productReference}`,
        );
        return null;
      }

      return cdnUrl;
    } catch (error) {
      console.error(
        `Error processing image ${imageUrl} for product ${productReference}:`,
        error,
      );
      return null;
    } finally {
      // Nettoyer le fichier temporaire
      try {
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
      } catch (error) {
        console.error(`Failed to delete temp file: ${tempFilePath}`, error);
      }
    }
  }

  /**
   * Vérifie si une URL est accessible
   */
  private async isUrlAccessible(
    url: string,
    timeoutMs: number = 5000,
  ): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
        // Accepter les redirects
        redirect: 'follow',
      });

      clearTimeout(timeoutId);

      // Accepter les codes 200-399
      return response.ok || (response.status >= 200 && response.status < 400);
    } catch (error) {
      if (error instanceof TypeError && error.name === 'AbortError') {
        console.warn(`Image URL timeout: ${url}`);
      }
      return false;
    }
  }

  /**
   * Télécharge une image depuis une URL
   */
  private async downloadImage(
    url: string,
    maxSize: number = 10 * 1024 * 1024, // 10MB
  ): Promise<Buffer | null> {
    try {
      const response = await fetch(url, {
        redirect: 'follow',
        // Ajouter un timeout raisonnable
        signal: AbortSignal.timeout(30000), // 30s
      });

      if (!response.ok) {
        console.warn(
          `Failed to download image: ${url} (status: ${response.status})`,
        );
        return null;
      }

      // Vérifier Content-Length avant de télécharger
      const contentLength = response.headers.get('content-length');
      if (contentLength && parseInt(contentLength) > maxSize) {
        console.warn(`Image too large: ${url} (${contentLength} bytes)`);
        return null;
      }

      // Télécharger en chunks pour contraindre la taille
      const chunks: Uint8Array[] = [];
      let totalSize = 0;

      if (!response.body) {
        return null;
      }

      const reader = response.body.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          totalSize += value.length;
          if (totalSize > maxSize) {
            console.warn(`Image download exceeded max size: ${url}`);
            return null;
          }

          chunks.push(value);
        }
      } finally {
        reader.releaseLock();
      }

      // Combiner les chunks
      const totalBuffer = new Uint8Array(totalSize);
      let offset = 0;
      for (const chunk of chunks) {
        totalBuffer.set(chunk, offset);
        offset += chunk.length;
      }

      return Buffer.from(totalBuffer);
    } catch (error) {
      console.error(`Error downloading image from ${url}:`, error);
      return null;
    }
  }

  /**
   * Purge les images en cache qui ne sont plus utilisées
   */
  async purgeUnusedImages(
    supplierId: string,
    activeProductReferences: string[],
  ): Promise<void> {
    // À implémenter selon la storage backend
    // Par défaut, on conserve les images (pas de purge automatique)
  }
}
