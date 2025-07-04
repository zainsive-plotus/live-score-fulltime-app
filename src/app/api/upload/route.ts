// src/app/api/upload/route.ts

import { NextResponse } from "next/server";
import {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3"; // <-- NEW IMPORT: DeleteObjectCommand
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

// --- GET handler to list uploaded files --- (No changes here)
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const bucketName = process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME as string;

  try {
    const listObjectsCommand = new ListObjectsV2Command({
      Bucket: bucketName,
      MaxKeys: 100,
    });

    const { Contents } = await s3Client.send(listObjectsCommand);

    const files =
      Contents?.map((item) => ({
        name: item.Key || "unknown",
        url: `https://${bucketName}.s3.${process.env.NEXT_PUBLIC_AWS_S3_REGION}.amazonaws.com/${item.Key}`,
        size: item.Size || 0,
        lastModified: item.LastModified,
        type: item.Key?.toLowerCase().endsWith(".png")
          ? "image/png"
          : item.Key?.toLowerCase().endsWith(".jpg") ||
            item.Key?.toLowerCase().endsWith(".jpeg")
          ? "image/jpeg"
          : item.Key?.toLowerCase().endsWith(".gif")
          ? "image/gif"
          : item.Key?.toLowerCase().endsWith(".webp")
          ? "image/webp"
          : "application/octet-stream",
      })) || [];

    files.sort(
      (a, b) =>
        (b.lastModified?.getTime() || 0) - (a.lastModified?.getTime() || 0)
    );

    return NextResponse.json(files, { status: 200 });
  } catch (error) {
    console.error("Error listing files from S3:", error);
    return NextResponse.json(
      { error: "Failed to list files from S3." },
      { status: 500 }
    );
  }
}

// --- POST handler to upload files --- (No changes here)
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

    let finalBuffer: Buffer;
    let finalContentType: string = file.type;
    const fileName = generateFileName();

    if (uploadType === "banner" && file.type === "image/gif") {
      finalBuffer = Buffer.from(await file.arrayBuffer());
    } else {
      const inputBuffer = Buffer.from(await file.arrayBuffer());
      let sharpInstance = sharp(inputBuffer);

      if (uploadType === "banner") {
        sharpInstance = sharpInstance.resize(1200, 1200, {
          fit: "inside",
          withoutEnlargement: true,
        });
      } else {
        sharpInstance = sharpInstance.resize(1200, 630, { fit: "cover" });
      }

      finalBuffer = await sharpInstance.webp({ quality: 80 }).toBuffer();
      finalContentType = "image/webp";
    }

    const bucketName = process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME as string;

    const putObjectCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileName,
      Body: finalBuffer,
      ContentType: finalContentType,
    });

    await s3Client.send(putObjectCommand);

    const publicUrl = `https://${bucketName}.s3.${process.env.NEXT_PUBLIC_AWS_S3_REGION}.amazonaws.com/${fileName}`;

    return NextResponse.json({
      message: "File uploaded successfully",
      url: publicUrl,
      name: fileName,
      type: finalContentType,
      size: finalBuffer.length,
    });
  } catch (error) {
    console.error("Error uploading to S3:", error);
    return NextResponse.json(
      { error: "Failed to upload image." },
      { status: 500 }
    );
  }
}

// --- NEW: DELETE handler to remove files from S3 ---
export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const bucketName = process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME as string;
  const { searchParams } = new URL(request.url);
  const fileKey = searchParams.get("key"); // The S3 object key/name of the file to delete

  if (!fileKey) {
    return NextResponse.json(
      { error: "File key is required for deletion." },
      { status: 400 }
    );
  }

  try {
    const deleteObjectCommand = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: fileKey,
    });

    await s3Client.send(deleteObjectCommand);
    console.log(`Successfully deleted S3 object: ${fileKey}`);

    return NextResponse.json(
      { message: "File deleted successfully." },
      { status: 200 }
    );
  } catch (error: any) {
    console.error(`Error deleting file ${fileKey} from S3:`, error);
    if (error.name === "NoSuchKey") {
      // File not found on S3
      return NextResponse.json(
        { error: "File not found on S3." },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Failed to delete file from S3." },
      { status: 500 }
    );
  }
}
