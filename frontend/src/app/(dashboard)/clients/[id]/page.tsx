'use client';

import { useEffect, useState, use } from 'react';
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
} from 'lucide-react';
import { useUiStore } from '@/lib/store';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { EditClientDialog } from '@/components/clients/EditClientDialog';
import { NewTaskDialog } from '@/components/tasks/NewTaskDialog';
import type { ClientRecord, ProjectRecord, TaskRecord, TimeEntryRecord, UserRecord } from '@/lib/pocketbase-types';
import { getUserDisplayName } from '@/lib/user-utils';

// ============================================
// Types
// ============================================

interface ProjectWithTasks extends ProjectRecord {
    tasks: TaskRecord[];
    expand?: ProjectRecord['expand'] & {
        client?: ClientRecord;
    };
}

interface ProjectHours {
    estimated: number;
    booked: number;
}

interface ClientFile {
    id: string;
    name: string;
    size: number;
    url: string;
    source: 'client' | 'project' | 'task';
    sourceName: string;
    created: string;
}

// ============================================
// Helpers
// ============================================

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

// ============================================
// FileRow Component
// ============================================

function FileRow({ file }: { file: ClientFile }) {
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

// ============================================
// Main Page Component
// ============================================

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();

    const [client, setClient] = useState<ClientRecord | null>(null);
    const [projects, setProjects] = useState<ProjectWithTasks[]>([]);
    const [users, setUsers] = useState<UserRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [projectHours, setProjectHours] = useState<Record<string, ProjectHours>>({});
    const [files, setFiles] = useState<ClientFile[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    // Edit state for betreuer/beobachter
    const [selectedBetreuer, setSelectedBetreuer] = useState<string[]>([]);
    const [selectedBeobachter, setSelectedBeobachter] = useState<string[]>([]);

    // Edit dialog state
    const [editDialogOpen, setEditDialogOpen] = useState(false);

    // New task dialog state
    const [newTaskProjectId, setNewTaskProjectId] = useState<string | null>(null);

    // File upload state
    const [uploadingFile, setUploadingFile] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (!id || typeof id !== 'string') {
                console.warn('[ClientDetailPage] Invalid client ID:', id);
                setIsLoading(false);
                toast.error('Ungültige Kunden-ID.');
                router.push('/clients');
                return;
            }

            if (id.startsWith('[')) {
                console.warn('[ClientDetailPage] ID looks like an unresolved value:', id);
                setIsLoading(false);
                toast.error('Ungültige Kunden-ID.');
                router.push('/clients');
                return;
            }

            console.debug('[ClientDetailPage] Loading client:', id);
            if (!pb.authStore.isValid) {
                router.push('/login');
                return;
            }

            try {
                // Fetch client with expanded relations
                const clientData = await pb.collection('clients').getOne(id, {
                    expand: 'betreuer,beobachter',
                });

                const clientRecord = clientData as unknown as ClientRecord;
                setClient(clientRecord);
                setSelectedBetreuer(clientData.betreuer || []);
                setSelectedBeobachter(clientData.beobachter || []);

                // Fetch all users and projects in parallel
                const [usersResult, projectsResult] = await Promise.all([
                    pb.collection('users').getList(1, 200, { sort: 'name' }),
                    pb.collection('projects').getList(1, 50, {
                        filter: pb.filter('client = {:id}', { id }),
                        sort: 'name',
                    }),
                ]);
                setUsers(usersResult.items as unknown as UserRecord[]);
                const projectsData = projectsResult.items as unknown as ProjectRecord[];

                // Batch fetch all tasks for all projects
                const projectsWithTasks: ProjectWithTasks[] = [];
                const hoursMap: Record<string, ProjectHours> = {};

                const projectIds = projectsData.map(p => p.id);
                let allTasks: TaskRecord[] = [];
                let allTimeEntries: TimeEntryRecord[] = [];

                if (projectIds.length > 0) {
                    const allTasksFilter = projectIds.map((pid: string) => pb.filter('project = {:pid}', { pid })).join(' || ');
                    const allTasksResult = await pb.collection('tasks').getList(1, 500, {
                        filter: allTasksFilter,
                        sort: 'title',
                    });
                    allTasks = allTasksResult.items as unknown as TaskRecord[];

                    // Batch fetch all time entries for all tasks
                    const allTaskIds = allTasks.map(t => t.id);
                    if (allTaskIds.length > 0) {
                        const timeFilter = allTaskIds.map((tid: string) => pb.filter('task = {:tid}', { tid })).join(' || ');
                        const timeResult = await pb.collection('time_entries').getList(1, 500, {
                            filter: timeFilter,
                        });
                        allTimeEntries = timeResult.items as unknown as TimeEntryRecord[];
                    }
                }

                // Group by project client-side
                for (const project of projectsData) {
                    const projectTasks = allTasks.filter(t => t.project === project.id);
                    projectsWithTasks.push({ ...project, tasks: projectTasks });

                    const estimated = projectTasks.reduce((sum, t) => sum + (t.estimated_hours || 0), 0);

                    const projectTaskIds = new Set(projectTasks.map(t => t.id));
                    const projectTimeEntries = allTimeEntries.filter(te => projectTaskIds.has(te.task));
                    const booked = projectTimeEntries.reduce(
                        (sum, te) => sum + ((te.duration_minutes || te.duration || 0) / 60),
                        0
                    );
                    hoursMap[project.id] = { estimated, booked };
                }

                setProjects(projectsWithTasks);
                setProjectHours(hoursMap);

                // Fetch files
                await fetchFiles(clientRecord, projectsWithTasks);

            } catch (error) {
                console.error('Error fetching client data:', error);
                toast.error('Fehler beim Laden der Kundendaten.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [id, router, refreshTrigger]);

    const fetchFiles = async (clientData: ClientRecord | null, projectsData: ProjectWithTasks[]) => {
        if (!clientData) return;
        const allFiles: ClientFile[] = [];

        // Client-level files
        try {
            const clientFilesResult = await pb.collection('client_files').getList(1, 50, {
                filter: pb.filter('client = {:id}', { id: clientData.id }),
                sort: '-created',
            });
            for (const f of clientFilesResult.items as unknown as any[]) {
                allFiles.push({
                    id: f.id,
                    name: f.name || f.file || 'Unbenannt',
                    size: f.size || 0,
                    url: pb.files.getUrl(f, f.file),
                    source: 'client',
                    sourceName: 'Kundendateien',
                    created: f.created,
                });
            }
        } catch {
            // client_files collection might not exist yet
        }

        // Collect all project IDs and task IDs
        const projectIdsForFiles = projectsData.map(p => p.id);
        const allTasksFlat = projectsData.flatMap(p => p.tasks);
        const taskIdsForFiles = allTasksFlat.map(t => t.id);

        // Batch queries in parallel
        const fileQueries: Promise<any>[] = [];

        if (projectIdsForFiles.length > 0) {
            const projFilter = projectIdsForFiles.map((pid: string) => pb.filter('project = {:pid}', { pid })).join(' || ');
            fileQueries.push(
                pb.collection('project_files').getList(1, 50, { filter: projFilter, sort: '-created' })
                    .catch(() => ({ items: [] }))
            );
        }

        if (taskIdsForFiles.length > 0) {
            const taskFilter = taskIdsForFiles.map((tid: string) => pb.filter('task = {:tid}', { tid })).join(' || ');
            fileQueries.push(
                pb.collection('task_files').getList(1, 50, { filter: taskFilter, sort: '-created' })
                    .catch(() => ({ items: [] }))
            );
        }

        if (fileQueries.length > 0) {
            const results = await Promise.all(fileQueries);
            const projFileIdx = projectIdsForFiles.length > 0 ? 0 : -1;
            const taskFileIdx = projectIdsForFiles.length > 0 ? 1 : 0;

            // Process project files
            if (projFileIdx >= 0 && results[projFileIdx]?.items) {
                for (const f of results[projFileIdx].items as any[]) {
                    allFiles.push({
                        id: f.id,
                        name: f.name || f.file || 'Unbenannt',
                        size: f.size || 0,
                        url: pb.files.getUrl(f, f.file),
                        source: 'project',
                        sourceName: projectsData.find(p => p.id === f.project)?.name || 'Projekt',
                        created: f.created,
                    });
                }
            }

            // Process task files
            if (results[taskFileIdx]?.items) {
                for (const f of results[taskFileIdx].items as any[]) {
                    const parentTask = allTasksFlat.find(t => t.id === f.task);
                    const parentProject = parentTask ? projectsData.find(p => p.tasks.some(t => t.id === f.task)) : undefined;
                    allFiles.push({
                        id: f.id,
                        name: f.name || f.file || 'Unbenannt',
                        size: f.size || 0,
                        url: pb.files.getUrl(f, f.file),
                        source: 'task',
                        sourceName: parentProject && parentTask
                            ? `${parentProject.name} / ${parentTask.title}`
                            : 'Task-Datei',
                        created: f.created,
                    });
                }
            }
        }

        // Sort by date descending
        allFiles.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
        setFiles(allFiles);
    };

    const handleClientUpdated = async () => {
        window.dispatchEvent(new CustomEvent('client-updated'));
        setEditDialogOpen(false);
        try {
            const clientData = await pb.collection('clients').getOne(id, {
                expand: 'betreuer,beobachter',
            });
            setClient(clientData as unknown as ClientRecord);
            setSelectedBetreuer(clientData.betreuer || []);
            setSelectedBeobachter(clientData.beobachter || []);
        } catch (error) {
            console.error('Error re-fetching client:', error);
        }
    };

    const handleSaveSettings = async () => {
        if (!client) return;
        setIsSaving(true);
        try {
            await pb.collection('clients').update(client.id, {
                betreuer: selectedBetreuer,
                beobachter: selectedBeobachter,
            });
            toast.success('Einstellungen gespeichert!');
            setClient(prev => prev ? {
                ...prev,
                betreuer: selectedBetreuer,
                beobachter: selectedBeobachter,
            } : null);
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
            formData.append('client', client.id);
            formData.append('file', file);
            formData.append('name', file.name);
            formData.append('size', String(file.size));

            await pb.collection('client_files').create(formData);
            toast.success('Datei hochgeladen!');

            // Refresh files
            await fetchFiles(client, projects);
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

    // ============================================
    // Loading State
    // ============================================

    if (isLoading) {
        return (
            <div className="h-full p-8">
                <div className="max-w-6xl mx-auto space-y-8">
                    <Skeleton className="h-12 w-64 bg-card" />
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <Skeleton className="h-48 bg-card rounded-2xl lg:col-span-2" />
                        <Skeleton className="h-48 bg-card rounded-2xl" />
                    </div>
                </div>
            </div>
        );
    }

    if (!client) {
        return (
            <div className="h-full p-8 flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle size={48} className="text-muted-foreground/30 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-foreground">Kunde nicht gefunden</h2>
                    <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => router.push('/clients')}
                    >
                        Zurück zur Kundenübersicht
                    </Button>
                </div>
            </div>
        );
    }

    // ============================================
    // Calculations
    // ============================================

    const totalEstimated = Object.values(projectHours).reduce((sum, ph) => sum + ph.estimated, 0);
    const totalBooked = Object.values(projectHours).reduce((sum, ph) => sum + ph.booked, 0);
    const totalPercent = totalEstimated > 0 ? Math.round((totalBooked / totalEstimated) * 100) : 0;

    // ============================================
    // Render
    // ============================================

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
                                    {client.name}
                                </h1>
                                {getKundenStatusBadge(client.kundenstatus)}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setEditDialogOpen(true)}
                                    className="border-border text-foreground hover:bg-muted ml-2"
                                >
                                    <Pencil size={14} className="mr-1" />
                                    Bearbeiten
                                </Button>
                            </div>
                            {client.company && (
                                <p className="text-sm text-muted-foreground">{client.company}</p>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-auto p-8">
                <div className="max-w-6xl mx-auto space-y-8">

                    {/* ============================================ */}
                    {/* B2: Contact Info + Financial Section */}
                    {/* ============================================ */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* Contact Info Card */}
                        <div className="lg:col-span-2 rounded-2xl border border-border bg-card/40 p-6">
                            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                                <Users size={18} className="text-primary" />
                                Kontaktdaten
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {client.email && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <Mail size={16} className="text-muted-foreground shrink-0" />
                                        <a href={`mailto:${client.email}`} className="text-primary hover:text-primary/80 transition-colors">
                                            {client.email}
                                        </a>
                                    </div>
                                )}
                                {client.phone && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <Phone size={16} className="text-muted-foreground shrink-0" />
                                        <a href={`tel:${client.phone}`} className="text-foreground hover:text-foreground transition-colors">
                                            {client.phone}
                                        </a>
                                    </div>
                                )}
                                {client.address && (
                                    <div className="flex items-center gap-3 text-sm md:col-span-2">
                                        <MapPin size={16} className="text-muted-foreground shrink-0" />
                                        <span className="text-foreground">{client.address}</span>
                                    </div>
                                )}
                                {!client.email && !client.phone && !client.address && (
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
                                {client.auftragsvolumen != null && (
                                    <div>
                                        <p className="text-xs text-muted-foreground text-caps mb-1">Auftragsvolumen</p>
                                        <p className="text-2xl font-bold text-emerald-400">
                                            {formatCurrency(client.auftragsvolumen)}
                                        </p>
                                    </div>
                                )}
                                {client.stundenhonorar != null && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Stundensatz</span>
                                        <span className="text-sm font-medium text-foreground">
                                            {formatCurrency(client.stundenhonorar)}/h
                                        </span>
                                    </div>
                                )}
                                {client.stundenzahl_monatlich != null && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Std./Monat</span>
                                        <span className="text-sm font-medium text-foreground">
                                            {client.stundenzahl_monatlich}h
                                        </span>
                                    </div>
                                )}
                                {client.stundenzahl_gesamt != null && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Std. gesamt</span>
                                        <span className="text-sm font-medium text-foreground">
                                            {client.stundenzahl_gesamt}h
                                        </span>
                                    </div>
                                )}
                                {(client.auftragsvolumen == null && client.stundenhonorar == null) && (
                                    <p className="text-muted-foreground text-sm">Keine Finanzdaten hinterlegt.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Laufzeit + Abrechenbar Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Laufzeit Card */}
                        <div className="lg:col-span-2 rounded-2xl border border-border bg-card/40 p-6">
                            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                                <Calendar size={18} className="text-primary" />
                                Laufzeit
                            </h2>
                            <div className="flex items-center gap-6">
                                <div>
                                    <p className="text-xs text-muted-foreground text-caps mb-1">Start</p>
                                    <p className="text-sm font-medium text-foreground">{formatDate(client.laufzeit_start)}</p>
                                </div>
                                <span className="text-muted-foreground">→</span>
                                <div>
                                    <p className="text-xs text-muted-foreground text-caps mb-1">Ende</p>
                                    <p className="text-sm font-medium text-foreground">{formatDate(client.laufzeit_ende)}</p>
                                </div>
                                {client.laufzeit_start && client.laufzeit_ende && (
                                    <div className="ml-auto">
                                        <Badge variant="outline" className="text-primary border-primary/30 bg-primary/10 shadow-none">
                                            {Math.ceil((new Date(client.laufzeit_ende).getTime() - new Date(client.laufzeit_start).getTime()) / (1000 * 60 * 60 * 24))} Tage
                                        </Badge>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Abrechenbar Card */}
                        <div className="rounded-2xl border border-border bg-card/40 p-6">
                            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                                <Percent size={18} className="text-primary" />
                                Einstellungen
                            </h2>
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${client.abrechenbar !== false ? 'bg-emerald-500/10 text-emerald-400' : 'bg-muted text-muted-foreground'}`}>
                                    <CheckCircle2 size={20} />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-foreground">Abrechenbar</p>
                                    <p className="text-xs text-muted-foreground">
                                        {client.abrechenbar !== false ? 'Standardmäßig abrechenbar' : 'Nicht abrechenbar'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ============================================ */}
                    {/* B3: Projekte */}
                    {/* ============================================ */}
                    <div className="rounded-2xl border border-border bg-card/40 overflow-hidden">
                        <div className="p-6 border-b border-border">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                                    <FolderKanban size={18} className="text-primary" />
                                    Projekte
                                    {projects.length > 0 && (
                                        <Badge variant="outline" className="ml-2 text-muted-foreground border-border bg-card">
                                            {projects.length}
                                        </Badge>
                                    )}
                                </h2>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => useUiStore.getState().setProjectDialogOpen(true)}
                                    className="border-border text-foreground hover:bg-muted"
                                >
                                    <Plus size={14} className="mr-1" />
                                    Neues Projekt
                                </Button>
                            </div>
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
                                {projects.map((project) => {
                                    const hours = projectHours[project.id] || { estimated: 0, booked: 0 };
                                    const percent = hours.estimated > 0 ? Math.round((hours.booked / hours.estimated) * 100) : 0;

                                    return (
                                        <div
                                            key={project.id}
                                            className="flex items-center gap-4 p-4 hover:bg-accent/5 transition-colors text-left cursor-pointer"
                                            onClick={() => router.push(`/projects/${project.id}`)}
                                        >
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-foreground text-sm">{project.name}</span>
                                                    <Badge variant="outline" className="text-[10px] text-muted-foreground border-border bg-card/50 font-mono shadow-none">
                                                        {project.key}
                                                    </Badge>
                                                    <span className="text-xs text-muted-foreground">
                                                        ({project.tasks.length} Aufgaben)
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
                                                <span className={`text-xs font-medium w-10 text-right ${percent >= 100 ? 'text-emerald-400' : 'text-muted-foreground'
                                                    }`}>
                                                    {percent}%
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Total Hours Summary */}
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
                                                        className={`h-full rounded-full transition-all duration-500 ${totalPercent >= 100 ? 'bg-emerald-500' : 'bg-indigo-500'
                                                            }`}
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

                    {/* ============================================ */}
                    {/* B4: Alle Aufgaben */}
                    {/* ============================================ */}
                    <div className="rounded-2xl border border-border bg-card/40 overflow-hidden">
                        <div className="p-6 border-b border-border">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                                    <CheckCircle2 size={18} className="text-primary" />
                                    Alle Aufgaben
                                    {projects.length > 0 && (
                                        <Badge variant="outline" className="ml-2 text-muted-foreground border-border bg-card">
                                            {projects.reduce((sum, p) => sum + p.tasks.length, 0)}
                                        </Badge>
                                    )}
                                </h2>
                                {projects.length > 0 && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            if (projects.length === 1) {
                                                setNewTaskProjectId(projects[0].id);
                                            } else {
                                                setNewTaskProjectId('');
                                            }
                                            useUiStore.getState().setTaskDialogOpen(true);
                                        }}
                                        className="border-border text-foreground hover:bg-muted"
                                    >
                                        <Plus size={14} className="mr-1" />
                                        Neue Aufgabe
                                    </Button>
                                )}
                            </div>
                        </div>

                        {projects.reduce((sum, p) => sum + p.tasks.length, 0) === 0 ? (
                            <div className="p-12 flex flex-col items-center justify-center text-center">
                                <CheckCircle2 size={40} className="text-muted-foreground/30 mb-3" />
                                <h3 className="text-base font-semibold text-muted-foreground">Keine Aufgaben vorhanden</h3>
                                <p className="text-muted-foreground text-sm mt-1">
                                    In den Projekten dieses Kunden sind noch keine Aufgaben angelegt.
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-border">
                                {projects.flatMap((project) =>
                                    project.tasks.map((task) => ({ task, project }))
                                ).map(({ task, project }) => (
                                    <div
                                        key={task.id}
                                        className="flex items-center gap-3 px-6 py-2.5 hover:bg-white/[0.02] transition-colors cursor-pointer"
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
                                        <Badge variant="outline" className="text-[10px] text-muted-foreground border-border bg-card/50 font-mono shadow-none shrink-0">
                                            {project.name}
                                        </Badge>
                                        {task.estimated_hours && (
                                            <span className="text-xs text-muted-foreground shrink-0">
                                                {task.estimated_hours}h
                                            </span>
                                        )}
                                        <Badge variant="outline" className={`text-[10px] shrink-0 ${task.priority === 'acute' ? 'text-red-400 border-red-500/20 bg-red-500/10' :
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

                    {/* ============================================ */}
                    {/* B5: Uploads/Dateien */}
                    {/* ============================================ */}
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
                                {/* Group: Client Files */}
                                {files.filter(f => f.source === 'client').length > 0 && (
                                    <div>
                                        <div className="px-6 py-2 bg-card/50">
                                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                Kundendateien
                                            </span>
                                        </div>
                                        {files.filter(f => f.source === 'client').map(file => (
                                            <FileRow key={file.id} file={file} />
                                        ))}
                                    </div>
                                )}

                                {/* Group: Project Files */}
                                {files.filter(f => f.source === 'project').length > 0 && (
                                    <div>
                                        <div className="px-6 py-2 bg-card/50">
                                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                Projektdaten
                                            </span>
                                        </div>
                                        {files.filter(f => f.source === 'project').map(file => (
                                            <FileRow key={file.id} file={file} />
                                        ))}
                                    </div>
                                )}

                                {/* Group: Task Files */}
                                {files.filter(f => f.source === 'task').length > 0 && (
                                    <div>
                                        <div className="px-6 py-2 bg-card/50">
                                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                Aufgabendateien
                                            </span>
                                        </div>
                                        {files.filter(f => f.source === 'task').map(file => (
                                            <FileRow key={file.id} file={file} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* ============================================ */}
                    {/* B6: Einstellungen (Bearbeiter/Beobachter) */}
                    {/* ============================================ */}
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
                                        const user = users.find(u => u.id === uid);
                                        return user ? (
                                            <Badge
                                                key={uid}
                                                variant="outline"
                                                className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 flex items-center gap-1"
                                            >
                                                {getUserDisplayName(user)}
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
                                            .filter(u => !selectedBetreuer.includes(u.id))
                                            .map(user => (
                                                <SelectItem key={user.id} value={user.id}>
                                                    {getUserDisplayName(user)}
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
                                        const user = users.find(u => u.id === uid);
                                        return user ? (
                                            <Badge
                                                key={uid}
                                                variant="outline"
                                                className="bg-purple-500/10 text-purple-400 border-purple-500/20 flex items-center gap-1"
                                            >
                                                {getUserDisplayName(user)}
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
                                            .filter(u => !selectedBeobachter.includes(u.id))
                                            .map(user => (
                                                <SelectItem key={user.id} value={user.id}>
                                                    {getUserDisplayName(user)}
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Save Button */}
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
                    {client.notes && (
                        <div className="rounded-2xl border border-border bg-card/30 p-6">
                            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                                <FileText size={18} className="text-indigo-400" />
                                Notizen
                            </h2>
                            <div className="prose prose-invert prose-sm max-w-none text-foreground whitespace-pre-wrap">
                                {client.notes}
                            </div>
                        </div>
                    )}

                </div>
            </main>

            <EditClientDialog
                client={client}
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
                onClientUpdated={handleClientUpdated}
            />

            {newTaskProjectId !== null && (
                <NewTaskDialog
                    onTaskCreated={() => {
                        setNewTaskProjectId(null);
                        setRefreshTrigger(prev => prev + 1);
                    }}
                />
            )}
        </div>
    );
}