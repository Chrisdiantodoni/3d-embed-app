/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../dialog";
import { Label } from "../label";
import { Input } from "../input";
import { Button } from "../button";
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Check,
  UploadCloud,
  Box,
  Image as ImageIcon,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../select";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";
import { GLBViewer } from "../glb-viewer";
import { createAssetAction } from "@/app/actions/assets";
import { useMutation } from "@tanstack/react-query";
import { createProjectAction } from "@/app/actions/projects";

// Definisikan tipe datanya
export interface ProjectPayload {
  name: string;
  thumbnailUrl: string | null;
  lightingSettings: string;
  description?: string | null;
  assets: {
    assetId: string;
    position: { x: number; y: number; z: number };
    rotation: { x: number; y: number; z: number };
    scale: { x: number; y: number; z: number };
  }[];
}

const CreateProjectModal = () => {
  // --- States ---
  const [name, setName] = useState("");
  const [environMent, setEnvironment] = useState("studio");
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);

  const toggleAssetSelection = (id: string) => {
    setSelectedAssetIds(
      (prev) =>
        prev.includes(id)
          ? prev.filter((assetId) => assetId !== id) // Hapus jika sudah ada
          : [...prev, id], // Tambah jika belum ada
    );
  };

  const [file, setFile] = useState<File | null>(null);

  const previewUrl = useMemo(
    () => (file ? URL.createObjectURL(file) : null),
    [file],
  );

  const [thumbnailBlob, setThumbnailBlob] = useState<Blob | null>(null);

  // --- Refs ---
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Logic ---
  const debouncedSearch = useDebounce(searchTerm, 400);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/assets?q=${debouncedSearch}&page=${page}&limit=6`,
      );
      const result = await res.json();
      setAssets(result.data || []);
      setTotalPages(result.pagination?.totalPages || 1);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchAssets();
  }, [debouncedSearch, page]);

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async (data: File) => {
      const formData = new FormData();
      formData.append("file", data);
      formData.append("thumbnail", thumbnailBlob!, "preview.webp");
      const res = await createAssetAction(formData);
      return res;
    },
    onSuccess: (res) => {
      if (res.success == true) {
        setFile(null);
        setThumbnailBlob(null);
        fetchAssets();
      }
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      mutateAsync(selectedFile);
    }
  };

  const { mutateAsync: createProjects, isPending: loadingProjects } =
    useMutation({
      mutationFn: async (payload: ProjectPayload) => {
        const res = await createProjectAction(payload);
        return res;
      },
      onSuccess: (res) => {
        if (res.success) {
        }
      },
      onError: (res) => {
        console.log({ res });
      },
    });

  const handleCreate = async () => {
    const primaryAsset = assets.find((a) => a.id === selectedAssetIds[0]);
    // Contoh data yang dikirim (bisa dinamis dari state editor/modal kamu)
    const payload = {
      name: name,
      thumbnailUrl: primaryAsset?.thumbnailUrl || null,
      lightingSettings: JSON.stringify({ type: environMent, intensity: 1 }),
      assets: selectedAssetIds.map((id) => ({
        assetId: id,
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
      })),
    };
    createProjects(payload);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="lg" className="gap-2 shadow-sm">
          <Plus className="h-4 w-4" /> Create New Project
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[850px] p-0 overflow-hidden border-border/50 shadow-xl">
        {/* Header Section dengan Padding Spesifik */}
        <div className="px-6 pt-6 pb-4 border-b border-border/40 bg-muted/10">
          <DialogHeader>
            <DialogTitle className="text-xl">Create New 3D Project</DialogTitle>
            <DialogDescription className="text-sm">
              Configure your canvas settings and select a base 3D model to
              start.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Body Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-6 py-4 min-h-[400px]">
          {/* LEFT: Project Settings */}
          <div className="flex flex-col h-full">
            <div className="space-y-5">
              <div className="space-y-2.5">
                <div
                  aria-hidden="true"
                  className="absolute -left-[9999px] -top-[9999px] w-64 h-48 pointer-events-none"
                >
                  <GLBViewer
                    url={previewUrl}
                    onScreenshot={(blob) => setThumbnailBlob(blob)}
                  />
                </div>
                <Label htmlFor="name" className="text-sm font-semibold">
                  Project Name
                </Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  id="name"
                  placeholder="e.g. Minimalist Living Room"
                  className="h-10 transition-colors focus-visible:ring-primary/20"
                />
              </div>

              <div className="space-y-2.5">
                <Label className="text-sm font-semibold">
                  Lighting Environment
                </Label>
                <Select
                  value={environMent}
                  onValueChange={(value) => setEnvironment(value)}
                >
                  <SelectTrigger className="h-10 transition-colors focus:ring-primary/20">
                    <SelectValue placeholder="Select Atmosphere" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="studio">
                      Studio (Clean & Neutral)
                    </SelectItem>
                    <SelectItem value="natural">
                      Natural (Warm Sunlight)
                    </SelectItem>
                    <SelectItem value="dramatic">
                      Dramatic (High Contrast)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Selection Summary (Ditekan ke bawah dengan mt-auto) */}
            <div className="mt-auto pt-6">
              <div className="rounded-xl border border-primary/10 bg-primary/5 p-4 flex items-center gap-4 transition-all hover:bg-primary/10">
                <div className="bg-background shadow-sm border border-primary/10 p-2.5 rounded-lg shrink-0">
                  <Box className="h-5 w-5 text-primary" />
                </div>
                <div className="flex flex-col min-w-0">
                  <p className="text-[10px] font-bold text-primary/70 uppercase tracking-wider mb-0.5">
                    Selected Models
                  </p>
                  <p className="text-sm font-semibold text-foreground truncate">
                    {selectedAssetIds.length > 0
                      ? `${selectedAssetIds.length} Assets selected`
                      : "No assets selected yet"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Asset Library & Search */}
          <div className="flex flex-col h-full space-y-3 border-l border-border/40 pl-8">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold flex items-center gap-2">
                Asset Library
                {(loading || isPending) && (
                  <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                )}
              </Label>

              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
                accept=".glb,.gltf"
              />
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs font-medium bg-background hover:bg-muted"
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadCloud className="h-3.5 w-3.5 text-muted-foreground" />
                Upload File
              </Button>
            </div>

            <div className="relative group">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
              <Input
                placeholder="Search your models..."
                className="pl-9 h-9 text-sm bg-muted/30 focus-visible:bg-background transition-colors"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            {/* Grid Area */}
            <div className="flex-1 border rounded-xl bg-muted/10 min-h-[260px] relative overflow-hidden flex flex-col">
              {loading && assets.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-10">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : assets.length > 0 ? (
                <div className="p-3 grid grid-cols-2 gap-3 overflow-y-auto h-65 custom-scrollbar">
                  {/* Manual Upload Card */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    // HAPUS aspect-square, GANTI dengan h-full
                    className="flex flex-col items-center justify-center border-2 border-dashed border-border/60 rounded-lg p-4 transition-all hover:bg-muted/50 hover:border-primary/50 group cursor-pointer h-full"
                  >
                    <div className="bg-background rounded-full p-2 shadow-sm border border-border/50 group-hover:scale-105 transition-transform mb-2">
                      <Plus className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                    </div>
                    <span className="text-[11px] font-semibold text-muted-foreground group-hover:text-primary">
                      Add New
                    </span>
                  </div>

                  {/* Fetched Assets */}
                  {assets.map((asset) => {
                    const isSelected = selectedAssetIds.includes(asset.id); // Cek apakah ID ada di array

                    return (
                      <div
                        key={asset.id}
                        onClick={() => toggleAssetSelection(asset.id)} // Gunakan fungsi toggle
                        className={cn(
                          "group relative cursor-pointer rounded-lg p-2 bg-background transition-all hover:shadow-md border flex flex-col h-full",
                          isSelected
                            ? "ring-2 ring-primary ring-offset-1 border-primary shadow-sm"
                            : "border-border/50 hover:border-border",
                        )}
                      >
                        <div className="aspect-square bg-muted/40 rounded-md mb-2 flex items-center justify-center overflow-hidden">
                          {asset.thumbnailUrl ? (
                            <img
                              src={asset.thumbnailUrl}
                              alt={asset.name}
                              className="w-full h-full object-cover transition-transform group-hover:scale-105"
                            />
                          ) : (
                            <ImageIcon className="h-6 w-6 text-muted-foreground/40" />
                          )}
                        </div>

                        <p className="text-xs font-medium truncate text-foreground/80 group-hover:text-foreground mt-auto">
                          {asset.name}
                        </p>

                        {isSelected && (
                          <div className="absolute top-3 right-3 bg-primary rounded-full p-0.5 shadow-sm animate-in zoom-in-50 duration-200">
                            <Check className="h-3 w-3 text-primary-foreground" />
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Fetched Assets */}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center flex-1 text-muted-foreground space-y-3 p-6 text-center">
                  <div className="bg-muted/50 p-3 rounded-full">
                    <Box className="h-6 w-6 opacity-50" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground/70">
                      No assets found
                    </p>
                    <p className="text-xs mt-1">
                      Try a different search term or upload a new model.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-medium text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-1.5">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7 bg-background shadow-sm"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7 bg-background shadow-sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border/40 bg-muted/10 flex justify-end">
          <Button
            className="w-full sm:w-64 h-11 text-sm font-semibold shadow-sm transition-all"
            disabled={selectedAssetIds.length == 0 || loadingProjects}
            onClick={handleCreate}
          >
            Start Assembling Project
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateProjectModal;
