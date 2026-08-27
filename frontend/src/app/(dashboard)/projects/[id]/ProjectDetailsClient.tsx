'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { pb } from '@/lib/pocketbase';
import { useRealtime } from '@/hooks/useRealtime';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock, Plus, CheckCircle2, Euro, KanbanSquare, List, BarChart3, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { format, isValid, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { NewTaskDialog } from '@/components/tasks/NewTaskDialog';
import { KanbanBoard } from '@/components/tasks/KanbanBoard';
import { TaskDetailsDialog } from '@/components/tasks/TaskDetailsDialog';
import { GanttView } from '@/components/planner/GanttView';
import { useProjectGanttData } from '@/hooks/useProjectGanttData';
import { ExternalExpensesDialog } from '@/components/projects/ExternalExpensesDialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { useSettingsStore } from '@/lib/store';

interface ProjectDetailsClientProps {
  id: string;
  initialProject: Record<string, unknown>;
  initialTasks: Record<string, unknown>[];
  initialTimeEntries: Record<string, unknown>[];
  initialExpenses: Record<string, unknown>[];
}

export function ProjectDetailsClient({
  id,
  initialProject,
  initialTasks,
  initialTimeEntries,
  initialExpenses,
}: ProjectDetailsClientProps) {
  const router = useRouter();
  const { defaultTaskView } = useSettingsStore();
  const [project, setProject] = useState<Record<string, unknown>>(initialProject);
  const [tasks, setTasks] = useState<Record<string, unknown>[]>(initialTasks);
  const [timeEntries, setTimeEntries] = useState<Record<string, unknown>[]>(initialTimeEntries);
  const [expenses, setExpenses] = useState<Record<string, unknown>[]>(initialExpenses);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [viewMode, setViewMode] = useState<'board' | 'list' | 'timeline'>(() =>
    defaultTaskView === 'list' ? 'list' : defaultTaskView === 'timeline' ? 'timeline' : 'board'
  );
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);

  const [isManageExpensesOpen, setIsManageExpensesOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Record<string, unknown> | null>(null);

  const { tasks: ganttTasks, taskStatusMap, isLoading: ganttLoading, error: ganttError, refresh: refreshGantt } = useProjectGanttData(id);

  const refreshData = useCallback(async () => {
    try {
      const [projResult, tasksResult] = await Promise.all([
        pb.collection('projects').getList(1, 1, {
          filter: pb.filter('id = {:id}', { id })
        }),
        pb.collection('tasks').getList(1, 50, {
          filter: pb.filter('project = {:id}', { id }),
          sort: '-created',
          expand: 'assignees'
        }),
      ]);

      if (projResult.items.length > 0) {
        setProject(projResult.items[0]);
      }

      const newTasks = tasksResult.items;
      setTasks(newTasks);

      const taskIds = newTasks.map((t: Record<string, unknown>) => t.id as string);
      if (taskIds.length > 0) {
        const [timeResult, expensesResult] = await Promise.all([
          pb.collection('time_entries').getList(1, 200, {
            filter: taskIds.map((tid: string) => pb.filter('task = {:id}', { id: tid })).join(' || '),
            sort: '-created',
          }),
          pb.collection('external_expenses').getList(1, 100, {
            filter: pb.filter('project = {:id}', { id }),
            sort: '-created'
          }).catch(() => ({ items: [] })),
        ]);
        setTimeEntries(timeResult.items);
        setExpenses(expensesResult.items);
      } else {
        setTimeEntries([]);
        const expensesResult = await pb.collection('external_expenses').getList(1, 100, {
          filter: pb.filter('project = {:id}', { id }),
          sort: '-created'
        }).catch(() => ({ items: [] }));
        setExpenses(expensesResult.items);
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  }, [id]);

  useRealtime<Record<string, unknown>>(
    'tasks',
    (event) => {
      const recordProject = (event.record as Record<string, unknown>)?.project as string | undefined;
      if (recordProject !== id) return;

      switch (event.action) {
        case 'create':
          setTasks((prev) => {
            if (prev.some((t) => t.id === event.record.id)) return prev;
            return [event.record as Record<string, unknown>, ...prev];
          });
          break;
        case 'update':
          setTasks((prev) =>
            prev.map((t) =>
              t.id === event.record.id ? (event.record as Record<string, unknown>) : t
            )
          );
          break;
        case 'delete':
          setTasks((prev) => prev.filter((t) => t.id !== event.record.id));
          break;
      }
      refreshGantt();
    },
    { filter: pb.filter('project = {:id}', { id }) }
  );

  useRealtime<Record<string, unknown>>(
    'time_entries',
    (event) => {
      const recordTask = (event.record as Record<string, unknown>)?.task as string | undefined;
      if (!recordTask) return;

      const taskBelongsToProject = tasks.some((t) => t.id === recordTask);
      if (!taskBelongsToProject) return;

      switch (event.action) {
        case 'create':
          setTimeEntries((prev) => {
            if (prev.some((te) => te.id === event.record.id)) return prev;
            return [event.record as Record<string, unknown>, ...prev];
          });
          break;
        case 'update':
          setTimeEntries((prev) =>
            prev.map((te) =>
              te.id === event.record.id ? (event.record as Record<string, unknown>) : te
            )
          );
          break;
        case 'delete':
          setTimeEntries((prev) => prev.filter((te) => te.id !== event.record.id));
          break;
      }
    }
  );

  useRealtime<Record<string, unknown>>(
    'external_expenses',
    (event) => {
      const recordProject = (event.record as Record<string, unknown>)?.project as string | undefined;
      if (recordProject !== id) return;

      switch (event.action) {
        case 'create':
          setExpenses((prev) => {
            if (prev.some((e) => e.id === event.record.id)) return prev;
            return [event.record as Record<string, unknown>, ...prev];
          });
          break;
        case 'update':
          setExpenses((prev) =>
            prev.map((e) =>
              e.id === event.record.id ? (event.record as Record<string, unknown>) : e
            )
          );
          break;
        case 'delete':
          setExpenses((prev) => prev.filter((e) => e.id !== event.record.id));
          break;
      }
    },
    { filter: pb.filter('project = {:id}', { id }) }
  );

  useEffect(() => {
    if (refreshTrigger === 0) return;
    refreshData();
  }, [refreshTrigger, refreshData]);

  const totalHours = useMemo(() => {
    const totalMinutes = timeEntries.reduce((sum: number, e: any) => sum + (e.duration_minutes || 0), 0);
    return totalMinutes / 60;
  }, [timeEntries]);

  const totalTasksPlannedHours = useMemo(() => {
    return tasks.reduce((sum: number, t: any) => sum + (t.estimated_hours || 0), 0);
  }, [tasks]);

  const budgetHours = (project as any)?.budget_hours || 0;
  const isOverBudgetPlanned = budgetHours > 0 && totalTasksPlannedHours > budgetHours;

  const totalExpenses = useMemo(() => {
    return expenses.reduce((sum: number, e: any) => sum + (e.amount || 0), 0);
  }, [expenses]);

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'acute': return <Badge className="bg-red-500/10 text-red-500 hover:bg-red-500/20 shadow-none border-red-500/20">Akut</Badge>;
      case 'high': return <Badge className="bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 shadow-none border-orange-500/20">Hoch</Badge>;
      case 'medium': return <Badge className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 shadow-none border-blue-500/20">Mittel</Badge>;
      case 'low': return <Badge className="bg-zinc-500/10 text-muted-foreground hover:bg-zinc-500/20 shadow-none border-zinc-500/20">Niedrig</Badge>;
      default: return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'todo': return <Badge variant="outline" className="text-muted-foreground border-zinc-700 bg-card">Offen</Badge>;
      case 'in_progress': return <Badge variant="outline" className="text-indigo-400 border-indigo-500/30 bg-indigo-500/10">In Arbeit</Badge>;
      case 'review': return <Badge variant="outline" className="text-purple-400 border-purple-500/30 bg-purple-500/10">Prüfung</Badge>;
      case 'done': return <Badge variant="outline" className="text-emerald-400 border-emerald-500/30 bg-emerald-500/10">Erledigt</Badge>;
      default: return null;
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    try {
      await pb.collection('external_expenses').delete(expenseId);
      toast.success('Fremdkosten gelöscht');
    } catch (error) {
      console.error('Failed to delete external expense:', error);
      toast.error('Fehler beim Löschen der Fremdkosten');
    }
  };

  return (
    <div className="h-full text-foreground flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-background/50 px-8 py-4 shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/')}
              className="p-2 rounded-full hover:bg-accent/50 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">{(project as any)?.name}</h1>
                <Badge variant="outline" className="bg-card text-muted-foreground border-border font-mono">
                  {(project as any)?.key}
                </Badge>
              </div>
              <div className="flex items-center gap-4 mt-1">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Clock size={14} /> {totalHours.toFixed(1)} / {(project as any)?.budget_hours || '?'} Stunden
                </p>
                {expenses.length > 0 && (
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                    <Euro size={14} className="text-primary" /> {totalExpenses.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })} Fremdkosten
                  </p>
                )}
                {(project as any)?.start_date && isValid(parseISO((project as any).start_date)) && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <Clock size={14} />
                    {format(parseISO((project as any).start_date), 'dd.MM.yyyy', { locale: de })}
                    {(project as any)?.due_date && isValid(parseISO((project as any).due_date)) && (
                      <> – {format(parseISO((project as any).due_date), 'dd.MM.yyyy', { locale: de })}</>
                    )}
                  </p>
                )}
                {!(project as any)?.start_date && (project as any)?.due_date && isValid(parseISO((project as any).due_date)) && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <Clock size={14} />
                    Bis {format(parseISO((project as any).due_date), 'dd.MM.yyyy', { locale: de })}
                  </p>
                )}
              </div>
              {isOverBudgetPlanned && (
                <div className="mt-2.5 inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-medium animate-in fade-in duration-300">
                  <AlertTriangle size={14} className="shrink-0" />
                  <span>
                    <strong>Überplanungs-Warnung:</strong> Geplante Aufgaben ({totalTasksPlannedHours.toFixed(1)}h) übersteigen das Projektbudget ({budgetHours}h) um {(totalTasksPlannedHours - budgetHours).toFixed(1)}h!
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-card/50 p-1 rounded-lg flex items-center border border-border">
              <button
                onClick={() => setViewMode('board')}
                className={`p-1.5 rounded-md transition-colors ${viewMode === 'board' ? 'bg-muted text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <KanbanSquare size={16} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-muted text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <List size={16} />
              </button>
              <button
                onClick={() => setViewMode('timeline')}
                className={`p-1.5 rounded-md transition-colors ${viewMode === 'timeline' ? 'bg-muted text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                title="Timeline"
              >
                <BarChart3 size={16} />
              </button>
            </div>
            <Button
              variant="outline"
              onClick={() => setIsManageExpensesOpen(true)}
              className="flex items-center gap-2 border-border bg-card/45 hover:bg-accent/50 text-foreground"
            >
              <Euro size={16} />
              <span>Fremdkosten</span>
            </Button>
            <NewTaskDialog
              projectId={id}
              onTaskCreated={() => setRefreshTrigger(prev => prev + 1)}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-8 flex-1 overflow-auto">
        <div className={viewMode === 'timeline' ? 'h-full' : 'max-w-7xl mx-auto'}>
          {viewMode === 'timeline' && (
            <GanttView
              tasks={ganttTasks}
              taskStatusMap={taskStatusMap}
              isLoading={ganttLoading}
              error={ganttError}
              onTaskClick={(tid: string) => setSelectedTaskId(tid)}
              activeView="timeline"
              onViewChange={(view: string) => {
                if (view === 'kanban') setViewMode('board');
                else if (view === 'list') setViewMode('list');
                else setViewMode('timeline');
              }}
              isFullscreen={false}
              onToggleFullscreen={() => {}}
              onTaskUpdated={refreshGantt}
            />
          )}
          {viewMode !== 'timeline' && tasks.length === 0 && (
            <div className="rounded-2xl border border-border bg-card/30 overflow-hidden">
              <div className="p-16 flex flex-col items-center justify-center text-center">
                <CheckCircle2 size={48} className="text-muted-foreground/30 mb-4" />
                <h3 className="text-xl font-semibold text-foreground">Keine Aufgaben vorhanden</h3>
                <p className="text-muted-foreground text-sm mt-2 max-w-md">
                  Dieses Projekt hat noch keine Aufgaben. Erstelle die erste Aufgabe, um loszulegen.
                </p>
              </div>
            </div>
          )}
          {viewMode !== 'timeline' && tasks.length > 0 && viewMode === 'board' && (
            <KanbanBoard
              initialTasks={tasks as any}
              projectKey={(project as any)?.key}
              onTaskUpdated={() => {
                setRefreshTrigger(prev => prev + 1);
                refreshGantt();
              }}
              onTaskClick={(tid: string) => setSelectedTaskId(tid)}
            />
          )}
          {viewMode !== 'timeline' && tasks.length > 0 && viewMode === 'list' && (
            <div className="rounded-2xl border border-border bg-card/30 overflow-hidden">
              <Table>
                <TableHeader className="bg-card/50 hover:bg-card/50 border-b border-border">
                  <TableRow className="border-none">
                    <TableHead className="w-[40px] px-4">
                      <input 
                        type="checkbox" 
                        aria-label="Alle Aufgaben auswählen"
                        className="w-4 h-4 rounded border-border bg-card text-primary focus:ring-primary focus:ring-offset-background cursor-pointer"
                        checked={tasks.length > 0 && selectedTasks.length === tasks.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTasks(tasks.map((t: any) => t.id));
                          } else {
                            setSelectedTasks([]);
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead className="text-muted-foreground font-medium">Aufgabe</TableHead>
                    <TableHead className="text-muted-foreground font-medium">Status</TableHead>
                    <TableHead className="text-muted-foreground font-medium">Priorität</TableHead>
                    <TableHead className="text-right text-muted-foreground font-medium">Zugewiesen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map((task: any) => (
                    <TableRow
                      key={task.id}
                      onClick={() => setSelectedTaskId(task.id)}
                      className="border-b border-border/50 hover:bg-white/[0.02] transition-colors cursor-pointer"
                    >
                      <TableCell className="px-4" onClick={(e) => e.stopPropagation()}>
                        <input 
                          type="checkbox" 
                          aria-label={`Aufgabe ${task.title} auswählen`}
                          className="w-4 h-4 rounded border-border bg-card text-primary focus:ring-primary focus:ring-offset-background cursor-pointer"
                          checked={selectedTasks.includes(task.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTasks(prev => [...prev, task.id]);
                            } else {
                              setSelectedTasks(prev => prev.filter(id => id !== task.id));
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell className="font-medium text-foreground py-4">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono text-muted-foreground">{(project as any)?.key}-{task.id.substring(0, 4).toUpperCase()}</span>
                          {task.title}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(task.status)}</TableCell>
                      <TableCell>{getPriorityBadge(task.priority)}</TableCell>
                      <TableCell className="text-right">
                        <span className="text-xs text-muted-foreground font-medium">
                          {Array.isArray(task.expand?.assignees) ? task.expand.assignees.map((a: any, i: number) => (
                            <span key={a.id}>
                              {i > 0 && ', '}
                              {a.name || a.email}
                            </span>
                          )) : (task.expand?.assignees ? (
                            <span>{(task.expand.assignees as any).name || (task.expand.assignees as any).email}</span>
                          ) : 'Unzugewiesen')}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </main>

      {/* Floating Action Bar für Bulk-Aktionen */}
      {selectedTasks.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className="bg-background/90 backdrop-blur-xl border border-border rounded-full shadow-2xl shadow-black/50 p-2 flex items-center gap-4">
            <div className="px-4 text-sm font-medium text-foreground border-r border-border/50">
              <span className="text-primary font-bold">{selectedTasks.length}</span> markiert
            </div>
            <div className="flex items-center gap-2 pr-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-full h-8 px-4 bg-card/50 hover:bg-card border-border/50"
                onClick={async () => {
                  try {
                    for (const id of selectedTasks) {
                      await pb.collection('tasks').update(id, { status: 'done' });
                    }
                    toast.success(`${selectedTasks.length} Aufgaben auf "Erledigt" gesetzt`);
                    setSelectedTasks([]);
                    setRefreshTrigger(p => p + 1);
                  } catch {
                    toast.error('Fehler bei der Bulk-Aktion');
                  }
                }}
              >
                Abschließen
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-full h-8 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20"
                onClick={async () => {
                  if (!confirm(`Wirklich ${selectedTasks.length} Aufgaben löschen?`)) return;
                  try {
                    for (const id of selectedTasks) {
                      await pb.collection('tasks').delete(id);
                    }
                    toast.success(`${selectedTasks.length} Aufgaben gelöscht`);
                    setSelectedTasks([]);
                    setRefreshTrigger(p => p + 1);
                  } catch {
                    toast.error('Fehler beim Löschen');
                  }
                }}
              >
                Löschen
              </Button>
              <button 
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted text-muted-foreground ml-1"
                onClick={() => setSelectedTasks([])}
                aria-label="Auswahl aufheben"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      <TaskDetailsDialog
        taskId={selectedTaskId}
        projectKey={(project as any)?.key}
        onClose={() => setSelectedTaskId(null)}
        onTaskUpdated={() => setRefreshTrigger(prev => prev + 1)}
        onTaskClick={setSelectedTaskId}
      />

      <ManageExpensesDialog
        open={isManageExpensesOpen}
        onOpenChange={setIsManageExpensesOpen}
        expenses={expenses}
        onAddClick={() => {
          setSelectedExpense(null);
          setIsAddExpenseOpen(true);
        }}
        onEditClick={(exp: any) => {
          setSelectedExpense(exp);
          setIsAddExpenseOpen(true);
        }}
        onDeleteClick={handleDeleteExpense}
      />

      <ExternalExpensesDialog
        projectId={id}
        expense={selectedExpense as any}
        open={isAddExpenseOpen}
        onOpenChange={setIsAddExpenseOpen}
      />
    </div>
  );
}

interface ManageExpensesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expenses: any[];
  onAddClick: () => void;
  onEditClick: (expense: any) => void;
  onDeleteClick: (expenseId: string) => Promise<void>;
}

function ManageExpensesDialog({
  open,
  onOpenChange,
  expenses,
  onAddClick,
  onEditClick,
  onDeleteClick,
}: ManageExpensesDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-background border-border text-foreground">
        <DialogHeader className="flex flex-row items-center justify-between pb-4 border-b border-border/50">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Euro size={22} className="text-primary" />
            <span>Fremdkosten verwalten</span>
          </DialogTitle>
          <Button
            size="sm"
            onClick={onAddClick}
            className="flex items-center gap-1.5"
          >
            <Plus size={15} />
            <span>Hinzufügen</span>
          </Button>
        </DialogHeader>

        <div className="py-4 max-h-[400px] overflow-y-auto">
          {expenses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Keine Fremdkosten für dieses Projekt erfasst.
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-card/50">
                <TableRow className="border-border">
                  <TableHead className="text-muted-foreground font-medium">Kategorie</TableHead>
                  <TableHead className="text-muted-foreground font-medium">Beschreibung</TableHead>
                  <TableHead className="text-muted-foreground font-medium text-right">Betrag</TableHead>
                  <TableHead className="text-muted-foreground font-medium text-right w-[100px]">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((exp: any) => (
                  <TableRow key={exp.id} className="border-border/50 hover:bg-white/[0.02]">
                    <TableCell className="font-medium text-sm">{exp.category}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{exp.description || '—'}</TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {exp.amount.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onEditClick(exp)}
                          className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                          title="Bearbeiten"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => onDeleteClick(exp.id)}
                          className="p-1.5 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
                          title="Löschen"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
