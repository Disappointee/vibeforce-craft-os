'use client';

import { useEffect, useState } from 'react';
import { pb } from '@/lib/pocketbase';
import type { TaskRecord, UserRecord } from '@/lib/pocketbase-types';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { updateTaskAction } from '@/app/actions/tasks';

export function UnassignedTasksWidget() {
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tasksRes, usersRes] = await Promise.all([
          pb.collection('tasks').getList(1, 50, {
            filter: "assignees:length = 0 && status != 'done'",
            sort: '-created',
          }),
          pb.collection('users').getList(1, 50, { sort: 'name' }),
        ]);
        setTasks(tasksRes.items as TaskRecord[]);
        setUsers(usersRes.items as UserRecord[]);
      } catch (err) {
        console.error('UnassignedTasksWidget:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAssign = async (taskId: string, userId: string) => {
    setAssigning(taskId);
    try {
      await updateTaskAction(taskId, { assignees: [userId] });
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      toast.success('Aufgabe zugewiesen');
    } catch (err) {
      console.error(err);
      toast.error('Fehler beim Zuweisen');
    } finally {
      setAssigning(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
        <Loader2 size={14} className="animate-spin" />
        Lade unzugewiesene Aufgaben...
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        Keine unzugewiesenen Aufgaben.
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4">
      <div className="flex items-center gap-2 text-amber-400">
        <AlertTriangle size={16} />
        <h3 className="text-sm font-semibold">
          {tasks.length} unzugewiesene Aufgabe{tasks.length !== 1 ? 'n' : ''}
        </h3>
      </div>
      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="flex items-center justify-between gap-3 p-2 rounded-lg bg-amber-500/5 border border-amber-500/10"
          >
            <span className="text-sm text-foreground truncate flex-1 min-w-0">
              {task.title}
            </span>
            <select
              className="text-xs bg-card border-border rounded px-2 py-1 text-foreground shrink-0 disabled:opacity-50"
              onChange={(e) => {
                if (e.target.value) handleAssign(task.id, e.target.value);
              }}
              defaultValue=""
              disabled={assigning === task.id}
            >
              <option value="" disabled>
                {assigning === task.id ? '...' : 'Zuweisen...'}
              </option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name || u.email}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}
