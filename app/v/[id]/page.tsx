"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import R3FViewer from "@/components/3d/R3FViewer";
import type { HotspotData } from "@/components/3d/HotspotPin";

type EmbedProject = {
    id: string;
    name: string;
    fileUrl: string;
    intensity: string;
    autoRotate: boolean;
    environment: "city" | "studio" | "lobby";
    bgColor: string;
    hotspots: HotspotData[];
};

export default function EmbedViewerPage() {
    const { id } = useParams<{ id: string }>();
    const [project, setProject] = useState<EmbedProject | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchProject() {
            try {
                const res = await fetch(`/api/embed/${id}`);
                if (!res.ok) {
                    setError("Model not found");
                    return;
                }
                const data = await res.json();
                setProject(data);
            } catch {
                setError("Failed to load model");
            }
        }
        fetchProject();
    }, [id]);

    // Track view event
    useEffect(() => {
        if (!project) return;
        fetch("/api/analytics", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ projectId: project.id, eventType: "view" }),
        }).catch(() => { /* silent fail */ });
    }, [project]);

    if (error) {
        return (
            <div
                style={{
                    width: "100vw",
                    height: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "system-ui, sans-serif",
                    color: "#71717a",
                    backgroundColor: "#fafafa",
                }}
            >
                <div style={{ textAlign: "center" }}>
                    <p style={{ fontSize: "14px" }}>{error}</p>
                </div>
            </div>
        );
    }

    if (!project) {
        return (
            <div
                style={{
                    width: "100vw",
                    height: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "system-ui, sans-serif",
                    color: "#71717a",
                    backgroundColor: "#fafafa",
                }}
            >
                <p style={{ fontSize: "14px", fontFamily: "monospace" }}>
                    Loading 3D model...
                </p>
            </div>
        );
    }

    return (
        <div
            style={{
                width: "100vw",
                height: "100vh",
                position: "relative",
                backgroundColor: project.bgColor || "#fafafa",
            }}
        >
            <R3FViewer
                url={project.fileUrl}
                config={{
                    intensity: parseFloat(project.intensity || "0.6"),
                    autoRotate: project.autoRotate,
                    environment: project.environment || "city",
                }}
                hotspots={project.hotspots || []}
            />

            {/* Powered by watermark */}
            <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                    position: "absolute",
                    bottom: "12px",
                    right: "16px",
                    fontSize: "11px",
                    fontFamily: "system-ui, sans-serif",
                    color: "#a1a1aa",
                    textDecoration: "none",
                    opacity: 0.7,
                    transition: "opacity 0.2s",
                    zIndex: 10,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.7")}
            >
                Powered by Vur3D
            </a>
        </div>
    );
}
