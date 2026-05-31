'use client';

import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { pb } from '@/lib/pocketbase';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';
import { toast } from 'sonner';
import { TaskRecord, TaskStatus } from '@/lib/pocketbase-types';
import { TASK_TYPE_LABELS } from '@/lib/constants';

const priorityLabels: Record<string, string> = {
  acute: 'Akut',
  high: 'Hoch',
  medium: 'Mittel',
  low: 'Niedrig',
};

const COLUMNS = [
  { id: 'todo', title: 'Offen', color: 'border-border' },
  { id: 'in_progress', title: 'In Arbeit', color: 'border-indigo-500/30' },
  { id: 'review', title: 'Prüfung', color: 'border-purple-500/30' },
  { id: 'done', title: 'Erledigt', color: 'border-emerald-500/30' },
];

export function KanbanBoard({
  initialTasks,
  projectKey,
  clientMap,
  onTaskUpdated,
  onTaskClick
}: {
  initialTasks: TaskRecord[],
  projectKey?: string,
  clientMap?: Record<string, string>,
  onTaskUpdated: () => void,
  onTaskClick: (taskId: string) => void
}) {
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [taskHours, setTaskHours] = useState<Record<string, number>>({});

  // Update local state when props change
  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  // Load actual hours for tasks
  useEffect(() => {
    if (tasks.length === 0) return;
    const fetchHours = async () => {
      try {
        const tids = tasks.map(t => t.id);
        const res = await pb.collection('time_entries').getFullList({
          filter: tids.map(id => pb.filter('task = {:id}', { id })).join(' || '),
          fields: 'task,duration_minutes'
        });
        const map: Record<string, number> = {};
        for (const entry of res) {
          map[entry.task] = (map[entry.task] || 0) + ((entry.duration_minutes || 0) / 60);
        }
        setTaskHours(map);
      } catch (err) {
        console.error('Failed to fetch task hours:', err);
      }
    };
    fetchHours();
  }, [tasks]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'acute': return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'high': return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
      case 'medium': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'low': return 'text-muted-foreground bg-zinc-500/10 border-zinc-500/20';
      default: return 'text-muted-foreground bg-zinc-500/10 border-zinc-500/20';
    }
  };

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // Dropped outside a column
    if (!destination) return;

    // Dropped in the same column and same position
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    // Find the task
    const task = tasks.find(t => t.id === draggableId);
    if (!task) return;

    const newStatus = destination.droppableId;

    // Optimistic UI Update
    const updatedTasks: TaskRecord[] = tasks.map(t => {
      if (t.id === draggableId) {
        return { ...t, status: newStatus as TaskStatus };
      }
      return t;
    });
    setTasks(updatedTasks);

    // Persist to PocketBase
    try {
      await pb.collection('tasks').update(draggableId, {
        status: newStatus
      });
      // Trigger parent callback to sync other views (e.g. list view, Gantt)
      onTaskUpdated();
    } catch (error) {
      console.error(error);
      toast.error('Fehler beim Speichern des Status');
      // Revert optimistic update
      setTasks(initialTasks);
    }
  };

  // Group tasks by status
  const getTasksByStatus = (status: string) => {
    return tasks.filter(t => t.status === status);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      {/* data-rbd-no-nested-scroll suppresses @hello-pangea/dnd warning
          about nested scroll containers – the grid layout itself handles overflow */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start" data-rbd-no-nested-scroll>
        {COLUMNS.map((column) => (
          <div key={column.id} className="flex flex-col h-full">

            {/* Column Header */}
            <div className={`flex items-center justify-between mb-4 pb-2 border-b ${column.color}`}>
              <h3 className="text-foreground font-semibold">{column.title}</h3>
              <Badge variant="secondary" className="bg-card text-muted-foreground hover:bg-card">
                {getTasksByStatus(column.id).length}
              </Badge>
            </div>

            {/* Droppable Area */}
            <Droppable droppableId={column.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`flex-1 min-h-[500px] rounded-xl transition-colors ${snapshot.isDraggingOver ? 'bg-card/50' : 'bg-transparent'
                    }`}
                >
                  <div className="space-y-3">
                    {getTasksByStatus(column.id).map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            onClick={() => onTaskClick(task.id)}
                             className={`p-4 rounded-xl border bg-card/80 backdrop-blur-sm shadow-sm transition-all cursor-pointer ${snapshot.isDragging ? 'border-indigo-500/50 shadow-indigo-500/20 shadow-lg scale-105 z-50' : 'border-border hover:border-ring/30'
                               }`}
                            style={{
                              ...provided.draggableProps.style,
                            }}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex flex-col gap-0.5">
                                <span className="text-[10px] font-medium text-muted-foreground">
                                  {TASK_TYPE_LABELS[task.type || ''] || task.type || 'Aufgabe'}
                                </span>
                                <span className="text-[10px] font-mono text-muted-foreground/60">
                                  #{task.id.substring(0, 6).toUpperCase()}
                                </span>
                                {clientMap && task.project && clientMap[task.project] && (
                                  <span className="text-[10px] text-muted-foreground/50">
                                    {clientMap[task.project]}
                                  </span>
                                )}
                              </div>
                              <Badge variant="outline" className={`text-[9px] uppercase tracking-wider font-bold ${getPriorityColor(task.priority)}`}>
                                {priorityLabels[task.priority] || task.priority}
                              </Badge>
                            </div>

                            <h4 className="text-sm text-foreground font-medium mb-4 leading-snug">{task.title}</h4>

                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <div className="flex items-center gap-1.5">
                                <Clock size={12} />
                                <span>{taskHours[task.id] ? `${taskHours[task.id].toFixed(1)}h` : '0h'} erfasst</span>
                              </div>
                              <div className="h-6 w-6 rounded-full border border-indigo-500/30 flex items-center justify-center bg-indigo-500/10 text-indigo-400 font-bold text-[10px]">
                                {Array.isArray(task.expand?.assignees) ? (
                                  task.expand.assignees[0]?.name?.charAt(0).toUpperCase() ||
                                  task.expand.assignees[0]?.email?.charAt(0).toUpperCase() ||
                                  '?'
                                ) : (task.expand?.assignees ? (
                                  (task.expand.assignees as any).name?.charAt(0).toUpperCase() ||
                                  (task.expand.assignees as any).email?.charAt(0).toUpperCase() ||
                                  '?'
                                ) : '?')}
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>

          </div>
        ))}
      </div>
    </DragDropContext>
  );
}
