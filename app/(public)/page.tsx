"use client";

import R3FViewer from "@/components/3d/R3FViewer";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  ArrowRight,
  Upload,
  Sliders,
  Code,
  Zap,
  ShoppingBag,
  Palette,
  Megaphone,
  Box,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-white to-sky-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950" />

        <div className="relative max-w-7xl mx-auto px-4 py-24 md:py-32">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left: Copy */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-100/70 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 text-xs font-medium">
                <Zap className="w-3 h-3" />
                Embed 3D models in seconds
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
                Turn your{" "}
                <span className="bg-gradient-to-r from-violet-600 to-sky-500 bg-clip-text text-transparent">
                  3D models
                </span>{" "}
                into embeddable widgets
              </h1>
              <p className="text-lg text-muted-foreground max-w-md">
                Upload .glb files, customize the viewer with lighting, rotation
                & environments — then copy a single{" "}
                <code className="px-1.5 py-0.5 bg-muted rounded text-sm font-mono">
                  &lt;iframe&gt;
                </code>{" "}
                to embed anywhere.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Button size="lg" asChild className="gap-2">
                  <Link href="/sign-up">
                    Get Started Free
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="#how-it-works">See How It Works</Link>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Free tier • 3 projects • No credit card required
              </p>
            </div>

            {/* Right: Live 3D Demo */}
            <div className="relative">
              <div className="aspect-square max-w-lg mx-auto rounded-3xl overflow-hidden ring-1 ring-border/10 shadow-2xl shadow-violet-500/10 dark:shadow-violet-900/10 bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-800 dark:to-zinc-900">
                <R3FViewer
                  url="/demo.glb"
                  config={{
                    intensity: 0.6,
                    autoRotate: true,
                    environment: "city",
                  }}
                />
              </div>
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-background ring-1 ring-border/20 shadow-lg text-xs font-medium text-muted-foreground">
                Interactive 3D viewer — drag to rotate
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section
        id="how-it-works"
        className="py-24 bg-gradient-to-b from-transparent to-zinc-50/30 dark:to-zinc-900/20"
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight">How It Works</h2>
            <p className="text-muted-foreground mt-3 max-w-lg mx-auto">
              Three simple steps from .glb file to embedded 3D viewer on your
              website.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                icon: <Upload className="w-6 h-6" />,
                title: "Upload",
                description:
                  "Drag & drop your .glb 3D model file. We support files up to 50MB.",
                color: "from-violet-500 to-violet-600",
              },
              {
                step: "02",
                icon: <Sliders className="w-6 h-6" />,
                title: "Customize",
                description:
                  "Adjust lighting, background, environment, and rotation in the live editor.",
                color: "from-sky-500 to-sky-600",
              },
              {
                step: "03",
                icon: <Code className="w-6 h-6" />,
                title: "Embed",
                description:
                  "Copy the iframe code and paste it into any website, blog, or app.",
                color: "from-emerald-500 to-emerald-600",
              },
            ].map((item) => (
              <div key={item.step} className="relative group">
                <div className="bg-muted/20 rounded-3xl p-8 h-full shadow-sm hover:shadow-md transition-shadow">
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white mb-5`}
                  >
                    {item.icon}
                  </div>
                  <div className="text-xs font-mono text-muted-foreground mb-2">
                    Step {item.step}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight">
              Built for wherever you need 3D
            </h2>
            <p className="text-muted-foreground mt-3 max-w-lg mx-auto">
              From product pages to creative portfolios — if you have a .glb
              file, Vur3D gets it embedded.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <ShoppingBag className="w-6 h-6" />,
                title: "E-Commerce",
                description:
                  "Embed interactive product viewers on your Shopify, WooCommerce, or custom storefronts. Let customers rotate, zoom, and inspect before buying.",
              },
              {
                icon: <Palette className="w-6 h-6" />,
                title: "3D Portfolios",
                description:
                  "Showcase your 3D work with embeddable viewers. Clients can orbit your models directly — no downloads, no Sketchfab links.",
              },
              {
                icon: <Megaphone className="w-6 h-6" />,
                title: "Marketing & Landing Pages",
                description:
                  "Make your landing pages stand out. Drop an interactive 3D model into any Webflow, Framer, or WordPress page with a single iframe.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-muted/20 rounded-3xl p-8 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 rounded-xl bg-violet-100/50 dark:bg-violet-900/20 flex items-center justify-center text-violet-600 dark:text-violet-400 mb-5">
                  {item.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Embed Preview */}
      <section className="py-24 bg-gradient-to-b from-transparent to-zinc-50/30 dark:to-zinc-900/20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight">
              One line of code. Live on your site.
            </h2>
            <p className="text-muted-foreground mt-3">
              Here&apos;s what your customers see — an interactive 3D viewer
              embedded right on your product page.
            </p>
          </div>

          {/* Mock Product Page */}
          <div className="max-w-3xl mx-auto rounded-3xl overflow-hidden ring-1 ring-border/10 shadow-2xl bg-background">
            {/* Fake Navbar */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-border/30 bg-muted/20">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-violet-500" />
                <span className="text-xs font-semibold">Acme Store</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>Shop</span>
                <span>About</span>
                <span>Contact</span>
              </div>
            </div>

            {/* Product Content */}
            <div className="grid md:grid-cols-2">
              {/* 3D Viewer */}
              <div className="aspect-square bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-800 dark:to-zinc-900">
                <R3FViewer
                  url="/sofa_chair.glb"
                  config={{
                    intensity: 0.6,
                    autoRotate: true,
                    environment: "city",
                  }}
                />
              </div>

              {/* Product Details */}
              <div className="p-6 flex flex-col justify-center space-y-4">
                <div className="text-xs font-medium text-violet-600 dark:text-violet-400">
                  NEW ARRIVAL
                </div>
                <h3 className="text-xl font-bold">Your Product Name</h3>
                <div className="text-2xl font-bold">$299.00</div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  This is your product description. The 3D viewer on the left is
                  embedded using a single iframe — your customers can orbit,
                  zoom, and inspect the product before buying.
                </p>
                <Button className="w-full">Add to Cart</Button>
                <p className="text-[10px] text-muted-foreground text-center">
                  Powered by Vur3D — embedded in one line of code
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 max-w-lg mx-auto">
            <div className="bg-zinc-950 text-zinc-300 rounded-xl p-4 font-mono text-xs ring-1 ring-zinc-800">
              <code>
                <span className="text-sky-400">&lt;iframe</span>
                <span className="text-violet-400"> src</span>
                <span className="text-zinc-500">=</span>
                <span className="text-emerald-400">
                  &quot;https://vur3d.app/v/your-model-id&quot;
                </span>
                <span className="text-violet-400"> width</span>
                <span className="text-zinc-500">=</span>
                <span className="text-emerald-400">&quot;100%&quot;</span>
                <span className="text-violet-400"> height</span>
                <span className="text-zinc-500">=</span>
                <span className="text-emerald-400">&quot;500&quot;</span>
                <span className="text-sky-400">&gt;&lt;/iframe&gt;</span>
              </code>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24">
        <div className="max-w-2xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight">
              Frequently asked questions
            </h2>
            <p className="text-muted-foreground mt-3">
              Everything you need to know before getting started.
            </p>
          </div>
          <div className="space-y-2">
            {[
              {
                q: "What file formats are supported?",
                a: "We support .glb files — the standard format for 3D models on the web. Export from Blender, Cinema 4D, Maya, or any 3D tool that outputs glTF binary.",
              },
              {
                q: "Is there a file size limit?",
                a: "Free tier supports files up to 50MB — plenty for high-quality product models, architectural scenes, and game assets. Paid plans will offer higher limits.",
              },
              {
                q: "Can I embed on my own website?",
                a: "Absolutely. After creating your project, whitelist your domain and copy the iframe code. Paste it anywhere — Shopify, WordPress, Webflow, or custom HTML.",
              },
              {
                q: "Is it really free?",
                a: "Yes — 3 projects, no credit card required. We're in beta. Paid plans are coming, but early adopters will get grandfathered benefits.",
              },
              {
                q: "Will embeds slow down my website?",
                a: "No. Models are hosted on Cloudflare's global CDN, lazy-loaded only when the viewer scrolls into view, and optimized for mobile.",
              },
            ].map((item) => (
              <details
                key={item.q}
                className="group rounded-2xl bg-muted/30 data-[open]:bg-muted/50 transition-colors"
              >
                <summary className="flex items-center justify-between cursor-pointer px-5 py-4 text-sm font-medium list-none">
                  {item.q}
                  <svg
                    className="w-4 h-4 text-muted-foreground transition-transform group-open:rotate-180 flex-shrink-0 ml-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                    />
                  </svg>
                </summary>
                <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed">
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 relative">
          {/* Glow effect behind the card */}
          <div
            className="absolute inset-0 -z-10 blur-3xl opacity-20 bg-violet-500 rounded-full"
            aria-hidden="true"
          />

          <div className="rounded-3xl bg-zinc-950 text-white shadow-2xl shadow-violet-500/10 overflow-hidden">
            <div className="px-8 py-14 md:py-20 text-center space-y-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-violet-500/20">
                <Box className="w-6 h-6 text-violet-400" />
              </div>

              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                Ship interactive 3D today
              </h2>
              <p className="text-zinc-400 text-lg max-w-md mx-auto">
                Free tier — 5 projects. No credit card required. Set up your
                first embed in under a minute.
              </p>

              <div className="flex flex-wrap justify-center gap-3 pt-2">
                <Button
                  size="lg"
                  asChild
                  className="gap-2 bg-violet-600 hover:bg-violet-500 text-white"
                >
                  <Link href="/sign-up">
                    Get Started Free
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="gap-2 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                >
                  <Link href="/sign-in">Sign In</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8 bg-background">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            {new Date().getFullYear()} Vur3D. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link
              href="/privacy"
              className="hover:text-foreground transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="hover:text-foreground transition-colors"
            >
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
