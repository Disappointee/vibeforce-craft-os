'use client';

import { useState, useEffect, useCallback } from 'react';
import { pb } from '@/lib/pocketbase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Clock, Loader2, RefreshCw, ChevronDown, ChevronRight } from 'lucide-react';
import { format, parse, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { TimePicker } from '@/components/ui/time-picker';
import { TimeEntryRecord } from '@/lib/pocketbase-types';

interface TaskOption {
    id: string;
    title: string;
    projectKey: string;
}

interface ManualTimeEntryProps {
    onEntryCreated: () => void;
    initialDate?: string;
    onCollapseChange?: (collapsed: boolean) => void;
    isInsideSheet?: boolean;
    editEntry?: TimeEntryRecord;
}

function parseLocalDate(dateStr: string): Date {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
}

function parseLocalDateTime(dateStr: string, timeStr: string): Date {
    const [y, m, d] = dateStr.split('-').map(Number);
    const [hh, mm] = timeStr.split(':').map(Number);
    return new Date(y, m - 1, d, hh, mm, 0);
}

export function ManualTimeEntry({ onEntryCreated, initialDate, onCollapseChange, isInsideSheet = false, editEntry }: ManualTimeEntryProps) {
    const [tasks, setTasks] = useState<TaskOption[]>([]);
    const [selectedTaskId, setSelectedTaskId] = useState('');
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const defaultDateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const defaultTimeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const [dateStr, setDateStr] = useState(initialDate || defaultDateStr);
    const [dateDisplay, setDateDisplay] = useState(() =>
        initialDate ? format(parseLocalDate(initialDate), 'dd.MM.yyyy', { locale: de }) : format(now, 'dd.MM.yyyy', { locale: de })
    );
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('10:00');
    const [customTime, setCustomTime] = useState(defaultTimeStr);
    const [manualDuration, setManualDuration] = useState(false);
    const [hours, setHours] = useState('');
    const [minutes, setMinutes] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    useEffect(() => {
        if (editEntry) {
            setSelectedTaskId(editEntry.task);
            
            const entryDate = editEntry.start_time ? parseISO(editEntry.start_time) : (editEntry.date ? parseLocalDate(editEntry.date) : new Date(editEntry.created));
            const entryDateStr = editEntry.date || format(entryDate, 'yyyy-MM-dd');
            setDateStr(entryDateStr);
            setDateDisplay(format(entryDate, 'dd.MM.yyyy', { locale: de }));
            
            if (editEntry.start_time && editEntry.end_time) {
                const sDate = parseISO(editEntry.start_time);
                const eDate = parseISO(editEntry.end_time);
                setStartTime(`${String(sDate.getHours()).padStart(2, '0')}:${String(sDate.getMinutes()).padStart(2, '0')}`);
                setEndTime(`${String(eDate.getHours()).padStart(2, '0')}:${String(eDate.getMinutes()).padStart(2, '0')}`);
            } else {
                setStartTime('09:00');
                setEndTime('10:00');
            }
            
            // Set duration override
            setManualDuration(true);
            const duration = editEntry.duration_minutes || 0;
            setHours(String(Math.floor(duration / 60) || 0));
            setMinutes(String(duration % 60 || 0));
            
            setDescription(editEntry.description || '');
        } else {
            // Reset to defaults if editEntry goes back to null
            setSelectedTaskId('');
            setDateStr(initialDate || defaultDateStr);
            setDateDisplay(initialDate ? format(parseLocalDate(initialDate), 'dd.MM.yyyy', { locale: de }) : format(now, 'dd.MM.yyyy', { locale: de }));
            setStartTime('09:00');
            setEndTime('10:00');
            setManualDuration(false);
            setHours('');
            setMinutes('');
            setDescription('');
        }
    }, [editEntry, initialDate]);

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                const result = await pb.collection('tasks').getList(1, 200, {
                    sort: '-created',
                    expand: 'project',
                });
                setTasks(result.items.map((t: any) => ({
                    id: t.id,
                    title: t.title,
                    projectKey: t.expand?.project?.key || '—',
                })));
            } catch (error) {
                console.error('Failed to fetch tasks:', error);
            }
        };
        fetchTasks();
    }, []);

    // Calculate duration from start/end times
    const calculateDuration = (): number => {
        const [startH, startM] = startTime.split(':').map(Number);
        const [endH, endM] = endTime.split(':').map(Number);
        const startTotal = startH * 60 + startM;
        const endTotal = endH * 60 + endM;
        let diff = endTotal - startTotal;
        if (diff < 0) diff += 24 * 60; // handle crossing midnight
        return diff;
    };

    const calculatedMinutes = calculateDuration();
    const calculatedHours = Math.floor(calculatedMinutes / 60);
    const calculatedRemainder = calculatedMinutes % 60;

    const getDurationMinutes = (): number => {
        if (manualDuration) {
            return (parseInt(hours) || 0) * 60 + (parseInt(minutes) || 0);
        }
        return calculatedMinutes;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTaskId) {
            toast.error('Bitte wähle eine Aufgabe aus');
            return;
        }
        if (!dateStr) {
            toast.error('Bitte wähle ein Datum');
            return;
        }

        const totalMinutes = getDurationMinutes();
        if (totalMinutes < 1) {
            toast.error('Bitte gib eine gültige Dauer ein');
            return;
        }

        setIsSubmitting(true);
        try {
            const datePart = dateStr;
            const startDateTime = parseLocalDateTime(datePart, startTime);
            const endDateTime = parseLocalDateTime(datePart, endTime);
            // If end time is before start time, it crosses midnight
            if (endDateTime <= startDateTime) {
                endDateTime.setDate(endDateTime.getDate() + 1);
            }

            const payload = {
                task: selectedTaskId,
                user: pb.authStore.record?.id,
                start_time: startDateTime.toISOString(),
                end_time: endDateTime.toISOString(),
                duration_minutes: totalMinutes,
                description: description || undefined,
                is_billable: true,
                date: datePart,
            };

            if (editEntry) {
                await pb.collection('time_entries').update(editEntry.id, payload);
                toast.success(`Zeiteintrag aktualisiert: ${totalMinutes} Min.`);
            } else {
                await pb.collection('time_entries').create(payload);
                toast.success(`Zeiteintrag erstellt: ${totalMinutes} Min.`);
            }
            setSelectedTaskId('');
            setStartTime('09:00');
            setEndTime('10:00');
            setHours('');
            setMinutes('');
            setManualDuration(false);
            setDescription('');
            onEntryCreated();
        } catch (error) {
            toast.error('Fehler beim Erstellen des Zeiteintrags');
        } finally {
            setIsSubmitting(false);
        }
    };

    const formContent = (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Task Select */}
            <div className="space-y-1.5">
                <Label className="text-muted-foreground text-xs">Aufgabe</Label>
                <Select value={selectedTaskId || null} onValueChange={(val) => val && setSelectedTaskId(val)}>
                    <SelectTrigger className="bg-background border-border w-full">
                        <SelectValue placeholder="Aufgabe auswählen...">
                            {(value: string) => {
                                if (!value) return 'Aufgabe auswählen...';
                                const task = tasks.find(t => t.id === value);
                                return task ? `[${task.projectKey}] ${task.title}` : value;
                            }}
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-background border-border text-foreground max-h-60">
                        {tasks.map((task) => (
                            <SelectItem key={task.id} value={task.id}>
                                <span className="flex items-center gap-2">
                                    <span className="text-[10px] font-mono text-muted-foreground">{task.projectKey}</span>
                                    {task.title}
                                </span>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Date (German format display, ISO internally) */}
            <div className="space-y-1.5">
                <Label className="text-muted-foreground text-xs">Datum</Label>
                <div className="flex gap-2">
                    <Input
                        type="text"
                        value={dateDisplay}
                        placeholder="TT.MM.JJJJ"
                        onChange={(e) => setDateDisplay(e.target.value)}
                        onBlur={() => {
                            try {
                                const parsed = parse(dateDisplay, 'dd.MM.yyyy', new Date(), { locale: de });
                                if (!isNaN(parsed.getTime())) {
                                    setDateStr(format(parsed, 'yyyy-MM-dd'));
                                    setDateDisplay(format(parsed, 'dd.MM.yyyy', { locale: de }));
                                }
                            } catch {
                                setDateDisplay(format(new Date(dateStr), 'dd.MM.yyyy', { locale: de }));
                            }
                        }}
                        className="bg-background border-border flex-1"
                    />
                    <TimePicker
                        value={customTime}
                        onChange={setCustomTime}
                    />
                </div>
            </div>

            {/* Start Time & End Time */}
            <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                    <Label className="text-muted-foreground text-xs">Startzeit</Label>
                    <TimePicker
                        value={startTime}
                        onChange={setStartTime}
                    />
                </div>
                <div className="space-y-1.5">
                    <Label className="text-muted-foreground text-xs">Endzeit</Label>
                    <TimePicker
                        value={endTime}
                        onChange={setEndTime}
                    />
                </div>
            </div>

            {/* Auto-calculated duration display */}
            {!manualDuration && calculatedMinutes > 0 && (
                <div className="rounded-xl bg-background border border-border px-4 py-3 flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Dauer</span>
                    <span className="text-lg font-black text-primary tabular-nums">
                        {calculatedHours}h {calculatedRemainder}m
                    </span>
                </div>
            )}

            {/* Manual duration override toggle */}
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={() => setManualDuration(!manualDuration)}
                    className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-md transition-colors ${manualDuration
                        ? 'text-amber-400 bg-amber-500/10 border border-amber-500/20'
                        : 'text-muted-foreground hover:text-foreground border border-transparent'
                        }`}
                >
                    <RefreshCw size={12} />
                    {manualDuration ? 'Manuelle Dauer aktiv' : 'Dauer manuell eingeben'}
                </button>
            </div>

            {/* Manual Duration (shown when override is active) */}
            {manualDuration && (
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <Label className="text-muted-foreground text-xs">Stunden</Label>
                        <Input
                            type="number"
                            min="0"
                            max="24"
                            placeholder="0"
                            value={hours}
                            onChange={(e) => setHours(e.target.value)}
                            className="bg-background border-border"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-muted-foreground text-xs">Minuten</Label>
                        <Input
                            type="number"
                            min="0"
                            max="59"
                            placeholder="30"
                            value={minutes}
                            onChange={(e) => setMinutes(e.target.value)}
                            className="bg-background border-border"
                        />
                    </div>
                </div>
            )}

            {/* Description */}
            <div className="space-y-1.5">
                <Label className="text-muted-foreground text-xs">Beschreibung (optional)</Label>
                <Textarea
                    placeholder="Was wurde gemacht?"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="bg-background border-border resize-y min-h-[100px]"
                />
            </div>

            <Button
                type="submit"
                disabled={isSubmitting || !selectedTaskId}
                className="w-full bg-primary hover:bg-primary/80 text-black font-bold h-11 rounded-xl shadow-lg shadow-primary/10 transition-all active:scale-[0.98]"
            >
                {isSubmitting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                    editEntry ? 'Änderungen speichern' : 'Zeit eintragen'
                )}
            </Button>
        </form>
    );

    if (isInsideSheet) {
        return formContent;
    }

    return (
        <Card className="border-border bg-card/40 backdrop-blur-md">
            <CardHeader className="cursor-pointer" onClick={() => {
                const next = !isCollapsed;
                setIsCollapsed(next);
                onCollapseChange?.(next);
            }}>
                <CardTitle className="flex items-center gap-2 text-foreground text-base font-bold uppercase tracking-tight">
                    <Clock size={18} className="text-primary" />
                    Manueller Zeiteintrag
                    {isCollapsed ? (
                        <ChevronRight size={16} className="ml-auto text-muted-foreground" />
                    ) : (
                        <ChevronDown size={16} className="ml-auto text-muted-foreground" />
                    )}
                </CardTitle>
            </CardHeader>
            {!isCollapsed && (
                <CardContent>
                    {formContent}
                </CardContent>
            )}
        </Card>
    );
}
