"use server";

import { uploadToCloudinary } from "@/lib/uploadToCloudinary";
import { db } from "@/src";
import { assets } from "@/src/db/schema";
import { eq, and, like } from "drizzle-orm";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from "uuid";

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

  if (!userId) {
    throw new Error("Unauthorized: Kamu harus login untuk upload aset.");
  }

  const file = formData.get("file") as File | null;
  const thumbFile = formData.get("thumbnail") as File | null;
  const providedName = formData.get("name") as string | null; // <-- Tangkap nama dari frontend

  if (!file) {
    return { error: "File aset wajib diisi" };
  }

  if (!file.name.toLowerCase().endsWith(".glb")) {
    return { error: "Hanya format .glb yang diizinkan" };
  }

  try {
    // --- PENENTUAN BASE NAME ---
    // Jika frontend mengirim nama dan tidak kosong, gunakan itu.
    // Jika tidak ada, gunakan nama file (tanpa .glb).
    let baseName = "";
    if (providedName && providedName.trim() !== "") {
      baseName = providedName.trim();
    } else {
      baseName = file.name.replace(/\.glb$/i, "").trim();
    }

    // --- CEK DUPLIKAT DI DATABASE ---
    const existingAssets = await db
      .select({ name: assets.name })
      .from(assets)
      .where(and(eq(assets.userId, userId), like(assets.name, `${baseName}%`)));

    const existingNames = new Set(existingAssets.map((a) => a.name));

    let finalName = baseName;
    let counter = 2;

    // Tambahkan -2, -3 dst jika nama sudah dipakai
    while (existingNames.has(finalName)) {
      finalName = `${baseName}-${counter}`;
      counter++;
    }

    // --- PROSES UPLOAD ---
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let thumbnailUrl = null;
    const thumbBuffer = Buffer.from(await thumbFile!.arrayBuffer());
    const cloudinaryResponse = await uploadToCloudinary(thumbBuffer, {
      folder: "3d-thumbnails",
      public_id: `thumb-${Date.now()}`,
      format: "webp",
    });
    thumbnailUrl = cloudinaryResponse.secure_url;

    const fileExtension = file.name.split(".").pop();
    const uniqueFileName = `${uuidv4()}.${fileExtension}`;

    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: uniqueFileName,
        Body: buffer,
        ContentType: "model/gltf-binary",
      }),
    );

    const publicUrl = `${process.env.R2_PUBLIC_URL}/${uniqueFileName}`;

    await db.insert(assets).values({
      id: uuidv4(),
      name: finalName, // <-- finalName yang sudah disesuaikan
      url: publicUrl,
      fileSize: file.size,
      userId: userId,
      thumbnailUrl: thumbnailUrl,
    });

    revalidatePath("/dashboard/assets");

    return { success: true, url: publicUrl, name: finalName };
  } catch (error) {
    console.error("Upload Error:", error);
    return { error: "Terjadi kesalahan saat upload ke server" };
  }
}
