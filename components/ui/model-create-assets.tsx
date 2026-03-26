"use client";

import { useState, useRef, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UploadCloud, FileBox, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useForm, FormProvider } from "react-hook-form";
import { createAssetAction } from "@/app/actions/assets";
import { GLBViewer } from "./glb-viewer";
import { FormField } from "./input-form";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AssetFormValues {
  name: string;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FileDropZone({
  file,
  onFileChange,
  onRemove,
}: {
  file: File | null;
  onFileChange: (file: File) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (!selected.name.endsWith(".glb")) {
      toast.error("Hanya file .glb yang diperbolehkan!");
      return;
    }
    onFileChange(selected);
  };

  return (
    <div
      onClick={() => inputRef.current?.click()}
      className={`
        border-2 border-dashed rounded-xl p-8
        flex flex-col items-center justify-center gap-2
        cursor-pointer transition-colors
        ${file ? "bg-primary/5 border-primary/50" : "hover:bg-muted border-muted-foreground/20"}
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".glb"
        className="hidden"
        onChange={handleChange}
      />

      {file ? (
        <div className="flex flex-col items-center text-center">
          <FileBox className="size-10 text-primary mb-2" />
          <p className="text-sm font-medium truncate max-w-[200px]">
            {file.name}
          </p>
          <p className="text-xs text-muted-foreground">
            {(file.size / 1024 / 1024).toFixed(2)} MB
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 text-destructive hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
          >
            <X className="size-3 mr-1" /> Remove
          </Button>
        </div>
      ) : (
        <>
          <div className="p-3 bg-primary/10 rounded-full">
            <UploadCloud className="size-6 text-primary" />
          </div>
          <p className="text-sm font-medium">
            Click to upload or drag and drop
          </p>
          <p className="text-xs text-muted-foreground">
            Supported: GLB (Max 50MB)
          </p>
        </>
      )}
    </div>
  );
}

// ─── Main Dialog ──────────────────────────────────────────────────────────────

export function CreateAssetDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [thumbnailBlob, setThumbnailBlob] = useState<Blob | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const previewUrl = useMemo(
    () => (file ? URL.createObjectURL(file) : null),
    [file],
  );

  const methods = useForm<AssetFormValues>();

  const handleClose = () => {
    onOpenChange(false);
    setFile(null);
    methods.reset();
  };

  const handleUpload = methods.handleSubmit(async (data) => {
    if (!file) return;
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", data.name);
      if (thumbnailBlob)
        formData.append("thumbnail", thumbnailBlob, "preview.webp");

      const result = await createAssetAction(formData);

      if (result.success) {
        toast.success("Berhasil simpan ke R2 dan Turso!");
        handleClose();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Terjadi kesalahan fatal");
    } finally {
      setIsUploading(false);
    }
  });

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Upload 3D Asset</DialogTitle>
          <DialogDescription>
            Tarik dan lepas file .glb kamu di bawah ini untuk ditambahkan ke
            library.
          </DialogDescription>
        </DialogHeader>

        <FormProvider {...methods}>
          <div className="grid gap-4 py-4">
            <FormField<AssetFormValues>
              name="name"
              label="Name"
              rules={{ required: "Name is required" }}
            />

            <FileDropZone
              file={file}
              onFileChange={setFile}
              onRemove={() => setFile(null)}
            />

            <div
              aria-hidden="true"
              className="absolute -left-[9999px] -top-[9999px] w-64 h-48 pointer-events-none"
            >
              <GLBViewer
                url={previewUrl}
                onScreenshot={(blob) => setThumbnailBlob(blob)}
              />
            </div>
          </div>
        </FormProvider>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={!file || isUploading}>
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              "Save Asset"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
