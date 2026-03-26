"use client";

import { useEffect, useState } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { Eye, MousePointerClick, RotateCw, ZoomIn, Loader2 } from "lucide-react";

type AnalyticsData = {
    totalViews: number;
    totalInteractions: number;
    breakdown: {
        views: number;
        rotates: number;
        zooms: number;
        hotspotClicks: number;
    };
    dailyViews: { date: string; count: number }[];
};

type AnalyticsTabProps = {
    projectId: string;
};

export default function AnalyticsTab({ projectId }: AnalyticsTabProps) {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchAnalytics() {
            try {
                const res = await fetch(`/api/projects/${projectId}/analytics`);
                if (res.ok) {
                    const json = await res.json();
                    setData(json);
                }
            } catch {
                console.error("Failed to load analytics");
            } finally {
                setLoading(false);
            }
        }
        fetchAnalytics();
    }, [projectId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!data) {
        return (
            <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">
                    Failed to load analytics
                </p>
            </div>
        );
    }

    const stats = [
        {
            label: "Views",
            value: data.breakdown.views,
            icon: <Eye className="w-4 h-4" />,
            color: "text-violet-600 bg-violet-100 dark:bg-violet-900/30",
        },
        {
            label: "Rotations",
            value: data.breakdown.rotates,
            icon: <RotateCw className="w-4 h-4" />,
            color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30",
        },
        {
            label: "Zooms",
            value: data.breakdown.zooms,
            icon: <ZoomIn className="w-4 h-4" />,
            color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30",
        },
        {
            label: "Pin Clicks",
            value: data.breakdown.hotspotClicks,
            icon: <MousePointerClick className="w-4 h-4" />,
            color: "text-amber-600 bg-amber-100 dark:bg-amber-900/30",
        },
    ];

    return (
        <div className="space-y-5">
            {/* Stat Cards */}
            <div className="grid grid-cols-2 gap-2">
                {stats.map((stat) => (
                    <div
                        key={stat.label}
                        className="border rounded-lg p-3 space-y-1"
                    >
                        <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-md flex items-center justify-center ${stat.color}`}>
                                {stat.icon}
                            </div>
                        </div>
                        <div className="text-xl font-bold tabular-nums">
                            {stat.value.toLocaleString()}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                            {stat.label}
                        </div>
                    </div>
                ))}
            </div>

            {/* Daily Views Chart */}
            {data.dailyViews.length > 0 && (
                <div className="space-y-2">
                    <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Views — Last 30 Days
                    </h3>
                    <div className="border rounded-lg p-3 bg-muted/30">
                        <ResponsiveContainer width="100%" height={140}>
                            <BarChart
                                data={data.dailyViews}
                                margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                            >
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    vertical={false}
                                    stroke="hsl(var(--border))"
                                />
                                <XAxis
                                    dataKey="date"
                                    tick={{ fontSize: 10 }}
                                    tickFormatter={(v) => {
                                        const d = new Date(v);
                                        return `${d.getMonth() + 1}/${d.getDate()}`;
                                    }}
                                    stroke="hsl(var(--muted-foreground))"
                                />
                                <YAxis
                                    tick={{ fontSize: 10 }}
                                    allowDecimals={false}
                                    stroke="hsl(var(--muted-foreground))"
                                />
                                <Tooltip
                                    contentStyle={{
                                        fontSize: 12,
                                        borderRadius: 8,
                                        border: "1px solid hsl(var(--border))",
                                        background: "hsl(var(--background))",
                                    }}
                                    labelFormatter={(v) =>
                                        new Date(v).toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "numeric",
                                        })
                                    }
                                />
                                <Bar
                                    dataKey="count"
                                    fill="hsl(262, 83%, 58%)"
                                    radius={[3, 3, 0, 0]}
                                    name="Views"
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {data.dailyViews.length === 0 && (
                <div className="text-center py-6 border rounded-lg bg-muted/30">
                    <Eye className="w-6 h-6 text-muted-foreground/50 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">
                        No views yet. Share your embed link to start tracking!
                    </p>
                </div>
            )}
        </div>
    );
}
