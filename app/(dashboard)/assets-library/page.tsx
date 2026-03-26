"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GLBViewer } from "@/components/ui/glb-viewer";
import { GLBAssetCard } from "@/components/ui/glb-asset-card";
import { Clock, Library, Plus, Search, PackageOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateAssetDialog } from "@/components/ui/model-create-assets";
import { useQuery } from "@tanstack/react-query";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Asset {
  id: string;
  name: string;
  url: string;
  createdAt: string;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function AssetGridSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="aspect-square rounded-xl" />
      ))}
    </div>
  );
}

function EmptyState({ onUpload }: { onUpload: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
      <div className="p-4 bg-muted rounded-full">
        <PackageOpen className="size-8 text-muted-foreground" />
      </div>
      <div>
        <p className="font-medium">No assets yet</p>
        <p className="text-sm text-muted-foreground mt-1">
          Upload your first .glb model to get started.
        </p>
      </div>
      <Button onClick={onUpload} className="gap-2 mt-2">
        <Plus className="size-4" />
        Upload Model
      </Button>
    </div>
  );
}

function PreviewDialog({
  asset,
  onClose,
}: {
  asset: { url: string; name: string } | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={!!asset} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{asset?.name}</DialogTitle>
        </DialogHeader>
        {asset && (
          <div className="space-y-3">
            <GLBViewer url={asset.url} />
            <div className="flex justify-between text-xs text-muted-foreground">
              <p>Use Mouse to Rotate • Scroll to Zoom</p>
              <p>Format: GLB (Binary)</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AssetLibrary() {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  const {
    data: assets = [],
    isLoading,
    isError,
  } = useQuery<Asset[]>({
    queryKey: ["getAssetLists"],
    queryFn: async () => {
      const res = await fetch("/api/assets");
      if (!res.ok) throw new Error("Failed to fetch assets");
      return res.json();
    },
  });

  const filtered = assets.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="p-6 space-y-8">
      <CreateAssetDialog open={isUploadOpen} onOpenChange={setIsUploadOpen} />
      <PreviewDialog
        asset={selectedAsset}
        onClose={() => setSelectedAsset(null)}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Library className="size-6 text-primary" />
            Asset Library
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage and preview your 3D GLB models for your projects.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search models..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button
            className="gap-2 shadow-md shrink-0"
            onClick={() => setIsUploadOpen(true)}
          >
            <Plus className="size-4" />
            <span className="hidden sm:inline">Upload Model</span>
          </Button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <AssetGridSkeleton />
      ) : isError ? (
        <p className="text-sm text-destructive text-center py-12">
          Failed to load assets. Please try again.
        </p>
      ) : filtered.length === 0 ? (
        <EmptyState onUpload={() => setIsUploadOpen(true)} />
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            {filtered.length} model{filtered.length !== 1 ? "s" : ""} found
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {filtered.map((asset) => (
              <div
                key={asset.id}
                onClick={() => setSelectedAsset(asset)}
                className="cursor-pointer"
              >
                <GLBAssetCard asset={asset} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
