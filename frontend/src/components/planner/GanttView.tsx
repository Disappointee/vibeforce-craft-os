'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Gantt, Task, ViewMode } from 'gantt-task-react';
import "gantt-task-react/dist/index.css";
import type { GanttTask } from '@/lib/gantt-utils';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { BarChart3, Columns3, List, Maximize2, Minimize2 } from 'lucide-react';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface GanttViewProps {
    tasks: GanttTask[];
    taskStatusMap?: Record<string, string>;
    isLoading: boolean;
    error: string | null;
    onTaskClick?: (taskId: string) => void;
    scrollRef?: React.RefObject<HTMLDivElement | null>;
    sidebarOpen?: boolean;
    /** Active planner view */
    activeView: 'timeline' | 'kanban' | 'list';
    /** Callback when view changes */
    onViewChange: (view: 'timeline' | 'kanban' | 'list') => void;
    /** Fullscreen state hoisted from planner */
    isFullscreen: boolean;
    /** Callback to toggle fullscreen (implementation lives in planner) */
    onToggleFullscreen: () => void;
    onTaskUpdated?: () => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const VIEW_MODES = ['Day', 'Week', 'Month', 'Year'] as const;
const VIEW_MODE_LABELS: Record<string, string> = {
    Day: 'Tag',
    Week: 'Woche',
    Month: 'Monat',
    Year: 'Jahr',
};

const VIEW_MODE_MAP: Record<string, ViewMode> = {
    Day: ViewMode.Day,
    Week: ViewMode.Week,
    Month: ViewMode.Month,
    Year: ViewMode.Year,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseLocalDate(dateStr: string): Date {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // 0-based
        const day = parseInt(parts[2], 10);
        return new Date(year, month, day);
    }
    return new Date(dateStr);
}

function getTaskColors(status: string | undefined, priority: string, isSelected: boolean, isDark: boolean) {
    let backgroundColor: string;
    let progressColor: string;

    if (status === 'in_progress') {
        backgroundColor = isDark ? 'rgba(0, 166, 153, 0.15)' : 'rgba(0, 140, 130, 0.2)';
        progressColor = isDark ? '#2563EB' : '#1E40AF';
    } else if (status === 'review') {
        backgroundColor = isDark ? 'rgba(0, 139, 129, 0.15)' : 'rgba(0, 120, 110, 0.2)';
        progressColor = isDark ? '#1D4ED8' : '#1E3A8A';
    } else if (status === 'done') {
        backgroundColor = isDark ? 'rgba(34, 197, 94, 0.15)' : 'rgba(22, 163, 74, 0.2)';
        progressColor = isDark ? '#22c55e' : '#16a34a';
    } else {
        backgroundColor = isDark ? 'rgba(39, 39, 42, 0.4)' : 'rgba(63, 63, 70, 0.15)';
        progressColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.15)';
    }

    if (status !== 'done') {
        if (priority === 'acute') {
            backgroundColor = isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.2)';
            progressColor = isDark ? '#ef4444' : '#dc2626';
        } else if (priority === 'high') {
            backgroundColor = isDark ? 'rgba(249, 115, 22, 0.15)' : 'rgba(249, 115, 22, 0.2)';
            progressColor = isDark ? '#f97316' : '#ea580c';
        }
    }

    const backgroundSelectedColor = isSelected ? progressColor : backgroundColor;
    const progressSelectedColor = isSelected ? '#ffffff' : progressColor;

    return {
        backgroundColor,
        backgroundSelectedColor,
        progressColor,
        progressSelectedColor,
    };
}

const CustomTooltipContent: React.FC<{
    task: Task;
    fontSize: string;
    fontFamily: string;
}> = ({ task }) => {
    const formatDate = (date: Date) => {
        return `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`;
    };

    return (
        <div className="bg-zinc-950/95 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl p-4 text-xs max-w-xs space-y-1.5 text-foreground">
            <h4 className="font-bold text-sm text-white truncate">{task.name}</h4>
            <p className="text-muted-foreground text-[10px]">
                {formatDate(task.start)} – {formatDate(task.end)}
            </p>
            <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                    <div 
                        className="bg-primary h-full rounded-full" 
                        style={{ width: `${task.progress}%` }}
                    />
                </div>
                <span className="text-[10px] font-medium text-primary shrink-0">
                    Fortschritt: {Math.round(task.progress)}%
                </span>
            </div>
        </div>
    );
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function GanttView({ tasks, taskStatusMap, isLoading, error, onTaskClick, scrollRef, sidebarOpen, activeView, onViewChange, isFullscreen, onToggleFullscreen, onTaskUpdated }: GanttViewProps) {
    const isMobile = useIsMobile();
    const [viewMode, setViewMode] = useState<string>('Month');
    const [containerWidth, setContainerWidth] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    // ResizeObserver to force Gantt recalculation on container resize
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                setContainerWidth(entry.contentRect.width);
            }
        });
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    const [isDark, setIsDark] = useState<boolean>(() => {
        if (typeof window !== 'undefined') {
            return document.documentElement.classList.contains('dark');
        }
        return true;
    });

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const observer = new MutationObserver(() => {
            setIsDark(document.documentElement.classList.contains('dark'));
        });
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class'],
        });
        return () => observer.disconnect();
    }, []);

    // ---------- Derived data (hooks MUST be before early returns) ----------
    // Map GanttTask[] to gantt-task-react's Task[]
    const mappedTasks: Task[] = useMemo(() => {
        const validTaskIds = new Set(tasks.map(t => t.id));
        return tasks.map((t) => {
            const priority = t.custom_class.replace('gantt-priority-', '');
            const status = taskStatusMap?.[t.id];
            
            const startDateObj = parseLocalDate(t.start);
            const endDateObj = parseLocalDate(t.end);
            const finalEndDateObj = endDateObj < startDateObj ? startDateObj : endDateObj;

            const deps = t.dependencies && validTaskIds.has(t.dependencies) && t.dependencies !== t.id
                ? [t.dependencies]
                : undefined;

            return {
                id: t.id,
                type: 'task' as const,
                name: t.name,
                start: startDateObj,
                end: finalEndDateObj,
                progress: t.progress,
                dependencies: deps,
                styles: getTaskColors(status, priority, false, isDark),
            };
        });
    }, [tasks, taskStatusMap, isDark]);

    // Padding task to force gantt-task-react to fill container width
    const COLUMN_WIDTHS: Record<string, number> = { Day: 60, Week: 80, Month: 120, Year: 80 };
    const extendedTasks = useMemo(() => {
        if (mappedTasks.length === 0) return mappedTasks;

        let earliestStart = new Date(mappedTasks[0].start);
        let latestEnd = new Date(mappedTasks[0].end);
        for (const t of mappedTasks) {
            if (t.start < earliestStart) earliestStart = new Date(t.start);
            if (t.end > latestEnd) latestEnd = new Date(t.end);
        }

        const MIN_COLUMNS: Record<string, number> = {
            Day: 60,
            Week: 30,
            Month: 18,
            Year: 25,
        };

        const colWidth = COLUMN_WIDTHS[viewMode] || 120;
        const neededCols = containerWidth ? Math.ceil(containerWidth / colWidth) + 1 : 18;
        const minCols = Math.max(MIN_COLUMNS[viewMode] || 18, neededCols);

        const extendedEnd = new Date(earliestStart);
        if (viewMode === 'Day') {
            extendedEnd.setDate(extendedEnd.getDate() + minCols);
        } else if (viewMode === 'Week') {
            extendedEnd.setDate(extendedEnd.getDate() + minCols * 7);
        } else if (viewMode === 'Year') {
            extendedEnd.setFullYear(extendedEnd.getFullYear() + minCols);
        } else {
            extendedEnd.setMonth(extendedEnd.getMonth() + minCols);
        }

        const finalEnd = latestEnd > extendedEnd ? latestEnd : extendedEnd;

        if (finalEnd <= latestEnd) return mappedTasks;

        const paddingTask: Task = {
            id: '__padding__',
            type: 'task',
            name: '',
            start: latestEnd,
            end: finalEnd,
            progress: 0,
            styles: {
                backgroundColor: 'transparent',
                backgroundSelectedColor: 'transparent',
                progressColor: 'transparent',
                progressSelectedColor: 'transparent',
            },
        };

        return [...mappedTasks, paddingTask];
    }, [mappedTasks, viewMode, containerWidth]);

    // ---------- Event Handlers ----------
    const handleDateChange = async (task: Task) => {
        try {
            const fmtDate = (d: Date) => {
                const y = d.getFullYear();
                const m = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                return `${y}-${m}-${day} 00:00:00`;
            };
            const { pb } = await import('@/lib/pocketbase');
            await pb.collection('tasks').update(task.id, {
                start_date: fmtDate(task.start),
                due_date: fmtDate(task.end),
            });
            onTaskUpdated?.();
        } catch (err) {
            console.error('Failed to update task dates:', err);
        }
    };

    const handleProgressChange = async (task: Task) => {
        const pct = Math.round(task.progress);
        let status: string;
        if (pct === 0) status = 'todo';
        else if (pct <= 40) status = 'in_progress';
        else if (pct < 100) status = 'review';
        else status = 'done';

        try {
            const { pb } = await import('@/lib/pocketbase');
            await pb.collection('tasks').update(task.id, { status });
            onTaskUpdated?.();
        } catch (err) {
            console.error('Failed to update task progress:', err);
        }
    };

    // ---------- Render states ----------
    if (error) {
        return (
            <div className="flex items-center justify-center h-full text-red-400 p-8">
                <p>Fehler beim Laden der Gantt-Daten: {error}</p>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full p-8">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <p className="text-muted-foreground text-sm font-medium">Lade Gantt-Daten...</p>
                </div>
            </div>
        );
    }

    if (tasks.length === 0) {
        return (
            <div className="flex items-center justify-center h-full p-8">
                <p className="text-muted-foreground">Keine Aufgaben mit Datumsangaben vorhanden.</p>
            </div>
        );
    }

    if (isMobile && activeView === 'timeline') {
        return (
            <div className="h-full flex flex-col">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-background/50">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Aufgabenliste
                    </span>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
                    {tasks.map((task) => (
                        <button
                            key={task.id}
                            onClick={() => onTaskClick?.(task.id)}
                            className="w-full text-left p-3 rounded-xl border border-border bg-card/40 hover:bg-accent/50 transition-colors"
                        >
                            <div className="flex items-center gap-2">
                                <span
                                    className={`w-2 h-2 rounded-full shrink-0 ${
                                        task.progress >= 100
                                            ? 'bg-emerald-500'
                                            : task.progress > 0
                                                ? 'bg-primary'
                                                : 'bg-zinc-600'
                                    }`}
                                />
                                <span className="text-sm font-medium text-foreground truncate">{task.name}</span>
                            </div>
                            <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
                                <span>{task.start} – {task.end}</span>
                                <span>{task.progress}%</span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className={cn(
                'gantt-container-root flex flex-col',
                activeView === 'timeline' ? 'flex-1' : 'shrink-0'
            )}
        >
            {/* Toolbar */}
            <div className="flex items-center gap-1.5 px-4 py-3 border-b border-border bg-background/50 shrink-0">
                {/* View switcher */}
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider mr-1">
                    Ansicht:
                </span>
                <ToolbarButton
                    active={activeView === 'timeline'}
                    onClick={() => onViewChange('timeline')}
                    title="Zeitplan"
                >
                    <BarChart3 size={14} />
                </ToolbarButton>
                <ToolbarButton
                    active={activeView === 'kanban'}
                    onClick={() => onViewChange('kanban')}
                    title="Kanban"
                >
                    <Columns3 size={14} />
                </ToolbarButton>
                <ToolbarButton
                    active={activeView === 'list'}
                    onClick={() => onViewChange('list')}
                    title="Liste"
                >
                    <List size={14} />
                </ToolbarButton>

                <div className="w-px h-5 bg-border mx-2" />

                {/* Zoom controls – only for timeline */}
                {activeView === 'timeline' && VIEW_MODES.map((mode) => (
                    <button
                        key={mode}
                        onClick={() => setViewMode(mode)}
                        className={`px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-widest rounded-lg transition-all ${
                            viewMode === mode
                                ? 'bg-primary text-black shadow-lg shadow-primary/20'
                                : 'text-muted-foreground hover:text-foreground hover:bg-accent/50 border border-transparent'
                        }`}
                    >
                        {VIEW_MODE_LABELS[mode] || mode}
                    </button>
                ))}

                <div className="flex-1" />

                {/* Fullscreen toggle */}
                <button
                    onClick={onToggleFullscreen}
                    className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all"
                    title={isFullscreen ? 'Vollbild verlassen' : 'Vollbild'}
                >
                    {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>
            </div>

            {/* Gantt SVG container – only rendered for timeline */}
            {activeView === 'timeline' && (
                <div ref={scrollRef} className="flex-1 overflow-auto gantt-outer pb-20">
                    <Gantt
                        key={containerWidth || undefined}
                        tasks={extendedTasks}
                        viewMode={VIEW_MODE_MAP[viewMode] || ViewMode.Month}
                        locale="de"
                        columnWidth={COLUMN_WIDTHS[viewMode] || 120}
                        listCellWidth=""
                        rowHeight={50}
                        barCornerRadius={6}
                        todayColor="rgba(0, 166, 153, 0.08)"
                        arrowColor="rgba(255, 255, 255, 0.15)"
                        fontFamily="inherit"
                        fontSize="11px"
                        barFill={75}
                        TooltipContent={CustomTooltipContent}
                        onClick={(task) => onTaskClick?.(task.id)}
                        onDateChange={handleDateChange}
                        onProgressChange={handleProgressChange}
                    />
                </div>
            )}
        </div>
    );
}

// ---------------------------------------------------------------------------
// ToolbarButton
// ---------------------------------------------------------------------------

function ToolbarButton({
    children,
    active,
    onClick,
    title,
}: {
    children: React.ReactNode;
    active: boolean;
    onClick: () => void;
    title: string;
}) {
    return (
        <button
            onClick={onClick}
            title={title}
            className={`p-2 rounded-lg transition-all ${
                active
                    ? 'bg-primary text-black shadow-lg shadow-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
            }`}
        >
            {children}
        </button>
    );
}

// ---------------------------------------------------------------------------
// cn utility (inline to avoid import issues)
// ---------------------------------------------------------------------------

function cn(...classes: (string | false | undefined | null)[]): string {
    return classes.filter(Boolean).join(' ');
}
