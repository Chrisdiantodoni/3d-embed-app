import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy — Vur3D",
};

export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-24 space-y-8">
      <Button variant="ghost" size="sm" asChild className="gap-1.5 -ml-2">
        <Link href="/">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
      </Button>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Last updated: May 2026
        </p>
      </div>

      <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">
        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">
            1. Information We Collect
          </h2>
          <p>
            We collect information you provide directly: your name, email address,
            and uploaded 3D model files (.glb). We also collect usage analytics
            such as embed views and interactions to improve the service.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">
            2. How We Use Your Information
          </h2>
          <p>
            Your 3D models are used solely to provide the embedding service.
            Analytics data helps us improve performance and track usage. We do
            not sell, rent, or share your data with third parties.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">
            3. File Storage & Security
          </h2>
          <p>
            Uploaded .glb files are stored on Cloudflare R2 with encryption at
            rest. Thumbnails are stored on Cloudinary. Access to assets is
            controlled via cryptographic embed tokens and domain allowlists.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">
            4. Data Retention
          </h2>
          <p>
            We retain your data for as long as your account is active. You can
            delete projects and assets at any time from the dashboard. Deleted
            data is permanently removed within 30 days.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">
            5. Cookies
          </h2>
          <p>
            We use essential cookies for authentication (via Clerk) and session
            management. No advertising or tracking cookies are used.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">
            6. Contact
          </h2>
          <p>
            For privacy-related inquiries, contact us at
            privacy@vur3d.app.
          </p>
        </section>
      </div>
    </div>
  );
}
