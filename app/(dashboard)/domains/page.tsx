"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Globe, Link2, Loader2, Plus, Shield, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

type Project = {
  id: string;
  name: string;
};

type EmbedDomain = {
  id: string;
  domain: string;
};

export default function DomainsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [domains, setDomains] = useState<EmbedDomain[]>([]);
  const [domainInput, setDomainInput] = useState("");
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [isLoadingDomains, setIsLoadingDomains] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? null,
    [projects, selectedProjectId],
  );

  useEffect(() => {
    async function loadProjects() {
      setIsLoadingProjects(true);
      setError(null);

      try {
        const response = await fetch("/api/projects");
        const result = await response.json();

        if (!response.ok) {
          setError(result.error || "Failed to load projects.");
          return;
        }

        const normalizedProjects = (result ?? []).map(
          (project: { id: string; name: string }) => ({
            id: project.id,
            name: project.name,
          }),
        );

        setProjects(normalizedProjects);
        setSelectedProjectId(
          (current) => current || normalizedProjects[0]?.id || "",
        );
      } catch (loadError) {
        console.error("Failed to load projects:", loadError);
        setError("Failed to load projects.");
      } finally {
        setIsLoadingProjects(false);
      }
    }

    void loadProjects();
  }, []);

  useEffect(() => {
    async function loadDomains() {
      if (!selectedProjectId) {
        setDomains([]);
        return;
      }

      setIsLoadingDomains(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/projects/${selectedProjectId}/embed-domains`,
        );
        const result = await response.json();

        if (!response.ok) {
          setError(result.error || "Failed to load domains.");
          return;
        }

        setDomains(
          (result.domains ?? []).map(
            (domain: { id: string; domain: string }) => ({
              id: domain.id,
              domain: domain.domain,
            }),
          ),
        );
      } catch (loadError) {
        console.error("Failed to load domains:", loadError);
        setError("Failed to load domains.");
      } finally {
        setIsLoadingDomains(false);
      }
    }

    void loadDomains();
  }, [selectedProjectId]);

  async function handleAddDomain() {
    if (!selectedProjectId || !domainInput.trim()) return;

    setIsSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(
        `/api/projects/${selectedProjectId}/embed-domains`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ domain: domainInput.trim() }),
        },
      );
      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Failed to add domain.");
        return;
      }

      setDomains((prev) => {
        const exists = prev.some((item) => item.id === result.domain.id);
        if (exists) return prev;
        return [...prev, result.domain].sort((a, b) =>
          a.domain.localeCompare(b.domain),
        );
      });
      setDomainInput("");
      setMessage("Domain added.");
    } catch (submitError) {
      console.error("Failed to add domain:", submitError);
      setError("Failed to add domain.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteDomain(domainId: string) {
    if (!selectedProjectId) return;

    setIsSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(
        `/api/projects/${selectedProjectId}/embed-domains/${domainId}`,
        { method: "DELETE" },
      );
      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Failed to delete domain.");
        return;
      }

      setDomains((prev) => prev.filter((domain) => domain.id !== domainId));
      setMessage("Domain removed.");
    } catch (submitError) {
      console.error("Failed to delete domain:", submitError);
      setError("Failed to delete domain.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Globe className="size-6 text-primary" />
            Embed Domains
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage which customer websites are allowed to render your secure
            embeds.
          </p>
        </div>
        {selectedProject && (
          <Button asChild variant="outline">
            <Link href={`/editor/${selectedProject.id}`}>Open Project</Link>
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="size-4 text-primary" />
              Protected Projects
            </CardTitle>
            <CardDescription>
              Projects available for secure embedding.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {isLoadingProjects ? "..." : projects.length}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="size-4 text-primary" />
              Allowed Domains
            </CardTitle>
            <CardDescription>
              Saved domains for the selected project.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {selectedProjectId ? domains.length : 0}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
            <CardDescription>How access works right now.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1 text-sm text-muted-foreground">
            <p>Tokens are signed server-side.</p>
            <p>Domains are enforced from saved project settings.</p>
            <p>Removing a domain blocks future loads from that site.</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project Allowlist</CardTitle>
          <CardDescription>
            Pick a project, then add the website origins that should be allowed
            to host its iframe.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-[minmax(0,260px)_1fr]">
            <div className="space-y-2">
              <Label htmlFor="project-select">Project</Label>
              <Select
                value={selectedProjectId}
                onValueChange={setSelectedProjectId}
                disabled={isLoadingProjects || projects.length === 0}
              >
                <SelectTrigger id="project-select" className="w-full">
                  <SelectValue
                    placeholder={
                      isLoadingProjects
                        ? "Loading projects..."
                        : "Select a project"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="domain-input">Add Domain</Label>
              <div className="flex gap-2">
                <Input
                  id="domain-input"
                  value={domainInput}
                  onChange={(event) => setDomainInput(event.target.value)}
                  placeholder="https://customer.com"
                  disabled={!selectedProjectId || isSubmitting}
                />
                <Button
                  type="button"
                  onClick={handleAddDomain}
                  disabled={
                    !selectedProjectId || !domainInput.trim() || isSubmitting
                  }
                >
                  <Plus className="size-4" />
                  Add
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          {error && <p className="text-sm text-destructive">{error}</p>}
          {message && <p className="text-sm text-emerald-600">{message}</p>}

          {!selectedProjectId && !isLoadingProjects && (
            <p className="text-sm text-muted-foreground">
              Create or select a project to manage embed domains.
            </p>
          )}

          {selectedProjectId && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h2 className="font-medium">{selectedProject?.name}</h2>
                <Badge variant="secondary">{domains.length} domains</Badge>
              </div>

              {isLoadingDomains ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Loading domains...
                </div>
              ) : domains.length === 0 ? (
                <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                  No domains saved yet. Add the customer site origin before
                  generating an iframe token.
                </div>
              ) : (
                <div className="space-y-2">
                  {domains.map((domain) => (
                    <div
                      key={domain.id}
                      className="flex items-center justify-between gap-3 rounded-lg border bg-card px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-mono text-sm">
                          {domain.domain}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Allowed embed origin for this project
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteDomain(domain.id)}
                        disabled={isSubmitting}
                      >
                        <Trash2 className="size-4" />
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
