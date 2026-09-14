'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useTimerStore, useSettingsStore } from '@/lib/store';
import { pb } from '@/lib/pocketbase';
import { Square, Play, Pause, Clock, Loader2, FileText, ArrowUp, ChevronDown, AlertCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { differenceInSeconds, parseISO } from 'date-fns';
import { t } from '@/lib/i18n';
import { isCraftMode } from '@/config/app-mode';

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
    stopTimer,
    stopAndSaveTimer,
    pauseTimer,
    resumeTimer,
    saveRunningNote,
    setDescription,
    setSelectedTaskId,
    syncTimerFromDB,
  } = useTimerStore();

  const { maxTimerHoursContinuous, inactivityHeartbeatHours } = useSettingsStore();

  const [elapsed, setElapsed] = useState(0);
  const [isStopping, setIsStopping] = useState(false);
  const [tasks, setTasks] = useState<TaskOption[]>([]);
  const [taskSearch, setTaskSearch] = useState('');
  const [showTaskDropdown, setShowTaskDropdown] = useState(false);
  const [showNotePopover, setShowNotePopover] = useState(false);

  // Heartbeat & Auto-Cap states
  const [heartbeatOpen, setHeartbeatOpen] = useState(false);
  const [lastHeartbeatPromptElapsed, setLastHeartbeatPromptElapsed] = useState(0);
  const [heartbeatCountdown, setHeartbeatCountdown] = useState(900); // 15 minutes in seconds

  const taskDropdownRef = useRef<HTMLDivElement>(null);
  const notePopoverRef = useRef<HTMLDivElement>(null);
  const autoCappedRef = useRef(false);

  useEffect(() => {
    syncTimerFromDB().catch(() => {});
  }, [syncTimerFromDB]);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const craft = isCraftMode();
        const result = await pb.collection('tasks').getList(1, 500, {
          sort: '-created',
          expand: 'project',
          filter: pb.filter("status != {:status}", { status: 'done' }),
        });
        
        // Strict Data Isolation: Exclude craft projects in agency mode; exclude agency projects in craft mode
        const filtered = result.items.filter((task: any) => {
          const project = task.expand?.project;
          const isCraftProject = project?.key?.startsWith('BAU') || project?.key?.startsWith('CRAFT') || project?.project_type === 'craft';
          return craft ? isCraftProject : !isCraftProject;
        });

        setTasks(filtered.map((task: any) => {
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

  // Reset auto-cap and heartbeat states when active task changes or stops
  useEffect(() => {
    if (!runningTaskId) {
      setHeartbeatOpen(false);
      setLastHeartbeatPromptElapsed(0);
      autoCappedRef.current = false;
    }
  }, [runningTaskId]);

  const handleStop = useCallback(async (isAutoCap = false, isHeartbeatTimeout = false) => {
    if (!runningTaskId || !startTime) return;
    setIsStopping(true);
    try {
      const savedTitle = taskTitle;
      await stopAndSaveTimer();
      if (isAutoCap) {
        toast.warning(`Timer automatisch beendet: Maximale Laufzeit von ${maxTimerHoursContinuous}h erreicht.`, {
          description: `Zeit für "${savedTitle}" wurde erfolgreich gespeichert.`,
          duration: 8000,
        });
      } else if (isHeartbeatTimeout) {
        toast.info(`Timer wegen Inaktivität nach Countdown automatisch gestoppt.`, {
          description: `Zeit für "${savedTitle}" wurde gespeichert.`,
          duration: 8000,
        });
      } else {
        toast.success(`Zeit erfasst für "${savedTitle}"`);
      }
    } catch (err) {
      console.error('stopAndSaveTimer error, forcing local reset:', err);
      // Hardening fallback: immer lokalen Zustand freigeben, damit der Timer nie stecken bleibt
      stopTimer();
      toast.warning('Timer wurde lokal zurückgesetzt.');
    } finally {
      setIsStopping(false);
      setHeartbeatOpen(false);
    }
  }, [runningTaskId, startTime, taskTitle, stopAndSaveTimer, stopTimer, maxTimerHoursContinuous]);

  const handleDiscardTimer = useCallback(() => {
    stopTimer();
    toast.info('Timer verworfen (nicht gespeichert).');
  }, [stopTimer]);

  // Elapsed time tracker & Live Auto-Cap & Heartbeat trigger
  useEffect(() => {
    if (!runningTaskId || !startTime) return;

    // Emergency sanitization: If elapsed > 12 hours on mount, auto-reset immediately
    const initialElapsedSeconds = differenceInSeconds(new Date(), parseISO(startTime)) - totalPausedSeconds;
    if (initialElapsedSeconds > 12 * 3600) {
      console.warn('Excessive timer detected (>12h). Resetting local timer store...');
      stopTimer();
      toast.warning('Alter Geistertimer (>12h) wurde automatisch zurückgesetzt.');
      return;
    }

    if (isPaused) return;

    const interval = setInterval(() => {
      const seconds = differenceInSeconds(new Date(), parseISO(startTime)) - totalPausedSeconds;
      const currentElapsed = Math.max(0, seconds);
      setElapsed(currentElapsed);

      // 1. Live Hard Auto-Cap Check
      const maxCapSeconds = (maxTimerHoursContinuous || 8) * 3600;
      if (currentElapsed >= maxCapSeconds && !autoCappedRef.current) {
        autoCappedRef.current = true;
        handleStop(true);
        return;
      }

      // 2. Inactivity Heartbeat Trigger Check (e.g. after 4h)
      if (inactivityHeartbeatHours > 0) {
        const heartbeatIntervalSec = inactivityHeartbeatHours * 3600;
        if (currentElapsed >= (lastHeartbeatPromptElapsed + heartbeatIntervalSec) && !heartbeatOpen) {
          setHeartbeatOpen(true);
          setHeartbeatCountdown(900); // 15 min countdown
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [
    runningTaskId,
    startTime,
    isPaused,
    totalPausedSeconds,
    maxTimerHoursContinuous,
    inactivityHeartbeatHours,
    lastHeartbeatPromptElapsed,
    heartbeatOpen,
    handleStop
  ]);

  // Heartbeat 15-Minute Countdown Effect
  useEffect(() => {
    if (!heartbeatOpen || isPaused || !runningTaskId) return;

    const countdownInterval = setInterval(() => {
      setHeartbeatCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          handleStop(false, true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [heartbeatOpen, isPaused, runningTaskId, handleStop]);

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

  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleStart = async () => {
    if (!selectedTaskId) {
      toast.error('Bitte wähle eine Aufgabe aus');
      return;
    }
    const task = tasks.find(t => t.id === selectedTaskId);
    if (!task) return;
    try {
      await startTimer(task.id, task.title, description);
      setShowTaskDropdown(false);
    } catch {
      toast.error('Fehler beim Starten des Timers');
    }
  };

  const handleContinueHeartbeat = () => {
    setHeartbeatOpen(false);
    setLastHeartbeatPromptElapsed(elapsed);
    toast.success('Timer läuft weiter', {
      description: 'Inaktivitäts-Prüfung erfolgreich bestätigt.',
    });
  };

  const handleSaveNote = async () => {
    if (!runningTaskId) return;
    try {
      await saveRunningNote();
      setDescription('');
      setShowNotePopover(false);
      toast.success(t('timerbar.toast.note_saved'));
    } catch {
      toast.error(t('timerbar.toast.note_save_error'));
    }
  };

  const selectedTask = tasks.find(t => t.id === (runningTaskId || selectedTaskId));
  const filteredTasks = tasks.filter(t =>
    t.title.toLowerCase().includes(taskSearch.toLowerCase()) ||
    t.projectKey.toLowerCase().includes(taskSearch.toLowerCase())
  );

  const hasRunningTimer = !!runningTaskId;

  const TaskDropdown = ({ showChevron = false }: { showChevron?: boolean }) => (
    <div ref={taskDropdownRef} className="relative">
      <button
        onClick={() => setShowTaskDropdown(!showTaskDropdown)}
        className="flex items-center gap-1.5 rounded-lg bg-muted/50 border border-border/50 px-2.5 py-1.5 text-xs text-left hover:border-border transition-colors min-w-[140px] max-w-[180px]"
      >
        <Clock size={13} className="text-muted-foreground shrink-0" />
        <span className={selectedTask ? 'text-foreground truncate' : 'text-muted-foreground truncate'}>
          {selectedTask
            ? `${selectedTask.projectKey}: ${selectedTask.title}`
            : hasRunningTimer ? (taskTitle || 'Läuft...') : 'Aufgabe wählen...'}
        </span>
        {showChevron && <ChevronDown size={12} className="text-muted-foreground shrink-0 ml-auto" />}
      </button>

      {showTaskDropdown && (
        <div className="absolute top-full mt-2 left-0 w-[320px] rounded-xl border border-border bg-background shadow-2xl shadow-black/50 overflow-hidden z-50">
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
                  onClick={async () => {
                    if (hasRunningTimer && runningTaskId !== task.id) {
                      try {
                        await stopAndSaveTimer();
                        await startTimer(task.id, task.title);
                        toast.success(`Timer gewechselt zu "${task.title}"`);
                      } catch {
                        toast.error('Fehler beim Wechseln des Timers');
                      }
                    } else {
                      setSelectedTaskId(task.id);
                    }
                    setShowTaskDropdown(false);
                    setTaskSearch('');
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all hover:bg-accent/50 truncate ${
                    (runningTaskId || selectedTaskId) === task.id ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground'
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
  );

  return (
    <div className="flex items-center gap-1.5">
      {!hasRunningTimer && (
        <>
          <TaskDropdown />
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
          <TaskDropdown showChevron />
          {isPaused ? (
            <Button
              onClick={resumeTimer}
              size="icon"
              className="h-7 w-7 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white"
              title="Timer fortsetzen"
            >
              <Play size={12} fill="currentColor" />
            </Button>
          ) : (
            <Button
              onClick={pauseTimer}
              size="icon"
              className="h-7 w-7 rounded-full bg-amber-600 hover:bg-amber-500 text-white"
              title="Timer pausieren"
            >
              <Pause size={12} fill="currentColor" />
            </Button>
          )}

          <Button
            onClick={() => handleStop(false)}
            disabled={isStopping}
            size="icon"
            className="h-7 w-7 rounded-full bg-destructive/80 hover:bg-destructive text-destructive-foreground"
            title="Timer stoppen und Zeit erfassen"
          >
            {isStopping ? <Loader2 size={14} className="animate-spin" /> : <Square size={12} fill="currentColor" />}
          </Button>

          <Button
            onClick={handleDiscardTimer}
            disabled={isStopping}
            size="icon"
            variant="ghost"
            className="h-7 w-7 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            title="Timer verwerfen (ohne zu speichern)"
          >
            <Trash2 size={13} />
          </Button>

          <span className={`font-mono font-bold tabular-nums text-sm whitespace-nowrap ${isPaused ? 'text-amber-400 opacity-80' : 'text-emerald-400'}`}>
            {formatTime(elapsed)} {isPaused ? '(Pausiert)' : ''}
          </span>

          <div ref={notePopoverRef} className="relative">
            <button
              onClick={() => setShowNotePopover(!showNotePopover)}
              className={`p-1 rounded transition-colors ${showNotePopover ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <FileText size={14} />
            </button>

            {showNotePopover && (
              <div className="absolute top-full mt-2 right-0 bg-background border border-border rounded-xl p-3 shadow-2xl shadow-black/50 z-50 w-64">
                <div className="flex items-center gap-1.5">
                  <Input
                    placeholder={t('timerbar.note_placeholder')}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSaveNote();
                      }
                    }}
                    className="bg-card border-border text-xs rounded-lg h-8 flex-1"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveNote}
                    className="shrink-0 p-1 text-muted-foreground hover:text-primary transition-colors"
                    title={t('timerbar.toast.note_saved')}
                  >
                    <ArrowUp size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Inactivity Heartbeat Dialog */}
      <Dialog open={heartbeatOpen} onOpenChange={setHeartbeatOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <AlertCircle size={20} />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold">Arbeitest du noch an dieser Aufgabe?</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Inaktivitäts-Heartbeat & Geisterstunden-Schutz
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="p-3 rounded-lg bg-card/60 border border-border space-y-1.5">
              <div className="text-xs text-muted-foreground">Aktive Aufgabe:</div>
              <div className="text-sm font-medium text-foreground truncate">
                {taskTitle || 'Aufgabe'}
              </div>
              <div className="text-xs font-mono text-emerald-400">
                Laufzeit: {formatTime(elapsed)}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
              <span className="text-xs text-muted-foreground">Automatischer Stopp in:</span>
              <span className="font-mono text-sm font-bold text-amber-400">
                {formatCountdown(heartbeatCountdown)} Min.
              </span>
            </div>
          </div>

          <DialogFooter className="flex-row gap-2 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => handleStop(false)}
              disabled={isStopping}
              className="flex-1 sm:flex-initial text-xs border-border"
            >
              {isStopping ? <Loader2 size={14} className="animate-spin" /> : 'Stoppen & Erfassen'}
            </Button>
            <Button
              onClick={handleContinueHeartbeat}
              className="flex-1 sm:flex-initial text-xs bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
            >
              Ja, weiterlaufen lassen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
