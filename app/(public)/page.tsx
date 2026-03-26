"use client";

import R3FViewer from "@/components/3d/R3FViewer";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Upload, Sliders, Code, Zap } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-white to-sky-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-violet-200/30 via-transparent to-transparent dark:from-violet-900/20" />

        <div className="relative max-w-7xl mx-auto px-4 py-24 md:py-32">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left: Copy */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-xs font-medium">
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
                Free tier • 5 projects • No credit card required
              </p>
            </div>

            {/* Right: Live 3D Demo */}
            <div className="relative">
              <div className="aspect-square max-w-lg mx-auto rounded-2xl overflow-hidden border shadow-2xl shadow-violet-200/30 dark:shadow-violet-900/20 bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-800 dark:to-zinc-900">
                <R3FViewer
                  url="/TV.glb"
                  config={{
                    intensity: 0.6,
                    autoRotate: true,
                    environment: "city",
                  }}
                />
              </div>
              {/* Floating badge */}
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-background border shadow-lg text-xs font-medium text-muted-foreground">
                ↑ Interactive 3D viewer — drag to rotate
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section
        id="how-it-works"
        className="py-24 bg-zinc-50/50 dark:bg-zinc-900/50 border-t"
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
                <div className="bg-background border rounded-2xl p-8 h-full transition-all hover:shadow-lg hover:-translate-y-1">
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

      {/* Embed Preview */}
      <section className="py-24 border-t">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight">
              One line of code. Infinite possibilities.
            </h2>
            <p className="text-muted-foreground mt-3">
              Your embed code is as simple as this:
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <div className="bg-zinc-950 text-zinc-300 rounded-xl p-6 font-mono text-sm border border-zinc-800 shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-xs text-zinc-500 ml-2">embed.html</span>
              </div>
              <code>
                <span className="text-sky-400">&lt;iframe</span>
                <br />
                {"  "}
                <span className="text-violet-400">src</span>
                <span className="text-zinc-500">=</span>
                <span className="text-emerald-400">
                  &quot;https://vur3d.app/v/your-model-id&quot;
                </span>
                <br />
                {"  "}
                <span className="text-violet-400">width</span>
                <span className="text-zinc-500">=</span>
                <span className="text-emerald-400">&quot;100%&quot;</span>
                <br />
                {"  "}
                <span className="text-violet-400">height</span>
                <span className="text-zinc-500">=</span>
                <span className="text-emerald-400">&quot;500&quot;</span>
                <br />
                {"  "}
                <span className="text-violet-400">frameborder</span>
                <span className="text-zinc-500">=</span>
                <span className="text-emerald-400">&quot;0&quot;</span>
                <br />
                <span className="text-sky-400">&gt;&lt;/iframe&gt;</span>
              </code>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-br from-violet-600 to-sky-500 text-white">
        <div className="max-w-3xl mx-auto px-4 text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Ready to embed your 3D models?
          </h2>
          <p className="text-violet-100 text-lg max-w-lg mx-auto">
            Start free with up to 5 projects. No credit card required.
          </p>
          <Button
            size="lg"
            variant="secondary"
            asChild
            className="gap-2 text-violet-700"
          >
            <Link href="/sign-up">
              Get Started Free
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 bg-background">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Vur3D. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link href="#" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link href="#" className="hover:text-foreground transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
