import { env } from '~/env'
import * as Minio from 'minio'

// Legacy MinIO client for backward compatibility
// Note: This file is kept for backward compatibility only.
// For new code, use the storage.ts module which supports both MinIO and Cloudflare R2

// Only create the MinIO client if the required environment variables are set
let s3Client: Minio.Client | undefined;

try {
    if (env.MINIO_ENDPOINT && env.MINIO_PORT && env.MINIO_ACCESS_KEY && env.MINIO_SECRET_KEY) {
        s3Client = new Minio.Client({
            endPoint: env.MINIO_ENDPOINT,
            port: parseInt(env.MINIO_PORT),
            useSSL: env.MINIO_USE_SSL,
            accessKey: env.MINIO_ACCESS_KEY,
            secretKey: env.MINIO_SECRET_KEY
        });
    }
} catch (error) {
    console.warn('MinIO client not initialized:', error);
}

export const s3 = s3Client!
