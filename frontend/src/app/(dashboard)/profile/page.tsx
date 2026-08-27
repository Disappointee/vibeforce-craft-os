'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { pb } from '@/lib/pocketbase';
import { useTimerStore, useSettingsStore } from '@/lib/store';
import { AvatarUpload } from '@/components/profile/AvatarUpload';
import { PasswordChange } from '@/components/profile/PasswordChange';
import { NotificationSettings } from '@/components/profile/NotificationSettings';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    User,
    Globe,
    Loader2,
    Save,
    Briefcase,
    Building2,
    FolderKanban,
    ListChecks,
    Clock,
    ExternalLink,
    Sliders,
    KanbanSquare,
    List,
    BarChart3,
    Mail,
    LayoutGrid,
    CheckSquare
} from 'lucide-react';
import { toast } from 'sonner';
import type { ProjectRecord, TaskRecord, TimeEntryRecord, ClientRecord, UserPreferences } from '@/lib/pocketbase-types';

const EXPERTISE_OPTIONS = [
    { value: 'sea', label: 'SEA' },
    { value: 'social_ads', label: 'Social Ads' },
    { value: 'tracking', label: 'Tracking' },
    { value: 'seo', label: 'SEO' },
    { value: 'content', label: 'Content' },
    { value: 'design', label: 'Design' },
    { value: 'development', label: 'Entwicklung' },
    { value: 'consulting', label: 'Beratung' },
    { value: 'other', label: 'Sonstiges' },
];

function formatHoursMinutes(totalMinutes: number): string {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.round(totalMinutes % 60);
    if (hours === 0) return `${minutes}m`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}m`;
}

function getStatusBadge(status: string) {
    switch (status) {
        case 'todo':
            return <Badge className="bg-zinc-700/60 text-foreground border-zinc-600">Offen</Badge>;
        case 'in_progress':
            return <Badge className="bg-blue-500/15 text-blue-400 border-blue-500/30">In Arbeit</Badge>;
        case 'review':
            return <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30">Prüfung</Badge>;
        case 'done':
            return <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30">Erledigt</Badge>;
        default:
            return <Badge className="bg-zinc-700/60 text-foreground">{status}</Badge>;
    }
}

export default function ProfilePage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(pb.authStore.record);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [name, setName] = useState(pb.authStore.record?.name || '');
    const [language, setLanguage] = useState('de');
    const [expertise, setExpertise] = useState<string[]>([]);
    const [avatarUrl, setAvatarUrl] = useState('');
    const [hourlyRate, setHourlyRate] = useState(pb.authStore.record?.stundenhonorar || pb.authStore.record?.hourly_rate || '');
    // F2: Zugeordnete Daten
    const [assignedClients, setAssignedClients] = useState<ClientRecord[]>([]);
    const [assignedProjects, setAssignedProjects] = useState<ProjectRecord[]>([]);
    const [assignedTasks, setAssignedTasks] = useState<TaskRecord[]>([]);

    // F3: Stundenübersicht
    const [totalMinutesThisMonth, setTotalMinutesThisMonth] = useState(0);
    const [totalMinutesThisWeek, setTotalMinutesThisWeek] = useState(0);
    const [totalMinutesToday, setTotalMinutesToday] = useState(0);
    const [hoursLoading, setHoursLoading] = useState(true);

    const { timerMode, setTimerMode } = useTimerStore();
    const {
        defaultTaskView,
        setDefaultTaskView,
        timeRoundingMinutes,
        setTimeRoundingMinutes,
        defaultBillable,
        setDefaultBillable,
        emailNotificationFrequency,
        setEmailNotificationFrequency,
        uiDensity,
        setUiDensity,
        saveUserPreferences,
        syncFromUserPreferences,
    } = useSettingsStore();

    const [relationsLoading, setRelationsLoading] = useState(true);

    useEffect(() => {
        const init = async () => {
            if (!pb.authStore.isValid) {
                router.push('/login');
                return;
            }
            try {
                const record = await pb.collection('users').authRefresh();
                setUser(record.record);
                setName(record.record?.name || '');
                setLanguage(record.record?.language || 'de');
                setExpertise(record.record?.expertise || []);
                setHourlyRate(record.record?.stundenhonorar || record.record?.hourly_rate || '');
                syncFromUserPreferences(record.record);
            } catch {
                pb.authStore.clear();
                router.push('/login');
                return;
            }
            setLoading(false);
        };
        init();
    }, [router, syncFromUserPreferences]);

    // Fetch zugeordnete Kunden/Projekte/Aufgaben
    useEffect(() => {
        if (!user?.id) return;

        const fetchRelations = async () => {
            setRelationsLoading(true);
            try {
                const currentUserId = user.id;

                // Fetch projects where user is a member
                const projectsResult = await pb.collection('projects').getList<ProjectRecord>(1, 200, {
                    filter: pb.filter('members ~ {:uid}', { uid: currentUserId }),
                    sort: 'name',
                    expand: 'client',
                });
                const projects = projectsResult.items;
                setAssignedProjects(projects);

                // Extract unique client IDs from projects
                const clientIds = [...new Set(projects.map(p => p.client).filter(Boolean))] as string[];
                if (clientIds.length > 0) {
                const clientFilter = clientIds.map(id => pb.filter('id = {:id}', { id })).join(' || ');
                    const clientsResult = await pb.collection('clients').getList<ClientRecord>(1, 50, {
                        filter: clientFilter,
                    });
                    setAssignedClients(clientsResult.items);
                } else {
                    setAssignedClients([]);
                }

                // Fetch tasks where user is an assignee (not done)
                const tasksResult = await pb.collection('tasks').getList<TaskRecord>(1, 50, {
                    filter: pb.filter('assignees ~ {:uid} && status != "done"', { uid: currentUserId }),
                    sort: '-created',
                    expand: 'project',
                });
                setAssignedTasks(tasksResult.items);
            } catch (error) {
                console.error('Error fetching relations:', error);
            } finally {
                setRelationsLoading(false);
            }
        };

        fetchRelations();
    }, [user?.id]);

    // Fetch Stundenübersicht
    useEffect(() => {
        if (!user?.id) return;

        const fetchHours = async () => {
            setHoursLoading(true);
            try {
                const currentUserId = user.id;
                const now = new Date();
                const tzOffset = now.getTimezoneOffset() * 60000;
                const localDate = new Date(now.getTime() - tzOffset).toISOString().split('T')[0];

                // Today
                const todayStart = `${localDate} 00:00:00`;
                const todayEnd = `${localDate} 23:59:59`;
                const todayResult = await pb.collection('time_entries').getList(1, 500, {
                    filter: pb.filter('user = {:uid} && start_time >= {:start} && start_time <= {:end}', { uid: currentUserId, start: todayStart, end: todayEnd }),
                    skipTotal: false,
                });

                // This week (Monday to Sunday)
                const dayOfWeek = now.getDay();
                const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
                const monday = new Date(now);
                monday.setDate(now.getDate() + mondayOffset);
                const mondayStr = new Date(monday.getTime() - tzOffset).toISOString().split('T')[0];
                const sunday = new Date(monday);
                sunday.setDate(monday.getDate() + 6);
                const sundayStr = new Date(sunday.getTime() - tzOffset).toISOString().split('T')[0];

                const weekStart = mondayStr + " 00:00:00";
                const weekEnd = sundayStr + " 23:59:59";
                const weekResult = await pb.collection('time_entries').getList(1, 500, {
                    filter: pb.filter('user = {:uid} && start_time >= {:start} && start_time <= {:end}', { uid: currentUserId, start: weekStart, end: weekEnd }),
                });

                // This month
                const monthStr = localDate.substring(0, 7); // YYYY-MM
                const monthStart = monthStr + "-01";
                const monthFrom = monthStart + " 00:00:00";
                const monthResult = await pb.collection('time_entries').getList(1, 2000, {
                    filter: pb.filter('user = {:uid} && start_time >= {:start}', { uid: currentUserId, start: monthFrom }),
                });

                const sumMinutes = (entries: TimeEntryRecord[]) =>
                    entries.reduce((sum, e) => sum + (e.duration_minutes || e.duration || 0), 0);

                setTotalMinutesToday(sumMinutes(todayResult.items as TimeEntryRecord[]));
                setTotalMinutesThisWeek(sumMinutes(weekResult.items as TimeEntryRecord[]));
                setTotalMinutesThisMonth(sumMinutes(monthResult.items as TimeEntryRecord[]));
            } catch (error) {
                console.error('Error fetching hours:', error);
            } finally {
                setHoursLoading(false);
            }
        };

        fetchHours();
    }, [user?.id]);

    const handleSaveProfile = async () => {
        setSaving(true);
        try {
            const updated = await pb.collection('users').update(user.id, {
                name,
                language,
                expertise,
            });
            setUser(updated);
            toast.success('Profil erfolgreich aktualisiert');
        } catch (error: any) {
            console.error('Profile update error:', error);
            toast.error(error?.message || 'Fehler beim Speichern des Profils');
        } finally {
            setSaving(false);
        }
    };

    const handleAvatarUpdate = (url: string) => {
        setAvatarUrl(url);
        // Refresh user data to get updated avatar
        pb.collection('users').authRefresh().then((record) => {
            setUser(record.record);
        });
    };

    const toggleExpertise = (value: string) => {
        setExpertise(prev =>
            prev.includes(value)
                ? prev.filter(v => v !== value)
                : [...prev, value]
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
                    <p className="text-muted-foreground font-medium tracking-wide">Lade Profil...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Page Header */}
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-3">
                        <User size={24} className="text-indigo-400" />
                        Mein Profil
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">Verwalte deine persönlichen Einstellungen und dein Profil</p>
                </div>

                {/* Profile Info Card */}
                <Card className="border-border bg-card/40">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                                <User size={18} />
                            </div>
                            <div>
                                <CardTitle>Profilinformationen</CardTitle>
                                <CardDescription>Name, E-Mail, Avatar und Aufgabengebiete verwalten</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Avatar Upload */}
                        <AvatarUpload
                            userId={user.id}
                            currentAvatar={user.avatar}
                            userName={user.name}
                            onAvatarUpdate={handleAvatarUpdate}
                        />

                        {/* Divider */}
                        <div className="border-t border-border" />

                        {/* Name & Email */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Dein Name"
                                    className="bg-background border-border"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">E-Mail</Label>
                                <Input
                                    id="email"
                                    value={user.email || ''}
                                    disabled
                                    className="bg-background border-border opacity-60"
                                />
                                <p className="text-xs text-muted-foreground">Die E-Mail-Adresse kann nicht geändert werden</p>
                            </div>
                        </div>

                        {/* Language Select & Hourly Rate */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="language">Sprache</Label>
                                <Select value={language} onValueChange={(val) => val && setLanguage(val)}>
                                    <SelectTrigger className="w-full bg-background border-border">
                                        <Globe size={14} />
                                        <SelectValue>
                                            {(value: string) => ({ de: 'Deutsch', en: 'English' } as Record<string, string>)[value] || value}
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="de">
                                            <span className="flex items-center gap-2">🇩🇪 Deutsch</span>
                                        </SelectItem>
                                        <SelectItem value="en">
                                            <span className="flex items-center gap-2">🇬🇧 English</span>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="hourlyRate">Stundensatz (€/h)</Label>
                                <Input
                                    id="hourlyRate"
                                    type="number"
                                    value={hourlyRate}
                                    onChange={(e) => setHourlyRate(e.target.value)}
                                    placeholder="z.B. 100"
                                    className="bg-background border-border"
                                />
                            </div>
                        </div>

                        {/* F1: Expertise / Aufgabengebiete */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Briefcase size={16} className="text-indigo-400" />
                                <Label>Aufgabengebiete</Label>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {EXPERTISE_OPTIONS.map((opt) => {
                                    const isSelected = expertise.includes(opt.value);
                                    return (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => toggleExpertise(opt.value)}
                                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${isSelected
                                                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                                                : 'bg-muted/50 text-muted-foreground border-zinc-700/50 hover:border-zinc-600 hover:text-foreground'
                                                }`}
                                        >
                                            {opt.label}
                                        </button>
                                    );
                                })}
                            </div>
                            <p className="text-xs text-muted-foreground">Wähle deine Aufgabengebiete aus (Mehrfachauswahl möglich)</p>
                        </div>

                        {/* Save Button */}
                        <div className="flex justify-end pt-2">
                            <Button onClick={handleSaveProfile} disabled={saving}>
                                {saving && <Loader2 size={14} className="animate-spin" />}
                                <Save size={14} />
                                {saving ? 'Wird gespeichert...' : 'Speichern'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* F3: Stundenübersicht */}
                <Card className="border-border bg-card/40">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                                <Clock size={18} />
                            </div>
                            <div>
                                <CardTitle>Stundenübersicht</CardTitle>
                                <CardDescription>Deine erfassten Arbeitszeiten</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {hoursLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 size={20} className="animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="rounded-xl border border-border bg-background/50 p-4 text-center">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Heute</p>
                                    <p className="text-2xl font-bold text-foreground">{formatHoursMinutes(totalMinutesToday)}</p>
                                </div>
                                <div className="rounded-xl border border-border bg-background/50 p-4 text-center">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Diese Woche</p>
                                    <p className="text-2xl font-bold text-foreground">{formatHoursMinutes(totalMinutesThisWeek)}</p>
                                </div>
                                <div className="rounded-xl border border-border bg-background/50 p-4 text-center">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Dieser Monat</p>
                                    <p className="text-2xl font-bold text-foreground">{formatHoursMinutes(totalMinutesThisMonth)}</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* F2: Zugeordnete Kunden, Projekte, Aufgaben */}
                <Card className="border-border bg-card/40">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                                <ListChecks size={18} />
                            </div>
                            <div>
                                <CardTitle>Meine Übersicht</CardTitle>
                                <CardDescription>Zugeordnete Kunden, Projekte und offene Aufgaben</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {relationsLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 size={20} className="animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Clients */}
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <Building2 size={16} className="text-muted-foreground" />
                                        <h3 className="text-sm font-medium text-foreground">Kunden ({assignedClients.length})</h3>
                                    </div>
                                    {assignedClients.length === 0 ? (
                                        <p className="text-sm text-muted-foreground pl-6">Keine Kunden zugeordnet</p>
                                    ) : (
                                        <div className="flex flex-wrap gap-2 pl-6">
                                            {assignedClients.map((client) => (
                                                <Link
                                                    key={client.id}
                                                    href={`/clients/${client.id}`}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/40 border border-zinc-700/50 text-sm text-foreground hover:bg-muted hover:text-foreground transition-colors group"
                                                >
                                                    {client.name}
                                                    <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Projects */}
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <FolderKanban size={16} className="text-muted-foreground" />
                                        <h3 className="text-sm font-medium text-foreground">Projekte ({assignedProjects.length})</h3>
                                    </div>
                                    {assignedProjects.length === 0 ? (
                                        <p className="text-sm text-muted-foreground pl-6">Keine Projekte zugeordnet</p>
                                    ) : (
                                        <div className="space-y-1.5 pl-6">
                                            {assignedProjects.slice(0, 10).map((project) => (
                                                <Link
                                                    key={project.id}
                                                    href={`/projects/${project.id}`}
                                                    className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/20 border border-border/50 text-sm text-foreground hover:bg-muted/40 hover:text-foreground transition-colors group"
                                                >
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <span className="truncate">{project.name}</span>
                                                        {project.expand?.client && (
                                                            <span className="text-xs text-muted-foreground shrink-0">
                                                                ({project.expand.client.name})
                                                            </span>
                                                        )}
                                                    </div>
                                                    <ExternalLink size={12} className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </Link>
                                            ))}
                                            {assignedProjects.length > 10 && (
                                                <p className="text-xs text-muted-foreground text-center pt-1">
                                                    + {assignedProjects.length - 10} weitere Projekte
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Tasks */}
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <ListChecks size={16} className="text-muted-foreground" />
                                        <h3 className="text-sm font-medium text-foreground">Offene Aufgaben ({assignedTasks.length})</h3>
                                    </div>
                                    {assignedTasks.length === 0 ? (
                                        <p className="text-sm text-muted-foreground pl-6">Keine offenen Aufgaben</p>
                                    ) : (
                                        <div className="space-y-1.5 pl-6">
                                            {assignedTasks.slice(0, 10).map((task) => (
                                                <div
                                                    key={task.id}
                                                    className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/20 border border-border/50 text-sm"
                                                >
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <span className="truncate text-foreground">{task.title}</span>
                                                        {task.expand?.project && (
                                                            <span className="text-xs text-muted-foreground shrink-0">
                                                                in {task.expand.project.name}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        {getStatusBadge(task.status)}
                                                        {task.due_date && (
                                                            <span className={`text-xs ${new Date(task.due_date) < new Date()
                                                                ? 'text-red-400'
                                                                : 'text-muted-foreground'
                                                                }`}>
                                                                {new Date(task.due_date).toLocaleDateString('de-DE')}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                            {assignedTasks.length > 10 && (
                                                <p className="text-xs text-muted-foreground text-center pt-1">
                                                    + {assignedTasks.length - 10} weitere Aufgaben
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Timer-Anzeige */}
                <Card className="border-border bg-card/40">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                <Clock size={18} />
                            </div>
                            <div>
                                <CardTitle>Timer-Anzeige</CardTitle>
                                <CardDescription>Wähle, wie der Zeiterfassungs-Timer dargestellt wird</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-lg border border-border bg-background/50 px-4 py-3">
                            <div className="space-y-0.5">
                                <span className="text-sm font-medium text-foreground">Darstellung</span>
                                <p className="text-xs text-muted-foreground">Timer-Leiste (unten) oder Header-Timer (oben)</p>
                            </div>
                            <Select value={timerMode} onValueChange={(val) => { if (val) setTimerMode(val as 'bar' | 'header'); }}>
                                <SelectTrigger className="w-[200px]">
                                    <SelectValue>
                                        {(value: string | null) => {
                                            if (value === 'bar') return 'Timer-Leiste (unten)';
                                            if (value === 'header') return 'Header-Timer (oben)';
                                            return 'Darstellung wählen';
                                        }}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="bar">Timer-Leiste (unten)</SelectItem>
                                    <SelectItem value="header">Header-Timer (oben)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Arbeitsplatz & Workflow-Präferenzen */}
                <Card className="border-border bg-card/40">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400">
                                <Sliders size={18} />
                            </div>
                            <div>
                                <CardTitle>Arbeitsplatz & Workflow-Präferenzen</CardTitle>
                                <CardDescription>Passe Ansichten, Rundungslogik und Vorbelegungen an deine Arbeitsweise an</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Standard-Aufgabenansicht */}
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-lg border border-border bg-background/50 px-4 py-3">
                            <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                    <KanbanSquare size={14} className="text-teal-400" />
                                    <Label htmlFor="default-task-view" className="text-sm font-medium text-foreground cursor-pointer">
                                        Standard-Aufgabenansicht
                                    </Label>
                                </div>
                                <p className="text-xs text-muted-foreground">Standardmäßige Ansichtsform für Aufgaben und Projektboards</p>
                            </div>
                            <Select
                                value={defaultTaskView}
                                onValueChange={async (val) => {
                                    if (val) {
                                        setDefaultTaskView(val as any);
                                        await saveUserPreferences({ defaultTaskView: val as any });
                                        toast.success('Standard-Aufgabenansicht gespeichert');
                                    }
                                }}
                            >
                                <SelectTrigger id="default-task-view" className="w-[200px] bg-background border-border">
                                    <SelectValue>
                                        {(value: string) => {
                                            if (value === 'kanban') return 'Kanban-Board';
                                            if (value === 'list') return 'Tabellen-Liste';
                                            if (value === 'timeline') return 'Zeitstrahl (Timeline)';
                                            return value;
                                        }}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent className="bg-background border-border text-foreground">
                                    <SelectItem value="kanban">Kanban-Board</SelectItem>
                                    <SelectItem value="list">Tabellen-Liste</SelectItem>
                                    <SelectItem value="timeline">Zeitstrahl (Timeline)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Zeiterfassungs-Rundung */}
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-lg border border-border bg-background/50 px-4 py-3">
                            <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                    <Clock size={14} className="text-teal-400" />
                                    <Label htmlFor="time-rounding" className="text-sm font-medium text-foreground cursor-pointer">
                                        Zeiterfassungs-Rundung
                                    </Label>
                                </div>
                                <p className="text-xs text-muted-foreground">Automatische Rundung gestoppter Timer auf buchhalterische Intervalle</p>
                            </div>
                            <Select
                                value={String(timeRoundingMinutes)}
                                onValueChange={async (val) => {
                                    const mins = parseInt(val) || 0;
                                    setTimeRoundingMinutes(mins);
                                    await saveUserPreferences({ timeRoundingMinutes: mins });
                                    toast.success('Zeiterfassungs-Rundung gespeichert');
                                }}
                            >
                                <SelectTrigger id="time-rounding" className="w-[200px] bg-background border-border">
                                    <SelectValue>
                                        {(value: string) => {
                                            if (value === '0') return 'Exakt (Minutengenau)';
                                            if (value === '5') return '5-Minuten-Takt';
                                            if (value === '15') return '15-Minuten-Takt';
                                            return `${value} Minuten`;
                                        }}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent className="bg-background border-border text-foreground">
                                    <SelectItem value="0">Exakt (Minutengenau)</SelectItem>
                                    <SelectItem value="5">5-Minuten-Takt (aufrunden)</SelectItem>
                                    <SelectItem value="15">15-Minuten-Takt (Standard Agentur)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Standard-Status "Abrechenbar" */}
                        <div className="flex items-center justify-between rounded-lg border border-border bg-background/50 px-4 py-3">
                            <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                    <CheckSquare size={14} className="text-teal-400" />
                                    <Label htmlFor="default-billable-toggle" className="text-sm font-medium text-foreground cursor-pointer">
                                        Standardmäßig als "Abrechenbar" markieren
                                    </Label>
                                </div>
                                <p className="text-xs text-muted-foreground">Neue Timer und Zeiteinträge standardmäßig als abrechenbar vorselektieren</p>
                            </div>
                            <button
                                id="default-billable-toggle"
                                role="switch"
                                aria-checked={defaultBillable}
                                onClick={async () => {
                                    const next = !defaultBillable;
                                    setDefaultBillable(next);
                                    await saveUserPreferences({ defaultBillable: next });
                                    toast.success(next ? 'Standardmäßig abrechenbar aktiviert' : 'Standardmäßig abrechenbar deaktiviert');
                                }}
                                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 ${defaultBillable ? 'bg-teal-500' : 'bg-zinc-700'
                                    }`}
                            >
                                <span
                                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${defaultBillable ? 'translate-x-4' : 'translate-x-0'
                                        }`}
                                />
                            </button>
                        </div>

                        {/* UI-Dichte */}
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-lg border border-border bg-background/50 px-4 py-3">
                            <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                    <LayoutGrid size={14} className="text-teal-400" />
                                    <Label htmlFor="ui-density" className="text-sm font-medium text-foreground cursor-pointer">
                                        UI-Dichte & Informationsgrad
                                    </Label>
                                </div>
                                <p className="text-xs text-muted-foreground">Kompakte Darstellung für kleinere Bildschirme oder mehr Übersicht</p>
                            </div>
                            <Select
                                value={uiDensity}
                                onValueChange={async (val) => {
                                    if (val) {
                                        setUiDensity(val as any);
                                        await saveUserPreferences({ uiDensity: val as any });
                                        toast.success('UI-Dichte gespeichert');
                                    }
                                }}
                            >
                                <SelectTrigger id="ui-density" className="w-[200px] bg-background border-border">
                                    <SelectValue>
                                        {(value: string) => {
                                            if (value === 'comfortable') return 'Komfortabel';
                                            if (value === 'compact') return 'Kompakt';
                                            return value;
                                        }}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent className="bg-background border-border text-foreground">
                                    <SelectItem value="comfortable">Komfortabel (Standard)</SelectItem>
                                    <SelectItem value="compact">Kompakt (Mehr Daten)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Password Change */}
                <PasswordChange />

                {/* Notification Settings */}
                <NotificationSettings />
            </div>
        </div>
    );
}
