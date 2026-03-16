import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/", // Landing page
  "/sign-in(.*)", // Halaman login
  "/sign-up(.*)", // Halaman daftar
  "/v/(.*)", // PENTING: Public 3D Viewer (agar bisa di-embed)
  "/api/webhook(.*)", // Jika nanti butuh webhook untuk Stripe/Clerk
]);

export default clerkMiddleware(async (auth, req) => {
  // Jika rute TIDAK publik, maka proteksi/wajibkan login
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Melindungi semua route kecuali file statis (gambar, css, js, dll)
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Selalu jalankan untuk API routes
    "/(api|trpc)(.*)",
  ],
};
