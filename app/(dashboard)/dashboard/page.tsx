"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
  FolderKanban,
  Library,
  Globe,
  BarChart3,
  ArrowRight,
  Plus,
  Box,
} from "lucide-react";
import { MAX_PROJECTS_FREE } from "@/lib/constants";
import CreateProjectModal from "@/components/ui/modal/create-project-modal";

type Project = {
  id: string;
  name: string;
  createdAt: string;
};

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [assetCount, setAssetCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [projectsRes, assetsRes] = await Promise.all([
          fetch("/api/projects"),
          fetch("/api/assets?limit=1"),
        ]);
        const [projectsData, assetsData] = await Promise.all([
          projectsRes.ok ? projectsRes.json() : [],
          assetsRes.ok ? assetsRes.json() : { pagination: { total: 0 } },
        ]);
        setProjects(projectsData ?? []);
        setAssetCount((assetsData as { pagination?: { total?: number } }).pagination?.total ?? 0);
      } catch (err) {
        console.error("Failed to load dashboard:", err);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  if (loading) {
    return (
      <div className="px-4 lg:px-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-12" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 lg:px-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Overview of your 3D embed projects.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="font-mono text-xs">
            {projects.length} / {MAX_PROJECTS_FREE} projects
          </Badge>
        </div>
      </div>

      {projects.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="rounded-full bg-muted p-4">
              <FolderKanban className="w-8 h-8 text-muted-foreground" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="font-semibold">Welcome to Vur3D</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Upload a .glb model, customize the viewer, and get an embed code
                to drop into any website — all in under a minute.
              </p>
            </div>
            <CreateProjectModal />
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Projects
                </CardTitle>
                <FolderKanban className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{projects.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Assets
                </CardTitle>
                <Library className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {assetCount ?? "..."}
                </div>
              </CardContent>
            </Card>
            <Link href="/domains">
              <Card className="cursor-pointer transition-all hover:shadow-md hover:border-primary/30 h-full">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Domains
                  </CardTitle>
                  <Globe className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    Manage domains →
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Tier
                </CardTitle>
                <BarChart3 className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <Badge>Free</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Projects */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Recent Projects</h2>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/projects">
                  View all <ArrowRight className="w-3 h-3 ml-1" />
                </Link>
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.slice(0, 3).map((project) => (
                <Link key={project.id} href={`/editor/${project.id}`}>
                  <Card className="group cursor-pointer transition-all hover:shadow-md hover:border-primary/30 h-full">
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Box className="w-5 h-5 text-primary flex-shrink-0" />
                        <CardTitle className="text-base truncate">
                          {project.name}
                        </CardTitle>
                      </div>
                      <CardDescription className="text-xs">
                        {new Date(project.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Open in editor</span>
                        <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
            {projects.length > 3 && (
              <Button variant="outline" size="sm" className="mt-4" asChild>
                <Link href="/projects">
                  View all {projects.length} projects <ArrowRight className="w-3 h-3 ml-1" />
                </Link>
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
