'use client';

import Link from 'next/link';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export interface ReportRow {
    id: string;
    projectId?: string;
    projectName?: string;
    projectKey?: string;
    userName?: string;
    userEmail?: string;
    hours: number;
    taskCount: number;
}

interface ReportTableProps {
    rows: ReportRow[];
    groupBy: 'project' | 'user' | 'both';
}

export function ReportTable({ rows, groupBy }: ReportTableProps) {
    const totalHours = rows.reduce((sum, r) => sum + r.hours, 0);

    if (rows.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground text-sm">
                Keine Daten für den ausgewählten Zeitraum gefunden.
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-6 text-sm">
                <div>
                    <span className="text-muted-foreground">Gesamtstunden: </span>
                    <span className="text-foreground font-semibold tabular-nums">{totalHours.toFixed(1)}h</span>
                </div>
                <div>
                    <span className="text-muted-foreground">Einträge: </span>
                    <span className="text-foreground font-semibold tabular-nums">{rows.length}</span>
                </div>
            </div>

            <div className="rounded-2xl border border-border bg-card/30 overflow-hidden">
                <Table>
                    <TableHeader className="bg-card/50">
                        <TableRow className="border-border hover:bg-transparent">
                            {groupBy !== 'user' && (
                                <TableHead className="text-muted-foreground font-medium">Projekt</TableHead>
                            )}
                            {groupBy !== 'project' && (
                                <TableHead className="text-muted-foreground font-medium">Mitarbeiter</TableHead>
                            )}
                            <TableHead className="text-muted-foreground font-medium text-right">Stunden</TableHead>
                            <TableHead className="text-muted-foreground font-medium text-right">Tasks</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.map((row) => (
                            <TableRow
                                key={row.id}
                                className="border-border/50 hover:bg-white/[0.02] transition-colors"
                            >
                                {groupBy !== 'user' && (
                                    <TableCell className="py-3">
                                        {row.projectKey ? (
                                            row.projectId ? (
                                                <Link
                                                    href={`/projects/${row.projectId}`}
                                                    className="flex items-center gap-2 group cursor-pointer"
                                                >
                                                    <Badge
                                                        variant="outline"
                                                        className="bg-background border-border text-muted-foreground font-mono text-[10px] group-hover:border-indigo-500/50 group-hover:text-indigo-300 transition-colors"
                                                    >
                                                        {row.projectKey}
                                                    </Badge>
                                                    <span className="text-foreground text-sm group-hover:text-foreground transition-colors">
                                                        {row.projectName}
                                                    </span>
                                                </Link>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <Badge
                                                        variant="outline"
                                                        className="bg-background border-border text-muted-foreground font-mono text-[10px]"
                                                    >
                                                        {row.projectKey}
                                                    </Badge>
                                                    <span className="text-foreground text-sm">{row.projectName}</span>
                                                </div>
                                            )
                                        ) : (
                                            <span className="text-muted-foreground text-sm">—</span>
                                        )}
                                    </TableCell>
                                )}
                                {groupBy !== 'project' && (
                                    <TableCell className="py-3">
                                        <span className="text-foreground text-sm">
                                            {row.userName || row.userEmail || '—'}
                                        </span>
                                    </TableCell>
                                )}
                                <TableCell className="py-3 text-right tabular-nums text-foreground font-medium">
                                    {row.hours.toFixed(1)}h
                                </TableCell>
                                <TableCell className="py-3 text-right tabular-nums text-muted-foreground">
                                    {row.taskCount}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
