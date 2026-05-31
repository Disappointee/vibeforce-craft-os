'use client';

import { useState, useMemo } from 'react';
import type { TaskRecord } from '@/lib/pocketbase-types';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ListViewProps {
    tasks: TaskRecord[];
    onTaskClick?: (taskId: string) => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

type SortColumn = 'title' | 'project' | 'status' | 'priority' | 'start_date' | 'due_date' | 'progress';
type SortDir = 'asc' | 'desc';

const STATUS_LABELS: Record<string, string> = {
    todo: 'Offen',
    in_progress: 'In Arbeit',
    review: 'Prüfung',
    done: 'Erledigt',
};

const PRIORITY_LABELS: Record<string, string> = {
    low: 'Niedrig',
    medium: 'Mittel',
    high: 'Hoch',
    acute: 'Akut',
};

const PRIORITY_COLORS: Record<string, string> = {
    low: 'text-zinc-400',
    medium: 'text-blue-400',
    high: 'text-orange-400',
    acute: 'text-red-400',
};

const STATUS_COLORS: Record<string, string> = {
    todo: 'bg-zinc-500/20 text-zinc-400',
    in_progress: 'bg-blue-500/20 text-blue-400',
    review: 'bg-amber-500/20 text-amber-400',
    done: 'bg-emerald-500/20 text-emerald-400',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr: string | undefined): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function statusToProgress(status: string): number {
    switch (status) {
        case 'todo': return 0;
        case 'in_progress': return 35;
        case 'review': return 70;
        case 'done': return 100;
        default: return 0;
    }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ListView({ tasks, onTaskClick }: ListViewProps) {
    const [sortColumn, setSortColumn] = useState<SortColumn>('start_date');
    const [sortDir, setSortDir] = useState<SortDir>('asc');

    const handleSort = (col: SortColumn) => {
        if (sortColumn === col) {
            setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortColumn(col);
            setSortDir('asc');
        }
    };

    const sortedTasks = useMemo(() => {
        return [...tasks].sort((a, b) => {
            let cmp = 0;
            switch (sortColumn) {
                case 'title':
                    cmp = (a.title || '').localeCompare(b.title || '');
                    break;
                case 'status': {
                    const order = ['todo', 'in_progress', 'review', 'done'];
                    cmp = order.indexOf(a.status) - order.indexOf(b.status);
                    break;
                }
                case 'priority': {
                    const order = ['low', 'medium', 'high', 'acute'];
                    cmp = order.indexOf(a.priority) - order.indexOf(b.priority);
                    break;
                }
                case 'start_date':
                    cmp = (a.start_date || '').localeCompare(b.start_date || '');
                    break;
                case 'due_date':
                    cmp = (a.due_date || '').localeCompare(b.due_date || '');
                    break;
                case 'progress':
                    cmp = statusToProgress(a.status) - statusToProgress(b.status);
                    break;
                case 'project':
                    cmp = (a.expand?.project?.key || '').localeCompare(b.expand?.project?.key || '');
                    break;
            }
            return sortDir === 'asc' ? cmp : -cmp;
        });
    }, [tasks, sortColumn, sortDir]);

    const SortIcon = ({ col }: { col: SortColumn }) => {
        if (sortColumn !== col) {
            return <span className="ml-1 text-muted-foreground/30">&#8597;</span>;
        }
        return <span className="ml-1 text-primary">{sortDir === 'asc' ? '↑' : '↓'}</span>;
    };

    if (tasks.length === 0) {
        return (
            <div className="flex items-center justify-center h-full p-8">
                <p className="text-muted-foreground">Keine Aufgaben vorhanden.</p>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-auto min-h-0">
            <table className="w-full border-collapse">
                <thead className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm">
                    <tr className="border-b border-border">
                        <Th sortable onClick={() => handleSort('title')}>
                            Aufgabe <SortIcon col="title" />
                        </Th>
                        <Th sortable onClick={() => handleSort('project')}>
                            Projekt <SortIcon col="project" />
                        </Th>
                        <Th sortable onClick={() => handleSort('status')}>
                            Status <SortIcon col="status" />
                        </Th>
                        <Th sortable onClick={() => handleSort('priority')}>
                            Priorität <SortIcon col="priority" />
                        </Th>
                        <Th sortable onClick={() => handleSort('start_date')}>
                            Start <SortIcon col="start_date" />
                        </Th>
                        <Th sortable onClick={() => handleSort('due_date')}>
                            Ende <SortIcon col="due_date" />
                        </Th>
                        <Th sortable onClick={() => handleSort('progress')}>
                            Fortschritt <SortIcon col="progress" />
                        </Th>
                    </tr>
                </thead>
                <tbody>
                    {sortedTasks.map((task) => (
                        <tr
                            key={task.id}
                            onClick={() => onTaskClick?.(task.id)}
                            className="border-b border-border/50 hover:bg-accent/30 cursor-pointer transition-colors"
                        >
                            <Td className="font-medium text-foreground max-w-[250px] truncate">
                                {task.title}
                            </Td>
                            <Td className="text-muted-foreground font-mono text-xs">
                                {task.expand?.project?.key || '—'}
                            </Td>
                            <Td>
                                <span className={cn(
                                    'inline-block text-[11px] font-medium px-2 py-0.5 rounded',
                                    STATUS_COLORS[task.status] || 'bg-zinc-500/20 text-zinc-400'
                                )}>
                                    {STATUS_LABELS[task.status] || task.status}
                                </span>
                            </Td>
                            <Td>
                                <span className={cn(
                                    'text-xs font-medium',
                                    PRIORITY_COLORS[task.priority] || 'text-muted-foreground'
                                )}>
                                    {PRIORITY_LABELS[task.priority] || task.priority}
                                </span>
                            </Td>
                            <Td className="text-xs text-muted-foreground tabular-nums">
                                {formatDate(task.start_date)}
                            </Td>
                            <Td className="text-xs text-muted-foreground tabular-nums">
                                {formatDate(task.due_date)}
                            </Td>
                            <Td>
                                <div className="flex items-center gap-2">
                                    <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className={cn(
                                                'h-full rounded-full',
                                                statusToProgress(task.status) >= 100
                                                    ? 'bg-emerald-500'
                                                    : statusToProgress(task.status) > 0
                                                        ? 'bg-primary'
                                                        : 'bg-zinc-600'
                                            )}
                                            style={{ width: `${statusToProgress(task.status)}%` }}
                                        />
                                    </div>
                                    <span className="text-[11px] text-muted-foreground tabular-nums">
                                        {statusToProgress(task.status)}%
                                    </span>
                                </div>
                            </Td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Styled table elements
// ---------------------------------------------------------------------------

function Th({ children, sortable, onClick }: { children: React.ReactNode; sortable?: boolean; onClick?: () => void }) {
    return (
        <th
            onClick={onClick}
            className={cn(
                'px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider',
                sortable && 'cursor-pointer hover:text-foreground select-none'
            )}
        >
            {children}
        </th>
    );
}

function Td({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <td className={cn('px-4 py-3 text-sm', className)}>
            {children}
        </td>
    );
}
