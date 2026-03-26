"use client";

import { useState } from "react";
import R3FViewer from "@/components/3d/R3FViewer";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Package, Code, Layers3 } from "lucide-react";
import { Button } from "@/components/ui/button";

// --- MOCK DATA FOR AHA MOMENT ---
const MOCK_PROJECT = {
  name: "Prototype Alpha Model",
  // A publicly accessible free GLB model for testing
  glbUrl: "TV.glb",
};

export default function AHA_MomentPage() {
  // Live State - The " lem" that connects UI to 3D
  const [intensity, setIntensity] = useState([0.6]); // stage intensity
  const [autoRotate, setAutoRotate] = useState(true);
  const [environment, setEnvironment] = useState<"city" | "studio" | "lobby">(
    "city",
  );
  const [bgColor, setBgColor] = useState("#fafafa"); // zinc-50

  const sceneConfig = {
    intensity: intensity[0],
    autoRotate: autoRotate,
    environment: environment,
  };

  return (
    <SidebarProvider>
      <div className="flex w-full h-[calc(100vh-65px)] overflow-hidden">
        {/* Main 3D Canvas Area */}
        <div
          className="flex-1 h-full relative border-r"
          style={{ backgroundColor: bgColor }}
        >
          <R3FViewer url={MOCK_PROJECT.glbUrl} config={sceneConfig} />
          <SidebarTrigger className="absolute top-4 right-4 bg-white/80 backdrop-blur shadow" />
        </div>

        {/* Right Editor Sidebar */}
        <Sidebar
          side="right"
          collapsible="none"
          className="w-[300px] flex-shrink-0"
        >
          <SidebarHeader className="border-b h-16 flex items-center px-6">
            <div className="flex items-center gap-3">
              <Package className="w-5 h-5 text-zinc-500" />
              <div className="flex flex-col">
                <h1 className="text-sm font-semibold tracking-tight truncate">
                  {MOCK_PROJECT.name}
                </h1>
                <p className="text-xs text-muted-foreground">Editor</p>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="p-6 space-y-6">
            {/* Viewer Settings Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Layers3 className="w-4 h-4 text-zinc-500" />
                <h2 className="text-sm font-medium">Viewer Configuration</h2>
              </div>
              <Separator />

              {/* Background Color */}
              <div className="space-y-2">
                <Label htmlFor="bgColor">Background Color</Label>
                <div className="flex gap-2">
                  <div
                    className="w-10 h-10 rounded border"
                    style={{ backgroundColor: bgColor }}
                  />
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-full h-10 border rounded bg-background px-1 cursor-pointer"
                  />
                </div>
              </div>

              {/* Light Intensity */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Lighting Intensity</Label>
                  <span className="text-xs font-mono text-muted-foreground">
                    {intensity[0].toFixed(1)}
                  </span>
                </div>
                <Slider
                  value={intensity}
                  onValueChange={setIntensity}
                  max={2}
                  step={0.1}
                  className="pt-2"
                />
              </div>

              {/* Auto Rotate Toggle */}
              <div className="flex items-center justify-between border rounded-lg p-3 pt-4">
                <div className="space-y-0.5">
                  <Label htmlFor="autoRotate">Auto-Rotate</Label>
                  <p className="text-xs text-muted-foreground">
                    Enable continuous spinning.
                  </p>
                </div>
                <Switch
                  id="autoRotate"
                  checked={autoRotate}
                  onCheckedChange={setAutoRotate}
                />
              </div>
            </div>

            {/* Embed Section */}
            <div className="space-y-4 pt-4">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-zinc-500" />
                <h2 className="text-sm font-medium">Embed Code</h2>
              </div>
              <Separator />
              <div className="bg-zinc-100 p-3 rounded-md border text-xs font-mono break-all text-zinc-700">
                &lt;iframe src="/v/mock-id" width="100%" height="500px" /&gt;
              </div>
              <Button className="w-full" variant="secondary">
                Copy Embed Code
              </Button>
            </div>
          </SidebarContent>
        </Sidebar>
      </div>
    </SidebarProvider>
  );
}
