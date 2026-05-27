import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { Box, ArrowLeft } from "lucide-react";

export default function Page() {
  return (
    <div className="min-h-screen flex bg-gradient-to-br from-violet-50 via-white to-sky-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      {/* Back link */}
      <Link
        href="/"
        className="absolute top-6 left-6 text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 z-10"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to home
      </Link>

      {/* Left: Branding */}
      <div className="hidden lg:flex flex-1 flex-col justify-center px-12 lg:px-20 bg-muted/10">
        <div className="max-w-md space-y-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-violet-600">
              <Box className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">Vur3D</span>
          </Link>

          <div className="space-y-4">
            <h1 className="text-3xl font-bold tracking-tight leading-tight">
              Welcome back
            </h1>
            <p className="text-muted-foreground leading-relaxed">
              Sign in to manage your projects, update embed settings, and track
              viewer analytics.
            </p>
          </div>

          <p className="text-xs text-muted-foreground pt-4 border-t border-border/40">
            3 projects free — no credit card required.
          </p>
        </div>
      </div>

      {/* Right: Clerk SignIn */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        {/* Mobile logo */}
        <div className="lg:hidden mb-8 text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Box className="w-7 h-7 text-violet-600" />
            <span className="text-xl font-bold">Vur3D</span>
          </div>
          <p className="text-sm text-muted-foreground">Sign in to your account</p>
        </div>

        <SignIn
          appearance={{
            elements: {
              formButtonPrimary:
                "bg-violet-600 hover:bg-violet-500 text-sm text-white",
              card: "shadow-2xl border border-border/10 rounded-2xl bg-background",
              headerTitle: "text-lg font-semibold",
              headerSubtitle: "text-sm text-muted-foreground",
              socialButtonsBlockButton:
                "border border-border text-foreground hover:bg-muted text-sm rounded-lg",
              dividerLine: "bg-border",
              dividerText: "text-xs text-muted-foreground",
              formFieldLabel: "text-sm font-medium text-foreground",
              formFieldInput:
                "rounded-lg border-border bg-background text-sm",
              footerActionText: "text-sm text-muted-foreground",
              footerActionLink:
                "text-sm text-violet-600 hover:text-violet-500 font-medium",
            },
          }}
        />
      </div>
    </div>
  );
}
