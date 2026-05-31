'use client';

import { useState, useMemo, useCallback } from 'react';
import type { TaskRecord } from '@/lib/pocketbase-types';
import { cn } from '@/lib/utils';
import { PRIORITY_LABELS } from '@/lib/constants';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface KanbanViewProps {
    tasks: TaskRecord[];
    onTaskClick?: (taskId: string) => void;
    onTaskUpdated?: () => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COLUMNS = [
    { status: 'todo', label: 'Offen' },
    { status: 'in_progress', label: 'In Arbeit' },
    { status: 'review', label: 'Prüfung' },
    { status: 'done', label: 'Erledigt' },
] as const;

const PRIORITY_COLORS: Record<string, string> = {
    low: 'border-l-zinc-500',
    medium: 'border-l-blue-500',
    high: 'border-l-orange-500',
    acute: 'border-l-red-500',
};

const PRIORITY_BADGE: Record<string, string> = {
    low: 'bg-zinc-500/20 text-zinc-400',
    medium: 'bg-blue-500/20 text-blue-400',
    high: 'bg-orange-500/20 text-orange-400',
    acute: 'bg-red-500/20 text-red-400',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr: string | undefined): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
}

// ---------------------------------------------------------------------------
// KanbanCard
// ---------------------------------------------------------------------------

function KanbanCard({
    task,
    onDragStart,
    onClick,
}: {
    task: TaskRecord;
    onDragStart: (e: React.DragEvent, taskId: string) => void;
    onClick: () => void;
}) {
    const priority = task.priority || 'medium';
    const projectKey = task.expand?.project?.key || '—';

    return (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, task.id)}
            onClick={onClick}
            className={cn(
                'group cursor-pointer rounded-lg border border-border bg-card/60 p-3 hover:bg-accent/40 transition-colors border-l-[3px]',
                PRIORITY_COLORS[priority] || 'border-l-zinc-500'
            )}
        >
            <p className="text-sm font-medium text-foreground truncate mb-2">
                {task.title}
            </p>
            <div className="flex items-center gap-2 flex-wrap">
                {projectKey && (
                    <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        {projectKey}
                    </span>
                )}
                {task.due_date && (
                    <span className="text-[10px] text-muted-foreground">
                        {formatDate(task.due_date)}
                    </span>
                )}
                <span className={cn(
                    'text-[10px] font-medium px-1.5 py-0.5 rounded',
                    PRIORITY_BADGE[priority] || 'bg-zinc-500/20 text-zinc-400'
                )}>
                    {PRIORITY_LABELS[priority] || priority}
                </span>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// KanbanView
// ---------------------------------------------------------------------------

export function KanbanView({ tasks, onTaskClick, onTaskUpdated }: KanbanViewProps) {
    const [draggedId, setDraggedId] = useState<string | null>(null);

    const columns = useMemo(() => {
        return COLUMNS.map((col) => ({
            ...col,
            items: tasks.filter((t) => t.status === col.status),
        }));
    }, [tasks]);

    const handleDragStart = useCallback((e: React.DragEvent, taskId: string) => {
        setDraggedId(taskId);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', taskId);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }, []);

    const handleDrop = useCallback(async (e: React.DragEvent, newStatus: string) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData('text/plain');
        if (!taskId || !draggedId) return;
        setDraggedId(null);

        try {
            const { pb } = await import('@/lib/pocketbase');
            await pb.collection('tasks').update(taskId, { status: newStatus });
            onTaskUpdated?.();
        } catch (err) {
            console.error('Failed to move task:', err);
        }
    }, [draggedId, onTaskUpdated]);

    if (tasks.length === 0) {
        return (
            <div className="flex items-center justify-center h-full p-8">
                <p className="text-muted-foreground">Keine Aufgaben vorhanden.</p>
            </div>
        );
    }

    return (
        <div className="flex-1 flex gap-4 p-4 overflow-x-auto min-h-0">
            {columns.map((col) => (
                <div
                    key={col.status}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, col.status)}
                    className={cn(
                        'flex-1 min-w-[250px] rounded-xl border border-border bg-card/20 flex flex-col',
                        draggedId && 'ring-1 ring-primary/30'
                    )}
                >
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            {col.label}
                        </h3>
                        <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full tabular-nums">
                            {col.items.length}
                        </span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 space-y-2">
                        {col.items.length === 0 ? (
                            <p className="text-xs text-muted-foreground text-center py-8">
                                Keine Aufgaben
                            </p>
                        ) : (
                            col.items.map((task) => (
                                <KanbanCard
                                    key={task.id}
                                    task={task}
                                    onDragStart={handleDragStart}
                                    onClick={() => onTaskClick?.(task.id)}
                                />
                            ))
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
