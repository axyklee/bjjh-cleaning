import 'dotenv/config';
import * as Minio from 'minio'
import { exit } from 'process';

export const s3 = new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT ?? "",
    port: parseInt(process.env.MINIO_PORT ?? "9000") ?? 9000,
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY,
    secretKey: process.env.MINIO_SECRET_KEY
})


async function ensureBucket() {
  try {
    const exists = await s3.bucketExists(process.env.MINIO_BUCKET ?? "bjjh-cleaning");
    if (!exists) {
      console.log(`Bucket "${process.env.MINIO_BUCKET ?? "bjjh-cleaning"}" does not exist. Creating...`);
      await s3.makeBucket(process.env.MINIO_BUCKET ?? "bjjh-cleaning");
      console.log(`Bucket "${process.env.MINIO_BUCKET ?? "bjjh-cleaning"}" created successfully.`);
    } else {
      console.log(`Bucket "${process.env.MINIO_BUCKET ?? "bjjh-cleaning"}" already exists.`);
    }
  } catch (err) {
    console.error("Error checking or creating bucket:", err);
    exit(1);
  }
}

ensureBucket();
