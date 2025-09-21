import { env } from '~/env'
import * as Minio from 'minio'

export const s3 = new Minio.Client({
    endPoint: env.MINIO_ENDPOINT,
    port: parseInt(env.MINIO_PORT),
    useSSL: env.MINIO_USE_SSL,
    accessKey: env.MINIO_ACCESS_KEY,
    secretKey: env.MINIO_SECRET_KEY
})

s3.bucketExists(env.MINIO_BUCKET)
    .then((exists) => {
        if (!exists) {
            s3.makeBucket(env.MINIO_BUCKET).then(() => {
                console.log(`Bucket ${env.MINIO_BUCKET} created successfully`)
            }).catch((err) => {
                console.error('Error creating bucket:', err)
            })
        } else {
            console.log(`Bucket ${env.MINIO_BUCKET} already exists`)
        }
    })