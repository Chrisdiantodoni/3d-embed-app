"use client";

import { useEffect, useState } from "react";
import { BarChart3 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import AnalyticsTab from "@/components/AnalyticsTab";

type Project = {
  id: string;
  name: string;
};

export default function AnalyticsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/projects");
        if (res.ok) {
          const data = await res.json();
          setProjects(data ?? []);
          setSelectedId((current) => current || data?.[0]?.id || "");
        }
      } catch (err) {
        console.error("Failed to load projects:", err);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  return (
    <div className="px-4 lg:px-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <BarChart3 className="size-6 text-primary" />
            Analytics
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track embed views, rotations, zooms, and hotspot clicks per project.
          </p>
        </div>

        <Select
          value={selectedId}
          onValueChange={setSelectedId}
          disabled={loading || projects.length === 0}
        >
          <SelectTrigger className="w-full sm:w-[240px]">
            <SelectValue
              placeholder={loading ? "Loading..." : "Select a project"}
            />
          </SelectTrigger>
          <SelectContent>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-64 rounded-xl" />
        </div>
      ) : !selectedId ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <BarChart3 className="size-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              No projects yet. Create one to start tracking embed usage.
            </p>
          </CardContent>
        </Card>
      ) : (
        <AnalyticsTab projectId={selectedId} />
      )}
    </div>
  );
}
