'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { GanttView } from '@/components/planner/GanttView';
import { KanbanView } from '@/components/planner/KanbanView';
import { ListView } from '@/components/planner/ListView';
import { useGanttData, type GanttProjectGroup } from '@/hooks/useGanttData';
import { useGanttSync } from '@/hooks/useGanttSync';
import { TaskDetailsDialog } from '@/components/tasks/TaskDetailsDialog';
import type { TaskRecord } from '@/lib/pocketbase-types';
import {
    BarChart3,
    ChevronDown,
    ChevronRight,
    FolderGit2,
    ListTree,
    Building2,
    User,
    Users,
} from 'lucide-react';
import { pb } from '@/lib/pocketbase';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

function formatDateDE(dateStr: string): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

function TaskTreePanel({
    groups,
    onTaskClick,
}: {
    groups: GanttProjectGroup[];
    onTaskClick: (taskId: string) => void;
}) {
    const [expandedProjects, setExpandedProjects] = useState<Set<string>>(
        new Set(groups.map((g) => g.projectId))
    );

    const toggleProject = (id: string) => {
        setExpandedProjects((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    if (groups.length === 0) {
        return (
            <div className="p-4 text-center text-muted-foreground text-sm">
                <ListTree size={24} className="mx-auto mb-2 text-muted-foreground/30" />
                Keine Aufgaben mit Datum
            </div>
        );
    }

    return (
        <div className="p-2 space-y-1">
            {groups.map((group) => {
                const isOpen = expandedProjects.has(group.projectId);
                return (
                    <div key={group.projectId}>
                        <button
                            onClick={() => toggleProject(group.projectId)}
                            className="flex w-full items-center gap-2 rounded-lg px-3 h-[46px] text-sm font-medium text-foreground hover:bg-accent/50 transition-colors"
                        >
                            {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            <FolderGit2 size={14} className="text-primary shrink-0" />
                            <span className="truncate">{group.projectName}</span>
                            <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                                {group.tasks.length}
                            </span>
                        </button>

                        {isOpen && (
                            <div className="ml-4 space-y-0.5">
                                {group.tasks.map((task) => (
                                    <button
                                        key={task.id}
                                        onClick={() => onTaskClick(task.id)}
                                        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors text-left"
                                    >
                                        <span
                                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${task.progress >= 100
                                                ? 'bg-emerald-500'
                                                : task.progress >= 70
                                                    ? 'bg-primary'
                                                    : task.progress > 0
                                                        ? 'bg-primary/60'
                                                        : 'bg-zinc-600'
                                            }`}
                                        />
                                        <div className="flex flex-col min-w-0 flex-1">
                                            <span className="truncate">{task.name}</span>
                                            <span className="text-[10px] text-muted-foreground/60">
                                                {formatDateDE(task.start)} – {formatDateDE(task.end)}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

export default function PlannerPage() {
    const { tasks, rawTasks, groups, taskStatusMap, userMap, clientMap, projectClientMap, isLoading, error, refresh } = useGanttData();
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [activeView, setActiveView] = useState<'timeline' | 'kanban' | 'list'>('timeline');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [clientFilter, setClientFilter] = useState<Set<string>>(new Set());
    const [teams, setTeams] = useState<any[]>([]);
    const [teamMembers, setTeamMembers] = useState<any[]>([]);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [selectedTeamId, setSelectedTeamId] = useState<string>('all');
    const [selectedMemberId, setSelectedMemberId] = useState<string>('all');
    const mainRef = useRef<HTMLDivElement>(null);
    const { sidebarRef, ganttRef, resync } = useGanttSync();

    useEffect(() => {
        const user = pb.authStore.record;
        setCurrentUser(user);

        const fetchTeamsData = async () => {
            try {
                const [teamsRes, membersRes] = await Promise.all([
                    pb.collection('teams').getFullList({ sort: 'name' }),
                    pb.collection('team_members').getFullList()
                ]);
                setTeams(teamsRes);
                setTeamMembers(membersRes);
            } catch (err) {
                console.error('Failed to fetch teams/members:', err);
            }
        };
        fetchTeamsData();
    }, []);

    // Listen for global custom events to keep planner in sync
    useEffect(() => {
        const handleGlobalUpdate = () => { refresh(); };
        window.addEventListener('task-updated', handleGlobalUpdate);
        window.addEventListener('project-updated', handleGlobalUpdate);
        return () => {
            window.removeEventListener('task-updated', handleGlobalUpdate);
            window.removeEventListener('project-updated', handleGlobalUpdate);
        };
    }, [refresh]);

    const isAuthorizedForTeamFilter = useMemo(() => {
        if (!currentUser) return false;
        if (currentUser.role === 'admin') return true;
        return teams.some(t => t.lead === currentUser.id);
    }, [currentUser, teams]);

    const teamMemberUserIds = useMemo(() => {
        if (selectedTeamId === 'all') return [];
        const ids = teamMembers
            .filter(tm => tm.team === selectedTeamId && tm.user)
            .map(tm => tm.user);

        const team = teams.find(t => t.id === selectedTeamId);
        if (team?.lead) {
            const leads = Array.isArray(team.lead) ? team.lead : [team.lead];
            for (const leadId of leads) {
                if (leadId && !ids.includes(leadId)) ids.push(leadId);
            }
        }
        return ids.filter(Boolean) as string[];
    }, [selectedTeamId, teamMembers, teams]);

    const filteredMembersList = useMemo(() => {
        if (selectedTeamId === 'all') {
            return Object.values(userMap).filter(Boolean);
        }
        return teamMemberUserIds.map(id => userMap[id]).filter(Boolean);
    }, [selectedTeamId, teamMemberUserIds, userMap]);

    useEffect(() => {
        if (sidebarOpen && activeView === 'timeline') {
            const t = setTimeout(() => resync(), 50);
            return () => clearTimeout(t);
        }
    }, [sidebarOpen, activeView, resync]);

    useEffect(() => {
        if (!isFullscreen) return;
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsFullscreen(false);
        };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [isFullscreen]);

    const filteredTasks = useMemo(() => {
        let result = tasks;

        if (clientFilter.size > 0) {
            result = result.filter(t => {
                const taskRecord = rawTasks.find(rt => rt.id === t.id);
                if (!taskRecord) return false;
                const clientId = projectClientMap[taskRecord.project];
                return clientFilter.has(clientId);
            });
        }

        if (isAuthorizedForTeamFilter) {
            if (selectedMemberId !== 'all') {
                result = result.filter(t => {
                    const taskRecord = rawTasks.find(rt => rt.id === t.id);
                    return taskRecord?.assignees?.includes(selectedMemberId);
                });
            } else if (selectedTeamId !== 'all') {
                result = result.filter(t => {
                    const taskRecord = rawTasks.find(rt => rt.id === t.id);
                    return taskRecord?.assignees?.some((uid: string) => teamMemberUserIds.includes(uid));
                });
            }
        }

        return result;
    }, [tasks, rawTasks, clientFilter, projectClientMap, isAuthorizedForTeamFilter, selectedTeamId, selectedMemberId, teamMemberUserIds]);

    const filteredRawTasks = useMemo(() => {
        let result = rawTasks;

        if (clientFilter.size > 0) {
            result = result.filter(t => {
                const clientId = projectClientMap[t.project];
                return clientFilter.has(clientId);
            });
        }

        if (isAuthorizedForTeamFilter) {
            if (selectedMemberId !== 'all') {
                result = result.filter(t => t.assignees?.includes(selectedMemberId));
            } else if (selectedTeamId !== 'all') {
                result = result.filter(t => t.assignees?.some((uid: string) => teamMemberUserIds.includes(uid)));
            }
        }

        return result;
    }, [rawTasks, clientFilter, projectClientMap, isAuthorizedForTeamFilter, selectedTeamId, selectedMemberId, teamMemberUserIds]);

    const filteredGroups = useMemo(() => {
        let result = groups;

        if (clientFilter.size > 0) {
            result = result.map(g => ({
                ...g,
                tasks: g.tasks.filter(t => {
                    const taskRecord = rawTasks.find(rt => rt.id === t.id);
                    if (!taskRecord) return false;
                    const clientId = projectClientMap[taskRecord.project];
                    return clientFilter.has(clientId);
                }),
            }));
        }

        if (isAuthorizedForTeamFilter) {
            if (selectedMemberId !== 'all') {
                result = result.map(g => ({
                    ...g,
                    tasks: g.tasks.filter(t => {
                        const taskRecord = rawTasks.find(rt => rt.id === t.id);
                        return taskRecord?.assignees?.includes(selectedMemberId);
                    }),
                }));
            } else if (selectedTeamId !== 'all') {
                result = result.map(g => ({
                    ...g,
                    tasks: g.tasks.filter(t => {
                        const taskRecord = rawTasks.find(rt => rt.id === t.id);
                        return taskRecord?.assignees?.some((uid: string) => teamMemberUserIds.includes(uid));
                    }),
                }));
            }
        }

        return result.map(g => ({
            ...g,
            tasks: g.tasks
        })).filter(g => g.tasks.length > 0);
    }, [groups, rawTasks, clientFilter, projectClientMap, isAuthorizedForTeamFilter, selectedTeamId, selectedMemberId, teamMemberUserIds]);

    const toggleClientFilter = (clientId: string) => {
        setClientFilter(prev => {
            const next = new Set(prev);
            if (next.has(clientId)) next.delete(clientId);
            else next.add(clientId);
            return next;
        });
    };

    const handleToggleFullscreen = () => {
        if (!isFullscreen) {
            const el = mainRef.current;
            if (el?.requestFullscreen) {
                el.requestFullscreen().catch(() => setIsFullscreen(true));
            }
            setIsFullscreen(true);
        } else {
            if (document.fullscreenElement) {
                document.exitFullscreen().catch(() => {});
            }
            setIsFullscreen(false);
        }
    };

    return (
        <div className="h-full flex flex-col">
            {/* Page header */}
            <div className="flex items-center justify-between px-8 py-5 border-b border-border">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
                        <BarChart3 size={32} className="text-primary" />
                        Planer
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Zeitplan und Meilensteine aller Projekte im Überblick.
                    </p>
                </div>

                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className={`flex items-center gap-2 px-3 py-2 text-xs font-bold uppercase tracking-widest rounded-xl transition-all ${sidebarOpen
                        ? 'bg-primary text-black shadow-lg shadow-primary/20'
                        : 'text-muted-foreground hover:text-foreground border border-border'
                    }`}
                >
                    <ListTree size={16} />
                    {sidebarOpen ? 'Seitenleiste ausblenden' : 'Projektbaum'}
                </button>
            </div>

            {/* Unified Filter Bar (Clients, Teams & Members) */}
            {(Object.keys(clientMap).length > 0 || isAuthorizedForTeamFilter) && (
                <div className="px-8 py-2.5 border-b border-border bg-background/30 flex items-center gap-6 flex-wrap">
                    {/* Client Filter Section */}
                    {Object.keys(clientMap).length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 shrink-0">
                                <Building2 size={14} className="text-primary" />
                                Kunden:
                            </span>
                            {Object.values(clientMap).map((client) => {
                                const isActive = clientFilter.has(client.id);
                                return (
                                    <button
                                        key={client.id}
                                        onClick={() => toggleClientFilter(client.id)}
                                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                                            isActive
                                                ? 'bg-primary text-black shadow-sm'
                                                : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/30'
                                        }`}
                                    >
                                        {client.name}
                                    </button>
                                );
                            })}
                            {clientFilter.size > 0 && (
                                <button
                                    onClick={() => setClientFilter(new Set())}
                                    className="px-2 py-1 text-xs text-red-400 hover:text-red-300 transition-colors"
                                >
                                    Zurücksetzen
                                </button>
                            )}
                        </div>
                    )}

                    {Object.keys(clientMap).length > 0 && isAuthorizedForTeamFilter && (
                        <div className="hidden md:block w-px h-5 bg-border self-center" />
                    )}

                    {/* Team & Member Filter Section */}
                    {isAuthorizedForTeamFilter && (
                        <div className="flex items-center gap-6 flex-wrap">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 shrink-0">
                                    <Users size={14} className="text-primary" />
                                    Team:
                                </span>
                                <Select
                                    value={selectedTeamId}
                                    onValueChange={(val) => {
                                        setSelectedTeamId(val || 'all');
                                        setSelectedMemberId('all');
                                    }}
                                >
                                    <SelectTrigger className="bg-background border-border h-8 min-w-[160px] text-xs text-foreground">
                                        <SelectValue>
                                            {(value: string) => value === 'all' ? 'Alle Teams' : (teams.find(t => t.id === value)?.name || value)}
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent className="bg-background border-border text-foreground">
                                        <SelectItem value="all">Alle Teams</SelectItem>
                                        {teams.map((t) => (
                                            <SelectItem key={t.id} value={t.id}>
                                                {t.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 shrink-0">
                                    <User size={14} className="text-primary" />
                                    Mitglied:
                                </span>
                                <Select
                                    value={selectedMemberId}
                                    onValueChange={(val) => setSelectedMemberId(val || 'all')}
                                >
                                    <SelectTrigger className="bg-background border-border h-8 min-w-[180px] text-xs text-foreground">
                                        <SelectValue>
                                            {(value: string) => value === 'all' ? 'Alle Mitglieder' : (userMap[value] ? (userMap[value].name || userMap[value].email) : value)}
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent className="bg-background border-border text-foreground">
                                        <SelectItem value="all">Alle Mitglieder</SelectItem>
                                        {filteredMembersList.map((u: any) => (
                                            <SelectItem key={u.id} value={u.id}>
                                                {u.name || u.email}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {(selectedTeamId !== 'all' || selectedMemberId !== 'all') && (
                                <button
                                    onClick={() => {
                                        setSelectedTeamId('all');
                                        setSelectedMemberId('all');
                                    }}
                                    className="px-2 py-1 text-xs text-red-400 hover:text-red-300 transition-colors"
                                >
                                    Filter zurücksetzen
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Main content area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar with project tree – only shown in timeline view */}
                {sidebarOpen && activeView === 'timeline' && (
                    <aside ref={sidebarRef} className="w-64 border-r border-border bg-background/30 overflow-y-auto shrink-0">
                        <div className="px-4 py-3 border-b border-border">
                            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                <ListTree size={14} />
                                Projektstruktur
                            </h2>
                        </div>
                        <TaskTreePanel groups={filteredGroups} onTaskClick={setSelectedTaskId} />
                    </aside>
                )}

                {/* Main content */}
                <main
                    ref={mainRef}
                    className={isFullscreen
                        ? 'fixed inset-0 z-50 bg-background overflow-hidden flex flex-col'
                        : 'flex-1 overflow-hidden flex flex-col'
                    }
                >
                    <GanttView
                        tasks={filteredTasks}
                        taskStatusMap={taskStatusMap}
                        isLoading={isLoading}
                        error={error}
                        onTaskClick={setSelectedTaskId}
                        scrollRef={ganttRef}
                        sidebarOpen={sidebarOpen}
                        activeView={activeView}
                        onViewChange={setActiveView}
                        isFullscreen={isFullscreen}
                        onToggleFullscreen={handleToggleFullscreen}
                        onTaskUpdated={refresh}
                    />

                    {activeView === 'kanban' && (
                        <KanbanView
                            tasks={filteredRawTasks}
                            onTaskClick={setSelectedTaskId}
                            onTaskUpdated={refresh}
                        />
                    )}
                    {activeView === 'list' && (
                        <ListView
                            tasks={filteredRawTasks}
                            onTaskClick={setSelectedTaskId}
                        />
                    )}
                </main>
            </div>

            <TaskDetailsDialog
                taskId={selectedTaskId}
                projectKey={filteredGroups.find(g => g.tasks.some(t => t.id === selectedTaskId))?.projectKey || ''}
                onClose={() => setSelectedTaskId(null)}
                onTaskClick={setSelectedTaskId}
                onTaskUpdated={() => {
                    refresh();
                }}
            />
        </div>
    );
}
