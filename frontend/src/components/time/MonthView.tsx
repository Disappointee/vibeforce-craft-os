'use client';

import { useMemo, useState } from 'react';
import { TimeEntryRecord } from '@/lib/pocketbase-types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Calendar, Clock, Plus } from 'lucide-react';
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    addDays,
    addMonths,
    subMonths,
    parseISO,
    isSameMonth,
    isSameDay,
    isToday,
} from 'date-fns';
import { de } from 'date-fns/locale';

interface MonthViewProps {
    entries: TimeEntryRecord[];
    currentDate: Date;
    onPrevMonth: () => void;
    onNextMonth: () => void;
    onDayClick?: (day: Date) => void;
    onEditEntry?: (entry: TimeEntryRecord) => void;
}

export function MonthView({ entries, currentDate, onPrevMonth, onNextMonth, onDayClick, onEditEntry }: MonthViewProps) {
    const [selectedDay, setSelectedDay] = useState<Date | null>(null);
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const weeks = useMemo(() => {
        const result: Date[][] = [];
        let day = calendarStart;
        while (day <= calendarEnd) {
            const week: Date[] = [];
            for (let i = 0; i < 7; i++) {
                week.push(day);
                day = addDays(day, 1);
            }
            result.push(week);
        }
        return result;
    }, [calendarStart, calendarEnd]);

    const getEntriesForDay = (day: Date): TimeEntryRecord[] => {
        return entries.filter((entry) => {
            const entryDate = entry.start_time ? parseISO(entry.start_time) : parseISO(entry.created);
            return isSameDay(entryDate, day);
        });
    };

    const getTotalMinutesForDay = (day: Date): number => {
        return getEntriesForDay(day).reduce((sum, entry) => sum + (entry.duration_minutes || 0), 0);
    };

    const monthTotalMinutes = entries.reduce((sum, entry) => sum + (entry.duration_minutes || 0), 0);

    const formatDuration = (minutes: number) => {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        if (h > 0) return `${h}h ${m}m`;
        return `${m}m`;
    };

    // Stats
    const daysWithEntries = new Set(
        entries.map((entry) => {
            const d = entry.start_time ? parseISO(entry.start_time) : parseISO(entry.created);
            return format(d, 'yyyy-MM-dd');
        })
    ).size;

    const avgMinutesPerDay = daysWithEntries > 0 ? Math.round(monthTotalMinutes / daysWithEntries) : 0;

    const getIntensityClass = (minutes: number): string => {
        if (minutes === 0) return '';
        if (minutes < 60) return 'bg-primary/10';
        if (minutes < 240) return 'bg-primary/25';
        if (minutes < 480) return 'bg-primary/40';
        return 'bg-primary/60';
    };

    return (
        <Card className="border-border bg-card/40 backdrop-blur-md">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-foreground text-base font-bold uppercase tracking-tight">
                        <Calendar size={18} className="text-amber-500" />
                        Monatsansicht
                    </CardTitle>
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-muted-foreground">
                            {format(currentDate, 'MMMM yyyy', { locale: de })}
                        </span>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={onPrevMonth}
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <button
                                onClick={onNextMonth}
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {/* Stats row */}
                <div className="grid grid-cols-3 gap-2 md:gap-4 mb-6 md:mb-8">
                    <div className="rounded-xl md:rounded-2xl bg-background border border-border p-3 md:p-4 text-center shadow-xl shadow-black/20">
                        <div className="text-lg md:text-xl font-black text-primary tabular-nums">
                            {formatDuration(monthTotalMinutes)}
                        </div>
                        <div className="text-[9px] md:text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Monatssumme</div>
                    </div>
                    <div className="rounded-xl md:rounded-2xl bg-background border border-border p-3 md:p-4 text-center shadow-xl shadow-black/20">
                        <div className="text-lg md:text-xl font-black text-foreground tabular-nums">
                            {daysWithEntries}
                        </div>
                        <div className="text-[9px] md:text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Tage mit Einträgen</div>
                    </div>
                    <div className="rounded-xl md:rounded-2xl bg-background border border-border p-3 md:p-4 text-center shadow-xl shadow-black/20">
                        <div className="text-lg md:text-xl font-black text-foreground tabular-nums">
                            {formatDuration(avgMinutesPerDay)}
                        </div>
                        <div className="text-[9px] md:text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Ø pro Tag</div>
                    </div>
                </div>

                {/* Calendar grid */}
                <div className="space-y-1.5">
                    {/* Day headers */}
                    <div className="grid grid-cols-7 gap-1.5 mb-2">
                        {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((day) => (
                            <div key={day} className="text-center text-[10px] uppercase tracking-widest text-muted-foreground font-black py-1">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Week rows */}
                    {weeks.map((week, weekIdx) => (
                        <div key={weekIdx} className="grid grid-cols-7 gap-1.5">
                            {week.map((day) => {
                                const inMonth = isSameMonth(day, currentDate);
                                const dayMinutes = getTotalMinutesForDay(day);
                                const today = isToday(day);
                                const isSelected = selectedDay && isSameDay(day, selectedDay);

                                return (
                                    <button
                                        key={day.toISOString()}
                                        onClick={() => {
                                            if (!inMonth) return;
                                            if (isSelected) {
                                                setSelectedDay(null);
                                            } else {
                                                setSelectedDay(day);
                                                onDayClick?.(day);
                                            }
                                        }}
                                        disabled={!inMonth}
                                        className={`aspect-square rounded-xl border p-2 transition-all group relative text-left ${!inMonth
                                            ? 'border-transparent opacity-10 cursor-default'
                                            : isSelected
                                                ? 'border-primary/60 bg-primary/15 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/30'
                                                : today
                                                    ? 'border-primary/40 bg-primary/10 shadow-lg shadow-amber-500/5'
                                                    : dayMinutes > 0
                                                        ? 'border-border bg-card/50 hover:bg-accent/50 hover:border-white/20'
                                                        : 'border-border bg-background/30 hover:bg-accent/50 hover:border-border'
                                            } ${getIntensityClass(dayMinutes)}`}
                                    >
                                        <div className={`text-xs font-bold ${today ? 'text-amber-200' : inMonth ? 'text-muted-foreground group-hover:text-foreground' : 'text-muted-foreground/30'
                                            }`}>
                                            {format(day, 'd')}
                                        </div>
                                        {dayMinutes > 0 && (
                                            <div className="text-[9px] font-bold text-amber-500/70 mt-1 tabular-nums leading-tight">
                                                {formatDuration(dayMinutes)}
                                            </div>
                                        )}
                                        {inMonth && (
                                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10 scale-75 group-hover:scale-100 pointer-events-none">
                                                <div className="bg-primary text-black rounded-full p-0.5 shadow-lg shadow-amber-500/30 border border-amber-300/20 flex items-center justify-center">
                                                    <Plus size={10} className="stroke-[3]" />
                                                </div>
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    ))}
                </div>

                {/* Day Detail Panel - shown when a day is selected */}
                {selectedDay && (() => {
                    const dayEntries = getEntriesForDay(selectedDay);
                    const dayMinutes = getTotalMinutesForDay(selectedDay);
                    return (
                        <div className="mt-6 rounded-2xl border border-border bg-background/50 p-4">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <Clock size={16} className="text-amber-500" />
                                    <span className="text-sm font-bold text-foreground">
                                        {format(selectedDay, 'EEEE, dd. MMM yyyy', { locale: de })}
                                    </span>
                                    {dayMinutes > 0 && (
                                        <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full tabular-nums">
                                            {formatDuration(dayMinutes)}
                                        </span>
                                    )}
                                </div>
                                <button
                                    onClick={() => setSelectedDay(null)}
                                    className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-muted-foreground transition-colors"
                                >
                                    Schließen
                                </button>
                            </div>
                            {dayEntries.length === 0 ? (
                                <div className="text-center py-6">
                                    <p className="text-sm text-muted-foreground italic">Keine Einträge an diesem Tag</p>
                                    <button
                                        onClick={() => onDayClick?.(selectedDay)}
                                        className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-amber-300 transition-colors"
                                    >
                                        <Plus size={14} />
                                        Neuen Eintrag erstellen
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {dayEntries.map((entry) => {
                                        const task = (entry as any).expand?.task;
                                        const project = task?.expand?.project;
                                        return (
                                            <div
                                                key={entry.id}
                                                onClick={() => onEditEntry?.(entry)}
                                                className="flex items-center justify-between rounded-xl bg-card/50 border border-border px-4 py-2.5 cursor-pointer hover:bg-card hover:border-primary/30 transition-colors"
                                                title="Klicken zum Bearbeiten"
                                            >
                                                <div className="flex items-center gap-2 min-w-0">
                                                    {project && (
                                                        <span className="text-[10px] font-bold tracking-wider text-amber-500/50 bg-primary/5 border border-primary/10 px-1.5 py-0.5 rounded shrink-0">
                                                            {project.key}
                                                        </span>
                                                    )}
                                                    <span className="text-sm text-foreground truncate">
                                                        {task?.title || 'Unbekannte Aufgabe'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-3 shrink-0">
                                                    {entry.description && (
                                                        <span className="text-[10px] text-muted-foreground hidden sm:block max-w-[120px] truncate">
                                                            {entry.description}
                                                        </span>
                                                    )}
                                                    <span className="text-sm font-mono font-bold text-foreground tabular-nums">
                                                        {formatDuration(entry.duration_minutes || 0)}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })()}
            </CardContent>
        </Card>
    );
}
