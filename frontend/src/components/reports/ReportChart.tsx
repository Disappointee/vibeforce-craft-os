'use client';

import { useMemo, useState, useEffect } from 'react';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    Cell
} from 'recharts';

export interface ChartDataPoint {
    label: string;
    value: number;
    color?: string;
}

interface ReportChartProps {
    data: ChartDataPoint[];
    title: string;
    unit?: string;
    height?: number;
}

const CHART_COLORS = [
    '#3B82F6', // cyan (tealish)
    '#10b981', // emerald
    '#6366f1', // indigo
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // violet
    '#f97316', // orange
    '#ec4899', // pink
    '#2563EB', // teal
    '#84cc16', // lime
];

export function ReportChart({ data, title, unit = 'h', height = 300 }: ReportChartProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (data.length === 0) {
        return (
            <div 
                style={{ height: `${height}px` }} 
                className="flex items-center justify-center text-muted-foreground text-sm border border-dashed border-border rounded-2xl bg-card/10"
            >
                Keine Daten für Diagramm verfügbar
            </div>
        );
    }

    if (!mounted) {
        return (
            <div 
                style={{ height: `${height}px` }} 
                className="flex items-center justify-center text-muted-foreground text-xs animate-pulse"
            >
                Diagramm wird geladen...
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {title && <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{title}</h3>}
            
            <div className="w-full" style={{ height: `${height}px` }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        margin={{ top: 20, right: 10, left: -20, bottom: 5 }}
                    >
                        <CartesianGrid 
                            strokeDasharray="3 3" 
                            vertical={false} 
                            stroke="rgba(255, 255, 255, 0.05)" 
                        />
                        <XAxis 
                            dataKey="label" 
                            stroke="#71717a" 
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            dy={10}
                            tickFormatter={(tick) => tick.length > 15 ? `${tick.substring(0, 13)}…` : tick}
                        />
                        <YAxis 
                            stroke="#71717a" 
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            domain={[0, 'auto']}
                        />
                        <Tooltip
                            cursor={{ fill: 'rgba(255, 255, 255, 0.03)', radius: 8 }}
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    const dataPoint = payload[0].payload as ChartDataPoint;
                                    return (
                                        <div className="rounded-xl border border-border bg-zinc-950/90 p-3 shadow-2xl backdrop-blur-md">
                                            <p className="text-xs font-bold text-foreground mb-1">{dataPoint.label}</p>
                                            <p className="text-sm font-black text-primary">
                                                {dataPoint.value.toFixed(1)} {unit}
                                            </p>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Bar 
                            dataKey="value" 
                            radius={[6, 6, 0, 0]}
                            maxBarSize={45}
                        >
                            {data.map((entry, index) => {
                                const color = entry.color || CHART_COLORS[index % CHART_COLORS.length];
                                return (
                                    <Cell 
                                        key={`cell-${index}`} 
                                        fill={color}
                                        className="transition-all duration-300 hover:opacity-85"
                                    />
                                );
                            })}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
