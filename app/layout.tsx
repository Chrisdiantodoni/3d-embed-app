import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import {
  ClerkProvider,
  UserButton,
  SignInButton,
  SignUpButton,
  Show,
} from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import QueryProvider from "@/providers/query-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
    <ClerkProvider>
      <QueryProvider>
        <TooltipProvider>
          <html lang="en" suppressHydrationWarning>
            <body
              className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
            >
              <ThemeProvider
                attribute="class"
                defaultTheme="dark" // Ubah dari "system" ke "light"
                enableSystem={false} // Matikan deteksi otomatis dari OS/Browser
                disableTransitionOnChange
              >
                {children}
              </ThemeProvider>
            </body>
          </html>
        </TooltipProvider>
      </QueryProvider>
    </ClerkProvider>
  );
}
