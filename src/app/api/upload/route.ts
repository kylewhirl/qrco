export const runtime = 'nodejs';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");
  const code = formData.get("code");

  if (!(file instanceof File) || typeof code !== "string") {
    return new Response("Invalid form data", { status: 400 });
  }

  // Initialize the S3 client for Cloudflare R2
  const s3 = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
    forcePathStyle: false,
  });

  // Prepare upload parameters
  const extension = file.name.split(".").pop() || "";
  const key = `${code}.${extension}`;
  const body = Buffer.from(await file.arrayBuffer());

  // Upload to R2 bucket
  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      Body: body,
      ContentType: file.type,
    })
  );

  // Return the uploaded file key
  return new Response(JSON.stringify({ key }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}