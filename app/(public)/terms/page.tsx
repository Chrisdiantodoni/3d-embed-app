import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service — Vur3D",
};

export default function TermsPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-24 space-y-8">
      <Button variant="ghost" size="sm" asChild className="gap-1.5 -ml-2">
        <Link href="/">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
      </Button>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Last updated: May 2026
        </p>
      </div>

      <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">
        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">
            1. Acceptance of Terms
          </h2>
          <p>
            By using Vur3D, you agree to these terms. If you do not agree, do
            not use the service.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">
            2. Service Description
          </h2>
          <p>
            Vur3D provides a platform to upload .glb 3D models and generate
            embeddable iframe viewers. The service is currently in beta and
            offered free of charge for up to 3 projects.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">
            3. User Responsibilities
          </h2>
          <p>
            You are responsible for the content you upload. You must own the
            rights to any 3D models you upload and must not upload content that
            is illegal, harmful, or infringes on others&apos; intellectual
            property.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">
            4. Intellectual Property
          </h2>
          <p>
            You retain all rights to your uploaded 3D models. Vur3D does not
            claim ownership over your content. You grant us a limited license to
            host and serve your models solely for the purpose of providing the
            embedding service.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">
            5. Service Availability
          </h2>
          <p>
            We strive for high uptime but do not guarantee uninterrupted access.
            The service may be temporarily unavailable for maintenance or due to
            factors beyond our control.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">
            6. Limitation of Liability
          </h2>
          <p>
            Vur3D is provided &quot;as is&quot; without warranties. We are not
            liable for any damages arising from your use of the service,
            including data loss or service interruptions.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">
            7. Changes to Terms
          </h2>
          <p>
            We may update these terms at any time. Continued use of the service
            after changes constitutes acceptance of the new terms.
          </p>
        </section>
      </div>
    </div>
  );
}
