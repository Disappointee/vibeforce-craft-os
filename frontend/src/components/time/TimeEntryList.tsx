'use client';

import { useState } from 'react';
import { pb } from '@/lib/pocketbase';
import { TimeEntryRecord } from '@/lib/pocketbase-types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { Pencil, Trash2, Loader2, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

interface TimeEntryListProps {
    entries: TimeEntryRecord[];
    onEntryUpdated: () => void;
    onEditEntry: (entry: TimeEntryRecord) => void;
    isLoading?: boolean;
}

export function TimeEntryList({ entries, onEntryUpdated, onEditEntry, isLoading }: TimeEntryListProps) {
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const formatDuration = (minutes: number) => {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        if (h > 0) return `${h}h ${m}m`;
        return `${m}m`;
    };

    const formatDate = (dateStr: string) => {
        try {
            return format(parseISO(dateStr), 'EEEE, dd. MMM yyyy', { locale: de });
        } catch {
            return dateStr;
        }
    };

    const formatTime = (dateStr: string | undefined) => {
        if (!dateStr) return '';
        try {
            return format(parseISO(dateStr), 'HH:mm');
        } catch {
            return '';
        }
    };

    const getTaskName = (entry: TimeEntryRecord): string => {
        const task = (entry as any).expand?.task;
        if (task) return task.title;
        return entry.task;
    };

    const getProjectKey = (entry: TimeEntryRecord): string => {
        const task = (entry as any).expand?.task;
        if (task?.expand?.project) return task.expand.project.key;
        return '—';
    };

    const getProjectName = (entry: TimeEntryRecord): string => {
        const task = (entry as any).expand?.task;
        if (task?.expand?.project) return task.expand.project.name;
        return 'Kein Projekt';
    };

    const deleteEntry = async (entryId: string) => {
        if (!window.confirm('Möchtest du diesen Zeiteintrag wirklich unwiderruflich löschen?')) {
            return;
        }
        setDeletingId(entryId);
        try {
            await pb.collection('time_entries').delete(entryId);
            toast.success('Zeiteintrag gelöscht');
            onEntryUpdated();
        } catch (error) {
            toast.error('Fehler beim Löschen');
        } finally {
            setDeletingId(null);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (entries.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <Clock className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-muted-foreground text-sm">Keine Zeiteinträge gefunden</p>
            </div>
        );
    }

    const renderDefaultActions = (entry: TimeEntryRecord) => (
        <div className="flex items-center justify-end gap-1">
            <Button
                onClick={() => onEditEntry(entry)}
                size="icon-xs"
                variant="ghost"
                className="text-muted-foreground hover:text-foreground"
                title="Eintrag bearbeiten"
            >
                <Pencil size={14} />
            </Button>
            <Button
                onClick={() => deleteEntry(entry.id)}
                disabled={deletingId === entry.id}
                size="icon-xs"
                variant="ghost"
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                title="Eintrag löschen"
            >
                {deletingId === entry.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                    <Trash2 size={14} />
                )}
            </Button>
        </div>
    );

    return (
        <>
            {/* Mobile Card View (below md) */}
            <div className="md:hidden space-y-3">
                {entries.map((entry) => (
                    <div
                        key={entry.id}
                        onClick={() => onEditEntry(entry)}
                        className="rounded-xl border border-border bg-card/40 p-4 space-y-3 cursor-pointer hover:border-primary/30 transition-colors"
                    >
                        {/* Top row: Date + Duration + Actions */}
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex flex-col min-w-0">
                                <span className="text-sm font-semibold text-foreground">
                                    {formatDate(entry.created)}
                                </span>
                                {entry.start_time && (
                                    <span className="text-xs text-muted-foreground">
                                        {formatTime(entry.start_time)} — {formatTime(entry.end_time)}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <span className="text-base font-mono font-bold text-foreground tabular-nums">
                                    {formatDuration(entry.duration_minutes || 0)}
                                </span>
                            </div>
                        </div>

                        {/* Middle row: Project + Task */}
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="bg-background border-border text-muted-foreground font-mono text-[10px]">
                                    {getProjectKey(entry)}
                                </Badge>
                                <span className="text-sm font-medium text-foreground truncate">
                                    {getTaskName(entry)}
                                </span>
                            </div>
                            <span className="text-[11px] text-muted-foreground ml-1">
                                {getProjectName(entry)}
                            </span>
                        </div>

                        {/* Bottom row: Description + Actions */}
                        <div className="flex items-start justify-between gap-3 pt-1 border-t border-border/20">
                            <div className="flex-1 min-w-0">
                                <span className="text-xs text-muted-foreground line-clamp-2">
                                    {entry.description || '—'}
                                </span>
                            </div>
                            <div className="shrink-0">
                                {renderDefaultActions(entry)}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Desktop Table View (md and above) */}
            <div className="hidden md:block rounded-2xl border border-border bg-card/30 overflow-hidden">
                <Table className="table-fixed w-full">
                    <TableHeader className="bg-card/50">
                        <TableRow className="border-border hover:bg-transparent">
                            <TableHead className="text-muted-foreground font-medium w-[18%]">Datum</TableHead>
                            <TableHead className="text-muted-foreground font-medium w-[25%]">Aufgabe</TableHead>
                            <TableHead className="text-muted-foreground font-medium w-[42%]">Beschreibung</TableHead>
                            <TableHead className="text-muted-foreground font-medium text-right w-[10%]">Dauer</TableHead>
                            <TableHead className="text-muted-foreground font-medium text-right w-[5%]">Aktionen</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {entries.map((entry) => (
                            <TableRow
                                key={entry.id}
                                className="border-border/50 hover:bg-white/[0.02] transition-colors"
                            >
                                <TableCell className="py-3">
                                    <div className="flex flex-col">
                                        <span className="text-foreground text-sm">{formatDate(entry.created)}</span>
                                        {entry.start_time && (
                                            <span className="text-xs text-muted-foreground">
                                                {formatTime(entry.start_time)} — {formatTime(entry.end_time)}
                                            </span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col gap-0.5 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="bg-background border-border text-muted-foreground font-mono text-[10px] shrink-0">
                                                {getProjectKey(entry)}
                                            </Badge>
                                            <span className="text-sm font-medium text-foreground truncate" title={getTaskName(entry)}>
                                                {getTaskName(entry)}
                                            </span>
                                        </div>
                                        <span className="text-[11px] text-muted-foreground ml-1 truncate" title={getProjectName(entry)}>
                                            {getProjectName(entry)}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="text-sm text-muted-foreground truncate max-w-full" title={entry.description || ''}>
                                        {entry.description || '—'}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <span className="text-sm font-mono text-foreground tabular-nums">
                                        {formatDuration(entry.duration_minutes || 0)}
                                    </span>
                                </TableCell>
                                <TableCell className="text-right">
                                    {renderDefaultActions(entry)}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </>
    );
}
