import { env } from '~/env';
import * as Minio from 'minio';

// Storage client that works with both MinIO and Cloudflare R2
// In Cloudflare Workers, it uses R2 bindings
// In Node.js environments, it uses MinIO client

// Define R2Bucket type for Cloudflare Workers R2
interface R2Bucket {
  put(key: string, data: Buffer | Uint8Array | string, options?: { httpMetadata?: Record<string, string> }): Promise<void>;
  get(key: string): Promise<unknown>;
  delete(key: string): Promise<void>;
}

export interface StorageClient {
  presignedPutObject(bucket: string, key: string, expiry: number): Promise<string>;
  presignedGetObject(bucket: string, key: string, expiry: number): Promise<string>;
  putObject(bucket: string, key: string, data: Buffer | Uint8Array | string, metadata?: Record<string, string>): Promise<void>;
  getObject(bucket: string, key: string): Promise<unknown>;
  removeObject(bucket: string, key: string): Promise<void>;
  bucketExists?(bucket: string): Promise<boolean>;
  makeBucket?(bucket: string): Promise<void>;
}

class R2StorageClient implements StorageClient {
  private r2: R2Bucket;
  private publicUrl: string;

  constructor(r2Bucket: R2Bucket) {
    this.r2 = r2Bucket;
    // R2 public URL would be set via environment variable
    this.publicUrl = env.R2_PUBLIC_URL ?? '';
  }

  async presignedPutObject(_bucket: string, key: string, _expiry: number): Promise<string> {
    // For R2, we can return a direct upload URL or use a custom endpoint
    // This would require implementing a custom upload handler
    // For now, return the public URL format
    return `${this.publicUrl}/${key}`;
  }

  async presignedGetObject(_bucket: string, key: string, _expiry: number): Promise<string> {
    // For R2, return the public URL
    // In production, you may want to implement signed URLs via a Worker
    return `${this.publicUrl}/${key}`;
  }

  async putObject(_bucket: string, key: string, data: Buffer | Uint8Array | string, metadata?: Record<string, string>): Promise<void> {
    await this.r2.put(key, data, { httpMetadata: metadata });
  }

  async getObject(_bucket: string, key: string): Promise<unknown> {
    return await this.r2.get(key);
  }

  async removeObject(_bucket: string, key: string): Promise<void> {
    await this.r2.delete(key);
  }

  // R2 buckets are always available, no need to check
  async bucketExists(_bucket: string): Promise<boolean> {
    return true;
  }

  // R2 buckets are created through Wrangler CLI, not at runtime
  async makeBucket(_bucket: string): Promise<void> {
    // No-op for R2
  }
}

// Helper to get bucket name with fallback
export function getBucketName(): string {
  return env.MINIO_BUCKET ?? 'bjjh-cleaning-storage';
}

// Create the appropriate storage client based on environment
function createStorageClient(): StorageClient {
  // Check if we're in a Cloudflare Workers environment
  const r2Bucket = (globalThis as { R2?: R2Bucket }).R2;
  if (r2Bucket) {
    return new R2StorageClient(r2Bucket);
  }
  
  // Use MinIO client for non-Workers environments (development, standalone Node.js)
  // Only create if required env vars are present
  if (!env.MINIO_ENDPOINT || !env.MINIO_PORT || !env.MINIO_ACCESS_KEY || !env.MINIO_SECRET_KEY) {
    throw new Error('MinIO configuration missing. Please set MINIO_* environment variables for local development.');
  }

  const minioClient = new Minio.Client({
    endPoint: env.MINIO_ENDPOINT,
    port: parseInt(env.MINIO_PORT),
    useSSL: env.MINIO_USE_SSL,
    accessKey: env.MINIO_ACCESS_KEY,
    secretKey: env.MINIO_SECRET_KEY
  });

  return minioClient as unknown as StorageClient;
}

// Export the storage client instance
export const s3 = createStorageClient();

