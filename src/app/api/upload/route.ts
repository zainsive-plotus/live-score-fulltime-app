// src/app/api/upload/route.ts

import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import sharp from "sharp";
import crypto from "crypto";

// --- S3 Client configuration remains the same ---
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
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const uploadType = formData.get("uploadType") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    // --- NEW, MORE ROBUST LOGIC ---
    let finalBuffer: Buffer;
    let finalContentType: string = file.type; // Default to original file type
    const fileName = generateFileName();

    // Check if the file is a GIF and is intended for a banner slot.
    if (uploadType === "banner" && file.type === "image/gif") {
      // --- 1. GIF BANNER PATH ---
      // It's a GIF for a banner, so we bypass Sharp completely to preserve animation.
      console.log("GIF Banner detected. Bypassing image processing.");
      finalBuffer = Buffer.from(await file.arrayBuffer());
      // The contentType is already correctly set to 'image/gif'.
    } else {
      // --- 2. STANDARD IMAGE PROCESSING PATH ---
      // For all other images (JPG, PNG, or post images), we process them with Sharp.
      console.log("Standard image detected. Processing with Sharp.");
      const inputBuffer = Buffer.from(await file.arrayBuffer());
      let sharpInstance = sharp(inputBuffer);

      if (uploadType === "banner") {
        // For non-GIF banners, resize without cropping.
        sharpInstance = sharpInstance.resize(1200, 1200, {
          fit: "inside",
          withoutEnlargement: true,
        });
      } else {
        // For posts (default), resize with cropping.
        sharpInstance = sharpInstance.resize(1200, 630, { fit: "cover" });
      }

      // Convert the final processed image to WebP.
      finalBuffer = await sharpInstance.webp({ quality: 80 }).toBuffer();
      finalContentType = "image/webp"; // Update the content type for S3.
    }

    // --- UNIFIED UPLOAD TO S3 ---
    // This part now uses the dynamically determined buffer and content type.
    const bucketName = process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME as string;

    const putObjectCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileName,
      Body: finalBuffer,
      ContentType: finalContentType, // Use the correct final content type
    });

    await s3Client.send(putObjectCommand);

    const publicUrl = `https://${bucketName}.s3.${process.env.NEXT_PUBLIC_AWS_S3_REGION}.amazonaws.com/${fileName}`;

    return NextResponse.json({
      message: "Image uploaded successfully",
      url: publicUrl,
    });
  } catch (error) {
    console.error("Error uploading to S3:", error);
    return NextResponse.json(
      { error: "Failed to upload image." },
      { status: 500 }
    );
  }
}
