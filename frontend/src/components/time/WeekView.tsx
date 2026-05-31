'use client';

import { useMemo } from 'react';
import { TimeEntryRecord } from '@/lib/pocketbase-types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, CalendarDays, Plus } from 'lucide-react';
import { format, startOfWeek, endOfWeek, addDays, addWeeks, subWeeks, parseISO, isSameDay } from 'date-fns';
import { de } from 'date-fns/locale';
import { useIsMobile } from '@/hooks/use-is-mobile';

interface WeekViewProps {
    entries: TimeEntryRecord[];
    currentDate: Date;
    onPrevWeek: () => void;
    onNextWeek: () => void;
    onDayClick?: (day: Date) => void;
    onEntryClick?: (entryId: string, taskId: string) => void;
}

export function WeekView({ entries, currentDate, onPrevWeek, onNextWeek, onDayClick, onEntryClick }: WeekViewProps) {
    const isMobile = useIsMobile();
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });

    const days = useMemo(() => {
        const result: Date[] = [];
        for (let i = 0; i < 7; i++) {
            result.push(addDays(weekStart, i));
        }
        return result;
    }, [weekStart]);

    const getEntriesForDay = (day: Date): TimeEntryRecord[] => {
        return entries.filter((entry) => {
            const entryDate = entry.start_time ? parseISO(entry.start_time) : parseISO(entry.created);
            return isSameDay(entryDate, day);
        });
    };

    const getTotalMinutesForDay = (day: Date): number => {
        return getEntriesForDay(day).reduce((sum, entry) => sum + (entry.duration_minutes || 0), 0);
    };

    const weekTotalMinutes = days.reduce((sum, day) => sum + getTotalMinutesForDay(day), 0);

    const formatDuration = (minutes: number) => {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        if (h > 0) return `${h}h ${m}m`;
        return `${m}m`;
    };

    const isToday = (day: Date) => isSameDay(day, new Date());

    return (
        <Card className="border-border bg-card/40 backdrop-blur-md">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-foreground text-base font-bold uppercase tracking-tight">
                        <CalendarDays size={18} className="text-primary" />
                        Wochenansicht
                    </CardTitle>
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-muted-foreground">
                            {format(weekStart, 'dd.', { locale: de })} — {format(weekEnd, 'dd. MMM yyyy', { locale: de })}
                        </span>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={onPrevWeek}
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <button
                                onClick={onNextWeek}
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {/* Week total */}
                <div className="mb-6 rounded-2xl bg-card border border-border p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
                    <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                            Wochensumme
                        </span>
                        <h4 className="text-sm font-bold text-foreground">
                            Gesamte erfasste Arbeitszeit
                        </h4>
                        <p className="text-xs text-muted-foreground">
                            Arbeitsstunden in dieser Kalenderwoche vom {format(weekStart, 'dd. MMMM', { locale: de })} bis zum {format(weekEnd, 'dd. MMMM yyyy', { locale: de })}.
                        </p>
                    </div>
                    <div className="flex flex-col items-start md:items-end justify-center">
                        <span 
                            className="text-4xl font-black text-primary tabular-nums tracking-tight"
                            style={{ textShadow: '0 0 8px rgba(20, 184, 166, 0.25)' }}
                        >
                            {formatDuration(weekTotalMinutes)}
                        </span>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                            Stunden Gesamt
                        </span>
                    </div>
                </div>

                {/* Day columns */}
                <div className="grid grid-cols-7 gap-1 md:gap-3">
                    {days.map((day) => {
                        const dayEntries = getEntriesForDay(day);
                        const dayMinutes = getTotalMinutesForDay(day);
                        const today = isToday(day);

                        return (
                            <button
                                key={day.toISOString()}
                                onClick={() => onDayClick?.(day)}
                                className={`flex flex-col rounded-xl md:rounded-2xl border p-2 md:p-4 min-h-[80px] md:min-h-[140px] text-left transition-all group relative ${today
                                        ? 'border-primary/30 bg-primary/5 shadow-lg shadow-primary/5'
                                        : 'border-border bg-background/30 hover:border-border hover:bg-accent/50'
                                    }`}
                            >
                                {/* Day header */}
                                <div className="text-center mb-2 md:mb-4">
                                    <div className={`text-[9px] md:text-[10px] uppercase tracking-widest font-black ${today ? 'text-primary' : 'text-muted-foreground'
                                        }`}>
                                        {format(day, isMobile ? 'EEEEEE' : 'EEEE', { locale: de })}
                                    </div>
                                    <div className={`text-lg md:text-2xl font-black mt-0.5 md:mt-1 ${today ? 'text-blue-300' : 'text-foreground'
                                        }`}>
                                        {format(day, 'dd')}
                                    </div>
                                    {dayMinutes > 0 ? (
                                        <div className="text-[9px] md:text-[10px] font-bold text-primary/70 bg-primary/5 rounded-full px-1.5 md:px-2 py-0.5 mt-1 md:mt-2 inline-block tabular-nums">
                                            {formatDuration(dayMinutes)}
                                        </div>
                                    ) : (
                                        <div className="h-3 md:h-4"></div>
                                    )}
                                </div>

                                {/* Entries - hidden on mobile, shown on md+ */}
                                <div className="hidden md:block space-y-1.5 flex-1">
                                    {dayEntries.slice(0, 3).map((entry) => (
                                        <div
                                            key={entry.id}
                                            className="text-[10px] bg-card/50 backdrop-blur-sm rounded-lg px-2 py-1.5 truncate text-muted-foreground border border-border font-medium cursor-pointer hover:bg-card transition-colors"
                                            title={entry.description || ''}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEntryClick?.(entry.id, (entry as any).task);
                                            }}
                                        >
                                            {entry.duration_minutes}m
                                            {entry.description && ` · ${entry.description}`}
                                        </div>
                                    ))}
                                    {dayEntries.length > 3 && (
                                        <div className="text-[10px] text-muted-foreground text-center font-bold">
                                            +{dayEntries.length - 3} weitere
                                        </div>
                                    )}
                                </div>

                                {/* Mobile entry count badge */}
                                {dayEntries.length > 0 && (
                                    <div className="md:hidden absolute top-1 right-1 bg-primary/10 text-primary rounded-full h-4 w-4 flex items-center justify-center text-[8px] font-bold tabular-nums">
                                        {dayEntries.length}
                                    </div>
                                )}

                                {/* Add Icon bottom-right on hover */}
                                <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="bg-primary text-primary-foreground rounded-full p-1 shadow-lg">
                                        <Plus size={14} />
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
