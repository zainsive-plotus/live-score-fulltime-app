// src/lib/image-processing-server.ts
import axios from "axios";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";
import crypto from "crypto";
import slugify from "slugify";
import path from "path";

// --- R2/S3 Client Configuration ---
const s3Client = new S3Client({
  region: "auto",
  endpoint: process.env.NEXT_PUBLIC_R2_ENDPOINT as string,
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_R2_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.NEXT_PUBLIC_R2_SECRET_ACCESS_KEY as string,
  },
});

const R2_BUCKET_NAME = process.env.NEXT_PUBLIC_R2_BUCKET_NAME as string;
const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_BUCKET_URL as string;

/**
 * Downloads an image from an external URL, processes it, and uploads it to your R2 bucket.
 * - Converts most images to optimized WebP format.
 * - Handles animated GIFs by uploading them directly without modification.
 * - Generates a unique, SEO-friendly filename.
 * @param imageUrl The original URL of the image to process.
 * @param newPostTitle The title of the post, used to generate a descriptive filename.
 * @returns The public URL of the newly uploaded image in R2, or null on failure.
 */
export async function proxyAndUploadImage(
  imageUrl: string,
  newPostTitle: string
): Promise<string | null> {
  try {
    console.log(`[Image Processor] Downloading: ${imageUrl}`);
    const imageResponse = await axios.get(imageUrl, {
      responseType: "arraybuffer",
      timeout: 15000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    const inputBuffer = Buffer.from(imageResponse.data, "binary");
    const originalContentType =
      imageResponse.headers["content-type"] || "image/jpeg";

    let finalBuffer: Buffer;
    let finalContentType: string;
    let fileExtension: string;

    // Handle animated GIFs by uploading them as-is
    if (originalContentType.includes("image/gif")) {
      console.log("[Image Processor] GIF detected, bypassing optimization.");
      finalBuffer = inputBuffer;
      finalContentType = "image/gif";
      fileExtension = ".gif";
    } else {
      // For all other formats, resize and convert to WebP for performance
      console.log(
        "[Image Processor] Processing with Sharp (resize & convert to WebP)."
      );
      finalBuffer = await sharp(inputBuffer)
        .resize(1200, 630, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();
      finalContentType = "image/webp";
      fileExtension = ".webp";
    }

    // Generate a clean, unique, SEO-friendly filename
    const slug = slugify(newPostTitle, {
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@]/g,
    });
    const uniqueSuffix = Date.now().toString().slice(-6);
    const newFileName = `fanskor-${slug.slice(
      0,
      50
    )}-${uniqueSuffix}${fileExtension}`;

    // Upload the final buffer to R2
    const putObjectCommand = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: newFileName,
      Body: finalBuffer,
      ContentType: finalContentType,
    });
    await s3Client.send(putObjectCommand);

    const r2Url = `${R2_PUBLIC_URL}/${newFileName}`;
    console.log(`[Image Processor] ✓ Upload successful: ${r2Url}`);
    return r2Url;
  } catch (error: any) {
    console.error(
      `[Image Processor] ✗ Failed to process image from URL (${imageUrl}):`,
      error.message
    );
    return null;
  }
}
