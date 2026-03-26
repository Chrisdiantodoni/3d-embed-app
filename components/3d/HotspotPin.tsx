"use client";

import { useState } from "react";
import { Html } from "@react-three/drei";
import * as THREE from "three";

export type HotspotData = {
    id: string;
    positionX: string;
    positionY: string;
    positionZ: string;
    label: string;
    description: string | null;
    linkUrl: string | null;
};

type HotspotPinProps = {
    hotspot: HotspotData;
    onDelete?: (id: string) => void;
    editable?: boolean;
};

export default function HotspotPin({ hotspot, onDelete, editable }: HotspotPinProps) {
    const [expanded, setExpanded] = useState(false);
    const position = new THREE.Vector3(
        parseFloat(hotspot.positionX),
        parseFloat(hotspot.positionY),
        parseFloat(hotspot.positionZ),
    );

    return (
        <group position={position}>
            <Html
                center
                distanceFactor={8}
                style={{
                    pointerEvents: "auto",
                    userSelect: "none",
                }}
                zIndexRange={[100, 0]}
            >
                <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>
                    {/* Pin marker */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setExpanded(!expanded);
                        }}
                        style={{
                            width: 28,
                            height: 28,
                            borderRadius: "50%",
                            background: "linear-gradient(135deg, #7c3aed, #3b82f6)",
                            border: "3px solid white",
                            boxShadow: "0 2px 12px rgba(124,58,237,0.5)",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "white",
                            fontSize: 12,
                            fontWeight: 700,
                            fontFamily: "system-ui, sans-serif",
                            transition: "transform 0.2s, box-shadow 0.2s",
                            transform: expanded ? "scale(1.15)" : "scale(1)",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "scale(1.15)";
                            e.currentTarget.style.boxShadow = "0 4px 20px rgba(124,58,237,0.6)";
                        }}
                        onMouseLeave={(e) => {
                            if (!expanded) {
                                e.currentTarget.style.transform = "scale(1)";
                                e.currentTarget.style.boxShadow = "0 2px 12px rgba(124,58,237,0.5)";
                            }
                        }}
                    >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                            <circle cx="12" cy="12" r="3" fill="white" />
                        </svg>
                    </button>

                    {/* Tooltip popover */}
                    {expanded && (
                        <div
                            style={{
                                position: "absolute",
                                bottom: 38,
                                left: "50%",
                                transform: "translateX(-50%)",
                                backgroundColor: "white",
                                borderRadius: 12,
                                padding: "12px 16px",
                                minWidth: 180,
                                maxWidth: 260,
                                boxShadow: "0 8px 32px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.1)",
                                fontFamily: "system-ui, sans-serif",
                                zIndex: 50,
                                animation: "fadeIn 0.15s ease-out",
                            }}
                        >
                            {/* Arrow */}
                            <div
                                style={{
                                    position: "absolute",
                                    bottom: -6,
                                    left: "50%",
                                    transform: "translateX(-50%) rotate(45deg)",
                                    width: 12,
                                    height: 12,
                                    backgroundColor: "white",
                                    boxShadow: "4px 4px 8px rgba(0,0,0,0.05)",
                                }}
                            />

                            <div style={{ fontWeight: 600, fontSize: 13, color: "#18181b", marginBottom: 4 }}>
                                {hotspot.label}
                            </div>

                            {hotspot.description && (
                                <div style={{ fontSize: 12, color: "#71717a", lineHeight: 1.5, marginBottom: hotspot.linkUrl ? 8 : 0 }}>
                                    {hotspot.description}
                                </div>
                            )}

                            {hotspot.linkUrl && (
                                <a
                                    href={hotspot.linkUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 4,
                                        fontSize: 12,
                                        color: "#7c3aed",
                                        textDecoration: "none",
                                        fontWeight: 500,
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                                    onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
                                >
                                    Learn more →
                                </a>
                            )}

                            {editable && onDelete && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete(hotspot.id);
                                    }}
                                    style={{
                                        position: "absolute",
                                        top: 6,
                                        right: 6,
                                        width: 20,
                                        height: 20,
                                        borderRadius: "50%",
                                        border: "none",
                                        background: "#fef2f2",
                                        color: "#ef4444",
                                        cursor: "pointer",
                                        fontSize: 12,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontWeight: 700,
                                    }}
                                >
                                    ×
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </Html>
        </group>
    );
}
