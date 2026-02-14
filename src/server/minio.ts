import { env } from '~/env'
import * as Minio from 'minio'

let _s3: Minio.Client | null = null

export function getS3() {
    if (!_s3) {
        _s3 = new Minio.Client({
            endPoint: env.MINIO_ENDPOINT,
            port: parseInt(env.MINIO_PORT),
            useSSL: env.MINIO_USE_SSL,
            accessKey: env.MINIO_ACCESS_KEY,
            secretKey: env.MINIO_SECRET_KEY,
        })
    }
    return _s3
}
