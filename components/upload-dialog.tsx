"use client";

import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Plus, Upload, FileBox, X, AlertCircle } from "lucide-react";
import { MAX_FILE_SIZE_BYTES } from "@/lib/constants";

type UploadDialogProps = {
  onSuccess: () => void;
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export function UploadDialog({ onSuccess }: UploadDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setName("");
    setFile(null);
    setError(null);
    setProgress(0);
    setUploading(false);
  };

  const handleFileSelect = (selectedFile: File) => {
    setError(null);
    const ext = selectedFile.name.split(".").pop()?.toLowerCase();
    if (ext !== "glb") {
      setError("Only .glb files are allowed");
      return;
    }
    if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
      setError("File size exceeds 50MB limit");
      return;
    }
    setFile(selectedFile);
    if (!name) {
      setName(selectedFile.name.replace(/\.glb$/i, ""));
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) handleFileSelect(droppedFile);
    },
    [name],
  );

  const handleSubmit = async () => {
    console.log("test");
    if (!file || !name.trim()) return;
    setUploading(true);
    setError(null);
    setProgress(10);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", name.trim());

      setProgress(30);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      setProgress(80);

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }

      setProgress(100);

      setTimeout(() => {
        setOpen(false);
        resetForm();
        onSuccess();
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setUploading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          New Project
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Create New 3D Project</DialogTitle>
          <DialogDescription>
            Upload a .glb file and give your project a name.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Project Name */}
          <div className="space-y-2">
            <Label htmlFor="projectName">Project Name</Label>
            <Input
              id="projectName"
              placeholder="My 3D Model"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={uploading}
            />
          </div>

          {/* Drag & Drop Zone */}
          <div className="space-y-2">
            <Label>.glb File</Label>
            {!file ? (
              <div
                className={`
                  border-2 border-dashed rounded-lg p-8
                  flex flex-col items-center justify-center gap-3
                  cursor-pointer transition-colors
                  ${
                    isDragging
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                  }
                `}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => document.getElementById("file-input")?.click()}
              >
                <Upload className="w-8 h-8 text-muted-foreground" />
                <div className="text-center">
                  <p className="text-sm font-medium">
                    Drag & drop your .glb file
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    or click to browse (max 50MB)
                  </p>
                </div>
                <input
                  id="file-input"
                  type="file"
                  accept=".glb"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileSelect(f);
                  }}
                />
              </div>
            ) : (
              <div className="border rounded-lg p-4 flex items-center gap-3 bg-muted/30">
                <FileBox className="w-8 h-8 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>
                </div>
                {!uploading && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 rounded-md p-3">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Upload Progress */}
          {uploading && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-xs text-muted-foreground text-center">
                Uploading to cloud...
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setOpen(false);
              resetForm();
            }}
            disabled={uploading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!file || !name.trim() || uploading}
          >
            {uploading ? "Uploading..." : "Create Project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
