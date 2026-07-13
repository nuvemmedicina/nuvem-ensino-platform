import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID!;
const bucket = process.env.R2_BUCKET_NAME ?? "nuvem-ensino-files";

export const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function getR2UploadUrl(key: string, contentType: string, fileSizeBytes: number) {
  const cmd = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
    ContentLength: fileSizeBytes,
  });
  const url = await getSignedUrl(r2, cmd, { expiresIn: 3600 });
  // Public URL via r2.dev dev subdomain or custom domain
  const publicBase = process.env.R2_PUBLIC_URL ?? `https://${accountId}.r2.cloudflarestorage.com/${bucket}`;
  return { uploadUrl: url, publicUrl: `${publicBase}/${key}` };
}

export async function deleteR2Object(key: string) {
  await r2.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}
