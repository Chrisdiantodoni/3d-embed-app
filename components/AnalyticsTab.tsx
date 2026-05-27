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
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

type AnalyticsData = {
    totalViews: number;
    totalInteractions: number;
    breakdown: {
        views: number;
        rotates: number;
        zooms: number;
        hotspotClicks: number;
    };
    weeklyViews: { week: string; count: number }[];
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
            <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!data) {
        return (
            <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16 gap-2">
                    <Eye className="w-8 h-8 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">
                        No analytics data available yet.
                    </p>
                </CardContent>
            </Card>
        );
    }

    const overview = [
        {
            label: "Total Views",
            value: data.totalViews,
            icon: <Eye className="w-4 h-4" />,
            color: "text-violet-600 bg-violet-100 dark:bg-violet-900/30",
        },
        {
            label: "Total Interactions",
            value: data.totalInteractions,
            icon: <MousePointerClick className="w-4 h-4" />,
            color: "text-sky-600 bg-sky-100 dark:bg-sky-900/30",
        },
    ];

    const breakdown = [
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
        <div className="space-y-6">
            {/* Overview Cards */}
            <div className="grid grid-cols-2 gap-4">
                {overview.map((stat) => (
                    <Card key={stat.label}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {stat.label}
                            </CardTitle>
                            <div className={`w-8 h-8 rounded-md flex items-center justify-center ${stat.color}`}>
                                {stat.icon}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold tabular-nums">
                                {stat.value.toLocaleString()}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Breakdown Cards */}
            <div>
                <h3 className="text-sm font-medium mb-3">Breakdown</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {breakdown.map((stat) => (
                        <Card key={stat.label}>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3">
                                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${stat.color}`}>
                                        {stat.icon}
                                    </div>
                                    <div>
                                        <div className="text-xl font-bold tabular-nums">
                                            {stat.value.toLocaleString()}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {stat.label}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Weekly Views Chart */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Views — Last 4 Weeks</CardTitle>
                    <CardDescription>
                        Weekly embed views for this project.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {data.weeklyViews.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart
                                data={data.weeklyViews}
                                margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                            >
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    vertical={false}
                                    stroke="hsl(240 5% 26%)"
                                />
                                <XAxis
                                    dataKey="week"
                                    tick={{ fontSize: 11, fill: "hsl(240 5% 64%)" }}
                                    tickFormatter={(v) => {
                                        const d = new Date(v + "T00:00:00");
                                        const end = new Date(d);
                                        end.setDate(end.getDate() + 6);
                                        const options: Intl.DateTimeFormatOptions = {
                                            month: "short",
                                            day: "numeric",
                                        };
                                        return `${d.toLocaleDateString("en-US", options)}`;
                                    }}
                                    stroke="hsl(240 5% 26%)"
                                />
                                <YAxis
                                    tick={{ fontSize: 11, fill: "hsl(240 5% 64%)" }}
                                    allowDecimals={false}
                                    stroke="hsl(240 5% 26%)"
                                />
                                <Tooltip
                                    cursor={{ fill: "transparent" }}
                                    wrapperStyle={{ outline: "none" }}
                                    contentStyle={{
                                        fontSize: 12,
                                        borderRadius: 8,
                                        background: "hsl(240 6% 10%)",
                                        border: "1px solid hsl(240 5% 15%)",
                                    }}
                                    labelStyle={{ color: "hsl(240 5% 64%)" }}
                                    itemStyle={{ color: "hsl(240 5% 84%)" }}
                                    labelFormatter={(v) => {
                                        const d = new Date(v + "T00:00:00");
                                        const end = new Date(d);
                                        end.setDate(end.getDate() + 6);
                                        return `${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${end.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
                                    }}
                                    formatter={(value: number) => [value, "Views"]}
                                />
                                <Bar
                                    dataKey="count"
                                    fill="hsl(262 83% 58%)"
                                    radius={[4, 4, 0, 0]}
                                    name="Views"
                                    activeBar={false}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="text-center py-10">
                            <Eye className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">
                                No views yet. Share your embed link to start tracking!
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
