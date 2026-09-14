'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TimeEntryRecord } from '@/lib/pocketbase-types';
import { deleteTimeEntryAction } from '@/app/actions/time-entries';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Pencil, Trash2, Loader2, Clock, Plus } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

interface DayEntriesDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    day: Date;
    entries: TimeEntryRecord[];
    onEntryUpdated: () => void;
    onBookTimeClick: () => void;
    onEditEntry: (entry: TimeEntryRecord) => void;
}

export function DayEntriesDialog({
    isOpen,
    onOpenChange,
    day,
    entries,
    onEntryUpdated,
    onBookTimeClick,
    onEditEntry,
}: DayEntriesDialogProps) {
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const router = useRouter();

    const formatDuration = (minutes: number) => {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        if (h > 0) return `${h}h ${m}m`;
        return `${m}m`;
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

    const formatTime = (dateStr: string | undefined) => {
        if (!dateStr) return '';
        try {
            return format(parseISO(dateStr), 'HH:mm');
        } catch {
            return '';
        }
    };

    const deleteEntry = async (entryId: string) => {
        if (!window.confirm('Möchtest du diesen Zeiteintrag wirklich unwiderruflich löschen?')) {
            return;
        }
        setDeletingId(entryId);
        try {
            await deleteTimeEntryAction(entryId);
            toast.success('Zeiteintrag gelöscht');
            router.refresh();
            onEntryUpdated();
        } catch (error) {
            toast.error('Fehler beim Löschen');
        } finally {
            setDeletingId(null);
        }
    };

    const dayMinutes = entries.reduce((sum, entry) => sum + (entry.duration_minutes || 0), 0);

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl bg-background border border-border text-foreground p-6 flex flex-col max-h-[85vh] overflow-hidden">
                <DialogHeader className="pb-4 border-b border-border">
                    <DialogTitle className="text-lg font-black tracking-tight text-foreground flex items-center justify-between">
                        <span>{format(day, 'EEEE, dd. MMMM yyyy', { locale: de })}</span>
                        {dayMinutes > 0 && (
                            <span className="text-sm font-bold text-teal-400 bg-primary/10 rounded-full px-3 py-1 font-mono">
                                {formatDuration(dayMinutes)}
                            </span>
                        )}
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground text-xs">
                        Detaillierte Übersicht der Zeiterfassung für diesen Tag. Klicke auf einen Eintrag, um ihn vollständig zu bearbeiten.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1">
                    {entries.map((entry) => (
                            <div
                                key={entry.id}
                                onClick={() => onEditEntry(entry)}
                                className="rounded-xl border border-border bg-card/40 p-4 space-y-3 hover:border-teal-500/30 hover:bg-card/60 transition-colors cursor-pointer group relative"
                            >
                                {/* Top row: Project + Duration */}
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex flex-col min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <Badge variant="outline" className="bg-background border-border text-muted-foreground font-mono text-[9px] uppercase">
                                                {getProjectKey(entry)}
                                            </Badge>
                                            <span className="text-sm font-semibold text-foreground truncate">
                                                {getTaskName(entry)}
                                            </span>
                                        </div>
                                        <span className="text-[10px] text-muted-foreground mt-0.5">
                                            {getProjectName(entry)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className="text-sm font-mono font-bold text-foreground tabular-nums">
                                            {formatDuration(entry.duration_minutes || 0)}
                                        </span>
                                    </div>
                                </div>

                                {/* Start & End Time if present */}
                                {entry.start_time && (
                                    <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                                        <Clock size={10} />
                                        <span>{formatTime(entry.start_time)} — {formatTime(entry.end_time)}</span>
                                    </div>
                                )}

                                {/* Middle row: Description */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-muted-foreground whitespace-pre-line leading-relaxed">
                                        {entry.description || <em className="italic opacity-60">Keine Beschreibung</em>}
                                    </p>
                                </div>

                                {/* Actions row */}
                                <div className="flex items-center justify-end border-t border-border/30 pt-2.5">
                                    <div className="flex items-center gap-1">
                                        <Button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEditEntry(entry);
                                            }}
                                            size="icon-xs"
                                            variant="ghost"
                                            className="text-muted-foreground hover:text-foreground"
                                            title="Eintrag bearbeiten"
                                        >
                                            <Pencil size={14} />
                                        </Button>
                                        <Button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteEntry(entry.id);
                                            }}
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
                                </div>
                            </div>
                        ))}
                </div>

                <DialogFooter className="pt-4 border-t border-border flex sm:justify-between items-center gap-2">
                    <Button 
                        onClick={() => onOpenChange(false)}
                        variant="ghost" 
                        size="sm"
                        className="text-muted-foreground hover:text-foreground"
                    >
                        Schließen
                    </Button>
                    <Button
                        onClick={onBookTimeClick}
                        className="bg-primary hover:bg-teal-400 text-black font-bold h-9 rounded-xl shadow-lg shadow-teal-500/10 flex items-center gap-1.5"
                    >
                        <Plus size={16} />
                        Zeit buchen
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
