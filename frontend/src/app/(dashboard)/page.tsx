'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  FolderGit2,
  CheckSquare,
  Clock,
  TrendingUp,
  AlertTriangle,
  Link2,
  X,
  ChevronRight,
  Calendar,
  User,
  ListTodo,
  Hourglass,
  LayoutDashboard,
  UserPlus,
  Send,
  Users,
  Loader2,
} from 'lucide-react';
import { ProjectList } from '@/components/projects/ProjectList';
import { NewProjectDialog } from '@/components/projects/NewProjectDialog';
import { TaskDetailsDialog } from '@/components/tasks/TaskDetailsDialog';
import { DashboardReportWidget } from '@/components/dashboard/ReportWidget';
import { DashboardGreeting } from '@/components/dashboard/DashboardGreeting';
import { pb } from '@/lib/pocketbase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { t } from '@/lib/i18n';
import { isCraftMode } from '@/config/app-mode';
import type {
  TaskRecord,
  TaskLinkRecord,
  ProjectRecord,
  TimeEntryRecord,
  UserRecord,
} from '@/lib/pocketbase-types';

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

interface DashboardStats {
  projects: number;
  tasks: number;
  hours: number;
}

interface MyTask extends TaskRecord {
  expand?: {
    project?: ProjectRecord;
    assignees?: UserRecord[];
  };
}

interface TaskLinkWithExpand extends TaskLinkRecord {
  expand?: {
    source_task?: TaskRecord & { expand?: { project?: ProjectRecord } };
    target_task?: TaskRecord & { expand?: { project?: ProjectRecord } };
  };
}

interface ProjectAlert {
  projectId: string;
  projectName: string;
  projectKey: string;
  budgetHours: number;
  loggedHours: number;
  remainingHours: number;
  percentLogged: number;
  isAtRisk: boolean;
}

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

function formatHoursMinutes(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = Math.round(totalMinutes % 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function getTodayDateString(): string {
  const now = new Date();
  // Format as YYYY-MM-DD for PocketBase date filtering
  return now.toISOString().split('T')[0];
}

function getPriorityBadge(priority: string) {
  switch (priority) {
    case 'acute':
      return (
        <Badge className="bg-red-500/10 text-red-500 border-red-500/20 shadow-none text-[10px]">
          {t('task.priority.acute')}
        </Badge>
      );
    case 'high':
      return (
        <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20 shadow-none text-[10px]">
          {t('task.priority.high')}
        </Badge>
      );
    case 'medium':
      return (
        <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 shadow-none text-[10px]">
          {t('task.priority.medium')}
        </Badge>
      );
    case 'low':
      return (
        <Badge className="bg-zinc-500/10 text-muted-foreground border-zinc-500/20 shadow-none text-[10px]">
          {t('task.priority.low')}
        </Badge>
      );
    default:
      return null;
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'todo':
      return (
        <Badge
          variant="outline"
          className="text-muted-foreground border-border text-[10px]"
        >
          Offen
        </Badge>
      );
    case 'in_progress':
      return (
        <Badge
          variant="outline"
          className="text-indigo-400 border-indigo-500/30 bg-indigo-500/10 text-[10px]"
        >
          In Arbeit
        </Badge>
      );
    case 'review':
      return (
        <Badge
          variant="outline"
          className="text-primary/80 border-primary/30 bg-primary/10 text-[10px]"
        >
          Prüfung
        </Badge>
      );
    case 'done':
      return (
        <Badge
          variant="outline"
          className="text-emerald-400 border-emerald-500/30 bg-emerald-500/10 text-[10px]"
        >
          Erledigt
        </Badge>
      );
    default:
      return null;
  }
}

function getLinkTypeLabel(type: string): string {
  switch (type) {
    case 'depends_on':
      return 'hängt ab von';
    case 'blocks':
      return 'blockiert';
    case 'relates_to':
      return 'verknüpft mit';
    case 'duplicate_of':
      return 'Duplikat von';
    default:
      return type;
  }
}

function getLinkTypeColor(type: string): string {
  switch (type) {
    case 'depends_on':
      return 'text-amber-400 border-amber-500/20 bg-amber-500/10';
    case 'blocks':
      return 'text-red-400 border-red-500/20 bg-red-500/10';
    case 'relates_to':
      return 'text-blue-400 border-blue-500/20 bg-blue-500/10';
    case 'duplicate_of':
      return 'text-purple-400 border-purple-500/20 bg-purple-500/10';
    default:
      return 'text-muted-foreground border-zinc-500/20 bg-zinc-500/10';
  }
}

// ──────────────────────────────────────────────
// Main Dashboard Page
// ──────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [stats, setStats] = useState<DashboardStats>({
    projects: 0,
    tasks: 0,
    hours: 0,
  });

  // A1: My Tasks
  const [myTasks, setMyTasks] = useState<MyTask[]>([]);
  const [myTasksLoading, setMyTasksLoading] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // A2: Today's hours
  const [todayMinutes, setTodayMinutes] = useState(0);
  const [todayHoursLoading, setTodayHoursLoading] = useState(true);

  // A3: Task links
  const [myLinks, setMyLinks] = useState<TaskLinkWithExpand[]>([]);
  const [linksLoading, setLinksLoading] = useState(true);

  // A4: Project alerts
  const [projectAlerts, setProjectAlerts] = useState<ProjectAlert[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(true);

  // Current user
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    if (isCraftMode()) {
      router.replace('/craft');
      return;
    }
    if (pb.authStore.isValid && pb.authStore.record) {
      setCurrentUserId(pb.authStore.record.id);
    }
  }, [router]);

  // A5: Unassigned tasks widget
  const [unassignedTasks, setUnassignedTasks] = useState<MyTask[]>([]);
  const [unassignedLoading, setUnassignedLoading] = useState(true);
  const [allUsers, setAllUsers] = useState<UserRecord[]>([]);
  const [assigneeSelections, setAssigneeSelections] = useState<Record<string, string>>({});
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);



  // ── Stats (existing) ──
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const projects = await pb.collection('projects').getList(1, 50);
        const tasks = await pb.collection('tasks').getList(1, 50, {
          filter: 'status != "done"',
        });
        const timeEntries = await pb.collection('time_entries').getList(1, 200);
        const totalMinutes = timeEntries.items.reduce(
          (sum, entry) => sum + (entry.duration_minutes || 0),
          0,
        );

        setStats({
          projects: projects.totalItems,
          tasks: tasks.totalItems,
          hours: Math.round(totalMinutes / 60),
        });
      } catch (error) {
        console.error(error);
      }
    };
    fetchStats();
  }, [refreshTrigger]);

  // Listen for project-updated custom event
  useEffect(() => {
    const handleProjectUpdated = () => setRefreshTrigger((prev) => prev + 1);
    window.addEventListener('project-updated', handleProjectUpdated);
    return () =>
      window.removeEventListener('project-updated', handleProjectUpdated);
  }, []);

  const handleProjectCreated = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  // ── A1: Fetch my tasks ──
  const fetchMyTasks = useCallback(async () => {
    if (!currentUserId) return;
    setMyTasksLoading(true);
    try {
      const result = await pb.collection('tasks').getList(1, 10, {
        filter: pb.filter('assignees ~ {:uid} && status != "done"', { uid: currentUserId }),
        sort: 'due_date,created',
        expand: 'project.client,assignees',
      });
      setMyTasks(result.items as MyTask[]);
    } catch (error) {
      console.error('Failed to fetch my tasks:', error);
    } finally {
      setMyTasksLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    if (currentUserId) {
      fetchMyTasks();
    }
  }, [currentUserId, fetchMyTasks, refreshTrigger]);

  // ── A2: Fetch today's hours ──
  const fetchTodayHours = useCallback(async () => {
    if (!currentUserId) return;
    setTodayHoursLoading(true);
    try {
      const today = getTodayDateString();
      const startOfDay = `${today} 00:00:00.000Z`;
      const endOfDay = `${today} 23:59:59.999Z`;
      const result = await pb.collection('time_entries').getList(1, 200, {
        filter: pb.filter(
          'user = {:uid} && start_time >= {:start} && start_time <= {:end}',
          { uid: currentUserId, start: startOfDay, end: endOfDay }
        ),
      });
      const total = result.items.reduce(
        (sum, entry) => sum + (entry.duration_minutes || 0),
        0,
      );
      setTodayMinutes(total);
    } catch (error) {
      console.error('Failed to fetch today hours:', error);
    } finally {
      setTodayHoursLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    if (currentUserId) {
      fetchTodayHours();
    }
  }, [currentUserId, fetchTodayHours, refreshTrigger]);

  // ── A3: Fetch my task links ──
  const fetchMyLinks = useCallback(async () => {
    if (!currentUserId) return;
    setLinksLoading(true);
    try {
      // Get tasks where current user is assignee
      const myTasksResult = await pb.collection('tasks').getList(1, 100, {
        filter: pb.filter('assignees ~ {:uid}', { uid: currentUserId }),
        fields: 'id',
      });
      const myTaskIds = myTasksResult.items.map((t: any) => t.id);

      if (myTaskIds.length === 0) {
        setMyLinks([]);
        setLinksLoading(false);
        return;
      }

      // Build filter: source_task is one of my tasks
      const filterParts = myTaskIds.map((id: string) => pb.filter('source_task = {:id}', { id }));
      const filter = filterParts.join(' || ');

      const result = await pb.collection('task_links').getList(1, 50, {
        filter,
        sort: '-created',
        expand: 'source_task,source_task.project,target_task,target_task.project',
      });
      setMyLinks(result.items as TaskLinkWithExpand[]);
    } catch (error) {
      console.error('Failed to fetch task links:', error);
    } finally {
      setLinksLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    if (currentUserId) {
      fetchMyLinks();
    }
  }, [currentUserId, fetchMyLinks, refreshTrigger]);

  // ── A3: Acknowledge (delete) a link ──
  const handleAcknowledgeLink = async (linkId: string) => {
    try {
      await pb.collection('task_links').delete(linkId);
      setMyLinks((prev) => prev.filter((l) => l.id !== linkId));
      toast.success('Verknüpfung als erledigt markiert');
    } catch (error) {
      console.error('Failed to delete link:', error);
      toast.error('Fehler beim Entfernen der Verknüpfung');
    }
  };

  // ── A4: Fetch project alerts ──
  const fetchProjectAlerts = useCallback(async () => {
    setAlertsLoading(true);
    try {
      // Get active projects
      const projectsResult = await pb.collection('projects').getList(1, 50, {
        filter: 'status = "active"',
      });
      const projects = projectsResult.items as ProjectRecord[];
      const projectIds = projects.map((p) => p.id);

      if (projectIds.length === 0) {
        setProjectAlerts([]);
        return;
      }

      // Batch: fetch ALL tasks for ALL active projects in ONE request
      const tasksFilterParts = projectIds.map((id: string) =>
        pb.filter('project = {:id}', { id }),
      );
      const allTasksResult = await pb.collection('tasks').getList(1, 10000, {
        filter: tasksFilterParts.join(' || '),
        fields: 'id,estimated_hours,project',
      });

      // Group tasks by project
      const tasksByProject: Record<string, { id: string; estimated_hours: number }[]> = {};
      for (const t of allTasksResult.items) {
        const pid = (t as any).project as string;
        if (!tasksByProject[pid]) tasksByProject[pid] = [];
        tasksByProject[pid].push({ id: t.id, estimated_hours: (t as any).estimated_hours || 0 });
      }

      // Collect all task IDs
      const allTaskIds = allTasksResult.items.map((t: any) => t.id);

      // For time entries, we need task → time mapping
      let timeByTask: Record<string, number> = {};
      if (allTaskIds.length > 0) {
        const teFilterParts = allTaskIds.map((id: string) =>
          pb.filter('task = {:id}', { id }),
        );
        const allTEResult = await pb.collection('time_entries').getList(1, 10000, {
          filter: teFilterParts.join(' || '),
          fields: 'duration_minutes,task',
        });
        for (const te of allTEResult.items) {
          const tid = (te as any).task as string;
          timeByTask[tid] = (timeByTask[tid] || 0) + ((te as any).duration_minutes || 0);
        }
      }

      const alerts: ProjectAlert[] = [];

      for (const project of projects) {
        const projectTasks = tasksByProject[project.id] || [];

        const budgetHours = projectTasks.reduce(
          (sum, t) => sum + t.estimated_hours,
          0,
        );

        if (budgetHours <= 0) continue;

        const loggedMinutes = projectTasks.reduce(
          (sum, t) => sum + (timeByTask[t.id] || 0),
          0,
        );
        const loggedHours = loggedMinutes / 60;

        const percentLogged = (loggedHours / budgetHours) * 100;

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          0,
        );
        const daysInMonth = endOfMonth.getDate();
        const daysPassed = Math.ceil(
          (now.getTime() - startOfMonth.getTime()) / (1000 * 60 * 60 * 24),
        );
        const percentTimePassed = (daysPassed / daysInMonth) * 100;

        const remainingHours = budgetHours - loggedHours;
        const isAtRisk = percentLogged < 50 && percentTimePassed > 50;

        alerts.push({
          projectId: project.id,
          projectName: project.name,
          projectKey: project.key,
          budgetHours,
          loggedHours: Math.round(loggedHours * 100) / 100,
          remainingHours: Math.round(remainingHours * 100) / 100,
          percentLogged: Math.round(percentLogged * 10) / 10,
          isAtRisk,
        });
      }

      setProjectAlerts(alerts);
    } catch (error) {
      console.error('Failed to fetch project alerts:', error);
    } finally {
      setAlertsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjectAlerts();
  }, [fetchProjectAlerts, refreshTrigger]);

  // ── A5: Fetch unassigned tasks ──
  const fetchUnassignedTasks = useCallback(async () => {
    setUnassignedLoading(true);
    try {
      const result = await pb.collection('tasks').getList(1, 50, {
        filter: 'status != "done"',
        sort: '-created',
        expand: 'project.client,assignees',
      });
      const tasks = result.items as MyTask[];
      const unassigned = tasks.filter(t => !t.assignees || t.assignees.length === 0);
      setUnassignedTasks(unassigned);
    } catch (error) {
      console.error('Failed to fetch unassigned tasks:', error);
    } finally {
      setUnassignedLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const result = await pb.collection('users').getList(1, 50, { sort: 'name' });
      setAllUsers(result.items as UserRecord[]);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  }, []);

  useEffect(() => {
    fetchUnassignedTasks();
    fetchUsers();
  }, [fetchUnassignedTasks, fetchUsers, refreshTrigger]);

  const handleAssignConfirm = async () => {
    if (Object.keys(assigneeSelections).length === 0) return;
    setIsAssigning(true);
    try {
      const updates = Object.entries(assigneeSelections).map(async ([taskId, userId]) => {
        const task = unassignedTasks.find(t => t.id === taskId);
        await pb.collection('tasks').update(taskId, {
          assignees: [userId],
        });
        if (task) {
          await pb.collection('notifications').create({
            user: userId,
            type: 'task_assigned',
            task: taskId,
            message: `Dir wurde die Aufgabe "${task.title}" zugewiesen.`,
          });
        }
      });
      await Promise.all(updates);
      toast.success(`${Object.keys(assigneeSelections).length} Aufgabe(n) zugewiesen!`);
      setAssigneeSelections({});
      setShowConfirmDialog(false);
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Failed to assign tasks:', error);
      toast.error('Fehler beim Zuweisen der Aufgaben.');
    } finally {
      setIsAssigning(false);
    }
  };

  // ── Render ──
  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* ── Dashboard Greeting ── */}
        <DashboardGreeting />

        {/* ── KPI Section ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard icon={FolderGit2} label="Projekte" value={stats.projects} />
          <MetricCard icon={CheckSquare} label="Offene Aufgaben" value={stats.tasks} href="/tasks" />
          <MetricCard icon={Clock} label="Stunden erfasst" value={stats.hours} href="/team" />
          <MetricCard icon={LayoutDashboard} label="Heute" value={formatHoursMinutes(todayMinutes)} />
        </div>

        {/* ── Widgets Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ── A1: Eigene Aufgaben-Widget ── */}
          <Card className="border-border bg-card/40">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div className="flex items-center gap-2">
                <ListTodo size={18} className="text-indigo-400" />
                <CardTitle className="text-foreground text-base font-semibold">
                  Meine Aufgaben
                </CardTitle>
              </div>
              <Link
                href="/tasks"
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
              >
                Alle anzeigen
                <ChevronRight size={14} />
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {myTasksLoading ? (
                <div className="px-4 pb-4 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full bg-muted" />
                  ))}
                </div>
              ) : myTasks.length === 0 ? (
                <div className="px-4 pb-4 flex flex-col items-center justify-center py-8 text-center">
                  <CheckSquare
                    size={32}
                    className="text-muted-foreground/30 mb-2"
                  />
                  <p className="text-sm text-muted-foreground">
                    Keine offenen Aufgaben
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {myTasks.map((task) => (
                    <div
                      key={task.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedTaskId(task.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          if ((e.target as HTMLElement).tagName !== 'A') {
                            e.preventDefault();
                            setSelectedTaskId(task.id);
                          }
                        }
                      }}
                      className="w-full flex items-start gap-3 px-4 py-3 hover:bg-muted/20 transition-colors text-left group cursor-pointer"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {task.expand?.project && (
                            <Link
                              href={`/projects/${task.expand.project.id}`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Badge
                                variant="outline"
                                className="bg-background border-border text-muted-foreground font-mono text-[10px] hover:border-indigo-500/50 hover:text-indigo-300 transition-colors cursor-pointer"
                              >
                                {task.expand.project.key}
                              </Badge>
                            </Link>
                          )}
                          {task.expand?.project?.expand?.client && (
                            <Badge
                              variant="outline"
                              className="bg-background border-border text-indigo-400 font-sans text-[10px]"
                            >
                              {task.expand.project.expand.client.name}
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar size={10} />
                            {task.due_date
                              ? new Date(task.due_date).toLocaleDateString(
                                'de-DE',
                                {
                                  day: '2-digit',
                                  month: '2-digit',
                                },
                              )
                              : 'Kein Datum'}
                          </span>
                        </div>
                        <p className="text-sm text-foreground font-medium truncate group-hover:text-foreground transition-colors">
                          {task.title}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
                        {getPriorityBadge(task.priority)}
                        {getStatusBadge(task.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── A2: Stundenübersicht heute ── */}
          <Card className="border-border bg-card/40">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div className="flex items-center gap-2">
                <Hourglass size={18} className="text-orange-400" />
                <CardTitle className="text-foreground text-base font-semibold">
                  Heutige Zeiterfassung
                </CardTitle>
              </div>
              <Link
                href="/time"
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
              >
                Details
                <ChevronRight size={14} />
              </Link>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              {todayHoursLoading ? (
                <Skeleton className="h-16 w-full bg-muted" />
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 py-2">
                    <div className="p-3 rounded-2xl bg-background border border-border">
                      <Clock size={28} className="text-orange-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        {new Date().toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                      </p>
                      <h3 className="text-3xl font-bold text-foreground tabular-nums mt-1">
                        {formatHoursMinutes(todayMinutes)}
                      </h3>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── A3: Verlinkungen-Übersicht zum Abhaken ── */}
          <div className="hidden lg:block">
          <Card className="border-border bg-card/40">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div className="flex items-center gap-2">
                <Link2 size={18} className="text-blue-400" />
                <CardTitle className="text-foreground text-base font-semibold">
                  Aufgaben-Verknüpfungen
                </CardTitle>
              </div>
              {myLinks.length > 0 && (
                <Badge
                  variant="outline"
                  className="bg-background border-border text-muted-foreground"
                >
                  {myLinks.length} offen
                </Badge>
              )}
            </CardHeader>
            <CardContent className="p-0">
              {linksLoading ? (
                <div className="px-4 pb-4 space-y-3">
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-14 w-full bg-muted" />
                  ))}
                </div>
              ) : myLinks.length === 0 ? (
                <div className="px-4 pb-4 flex flex-col items-center justify-center py-8 text-center">
                  <Link2 size={32} className="text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Keine offenen Verknüpfungen
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {myLinks.slice(0, 5).map((link) => {
                    const sourceTask = link.expand?.source_task;
                    const targetTask = link.expand?.target_task;
                    return (
                      <div
                        key={link.id}
                        className="flex items-start gap-3 px-4 py-3 hover:bg-muted/20 transition-colors group"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge
                              variant="outline"
                              className={`text-[10px] uppercase tracking-wider font-mono ${getLinkTypeColor(link.link_type)}`}
                            >
                              {getLinkTypeLabel(link.link_type)}
                            </Badge>
                          </div>
                          <p className="text-sm text-foreground truncate">
                            {sourceTask?.title || 'Unbekannte Aufgabe'}
                          </p>
                          {targetTask && (
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              → {targetTask.title}
                            </p>
                          )}
                        </div>
                        <Button
                          onClick={() => handleAcknowledgeLink(link.id)}
                          size="xs"
                          variant="outline"
                          className="border-border text-muted-foreground hover:text-emerald-400 hover:border-emerald-500/30 flex-shrink-0 mt-1"
                        >
                          <X size={12} className="mr-1" />
                          Abgehakt
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
          </div>

          {/* ── A4: Projekt-Stunden-Warnung ── */}
          <Card className="border-border bg-card/40">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className="text-amber-400" />
                <CardTitle className="text-foreground text-base font-semibold">
                  Projekt-Stunden-Warnung
                </CardTitle>
              </div>
              {projectAlerts.filter((a) => a.isAtRisk).length > 0 && (
                <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-none">
                  {projectAlerts.filter((a) => a.isAtRisk).length} kritisch
                </Badge>
              )}
            </CardHeader>
            <CardContent className="p-0">
              {alertsLoading ? (
                <div className="px-4 pb-4 space-y-3">
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-14 w-full bg-muted" />
                  ))}
                </div>
              ) : projectAlerts.length === 0 ? (
                <div className="px-4 pb-4 flex flex-col items-center justify-center py-8 text-center">
                  <TrendingUp
                    size={32}
                    className="text-muted-foreground/30 mb-2"
                  />
                  <p className="text-sm text-muted-foreground">
                    Keine Projekte mit Budgetvorgaben
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {projectAlerts.map((alert) => (
                    <Link
                      key={alert.projectId}
                      href={`/projects/${alert.projectId}`}
                      className={`block px-4 py-3 no-underline ${alert.isAtRisk
                        ? 'bg-red-500/5 border-l-2 border-l-red-500'
                        : ''
                        }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className="bg-background border-border text-muted-foreground font-mono text-[10px]"
                          >
                            {alert.projectKey}
                          </Badge>
                          <span className="text-sm font-medium text-foreground">
                            {alert.projectName}
                          </span>
                        </div>
                        {alert.isAtRisk && (
                          <AlertTriangle
                            size={14}
                            className="text-red-400 flex-shrink-0"
                          />
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">
                            {alert.loggedHours.toFixed(1)}h /{' '}
                            {alert.budgetHours}h
                          </span>
                          <span
                            className={
                              alert.isAtRisk
                                ? 'text-red-400 font-medium'
                                : 'text-muted-foreground'
                            }
                          >
                            {alert.percentLogged}%
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-background rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${alert.isAtRisk
                              ? 'bg-red-500'
                              : 'bg-indigo-500'
                              }`}
                            style={{ width: `${Math.min(alert.percentLogged, 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">
                            Rest: {alert.remainingHours.toFixed(1)}h
                          </span>
                          {alert.isAtRisk && (
                            <span className="text-red-400 text-[10px] font-medium">
                              {'>'}50% Zeit, {'<'}50% gebucht
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Report Generator Widget ── */}
        <DashboardReportWidget />

        {/* ── A5: Unassigned Tasks Widget ── */}
        <Card className="border-border bg-card/40">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <UserPlus size={18} className="text-amber-400" />
              <CardTitle className="text-foreground text-base font-semibold">
                Nicht zugewiesene Aufgaben
              </CardTitle>
            </div>
            {unassignedTasks.length > 0 && (
              <Badge variant="outline" className="bg-background border-border text-muted-foreground">
                {unassignedTasks.length} offen
              </Badge>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {unassignedLoading ? (
              <div className="px-4 pb-4 space-y-3">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-12 w-full bg-muted" />
                ))}
              </div>
            ) : unassignedTasks.length === 0 ? (
              <div className="px-4 pb-4 flex flex-col items-center justify-center py-8 text-center">
                <Users size={32} className="text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Alle Aufgaben sind zugewiesen
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {unassignedTasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        {task.expand?.project && (
                          <Badge variant="outline" className="bg-background border-border text-muted-foreground font-mono text-[10px]">
                            {task.expand.project.key}
                          </Badge>
                        )}
                        {task.expand?.project?.expand?.client && (
                          <Badge variant="outline" className="bg-background border-border text-indigo-400 font-sans text-[10px]">
                            {task.expand.project.expand.client.name}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-foreground font-medium truncate">{task.title}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Select
                        value={assigneeSelections[task.id] || ''}
                        onValueChange={(val) => { if (val) setAssigneeSelections(prev => ({ ...prev, [task.id]: val })); }}
                      >
                        <SelectTrigger className="bg-background border-border h-8 min-w-[140px] text-xs">
                          <SelectValue placeholder="Zuständigen wählen">
                            {(value: string) => {
                              const user = allUsers.find(u => u.id === value);
                              return user?.name || user?.email || 'Zuständigen wählen';
                            }}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="bg-background border-border text-foreground">
                          {allUsers.map((u) => (
                            <SelectItem key={u.id} value={u.id}>
                              {u.name || u.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {getPriorityBadge(task.priority)}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {unassignedTasks.length > 0 && (
              <div className="px-4 py-3 border-t border-border flex justify-end">
                <Button
                  onClick={() => {
                    if (Object.keys(assigneeSelections).length === 0) {
                      toast.error('Bitte wähle mindestens einen Zuständigen aus.');
                      return;
                    }
                    setShowConfirmDialog(true);
                  }}
                  className="bg-primary text-black shadow-lg shadow-teal-500/20 hover:bg-primary/90 text-sm"
                >
                  <Send size={14} className="mr-1" />
                  Zuweisen
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Confirmation Dialog */}
        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent className="sm:max-w-[500px] bg-background border-border text-foreground">
            <DialogHeader>
              <DialogTitle className="text-xl">Aufgaben zuweisen</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <p className="text-sm text-muted-foreground">
                Folgende Aufgaben werden zugewiesen:
              </p>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {Object.entries(assigneeSelections).map(([taskId, userId]) => {
                  const task = unassignedTasks.find(t => t.id === taskId);
                  const user = allUsers.find(u => u.id === userId);
                  return (
                    <div key={taskId} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card/50">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground truncate">{task?.title || taskId}</p>
                        <p className="text-xs text-muted-foreground">
                          → {user?.name || user?.email || userId}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowConfirmDialog(false)} className="border-border">
                Abbrechen
              </Button>
              <Button onClick={handleAssignConfirm} disabled={isAssigning} className="bg-primary text-black">
                {isAssigning ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Send size={14} className="mr-1" />
                )}
                Bestätigen
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Projects Section ── */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-3">
                <FolderGit2 size={24} className="text-indigo-400" />
                Aktive Projekte
              </h2>
              <p className="text-muted-foreground mt-1 text-sm">
                Wähle ein Projekt aus, um Aufgaben und Zeiterfassung zu verwalten.
              </p>
            </div>
            <NewProjectDialog onProjectCreated={handleProjectCreated} />
          </div>

          <ProjectList refreshTrigger={refreshTrigger} />
        </div>
      </div>

      {/* Task Details Dialog */}
      <TaskDetailsDialog
        taskId={selectedTaskId}
        projectKey={
          myTasks.find((t) => t.id === selectedTaskId)?.expand?.project?.key ||
          '—'
        }
        onClose={() => setSelectedTaskId(null)}
        onTaskUpdated={() => setRefreshTrigger((prev) => prev + 1)}
      />
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  href?: string;
}) {
  const content = (
    <div className="bg-card border border-border rounded-xl p-4 overflow-hidden">
      <p className="text-[11px] font-semibold text-caps text-muted-foreground truncate">{label}</p>
      <p className="text-[28px] font-bold text-foreground tabular-nums leading-tight mt-1">{value}</p>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
