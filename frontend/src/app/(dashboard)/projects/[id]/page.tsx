'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { pb } from '@/lib/pocketbase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock, Plus, CheckCircle2, AlertCircle, KanbanSquare, List, Calendar, BarChart3, Euro, Pencil, Trash2 } from 'lucide-react';
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
import { Skeleton } from '@/components/ui/skeleton';
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
import { use } from 'react';

export default function ProjectDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [project, setProject] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [timeEntries, setTimeEntries] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [viewMode, setViewMode] = useState<'board' | 'list' | 'timeline'>('board');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  
  const [isManageExpensesOpen, setIsManageExpensesOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<any | null>(null);

  const { tasks: ganttTasks, taskStatusMap, isLoading: ganttLoading, error: ganttError, refresh: refreshGantt } = useProjectGanttData(id);

  useEffect(() => {
    const handleUpdate = () => {
      setRefreshTrigger(prev => prev + 1);
      refreshGantt();
    };

    window.addEventListener('task-updated', handleUpdate);
    window.addEventListener('project-updated', handleUpdate);

    return () => {
      window.removeEventListener('task-updated', handleUpdate);
      window.removeEventListener('project-updated', handleUpdate);
    };
  }, [refreshGantt]);

  useEffect(() => {
    const fetchData = async () => {
      if (!id || id.length !== 15 || id.startsWith('[')) {
        console.log('ProjectDetailsPage: waiting for valid ID, current:', id);
        return;
      }

      if (!pb.authStore.isValid) {
        router.push('/login');
        return;
      }
      try {
        console.log('ProjectDetailsPage: fetching ID', id);

        const projResult = await pb.collection('projects').getList(1, 1, {
          filter: pb.filter('id = {:id}', { id })
        });

        if (projResult.items.length === 0) {
          console.error('Project not found');
          return;
        }

        const projData = projResult.items[0];
        setProject(projData);

        const tasksResult = await pb.collection('tasks').getList(1, 50, {
          filter: pb.filter('project = {:id}', { id }),
          sort: '-created',
          expand: 'assignees'
        });
        setTasks(tasksResult.items);

        const taskIds = tasksResult.items.map((t: any) => t.id);
        if (taskIds.length > 0) {
          const timeResult = await pb.collection('time_entries').getList(1, 200, {
            filter: taskIds.map((tid: string) => pb.filter('task = {:id}', { id: tid })).join(' || '),
            sort: '-created',
          });
          setTimeEntries(timeResult.items);
        } else {
          setTimeEntries([]);
        }

        try {
          const expensesResult = await pb.collection('external_expenses').getList(1, 100, {
            filter: pb.filter('project = {:id}', { id }),
            sort: '-created'
          });
          setExpenses(expensesResult.items);
        } catch (err) {
          console.error('Error fetching external expenses:', err);
          setExpenses([]);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, router, refreshTrigger]);

  const totalHours = useMemo(() => {
    const totalMinutes = timeEntries.reduce((sum: number, e: any) => sum + (e.duration_minutes || 0), 0);
    return totalMinutes / 60;
  }, [timeEntries]);

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
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Failed to delete external expense:', error);
      toast.error('Fehler beim Löschen der Fremdkosten');
    }
  };

  if (isLoading) {
    return (
      <div className="h-full p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <Skeleton className="h-12 w-64 bg-card" />
          <Skeleton className="h-[400px] w-full bg-card rounded-2xl" />
        </div>
      </div>
    );
  }

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
                <h1 className="text-2xl font-bold tracking-tight text-foreground">{project?.name}</h1>
                <Badge variant="outline" className="bg-card text-muted-foreground border-border font-mono">
                  {project?.key}
                </Badge>
              </div>
              <div className="flex items-center gap-4 mt-1">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Clock size={14} /> {totalHours.toFixed(1)} / {project?.budget_hours || '?'} Stunden
                </p>
                {expenses.length > 0 && (
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                    <Euro size={14} className="text-primary" /> {totalExpenses.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })} Fremdkosten
                  </p>
                )}
                {project?.start_date && isValid(parseISO(project.start_date)) && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <Calendar size={14} />
                    {format(parseISO(project.start_date), 'dd.MM.yyyy', { locale: de })}
                    {project?.due_date && isValid(parseISO(project.due_date)) && (
                      <> – {format(parseISO(project.due_date), 'dd.MM.yyyy', { locale: de })}</>
                    )}
                  </p>
                )}
                {!project?.start_date && project?.due_date && isValid(parseISO(project.due_date)) && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <Calendar size={14} />
                    Bis {format(parseISO(project.due_date), 'dd.MM.yyyy', { locale: de })}
                  </p>
                )}
              </div>
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
              onTaskClick={(id) => setSelectedTaskId(id)}
              activeView="timeline"
              onViewChange={(view) => {
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
              initialTasks={tasks}
              projectKey={project?.key}
              onTaskUpdated={() => {
                setRefreshTrigger(prev => prev + 1);
                refreshGantt();
              }}
              onTaskClick={(id) => setSelectedTaskId(id)}
            />
          )}
          {viewMode !== 'timeline' && tasks.length > 0 && viewMode === 'list' && (
            <div className="rounded-2xl border border-border bg-card/30 overflow-hidden">
              <Table>
                <TableHeader className="bg-card/50 hover:bg-card/50 border-b border-border">
                  <TableRow className="border-none">
                    <TableHead className="text-muted-foreground font-medium">Aufgabe</TableHead>
                    <TableHead className="text-muted-foreground font-medium">Status</TableHead>
                    <TableHead className="text-muted-foreground font-medium">Priorität</TableHead>
                    <TableHead className="text-muted-foreground font-medium text-right">Zuständig</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map((task) => (
                    <TableRow
                      key={task.id}
                      onClick={() => setSelectedTaskId(task.id)}
                      className="border-b border-border/50 hover:bg-white/[0.02] transition-colors cursor-pointer"
                    >
                      <TableCell className="font-medium text-foreground py-4">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono text-muted-foreground">{project?.key}-{task.id.substring(0, 4).toUpperCase()}</span>
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

      <TaskDetailsDialog
        taskId={selectedTaskId}
        projectKey={project?.key}
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
        onEditClick={(exp) => {
          setSelectedExpense(exp);
          setIsAddExpenseOpen(true);
        }}
        onDeleteClick={handleDeleteExpense}
      />

      <ExternalExpensesDialog
        projectId={id}
        expense={selectedExpense}
        open={isAddExpenseOpen}
        onOpenChange={setIsAddExpenseOpen}
        onSaved={() => setRefreshTrigger(prev => prev + 1)}
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
                {expenses.map((exp) => (
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
