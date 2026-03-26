import type { Metadata } from "next";
import { UserButton, Show } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Vur3D - Embed 3D Models easily",
  description: "Micro-SaaS to embed 3D GLB models into your website",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <header className="fixed top-0 w-full z-50 border-b bg-background/80 backdrop-blur-md border-border">
        <div className="flex justify-between items-center max-w-7xl mx-auto px-4 h-16">
          <h1 className="text-xl font-bold tracking-tight">Vur3D</h1>

          <nav className="flex items-center gap-3">
            {/* JIKA BELUM LOGIN */}
            <Show when={"signed-out"}>
              <Button variant="secondary" asChild>
                <Link href={"/sign-in"}>Sign In</Link>
              </Button>
              <Button variant="default" asChild>
                <Link href={"/sign-up"}>Get Started</Link>
              </Button>
            </Show>

            {/* JIKA SUDAH LOGIN */}
            <Show when={"signed-in"}>
              <div className="flex items-center gap-4">
                <Button variant={"default"}>
                  <Link href={"/dashboard"}>Dashboard</Link>
                </Button>

                <UserButton afterSwitchSessionUrl="/" />
              </div>
            </Show>
          </nav>
        </div>
      </header>
      {/* MAIN FIX: pt-16 agar tidak tertutup header */}
      <main className="pt-16 min-h-screen">
        {/* HEADER FIX: z-50 dan flex-center items */}
        {children}
      </main>
    </>
  );
}
