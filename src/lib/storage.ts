// src/lib/storage.ts
export function buildSignedUrl(key: string): string {
    // replace these with your real account & bucket names
    const accountId   = process.env.R2_ACCOUNT_ID!;
    const bucketName  = process.env.R2_BUCKET_NAME!;
    return `https://${accountId}.r2.cloudflarestorage.com/${bucketName}/${encodeURIComponent(key)}`;
  }