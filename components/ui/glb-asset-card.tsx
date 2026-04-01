"use client";

import {
  Box,
  MoreVertical,
  Download,
  Eye,
  Copy,
  Trash2,
  FileBox,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

interface GLBAsset {
  id: string;
  name: string;
  url: string;
  thumbnailUrl?: string;
  fileSize?: string;
  createdAt: string;
}

interface GLBAssetCardProps {
  asset: GLBAsset;
  view?: "grid" | "list";
  onPreview?: (asset: GLBAsset) => void;
}

export function GLBAssetCard({
  asset,
  view = "grid",
  onPreview,
}: GLBAssetCardProps) {
  const queryClient = useQueryClient();

  const { mutate: deleteAsset, isPending: isDeleting } = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/assets/${asset.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      toast.success("Asset deleted");
      queryClient.invalidateQueries({ queryKey: ["getAssetLists"] });
    },
    onError: () => toast.error("Failed to delete asset"),
  });

  const handleCopyUrl = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(asset.url);
    toast.success("URL copied to clipboard");
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const a = document.createElement("a");
    a.href = `/api/proxy?url=${encodeURIComponent(asset.url)}`;
    a.download = `${asset.name}.glb`;
    a.click();
  };

  const handlePreview = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPreview?.(asset);
  };

  const formattedDate = new Date(asset.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const dropdown = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handlePreview}>
          <Eye className="size-3.5 mr-2" /> Preview
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDownload}>
          <Download className="size-3.5 mr-2" /> Download
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopyUrl}>
          <Copy className="size-3.5 mr-2" /> Copy URL
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            deleteAsset();
          }}
          disabled={isDeleting}
        >
          <Trash2 className="size-3.5 mr-2" />
          {isDeleting ? "Deleting..." : "Delete"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  // ── List View ──────────────────────────────────────────────────────────────
  if (view === "list") {
    return (
      <Card className="flex flex-row items-center gap-3 p-3 hover:bg-muted/40 transition-colors group">
        {/* Thumbnail */}
        <div className="size-12 rounded-lg bg-slate-900 flex items-center justify-center shrink-0 overflow-hidden">
          {asset.thumbnailUrl ? (
            <img
              src={asset.thumbnailUrl}
              alt={asset.name}
              className="object-contain w-full h-full p-1"
            />
          ) : (
            <FileBox className="size-5 text-slate-400" />
          )}
        </div>

        {/* Name + meta */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{asset.name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
              GLB
            </Badge>
            {asset.fileSize && (
              <span className="text-xs text-muted-foreground">
                {asset.fileSize}
              </span>
            )}
            <span className="text-xs text-muted-foreground">
              {formattedDate}
            </span>
          </div>
        </div>

        {/* Action buttons — visible on hover */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={handlePreview}
            title="Preview"
          >
            <Eye className="size-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={handleDownload}
            title="Download"
          >
            <Download className="size-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={handleCopyUrl}
            title="Copy URL"
          >
            <Copy className="size-4" />
          </Button>
        </div>

        {dropdown}
      </Card>
    );
  }

  // ── Grid View ──────────────────────────────────────────────────────────────
  return (
    <Card className="group overflow-hidden p-0 gap-0">
      <div className="aspect-square bg-slate-900 flex items-center justify-center relative">
        <Badge className="absolute top-2 left-2 z-10 bg-blue-600 hover:bg-blue-600 text-[10px]">
          GLB
        </Badge>

        {asset.thumbnailUrl ? (
          <img
            src={asset.thumbnailUrl}
            alt={asset.name}
            className="object-contain w-full h-full p-4"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-slate-400">
            <Box className="size-12 animate-pulse" />
            <span className="text-[10px] uppercase tracking-widest">
              3D Model
            </span>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            className="h-8 gap-1.5"
            onClick={handlePreview}
          >
            <Eye className="size-3.5" /> Preview
          </Button>
          <Button
            size="sm"
            variant="default"
            className="h-8 gap-1.5"
            onClick={handleDownload}
          >
            <Download className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* Footer */}
      <div className="px-3 py-2.5 flex justify-between items-center gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{asset.name}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {formattedDate}
          </p>
        </div>
        {dropdown}
      </div>
    </Card>
  );
}
