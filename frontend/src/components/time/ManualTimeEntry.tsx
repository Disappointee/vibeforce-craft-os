'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
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
import { Clock, Loader2, ChevronDown, ChevronRight, AlertCircle, Sparkles } from 'lucide-react';
import { format, parse, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { TimePicker } from '@/components/ui/time-picker';
import type { TimeEntryRecord } from '@/lib/pocketbase-types';
import { createTimeEntry, updateTimeEntry } from '@/app/actions/time-entries';
import { calculateBillableMinutes, formatBillingDuration } from '@/lib/billing-calculator';
import { useSettingsStore } from '@/lib/store';

interface TaskOption {
    id: string;
    title: string;
    projectKey: string;
    roundingInterval?: number;
    roundingMode?: 'ceil' | 'round';
    isBillableDefault?: boolean;
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

function timeStringToMinutes(timeStr: string): number {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
}

function minutesToTimeString(total: number): string {
    const h = Math.floor(total / 60) % 24;
    const m = total % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
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
    const [hours, setHours] = useState('1');
    const [minutes, setMinutes] = useState('0');
    const [description, setDescription] = useState('');
    const [isBillable, setIsBillable] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    const lastChangedRef = useRef<'start' | 'end' | 'duration' | 'init' | null>(null);
    const lastEditEntryId = useRef<string | undefined>(undefined);

    useEffect(() => {
        const currentId = editEntry?.id ?? '__none__';
        if (lastEditEntryId.current === currentId) return;
        lastEditEntryId.current = currentId;

        if (editEntry) {
            lastChangedRef.current = 'init';
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
                const duration = editEntry.duration_minutes || 0;
                const st = parseLocalDateTime(entryDateStr, '09:00');
                const stStr = `${String(st.getHours()).padStart(2, '0')}:${String(st.getMinutes()).padStart(2, '0')}`;
                setStartTime(stStr);
                const et = new Date(st.getTime() + duration * 60000);
                setEndTime(`${String(et.getHours()).padStart(2, '0')}:${String(et.getMinutes()).padStart(2, '0')}`);
            }

            const duration = editEntry.duration_minutes || 0;
            setHours(String(Math.floor(duration / 60)));
            setMinutes(String(duration % 60));
            setDescription(editEntry.description || '');
            setIsBillable(editEntry.is_billable !== false);
        } else {
            lastChangedRef.current = 'init';
            setSelectedTaskId('');
            setDateStr(initialDate || defaultDateStr);
            setDateDisplay(initialDate ? format(parseLocalDate(initialDate), 'dd.MM.yyyy', { locale: de }) : format(now, 'dd.MM.yyyy', { locale: de }));
            setStartTime('09:00');
            setEndTime('10:00');
            setHours('1');
            setMinutes('0');
            setDescription('');
            setIsBillable(true);
        }
    }, [editEntry, initialDate]);

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                const result = await pb.collection('tasks').getList(1, 200, {
                    sort: '-created',
                    expand: 'project,project.client',
                });
                setTasks(result.items.map((t: any) => {
                    const project = t.expand?.project;
                    const client = project?.expand?.client;
                    return {
                        id: t.id,
                        title: t.title,
                        projectKey: project?.key || '—',
                        roundingInterval: project?.billing_rounding !== 'inherit' ? project?.billing_rounding : client?.billing_rounding,
                        roundingMode: project?.rounding_mode !== 'inherit' ? project?.rounding_mode : client?.rounding_mode,
                        isBillableDefault: client?.abrechenbar ?? true,
                    };
                }));
            } catch (error) {
                console.error('Failed to fetch tasks:', error);
            }
        };
        fetchTasks();
    }, []);

    const handleStartTimeChange = (value: string) => {
        lastChangedRef.current = 'start';
        setStartTime(value);
    };

    const handleEndTimeChange = (value: string) => {
        lastChangedRef.current = 'end';
        setEndTime(value);
    };

    const handleHoursChange = (value: string) => {
        lastChangedRef.current = 'duration';
        setHours(value);
    };

    const handleMinutesChange = (value: string) => {
        lastChangedRef.current = 'duration';
        setMinutes(value);
    };

    const getTotalDuration = (): number => {
        return (parseInt(hours) || 0) * 60 + (parseInt(minutes) || 0);
    };

    useEffect(() => {
        if (lastChangedRef.current === 'init') return;
        if (lastChangedRef.current === 'start' || lastChangedRef.current === 'duration') {
            const startMinutes = timeStringToMinutes(startTime);
            const duration = getTotalDuration();
            const endTotal = startMinutes + duration;
            const newEndTime = minutesToTimeString(endTotal);
            setEndTime(newEndTime);
        }
    }, [startTime, hours, minutes]);

    useEffect(() => {
        if (lastChangedRef.current === 'init') return;
        if (lastChangedRef.current === 'end') {
            const startTotal = timeStringToMinutes(startTime);
            const endTotal = timeStringToMinutes(endTime);
            let diff = endTotal - startTotal;
            if (diff < 0) diff += 24 * 60;
            setHours(String(Math.floor(diff / 60)));
            setMinutes(String(diff % 60));
        }
    }, [endTime]);

    // Dual duration calculation (Raw vs. Billable)
    const selectedTask = tasks.find(t => t.id === selectedTaskId);
    const rawMinutes = getTotalDuration();

    const calculatedBillableMinutes = useMemo(() => {
        if (!isBillable || rawMinutes <= 0) return 0;
        const interval = (selectedTask?.roundingInterval as any) ?? useSettingsStore.getState().globalRoundingInterval ?? 6;
        const mode = selectedTask?.roundingMode ?? useSettingsStore.getState().globalRoundingMode ?? 'ceil';
        return calculateBillableMinutes({
            rawMinutes,
            interval,
            mode,
            isBillable,
        });
    }, [rawMinutes, isBillable, selectedTask]);

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

        const totalMinutes = getTotalDuration();
        if (totalMinutes < 1) {
            toast.error('Bitte gib eine gültige Dauer ein (mindestens 1 Minute)');
            return;
        }

        setIsSubmitting(true);
        try {
            const datePart = dateStr;
            const startDateTime = parseLocalDateTime(datePart, startTime);
            const endDateTime = new Date(startDateTime.getTime() + totalMinutes * 60000);

            const payload = {
                task: selectedTaskId,
                start_time: startDateTime.toISOString(),
                end_time: endDateTime.toISOString(),
                duration_minutes: totalMinutes,
                billable_minutes: calculatedBillableMinutes,
                description: description || undefined,
                is_billable: isBillable,
                date: datePart,
            };

            let res;
            if (editEntry) {
                res = await updateTimeEntry(editEntry.id, payload);
            } else {
                res = await createTimeEntry(payload);
            }

            if (!res.success) {
                toast.error(res.error || 'Fehler beim Speichern des Zeiteintrags');
                return;
            }

            toast.success(
                editEntry
                    ? `Zeiteintrag aktualisiert: ${totalMinutes} Min. (${formatBillingDuration(calculatedBillableMinutes)} abrechenbar)`
                    : `Zeiteintrag erfasst: ${totalMinutes} Min. (${formatBillingDuration(calculatedBillableMinutes)} abrechenbar)`
            );

            setSelectedTaskId('');
            setStartTime('09:00');
            setEndTime('10:00');
            setHours('1');
            setMinutes('0');
            setDescription('');
            onEntryCreated();
        } catch (err: unknown) {
            console.error(err);
            const msg = err instanceof Error ? err.message : 'Fehler beim Erstellen des Zeiteintrags';
            toast.error(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const formContent = (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Task Select */}
            <div className="space-y-1.5">
                <Label className="text-muted-foreground text-xs">Aufgabe</Label>
                <Select
                    value={selectedTaskId || null}
                    onValueChange={(val) => {
                        if (val) {
                            setSelectedTaskId(val);
                            const t = tasks.find(item => item.id === val);
                            if (t && typeof t.isBillableDefault === 'boolean') {
                                setIsBillable(t.isBillableDefault);
                            }
                        }
                    }}
                >
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

            {/* Date */}
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
                        onChange={handleStartTimeChange}
                    />
                </div>
                <div className="space-y-1.5">
                    <Label className="text-muted-foreground text-xs">Endzeit</Label>
                    <TimePicker
                        value={endTime}
                        onChange={handleEndTimeChange}
                    />
                </div>
            </div>

            {/* Duration Display + Dual Duration Badge */}
            <div className="rounded-xl bg-background border border-border px-4 py-3 space-y-3">
                <div className="flex items-center justify-between">
                    <div>
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest block">Erfasste Zeit</span>
                        <span className="text-lg font-black text-primary tabular-nums">
                            {(parseInt(hours) || 0)}h {(parseInt(minutes) || 0)}m
                        </span>
                    </div>

                    {isBillable && (
                        <div className="text-right">
                            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest flex items-center justify-end gap-1">
                                <Sparkles size={10} className="text-amber-400" /> Abrechenbar
                            </span>
                            <span className="text-sm font-bold text-amber-400 tabular-nums">
                                {formatBillingDuration(calculatedBillableMinutes)}
                            </span>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <Label className="text-muted-foreground text-xs">Stunden</Label>
                        <Input
                            type="number"
                            min="0"
                            max="24"
                            placeholder="0"
                            value={hours}
                            onChange={(e) => handleHoursChange(e.target.value)}
                            className="bg-background border-border"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-muted-foreground text-xs">Minuten</Label>
                        <Input
                            type="number"
                            min="0"
                            max="59"
                            placeholder="0"
                            value={minutes}
                            onChange={(e) => handleMinutesChange(e.target.value)}
                            className="bg-background border-border"
                        />
                    </div>
                </div>
            </div>

            {/* Billable Switch & Description */}
            <div className="flex items-center justify-between py-1">
                <Label htmlFor="manual-billable" className="text-xs text-foreground font-medium cursor-pointer">
                    Abrechenbare Leistung
                </Label>
                <input
                    id="manual-billable"
                    type="checkbox"
                    checked={isBillable}
                    onChange={(e) => setIsBillable(e.target.checked)}
                    className="rounded border-border text-primary cursor-pointer h-4 w-4"
                />
            </div>

            <div className="space-y-1.5">
                <Label className="text-muted-foreground text-xs">Beschreibung (optional)</Label>
                <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Woran hast du gearbeitet?"
                    className="bg-background border-border resize-none h-20 text-xs"
                />
            </div>

            <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
            >
                {isSubmitting ? (
                    <>
                        <Loader2 size={16} className="animate-spin mr-2" />
                        Wird gespeichert...
                    </>
                ) : (
                    <>
                        <Clock size={16} className="mr-2" />
                        {editEntry ? 'Zeiteintrag aktualisieren' : 'Zeit erfassen'}
                    </>
                )}
            </Button>
        </form>
    );

    if (isInsideSheet) {
        return formContent;
    }

    return (
        <Card className="border-border bg-card/40">
            <CardHeader className="cursor-pointer select-none" onClick={() => {
                const next = !isCollapsed;
                setIsCollapsed(next);
                onCollapseChange?.(next);
            }}>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <Clock size={18} className="text-primary" />
                        {editEntry ? 'Zeiteintrag bearbeiten' : 'Manuelle Zeiterfassung'}
                    </CardTitle>
                    {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                </div>
            </CardHeader>
            {!isCollapsed && <CardContent>{formContent}</CardContent>}
        </Card>
    );
}
