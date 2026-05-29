"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GLBViewer } from "@/components/ui/glb-viewer";
import { GLBAssetCard } from "@/components/ui/glb-asset-card";
import {
  Library,
  Plus,
  Search,
  PackageOpen,
  Download,
  Copy,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateAssetDialog } from "@/components/ui/model-create-assets";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";
import { formatBytes } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Asset {
  id: string;
  name: string;
  url: string;
  thumbnailUrl?: string;
  fileSize?: number;
  createdAt: string;
}

interface PaginatedResponse {
  data: Asset[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function AssetGridSkeleton({ view }: { view: "grid" | "list" }) {
  return (
    <div
      className={cn(
        view === "grid"
          ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
          : "flex flex-col gap-3",
      )}
    >
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "bg-card rounded-xl overflow-hidden shadow-sm border border-border/50",
            view === "list" ? "flex items-center p-3 gap-4" : "",
          )}
        >
          <Skeleton
            className={cn(
              view === "grid"
                ? "aspect-[4/3] w-full rounded-none"
                : "h-16 w-16 shrink-0 rounded-md",
            )}
          />
          <div
            className={cn("p-3 space-y-2", view === "list" ? "flex-1 p-0" : "")}
          >
            <Skeleton className="h-4 w-3/4" />
            <div className="flex gap-2">
              <Skeleton className="h-3 w-10" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ onUpload }: { onUpload: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
      <div className="p-5 bg-muted rounded-full">
        <PackageOpen className="size-10 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <p className="font-semibold text-base">No assets yet</p>
        <p className="text-sm text-muted-foreground max-w-xs">
          Upload your first .glb model to start building your 3D asset library.
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
  asset: Asset | null;
  onClose: () => void;
}) {
  const handleDownload = () => {
    if (!asset) return;
    const a = document.createElement("a");
    a.href = asset.url;
    a.download = `${asset.name}.glb`;
    a.click();
  };

  const handleCopyUrl = () => {
    if (!asset) return;
    navigator.clipboard.writeText(asset.url).then(
      () => toast.success("URL copied to clipboard"),
      () => toast.error("Clipboard access denied"),
    );
  };

  return (
    <Dialog open={!!asset} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-start justify-between pr-6">
            <div className="space-y-1">
              <DialogTitle className="text-lg">{asset?.name}</DialogTitle>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-[10px]">
                  GLB
                </Badge>
                {asset?.fileSize != null && (
                  <span className="text-xs text-muted-foreground">
                    {formatBytes(asset.fileSize)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        {asset && (
          <div className="space-y-4">
            <div className="bg-muted/30 rounded-lg overflow-hidden border">
              <GLBViewer url={asset.url} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Drag to rotate · Scroll to zoom
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 h-8"
                  onClick={handleCopyUrl}
                >
                  <Copy className="size-3.5" /> Copy URL
                </Button>
                <Button
                  size="sm"
                  className="gap-1.5 h-8"
                  onClick={handleDownload}
                >
                  <Download className="size-3.5" /> Download
                </Button>
              </div>
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
  const [view, setView] = useState<"grid" | "list">("grid");
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  // States untuk Pagination
  const [page, setPage] = useState(1);
  const limit = 12; // Jumlah item per halaman

  // Gunakan debounce agar API tidak dipanggil setiap huruf diketik
  const debouncedSearch = useDebounce(search, 400);

  // Jika search bar di-clear atau diketik, reset halaman ke 1
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const {
    data,
    isError,
    isLoading,
    isFetching, // isFetching menangkap loading state saat ganti halaman / search
  } = useQuery<PaginatedResponse>({
    // QueryKey menyertakan debouncedSearch dan page agar otomatis re-fetch saat berubah
    queryKey: ["getAssetLists", debouncedSearch, page],
    queryFn: async () => {
      const res = await fetch(
        `/api/assets?q=${debouncedSearch}&page=${page}&limit=${limit}`,
      );
      if (!res.ok) throw new Error("Failed to fetch assets");
      return res.json();
    },
    // Keep previous data agar UI tidak nge-blink (kosong) saat pindah halaman
    placeholderData: (previousData) => previousData,
  });

  const assets = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div className="p-6 space-y-6 ">
      <CreateAssetDialog open={isUploadOpen} onOpenChange={setIsUploadOpen} />
      <PreviewDialog
        asset={selectedAsset}
        onClose={() => setSelectedAsset(null)}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Library className="size-6 text-primary" />
            Asset Library
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage and preview your 3D GLB models.
          </p>
        </div>

        <Button
          className="gap-2 shadow-sm shrink-0"
          onClick={() => setIsUploadOpen(true)}
        >
          <Plus className="size-4" />
          <span>Upload Model</span>
        </Button>
      </div>

      <Separator />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search models..."
            className="pl-9 pr-9 bg-muted/20"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {isFetching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-3.5 animate-spin text-muted-foreground" />
          )}
        </div>

        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
          {/* Asset count */}
          {pagination && (
            <span className="text-xs font-medium text-muted-foreground">
              {pagination.total} model{pagination.total !== 1 ? "s" : ""}
            </span>
          )}

          {/* View toggle */}
          <div className="flex items-center border rounded-md overflow-hidden bg-background">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8 rounded-none",
                view === "grid" && "bg-muted",
              )}
              onClick={() => setView("grid")}
            >
              <LayoutGrid className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8 rounded-none",
                view === "list" && "bg-muted",
              )}
              onClick={() => setView("list")}
            >
              <List className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      {isLoading ? (
        <AssetGridSkeleton view={view} />
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 bg-destructive/5 rounded-xl border border-destructive/20">
          <p className="text-sm text-destructive font-medium">
            Failed to load assets
          </p>
          <p className="text-xs text-muted-foreground">
            Please check your connection and try again.
          </p>
        </div>
      ) : assets.length === 0 ? (
        debouncedSearch ? (
          <div className="flex flex-col items-center justify-center py-24 gap-2 border rounded-xl bg-muted/10">
            <p className="text-sm font-medium">
              No results for "{debouncedSearch}"
            </p>
            <p className="text-xs text-muted-foreground">
              Try a different keyword.
            </p>
            <Button variant="link" size="sm" onClick={() => setSearch("")}>
              Clear search
            </Button>
          </div>
        ) : (
          <EmptyState onUpload={() => setIsUploadOpen(true)} />
        )
      ) : (
        <div className="space-y-6">
          <div
            className={cn(
              view === "grid"
                ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
                : "flex flex-col gap-3",
            )}
          >
            {assets.map((asset) => (
              <GLBAssetCard
                key={asset.id}
                asset={asset}
                view={view}
                onPreview={(a) => setSelectedAsset(a)}
              />
            ))}
          </div>

          {/* Pagination Controls */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t">
              <p className="text-xs text-muted-foreground font-medium">
                Page {pagination.page} of {pagination.totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1"
                  disabled={pagination.page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="size-3.5" /> Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1"
                  disabled={!pagination.hasNextPage}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next <ChevronRight className="size-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
