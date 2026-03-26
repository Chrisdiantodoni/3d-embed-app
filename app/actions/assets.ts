"use server";

import { uploadToCloudinary } from "@/lib/uploadToCloudinary";
import { db } from "@/src";
import { assets } from "@/src/db/schema";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from "uuid";

// Inisialisasi S3 Client untuk Cloudflare R2
const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function createAssetAction(formData: FormData) {
  const { userId } = await auth();

  // Jika user belum login, langsung stop prosesnya
  if (!userId) {
    throw new Error("Unauthorized: Kamu harus login untuk upload aset.");
  }
  const file = formData.get("file") as File;
  const name = formData.get("name") as string;
  const thumbFile = formData.get("thumbnail") as File;

  if (!file || !name) {
    return { error: "File dan nama aset wajib diisi" };
  }

  // 1. Validasi Ekstensi
  if (!file.name.endsWith(".glb")) {
    return { error: "Hanya format .glb yang diizinkan" };
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const thumbBuffer = Buffer.from(await thumbFile.arrayBuffer());

    // 2. Gunakan fungsi utilitas kamu
    const cloudinaryResponse = await uploadToCloudinary(thumbBuffer, {
      folder: "3d-thumbnails",
      public_id: `thumb-${Date.now()}`,
      format: "webp",
    });

    // 3. Ambil URL hasil upload
    const thumbnailUrl = cloudinaryResponse.secure_url;

    // Buat nama file unik agar tidak bentrok di R2
    const fileExtension = file.name.split(".").pop();
    const uniqueFileName = `${uuidv4()}.${fileExtension}`;

    // 2. Upload ke Cloudflare R2
    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: uniqueFileName,
        Body: buffer,
        ContentType: "model/gltf-binary", // MIME type khusus GLB
      }),
    );

    // Link publik file
    const publicUrl = `${process.env.R2_PUBLIC_URL}/${uniqueFileName}`;

    // 3. Simpan Metadata ke Turso
    await db.insert(assets).values({
      id: uuidv4(),
      name: name,
      url: publicUrl,
      fileSize: file.size,
      userId: userId,
      thumbnailUrl: thumbnailUrl,
      // fields lain sesuai skema Turso kamu
    });

    // Refresh data di halaman library tanpa reload
    revalidatePath("/dashboard/assets");

    return { success: true, url: publicUrl };
  } catch (error) {
    console.error("Upload Error:", error);
    return { error: "Terjadi kesalahan saat upload ke server" };
  }
}
