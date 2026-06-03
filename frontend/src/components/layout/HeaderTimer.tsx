'use client';

import { useEffect, useState, useRef } from 'react';
import { useTimerStore } from '@/lib/store';
import { pb } from '@/lib/pocketbase';
import { Square, Play, Clock, Loader2, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { differenceInSeconds, parseISO } from 'date-fns';

interface TaskOption {
  id: string;
  title: string;
  projectKey: string;
}

export function HeaderTimer() {
  const {
    runningTaskId,
    startTime,
    taskTitle,
    description,
    isPaused,
    totalPausedSeconds,
    selectedTaskId,
    startTimer,
    stopAndSaveTimer,
    setDescription,
    setSelectedTaskId,
  } = useTimerStore();

  const [elapsed, setElapsed] = useState(0);
  const [isStopping, setIsStopping] = useState(false);
  const [tasks, setTasks] = useState<TaskOption[]>([]);
  const [taskSearch, setTaskSearch] = useState('');
  const [showTaskDropdown, setShowTaskDropdown] = useState(false);
  const [showNotePopover, setShowNotePopover] = useState(false);

  const taskDropdownRef = useRef<HTMLDivElement>(null);
  const notePopoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const result = await pb.collection('tasks').getList(1, 100, {
          sort: '-created',
          expand: 'project',
          filter: pb.filter("status != {:status}", { status: 'done' }),
        });
        setTasks(result.items.map((task: any) => {
          const project = task.expand?.project;
          return {
            id: task.id,
            title: task.title,
            projectKey: project?.key || '—',
          };
        }));
      } catch {
        // silent fail
      }
    };
    fetchTasks();
  }, []);

  useEffect(() => {
    if (!runningTaskId || !startTime || isPaused) return;
    const interval = setInterval(() => {
      const seconds = differenceInSeconds(new Date(), parseISO(startTime)) - totalPausedSeconds;
      setElapsed(Math.max(0, seconds));
    }, 1000);
    return () => clearInterval(interval);
  }, [runningTaskId, startTime, isPaused, totalPausedSeconds]);

  useEffect(() => {
    const state = useTimerStore.getState();
    if (state.isPaused && state.startTime && state.pauseStartTime) {
      const start = new Date(state.startTime).getTime();
      const pauseStart = new Date(state.pauseStartTime).getTime();
      const elapsedBeforePause = Math.floor((pauseStart - start) / 1000) - state.totalPausedSeconds;
      setElapsed(Math.max(0, elapsedBeforePause));
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (taskDropdownRef.current && !taskDropdownRef.current.contains(e.target as Node)) {
        setShowTaskDropdown(false);
      }
      if (notePopoverRef.current && !notePopoverRef.current.contains(e.target as Node)) {
        setShowNotePopover(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleStart = async () => {
    if (!selectedTaskId) {
      toast.error('Bitte wähle eine Aufgabe aus');
      return;
    }
    const task = tasks.find(t => t.id === selectedTaskId);
    if (!task) return;
    await startTimer(task.id, task.title, description);
    setShowTaskDropdown(false);
  };

  const handleStop = async () => {
    if (!runningTaskId || !startTime) return;
    setIsStopping(true);
    try {
      const savedTitle = taskTitle;
      await stopAndSaveTimer();
      toast.success(`Zeit erfasst für "${savedTitle}"`);
    } catch {
      toast.error('Fehler beim Speichern der Zeit');
    } finally {
      setIsStopping(false);
    }
  };

  const handleCloseNote = () => {
    setShowNotePopover(false);
  };

  const selectedTask = tasks.find(t => t.id === selectedTaskId);
  const filteredTasks = tasks.filter(t =>
    t.title.toLowerCase().includes(taskSearch.toLowerCase()) ||
    t.projectKey.toLowerCase().includes(taskSearch.toLowerCase())
  );

  const hasRunningTimer = !!runningTaskId;

  return (
    <div className="flex items-center gap-1.5">
      {!hasRunningTimer && (
        <>
          <div ref={taskDropdownRef} className="relative">
            <button
              onClick={() => setShowTaskDropdown(!showTaskDropdown)}
              className="flex items-center gap-1.5 rounded-lg bg-muted/50 border border-border/50 px-2.5 py-1.5 text-xs text-left hover:border-border transition-colors min-w-[140px] max-w-[180px]"
            >
              <Clock size={13} className="text-muted-foreground shrink-0" />
              <span className={selectedTask ? 'text-foreground truncate' : 'text-muted-foreground truncate'}>
                {selectedTask
                  ? `${selectedTask.projectKey}: ${selectedTask.title}`
                  : 'Aufgabe wählen...'}
              </span>
            </button>

            {showTaskDropdown && (
              <div className="absolute bottom-full mb-2 left-0 w-[320px] rounded-xl border border-border bg-background shadow-2xl shadow-black/50 overflow-hidden z-50">
                <div className="p-2 border-b border-border">
                  <Input
                    placeholder="Aufgabe suchen..."
                    value={taskSearch}
                    onChange={(e) => setTaskSearch(e.target.value)}
                    className="bg-card border-border text-xs rounded-lg h-8"
                    autoFocus
                  />
                </div>
                <div className="max-h-56 overflow-y-auto p-1">
                  {filteredTasks.length === 0 ? (
                    <div className="px-3 py-4 text-center text-xs text-muted-foreground">
                      Keine Aufgaben gefunden
                    </div>
                  ) : (
                    filteredTasks.map((task) => (
                      <button
                        key={task.id}
                        onClick={() => {
                          setSelectedTaskId(task.id);
                          setShowTaskDropdown(false);
                          setTaskSearch('');
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all hover:bg-accent/50 truncate ${
                          selectedTaskId === task.id ? 'bg-primary/10 text-primary' : 'text-muted-foreground'
                        }`}
                      >
                        <span className="text-[10px] font-bold tracking-wider text-primary/70 bg-primary/5 border border-primary/10 px-1.5 py-0.5 rounded mr-1.5">
                          {task.projectKey}
                        </span>
                        <span className="text-foreground">{task.title}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <Button
            onClick={handleStart}
            disabled={!selectedTaskId}
            size="icon"
            className="h-7 w-7 rounded-full bg-primary hover:bg-primary/80 text-primary-foreground"
          >
            <Play size={14} fill="currentColor" />
          </Button>
        </>
      )}

      {hasRunningTimer && (
        <>
          <span className="text-xs text-muted-foreground truncate max-w-[120px]">
            {taskTitle}
          </span>

          <span className={`font-mono font-bold tabular-nums text-sm whitespace-nowrap ${isPaused ? 'text-muted-foreground' : 'text-emerald-400'}`}>
            {formatTime(elapsed)}
          </span>

          <div ref={notePopoverRef} className="relative">
            <button
              onClick={() => setShowNotePopover(!showNotePopover)}
              className={`p-1 rounded transition-colors ${showNotePopover ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <FileText size={14} />
            </button>

            {showNotePopover && (
              <div className="absolute bottom-full mb-2 right-0 bg-background border border-border rounded-xl p-3 shadow-2xl shadow-black/50 z-50 w-64">
                <div className="flex items-center gap-1.5">
                  <Input
                    placeholder="Notiz hinzufügen..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        setShowNotePopover(false);
                      }
                    }}
                    className="bg-card border-border text-xs rounded-lg h-8 flex-1"
                    autoFocus
                  />
                  <button
                    onClick={handleCloseNote}
                    className="shrink-0 p-1 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>

          <Button
            onClick={handleStop}
            disabled={isStopping}
            size="icon"
            className="h-7 w-7 rounded-full bg-destructive/80 hover:bg-destructive text-destructive-foreground"
          >
            {isStopping ? <Loader2 size={14} className="animate-spin" /> : <Square size={12} fill="currentColor" />}
          </Button>
        </>
      )}
    </div>
  );
}
