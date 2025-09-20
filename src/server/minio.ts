import { env } from '~/env'
import * as Minio from 'minio'

export const s3 = new Minio.Client({
    endPoint: env.MINIO_ENDPOINT,
    port: parseInt(env.MINIO_PORT),
    useSSL: env.MINIO_USE_SSL,
    accessKey: env.MINIO_ACCESS_KEY,
    secretKey: env.MINIO_SECRET_KEY
})