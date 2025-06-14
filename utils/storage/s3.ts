// S3 utility for uploading images to S3-compatible storage
// Uses s3-lite-client (https://github.com/bradenmacdonald/s3-lite-client)
//
// Environment variables required:
//   S3_ENDPOINT, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_BUCKET, S3_REGION

import { S3Client } from "@bradenmacdonald/s3-lite-client";

export interface S3UploadResult {
  url: string;
  key: string;
}

export async function uploadImageToS3(
  image: Uint8Array,
  key: string,
  contentType: string = "image/png",
): Promise<S3UploadResult> {
  const endPoint = Deno.env.get("S3_ENDPOINT");
  const accessKey = Deno.env.get("S3_ACCESS_KEY_ID");
  const secretKey = Deno.env.get("S3_SECRET_ACCESS_KEY");
  const bucket = Deno.env.get("S3_BUCKET");
  const region = Deno.env.get("S3_REGION") ?? "us-east-1";

  if (!endPoint || !accessKey || !secretKey || !bucket) {
    throw new Error("Missing S3 configuration environment variables");
  }

  const client = new S3Client({
    endPoint,
    region,
    bucket,
    accessKey,
    secretKey,
  });

  await client.putObject(key, image, {
    metadata: {
      "Content-Type": contentType,
    },
  });

  // Construct the public URL (may need adjustment for your S3 provider)
  const url = `${endPoint.replace(/\/$/, "")}/${bucket}/${key}`;
  return { url, key };
}
