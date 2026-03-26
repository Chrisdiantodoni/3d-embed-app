"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { UploadDialog } from "@/components/upload-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FolderOpen,
  Box,
  ExternalLink,
  Calendar,
  HardDrive,
} from "lucide-react";
import { MAX_PROJECTS_FREE } from "@/lib/constants";

type Project = {
  id: string;
  name: string;
  fileName: string;
  fileUrl: string;
  fileSize: number | null;
  thumbnailUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function DashboardPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  return (
    <div className="px-4 lg:px-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Projects</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Upload .glb models, customize the viewer, and embed them anywhere.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="font-mono text-xs">
            {projects.length} / {MAX_PROJECTS_FREE}
          </Badge>
          <UploadDialog onSuccess={fetchProjects} />
        </div>
      </div>

      {/* Loading Skeletons */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full rounded-md" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && projects.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="rounded-full bg-muted p-4">
              <FolderOpen className="w-8 h-8 text-muted-foreground" />
            </div>
            <div className="text-center">
              <h3 className="font-semibold">No projects yet</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Upload your first .glb file to get started!
              </p>
            </div>
            <UploadDialog onSuccess={fetchProjects} />
          </CardContent>
        </Card>
      )}

      {/* Project Grid */}
      {!loading && projects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Card
              key={project.id}
              className="group cursor-pointer transition-all hover:shadow-md hover:border-primary/30"
              onClick={() => router.push(`/project/${project.id}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <Box className="w-5 h-5 text-primary flex-shrink-0" />
                    <CardTitle className="text-base truncate">
                      {project.name}
                    </CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/project/${project.id}`);
                    }}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
                <CardDescription className="text-xs truncate">
                  {project.fileName}
                </CardDescription>
              </CardHeader>

              <CardContent>
                {/* 3D Preview */}
                {project.thumbnailUrl ? (
                  <div className="rounded-lg h-32 overflow-hidden mb-3">
                    <img
                      src={project.thumbnailUrl}
                      alt={project.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900 rounded-lg h-32 flex items-center justify-center mb-3">
                    <Box className="w-10 h-10 text-zinc-400" />
                  </div>
                )}

                {/* Meta Info */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(project.createdAt)}
                  </div>
                  {project.fileSize && (
                    <div className="flex items-center gap-1">
                      <HardDrive className="w-3 h-3" />
                      {formatFileSize(project.fileSize)}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
