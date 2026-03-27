import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

@Injectable()
export class StorageService {
  private minioClient?: Minio.Client;
  private s3Client?: S3Client;
  private storageBackend: 'minio' | 's3';
  private bucketName: string;
  private cdnBaseUrl: string;

  constructor(private configService: ConfigService) {
    this.storageBackend =
      (this.configService.get<string>('STORAGE_BACKEND') as 'minio' | 's3') ||
      'minio';
    this.bucketName =
      this.configService.get<string>('STORAGE_BUCKET') || 'deka-products';
    this.cdnBaseUrl =
      this.configService.get<string>('CDN_BASE_URL') || 'http://localhost:9000';

    this.initializeStorage();
  }

  /**
   * Initialise le client de stockage (MinIO ou S3)
   */
  private initializeStorage(): void {
    if (this.storageBackend === 'minio') {
      this.minioClient = new Minio.Client({
        endPoint: this.configService.get<string>('MINIO_ENDPOINT') || 'localhost',
        port: this.configService.get<number>('MINIO_PORT') || 9000,
        useSSL: this.configService.get<string>('MINIO_USE_SSL') === 'true',
        accessKey:
          this.configService.get<string>('MINIO_ACCESS_KEY') || 'minioadmin',
        secretKey:
          this.configService.get<string>('MINIO_SECRET_KEY') || 'minioadmin',
        region: this.configService.get<string>('MINIO_REGION'),
      });
    } else if (this.storageBackend === 's3') {
      this.s3Client = new S3Client({
        region:
          this.configService.get<string>('AWS_REGION') || 'us-east-1',
        credentials: {
          accessKeyId:
            this.configService.get<string>('AWS_ACCESS_KEY_ID') || '',
          secretAccessKey:
            this.configService.get<string>('AWS_SECRET_ACCESS_KEY') || '',
        },
      });
    }
  }

  /**
   * Upload une image sur le stockage
   * Retourne l'URL CDN pour accéder à l'image
   */
  async uploadImage(
    imageBuffer: Buffer,
    supplierId: string,
    productReference: string,
  ): Promise<string | null> {
    const fileName = `${productReference}.webp`;
    const objectPath = `products/${supplierId}/${fileName}`;

    try {
      if (this.storageBackend === 'minio' && this.minioClient) {
        return await this.uploadToMinio(imageBuffer, objectPath);
      } else if (this.storageBackend === 's3' && this.s3Client) {
        return await this.uploadToS3(imageBuffer, objectPath);
      }

      console.error('No storage backend configured');
      return null;
    } catch (error) {
      console.error(`Failed to upload image ${objectPath}:`, error);
      return null;
    }
  }

  /**
   * Upload sur MinIO
   */
  private async uploadToMinio(
    imageBuffer: Buffer,
    objectPath: string,
  ): Promise<string | null> {
    try {
      // Vérifier ou créer le bucket
      const bucketExists = await this.minioClient!.bucketExists(this.bucketName);
      if (!bucketExists) {
        await this.minioClient!.makeBucket(this.bucketName, 'us-east-1');
      }

      // Upload l'objet
      await this.minioClient!.putObject(
        this.bucketName,
        objectPath,
        imageBuffer,
        imageBuffer.length,
        {
          'Content-Type': 'image/webp',
          'Cache-Control': 'public, max-age=31536000', // 1 an
        },
      );

      // Retourner l'URL CDN
      return `${this.cdnBaseUrl}/${this.bucketName}/${objectPath}`;
    } catch (error) {
      console.error(`MinIO upload failed for ${objectPath}:`, error);
      return null;
    }
  }

  /**
   * Upload sur AWS S3
   */
  private async uploadToS3(
    imageBuffer: Buffer,
    objectPath: string,
  ): Promise<string | null> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: objectPath,
        Body: imageBuffer,
        ContentType: 'image/webp',
        CacheControl: 'public, max-age=31536000', // 1 an
        // Public read ACL (optionnel, dépend de la bucket policy)
        // ACL: 'public-read',
      });

      await this.s3Client!.send(command);

      // Construire l'URL S3 / CloudFront
      const urlBase = this.cdnBaseUrl.includes('cloudfront')
        ? this.cdnBaseUrl
        : `https://${this.bucketName}.s3.${this.configService.get<string>('AWS_REGION') || 'us-east-1'}.amazonaws.com`;

      return `${urlBase}/${objectPath}`;
    } catch (error) {
      console.error(`S3 upload failed for ${objectPath}:`, error);
      return null;
    }
  }

  /**
   * Supprime une image du stockage
   */
  async deleteImage(supplierId: string, productReference: string): Promise<boolean> {
    const fileName = `${productReference}.webp`;
    const objectPath = `products/${supplierId}/${fileName}`;

    try {
      if (this.storageBackend === 'minio' && this.minioClient) {
        await this.minioClient.removeObject(this.bucketName, objectPath);
        return true;
      } else if (this.storageBackend === 's3' && this.s3Client) {
        const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
        const command = new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: objectPath,
        });
        await this.s3Client.send(command);
        return true;
      }

      return false;
    } catch (error) {
      console.error(`Failed to delete image ${objectPath}:`, error);
      return false;
    }
  }

  /**
   * Télécharge une image (pour le test/debug)
   */
  async getImageUrl(supplierId: string, productReference: string): Promise<string | null> {
    try {
      const fileName = `${productReference}.webp`;
      const objectPath = `products/${supplierId}/${fileName}`;
      return `${this.cdnBaseUrl}/${this.bucketName}/${objectPath}`;
    } catch (error) {
      console.error('Failed to get image URL:', error);
      return null;
    }
  }
}
