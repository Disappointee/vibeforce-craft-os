'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { pb } from '@/lib/pocketbase';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { TaskRecord, TaskStatus, TaskPriority, ProjectRecord, UserRecord, ClientRecord } from '@/lib/pocketbase-types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { CheckSquare, Filter, Search, X, Layers, KanbanSquare, List as ListIcon, Users, Building2, AlertTriangle, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { TaskDetailsSheet } from '@/components/tasks/TaskDetailsSheet';
import { KanbanBoard } from '@/components/tasks/KanbanBoard';
import { TaskContextMenu } from '@/components/tasks/TaskContextMenu';
import { NewSimpleTaskDialog } from '@/components/tasks/NewSimpleTaskDialog';
import { toast } from 'sonner';
import { t } from '@/lib/i18n';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useSettingsStore } from '@/lib/store';
import { isCraftMode } from '@/config/app-mode';
import { filterProjectsByMode, filterTasksByMode, filterClientsByMode } from '@/lib/data-isolation';

export function TasksPageClient({
  initialProjects,
  initialUsers,
  initialClients,
}: {
  initialProjects: ProjectRecord[];
  initialUsers: UserRecord[];
  initialClients: ClientRecord[];
}) {
  const searchParams = useSearchParams();
  const craft = isCraftMode();
  const { defaultTaskView } = useSettingsStore();
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [groupByCycle, setGroupByCycle] = useState(false);
  const [projects] = useState(initialProjects);
  const [users] = useState(initialUsers);
  const [clients] = useState(initialClients);
  const [viewMode, setViewMode] = useState<'list' | 'board'>(() => defaultTaskView === 'list' ? 'list' : 'board');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [showAllTasks, setShowAllTasks] = useState(true);
  const currentUserId = pb.authStore.record?.id;
  const isAdmin = pb.authStore.record?.role === 'admin';

  const visibleProjects = useMemo(() => {
    return filterProjectsByMode(projects);
  }, [projects]);

  const visibleClients = useMemo(() => {
    return filterClientsByMode(clients);
  }, [clients]);

  useEffect(() => {
    const fetchAllTasks = async () => {
      setIsLoading(true);
      try {
        const filterStr = (!showAllTasks && currentUserId)
          ? pb.filter("status != 'done' && assignees ?= {:userId}", { userId: currentUserId })
          : "status != 'done'";
        const result = await pb.collection('tasks').getList(1, 200, {
          sort: '-created',
          expand: 'project,assignees',
          filter: filterStr,
        });
        const modeFiltered = filterTasksByMode(result.items as TaskRecord[]);
        setTasks(modeFiltered);
      } catch (error) {
        console.error('Failed to fetch tasks:', error);
        toast.error('Fehler beim Laden der Aufgaben');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllTasks();
  }, [refreshTrigger, showAllTasks, currentUserId, craft]);

  useEffect(() => {
    const handleUpdate = () => setRefreshTrigger(prev => prev + 1);
    window.addEventListener('task-updated', handleUpdate);
    window.addEventListener('project-updated', handleUpdate);
    return () => {
      window.removeEventListener('task-updated', handleUpdate);
      window.removeEventListener('project-updated', handleUpdate);
    };
  }, []);

  const filteredTasks = tasks
    .filter(task =>
      !searchQuery ||
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.expand?.project?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.expand?.project?.key?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .filter(task => statusFilter === 'all' || task.status === statusFilter)
    .filter(task => priorityFilter === 'all' || task.priority === priorityFilter)
    .filter(task => projectFilter === 'all' || task.project === projectFilter)
    .filter(task => {
      if (assigneeFilter === 'all') return true;
      if (assigneeFilter === 'unassigned') {
        return !task.assignees || task.assignees.length === 0;
      }
      const assigneeArr = task.assignees
        ? (Array.isArray(task.assignees) ? task.assignees : [task.assignees])
        : [];
      return assigneeArr.includes(assigneeFilter);
    })
    .filter(task => {
      if (clientFilter === 'all') return true;
      const project = task.expand?.project as ProjectRecord | undefined;
      return project?.client === clientFilter;
    });

  const projectClientMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const p of projects) {
      const clientId = (p as any).client as string | undefined;
      if (clientId) {
        const client = clients.find(c => c.id === clientId);
        if (client) map[p.id] = client.name;
      }
    }
    return map;
  }, [projects, clients]);

  const cycleGroupedTasks = useMemo(() => {
    if (!groupByCycle) return null;

    const groups: { projectId: string; projectName: string; projectKey: string; cycleNumber: number; tasks: TaskRecord[] }[] = [];

    for (const task of filteredTasks) {
      const project = task.expand?.project as ProjectRecord | undefined;
      const projectId = project?.id || 'unknown';
      const projectName = project?.name || 'Unbekanntes Projekt';
      const projectKey = project?.key || '—';
      const cycleNumber = (project as any)?.cycle_number || 0;

      let group = groups.find(g => g.projectId === projectId);
      if (!group) {
        group = { projectId, projectName, projectKey, cycleNumber, tasks: [] };
        groups.push(group);
      }
      group.tasks.push(task);
    }

    groups.sort((a, b) => {
      if (b.cycleNumber !== a.cycleNumber) return b.cycleNumber - a.cycleNumber;
      return a.projectName.localeCompare(b.projectName);
    });

    return groups;
  }, [filteredTasks, groupByCycle]);

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'acute': return <Badge className="bg-red-500/10 text-red-500 border-red-500/20 shadow-none">{t('task.priority.acute')}</Badge>;
      case 'high': return <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20 shadow-none">{t('task.priority.high')}</Badge>;
      case 'medium': return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 shadow-none">{t('task.priority.medium')}</Badge>;
      case 'low': return <Badge className="bg-zinc-500/10 text-muted-foreground border-zinc-500/20 shadow-none">{t('task.priority.low')}</Badge>;
      default: return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'todo': return <Badge variant="outline" className="text-muted-foreground border-border">Offen</Badge>;
      case 'in_progress': return <Badge variant="outline" className="text-indigo-400 border-indigo-500/30 bg-indigo-500/10">In Arbeit</Badge>;
      case 'review': return <Badge variant="outline" className="text-purple-400 border-purple-500/30 bg-purple-500/10">Prüfung</Badge>;
      default: return null;
    }
  };

  const unassignedTasksInfo = useMemo(() => {
    const unassigned = tasks.filter(t => !t.assignees || t.assignees.length === 0);
    const clientNamesSet = new Set<string>();
    for (const task of unassigned) {
      if (task.project) {
        const clientName = projectClientMap[task.project];
        if (clientName) {
          clientNamesSet.add(clientName);
        }
      }
    }
    return {
      count: unassigned.length,
      clients: Array.from(clientNamesSet)
    };
  }, [tasks, projectClientMap]);

  const activeFilterCount = [
    statusFilter !== 'all',
    priorityFilter !== 'all',
    projectFilter !== 'all',
    assigneeFilter !== 'all',
    clientFilter !== 'all',
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setStatusFilter('all');
    setPriorityFilter('all');
    setProjectFilter('all');
    setAssigneeFilter('all');
    setClientFilter('all');
    setSearchQuery('');
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-8">

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
              <CheckSquare size={32} className="text-emerald-400" />
              Meine Aufgaben
            </h1>
            <p className="text-muted-foreground mt-1">Alle offenen Aufgaben über alle Projekte hinweg.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input
                placeholder="Aufgaben durchsuchen…"
                className="pl-10 bg-card border-border w-full md:w-[240px] lg:w-[300px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button
              onClick={() => setCreateDialogOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shrink-0"
            >
              <Plus size={16} />
              <span className="hidden sm:inline text-sm font-medium">Neue Aufgabe</span>
            </button>
            <div className="bg-card/50 p-1 rounded-xl flex items-center border border-border shrink-0">
              <button
                onClick={() => setViewMode('board')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'board' ? 'bg-muted text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                title="Board-Ansicht"
              >
                <KanbanSquare size={16} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-muted text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                title="Listen Ansicht"
              >
                <ListIcon size={16} />
              </button>
            </div>
            <Badge
              variant="outline"
              onClick={() => setGroupByCycle(!groupByCycle)}
              className={`py-1.5 px-3 flex items-center gap-2 cursor-pointer transition-colors shrink-0 ${groupByCycle
                ? 'bg-primary/10 border-primary/30 text-primary hover:bg-primary/20'
                : 'bg-card border-border text-muted-foreground hover:bg-muted'
                }`}
            >
              <Layers size={14} /> {t('task.group_by_cycle')}
            </Badge>
            {isAdmin && (
              <Badge
                variant="outline"
                onClick={() => setShowAllTasks(!showAllTasks)}
                className={`py-1.5 px-3 flex items-center gap-2 cursor-pointer transition-colors shrink-0 ${showAllTasks
                  ? 'bg-primary/10 border-primary/30 text-primary hover:bg-primary/20'
                  : 'bg-card border-border text-muted-foreground hover:bg-muted'
                  }`}
              >
                {showAllTasks ? <Building2 size={14} /> : <Users size={14} />}
                {showAllTasks ? 'Alle Aufgaben' : 'Meine Aufgaben'}
              </Badge>
            )}
            <Badge
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="bg-card border-border py-1.5 px-3 flex items-center gap-2 cursor-pointer hover:bg-muted transition-colors relative shrink-0"
            >
              <Filter size={14} /> Filter
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-indigo-500 text-[10px] font-bold text-white flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </Badge>
          </div>
        </div>

        {/* Active Filter Pills Bar */}
        {(activeFilterCount > 0 || !!searchQuery) && (
          <div className="flex flex-wrap items-center gap-2 pt-1 animate-in fade-in duration-200">
            <span className="text-xs text-muted-foreground font-medium mr-1">Aktive Filter:</span>
            
            {searchQuery && (
              <Badge variant="secondary" className="bg-card border border-border text-foreground px-2.5 py-1 flex items-center gap-1.5 text-xs font-medium">
                Suche: "{searchQuery}"
                <button onClick={() => setSearchQuery('')} className="text-muted-foreground hover:text-foreground">
                  <X size={12} />
                </button>
              </Badge>
            )}

            {statusFilter !== 'all' && (
              <Badge variant="secondary" className="bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 px-2.5 py-1 flex items-center gap-1.5 text-xs font-medium">
                Status: {{todo: 'Offen', in_progress: 'In Arbeit', review: 'Prüfung', done: 'Erledigt'}[statusFilter]}
                <button onClick={() => setStatusFilter('all')} className="text-indigo-400 hover:text-white">
                  <X size={12} />
                </button>
              </Badge>
            )}

            {priorityFilter !== 'all' && (
              <Badge variant="secondary" className="bg-orange-500/10 border border-orange-500/30 text-orange-400 px-2.5 py-1 flex items-center gap-1.5 text-xs font-medium">
                Priorität: {{acute: 'Akut', high: 'Hoch', medium: 'Mittel', low: 'Niedrig'}[priorityFilter]}
                <button onClick={() => setPriorityFilter('all')} className="text-orange-400 hover:text-white">
                  <X size={12} />
                </button>
              </Badge>
            )}

            {projectFilter !== 'all' && (
              <Badge variant="secondary" className="bg-teal-500/10 border border-teal-500/30 text-teal-400 px-2.5 py-1 flex items-center gap-1.5 text-xs font-medium">
                Projekt: {projects.find(p => p.id === projectFilter)?.key || 'Projekt'}
                <button onClick={() => setProjectFilter('all')} className="text-teal-400 hover:text-white">
                  <X size={12} />
                </button>
              </Badge>
            )}

            {assigneeFilter !== 'all' && (
              <Badge variant="secondary" className="bg-purple-500/10 border border-purple-500/30 text-purple-400 px-2.5 py-1 flex items-center gap-1.5 text-xs font-medium">
                Zuständig: {assigneeFilter === 'unassigned' ? 'Nicht zugewiesen' : users.find(u => u.id === assigneeFilter)?.name || 'User'}
                <button onClick={() => setAssigneeFilter('all')} className="text-purple-400 hover:text-white">
                  <X size={12} />
                </button>
              </Badge>
            )}

            {clientFilter !== 'all' && (
              <Badge variant="secondary" className="bg-blue-500/10 border border-blue-500/30 text-blue-400 px-2.5 py-1 flex items-center gap-1.5 text-xs font-medium">
                Kunde: {clients.find(c => c.id === clientFilter)?.name || 'Kunde'}
                <button onClick={() => setClientFilter('all')} className="text-blue-400 hover:text-white">
                  <X size={12} />
                </button>
              </Badge>
            )}

            <button
              onClick={clearAllFilters}
              className="text-xs text-muted-foreground hover:text-red-400 transition-colors underline ml-2 cursor-pointer"
            >
              Alle Filter zurücksetzen
            </button>
          </div>
        )}

        {showFilters && (
          <div className="flex flex-wrap gap-3 items-center p-4 rounded-xl border border-border bg-card/40">
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium block">Status</label>
              <Select value={statusFilter} onValueChange={(val) => val && setStatusFilter(val as TaskStatus | 'all')}>
                <SelectTrigger className="bg-background border-border h-9 min-w-[130px]">
                  <SelectValue>
                    {(value: string) => (
                      {all: 'Alle Status', todo: 'Offen', in_progress: 'In Arbeit', review: 'Prüfung', done: 'Erledigt'}[value] || value
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-background border-border text-foreground">
                  <SelectItem value="all">Alle Status</SelectItem>
                  <SelectItem value="todo">Offen</SelectItem>
                  <SelectItem value="in_progress">In Arbeit</SelectItem>
                  <SelectItem value="review">Prüfung</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium block">Priorität</label>
              <Select value={priorityFilter} onValueChange={(val) => val && setPriorityFilter(val as TaskPriority | 'all')}>
                <SelectTrigger className="bg-background border-border h-9 min-w-[130px]">
                  <SelectValue placeholder="Priorität wählen">
                    {(value: string) => {
                      const labels: Record<string, string> = {
                        acute: 'Akut',
                        high: 'Hoch',
                        medium: 'Mittel',
                        low: 'Niedrig',
                      };
                      return labels[value] || 'Alle';
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-background border-border text-foreground">
                  <SelectItem value="all">Alle Prioritäten</SelectItem>
                  <SelectItem value="acute" className="text-red-400">Akut</SelectItem>
                  <SelectItem value="high" className="text-orange-400">Hoch</SelectItem>
                  <SelectItem value="medium">Mittel</SelectItem>
                  <SelectItem value="low">Niedrig</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium block">Projekt</label>
              <Select value={projectFilter} onValueChange={(val) => val && setProjectFilter(val)}>
                <SelectTrigger className="bg-background border-border h-9 min-w-[150px]">
                  <SelectValue>
                    {(value: string) => {
                      if (value === 'all') return 'Alle Projekte';
                      const project = visibleProjects.find(p => p.id === value);
                      return project ? `${project.key} — ${project.name}` : value;
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-background border-border text-foreground">
                  <SelectItem value="all">Alle Projekte</SelectItem>
                  {visibleProjects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.key} — {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium block">Zuständig</label>
              <Select value={assigneeFilter} onValueChange={(val) => val && setAssigneeFilter(val)}>
                <SelectTrigger className="bg-background border-border h-9 min-w-[150px]">
                  <SelectValue placeholder="Alle">
                    {(value: string) => {
                      if (value === 'all') return 'Alle';
                      if (value === 'unassigned') return 'Nicht zugewiesen';
                      const user = users.find(u => u.id === value);
                      return user?.name || user?.email || value;
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-background border-border text-foreground">
                  <SelectItem value="all">Alle</SelectItem>
                  <SelectItem value="unassigned">Nicht zugewiesen</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name || u.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium block">Kunde</label>
              <Select value={clientFilter} onValueChange={(val) => val && setClientFilter(val)}>
                <SelectTrigger className="bg-background border-border h-9 min-w-[150px]">
                  <SelectValue placeholder="Alle Kunden">
                    {(value: string) => {
                      if (value === 'all') return 'Alle Kunden';
                      const client = clients.find(c => c.id === value);
                      return client?.name || value;
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-background border-border text-foreground">
                  <SelectItem value="all">Alle Kunden</SelectItem>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {activeFilterCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="self-end p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/50"
                title="Filter zurücksetzen"
              >
                <X size={16} />
              </button>
            )}
          </div>
        )}

        {unassignedTasksInfo.count > 0 && assigneeFilter !== 'unassigned' && (
          <div className="flex items-center justify-between gap-3 p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-500 text-sm animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
              <span>
                <strong>{unassignedTasksInfo.count} Aufgabe{unassignedTasksInfo.count === 1 ? '' : 'n'}</strong> {unassignedTasksInfo.count === 1 ? 'ist' : 'sind'} noch keinem Teammitglied zugewiesen{unassignedTasksInfo.clients.length > 0 && ` (Kunde${unassignedTasksInfo.clients.length === 1 ? '' : 'n'}: ${unassignedTasksInfo.clients.join(', ')})`}.
              </span>
            </div>
            <button
              onClick={() => {
                setAssigneeFilter('unassigned');
                setShowFilters(true);
              }}
              className="text-xs font-semibold underline hover:text-amber-400 transition-colors shrink-0"
            >
              Filter anwenden
            </button>
          </div>
        )}

        {isLoading ? (
          <Card className="border-border bg-card/30">
            <CardContent className="p-0">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="p-4 border-b border-border/50 flex items-center gap-4">
                  <Skeleton className="h-4 w-1/4 bg-muted" />
                  <Skeleton className="h-4 w-1/6 bg-muted" />
                  <Skeleton className="h-4 w-1/6 bg-muted" />
                  <Skeleton className="h-4 w-full bg-muted" />
                </div>
              ))}
            </CardContent>
          </Card>
        ) : filteredTasks.length === 0 ? (
          <Card className="border-dashed border-border bg-card/20">
            <CardContent className="p-16 flex flex-col items-center justify-center text-center">
              <CheckSquare size={48} className="text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold text-foreground">Keine Aufgaben gefunden</h3>
              <p className="text-muted-foreground text-sm mt-2 max-w-md">
                Es wurden keine offenen Aufgaben gefunden, die deiner Suche entsprechen.
              </p>
              {activeFilterCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="mt-4 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Filter zurücksetzen
                </button>
              )}
            </CardContent>
          </Card>
        ) : viewMode === 'board' ? (
          <KanbanBoard
            initialTasks={filteredTasks}
            clientMap={projectClientMap}
            onTaskUpdated={() => setRefreshTrigger(prev => prev + 1)}
            onTaskClick={(id) => setSelectedTaskId(id)}
            onAddTask={() => setCreateDialogOpen(true)}
          />
        ) : groupByCycle && cycleGroupedTasks ? (
          <div className="space-y-6">
            {cycleGroupedTasks.map((group) => (
              <div key={group.projectId} className="rounded-2xl border border-border bg-card/30 overflow-hidden">
                <div className="px-6 py-3 border-b border-border bg-card/50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Layers size={16} className="text-teal-500" />
                    <span className="font-semibold text-foreground">{group.projectName}</span>
                    <Badge variant="outline" className="bg-background border-border text-muted-foreground font-mono text-[10px]">
                      {group.projectKey}
                    </Badge>
                    {projectClientMap[group.projectId] && (
                      <span className="text-xs text-muted-foreground/60">{projectClientMap[group.projectId]}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-primary/10 text-primary border-primary/20 shadow-none">
                      Zyklus #{group.cycleNumber}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{group.tasks.length} Aufgabe{group.tasks.length !== 1 ? 'n' : ''}</span>
                  </div>
                </div>
                <Table>
                  <TableHeader className="bg-card/50">
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-muted-foreground font-medium">Aufgabe</TableHead>
                      <TableHead className="text-muted-foreground font-medium">Status</TableHead>
                      <TableHead className="text-muted-foreground font-medium">Priorität</TableHead>
                      <TableHead className="text-muted-foreground font-medium text-right">Zuständig</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.tasks.map((task) => (
                      <TableRow
                        key={task.id}
                        className="border-border/50 hover:bg-white/[0.02] cursor-pointer transition-colors group"
                        onClick={() => setSelectedTaskId(task.id)}
                      >
                        <TableCell className="font-medium text-foreground py-4">{task.title}</TableCell>
                        <TableCell>{getStatusBadge(task.status)}</TableCell>
                        <TableCell>{getPriorityBadge(task.priority)}</TableCell>
                        <TableCell className="text-right">
                          <span className="text-xs text-muted-foreground font-medium">
                            {Array.isArray(task.expand?.assignees) ? task.expand.assignees.map((a, i) => (
                              <span key={a.id}>
                                {i > 0 && ', '}
                                {a.name || a.email}
                              </span>
                            )) : (task.expand?.assignees ? (
                              <span>{(task.expand.assignees as any).name || (task.expand.assignees as any).email}</span>
                            ) : <span className="text-muted-foreground">Unzugewiesen</span>)}
                          </span>
                        </TableCell>
                        <TableCell className="py-4 pl-0">
                          <TaskContextMenu task={task} onViewDetails={(id) => setSelectedTaskId(id)} onUpdated={() => setRefreshTrigger(prev => prev + 1)} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card/30 overflow-hidden">
            <Table>
              <TableHeader className="bg-card/50">
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground font-medium">Projekt</TableHead>
                  <TableHead className="text-muted-foreground font-medium">Aufgabe</TableHead>
                  <TableHead className="text-muted-foreground font-medium">Status</TableHead>
                  <TableHead className="text-muted-foreground font-medium">Priorität</TableHead>
                  <TableHead className="text-muted-foreground font-medium text-right">Zuständig</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTasks.map((task) => (
                  <TableRow
                    key={task.id}
                    className="border-border/50 hover:bg-white/[0.02] cursor-pointer transition-colors group"
                    onClick={() => setSelectedTaskId(task.id)}
                  >
                    <TableCell className="py-4">
                      <Badge variant="outline" className="bg-background border-border text-muted-foreground font-mono text-[10px]">
                        {task.expand?.project?.key}
                      </Badge>
                      <span className="ml-2 text-muted-foreground text-sm">{task.expand?.project?.name}</span>
                      {task.project && projectClientMap[task.project] && (
                        <span className="ml-2 text-[11px] text-muted-foreground/60">{projectClientMap[task.project]}</span>
                      )}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">{task.title}</TableCell>
                    <TableCell>{getStatusBadge(task.status)}</TableCell>
                    <TableCell>{getPriorityBadge(task.priority)}</TableCell>
                    <TableCell className="text-right">
                      <span className="text-xs text-muted-foreground font-medium">
                        {Array.isArray(task.expand?.assignees) ? task.expand.assignees.map((a, i) => (
                          <span key={a.id}>
                            {i > 0 && ', '}
                            {a.name || a.email}
                          </span>
                        )) : (task.expand?.assignees ? (
                          <span>{(task.expand.assignees as any).name || (task.expand.assignees as any).email}</span>
                        ) : <span className="text-muted-foreground">Unzugewiesen</span>)}
                      </span>
                    </TableCell>
                    <TableCell className="py-4 pl-0">
                      <TaskContextMenu task={task} onViewDetails={(id) => setSelectedTaskId(id)} onUpdated={() => setRefreshTrigger(prev => prev + 1)} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <TaskDetailsSheet
        taskId={selectedTaskId}
        projectKey={tasks.find(t => t.id === selectedTaskId)?.expand?.project?.key || '—'}
        onClose={() => setSelectedTaskId(null)}
        onTaskUpdated={() => setRefreshTrigger(prev => prev + 1)}
      />
      <NewSimpleTaskDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onTaskCreated={() => setRefreshTrigger(r => r + 1)}
      />
    </div>
  );
}
