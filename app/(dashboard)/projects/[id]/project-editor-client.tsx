"use client";

import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  TransformControls,
  Environment,
  ContactShadows,
  useGLTF,
  Grid,
} from "@react-three/drei";
import {
  Suspense,
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import { useFrame } from "@react-three/fiber";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import {
  Save,
  Move,
  RotateCw,
  Maximize,
  RotateCcw,
  Lock,
  Sun,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Trash2,
  Pencil,
  Check,
  X,
  Layers,
  Undo2,
  Search,
  Package,
  ChevronUp as PanelOpen,
  GripHorizontal,
} from "lucide-react";
import * as THREE from "three";

// ─── Types ───────────────────────────────────────────────────────────────────

type Vec3 = { x: number; y: number; z: number };
type TransformData = { position: Vec3; rotation: Vec3; scale: Vec3 };
type SceneAsset = {
  id: string;
  name: string;
  url: string;
  transform: TransformData;
  defaultTransform: TransformData;
  visible: boolean;
  autoRotate: boolean;
};
type AxisLock = "x" | "y" | "z" | null;
type LightingSettings = {
  preset: string;
  intensity: number;
  ambientColor: string;
  shadowEnabled: boolean;
};
type LibraryAsset = {
  id: string;
  name: string;
  url: string;
  thumbnailUrl?: string;
  category: string;
};
type HistorySnapshot = SceneAsset[];

// ─── Constants ────────────────────────────────────────────────────────────────

const SNAP_VALUE = 0.5;
const MAX_HISTORY = 50;
const ENVIRONMENT_PRESETS = [
  "studio",
  "sunset",
  "dawn",
  "night",
  "warehouse",
  "forest",
  "apartment",
  "city",
  "park",
  "lobby",
] as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function snapVec3(vec: Vec3, snap: number): Vec3 {
  return {
    x: Math.round(vec.x / snap) * snap,
    y: Math.round(vec.y / snap) * snap,
    z: Math.round(vec.z / snap) * snap,
  };
}
function vec3ToArray(v: Vec3): [number, number, number] {
  return [v.x, v.y, v.z];
}
function round2(n: number) {
  return Math.round(n * 100) / 100;
}

// ─── useUndoHistory ───────────────────────────────────────────────────────────

function useUndoHistory(initialState: SceneAsset[]) {
  const [assets, setAssets] = useState<SceneAsset[]>(initialState);
  const historyRef = useRef<HistorySnapshot[]>([]);

  const pushHistory = useCallback((current: SceneAsset[]) => {
    historyRef.current = [
      ...historyRef.current.slice(-MAX_HISTORY),
      JSON.parse(JSON.stringify(current)),
    ];
  }, []);

  const commit = useCallback(
    (updater: (prev: SceneAsset[]) => SceneAsset[]) => {
      setAssets((prev) => {
        pushHistory(prev);
        return updater(prev);
      });
    },
    [pushHistory],
  );

  const undo = useCallback(() => {
    if (historyRef.current.length === 0) return;
    setAssets(historyRef.current.pop()!);
  }, []);

  return { assets, commit, undo, canUndo: historyRef.current.length > 0 };
}

// ─── Asset Library Panel ──────────────────────────────────────────────────────

function AssetLibraryPanel({
  onAddAsset,
}: {
  onAddAsset: (asset: LibraryAsset) => void;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const [assets, setAssets] = useState<LibraryAsset[]>([]);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [loading, setLoading] = useState(false);
  const [panelHeight, setPanelHeight] = useState(220);
  const dragRef = useRef<{ startY: number; startH: number } | null>(null);

  // Fetch assets dari API
  useEffect(() => {
    setLoading(true);
    fetch("/api/assets")
      .then((r) => r.json())
      .then((data) => setAssets(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Drag to resize panel
  const handleDragStart = (e: React.MouseEvent) => {
    dragRef.current = { startY: e.clientY, startH: panelHeight };
    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      const delta = dragRef.current.startY - ev.clientY;
      setPanelHeight(
        Math.min(400, Math.max(120, dragRef.current.startH + delta)),
      );
    };
    const onUp = () => {
      dragRef.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };
  const filtered = useMemo(() => {
    return (
      assets?.data?.filter((a) => {
        const matchSearch = a.name.toLowerCase().includes(search.toLowerCase());
        return matchSearch;
      }) || []
    );
  }, [assets, search, activeCategory]);

  return (
    <div
      className="w-full bg-zinc-900/95 border-t border-white/10 flex flex-col backdrop-blur-md"
      style={{ height: isOpen ? panelHeight : 42 }}
    >
      {/* ── Header (drag handle + toggle) ── */}
      <div className="flex items-center gap-2 px-4 h-[42px] shrink-0 border-b border-white/10">
        {/* Drag handle */}
        <div
          onMouseDown={handleDragStart}
          className="cursor-row-resize text-white/20 hover:text-white/50 transition-colors"
          title="Drag to resize"
        >
          <GripHorizontal className="h-4 w-4" />
        </div>

        <Package className="h-4 w-4 text-white/40 shrink-0" />
        <span className="text-sm font-semibold text-white/70 uppercase tracking-wider">
          Asset Library
        </span>
        {isOpen && (
          <span className="text-sm text-white/30 ml-1">
            {filtered.length} assets
          </span>
        )}

        <div className="flex-1" />

        <button
          onClick={() => setIsOpen((v) => !v)}
          className="text-white/30 hover:text-white/70 transition-colors"
        >
          <ChevronDown
            className={`h-4 w-4 transition-transform ${isOpen ? "rotate-0" : "rotate-180"}`}
          />
        </button>
      </div>

      {/* ── Body ── */}
      {isOpen && (
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Search + Filter */}
          <div className="flex items-center gap-2 px-4 py-2 shrink-0">
            {/* Search */}
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
              <Input
                placeholder="Search assets..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-sm bg-zinc-800 border-zinc-700 text-white placeholder:text-white/30"
              />
            </div>

            {/* ✅ Category filter — fix radio button lari */}
            {/* <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`shrink-0 px-3 py-1 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                    activeCategory === cat
                      ? "bg-primary text-primary-foreground"
                      : "bg-zinc-800 text-white/50 hover:bg-zinc-700 hover:text-white"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div> */}
          </div>

          {/* Asset Grid */}
          <div className="flex-1 overflow-x-auto overflow-y-hidden px-4 pb-3">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-white/30 text-sm">Loading assets...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-white/20 text-sm">No assets found</p>
              </div>
            ) : (
              <div className="flex gap-3 h-full items-center">
                {filtered.map((asset) => (
                  <button
                    key={asset.id}
                    onClick={() => onAddAsset(asset)}
                    title={`Add "${asset.name}" to scene`}
                    className="shrink-0 w-24 flex flex-col items-center gap-1.5 p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 hover:ring-1 hover:ring-primary/50 transition-all group"
                  >
                    {/* Thumbnail */}
                    <div className="w-16 h-16 rounded-md bg-zinc-700 overflow-hidden flex items-center justify-center">
                      {asset.thumbnailUrl ? (
                        <img
                          src={asset.thumbnailUrl}
                          alt={asset.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <Package className="h-7 w-7 text-white/20" />
                      )}
                    </div>
                    {/* Name */}
                    <span className="text-xs text-white/60 group-hover:text-white/90 truncate w-full text-center transition-colors">
                      {asset.name}
                    </span>
                    {/* Category badge */}
                    <span className="text-xs text-white/30 truncate w-full text-center">
                      {asset.category}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Scene Hierarchy ──────────────────────────────────────────────────────────

function SceneHierarchy({
  assets,
  selectedId,
  onSelect,
  onToggleVisibility,
  onDelete,
  onRename,
}: {
  assets: SceneAsset[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, name: string) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const startEdit = (asset: SceneAsset) => {
    setEditingId(asset.id);
    setEditingName(asset.name);
    setTimeout(() => inputRef.current?.focus(), 0);
  };
  const commitEdit = () => {
    if (editingId && editingName.trim())
      onRename(editingId, editingName.trim());
    setEditingId(null);
  };
  const cancelEdit = () => setEditingId(null);

  return (
    <div className="w-64 h-full bg-zinc-900/90 border-r border-white/10 flex flex-col backdrop-blur-md">
      <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
        <Layers className="h-4 w-4 text-white/40" />
        <span className="text-sm font-semibold text-white/70 uppercase tracking-wider">
          Scene
        </span>
        <span className="ml-auto text-sm text-white/30">{assets.length}</span>
      </div>
      <div className="flex-1 overflow-y-auto py-1">
        {assets.length === 0 ? (
          <p className="text-white/20 text-sm text-center py-8">
            No assets in scene
          </p>
        ) : (
          assets.map((asset) => (
            <div
              key={asset.id}
              onClick={() => onSelect(asset.id)}
              className={`group flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors ${
                selectedId === asset.id
                  ? "bg-primary/20 border-l-2 border-primary"
                  : "hover:bg-white/5 border-l-2 border-transparent"
              }`}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleVisibility(asset.id);
                }}
                className="text-white/40 hover:text-white/80 transition-colors shrink-0"
              >
                {asset.visible ? (
                  <Eye className="h-4 w-4" />
                ) : (
                  <EyeOff className="h-4 w-4 text-white/20" />
                )}
              </button>

              {editingId === asset.id ? (
                <div
                  className="flex-1 flex items-center gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    ref={inputRef}
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitEdit();
                      if (e.key === "Escape") cancelEdit();
                    }}
                    className="flex-1 min-w-0 bg-zinc-700 text-white text-sm px-2 py-0.5 rounded border border-primary/50 outline-none"
                  />
                  <button
                    onClick={commitEdit}
                    className="text-green-400 hover:text-green-300"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="text-red-400 hover:text-red-300"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <>
                  <span
                    className={`flex-1 text-sm truncate ${asset.visible ? "text-white/80" : "text-white/30 line-through"}`}
                  >
                    {asset.name}
                  </span>
                  <div
                    className={`flex items-center gap-1 transition-opacity ${selectedId === asset.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startEdit(asset);
                      }}
                      className="text-white/30 hover:text-white/80 p-0.5 rounded"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(asset.id);
                      }}
                      className="text-white/30 hover:text-red-400 p-0.5 rounded"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Vec3 Input ───────────────────────────────────────────────────────────────

function Vec3Input({
  label,
  value,
  onChange,
  step = 0.1,
}: {
  label: string;
  value: Vec3;
  onChange: (v: Vec3) => void;
  step?: number;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm text-white/50 uppercase tracking-wider">
        {label}
      </Label>
      <div className="grid grid-cols-3 gap-1.5">
        {(["x", "y", "z"] as const).map((axis) => (
          <div key={axis} className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm font-bold text-white/30">
              {axis.toUpperCase()}
            </span>
            <Input
              type="number"
              step={step}
              value={round2(value[axis])}
              onChange={(e) =>
                onChange({ ...value, [axis]: parseFloat(e.target.value) || 0 })
              }
              className="pl-7 h-8 text-sm bg-zinc-800 border-zinc-700 text-white"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Sidebar Section ──────────────────────────────────────────────────────────

function SidebarSection({
  title,
  icon,
  children,
  defaultOpen = true,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between py-1.5 text-sm text-white/50 uppercase tracking-wider hover:text-white/80 transition-colors"
      >
        <span className="flex items-center gap-2">
          {icon}
          {title}
        </span>
        {open ? (
          <ChevronUp className="h-3.5 w-3.5" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5" />
        )}
      </button>
      {open && <div className="pt-2 space-y-3">{children}</div>}
    </div>
  );
}

// ─── Lighting Panel ───────────────────────────────────────────────────────────

function LightingPanel({
  lighting,
  onChange,
}: {
  lighting: LightingSettings;
  onChange: (l: LightingSettings) => void;
}) {
  return (
    <SidebarSection title="Lighting" icon={<Sun className="h-3.5 w-3.5" />}>
      <div className="space-y-1.5">
        <Label className="text-sm text-white/50">Environment</Label>
        {/* ✅ Fix: grid 2 kolom dengan sizing yang konsisten */}
        <div className="grid grid-cols-2 gap-1">
          {ENVIRONMENT_PRESETS.map((preset) => (
            <button
              key={preset}
              onClick={() => onChange({ ...lighting, preset })}
              className={`px-2 py-1.5 rounded text-sm capitalize transition-colors text-center ${
                lighting.preset === preset
                  ? "bg-primary text-primary-foreground"
                  : "bg-zinc-800 text-white/60 hover:bg-zinc-700 hover:text-white"
              }`}
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between">
          <Label className="text-sm text-white/50">Intensity</Label>
          <span className="text-sm text-white/40">
            {lighting.intensity.toFixed(1)}
          </span>
        </div>
        <Slider
          min={0}
          max={3}
          step={0.1}
          value={[lighting.intensity]}
          onValueChange={([v]) => onChange({ ...lighting, intensity: v })}
        />
      </div>

      <div className="flex items-center justify-between">
        <Label className="text-sm text-white/50">Ambient Color</Label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-white/40">{lighting.ambientColor}</span>
          <input
            type="color"
            value={lighting.ambientColor}
            onChange={(e) =>
              onChange({ ...lighting, ambientColor: e.target.value })
            }
            className="w-8 h-8 rounded cursor-pointer bg-transparent border border-zinc-700"
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Label className="text-sm text-white/50">Shadows</Label>
        <button
          onClick={() =>
            onChange({ ...lighting, shadowEnabled: !lighting.shadowEnabled })
          }
          className={`relative w-11 h-6 rounded-full transition-colors ${lighting.shadowEnabled ? "bg-primary" : "bg-zinc-700"}`}
        >
          <span
            className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${lighting.shadowEnabled ? "translate-x-6" : "translate-x-1"}`}
          />
        </button>
      </div>
    </SidebarSection>
  );
}

// ─── Right Sidebar ────────────────────────────────────────────────────────────

function RightSidebar({
  asset,
  mode,
  snapEnabled,
  axisLock,
  lighting,
  onSnapToggle,
  onAxisLock,
  onTransformChange,
  onReset,
  onLightingChange,
  onToggleAutoRotate,
}: {
  asset: SceneAsset | null;
  mode: "translate" | "rotate" | "scale";
  snapEnabled: boolean;
  axisLock: AxisLock;
  lighting: LightingSettings;
  onSnapToggle: () => void;
  onAxisLock: (axis: AxisLock) => void;
  onTransformChange: (id: string, transform: TransformData) => void;
  onReset: (id: string) => void;
  onLightingChange: (l: LightingSettings) => void;
  commit: (updater: (prev: SceneAsset[]) => SceneAsset[]) => void;
}) {
  return (
    <div className="w-72 h-full bg-zinc-900/90 border-l border-white/10 flex flex-col backdrop-blur-md overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <SidebarSection title="Animation">
          <div className="flex items-center justify-between">
            <Label className="text-sm text-white/50 font-medium">
              Auto Rotate Asset
            </Label>
            <button
              onClick={() => onToggleAutoRotate(asset.id)}
              className={`relative w-11 h-6 rounded-full transition-colors ${(asset?.autoRotate ?? false) ? "bg-primary" : "bg-zinc-700"}`}
            >
              <span
                className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${(asset?.autoRotate ?? false) ? "translate-x-6" : "translate-x-1"}`}
              />
            </button>
          </div>
        </SidebarSection>
        <SidebarSection title="Transform">
          {!asset ? (
            <p className="text-white/30 text-sm text-center py-3">
              Select an object to edit transform
            </p>
          ) : (
            <>
              <div>
                <p className="text-white font-semibold text-base truncate">
                  {asset.name}
                </p>
                <p className="text-white/30 text-sm">
                  {asset.id.slice(0, 8)}...
                </p>
              </div>
              <Button
                variant={snapEnabled ? "default" : "ghost"}
                size="sm"
                className="w-full justify-start gap-2 text-sm"
                onClick={onSnapToggle}
              >
                <span>⊞</span> Snap to Grid ({SNAP_VALUE})
              </Button>
              <div className="flex gap-1">
                {(["x", "y", "z"] as const).map((axis) => (
                  <Button
                    key={axis}
                    size="sm"
                    variant={axisLock === axis ? "default" : "ghost"}
                    className="flex-1 text-sm font-bold"
                    onClick={() => onAxisLock(axisLock === axis ? null : axis)}
                  >
                    <Lock className="h-3.5 w-3.5 mr-1" />
                    {axis.toUpperCase()}
                  </Button>
                ))}
              </div>
              <Vec3Input
                label="Position"
                value={asset.transform.position}
                onChange={(position) =>
                  onTransformChange(asset.id, { ...asset.transform, position })
                }
              />
              <Vec3Input
                label="Rotation"
                value={asset.transform.rotation}
                step={0.01}
                onChange={(rotation) =>
                  onTransformChange(asset.id, { ...asset.transform, rotation })
                }
              />
              <Vec3Input
                label="Scale"
                value={asset.transform.scale}
                onChange={(scale) =>
                  onTransformChange(asset.id, { ...asset.transform, scale })
                }
              />
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 text-sm text-white/60 hover:text-white"
                onClick={() => onReset(asset.id)}
              >
                <RotateCcw className="h-4 w-4" /> Reset Transform
              </Button>
            </>
          )}
        </SidebarSection>
        <Separator className="bg-white/10" />
        <LightingPanel lighting={lighting} onChange={onLightingChange} />
      </div>
    </div>
  );
}

// ─── Editable Asset ───────────────────────────────────────────────────────────

function EditableAsset({
  asset,
  isSelected,
  onSelect,
  onTransformChange,
  mode,
  snapEnabled,
  axisLock,
}: {
  asset: SceneAsset;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onTransformChange: (id: string, transform: TransformData) => void;
  mode: "translate" | "rotate" | "scale";
  snapEnabled: boolean;
  axisLock: AxisLock;
}) {
  const { scene } = useGLTF(asset.url);
  const meshRef = useRef<THREE.Group>(null);
  const [meshReady, setMeshReady] = useState(false);
  const clonedScene = useMemo(() => scene.clone(), [scene]);

  useFrame(() => {
    if (!meshReady && isSelected && meshRef.current?.parent) setMeshReady(true);
    if (!isSelected && meshReady) setMeshReady(false);
  });

  useFrame((state, delta) => {
    if (meshRef.current && asset.isAutoRotate) {
      // Tambahkan flag isAutoRotate di state asset
      meshRef.current.rotation.y += delta * 0.5; // Putar pada sumbu Y
    }
  });

  useEffect(() => {
    if (meshRef.current) meshRef.current.visible = asset.visible;
  }, [asset.visible]);

  useEffect(() => {
    if (!meshRef.current || isSelected) return;
    const { position, rotation, scale } = asset.transform;
    meshRef.current.position.set(position.x, position.y, position.z);
    meshRef.current.rotation.set(rotation.x, rotation.y, rotation.z);
    meshRef.current.scale.set(scale.x, scale.y, scale.z);
  }, [asset.transform, isSelected]);

  const handleChange = useCallback(() => {
    if (!meshRef.current) return;
    const { position, rotation, scale } = meshRef.current;
    let pos: Vec3 = { x: position.x, y: position.y, z: position.z };
    const rot: Vec3 = { x: rotation.x, y: rotation.y, z: rotation.z };
    const scl: Vec3 = { x: scale.x, y: scale.y, z: scale.z };

    if (snapEnabled && mode === "translate") {
      pos = snapVec3(pos, SNAP_VALUE);
      meshRef.current.position.set(pos.x, pos.y, pos.z);
    }
    if (axisLock && mode === "translate") {
      const original = asset.transform.position;
      if (axisLock !== "x") pos.x = original.x;
      if (axisLock !== "y") pos.y = original.y;
      if (axisLock !== "z") pos.z = original.z;
      meshRef.current.position.set(pos.x, pos.y, pos.z);
    }
    onTransformChange(asset.id, { position: pos, rotation: rot, scale: scl });
  }, [
    asset.id,
    asset.transform.position,
    mode,
    snapEnabled,
    axisLock,
    onTransformChange,
  ]);

  return (
    <>
      <primitive
        ref={meshRef}
        object={clonedScene}
        position={vec3ToArray(asset.transform.position)}
        rotation={vec3ToArray(asset.transform.rotation)}
        scale={vec3ToArray(asset.transform.scale)}
        onClick={(e: any) => {
          e.stopPropagation();
          if (asset.visible) onSelect(asset.id);
        }}
      />
      {isSelected && meshReady && meshRef.current && (
        <TransformControls
          object={meshRef.current}
          mode={mode}
          onObjectChange={handleChange}
        />
      )}
    </>
  );
}

// ─── Main Editor ──────────────────────────────────────────────────────────────

export default function ProjectEditorClient({ data }: { data: any }) {
  const {
    assets: sceneAssets,
    commit,
    undo,
    canUndo,
  } = useUndoHistory(
    data.sceneAssets.map((a: any) => ({
      ...a,
      defaultTransform: a.transform,
      visible: true,
    })),
  );

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<"translate" | "rotate" | "scale">(
    "translate",
  );
  const [snapEnabled, setSnapEnabled] = useState(false);
  const [axisLock, setAxisLock] = useState<AxisLock>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lighting, setLighting] = useState<LightingSettings>({
    preset: data.settings.lighting.type || "studio",
    intensity: data.settings.lighting.intensity ?? 1,
    ambientColor: data.settings.lighting.color || "#ffffff",
    shadowEnabled: data.settings.lighting.shadowEnabled ?? true,
  });

  const selectedAsset = sceneAssets.find((a) => a.id === selectedId) ?? null;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo]);

  const handleTransformChange = useCallback(
    (id: string, transform: TransformData) => {
      commit((prev) =>
        prev.map((a) => (a.id === id ? { ...a, transform } : a)),
      );
    },
    [commit],
  );

  const handleReset = useCallback(
    (id: string) => {
      commit((prev) =>
        prev.map((a) =>
          a.id === id ? { ...a, transform: a.defaultTransform } : a,
        ),
      );
    },
    [commit],
  );

  const handleToggleAutoRotate = useCallback(
    (id: string) => {
      commit((prev) =>
        prev.map((a) =>
          a.id === id ? { ...a, autoRotate: !a.autoRotate } : a,
        ),
      );
    },
    [commit],
  );

  const handleToggleVisibility = useCallback(
    (id: string) => {
      commit((prev) =>
        prev.map((a) => (a.id === id ? { ...a, visible: !a.visible } : a)),
      );
      setSelectedId((prev) => (prev === id ? null : prev));
    },
    [commit],
  );

  const handleDelete = useCallback(
    (id: string) => {
      commit((prev) => prev.filter((a) => a.id !== id));
      setSelectedId((prev) => (prev === id ? null : prev));
    },
    [commit],
  );

  const handleRename = useCallback(
    (id: string, name: string) => {
      commit((prev) => prev.map((a) => (a.id === id ? { ...a, name } : a)));
    },
    [commit],
  );

  // ✅ Tambah asset dari library ke scene
  const handleAddAsset = useCallback(
    (libraryAsset: LibraryAsset) => {
      const newAsset: SceneAsset = {
        id: crypto.randomUUID(),
        name: libraryAsset.name,
        url: libraryAsset.url,
        autoRotate: false,
        transform: {
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
        },
        defaultTransform: {
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
        },
        visible: true,
      };
      commit((prev) => [...prev, newAsset]);
      setSelectedId(newAsset.id);
    },
    [commit],
  );

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await fetch(`/api/projects/${data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sceneAssets, lighting }),
      });
    } catch (err) {
      console.error("Failed to save:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    // ✅ Layout: flex column agar panel bawah bisa mengisi lebar penuh
    <div className="h-full w-full flex flex-col bg-zinc-950">
      {/* Row atas: hierarchy + canvas + sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* PANEL KIRI */}
        <SceneHierarchy
          assets={sceneAssets}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onToggleVisibility={handleToggleVisibility}
          onDelete={handleDelete}
          onRename={handleRename}
        />

        {/* CANVAS */}
        <div className="flex-1 relative">
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 flex gap-2 bg-zinc-900/80 p-2 rounded-xl border border-white/10 backdrop-blur-md">
            {(["translate", "rotate", "scale"] as const).map((m) => (
              <Button
                key={m}
                variant={mode === m ? "default" : "ghost"}
                size="icon"
                onClick={() => setMode(m)}
              >
                {m === "translate" && <Move className="h-4 w-4" />}
                {m === "rotate" && <RotateCw className="h-4 w-4" />}
                {m === "scale" && <Maximize className="h-4 w-4" />}
              </Button>
            ))}
            <div className="w-[1px] bg-white/10 mx-1" />
            <Button
              variant="ghost"
              size="icon"
              onClick={undo}
              disabled={!canUndo}
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="h-4 w-4" />
            </Button>
            <div className="w-[1px] bg-white/10 mx-1" />
            <Button onClick={handleSave} disabled={isSaving} className="gap-2">
              <Save className="h-4 w-4" />
              {isSaving ? "Saving..." : "Save Layout"}
            </Button>
          </div>

          <Canvas
            shadows={lighting.shadowEnabled}
            camera={{ position: [5, 5, 5], fov: 50 }}
            onPointerMissed={() => setSelectedId(null)}
            className="h-full w-full"
          >
            <Suspense fallback={null}>
              <Environment
                preset={lighting.preset as any}
                environmentIntensity={lighting.intensity}
              />
              <ambientLight
                color={lighting.ambientColor}
                intensity={lighting.intensity * 0.5}
              />
              {snapEnabled && (
                <Grid
                  args={[20, 20]}
                  cellSize={SNAP_VALUE}
                  cellColor="#ffffff10"
                  sectionColor="#ffffff20"
                  fadeDistance={30}
                  position={[0, -0.01, 0]}
                />
              )}
              <group>
                {sceneAssets.map((asset) => (
                  <EditableAsset
                    key={asset.id}
                    asset={asset}
                    mode={mode}
                    isSelected={selectedId === asset.id}
                    onSelect={setSelectedId}
                    onTransformChange={handleTransformChange}
                    snapEnabled={snapEnabled}
                    axisLock={axisLock}
                  />
                ))}
              </group>
              {lighting.shadowEnabled && (
                <ContactShadows
                  position={[0, -0.01, 0]}
                  opacity={0.4}
                  scale={20}
                  blur={2}
                />
              )}
              <OrbitControls makeDefault enabled={selectedId === null} />
            </Suspense>
          </Canvas>

          <div className="absolute bottom-6 left-6 text-white/40 text-sm space-y-0.5">
            <p>
              Click object to select · Drag gizmo to transform · Click
              background to deselect
            </p>
            <p className="text-white/25">
              Ctrl+Z to undo · Max {MAX_HISTORY} steps
            </p>
          </div>
        </div>

        {/* SIDEBAR KANAN */}
        <RightSidebar
          asset={selectedAsset}
          mode={mode}
          snapEnabled={snapEnabled}
          onToggleAutoRotate={handleToggleAutoRotate}
          axisLock={axisLock}
          lighting={lighting}
          onSnapToggle={() => setSnapEnabled((v) => !v)}
          onAxisLock={setAxisLock}
          onTransformChange={handleTransformChange}
          onReset={handleReset}
          onLightingChange={setLighting}
        />
      </div>

      {/* PANEL BAWAH — Asset Library */}
      <AssetLibraryPanel onAddAsset={handleAddAsset} />
    </div>
  );
}
