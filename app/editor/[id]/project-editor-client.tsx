"use client";

import { Canvas, useThree } from "@react-three/fiber";
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
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  GripHorizontal,
  Camera,
  Bookmark,
  RefreshCw,
  Focus,
  Box,
  Square,
  Clock,
  Copy,
} from "lucide-react";
import * as THREE from "three";
import { useDebounce } from "@/hooks/use-debounce";

// ─── Types ───────────────────────────────────────────────────────────────────

type Vec3 = { x: number; y: number; z: number };
type TransformData = { position: Vec3; rotation: Vec3; scale: Vec3 };
type SceneAsset = {
  id: string;
  name: string;
  url: string;
  assetId: string;
  transform: TransformData;
  defaultTransform: TransformData;
  visible: boolean;
  autoRotate: boolean;
  autoRotateSpeed: number;
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
type AssetLibraryResponse = {
  data: LibraryAsset[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
  };
};
type CameraBookmark = {
  id: string;
  name: string;
  position: [number, number, number];
  target: [number, number, number];
};
type HistorySnapshot = SceneAsset[];
type GeneratedEmbed = {
  embedUrl: string;
  iframeCode: string;
  updatedAt?: string | null;
};
type EmbedDomainRecord = {
  id: string;
  domain: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const SNAP_VALUE = 0.5;
const MAX_HISTORY = 50;
const AUTOSAVE_INTERVAL = 30_000;
const DEFAULT_CAM_POSITION: [number, number, number] = [5, 5, 5];
const DEFAULT_CAM_TARGET: [number, number, number] = [0, 0, 0];

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
function toProxyUrl(url: string) {
  if (
    !url ||
    url.startsWith("blob:") ||
    url.startsWith("/") ||
    url.startsWith("data:")
  )
    return url;
  return `/api/proxy?url=${encodeURIComponent(url)}`;
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

// ─── Camera Controller ────────────────────────────────────────────────────────

function CameraController({
  orbitRef,
  globalAutoRotate,
  globalAutoRotateSpeed,
  selectedId,
  onCameraChange,
}: {
  orbitRef: React.MutableRefObject<any>;
  globalAutoRotate: boolean;
  globalAutoRotateSpeed: number;
  selectedId: string | null;
  onCameraChange: (
    pos: [number, number, number],
    target: [number, number, number],
  ) => void;
}) {
  const { camera } = useThree();

  useFrame(() => {
    if (orbitRef.current) {
      const pos = camera.position;
      const tar = orbitRef.current.target;
      onCameraChange([pos.x, pos.y, pos.z], [tar.x, tar.y, tar.z]);
    }
  });

  return (
    <OrbitControls
      ref={orbitRef}
      makeDefault
      enabled={selectedId === null}
      autoRotate={globalAutoRotate}
      autoRotateSpeed={globalAutoRotateSpeed}
    />
  );
}

// ─── Focus Helper ─────────────────────────────────────────────────────────────
function FocusHelper({
  targetAssetId,
  sceneAssets,
  orbitRef,
  onDone,
}: {
  targetAssetId: string | null;
  sceneAssets: SceneAsset[];
  orbitRef: React.MutableRefObject<any>;
  onDone: () => void;
}) {
  const { camera } = useThree();

  useEffect(() => {
    if (!targetAssetId || !orbitRef.current) return;
    const asset = sceneAssets.find((a) => a.id === targetAssetId);
    if (!asset) return;

    const { x, y, z } = asset.transform.position;
    const target = new THREE.Vector3(x, y, z);

    // ✅ Hitung jarak berdasarkan scale object
    const scale = asset.transform.scale;
    const maxScale = Math.max(scale.x, scale.y, scale.z);
    const distance = Math.max(4, maxScale * 6); // minimum 4, scale dengan ukuran object

    // Arahkan kamera dari sudut yang sama tapi lebih jauh
    const currentDir = camera.position
      .clone()
      .sub(orbitRef.current.target)
      .normalize();
    const newPos = target.clone().add(currentDir.multiplyScalar(distance));

    camera.position.copy(newPos);
    orbitRef.current.target.copy(target);
    orbitRef.current.update();
    onDone();
  }, [targetAssetId]);

  return null;
}

// ─── Thumbnail Capturer ───────────────────────────────────────────────────────

function ThumbnailCapturer({
  triggerRef,
  onCapture,
}: {
  triggerRef: React.MutableRefObject<(() => void) | null>;
  onCapture: (dataUrl: string) => void;
}) {
  const { gl, scene, camera } = useThree();

  useEffect(() => {
    triggerRef.current = () => {
      gl.render(scene, camera);
      onCapture(gl.domElement.toDataURL("image/jpeg", 0.8));
    };
  }, [gl, scene, camera, onCapture, triggerRef]);

  return null;
}

// ─── Per-Asset Rotator ────────────────────────────────────────────────────────

function RotatingAsset({
  meshRef,
  speed,
}: {
  meshRef: React.MutableRefObject<THREE.Group | null>;
  speed: number;
}) {
  useFrame((_, delta) => {
    if (meshRef.current) meshRef.current.rotation.y += delta * speed;
  });
  return null;
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
  const { scene } = useGLTF(asset.url || "/fallback.glb");
  const meshRef = useRef<THREE.Group>(null);
  const [meshReady, setMeshReady] = useState(false);
  const clonedScene = useMemo(() => scene.clone(), [scene]);

  useFrame(() => {
    if (!meshReady && isSelected && meshRef.current?.parent) setMeshReady(true);
    if (!isSelected && meshReady) setMeshReady(false);
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
      {asset.autoRotate && !isSelected && (
        <RotatingAsset meshRef={meshRef} speed={asset.autoRotateSpeed} />
      )}
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

// ─── Scene Hierarchy ──────────────────────────────────────────────────────────

function SceneHierarchy({
  assets,
  selectedId,
  onSelect,
  onToggleVisibility,
  onDelete,
  onRename,
  onDuplicate,
}: {
  assets: SceneAsset[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onDuplicate: (id: string) => void;
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
                className="text-white/40 hover:text-white/80 shrink-0"
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
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    className="flex-1 min-w-0 bg-zinc-700 text-white text-sm px-2 py-0.5 rounded border border-primary/50 outline-none"
                  />
                  <button onClick={commitEdit} className="text-green-400">
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="text-red-400"
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
                      className="text-white/30 hover:text-white/80 p-0.5"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDuplicate(asset.id);
                      }}
                      className="text-white/30 hover:text-blue-400 p-0.5"
                      title="Duplicate"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(asset.id);
                      }}
                      className="text-white/30 hover:text-red-400 p-0.5"
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

      {/* ✅ shadcn Switch */}
      <div className="flex items-center justify-between">
        <Label
          htmlFor="shadow-switch"
          className="text-sm text-white/50 cursor-pointer"
        >
          Shadows
        </Label>
        <Switch
          id="shadow-switch"
          checked={lighting.shadowEnabled}
          onCheckedChange={(checked) =>
            onChange({ ...lighting, shadowEnabled: checked })
          }
        />
      </div>
    </SidebarSection>
  );
}

// ─── Camera Section ───────────────────────────────────────────────────────────

function CameraSection({
  isOrthographic,
  globalAutoRotate,
  globalAutoRotateSpeed,
  bookmarks,
  selectedId,
  onToggleOrtho,
  onResetCamera,
  onFocus,
  onToggleAutoRotate,
  onAutoRotateSpeed,
  onSaveBookmark,
  onLoadBookmark,
  onDeleteBookmark,
}: {
  isOrthographic: boolean;
  globalAutoRotate: boolean;
  globalAutoRotateSpeed: number;
  bookmarks: CameraBookmark[];
  selectedId: string | null;
  onToggleOrtho: () => void;
  onResetCamera: () => void;
  onFocus: () => void;
  onToggleAutoRotate: () => void;
  onAutoRotateSpeed: (v: number) => void;
  onSaveBookmark: () => void;
  onLoadBookmark: (bm: CameraBookmark) => void;
  onDeleteBookmark: (id: string) => void;
}) {
  return (
    <SidebarSection
      title="Camera"
      icon={<Camera className="h-3.5 w-3.5" />}
      defaultOpen={false}
    >
      {/* Perspective / Orthographic */}
      <div className="flex items-center justify-between">
        <Label className="text-sm text-white/50">Projection</Label>
        <div className="flex gap-1">
          <button
            onClick={() => isOrthographic && onToggleOrtho()}
            className={`px-2.5 py-1 rounded text-sm transition-colors ${!isOrthographic ? "bg-primary text-primary-foreground" : "bg-zinc-800 text-white/50 hover:bg-zinc-700"}`}
          >
            Persp
          </button>
          <button
            onClick={() => !isOrthographic && onToggleOrtho()}
            className={`px-2.5 py-1 rounded text-sm transition-colors ${isOrthographic ? "bg-primary text-primary-foreground" : "bg-zinc-800 text-white/50 hover:bg-zinc-700"}`}
          >
            Ortho
          </button>
        </div>
      </div>

      {/* Reset + Focus */}
      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 gap-1.5 text-sm"
          onClick={onResetCamera}
        >
          <RotateCcw className="h-3.5 w-3.5" /> Reset
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 gap-1.5 text-sm"
          onClick={onFocus}
          disabled={!selectedId}
        >
          <Focus className="h-3.5 w-3.5" /> Focus (F)
        </Button>
      </div>

      {/* ✅ shadcn Switch — Auto Rotate Scene */}
      <div className="flex items-center justify-between">
        <Label
          htmlFor="global-rotate-switch"
          className="text-sm text-white/50 cursor-pointer"
        >
          Auto Rotate Scene
        </Label>
        <Switch
          id="global-rotate-switch"
          checked={globalAutoRotate}
          onCheckedChange={onToggleAutoRotate}
        />
      </div>
      {globalAutoRotate && (
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label className="text-sm text-white/50">Speed</Label>
            <span className="text-sm text-white/40">
              {globalAutoRotateSpeed.toFixed(1)}
            </span>
          </div>
          <Slider
            min={0.1}
            max={5}
            step={0.1}
            value={[globalAutoRotateSpeed]}
            onValueChange={([v]) => onAutoRotateSpeed(v)}
          />
        </div>
      )}

      {/* Camera Bookmarks */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm text-white/50">Bookmarks</Label>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs gap-1"
            onClick={onSaveBookmark}
          >
            <Bookmark className="h-3 w-3" /> Save view
          </Button>
        </div>
        {bookmarks.length === 0 ? (
          <p className="text-xs text-white/20 text-center py-1">
            No bookmarks yet
          </p>
        ) : (
          <div className="space-y-1">
            {bookmarks.map((bm) => (
              <div key={bm.id} className="flex items-center gap-1 group">
                <button
                  onClick={() => onLoadBookmark(bm)}
                  className="flex-1 text-left px-2 py-1.5 rounded text-sm text-white/60 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-2"
                >
                  <Camera className="h-3.5 w-3.5 shrink-0 text-white/30" />
                  <span className="truncate">{bm.name}</span>
                </button>
                <button
                  onClick={() => onDeleteBookmark(bm.id)}
                  className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 p-1 transition-all"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
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
  onToggleAssetAutoRotate,
  onAssetAutoRotateSpeed,
  isOrthographic,
  globalAutoRotate,
  globalAutoRotateSpeed,
  bookmarks,
  selectedId,
  onToggleOrtho,
  onResetCamera,
  onFocus,
  onToggleAutoRotate,
  onAutoRotateSpeed,
  onSaveBookmark,
  onLoadBookmark,
  onDeleteBookmark,
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
  onToggleAssetAutoRotate: (id: string) => void;
  onAssetAutoRotateSpeed: (id: string, speed: number) => void;
  isOrthographic: boolean;
  globalAutoRotate: boolean;
  globalAutoRotateSpeed: number;
  bookmarks: CameraBookmark[];
  selectedId: string | null;
  onToggleOrtho: () => void;
  onResetCamera: () => void;
  onFocus: () => void;
  onToggleAutoRotate: () => void;
  onAutoRotateSpeed: (v: number) => void;
  onSaveBookmark: () => void;
  onLoadBookmark: (bm: CameraBookmark) => void;
  onDeleteBookmark: (id: string) => void;
}) {
  return (
    <div className="w-72 h-full bg-zinc-900/90 border-l border-white/10 flex flex-col backdrop-blur-md overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Transform */}
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

              {/* ✅ shadcn Switch — Snap */}
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="snap-switch"
                  className="text-sm text-white/50 cursor-pointer"
                >
                  Snap to Grid ({SNAP_VALUE})
                </Label>
                <Switch
                  id="snap-switch"
                  checked={snapEnabled}
                  onCheckedChange={onSnapToggle}
                />
              </div>

              {/* Axis Lock */}
              <div className="space-y-1.5">
                <Label className="text-sm text-white/50">Axis Lock</Label>
                <div className="flex gap-1">
                  {(["x", "y", "z"] as const).map((axis) => (
                    <Button
                      key={axis}
                      size="sm"
                      variant={axisLock === axis ? "default" : "ghost"}
                      className="flex-1 text-sm font-bold"
                      onClick={() =>
                        onAxisLock(axisLock === axis ? null : axis)
                      }
                    >
                      <Lock className="h-3.5 w-3.5 mr-1" />
                      {axis.toUpperCase()}
                    </Button>
                  ))}
                </div>
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

              <Separator className="bg-white/10" />

              {/* ✅ shadcn Switch — Per-asset Auto Rotate */}
              <div className="flex items-center justify-between">
                <Label
                  htmlFor={`autorotate-${asset.id}`}
                  className="text-sm text-white/50 cursor-pointer"
                >
                  Auto Rotate
                </Label>
                <Switch
                  id={`autorotate-${asset.id}`}
                  checked={asset.autoRotate}
                  onCheckedChange={() => onToggleAssetAutoRotate(asset.id)}
                />
              </div>
              {asset.autoRotate && (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-sm text-white/50">Speed</Label>
                    <span className="text-sm text-white/40">
                      {asset.autoRotateSpeed.toFixed(1)}
                    </span>
                  </div>
                  <Slider
                    min={0.1}
                    max={5}
                    step={0.1}
                    value={[asset.autoRotateSpeed]}
                    onValueChange={([v]) => onAssetAutoRotateSpeed(asset.id, v)}
                  />
                </div>
              )}
            </>
          )}
        </SidebarSection>

        <Separator className="bg-white/10" />
        <LightingPanel lighting={lighting} onChange={onLightingChange} />
        <Separator className="bg-white/10" />
        <CameraSection
          isOrthographic={isOrthographic}
          globalAutoRotate={globalAutoRotate}
          globalAutoRotateSpeed={globalAutoRotateSpeed}
          bookmarks={bookmarks}
          selectedId={selectedId}
          onToggleOrtho={onToggleOrtho}
          onResetCamera={onResetCamera}
          onFocus={onFocus}
          onToggleAutoRotate={onToggleAutoRotate}
          onAutoRotateSpeed={onAutoRotateSpeed}
          onSaveBookmark={onSaveBookmark}
          onLoadBookmark={onLoadBookmark}
          onDeleteBookmark={onDeleteBookmark}
        />
      </div>
    </div>
  );
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
  const debouncedSearch = useDebounce(search, 350);
  const [loading, setLoading] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [totalAssets, setTotalAssets] = useState(0);
  const [panelHeight, setPanelHeight] = useState(220);
  const dragRef = useRef<{ startY: number; startH: number } | null>(null);
  const [page, setPage] = useState(1);
  const requestedPage = search === debouncedSearch ? page : 1;

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    fetch(
      `/api/assets?q=${encodeURIComponent(debouncedSearch)}&page=${requestedPage}&limit=12`,
    )
      .then((r) => r.json())
      .then((data: AssetLibraryResponse) => {
        if (cancelled) return;
        setAssets(data?.data || []);
        setHasNextPage(Boolean(data?.pagination?.hasNextPage));
        setTotalAssets(data?.pagination?.total || 0);
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, requestedPage]);

  const handleDragStart = (e: React.MouseEvent) => {
    dragRef.current = { startY: e.clientY, startH: panelHeight };
    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      setPanelHeight(
        Math.min(
          400,
          Math.max(
            120,
            dragRef.current.startH + (dragRef.current.startY - ev.clientY),
          ),
        ),
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

  return (
    <div
      className="w-full bg-zinc-900/95 border-t border-white/10 flex flex-col backdrop-blur-md"
      style={{ height: isOpen ? panelHeight : 42 }}
    >
      <div className="flex items-center gap-2 px-4 h-[42px] shrink-0 border-b border-white/10">
        <div
          onMouseDown={handleDragStart}
          className="cursor-row-resize text-white/20 hover:text-white/50"
        >
          <GripHorizontal className="h-4 w-4" />
        </div>
        <Package className="h-4 w-4 text-white/40 shrink-0" />
        <span className="text-sm font-semibold text-white/70 uppercase tracking-wider">
          Asset Library
        </span>
        {isOpen && (
          <span className="text-sm text-white/30 ml-1">
            {totalAssets} assets
          </span>
        )}
        <div className="flex-1" />
        <button
          onClick={() => setIsOpen((v) => !v)}
          className="text-white/30 hover:text-white/70"
        >
          <ChevronDown
            className={`h-4 w-4 transition-transform ${isOpen ? "rotate-0" : "rotate-180"}`}
          />
        </button>
      </div>
      {isOpen && (
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2 shrink-0">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
              <Input
                placeholder="Search assets..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-sm bg-zinc-800 border-zinc-700 text-white placeholder:text-white/30"
              />
            </div>
          </div>
          <div className="flex-1 overflow-x-auto overflow-y-hidden px-4 pb-3">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-white/30 text-sm">Loading assets...</p>
              </div>
            ) : assets.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-white/20 text-sm">No assets found</p>
              </div>
            ) : (
              <div className="flex gap-3 h-full items-start">
                {assets.map((asset) => (
                  <button
                    key={asset.id}
                    onClick={() => onAddAsset(asset)}
                    className="shrink-0 w-24 flex flex-col items-center gap-1.5 p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 hover:ring-1 hover:ring-primary/50 transition-all group"
                  >
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
                    <span className="text-xs text-white/60 group-hover:text-white/90 truncate w-full text-center">
                      {asset.name}
                    </span>
                    <span className="text-xs text-white/30 truncate w-full text-center">
                      {asset.category}
                    </span>
                  </button>
                ))}
                <div className="shrink-0 flex h-full items-start">
                  <div className="flex flex-col gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={requestedPage === 1 || loading}
                      onClick={() =>
                        setPage((current) =>
                          Math.max(
                            1,
                            (search === debouncedSearch ? current : 1) - 1,
                          ),
                        )
                      }
                    >
                      Prev
                    </Button>
                    <div className="text-center text-xs text-white/40">
                      Page {requestedPage}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={!hasNextPage || loading}
                      onClick={() =>
                        setPage(
                          (current) =>
                            (search === debouncedSearch ? current : 1) + 1,
                        )
                      }
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Auto Fit Camera ──────────────────────────────────────────────────────────
function AutoFitCamera({
  sceneAssets,
  orbitRef,
  done,
  onDone,
}: {
  sceneAssets: SceneAsset[];
  orbitRef: React.MutableRefObject<any>;
  done: boolean;
  onDone: () => void;
}) {
  const { camera, scene } = useThree();

  useEffect(() => {
    if (done || !orbitRef.current || sceneAssets.length === 0) return;

    // Tunggu scene benar-benar populated
    const timer = setTimeout(() => {
      const box = new THREE.Box3();

      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          box.expandByObject(obj);
        }
      });

      if (box.isEmpty()) return;

      const center = new THREE.Vector3();
      const size = new THREE.Vector3();
      box.getCenter(center);
      box.getSize(size);

      const maxDim = Math.max(size.x, size.y, size.z);
      const fov = (camera as THREE.PerspectiveCamera).fov * (Math.PI / 180);
      const distance = Math.abs(maxDim / Math.sin(fov / 2)) * 0.9;

      camera.position.set(
        center.x + distance * 0.6,
        center.y + distance * 0.4,
        center.z + distance * 0.6,
      );

      orbitRef.current.target.copy(center);
      orbitRef.current.update();
      onDone();
    }, 500); // delay 500ms biar asset sempat load

    return () => clearTimeout(timer);
  }, [done]);

  return null;
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
      assetId: a.assetId ?? a.id,
      url: toProxyUrl(a.url),
      defaultTransform: a.transform,
      visible: true,
      autoRotate: false,
      autoRotateSpeed: 1,
    })),
  );

  const [cameraFitted, setCameraFitted] = useState(false);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<"translate" | "rotate" | "scale">(
    "translate",
  );
  const [snapEnabled, setSnapEnabled] = useState(false);
  const [axisLock, setAxisLock] = useState<AxisLock>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [focusTargetId, setFocusTargetId] = useState<string | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [copiedTarget, setCopiedTarget] = useState<"url" | "iframe" | null>(
    null,
  );
  const [baseUrl, setBaseUrl] = useState("");
  const [isGeneratingEmbed, setIsGeneratingEmbed] = useState(false);
  const [embedError, setEmbedError] = useState<string | null>(null);
  const [generatedEmbed, setGeneratedEmbed] = useState<GeneratedEmbed | null>(
    null,
  );
  const [embedDomains, setEmbedDomains] = useState<EmbedDomainRecord[]>([]);
  const [embedDomainInput, setEmbedDomainInput] = useState("");
  const [isLoadingEmbedDomains, setIsLoadingEmbedDomains] = useState(false);
  const [isUpdatingEmbedDomains, setIsUpdatingEmbedDomains] = useState(false);
  const [embedDomainError, setEmbedDomainError] = useState<string | null>(null);

  // Camera
  const orbitRef = useRef<any>(null);
  const [isOrthographic, setIsOrthographic] = useState(false);
  const [globalAutoRotate, setGlobalAutoRotate] = useState(false);
  const [globalAutoRotateSpeed, setGlobalAutoRotateSpeed] = useState(1);
  const [bookmarks, setBookmarks] = useState<CameraBookmark[]>([]);
  const cameraPositionRef =
    useRef<[number, number, number]>(DEFAULT_CAM_POSITION);
  const cameraTargetRef = useRef<[number, number, number]>(DEFAULT_CAM_TARGET);
  const thumbnailTriggerRef = useRef<(() => void) | null>(null);

  const [lighting, setLighting] = useState<LightingSettings>({
    preset: data.settings.lighting.type || "studio",
    intensity: data.settings.lighting.intensity ?? 1,
    ambientColor: data.settings.lighting.color || "#ffffff",
    shadowEnabled: data.settings.lighting.shadowEnabled ?? true,
  });

  const selectedAsset = sceneAssets.find((a) => a.id === selectedId) ?? null;

  // Mark unsaved
  useEffect(() => {
    setHasUnsavedChanges(true);
  }, [sceneAssets, lighting]);

  useEffect(() => {
    setBaseUrl(window.location.origin);
  }, []);

  const loadEmbedDomains = useCallback(async () => {
    setIsLoadingEmbedDomains(true);
    setEmbedDomainError(null);

    try {
      const response = await fetch(`/api/projects/${data.id}/embed-domains`);
      const result = await response.json();

      if (!response.ok) {
        setEmbedDomainError(result.error || "Failed to load embed domains.");
        return;
      }

      setEmbedDomains(
        (result.domains ?? []).map((item: { id: string; domain: string }) => ({
          id: item.id,
          domain: item.domain,
        })),
      );
    } catch (error) {
      console.error("Failed to load embed domains:", error);
      setEmbedDomainError("Failed to load embed domains.");
    } finally {
      setIsLoadingEmbedDomains(false);
    }
  }, [data.id]);

  const hydrateEmbedAccess = useCallback(
    (result: {
      hasActiveToken?: boolean;
      activeToken?: string | null;
      updatedAt?: string | null;
    }) => {
      if (!result.hasActiveToken || !result.activeToken) {
        setGeneratedEmbed(null);
        return;
      }

      const embedUrl = `${baseUrl}/embed/${data.id}?token=${encodeURIComponent(result.activeToken)}`;
      const iframeCode = `<iframe src="${embedUrl}" width="100%" height="600" style="border:0;" loading="lazy" allowfullscreen></iframe>`;

      setGeneratedEmbed({
        embedUrl,
        iframeCode,
        updatedAt: result.updatedAt ?? null,
      });
    },
    [baseUrl, data.id],
  );

  const loadEmbedAccess = useCallback(async () => {
    setEmbedError(null);

    try {
      const response = await fetch(`/api/projects/${data.id}/embed-access`);
      const result = await response.json();

      if (!response.ok) {
        setEmbedError(result.error || "Failed to load embed URL.");
        return;
      }

      hydrateEmbedAccess(result);
    } catch (error) {
      console.error("Failed to load embed access:", error);
      setEmbedError("Failed to load embed URL.");
    }
  }, [data.id, hydrateEmbedAccess]);

  useEffect(() => {
    if (!isExportOpen) return;
    void loadEmbedDomains();
    void loadEmbedAccess();
  }, [isExportOpen, loadEmbedDomains, loadEmbedAccess]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        undo();
      }
      if ((e.key === "f" || e.key === "F") && selectedId)
        setFocusTargetId(selectedId);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, selectedId]);

  const doSave = useCallback(async () => {
    setIsSaving(true);
    try {
      if (thumbnailTriggerRef.current) thumbnailTriggerRef.current();
      console.log("DEBUG: Saving project", data.id);
      await fetch(`/api/projects/${data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sceneAssets,
          lighting,
          cameraSettings: {
            position: cameraPositionRef.current,
            target: cameraTargetRef.current,
          },
        }),
      });
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
    } catch (err) {
      console.error("Failed to save:", err);
    } finally {
      setIsSaving(false);
    }
  }, [sceneAssets, lighting, data.id]);
  console.log({ data });

  // Auto-save 30s
  useEffect(() => {
    const interval = setInterval(() => {
      if (hasUnsavedChanges) doSave();
    }, AUTOSAVE_INTERVAL);
    return () => clearInterval(interval);
  }, [hasUnsavedChanges, doSave]);

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

  const handleAddAsset = useCallback(
    (libraryAsset: LibraryAsset) => {
      const newAsset: SceneAsset = {
        id: crypto.randomUUID(),
        assetId: libraryAsset.id,
        name: libraryAsset.name,
        url: toProxyUrl(libraryAsset.url),
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
        autoRotate: false,
        autoRotateSpeed: 1,
      };
      commit((prev) => [...prev, newAsset]);
      setSelectedId(newAsset.id);
    },
    [commit],
  );

  const handleToggleAssetAutoRotate = useCallback(
    (id: string) => {
      commit((prev) =>
        prev.map((a) =>
          a.id === id ? { ...a, autoRotate: !a.autoRotate } : a,
        ),
      );
    },
    [commit],
  );

  const handleAssetAutoRotateSpeed = useCallback(
    (id: string, speed: number) => {
      commit((prev) =>
        prev.map((a) => (a.id === id ? { ...a, autoRotateSpeed: speed } : a)),
      );
    },
    [commit],
  );

  const handleSaveBookmark = useCallback(() => {
    setBookmarks((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: `View ${prev.length + 1}`,
        position: [...cameraPositionRef.current],
        target: [...cameraTargetRef.current],
      },
    ]);
  }, []);

  const handleLoadBookmark = useCallback((bm: CameraBookmark) => {
    if (!orbitRef.current) return;
    orbitRef.current.object.position.set(...bm.position);
    orbitRef.current.target.set(...bm.target);
    orbitRef.current.update();
  }, []);

  const handleDeleteBookmark = useCallback((id: string) => {
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const handleResetCamera = useCallback(() => {
    if (!orbitRef.current) return;
    orbitRef.current.object.position.set(...DEFAULT_CAM_POSITION);
    orbitRef.current.target.set(...DEFAULT_CAM_TARGET);
    orbitRef.current.update();
  }, []);

  const handleDuplicate = useCallback(
    (id: string) => {
      const original = sceneAssets.find((a) => a.id === id);
      if (!original) return;
      const duplicated: SceneAsset = {
        ...JSON.parse(JSON.stringify(original)), // deep clone
        id: crypto.randomUUID(),
        name: `${original.name} (copy)`,
        transform: {
          ...original.transform,
          position: {
            x: original.transform.position.x + 1, // ✅ offset sedikit agar tidak overlap
            y: original.transform.position.y,
            z: original.transform.position.z + 1,
          },
        },
      };
      commit((prev) => [...prev, duplicated]);
      setSelectedId(duplicated.id);
    },
    [sceneAssets, commit],
  );

  const handleCopyExport = useCallback(
    async (value: string, target: "url" | "iframe") => {
      try {
        await navigator.clipboard.writeText(value);
        setCopiedTarget(target);
        window.setTimeout(() => {
          setCopiedTarget((current) => (current === target ? null : current));
        }, 2000);
      } catch (error) {
        console.error("Failed to copy export value:", error);
      }
    },
    [],
  );

  const handleAddEmbedDomain = useCallback(async () => {
    const domain = embedDomainInput.trim();
    if (!domain) return;

    setIsUpdatingEmbedDomains(true);
    setEmbedDomainError(null);
    setGeneratedEmbed(null);

    try {
      const response = await fetch(`/api/projects/${data.id}/embed-domains`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain }),
      });
      const result = await response.json();

      if (!response.ok) {
        setEmbedDomainError(result.error || "Failed to add domain.");
        return;
      }

      setEmbedDomains((prev) => {
        const existing = prev.some((item) => item.id === result.domain.id);
        if (existing) return prev;
        return [...prev, result.domain].sort((a, b) =>
          a.domain.localeCompare(b.domain),
        );
      });
      setEmbedDomainInput("");
    } catch (error) {
      console.error("Failed to add embed domain:", error);
      setEmbedDomainError("Failed to add domain.");
    } finally {
      setIsUpdatingEmbedDomains(false);
    }
  }, [data.id, embedDomainInput]);

  const handleDeleteEmbedDomain = useCallback(
    async (domainId: string) => {
      setIsUpdatingEmbedDomains(true);
      setEmbedDomainError(null);
      setGeneratedEmbed(null);

      try {
        const response = await fetch(
          `/api/projects/${data.id}/embed-domains/${domainId}`,
          { method: "DELETE" },
        );
        const result = await response.json();

        if (!response.ok) {
          setEmbedDomainError(result.error || "Failed to delete domain.");
          return;
        }

        setEmbedDomains((prev) => prev.filter((item) => item.id !== domainId));
      } catch (error) {
        console.error("Failed to delete embed domain:", error);
        setEmbedDomainError("Failed to delete domain.");
      } finally {
        setIsUpdatingEmbedDomains(false);
      }
    },
    [data.id],
  );

  const handleGenerateEmbed = useCallback(async () => {
    setIsGeneratingEmbed(true);
    setEmbedError(null);

    try {
      const response = await fetch(`/api/projects/${data.id}/embed-access`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ensure",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setEmbedError(result.error || "Failed to generate embed token.");
        return;
      }

      hydrateEmbedAccess(result);
    } catch (error) {
      console.error("Failed to generate embed token:", error);
      setEmbedError("Failed to generate embed token.");
    } finally {
      setIsGeneratingEmbed(false);
    }
  }, [data.id, hydrateEmbedAccess]);

  const handleRegenerateEmbed = useCallback(async () => {
    setIsGeneratingEmbed(true);
    setEmbedError(null);

    try {
      const response = await fetch(`/api/projects/${data.id}/embed-access`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "regenerate",
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        setEmbedError(result.error || "Failed to regenerate embed token.");
        return;
      }

      hydrateEmbedAccess(result);
    } catch (error) {
      console.error("Failed to regenerate embed token:", error);
      setEmbedError("Failed to regenerate embed token.");
    } finally {
      setIsGeneratingEmbed(false);
    }
  }, [data.id, hydrateEmbedAccess]);

  const handleRevokeEmbed = useCallback(async () => {
    setIsGeneratingEmbed(true);
    setEmbedError(null);

    try {
      const response = await fetch(`/api/projects/${data.id}/embed-access`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "revoke" }),
      });
      const result = await response.json();

      if (!response.ok) {
        setEmbedError(result.error || "Failed to revoke embed access.");
        return;
      }

      setGeneratedEmbed(null);
    } catch (error) {
      console.error("Failed to revoke embed access:", error);
      setEmbedError("Failed to revoke embed access.");
    } finally {
      setIsGeneratingEmbed(false);
    }
  }, [data.id]);

  return (
    <div className="h-full w-full flex flex-col bg-zinc-950">
      <div className="flex flex-1 overflow-hidden">
        {/* PANEL KIRI */}
        <SceneHierarchy
          assets={sceneAssets}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onToggleVisibility={handleToggleVisibility}
          onDelete={handleDelete}
          onRename={handleRename}
          onDuplicate={handleDuplicate}
        />

        {/* CANVAS */}
        <div className="flex-1 relative">
          {/* TOOLBAR — bersih */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-zinc-900/80 p-2 rounded-xl border border-white/10 backdrop-blur-md">
            {(["translate", "rotate", "scale"] as const).map((m) => (
              <Button
                key={m}
                variant={mode === m ? "default" : "ghost"}
                size="icon"
                onClick={() => setMode(m)}
                title={m}
              >
                {m === "translate" && <Move className="h-4 w-4" />}
                {m === "rotate" && <RotateCw className="h-4 w-4" />}
                {m === "scale" && <Maximize className="h-4 w-4" />}
              </Button>
            ))}
            <div className="w-[1px] bg-white/10 h-6 mx-1" />
            <Button
              variant="ghost"
              size="icon"
              onClick={undo}
              disabled={!canUndo}
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="h-4 w-4" />
            </Button>
            <div className="w-[1px] bg-white/10 h-6 mx-1" />
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setIsExportOpen(true)}
                className="gap-2 border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white"
              >
                <Copy className="h-4 w-4" />
                Export
              </Button>
              {hasUnsavedChanges && (
                <span className="flex items-center gap-1.5 text-xs text-amber-400/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  Unsaved
                </span>
              )}
              {lastSaved && !hasUnsavedChanges && (
                <span className="flex items-center gap-1 text-xs text-white/30">
                  <Clock className="h-3 w-3" />
                  {lastSaved.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              )}
              <Button onClick={doSave} disabled={isSaving} className="gap-2">
                <Save className="h-4 w-4" />
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>

          <Canvas
            shadows={lighting.shadowEnabled}
            camera={{ position: DEFAULT_CAM_POSITION, fov: 50 }}
            onPointerMissed={() => setSelectedId(null)}
            className="h-full w-full"
            gl={{ preserveDrawingBuffer: true }}
          >
            <Suspense fallback={null}>
              <AutoFitCamera
                sceneAssets={sceneAssets}
                orbitRef={orbitRef}
                done={cameraFitted}
                onDone={() => setCameraFitted(true)}
              />
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
              <CameraController
                orbitRef={orbitRef}
                globalAutoRotate={globalAutoRotate}
                globalAutoRotateSpeed={globalAutoRotateSpeed}
                selectedId={selectedId}
                onCameraChange={(pos, tar) => {
                  cameraPositionRef.current = pos;
                  cameraTargetRef.current = tar;
                }}
              />
              <FocusHelper
                targetAssetId={focusTargetId}
                sceneAssets={sceneAssets}
                orbitRef={orbitRef}
                onDone={() => setFocusTargetId(null)}
              />
              <ThumbnailCapturer
                triggerRef={thumbnailTriggerRef}
                onCapture={(dataUrl) =>
                  console.log("Thumbnail:", dataUrl.slice(0, 50))
                }
              />
            </Suspense>
          </Canvas>

          <div className="absolute bottom-6 left-6 text-white/40 text-sm space-y-0.5">
            <p>Click object to select · Drag gizmo to transform · F to focus</p>
            <p className="text-white/25">
              Ctrl+Z to undo · Auto-save every 30s
            </p>
          </div>
        </div>

        {/* SIDEBAR KANAN */}
        <RightSidebar
          asset={selectedAsset}
          mode={mode}
          snapEnabled={snapEnabled}
          axisLock={axisLock}
          lighting={lighting}
          onSnapToggle={() => setSnapEnabled((v) => !v)}
          onAxisLock={setAxisLock}
          onTransformChange={handleTransformChange}
          onReset={handleReset}
          onLightingChange={setLighting}
          onToggleAssetAutoRotate={handleToggleAssetAutoRotate}
          onAssetAutoRotateSpeed={handleAssetAutoRotateSpeed}
          isOrthographic={isOrthographic}
          globalAutoRotate={globalAutoRotate}
          globalAutoRotateSpeed={globalAutoRotateSpeed}
          bookmarks={bookmarks}
          selectedId={selectedId}
          onToggleOrtho={() => setIsOrthographic((v) => !v)}
          onResetCamera={handleResetCamera}
          onFocus={() => selectedId && setFocusTargetId(selectedId)}
          onToggleAutoRotate={() => setGlobalAutoRotate((v) => !v)}
          onAutoRotateSpeed={setGlobalAutoRotateSpeed}
          onSaveBookmark={handleSaveBookmark}
          onLoadBookmark={handleLoadBookmark}
          onDeleteBookmark={handleDeleteBookmark}
        />
      </div>

      {/* PANEL BAWAH */}
      <AssetLibraryPanel onAddAsset={handleAddAsset} />

      <Dialog open={isExportOpen} onOpenChange={setIsExportOpen}>
        {/* Update: Tambahkan max-h dan overflow agar tidak keluar layar saat konten muncul */}
        <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Secure embed export</DialogTitle>
            <DialogDescription>
              Create a signed iframe URL that only works on the domains you
              allow. We automatically include this app origin for previewing.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-2">
            {/* Input Section */}
            <div className="space-y-3">
              <Label htmlFor="embed-domain-input">Allowed domains</Label>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  id="embed-domain-input"
                  value={embedDomainInput}
                  onChange={(e) => setEmbedDomainInput(e.target.value)}
                  placeholder="https://customer.com"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="secondary"
                  className="shrink-0"
                  disabled={isUpdatingEmbedDomains || !embedDomainInput.trim()}
                  onClick={handleAddEmbedDomain}
                >
                  Add domain
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Saved domains are the source of truth for this project. Removing
                a domain revokes future access from that site.
              </p>
            </div>

            {/* List Section */}
            <div className="space-y-2">
              <Label>Saved allowlist</Label>
              <div className="rounded-md border border-border bg-muted/30">
                {isLoadingEmbedDomains ? (
                  <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                    Loading domains...
                  </div>
                ) : embedDomains.length === 0 ? (
                  <div className="px-3 py-4 text-sm text-muted-foreground text-center italic">
                    No domains saved yet.
                  </div>
                ) : (
                  <div className="divide-y divide-border max-h-[150px] overflow-y-auto">
                    {embedDomains.map((domain) => (
                      <div
                        key={domain.id}
                        className="flex items-center justify-between gap-3 px-3 py-2 hover:bg-muted/50 transition-colors"
                      >
                        <span className="font-mono text-xs truncate">
                          {domain.domain}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          disabled={isUpdatingEmbedDomains}
                          onClick={() => handleDeleteEmbedDomain(domain.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {embedDomainError && (
              <p className="text-sm font-medium text-destructive">
                {embedDomainError}
              </p>
            )}

            <Button
              type="button"
              onClick={handleGenerateEmbed}
              disabled={isGeneratingEmbed || embedDomains.length === 0}
              className="w-full"
            >
              {isGeneratingEmbed
                ? "Preparing embed..."
                : generatedEmbed
                  ? "Load active embed URL"
                  : "Create embed URL"}
            </Button>

            {/* Generated Content Section */}
            {generatedEmbed && (
              <div className="space-y-4 pt-4 border-t border-border animate-in fade-in slide-in-from-top-2">
                <div className="space-y-2">
                  <Label htmlFor="embed-url">Embed page URL</Label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      id="embed-url"
                      readOnly
                      value={generatedEmbed.embedUrl}
                      className="font-mono text-xs bg-muted"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      className="shrink-0"
                      onClick={() =>
                        handleCopyExport(generatedEmbed.embedUrl, "url")
                      }
                    >
                      {copiedTarget === "url" ? "Copied" : "Copy URL"}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="iframe-code">iframe code</Label>
                  <textarea
                    id="iframe-code"
                    readOnly
                    value={generatedEmbed.iframeCode}
                    className="min-h-[100px] w-full rounded-md border border-input bg-muted px-3 py-2 font-mono text-[11px] text-foreground outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>

                {generatedEmbed.updatedAt && (
                  <p className="text-[10px] text-muted-foreground text-right">
                    Active token updated:{" "}
                    {new Date(generatedEmbed.updatedAt).toLocaleString()}
                  </p>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <div className="flex flex-wrap gap-2 justify-end w-full">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={isGeneratingEmbed || !generatedEmbed}
                onClick={handleRevokeEmbed}
                className="text-destructive"
              >
                Revoke
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isGeneratingEmbed || embedDomains.length === 0}
                onClick={handleRegenerateEmbed}
              >
                Regenerate
              </Button>
              <Button
                type="button"
                variant="default"
                size="sm"
                disabled={!generatedEmbed}
                onClick={() =>
                  generatedEmbed &&
                  window.open(
                    generatedEmbed.embedUrl,
                    "_blank",
                    "noopener,noreferrer",
                  )
                }
              >
                Open
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
