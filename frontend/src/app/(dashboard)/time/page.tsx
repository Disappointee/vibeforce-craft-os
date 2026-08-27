'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { pb } from '@/lib/pocketbase';
import { TimeEntryRecord, ClientRecord } from '@/lib/pocketbase-types';
import { Clock, Loader2, Filter, Building2, Plus, ChevronDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { ManualTimeEntry } from '@/components/time/ManualTimeEntry';
import { TimeEntryList } from '@/components/time/TimeEntryList';
import { WeekView } from '@/components/time/WeekView';
import { MonthView } from '@/components/time/MonthView';
import { TaskDetailsDialog } from '@/components/tasks/TaskDetailsDialog';
import { DayEntriesDialog } from '@/components/time/DayEntriesDialog';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { addWeeks, subWeeks, addMonths, subMonths, isSameDay, parseISO } from 'date-fns';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { TimeExportButton } from '@/components/time/TimeExportButton';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

type ViewMode = 'week' | 'month';

interface ProjectOption {
    id: string;
    key: string;
    name: string;
    client?: string;
}

export default function TimePage() {
    const [entries, setEntries] = useState<TimeEntryRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewMode, setViewMode] = useState<ViewMode>('week');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [projects, setProjects] = useState<ProjectOption[]>([]);
    const [filterProject, setFilterProject] = useState<string>('all');
    const [filterBillable, setFilterBillable] = useState<string>('all');
    const [filterBillingStatus, setFilterBillingStatus] = useState<string>('all');
    const [selectedClients, setSelectedClients] = useState<string[]>([]);
    const [clients, setClients] = useState<ClientRecord[]>([]);
    const [isManualEntryOpen, setIsManualEntryOpen] = useState(false);
    const [isDayDetailOpen, setIsDayDetailOpen] = useState(false);
    const [detailDay, setDetailDay] = useState<Date | null>(null);
    const [editingEntry, setEditingEntry] = useState<TimeEntryRecord | null>(null);
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

    // Fetch projects for filter
    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const result = await pb.collection('projects').getList(1, 100, {
                    sort: 'key',
                    fields: 'id,key,name,client',
                });
                setProjects(result.items as unknown as ProjectOption[]);
            } catch (error) {
                console.error('Failed to fetch projects:', error);
            }
        };
        fetchProjects();
    }, []);

    // Fetch clients for filter
    useEffect(() => {
        pb.collection('clients').getList(1, 100, { sort: 'name' })
            .then(res => setClients(res.items as ClientRecord[]))
            .catch(() => {});
    }, []);

    // Filter projects depending on client selection
    const filteredProjectOptions = useMemo(() => {
        if (selectedClients.length === 0) return projects;
        return projects.filter(p => p.client && selectedClients.includes(p.client));
    }, [projects, selectedClients]);

    // Reset project filter if it becomes invalid under selected clients
    useEffect(() => {
        if (filterProject !== 'all') {
            const isProjectValid = filteredProjectOptions.some(p => p.id === filterProject);
            if (!isProjectValid) {
                setFilterProject('all');
            }
        }
    }, [filteredProjectOptions, filterProject]);

    const fetchEntries = useCallback(async () => {
        setIsLoading(true);
        try {
            const result = await pb.collection('time_entries').getList(1, 200, {
                sort: '-created',
                expand: 'task,task.project,task.project.client,user',
                filter: pb.filter('user = {:uid}', { uid: pb.authStore.record?.id }),
            });
            setEntries(result.items as TimeEntryRecord[]);
        } catch (error) {
            console.error('Failed to fetch time entries:', error);
            toast.error('Fehler beim Laden der Zeiteinträge');
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Filter entries reactively
    const filteredEntries = useMemo(() => {
        return entries.filter((entry) => {
            // Project Filter
            if (filterProject !== 'all') {
                const task = (entry as any).expand?.task;
                const project = task?.expand?.project;
                if (project?.id !== filterProject) return false;
            }

            // Filter: Client
            if (selectedClients.length > 0) {
                const client = (entry.expand?.task?.expand?.project?.expand?.client as ClientRecord | undefined);
                if (!client || !selectedClients.includes(client.id)) return false;
            }

            // Abrechenbarkeit Filter
            if (filterBillable !== 'all') {
                const isEntryBillable = entry.is_billable !== false;
                if (filterBillable === 'billable' && !isEntryBillable) return false;
                if (filterBillable === 'internal' && isEntryBillable) return false;
            }

            // Rechnungsstatus Filter
            if (filterBillingStatus !== 'all') {
                const isEntryBilled = entry.is_billed === true;
                if (filterBillingStatus === 'billed' && !isEntryBilled) return false;
                if (filterBillingStatus === 'open' && isEntryBilled) return false;
            }

            return true;
        });
    }, [entries, filterProject, selectedClients, filterBillable, filterBillingStatus]);

    useEffect(() => {
        fetchEntries();
    }, [fetchEntries, refreshTrigger]);

    const detailDayEntries = useMemo(() => {
        if (!detailDay) return [];
        return filteredEntries.filter((entry) => {
            const entryDate = entry.start_time ? parseISO(entry.start_time) : parseISO(entry.created);
            return isSameDay(entryDate, detailDay);
        });
    }, [filteredEntries, detailDay]);

    const handleEntryCreated = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    const handleDayClick = (day: Date) => {
        const dateStr = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
        setSelectedDate(dateStr);
        setDetailDay(day);
        setIsDayDetailOpen(true);
    };

    const handleEditEntry = (entry: TimeEntryRecord) => {
        setEditingEntry(entry);
        const entryDate = entry.start_time ? parseISO(entry.start_time) : (entry.date ? parseISO(entry.date) : new Date(entry.created));
        const dateStr = entry.date || `${entryDate.getFullYear()}-${String(entryDate.getMonth() + 1).padStart(2, '0')}-${String(entryDate.getDate()).padStart(2, '0')}`;
        setSelectedDate(dateStr);
        setIsDayDetailOpen(false);
        setIsManualEntryOpen(true);
    };

    const handleEntryClick = (entryId: string, taskId: string) => {
        setSelectedTaskId(taskId);
    };

    const totalMinutes = filteredEntries.reduce((sum, entry) => sum + (entry.duration_minutes || 0), 0);
    const totalHours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;

    return (
        <div className="p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
                            <Clock size={32} className="text-teal-500" />
                            Zeiterfassung
                        </h1>
                        <p className="text-muted-foreground mt-1 text-sm">Erfasse und verwalte deine Arbeitszeit.</p>
                    </div>

                    {/* Total hours badge + Filter */}
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
                        {/* Filter row */}
                        <div className="flex flex-wrap items-center gap-2">
                            <Filter size={14} className="text-muted-foreground shrink-0 hidden sm:block" />

                            {/* Client Filter (Multi-select) */}
                            <DropdownMenu>
                                <DropdownMenuTrigger
                                    render={
                                        <button className="flex w-[160px] h-9 items-center justify-between gap-1.5 rounded-lg border border-border bg-background py-2 pr-2 pl-2.5 text-xs whitespace-nowrap transition-colors outline-none select-none hover:bg-accent/50 text-foreground cursor-pointer">
                                            <span className="flex items-center gap-1.5 truncate">
                                                <Building2 className="size-3 text-muted-foreground shrink-0" />
                                                {selectedClients.length === 0 ? (
                                                    <span className="text-muted-foreground truncate">Alle Kunden</span>
                                                ) : selectedClients.length === 1 ? (
                                                    <span className="truncate">{clients.find(c => c.id === selectedClients[0])?.name || '1 Kunde'}</span>
                                                ) : (
                                                    <span>{selectedClients.length} Kunden</span>
                                                )}
                                            </span>
                                            <ChevronDown className="size-3 text-muted-foreground shrink-0" />
                                        </button>
                                    }
                                />
                                <DropdownMenuContent className="bg-background border-border text-foreground min-w-[200px] max-h-[300px] overflow-y-auto">
                                    <DropdownMenuCheckboxItem
                                        checked={selectedClients.length === 0}
                                        onCheckedChange={() => setSelectedClients([])}
                                        onSelect={(e) => e.preventDefault()}
                                        className="text-xs cursor-pointer"
                                    >
                                        Alle Kunden
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuSeparator />
                                    {clients.map((c) => {
                                        const isChecked = selectedClients.includes(c.id);
                                        return (
                                            <DropdownMenuCheckboxItem
                                                key={c.id}
                                                checked={isChecked}
                                                onCheckedChange={() => {
                                                    if (isChecked) {
                                                        setSelectedClients(selectedClients.filter(id => id !== c.id));
                                                    } else {
                                                        setSelectedClients([...selectedClients, c.id]);
                                                    }
                                                }}
                                                onSelect={(e) => e.preventDefault()}
                                                className="text-xs cursor-pointer"
                                            >
                                                {c.name}
                                            </DropdownMenuCheckboxItem>
                                        );
                                    })}
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <Select value={filterProject} onValueChange={(val) => val && setFilterProject(val)}>
                                <SelectTrigger className="bg-background border-border h-9 text-xs w-full xs:w-40">
                                    <SelectValue placeholder="Alle Projekte">
                                        {(value: string) => {
                                            if (value === 'all') return 'Alle Projekte';
                                            const project = projects.find(p => p.id === value);
                                            return project ? `${project.key} ${project.name}` : value;
                                        }}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent className="bg-background border-border text-foreground">
                                    <SelectItem value="all" className="text-xs">
                                        Alle Projekte
                                    </SelectItem>
                                    {filteredProjectOptions.map((project) => (
                                        <SelectItem key={project.id} value={project.id} className="text-xs">
                                            <span className="flex items-center gap-2">
                                                <span className="text-[10px] font-mono text-muted-foreground">{project.key}</span>
                                                {project.name}
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                        {/* Abrechenbarkeit Filter */}
                        <Select value={filterBillable} onValueChange={(val) => val && setFilterBillable(val)}>
                            <SelectTrigger className="bg-background border-border h-9 text-xs w-full xs:w-32">
                                <SelectValue placeholder="Abrechenbarkeit">
                                    {(value: string) => ({
                                        all: 'Alle (Abrechnung)',
                                        billable: 'Abrechenbar',
                                        internal: 'Intern',
                                    } as Record<string, string>)[value] || value}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent className="bg-background border-border text-foreground">
                                <SelectItem value="all" className="text-xs">Alle (Abrechnung)</SelectItem>
                                <SelectItem value="billable" className="text-xs">Abrechenbar</SelectItem>
                                <SelectItem value="internal" className="text-xs">Intern</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Rechnungsstatus Filter */}
                        <Select value={filterBillingStatus} onValueChange={(val) => val && setFilterBillingStatus(val)}>
                            <SelectTrigger className="bg-background border-border h-9 text-xs w-full xs:w-32">
                                <SelectValue placeholder="Rechnungsstatus">
                                    {(value: string) => ({
                                        all: 'Alle Status',
                                        billed: 'Abgerechnet',
                                        open: 'Offen',
                                    } as Record<string, string>)[value] || value}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent className="bg-background border-border text-foreground">
                                <SelectItem value="all" className="text-xs">Alle Status</SelectItem>
                                <SelectItem value="billed" className="text-xs">Abgerechnet</SelectItem>
                                <SelectItem value="open" className="text-xs">Offen</SelectItem>
                            </SelectContent>
                        </Select>

                        <div className="rounded-2xl bg-card border border-border px-6 py-2 shadow-xl shadow-black/20">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">
                                {filterProject === 'all' && filterBillable === 'all' && filterBillingStatus === 'all' ? 'Gesamt erfasst' : 'Gefiltert'}
                            </span>
                            <div className="text-xl font-black text-primary tabular-nums">
                                {totalHours}h {remainingMinutes}m
                            </div>
                        </div>

                        <TimeExportButton entries={filteredEntries} />
                        </div>
                    </div>
                </div>

                {/* View toggle + Week/Month navigation */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-1 rounded-xl bg-card border border-border p-1.5 shadow-inner">
                        <button
                            onClick={() => setViewMode('week')}
                            className={`px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${viewMode === 'week'
                                ? 'bg-primary text-black shadow-lg shadow-teal-500/20'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            Woche
                        </button>
                        <button
                            onClick={() => setViewMode('month')}
                            className={`px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${viewMode === 'month'
                                ? 'bg-primary text-black shadow-lg shadow-teal-500/20'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            Monat
                        </button>
                    </div>

                    <button
                        onClick={() => setIsManualEntryOpen(true)}
                        className="bg-primary hover:bg-teal-400 text-black font-bold h-10 px-5 rounded-xl shadow-lg shadow-teal-500/10 transition-all flex items-center gap-2 text-xs uppercase tracking-wider active:scale-[0.98] w-full sm:w-auto justify-center"
                    >
                        <Plus size={16} />
                        Zeit buchen
                    </button>
                </div>

                {/* Week/Month View */}
                {isLoading ? (
                    <Card className="border-border bg-card/30">
                        <CardContent className="p-6">
                            <div className="grid grid-cols-7 gap-2">
                                {Array.from({ length: 7 }).map((_, i) => (
                                    <Skeleton key={i} className="h-24 bg-muted rounded-xl" />
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ) : viewMode === 'week' ? (
                    <WeekView
                        entries={filteredEntries}
                        currentDate={currentDate}
                        onPrevWeek={() => setCurrentDate(prev => subWeeks(prev, 1))}
                        onNextWeek={() => setCurrentDate(prev => addWeeks(prev, 1))}
                        onDayClick={handleDayClick}
                        onEntryClick={handleEntryClick}
                    />
                ) : (
                    <MonthView
                        entries={filteredEntries}
                        currentDate={currentDate}
                        onPrevMonth={() => setCurrentDate(prev => subMonths(prev, 1))}
                        onNextMonth={() => setCurrentDate(prev => addMonths(prev, 1))}
                        onDayClick={handleDayClick}
                        onEditEntry={handleEditEntry}
                    />
                )}

                {/* Full-width Entry list */}
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                        <Clock size={18} className="text-muted-foreground" />
                        Letzte Einträge
                    </h2>
                    <TimeEntryList
                        entries={filteredEntries}
                        onEntryUpdated={handleEntryCreated}
                        onEditEntry={handleEditEntry}
                        isLoading={isLoading}
                    />
                </div>
            </div>

            {/* Manual Time Entry Dialog */}
            <Dialog open={isManualEntryOpen} onOpenChange={(open) => {
                setIsManualEntryOpen(open);
                if (!open) setEditingEntry(null);
            }}>
                <DialogContent className="sm:max-w-xl bg-background border border-border text-foreground p-6 flex flex-col max-h-[85vh] overflow-hidden">
                    <DialogHeader className="pb-4 border-b border-border">
                        <DialogTitle className="text-lg font-black tracking-tight text-foreground flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                <Clock size={20} className="text-teal-500" />
                                {editingEntry ? 'Eintrag bearbeiten' : 'Zeit buchen'}
                            </span>
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground text-xs">
                            {editingEntry ? 'Bearbeite alle Details deines Zeiteintrags.' : 'Erfasse manuell die gearbeitete Zeit für eine Aufgabe.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto py-4">
                        <ManualTimeEntry
                            onEntryCreated={() => {
                                handleEntryCreated();
                                setIsManualEntryOpen(false);
                                setEditingEntry(null);
                            }}
                            initialDate={selectedDate}
                            isInsideSheet={true}
                            editEntry={editingEntry || undefined}
                        />
                    </div>
                </DialogContent>
            </Dialog>

            {/* Day Entries Dialog */}
            {detailDay && (
                <DayEntriesDialog
                    isOpen={isDayDetailOpen}
                    onOpenChange={setIsDayDetailOpen}
                    day={detailDay}
                    entries={detailDayEntries}
                    onEntryUpdated={handleEntryCreated}
                    onBookTimeClick={() => {
                        setIsDayDetailOpen(false);
                        setEditingEntry(null);
                        setIsManualEntryOpen(true);
                    }}
                    onEditEntry={handleEditEntry}
                />
            )}

            {selectedTaskId && (
                <TaskDetailsDialog
                    taskId={selectedTaskId}
                    projectKey=""
                    onClose={() => setSelectedTaskId(null)}
                    onTaskClick={setSelectedTaskId}
                    onTaskUpdated={() => { fetchEntries(); }}
                />
            )}
        </div>
    );
}
