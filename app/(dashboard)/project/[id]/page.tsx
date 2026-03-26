"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import R3FViewer from "@/components/3d/R3FViewer";
import type { HotspotData } from "@/components/3d/HotspotPin";
import AnalyticsTab from "@/components/AnalyticsTab";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Package,
    Code,
    Layers3,
    Save,
    Trash2,
    Check,
    Copy,
    ArrowLeft,
    Loader2,
    MapPin,
    Plus,
    Camera,
    X,
    BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import * as THREE from "three";

type Project = {
    id: string;
    userId: string;
    name: string;
    fileName: string;
    fileUrl: string;
    fileSize: number | null;
    thumbnailUrl: string | null;
    intensity: string;
    autoRotate: boolean;
    environment: "city" | "studio" | "lobby";
    bgColor: string;
    createdAt: string;
    updatedAt: string;
};

export default function ProjectEditorPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const glRef = useRef<THREE.WebGLRenderer | null>(null);

    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [copied, setCopied] = useState(false);

    // Live editor state
    const [name, setName] = useState("");
    const [intensity, setIntensity] = useState([0.6]);
    const [autoRotate, setAutoRotate] = useState(true);
    const [environment, setEnvironment] = useState<"city" | "studio" | "lobby">("city");
    const [bgColor, setBgColor] = useState("#fafafa");

    // Hotspot state
    const [hotspots, setHotspots] = useState<HotspotData[]>([]);
    const [placingHotspot, setPlacingHotspot] = useState(false);
    const [pendingPosition, setPendingPosition] = useState<{ x: number; y: number; z: number } | null>(null);
    const [hotspotLabel, setHotspotLabel] = useState("");
    const [hotspotDescription, setHotspotDescription] = useState("");
    const [hotspotLink, setHotspotLink] = useState("");
    const [savingHotspot, setSavingHotspot] = useState(false);

    // Thumbnail state
    const [capturingThumb, setCapturingThumb] = useState(false);

    // Active editor tab
    const [activeTab, setActiveTab] = useState<"config" | "hotspots" | "analytics">("config");

    useEffect(() => {
        async function fetchProject() {
            try {
                const res = await fetch(`/api/projects/${id}`);
                if (!res.ok) {
                    router.push("/dashboard");
                    return;
                }
                const data = await res.json();
                setProject(data);
                setName(data.name);
                setIntensity([parseFloat(data.intensity || "0.6")]);
                setAutoRotate(data.autoRotate);
                setEnvironment(data.environment || "city");
                setBgColor(data.bgColor || "#fafafa");
            } catch {
                router.push("/dashboard");
            } finally {
                setLoading(false);
            }
        }
        fetchProject();
    }, [id, router]);

    // Fetch hotspots
    useEffect(() => {
        async function fetchHotspots() {
            try {
                const res = await fetch(`/api/projects/${id}/hotspots`);
                if (res.ok) {
                    const data = await res.json();
                    setHotspots(data);
                }
            } catch {
                console.error("Failed to fetch hotspots");
            }
        }
        fetchHotspots();
    }, [id]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch(`/api/projects/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    intensity: intensity[0],
                    autoRotate,
                    environment,
                    bgColor,
                }),
            });
            if (res.ok) {
                const updated = await res.json();
                setProject(updated);
                toast.success("Project saved!");
            } else {
                toast.error("Failed to save");
            }
        } catch {
            toast.error("Failed to save");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
            if (res.ok) {
                toast.success("Project deleted");
                router.push("/dashboard");
            } else {
                toast.error("Failed to delete");
            }
        } catch {
            toast.error("Failed to delete");
        } finally {
            setDeleting(false);
            setShowDeleteDialog(false);
        }
    };

    // Hotspot handlers
    const handlePlaceHotspot = useCallback((position: { x: number; y: number; z: number }) => {
        setPendingPosition(position);
        setPlacingHotspot(false);
        setHotspotLabel("");
        setHotspotDescription("");
        setHotspotLink("");
    }, []);

    const handleSaveHotspot = async () => {
        if (!pendingPosition || !hotspotLabel.trim()) return;
        setSavingHotspot(true);
        try {
            const res = await fetch(`/api/projects/${id}/hotspots`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    positionX: pendingPosition.x,
                    positionY: pendingPosition.y,
                    positionZ: pendingPosition.z,
                    label: hotspotLabel,
                    description: hotspotDescription || null,
                    linkUrl: hotspotLink || null,
                }),
            });
            if (res.ok) {
                const newHotspot = await res.json();
                setHotspots((prev) => [...prev, newHotspot]);
                setPendingPosition(null);
                toast.success("Hotspot added!");
            } else {
                toast.error("Failed to create hotspot");
            }
        } catch {
            toast.error("Failed to create hotspot");
        } finally {
            setSavingHotspot(false);
        }
    };

    const handleDeleteHotspot = async (hotspotId: string) => {
        try {
            const res = await fetch(`/api/projects/${id}/hotspots/${hotspotId}`, {
                method: "DELETE",
            });
            if (res.ok) {
                setHotspots((prev) => prev.filter((h) => h.id !== hotspotId));
                toast.success("Hotspot removed");
            } else {
                toast.error("Failed to delete hotspot");
            }
        } catch {
            toast.error("Failed to delete hotspot");
        }
    };

    // Thumbnail capture
    const handleCaptureThumbnail = async () => {
        if (!glRef.current) {
            toast.error("Renderer not ready yet");
            return;
        }
        setCapturingThumb(true);
        try {
            const canvas = glRef.current.domElement;
            const dataUrl = canvas.toDataURL("image/png");

            const res = await fetch(`/api/projects/${id}/thumbnail`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ image: dataUrl }),
            });
            if (res.ok) {
                const data = await res.json();
                setProject((prev) => prev ? { ...prev, thumbnailUrl: data.thumbnailUrl } : prev);
                toast.success("Thumbnail captured!");
            } else {
                toast.error("Failed to save thumbnail");
            }
        } catch {
            toast.error("Failed to capture thumbnail");
        } finally {
            setCapturingThumb(false);
        }
    };

    const embedUrl =
        typeof window !== "undefined"
            ? `${window.location.origin}/v/${id}`
            : `/v/${id}`;

    const embedCode = `<iframe src="${embedUrl}" width="100%" height="500" frameborder="0" allowfullscreen></iframe>`;

    const copyEmbed = useCallback(() => {
        navigator.clipboard.writeText(embedCode);
        setCopied(true);
        toast.success("Embed code copied!");
        setTimeout(() => setCopied(false), 2000);
    }, [embedCode]);

    const sceneConfig = {
        intensity: intensity[0],
        autoRotate,
        environment,
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-65px)]">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!project) return null;

    return (
        <>
            <div className="flex w-full h-[calc(100vh-65px)] overflow-hidden">
                {/* Main 3D Canvas Area */}
                <div
                    className="flex-1 h-full relative"
                    style={{ backgroundColor: bgColor }}
                >
                    <R3FViewer
                        url={project.fileUrl}
                        config={sceneConfig}
                        hotspots={hotspots}
                        onDeleteHotspot={handleDeleteHotspot}
                        placingHotspot={placingHotspot}
                        onPlaceHotspot={handlePlaceHotspot}
                        editable={true}
                        gl={glRef}
                    />

                    {/* Back button */}
                    <Button
                        variant="secondary"
                        size="sm"
                        className="absolute top-4 left-4 gap-2 bg-white/80 dark:bg-zinc-900/80 backdrop-blur shadow"
                        onClick={() => router.push("/dashboard")}
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </Button>
                </div>

                {/* Right Editor Panel */}
                <div className="w-[320px] flex-shrink-0 border-l bg-background overflow-y-auto">
                    {/* Header */}
                    <div className="border-b h-16 flex items-center px-6">
                        <div className="flex items-center gap-3">
                            <Package className="w-5 h-5 text-primary" />
                            <div className="flex flex-col">
                                <h1 className="text-sm font-semibold tracking-tight truncate max-w-[200px]">
                                    {name || project.name}
                                </h1>
                                <p className="text-xs text-muted-foreground">Editor</p>
                            </div>
                        </div>
                    </div>

                    {/* Tab Switcher */}
                    <div className="flex border-b">
                        <button
                            onClick={() => setActiveTab("config")}
                            className={`flex-1 py-3 text-xs font-medium text-center transition-colors border-b-2 ${activeTab === "config"
                                ? "border-primary text-primary"
                                : "border-transparent text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            <Layers3 className="w-3.5 h-3.5 inline mr-1.5" />
                            Config
                        </button>
                        <button
                            onClick={() => setActiveTab("hotspots")}
                            className={`flex-1 py-3 text-xs font-medium text-center transition-colors border-b-2 ${activeTab === "hotspots"
                                ? "border-primary text-primary"
                                : "border-transparent text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            <MapPin className="w-3.5 h-3.5 inline mr-1.5" />
                            Hotspots
                            {hotspots.length > 0 && (
                                <span className="ml-1.5 bg-primary/10 text-primary rounded-full px-1.5 text-[10px] font-semibold">
                                    {hotspots.length}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab("analytics")}
                            className={`flex-1 py-3 text-xs font-medium text-center transition-colors border-b-2 ${activeTab === "analytics"
                                ? "border-primary text-primary"
                                : "border-transparent text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            <BarChart3 className="w-3.5 h-3.5 inline mr-1.5" />
                            Analytics
                        </button>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* CONFIG TAB */}
                        {activeTab === "config" && (
                            <>
                                {/* Project Name */}
                                <div className="space-y-2">
                                    <Label htmlFor="projectName">Project Name</Label>
                                    <Input
                                        id="projectName"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Project name"
                                    />
                                </div>

                                {/* Viewer Config Section */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <Layers3 className="w-4 h-4 text-muted-foreground" />
                                        <h2 className="text-sm font-medium">Viewer Configuration</h2>
                                    </div>
                                    <Separator />

                                    {/* Background Color */}
                                    <div className="space-y-2">
                                        <Label htmlFor="bgColor">Background Color</Label>
                                        <div className="flex gap-2">
                                            <div
                                                className="w-10 h-10 rounded border flex-shrink-0"
                                                style={{ backgroundColor: bgColor }}
                                            />
                                            <input
                                                type="color"
                                                value={bgColor}
                                                onChange={(e) => setBgColor(e.target.value)}
                                                className="w-full h-10 border rounded bg-background px-1 cursor-pointer"
                                            />
                                        </div>
                                    </div>

                                    {/* Light Intensity */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <Label>Lighting Intensity</Label>
                                            <span className="text-xs font-mono text-muted-foreground">
                                                {intensity[0].toFixed(1)}
                                            </span>
                                        </div>
                                        <Slider
                                            value={intensity}
                                            onValueChange={setIntensity}
                                            max={2}
                                            step={0.1}
                                            className="pt-2"
                                        />
                                    </div>

                                    {/* Environment */}
                                    <div className="space-y-2">
                                        <Label>Environment</Label>
                                        <Select value={environment} onValueChange={(v) => setEnvironment(v as typeof environment)}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="city">City</SelectItem>
                                                <SelectItem value="studio">Studio</SelectItem>
                                                <SelectItem value="lobby">Lobby</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Auto Rotate */}
                                    <div className="flex items-center justify-between border rounded-lg p-3">
                                        <div className="space-y-0.5">
                                            <Label htmlFor="autoRotate">Auto-Rotate</Label>
                                            <p className="text-xs text-muted-foreground">
                                                Enable continuous spinning.
                                            </p>
                                        </div>
                                        <Switch
                                            id="autoRotate"
                                            checked={autoRotate}
                                            onCheckedChange={setAutoRotate}
                                        />
                                    </div>
                                </div>

                                {/* Thumbnail Capture */}
                                <div className="space-y-2">
                                    <Separator />
                                    <Button
                                        variant="outline"
                                        className="w-full gap-2"
                                        onClick={handleCaptureThumbnail}
                                        disabled={capturingThumb}
                                    >
                                        {capturingThumb ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Camera className="w-4 h-4" />
                                        )}
                                        {capturingThumb ? "Capturing..." : "Capture Thumbnail"}
                                    </Button>
                                    {project.thumbnailUrl && (
                                        <p className="text-xs text-muted-foreground text-center">
                                            ✓ Thumbnail saved
                                        </p>
                                    )}
                                </div>

                                {/* Embed Code Section */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <Code className="w-4 h-4 text-muted-foreground" />
                                        <h2 className="text-sm font-medium">Embed Code</h2>
                                    </div>
                                    <Separator />
                                    <div className="bg-muted p-3 rounded-md border text-xs font-mono break-all text-muted-foreground">
                                        {embedCode}
                                    </div>
                                    <Button
                                        className="w-full gap-2"
                                        variant="secondary"
                                        onClick={copyEmbed}
                                    >
                                        {copied ? (
                                            <>
                                                <Check className="w-4 h-4" /> Copied!
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="w-4 h-4" /> Copy Embed Code
                                            </>
                                        )}
                                    </Button>
                                </div>

                                {/* Actions */}
                                <Separator />
                                <div className="flex gap-2">
                                    <Button
                                        className="flex-1 gap-2"
                                        onClick={handleSave}
                                        disabled={saving}
                                    >
                                        {saving ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Save className="w-4 h-4" />
                                        )}
                                        {saving ? "Saving..." : "Save Changes"}
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        size="icon"
                                        onClick={() => setShowDeleteDialog(true)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </>
                        )}

                        {/* HOTSPOTS TAB */}
                        {activeTab === "hotspots" && (
                            <>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-sm font-medium">Hotspots</h2>
                                        <Button
                                            size="sm"
                                            variant={placingHotspot ? "destructive" : "default"}
                                            className="gap-1.5 text-xs h-8"
                                            onClick={() => {
                                                setPlacingHotspot(!placingHotspot);
                                                setPendingPosition(null);
                                            }}
                                        >
                                            {placingHotspot ? (
                                                <>
                                                    <X className="w-3.5 h-3.5" /> Cancel
                                                </>
                                            ) : (
                                                <>
                                                    <Plus className="w-3.5 h-3.5" /> Add Hotspot
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {placingHotspot
                                            ? "Click on the 3D model to place a hotspot pin."
                                            : "Add clickable annotations to your 3D model."}
                                    </p>
                                </div>

                                {/* Pending hotspot form */}
                                {pendingPosition && (
                                    <div className="border rounded-lg p-4 space-y-3 bg-primary/5 border-primary/20">
                                        <div className="flex items-center gap-2">
                                            <MapPin className="w-4 h-4 text-primary" />
                                            <h3 className="text-sm font-medium">New Hotspot</h3>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs">Label *</Label>
                                            <Input
                                                value={hotspotLabel}
                                                onChange={(e) => setHotspotLabel(e.target.value)}
                                                placeholder="e.g. Power Button"
                                                className="h-8 text-sm"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs">Description</Label>
                                            <Input
                                                value={hotspotDescription}
                                                onChange={(e) => setHotspotDescription(e.target.value)}
                                                placeholder="Optional description"
                                                className="h-8 text-sm"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs">Link URL</Label>
                                            <Input
                                                value={hotspotLink}
                                                onChange={(e) => setHotspotLink(e.target.value)}
                                                placeholder="https://..."
                                                className="h-8 text-sm"
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                className="flex-1 h-8 text-xs"
                                                onClick={handleSaveHotspot}
                                                disabled={!hotspotLabel.trim() || savingHotspot}
                                            >
                                                {savingHotspot ? "Saving..." : "Save Hotspot"}
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-8 text-xs"
                                                onClick={() => setPendingPosition(null)}
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                <Separator />

                                {/* Hotspot List */}
                                {hotspots.length === 0 ? (
                                    <div className="text-center py-8">
                                        <MapPin className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
                                        <p className="text-sm text-muted-foreground">No hotspots yet</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Click &quot;Add Hotspot&quot; to get started
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {hotspots.map((hs) => (
                                            <div
                                                key={hs.id}
                                                className="flex items-center gap-3 border rounded-lg p-3 group hover:border-primary/30 transition-colors"
                                            >
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                                                    <MapPin className="w-3.5 h-3.5 text-white" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">
                                                        {hs.label}
                                                    </p>
                                                    {hs.description && (
                                                        <p className="text-xs text-muted-foreground truncate">
                                                            {hs.description}
                                                        </p>
                                                    )}
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 h-7 w-7"
                                                    onClick={() => handleDeleteHotspot(hs.id)}
                                                >
                                                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}

                        {/* ANALYTICS TAB */}
                        {activeTab === "analytics" && (
                            <AnalyticsTab projectId={id} />
                        )}
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Project</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete &quot;{project.name}&quot;? This
                            will permanently remove the 3D model file and all embed links will
                            stop working.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowDeleteDialog(false)}
                            disabled={deleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={deleting}
                        >
                            {deleting ? "Deleting..." : "Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
