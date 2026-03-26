import { Box, MoreVertical, Download, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { formatBytes } from "@/lib/utils";

interface GLBAsset {
  id: string;
  name: string;
  fileSize: string;
  thumbnail?: string;
  lastModified: string;
}

export function GLBAssetCard({ asset }: { asset: GLBAsset }) {
  return (
    <Card className="group overflow-hidden p-0 gap-0">
      {/* Preview Area */}
      <div className="aspect-square bg-slate-900 flex items-center justify-center relative">
        <Badge className="absolute top-2 left-2 z-10 bg-blue-600 hover:bg-blue-600">
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

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <Button size="sm" variant="secondary" className="h-8 gap-1">
            <Eye className="size-3" /> Preview
          </Button>
          <Button size="sm" variant="default" className="h-8 gap-1">
            <Download className="size-3" />
          </Button>
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 flex justify-between items-center ">
        <div className="overflow-hidden">
          <p className="text-sm font-semibold truncate">{asset.name}</p>
          <p className="text-[10px] text-muted-foreground uppercase">
            {formatBytes(Number(asset.fileSize))} • {asset.lastModified}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Edit Metadata</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">
              Delete Model
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  );
}
