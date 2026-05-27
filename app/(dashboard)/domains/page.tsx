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
type EmbedAccess = {
  hasActiveToken: boolean;
  activeToken: string | null;
  updatedAt?: string | null;
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
  const [baseUrl, setBaseUrl] = useState("");
  const [embedAccess, setEmbedAccess] = useState<EmbedAccess | null>(null);
  const [codeTab, setCodeTab] = useState<"html" | "jsx" | "vue" | "svelte">("html");

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? null,
    [projects, selectedProjectId],
  );
  const activeEmbedUrl =
    embedAccess?.hasActiveToken && embedAccess.activeToken
      ? `${baseUrl}/embed/${selectedProjectId}?token=${encodeURIComponent(embedAccess.activeToken)}`
      : "";
  const activeIframeCode = activeEmbedUrl
    ? `<iframe src="${activeEmbedUrl}" width="100%" height="600" style="border:0;" loading="lazy" allowfullscreen></iframe>`
    : "";
  const activeJsxCode = activeEmbedUrl
    ? `<iframe\n  src="${activeEmbedUrl}"\n  width="100%"\n  height={600}\n  style={{ border: 0 }}\n  loading="lazy"\n  allowFullScreen\n/>`
    : "";
  const activeVueCode = activeEmbedUrl
    ? `<iframe\n  :src="'${activeEmbedUrl}'"\n  width="100%"\n  height="600"\n  style="border:0;"\n  loading="lazy"\n  allowfullscreen\n/>`
    : "";
  const activeSvelteCode = activeEmbedUrl
    ? `<iframe\n  src="${activeEmbedUrl}"\n  width="100%"\n  height="600"\n  style="border:0;"\n  loading="lazy"\n  allowfullscreen\n/>`
    : "";

  const codeSnippets: Record<string, string> = {
    html: activeIframeCode,
    jsx: activeJsxCode,
    vue: activeVueCode,
    svelte: activeSvelteCode,
  };

  useEffect(() => {
    setBaseUrl(window.location.origin);
  }, []);

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
        setEmbedAccess(null);
        return;
      }

      setIsLoadingDomains(true);
      setError(null);

      try {
        const [domainsResponse, accessResponse] = await Promise.all([
          fetch(`/api/projects/${selectedProjectId}/embed-domains`),
          fetch(`/api/projects/${selectedProjectId}/embed-access`),
        ]);
        const [domainsResult, accessResult] = await Promise.all([
          domainsResponse.json(),
          accessResponse.json(),
        ]);

        if (!domainsResponse.ok) {
          setError(domainsResult.error || "Failed to load domains.");
          return;
        }

        setDomains(
          (domainsResult.domains ?? []).map(
            (domain: { id: string; domain: string }) => ({
              id: domain.id,
              domain: domain.domain,
            }),
          ),
        );

        if (accessResponse.ok) {
          setEmbedAccess(accessResult);
        }
      } catch (loadError) {
        console.error("Failed to load domains:", loadError);
        setError("Failed to load domains.");
      } finally {
        setIsLoadingDomains(false);
      }
    }

    void loadDomains();
  }, [selectedProjectId]);

  function hydrateEmbedAccess(result: EmbedAccess) {
    setEmbedAccess(result);
  }

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

  async function handleEnsureEmbed() {
    if (!selectedProjectId) return;

    setIsSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(
        `/api/projects/${selectedProjectId}/embed-access`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "ensure",
          }),
        },
      );
      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Failed to prepare embed URL.");
        return;
      }

      hydrateEmbedAccess(result);
      setMessage("Active embed URL is ready.");
    } catch (submitError) {
      console.error("Failed to prepare embed URL:", submitError);
      setError("Failed to prepare embed URL.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRegenerateEmbed() {
    if (!selectedProjectId) return;

    setIsSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(
        `/api/projects/${selectedProjectId}/embed-access`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "regenerate",
          }),
        },
      );
      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Failed to regenerate embed URL.");
        return;
      }

      hydrateEmbedAccess(result);
      setMessage("Embed URL regenerated. Old URL is no longer valid.");
    } catch (submitError) {
      console.error("Failed to regenerate embed URL:", submitError);
      setError("Failed to regenerate embed URL.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRevokeEmbed() {
    if (!selectedProjectId) return;

    setIsSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(
        `/api/projects/${selectedProjectId}/embed-access`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "revoke" }),
        },
      );
      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Failed to revoke embed URL.");
        return;
      }

      hydrateEmbedAccess(result);
      setMessage("Embed access revoked.");
    } catch (submitError) {
      console.error("Failed to revoke embed URL:", submitError);
      setError("Failed to revoke embed URL.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function copyToClipboard(value: string, successMessage: string) {
    await navigator.clipboard.writeText(value);
    setMessage(successMessage);
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

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="font-medium">Active Embed URL</h3>
                <p className="text-sm text-muted-foreground">
                  Reuse the current URL anytime, or regenerate it to invalidate the old one.
                </p>
              </div>
              <Badge variant={embedAccess?.hasActiveToken ? "default" : "secondary"}>
                {embedAccess?.hasActiveToken ? "Active" : "Inactive"}
              </Badge>
            </div>

            <Input
              readOnly
              value={activeEmbedUrl}
              placeholder="No active embed URL yet"
            />

            {/* Code format tabs */}
            <div className="space-y-2">
              <div className="flex items-center gap-1 border-b pb-2">
                {(["html", "jsx", "vue", "svelte"] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setCodeTab(tab)}
                    className={`px-3 py-1 text-xs font-mono rounded-md transition-colors ${
                      codeTab === tab
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    {tab === "html" ? "HTML" : tab.toUpperCase()}
                  </button>
                ))}
              </div>
              <textarea
                readOnly
                value={codeSnippets[codeTab]}
                placeholder="No active embed code yet"
                className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs text-foreground outline-none"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={handleEnsureEmbed}
                disabled={!selectedProjectId || isSubmitting || domains.length === 0}
              >
                {embedAccess?.hasActiveToken ? "Load Active URL" : "Create URL"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleRegenerateEmbed}
                disabled={!selectedProjectId || isSubmitting || domains.length === 0}
              >
                Regenerate
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={handleRevokeEmbed}
                disabled={!selectedProjectId || isSubmitting || !embedAccess?.hasActiveToken}
              >
                Revoke Access
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => copyToClipboard(activeEmbedUrl, "Embed URL copied.")}
                disabled={!activeEmbedUrl}
              >
                Copy Embed URL
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => copyToClipboard(codeSnippets[codeTab], `${codeTab === "html" ? "HTML" : codeTab.toUpperCase()} code copied.`)}
                disabled={!activeEmbedUrl}
              >
                Copy {codeTab === "html" ? "HTML" : codeTab.toUpperCase()}
              </Button>
            </div>

            {embedAccess?.updatedAt && (
              <p className="text-xs text-muted-foreground">
                Last updated: {new Date(embedAccess.updatedAt).toLocaleString()}
              </p>
            )}
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
