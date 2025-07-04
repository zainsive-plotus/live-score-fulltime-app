// src/app/api/admin/file-manager/download-from-url/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import axios from "axios";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";
import path from "path"; // Node.js path module
import slugify from "slugify";

// --- S3 Client configuration (reused from src/app/api/upload/route.ts) ---
const s3Client = new S3Client({
  region: process.env.NEXT_PUBLIC_AWS_S3_REGION as string,
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY as string,
  },
});

const generateFileName = (bytes = 32) =>
  crypto.randomBytes(bytes).toString("hex");

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const {
      url,
      fileName: providedFileName,
    }: { url: string; fileName?: string } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required." }, { status: 400 });
    }

    console.log(
      `[File Manager - Download URL] Attempting to download from URL: ${url}`
    );

    // 1. Download the file from the external URL
    const response = await axios.get(url, {
      responseType: "arraybuffer", // Get as binary data
      timeout: 30000, // 30-second timeout for download
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    const fileBuffer = Buffer.from(response.data, "binary");
    const contentType =
      response.headers["content-type"] || "application/octet-stream"; // Get content type from response
    const contentLength = response.headers["content-length"]
      ? parseInt(response.headers["content-length"])
      : fileBuffer.length;

    if (contentLength === 0) {
      throw new Error("Downloaded file is empty.");
    }
    if (contentLength > 20 * 1024 * 1024) {
      // Max 20MB limit for direct download, adjust as needed
      throw new Error("File size exceeds 20MB limit for direct download.");
    }

    // Determine file extension and final file name
    let fileExtension = "";
    const mimeMap: { [key: string]: string } = {
      "image/jpeg": ".jpg",
      "image/png": ".png",
      "image/gif": ".gif",
      "image/webp": ".webp",
      "application/pdf": ".pdf",
      // Add more as needed
    };
    fileExtension =
      mimeMap[contentType.toLowerCase()] ||
      path.extname(new URL(url).pathname) ||
      ""; // Try mime type then URL path extension

    const uniqueBaseName = generateFileName();
    const finalFileName = providedFileName
      ? `${slugify(providedFileName, {
          lower: true,
          strict: true,
        })}${fileExtension}`
      : `${uniqueBaseName}${fileExtension}`;

    const bucketName = process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME as string;

    // 2. Upload the file to S3
    const putObjectCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: finalFileName, // Use the generated/provided filename
      Body: fileBuffer,
      ContentType: contentType,
    });

    console.log(
      `[File Manager - Download URL] Uploading ${finalFileName} (${contentType}, ${contentLength} bytes) to S3...`
    );
    await s3Client.send(putObjectCommand);

    const publicUrl = `https://${bucketName}.s3.${process.env.NEXT_PUBLIC_AWS_S3_REGION}.amazonaws.com/${finalFileName}`;
    console.log(
      `[File Manager - Download URL] File successfully uploaded to S3: ${publicUrl}`
    );

    return NextResponse.json({
      message: "File downloaded and uploaded successfully",
      url: publicUrl,
      name: finalFileName, // Return the actual file name used on S3
      type: contentType,
      size: contentLength,
    });
  } catch (error: any) {
    console.error(
      `[File Manager - Download URL] Failed to download or upload from URL: ${error.message}`,
      "\nFull Error:",
      error
    );
    let errorMessage = "Failed to download and upload file from URL.";
    let clientStatus = 500;

    if (axios.isAxiosError(error)) {
      if (error.response) {
        errorMessage = `External URL error: Status ${error.response.status} - ${error.response.statusText}`;
        clientStatus = error.response.status;
      } else if (error.request) {
        errorMessage = `Network error: Could not reach external URL.`;
        clientStatus = 502; // Bad Gateway
      } else {
        errorMessage = `Request setup error: ${error.message}`;
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
      if (errorMessage.includes("File size exceeds")) clientStatus = 413; // Payload Too Large
      if (errorMessage.includes("Downloaded file is empty")) clientStatus = 400; // Bad Request
    }

    return NextResponse.json({ error: errorMessage }, { status: clientStatus });
  }
}
