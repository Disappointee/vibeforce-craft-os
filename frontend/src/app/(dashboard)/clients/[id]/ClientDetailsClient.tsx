'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { pb } from '@/lib/pocketbase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    ArrowLeft,
    Building2,
    Mail,
    Phone,
    MapPin,
    Calendar,
    Euro,
    Clock,
    Users,
    Eye,
    FileText,
    ChevronDown,
    ChevronRight,
    FolderKanban,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Save,
    Upload,
    File,
    ExternalLink,
    Percent,
    Briefcase,
    Pencil,
    Plus,
    Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { EditClientDialog } from '@/components/clients/EditClientDialog';
import { NewTaskDialog } from '@/components/tasks/NewTaskDialog';
import { revalidateClientPath, deleteClientAction } from '@/app/actions/clients';

interface ClientDetailsClientProps {
  id: string;
  initialClient: Record<string, unknown>;
  initialUsers: Record<string, unknown>[];
  initialProjects: Record<string, unknown>[];
  initialTasks: Record<string, unknown>[];
  initialTimeEntries: Record<string, unknown>[];
  initialFiles: Record<string, unknown>[];
}

interface ProjectHours {
    estimated: number;
    booked: number;
}

function formatCurrency(value: number): string {
    return new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
}

function formatDate(dateStr?: string): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
}

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getKundenStatusBadge(status?: string) {
    switch (status) {
        case 'noch_nicht_gestartet':
            return <Badge variant="outline" className="text-warning border-warning/30 bg-warning/10">Noch nicht gestartet</Badge>;
        case 'aktiv':
            return <Badge variant="outline" className="text-success border-success/30 bg-success/10">Aktiv</Badge>;
        case 'beendet':
            return <Badge variant="outline" className="text-muted-foreground border-border bg-card">Beendet</Badge>;
        default:
            return null;
    }
}

function FileRow({ file }: { file: any }) {
    return (
        <a
            href={file.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-6 py-3 hover:bg-accent/5 transition-colors group"
        >
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary shrink-0">
                <File size={14} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate group-hover:text-foreground transition-colors">
                    {file.name}
                </p>
                <p className="text-xs text-muted-foreground">
                    {file.sourceName} · {formatFileSize(file.size)} · {formatDate(file.created)}
                </p>
            </div>
            <ExternalLink size={14} className="text-muted-foreground group-hover:text-muted-foreground transition-colors shrink-0" />
        </a>
    );
}

export function ClientDetailsClient({
  id,
  initialClient,
  initialUsers,
  initialProjects,
  initialTasks,
  initialTimeEntries,
  initialFiles,
}: ClientDetailsClientProps) {
    const router = useRouter();

    const [client, setClient] = useState<Record<string, unknown>>(initialClient);
    const [users] = useState<Record<string, unknown>[]>(initialUsers);
    const [projects, setProjects] = useState<Record<string, unknown>[]>(initialProjects);
    const [allTasks] = useState<Record<string, unknown>[]>(initialTasks);
    const [allTimeEntries] = useState<Record<string, unknown>[]>(initialTimeEntries);
    const [files, setFiles] = useState<Record<string, unknown>[]>(initialFiles);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
    const [isSaving, setIsSaving] = useState(false);

    const [selectedBetreuer, setSelectedBetreuer] = useState<string[]>(
      (initialClient.betreuer as string[]) || []
    );
    const [selectedBeobachter, setSelectedBeobachter] = useState<string[]>(
      (initialClient.beobachter as string[]) || []
    );

    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [newTaskProjectId, setNewTaskProjectId] = useState<string | null>(null);
    const [uploadingFile, setUploadingFile] = useState(false);

    const projectHours = useMemo(() => {
        const hoursMap: Record<string, ProjectHours> = {};

        for (const project of projects) {
            const projectTasks = allTasks.filter(t => (t as any).project === project.id);
            const estimated = projectTasks.reduce((sum, t) => sum + ((t as any).estimated_hours || 0), 0);

            const projectTaskIds = new Set(projectTasks.map(t => t.id));
            const projectTimeEntries = allTimeEntries.filter(te => projectTaskIds.has((te as any).task));
            const booked = projectTimeEntries.reduce(
                (sum, te) => sum + (((te as any).duration_minutes || (te as any).duration || 0) / 60),
                0
            );
            hoursMap[project.id as string] = { estimated, booked };
        }

        return hoursMap;
    }, [projects, allTasks, allTimeEntries]);

    // Refresh data when trigger changes
    useEffect(() => {
        if (refreshTrigger === 0) return;

        const fetchData = async () => {
            try {
                const [clientData, usersResult, projectsResult] = await Promise.all([
                    pb.collection('clients').getOne(id, {
                        expand: 'betreuer,beobachter',
                    }),
                    pb.collection('users').getList(1, 200, { sort: 'name' }),
                    pb.collection('projects').getList(1, 50, {
                        filter: pb.filter('client = {:id}', { id }),
                        sort: 'name',
                    }),
                ]);

                setClient(clientData as unknown as Record<string, unknown>);
                setSelectedBetreuer((clientData as any).betreuer || []);
                setSelectedBeobachter((clientData as any).beobachter || []);
                setProjects(projectsResult.items);

                // Fetch tasks and time entries
                const pData = projectsResult.items;
                const pIds = pData.map((p: any) => p.id);
                let tasks: any[] = [];
                let timeEntries: any[] = [];

                if (pIds.length > 0) {
                    const tasksFilter = pIds.map((pid: string) => pb.filter('project = {:pid}', { pid })).join(' || ');
                    const tasksResult = await pb.collection('tasks').getList(1, 500, {
                        filter: tasksFilter,
                        sort: 'title',
                    });
                    tasks = tasksResult.items;

                    const taskIds = tasks.map((t: any) => t.id);
                    if (taskIds.length > 0) {
                        const timeFilter = taskIds.map((tid: string) => pb.filter('task = {:tid}', { tid })).join(' || ');
                        const timeResult = await pb.collection('time_entries').getList(1, 500, {
                            filter: timeFilter,
                        });
                        timeEntries = timeResult.items;
                    }
                }
            } catch (error) {
                console.error('Error refreshing client data:', error);
                toast.error('Fehler beim Aktualisieren der Daten.');
            }
        };

        fetchData();
    }, [id, refreshTrigger]);

    const handleClientUpdated = async () => {
        await revalidateClientPath(id);
        setEditDialogOpen(false);
        try {
            const clientData = await pb.collection('clients').getOne(id, {
                expand: 'betreuer,beobachter',
            });
            setClient(clientData as unknown as Record<string, unknown>);
            setSelectedBetreuer((clientData as any).betreuer || []);
            setSelectedBeobachter((clientData as any).beobachter || []);
        } catch (error) {
            console.error('Error re-fetching client:', error);
        }
    };

    const handleSaveSettings = async () => {
        if (!client) return;
        setIsSaving(true);
        try {
            await pb.collection('clients').update(client.id as string, {
                betreuer: selectedBetreuer,
                beobachter: selectedBeobachter,
            });
            toast.success('Einstellungen gespeichert!');
            setClient(prev => ({
                ...prev,
                betreuer: selectedBetreuer,
                beobachter: selectedBeobachter,
            }));
        } catch (error) {
            console.error(error);
            toast.error('Fehler beim Speichern der Einstellungen.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !client) return;

        setUploadingFile(true);
        try {
            const formData = new FormData();
            formData.append('client', client.id as string);
            formData.append('file', file);
            formData.append('name', file.name);
            formData.append('size', String(file.size));

            await pb.collection('client_files').create(formData);
            toast.success('Datei hochgeladen!');
            setRefreshTrigger(prev => prev + 1);
        } catch (error: any) {
            console.error(error);
            if (error?.status === 404) {
                toast.error('Datei-Upload ist noch nicht verfügbar. Bitte zuerst die client_files Collection anlegen.');
            } else {
                toast.error('Fehler beim Hochladen der Datei.');
            }
        } finally {
            setUploadingFile(false);
            e.target.value = '';
        }
    };

    const toggleProjectExpand = (projectId: string) => {
        setExpandedProjects(prev => {
            const next = new Set(prev);
            if (next.has(projectId)) {
                next.delete(projectId);
            } else {
                next.add(projectId);
            }
            return next;
        });
    };

    const totalEstimated = Object.values(projectHours).reduce((sum, ph) => sum + ph.estimated, 0);
    const totalBooked = Object.values(projectHours).reduce((sum, ph) => sum + ph.booked, 0);
    const totalPercent = totalEstimated > 0 ? Math.round((totalBooked / totalEstimated) * 100) : 0;

    const handleDeleteClient = async () => {
        if (!confirm(`Möchtest du den Kunden "${(client as any)?.name}" wirklich löschen?`)) return;
        try {
            await deleteClientAction(id);
            toast.success('Kunde gelöscht!');
            router.push('/clients');
        } catch {
            toast.error('Fehler beim Löschen des Kunden.');
        }
    };

    const clientFiles = files.filter(f => (f as any)._source === 'client');
    const projectFiles = files.filter(f => (f as any)._source === 'project');
    const taskFiles = files.filter(f => (f as any)._source === 'task');

    return (
        <div className="h-full text-foreground flex flex-col">
            {/* Header */}
            <header className="border-b border-border bg-background/50 px-8 py-4 shrink-0">
                <div className="max-w-6xl mx-auto flex items-center gap-4">
                    <button
                        onClick={() => router.push('/clients')}
                        className="p-2 rounded-full hover:bg-accent/50 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="flex items-center gap-3 flex-1">
                        <div className="p-2 rounded-xl bg-primary/10 text-primary">
                            <Building2 size={20} />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                                    {(client as any)?.name}
                                </h1>
                                {getKundenStatusBadge((client as any)?.kundenstatus)}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setEditDialogOpen(true)}
                                    className="border-border text-foreground hover:bg-muted ml-2"
                                >
                                    <Pencil size={14} className="mr-1" />
                                    Bearbeiten
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleDeleteClient}
                                    className="border-red-500/30 text-red-400 hover:bg-red-500/10 ml-2"
                                >
                                    <Trash2 size={14} className="mr-1 text-red-400" />
                                    Löschen
                                </Button>
                            </div>
                            {(client as any)?.company && (
                                <p className="text-sm text-muted-foreground">{(client as any).company}</p>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-auto p-8">
                <div className="max-w-6xl mx-auto space-y-8">

                    {/* Contact Info + Financial Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Contact Info Card */}
                        <div className="lg:col-span-2 rounded-2xl border border-border bg-card/40 p-6">
                            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                                <Users size={18} className="text-primary" />
                                Kontaktdaten
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {(client as any)?.email && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <Mail size={16} className="text-muted-foreground shrink-0" />
                                        <a href={`mailto:${(client as any).email}`} className="text-primary hover:text-primary/80 transition-colors">
                                            {(client as any).email}
                                        </a>
                                    </div>
                                )}
                                {(client as any)?.phone && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <Phone size={16} className="text-muted-foreground shrink-0" />
                                        <a href={`tel:${(client as any).phone}`} className="text-foreground hover:text-foreground transition-colors">
                                            {(client as any).phone}
                                        </a>
                                    </div>
                                )}
                                {(client as any)?.address && (
                                    <div className="flex items-center gap-3 text-sm md:col-span-2">
                                        <MapPin size={16} className="text-muted-foreground shrink-0" />
                                        <span className="text-foreground">{(client as any).address}</span>
                                    </div>
                                )}
                                {!(client as any)?.email && !(client as any)?.phone && !(client as any)?.address && (
                                    <p className="text-muted-foreground text-sm col-span-2">Keine Kontaktdaten hinterlegt.</p>
                                )}
                            </div>
                        </div>

                        {/* Financial Card */}
                        <div className="rounded-2xl border border-border bg-card/40 p-6">
                            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                                <Euro size={18} className="text-success" />
                                Finanzen
                            </h2>
                            <div className="space-y-4">
                                {(client as any)?.auftragsvolumen != null && (
                                    <div>
                                        <p className="text-xs text-muted-foreground text-caps mb-1">Auftragsvolumen</p>
                                        <p className="text-2xl font-bold text-emerald-400">
                                            {formatCurrency((client as any).auftragsvolumen)}
                                        </p>
                                    </div>
                                )}
                                {(client as any)?.stundenhonorar != null && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Stundensatz</span>
                                        <span className="text-sm font-medium text-foreground">
                                            {formatCurrency((client as any).stundenhonorar)}/h
                                        </span>
                                    </div>
                                )}
                                {(client as any)?.stundenzahl_monatlich != null && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Std./Monat</span>
                                        <span className="text-sm font-medium text-foreground">
                                            {(client as any).stundenzahl_monatlich}h
                                        </span>
                                    </div>
                                )}
                                {(client as any)?.stundenzahl_gesamt != null && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Std. gesamt</span>
                                        <span className="text-sm font-medium text-foreground">
                                            {(client as any).stundenzahl_gesamt}h
                                        </span>
                                    </div>
                                )}
                                {!(client as any)?.auftragsvolumen && !(client as any)?.stundenhonorar && (
                                    <p className="text-muted-foreground text-sm">Keine Finanzdaten hinterlegt.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Laufzeit + Abrechenbar Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 rounded-2xl border border-border bg-card/40 p-6">
                            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                                <Calendar size={18} className="text-primary" />
                                Laufzeit
                            </h2>
                            <div className="flex items-center gap-6">
                                <div>
                                    <p className="text-xs text-muted-foreground text-caps mb-1">Start</p>
                                    <p className="text-sm font-medium text-foreground">{formatDate((client as any).laufzeit_start)}</p>
                                </div>
                                <span className="text-muted-foreground">→</span>
                                <div>
                                    <p className="text-xs text-muted-foreground text-caps mb-1">Ende</p>
                                    <p className="text-sm font-medium text-foreground">{formatDate((client as any).laufzeit_ende)}</p>
                                </div>
                                {(client as any)?.laufzeit_start && (client as any)?.laufzeit_ende && (
                                    <div className="ml-auto">
                                        <Badge variant="outline" className="text-primary border-primary/30 bg-primary/10 shadow-none">
                                            {Math.ceil((new Date((client as any).laufzeit_ende).getTime() - new Date((client as any).laufzeit_start).getTime()) / (1000 * 60 * 60 * 24))} Tage
                                        </Badge>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="rounded-2xl border border-border bg-card/40 p-6">
                            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                                <Percent size={18} className="text-primary" />
                                Einstellungen
                            </h2>
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${(client as any)?.abrechenbar !== false ? 'bg-emerald-500/10 text-emerald-400' : 'bg-muted text-muted-foreground'}`}>
                                    <CheckCircle2 size={20} />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-foreground">Abrechenbar</p>
                                    <p className="text-xs text-muted-foreground">
                                        {(client as any)?.abrechenbar !== false ? 'Standardmäßig abrechenbar' : 'Nicht abrechenbar'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Projects & Tasks */}
                    <div className="rounded-2xl border border-border bg-card/40 overflow-hidden">
                        <div className="p-6 border-b border-border">
                            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                                <FolderKanban size={18} className="text-primary" />
                                Projekte & Aufgaben
                                {projects.length > 0 && (
                                    <Badge variant="outline" className="ml-2 text-muted-foreground border-border bg-card">
                                        {projects.length}
                                    </Badge>
                                )}
                            </h2>
                        </div>

                        {projects.length === 0 ? (
                            <div className="p-12 flex flex-col items-center justify-center text-center">
                                <FolderKanban size={40} className="text-muted-foreground/30 mb-3" />
                                <h3 className="text-base font-semibold text-muted-foreground">Keine Projekte zugeordnet</h3>
                                <p className="text-muted-foreground text-sm mt-1">
                                    Diesem Kunden sind noch keine Projekte zugeordnet.
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-border/50">
                                {projects.map((project: any) => {
                                    const hours = projectHours[project.id] || { estimated: 0, booked: 0 };
                                    const percent = hours.estimated > 0 ? Math.round((hours.booked / hours.estimated) * 100) : 0;
                                    const isExpanded = expandedProjects.has(project.id);
                                    const projectTasks = allTasks.filter((t: any) => t.project === project.id);

                                    return (
                                        <div key={project.id}>
                                            <button
                                                onClick={() => toggleProjectExpand(project.id)}
                                                className="w-full flex items-center gap-4 p-4 hover:bg-accent/5 transition-colors text-left group"
                                            >
                                                <div className="text-muted-foreground group-hover:text-muted-foreground transition-colors">
                                                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium text-foreground text-sm">{project.name}</span>
                                                        <Badge variant="outline" className="text-[10px] text-muted-foreground border-border bg-card/50 font-mono shadow-none">
                                                            {project.key}
                                                        </Badge>
                                                        <span className="text-xs text-muted-foreground">
                                                            ({projectTasks.length} Aufgaben)
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4 shrink-0">
                                                    <div className="text-right">
                                                        <p className="text-xs text-muted-foreground">
                                                            {Math.round(hours.booked)}h / {hours.estimated}h
                                                        </p>
                                                    </div>
                                                    <div className="w-24">
                                                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full transition-all duration-500 ${percent >= 100
                                                                    ? 'bg-success'
                                                                    : percent >= 75
                                                                        ? 'bg-warning'
                                                                        : 'bg-primary'
                                                                    }`}
                                                                style={{ width: `${Math.min(percent, 100)}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                    <span className={`text-xs font-medium w-10 text-right ${percent >= 100 ? 'text-emerald-400' : 'text-muted-foreground'}`}>
                                                        {percent}%
                                                    </span>
                                                </div>
                                            </button>

                                            {isExpanded && (
                                                <div className="border-t border-border/30 bg-black/20">
                                                    <div className="px-4 py-2 flex justify-end">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={(e) => { e.stopPropagation(); setNewTaskProjectId(project.id); }}
                                                            className="border-border text-foreground hover:bg-muted text-xs h-8"
                                                        >
                                                            <Plus size={14} className="mr-1" />
                                                            Neue Aufgabe
                                                        </Button>
                                                    </div>
                                                    {projectTasks.length === 0 ? (
                                                        <div className="p-4 text-center text-sm text-muted-foreground">
                                                            Keine Aufgaben in diesem Projekt.
                                                        </div>
                                                    ) : (
                                                        <div className="divide-y divide-border">
                                                            {projectTasks.map((task: any) => (
                                                                <div
                                                                    key={task.id}
                                                                    className="flex items-center gap-3 px-4 py-2.5 pl-12 hover:bg-white/[0.02] transition-colors cursor-pointer"
                                                                    onClick={() => router.push(`/projects/${project.id}`)}
                                                                >
                                                                    <div className={`p-1 rounded ${task.status === 'done'
                                                                        ? 'text-emerald-400 bg-emerald-500/10'
                                                                        : task.status === 'in_progress'
                                                                            ? 'text-indigo-400 bg-indigo-500/10'
                                                                            : 'text-muted-foreground bg-muted/50'
                                                                        }`}>
                                                                        {task.status === 'done'
                                                                            ? <CheckCircle2 size={12} />
                                                                            : <Clock size={12} />
                                                                        }
                                                                    </div>
                                                                    <span className="text-sm text-foreground flex-1 truncate">
                                                                        {task.title}
                                                                    </span>
                                                                    {task.estimated_hours && (
                                                                        <span className="text-xs text-muted-foreground shrink-0">
                                                                            {task.estimated_hours}h
                                                                        </span>
                                                                    )}
                                                                    <Badge variant="outline" className={`text-[10px] ${task.priority === 'acute' ? 'text-red-400 border-red-500/20 bg-red-500/10' :
                                                                        task.priority === 'high' ? 'text-orange-400 border-orange-500/20 bg-orange-500/10' :
                                                                            task.priority === 'medium' ? 'text-blue-400 border-blue-500/20 bg-blue-500/10' :
                                                                                'text-muted-foreground border-border bg-card'
                                                                        }`}>
                                                                        {task.priority === 'acute' ? 'Akut' :
                                                                            task.priority === 'high' ? 'Hoch' :
                                                                                task.priority === 'medium' ? 'Mittel' : 'Niedrig'}
                                                                    </Badge>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}

                                <div className="p-4 bg-card/50">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-foreground">Gesamt</span>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className="text-sm text-foreground font-medium">
                                                    {Math.round(totalBooked)}h / {totalEstimated}h
                                                </p>
                                            </div>
                                            <div className="w-24">
                                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-500 ${totalPercent >= 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                                                        style={{ width: `${Math.min(totalPercent, 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                            <span className="text-sm font-semibold w-10 text-right text-foreground">
                                                {totalPercent}%
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Files Section */}
                    <div className="rounded-2xl border border-border bg-card/30 overflow-hidden">
                        <div className="p-6 border-b border-border">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                                    <Upload size={18} className="text-indigo-400" />
                                    Dateien
                                    {files.length > 0 && (
                                        <Badge variant="outline" className="ml-2 text-muted-foreground border-border bg-card">
                                            {files.length}
                                        </Badge>
                                    )}
                                </h2>
                                <label className="cursor-pointer">
                                    <input
                                        type="file"
                                        className="hidden"
                                        onChange={handleFileUpload}
                                        disabled={uploadingFile}
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={uploadingFile}
                                        className="border-border text-foreground hover:bg-muted"
                                    >
                                        {uploadingFile ? (
                                            <Loader2 size={14} className="animate-spin mr-1" />
                                        ) : (
                                            <Upload size={14} className="mr-1" />
                                        )}
                                        Datei hochladen
                                    </Button>
                                </label>
                            </div>
                        </div>

                        {files.length === 0 ? (
                            <div className="p-12 flex flex-col items-center justify-center text-center">
                                <FileText size={40} className="text-muted-foreground/30 mb-3" />
                                <h3 className="text-base font-semibold text-muted-foreground">Keine Dateien</h3>
                                <p className="text-muted-foreground text-sm mt-1">
                                    Noch keine Dateien hochgeladen.
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-border">
                                {clientFiles.length > 0 && (
                                    <div>
                                        <div className="px-6 py-2 bg-card/50">
                                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                Kundendateien
                                            </span>
                                        </div>
                                        {clientFiles.map((file: any) => (
                                            <FileRow key={file.id} file={file} />
                                        ))}
                                    </div>
                                )}
                                {projectFiles.length > 0 && (
                                    <div>
                                        <div className="px-6 py-2 bg-card/50">
                                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                Projektdaten
                                            </span>
                                        </div>
                                        {projectFiles.map((file: any) => (
                                            <FileRow key={file.id} file={file} />
                                        ))}
                                    </div>
                                )}
                                {taskFiles.length > 0 && (
                                    <div>
                                        <div className="px-6 py-2 bg-card/50">
                                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                Aufgabendateien
                                            </span>
                                        </div>
                                        {taskFiles.map((file: any) => (
                                            <FileRow key={file.id} file={file} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Settings (Betreuer/Beobachter) */}
                    <div className="rounded-2xl border border-border bg-card/30 p-6">
                        <h2 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
                            <Briefcase size={18} className="text-indigo-400" />
                            Einstellungen
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Betreuer */}
                            <div className="space-y-3">
                                <Label className="text-foreground text-xs uppercase tracking-wider flex items-center gap-2">
                                    <Users size={14} className="text-indigo-400" />
                                    Betreuer (Bearbeiter)
                                </Label>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {selectedBetreuer.map((uid) => {
                                        const user = users.find((u: any) => u.id === uid);
                                        return user ? (
                                            <Badge
                                                key={uid}
                                                variant="outline"
                                                className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 flex items-center gap-1"
                                            >
                                                {(user as any).name || (user as any).email}
                                                <button
                                                    onClick={() => setSelectedBetreuer(prev => prev.filter(id => id !== uid))}
                                                    className="ml-1 hover:text-red-400 transition-colors"
                                                >
                                                    ×
                                                </button>
                                            </Badge>
                                        ) : null;
                                    })}
                                </div>
                                <Select
                                    value=""
                                    onValueChange={(val) => {
                                        if (val && !selectedBetreuer.includes(val)) {
                                            setSelectedBetreuer(prev => [...prev, val]);
                                        }
                                    }}
                                >
                                    <SelectTrigger className="bg-card border-border w-full">
                                        <SelectValue placeholder="Betreuer hinzufügen..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-background border-border text-foreground">
                                        {users
                                            .filter((u: any) => !selectedBetreuer.includes(u.id))
                                            .map((user: any) => (
                                                <SelectItem key={user.id} value={user.id}>
                                                    {user.name || user.email}
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Beobachter */}
                            <div className="space-y-3">
                                <Label className="text-foreground text-xs uppercase tracking-wider flex items-center gap-2">
                                    <Eye size={14} className="text-indigo-400" />
                                    Beobachter
                                </Label>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {selectedBeobachter.map((uid) => {
                                        const user = users.find((u: any) => u.id === uid);
                                        return user ? (
                                            <Badge
                                                key={uid}
                                                variant="outline"
                                                className="bg-purple-500/10 text-purple-400 border-purple-500/20 flex items-center gap-1"
                                            >
                                                {(user as any).name || (user as any).email}
                                                <button
                                                    onClick={() => setSelectedBeobachter(prev => prev.filter(id => id !== uid))}
                                                    className="ml-1 hover:text-red-400 transition-colors"
                                                >
                                                    ×
                                                </button>
                                            </Badge>
                                        ) : null;
                                    })}
                                </div>
                                <Select
                                    value=""
                                    onValueChange={(val) => {
                                        if (val && !selectedBeobachter.includes(val)) {
                                            setSelectedBeobachter(prev => [...prev, val]);
                                        }
                                    }}
                                >
                                    <SelectTrigger className="bg-card border-border w-full">
                                        <SelectValue placeholder="Beobachter hinzufügen..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-background border-border text-foreground">
                                        {users
                                            .filter((u: any) => !selectedBeobachter.includes(u.id))
                                            .map((user: any) => (
                                                <SelectItem key={user.id} value={user.id}>
                                                    {user.name || user.email}
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <Button
                                onClick={handleSaveSettings}
                                disabled={isSaving}
                                className="bg-white text-zinc-950 hover:bg-zinc-200 disabled:opacity-50"
                            >
                                {isSaving ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                    <Save size={16} className="mr-2" />
                                )}
                                Einstellungen speichern
                            </Button>
                        </div>
                    </div>

                    {/* Notes Section */}
                    {(client as any)?.notes && (
                        <div className="rounded-2xl border border-border bg-card/30 p-6">
                            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                                <FileText size={18} className="text-indigo-400" />
                                Notizen
                            </h2>
                            <div className="prose prose-invert prose-sm max-w-none text-foreground whitespace-pre-wrap">
                                {(client as any).notes}
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <EditClientDialog
                client={client as any}
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
                onClientUpdated={handleClientUpdated}
            />

            {newTaskProjectId && (
                <NewTaskDialog
                    projectId={newTaskProjectId}
                    onTaskCreated={() => {
                        setNewTaskProjectId(null);
                        setRefreshTrigger(prev => prev + 1);
                    }}
                />
            )}
        </div>
    );
}
