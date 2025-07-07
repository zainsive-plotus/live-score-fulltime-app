// ===== src/app/api/upload/route.ts (REVISED FOR GIFS AND NO CROPPING) =====
import { NextResponse } from "next/server";
import {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import sharp from "sharp";
import path from "path";
import slugify from "slugify";

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

// --- GET handler to list uploaded files from R2 (unchanged) ---
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const listObjectsCommand = new ListObjectsV2Command({
      Bucket: R2_BUCKET_NAME,
      MaxKeys: 100,
    });

    const { Contents } = await s3Client.send(listObjectsCommand);

    const files =
      Contents?.map((item) => {
        const key = item.Key || "unknown";
        const fileExtension = path.extname(key).toLowerCase();
        let mimeType = "application/octet-stream";

        if (fileExtension === ".png") mimeType = "image/png";
        else if (fileExtension === ".jpg" || fileExtension === ".jpeg")
          mimeType = "image/jpeg";
        else if (fileExtension === ".gif") mimeType = "image/gif";
        else if (fileExtension === ".webp") mimeType = "image/webp";

        return {
          name: key,
          url: `${R2_PUBLIC_URL}/${key}`,
          size: item.Size || 0,
          lastModified: item.LastModified,
          type: mimeType,
        };
      }) || [];

    files.sort(
      (a, b) =>
        (b.lastModified?.getTime() || 0) - (a.lastModified?.getTime() || 0)
    );

    return NextResponse.json(files, { status: 200 });
  } catch (error) {
    console.error("Error listing files from R2:", error);
    return NextResponse.json(
      { error: "Failed to list files from Cloudflare R2." },
      { status: 500 }
    );
  }
}

// --- POST handler to upload files to R2 (UPDATED) ---
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
    let finalFileExtension: string;

    // ===== NEW GIF HANDLING LOGIC =====
    if (file.type === "image/gif") {
      finalBuffer = Buffer.from(await file.arrayBuffer());
      finalContentType = "image/gif";
      finalFileExtension = ".gif";
    } else {
      // Process other image types (PNG, JPEG, WebP, etc.)
      const inputBuffer = Buffer.from(await file.arrayBuffer());
      let sharpInstance = sharp(inputBuffer);

      if (uploadType === "banner") {
        // Banners should be resized to fit inside without cropping
        sharpInstance = sharpInstance.resize(1200, 1200, {
          fit: "inside", // This prevents cropping
          withoutEnlargement: true,
        });
      } else {
        // Other images (e.g., news featured images) should also be resized to fit without cropping
        // Change from 'cover' to 'inside' to prevent cropping
        sharpInstance = sharpInstance.resize(1200, 630, {
          fit: "inside", // Changed from "cover" to "inside"
          withoutEnlargement: true,
        });
      }

      finalBuffer = await sharpInstance.webp({ quality: 80 }).toBuffer();
      finalContentType = "image/webp";
      finalFileExtension = ".webp";
    }

    // Generate the new filename with "fanskor-" prefix, slug, and unique suffix
    const originalFilename = file.name;
    const extension = path.extname(originalFilename);
    const basename = path.basename(originalFilename, extension);
    const slug = slugify(basename, {
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@]/g,
    });
    const uniqueSuffix = Date.now().toString().slice(-6);

    const newFileName = `fanskor-${slug}-${uniqueSuffix}${finalFileExtension}`;

    const putObjectCommand = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: newFileName,
      Body: finalBuffer,
      ContentType: finalContentType,
    });

    await s3Client.send(putObjectCommand);

    const publicUrl = `${R2_PUBLIC_URL}/${newFileName}`;

    return NextResponse.json({
      message: "File uploaded successfully",
      url: publicUrl,
      name: newFileName,
      type: finalContentType,
      size: finalBuffer.length,
    });
  } catch (error) {
    console.error("Error uploading to R2:", error);
    return NextResponse.json(
      { error: "Failed to upload image to Cloudflare R2." },
      { status: 500 }
    );
  }
}

// --- DELETE handler to remove files from R2 (unchanged) ---
export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const fileKey = searchParams.get("key");

  if (!fileKey) {
    return NextResponse.json(
      { error: "File key is required for deletion." },
      { status: 400 }
    );
  }

  try {
    const deleteObjectCommand = new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: fileKey,
    });

    await s3Client.send(deleteObjectCommand);
    console.log(`Successfully deleted R2 object: ${fileKey}`);

    return NextResponse.json(
      { message: "File deleted successfully." },
      { status: 200 }
    );
  } catch (error: any) {
    console.error(`Error deleting file ${fileKey} from R2:`, error);
    if (error.name === "NoSuchKey") {
      return NextResponse.json(
        { error: "File not found on Cloudflare R2." },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Failed to delete file from Cloudflare R2." },
      { status: 500 }
    );
  }
}
