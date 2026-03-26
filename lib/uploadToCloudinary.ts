// server/utils/cloudinary.ts
import {
  v2 as cloudinary,
  UploadApiOptions,
  type UploadApiResponse,
} from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadToCloudinary = (
  buffer: Buffer,
  options: UploadApiOptions = {},
): Promise<UploadApiResponse> => {
  return new Promise((resolve, reject) => {
    // Pastikan konfigurasi cloudinary sudah di-set (biasanya di plugins atau di sini langsung)
    cloudinary.uploader
      .upload_stream(
        {
          resource_type: "auto", // Otomatis deteksi gambar/raw/video
          ...options,
        },
        (error, result) => {
          if (error || !result) return reject(error);
          resolve(result);
        },
      )
      .end(buffer);
  });
};
