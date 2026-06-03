'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  CheckSquare,
  Clock,
  ChevronRight,
  Calendar,
  ListTodo,
  Hourglass,
} from 'lucide-react';
import { TaskDetailsDialog } from '@/components/tasks/TaskDetailsDialog';
import { DashboardGreeting } from '@/components/dashboard/DashboardGreeting';
import { pb } from '@/lib/pocketbase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import type {
  TaskRecord,
  ProjectRecord,
  UserRecord,
} from '@/lib/pocketbase-types';

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

interface MyTask extends TaskRecord {
  expand?: {
    project?: ProjectRecord;
    assignees?: UserRecord[];
  };
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
  return now.toISOString().split('T')[0];
}

function getPriorityBadge(priority: string) {
  switch (priority) {
    case 'acute':
      return (
        <Badge className="bg-red-500/10 text-red-500 border-red-500/20 shadow-none text-[10px]">
          Akut
        </Badge>
      );
    case 'high':
      return (
        <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20 shadow-none text-[10px]">
          Hoch
        </Badge>
      );
    case 'medium':
      return (
        <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 shadow-none text-[10px]">
          Mittel
        </Badge>
      );
    case 'low':
      return (
        <Badge className="bg-zinc-500/10 text-muted-foreground border-zinc-500/20 shadow-none text-[10px]">
          Niedrig
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

// ──────────────────────────────────────────────
// Main Dashboard Page
// ──────────────────────────────────────────────

export default function DashboardPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [myTasks, setMyTasks] = useState<MyTask[]>([]);
  const [myTasksLoading, setMyTasksLoading] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const [todayMinutes, setTodayMinutes] = useState(0);
  const [todayHoursLoading, setTodayHoursLoading] = useState(true);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const user = pb.authStore.record;
    if (user?.id) {
      setCurrentUserId(user.id);
    }
  }, []);

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

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        <DashboardGreeting />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="border-border bg-card/40 lg:col-span-2">
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
                    <button
                      key={task.id}
                      onClick={() => setSelectedTaskId(task.id)}
                      className="w-full flex items-start gap-3 px-4 py-3 hover:bg-muted/20 transition-colors text-left group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {task.expand?.project && (
                            <Link href={`/projects/${task.expand.project.id}`}>
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
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

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
                <Skeleton className="h-20 w-full bg-muted" />
              ) : (
                <div className="flex items-center gap-4 py-2">
                  <div className="p-3 rounded-2xl bg-background border border-border">
                    <Clock size={28} className="text-orange-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {new Date().toLocaleDateString('de-DE', {
                        weekday: 'long',
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                    <h3 className="text-3xl font-bold text-foreground tabular-nums mt-1">
                      {formatHoursMinutes(todayMinutes)}
                    </h3>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

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
