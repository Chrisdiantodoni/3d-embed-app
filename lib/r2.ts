import {
    S3Client,
    PutObjectCommand,
    DeleteObjectCommand,
} from "@aws-sdk/client-s3";

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME!;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL!; // e.g. https://pub-xxx.r2.dev

const r2Client = new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
});

/**
 * Upload a file buffer to Cloudflare R2.
 * Returns the public URL of the uploaded file.
 */
export async function uploadToR2(
    key: string,
    body: Buffer,
    contentType: string,
): Promise<string> {
    await r2Client.send(
        new PutObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: key,
            Body: body,
            ContentType: contentType,
        }),
    );

    return `${R2_PUBLIC_URL}/${key}`;
}

/**
 * Delete a file from Cloudflare R2 by its key.
 */
export async function deleteFromR2(key: string): Promise<void> {
    await r2Client.send(
        new DeleteObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: key,
        }),
    );
}

/**
 * Extract the R2 object key from a full public URL.
 */
export function getR2KeyFromUrl(url: string): string {
    return url.replace(`${R2_PUBLIC_URL}/`, "");
}
