import { S3Client } from "@bradenmacdonald/s3-lite-client";
import { assertRejects } from "@std/assert";
import "@std/dotenv/load";
import { uploadImageToS3 } from "./s3.ts";

Deno.test("uploadImageToS3 throws on missing env vars", async () => {
  const originalEnv = { ...Deno.env.toObject() };
  Deno.env.delete("S3_ENDPOINT");
  Deno.env.delete("S3_ACCESS_KEY_ID");
  Deno.env.delete("S3_SECRET_ACCESS_KEY");
  Deno.env.delete("S3_BUCKET");

  await assertRejects(
    () => uploadImageToS3(new Uint8Array([1, 2, 3]), "test.png"),
    Error,
    "Missing S3 configuration environment variables",
  );

  // Restore env
  for (const [k, v] of Object.entries(originalEnv)) {
    Deno.env.set(k, v);
  }
});

Deno.test("uploadImageToS3 uploads, fetches, and deletes a file", async () => {
  const key = `test-upload-${Date.now()}.txt`;
  const data = new TextEncoder().encode("Hello, Barsistant S3!");
  const { url, key: returnedKey } = await uploadImageToS3(
    data,
    key,
    "text/plain",
  );

  if (!url.includes(key)) throw new Error("Returned URL does not include key");
  if (returnedKey !== key) throw new Error("Returned key does not match");

  // Fetch the uploaded file via public URL
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch uploaded file: ${response.status}`);
  }
  const text = await response.text();
  if (text !== "Hello, Barsistant S3!") {
    throw new Error("Fetched file content does not match");
  }

  // Now delete the file
  const endPoint = Deno.env.get("S3_ENDPOINT");
  const accessKey = Deno.env.get("S3_ACCESS_KEY_ID");
  const secretKey = Deno.env.get("S3_SECRET_ACCESS_KEY");
  const bucket = Deno.env.get("S3_BUCKET");
  const region = Deno.env.get("S3_REGION") ?? "us-east-1";

  if (!endPoint || !accessKey || !secretKey || !bucket) {
    throw new Error(
      "Missing S3 configuration environment variables for integration test",
    );
  }

  const client = new S3Client({
    endPoint,
    region,
    bucket,
    accessKey,
    secretKey,
  });
  await client.deleteObject(key);
});
