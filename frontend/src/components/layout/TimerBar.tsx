'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useTimerStore } from '@/lib/store';
import { pb } from '@/lib/pocketbase';
import { Pause, Square, Play, Clock, Loader2, ChevronUp, X, MinusSquare, Maximize2, CalendarClock, ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { differenceInSeconds, format, parseISO } from 'date-fns';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { t } from '@/lib/i18n';
import { Switch } from '@/components/ui/switch';
import { DatePicker } from '@/components/ui/date-picker';
import { TimePicker } from '@/components/ui/time-picker';

interface TaskOption {
  id: string;
  title: string;
  projectKey: string;
  projectName: string;
  projectId: string;
  clientName?: string;
}

const STORAGE_KEY = 'vibeforce-timerbar-position';
const DEFAULT_POSITION = { x: 0, y: 0 };

function loadPosition(): { x: number; y: number } {
  if (typeof window === 'undefined') return DEFAULT_POSITION;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
        return parsed;
      }
    }
  } catch {
  }
  return DEFAULT_POSITION;
}

function savePosition(x: number, y: number) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ x, y }));
  } catch {
  }
}

function formatElapsed(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h > 0 ? h + ':' : ''}${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ── Module-level sub-components (extracted to prevent focus loss) ──

function MentionDropdown({
  show,
  filteredUsers,
  selectedIndex,
  onSelect,
}: {
  show: boolean;
  filteredUsers: Array<{id: string; name?: string; email: string}>;
  selectedIndex: number;
  onSelect: (user: {id: string; name?: string; email: string}) => void;
}) {
  if (!show || filteredUsers.length === 0) return null;
  return (
    <div className="absolute bottom-full mb-1 left-0 right-0 bg-background border border-border rounded-xl shadow-xl z-50 max-h-32 overflow-y-auto">
      {filteredUsers.map((user, idx) => (
        <button
          key={user.id}
          onClick={() => onSelect(user)}
          className={`w-full text-left px-3 py-1.5 text-xs ${
            idx === selectedIndex
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:bg-accent/50'
          }`}
        >
          {user.name || user.email}
        </button>
      ))}
    </div>
  );
}

function DescriptionInput({
  value,
  onChange,
  onKeyDown,
  onSave,
  showSave = false,
  inline = true,
  compact = false,
  mentionDropdown,
}: {
  value: string;
  onChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onSave: () => void;
  showSave?: boolean;
  inline?: boolean;
  compact?: boolean;
  mentionDropdown?: React.ReactNode;
}) {
  const sizeClasses = compact
    ? 'text-xs h-8 rounded-xl'
    : 'text-sm h-10 rounded-xl';
  const btnClasses = compact
    ? 'p-1.5 text-muted-foreground hover:text-primary transition-colors'
    : 'p-2 text-muted-foreground hover:text-primary transition-colors bg-card rounded-xl border border-border';
  const iconSize = compact ? 14 : 18;
  const wrapperClasses = inline
    ? 'hidden sm:flex'
    : 'w-full';
  const inputWidth = compact ? 'w-36' : (inline ? 'w-56' : 'w-full');

  return (
    <div className={`relative flex items-center gap-1 ${wrapperClasses}`}>
      <div className="relative flex-1">
        {mentionDropdown}
        <Input
          placeholder={t('timerbar.note_placeholder')}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          className={`bg-background border-border ${sizeClasses} focus:border-primary/30 ${inputWidth} pr-3`}
        />
      </div>
      {showSave && (
        <button
          type="button"
          onClick={onSave}
          className={`shrink-0 ${btnClasses}`}
          title="Notiz speichern"
        >
          <ArrowUp size={iconSize} />
        </button>
      )}
    </div>
  );
}

export function TimerBar() {
  const {
    runningTaskId,
    startTime,
    taskTitle,
    description,
    isCollapsed,
    isPaused,
    pauseStartTime,
    totalPausedSeconds,
    selectedTaskId,
    isBillable,
    startTimer,
    stopTimer,
    stopAndSaveTimer,
    saveRunningNote,
    setDescription,
    setIsCollapsed,
    setPaused,
    setSelectedTaskId,
    setTotalPausedSeconds,
    setBillable,
  } = useTimerStore();
  const [elapsed, setElapsed] = useState(0);
  const isMobile = useIsMobile();
  const [showMobileOverlay, setShowMobileOverlay] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [tasks, setTasks] = useState<TaskOption[]>([]);
  const [taskSearch, setTaskSearch] = useState('');
  const [showTaskDropdown, setShowTaskDropdown] = useState(false);

  const [customStartDate, setCustomStartDate] = useState(
    new Date().toLocaleDateString('de-DE', { timeZone: 'Europe/Berlin' }).split('.').reverse().join('-')
  );
  const [customStartTime, setCustomStartTime] = useState(
    new Date().toLocaleTimeString('de-DE', { timeZone: 'Europe/Berlin', hour: '2-digit', minute: '2-digit' })
  );
  const [showCustomStart, setShowCustomStart] = useState(false);
  const [customStartOffset, setCustomStartOffset] = useState<string>('');
  const taskDropdownRef = useRef<HTMLDivElement>(null);

  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionIndex, setMentionIndex] = useState(-1);
  const [mentionPos, setMentionPos] = useState(-1);
  const [users, setUsers] = useState<Array<{id: string; name?: string; email: string}>>([]);

  const handleOffsetChange = (val: string) => {
    setCustomStartOffset(val);
    const minutes = parseInt(val, 10);
    if (!isNaN(minutes)) {
      if (minutes <= 0) {
        setCustomStartDate(
          new Date().toLocaleDateString('de-DE', { timeZone: 'Europe/Berlin' }).split('.').reverse().join('-')
        );
        setCustomStartTime(
          new Date().toLocaleTimeString('de-DE', { timeZone: 'Europe/Berlin', hour: '2-digit', minute: '2-digit' })
        );
        return;
      }
      const targetDate = new Date(Date.now() - minutes * 60 * 1000);
      setCustomStartDate(
        targetDate.toLocaleDateString('de-DE', { timeZone: 'Europe/Berlin' }).split('.').reverse().join('-')
      );
      setCustomStartTime(targetDate.toTimeString().slice(0, 5));
    }
  };

  // ── Native Drag State ──
  const [dragPos, setDragPos] = useState<{ x: number; y: number }>(DEFAULT_POSITION);
  const dragStartRef = useRef<{ clientX: number; clientY: number; posX: number; posY: number } | null>(null);
  const wasDragRef = useRef(false);

  useEffect(() => {
    const pos = loadPosition();
    setDragPos(pos);
  }, []);

  const handleDragStart = useCallback((e: React.PointerEvent) => {
    if (isMobile) return;
    wasDragRef.current = false;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      posX: dragPos.x,
      posY: dragPos.y,
    };
  }, [isMobile, dragPos]);

  const handleDragMove = useCallback((e: React.PointerEvent) => {
    if (!dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.clientX;
    const dy = e.clientY - dragStartRef.current.clientY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      wasDragRef.current = true;
    }
    if (wasDragRef.current) {
      setDragPos({
        x: dragStartRef.current.posX + dx,
        y: dragStartRef.current.posY + dy,
      });
    }
  }, []);

  const handleDragEnd = useCallback(() => {
    if (wasDragRef.current) {
      savePosition(dragPos.x, dragPos.y);
    }
    dragStartRef.current = null;
  }, [dragPos]);

  // ── Fetch tasks ──
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const result = await pb.collection('tasks').getList(1, 100, {
          sort: '-created',
          expand: 'project,project.client',
          filter: pb.filter("status != {:status}", { status: 'done' }),
        });
        setTasks(result.items.map((task: any) => {
          const project = task.expand?.project;
          const client = project?.expand?.client;
          return {
            id: task.id,
            title: task.title,
            projectKey: project?.key || '—',
            projectName: project?.name || 'Unbekanntes Projekt',
            projectId: project?.id || task.project,
            clientName: client?.name || client?.company || undefined,
          };
        }));
      } catch (error: any) {
        console.error('Failed to fetch tasks:', error);
        const msg = error?.status === 400
          ? 'TimerBar: PocketBase-Filter fehlerhaft — bitte Admin kontaktieren'
          : error?.status === 404
            ? 'TimerBar: Aufgaben-Collection existiert nicht'
            : error?.status === 403
              ? 'TimerBar: Keine Berechtigung für Aufgaben'
              : `TimerBar-Fehler (${error?.status || 'Netzwerk'}): Aufgaben konnten nicht geladen werden`;
        toast.error(msg);
      }
    };
    fetchTasks();
  }, []);

  // ── Fetch users for @-mentions ──
  useEffect(() => {
    pb.collection('users').getFullList({ fields: 'id,name,email' })
      .then((r: any) => setUsers(r))
      .catch(() => {});
  }, []);

  // ── Billable default from client ──
  useEffect(() => {
    const fetchBillableDefault = async () => {
      if (!selectedTaskId) return;
      const task = tasks.find(t => t.id === selectedTaskId);
      if (!task?.projectId) return;

      try {
        const project = await pb.collection('projects').getOne(task.projectId, {
          expand: 'client',
        });
        const client = (project as any).expand?.client;
        if (client && typeof client.abrechenbar === 'boolean') {
          setBillable(client.abrechenbar);
        } else {
          setBillable(true);
        }
      } catch (error: any) {
        console.error('Failed to fetch project/client for billable default:', error);
        setBillable(true);
        if (error?.status === 400 || error?.status === 404) {
          toast.error('Projekt-Daten für Abrechenbarkeit konnten nicht geladen werden');
        }
      }
    };
    fetchBillableDefault();
  }, [selectedTaskId, tasks, setBillable]);

  // ── Elapsed time ticker ──
  useEffect(() => {
    if (!runningTaskId || !startTime || isPaused) return;

    const interval = setInterval(() => {
      const seconds = differenceInSeconds(new Date(), parseISO(startTime)) - totalPausedSeconds;
      setElapsed(Math.max(0, seconds));
    }, 1000);

    return () => clearInterval(interval);
  }, [runningTaskId, startTime, isPaused, totalPausedSeconds]);

  // ── Reload during pause: calculate elapsed before pause ──
  useEffect(() => {
    const state = useTimerStore.getState();
    if (state.isPaused && state.startTime && state.pauseStartTime) {
      const start = new Date(state.startTime).getTime();
      const pauseStart = new Date(state.pauseStartTime).getTime();
      const elapsedBeforePause = Math.floor((pauseStart - start) / 1000) - state.totalPausedSeconds;
      setElapsed(Math.max(0, elapsedBeforePause));
    }
  }, []);

  // ── Click outside dropdown ──
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (taskDropdownRef.current && !taskDropdownRef.current.contains(e.target as Node)) {
        setShowTaskDropdown(false);
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

  const handlePauseToggle = () => {
    if (isPaused) {
      if (pauseStartTime) {
        const pausedDuration = differenceInSeconds(new Date(), parseISO(pauseStartTime));
        setTotalPausedSeconds(totalPausedSeconds + pausedDuration);
      }
      setPaused(false, null);
      toast.info(t('timerbar.toast.resumed'));
    } else {
      const pauseTime = new Date().toISOString();
      setPaused(true, pauseTime);
      toast.info(t('timerbar.toast.paused'));
    }
  };

  const handleStart = async () => {
    if (!selectedTaskId) {
      toast.error(t('timerbar.toast.select_task'));
      return;
    }
    const task = tasks.find(t => t.id === selectedTaskId);
    if (!task) return;

    if (showCustomStart && customStartDate && customStartTime) {
      const dateObj = new Date(`${customStartDate}T${customStartTime}:00`);
      if (isNaN(dateObj.getTime())) {
        toast.error('Ungültiges Datum/Zeit');
        return;
      }
      if (dateObj > new Date()) {
        toast.error('Startzeit kann nicht in der Zukunft liegen');
        return;
      }
      const customStartISO = dateObj.toISOString();
      await startTimer(task.id, task.title, description, customStartISO);
      toast.success(`${t('timerbar.toast.started')} ${task.title} (${t('timerbar.toast.started_at')} ${customStartTime})`);
    } else {
      await startTimer(task.id, task.title, description);
      toast.success(`${t('timerbar.toast.started')} ${task.title}`);
    }

    setShowTaskDropdown(false);
    setShowCustomStart(false);
    setShowMobileOverlay(false);
  };

  const handleStop = async () => {
    if (!runningTaskId || !startTime) return;
    setIsStopping(true);

    try {
      const durationMinutes = Math.max(1, Math.round(elapsed / 60));
      const savedTitle = taskTitle;

      await stopAndSaveTimer();

      toast.success(`${t('timerbar.toast.stopped')} ${durationMinutes} ${t('timerbar.toast.stopped_unit')} "${savedTitle}"`);
      setShowMobileOverlay(false);
    } catch {
      toast.error(t('timerbar.toast.save_error'));
    } finally {
      setIsStopping(false);
    }
  };

  const handleDescriptionChange = (value: string) => {
    setDescription(value);
    const atIndex = value.lastIndexOf('@');
    if (atIndex >= 0) {
      const afterAt = value.slice(atIndex + 1);
      if (afterAt.length > 0 && !afterAt.includes(' ') && !afterAt.includes('\n')) {
        setMentionPos(atIndex);
        setMentionSearch(afterAt);
        setShowMentionDropdown(true);
        setMentionIndex(0);
        return;
      }
    }
    setShowMentionDropdown(false);
    setMentionIndex(-1);
  };

  const selectMention = (user: {id: string; name?: string; email: string}) => {
    const before = description.slice(0, mentionPos);
    const after = description.slice(mentionPos + 1 + mentionSearch.length);
    const mentionText = `@${user.name || user.email}`;
    setDescription(before + mentionText + after);
    setShowMentionDropdown(false);
    setMentionIndex(-1);
  };

  const handleSaveNote = async () => {
    if (!runningTaskId) {
      console.warn('Cannot save note: no running time entry');
      toast.error(t('timerbar.toast.note_save_error'));
      return;
    }
    try {
      await saveRunningNote();
      setDescription('');
      toast.success(t('timerbar.toast.note_saved'));
    } catch {
      toast.error(t('timerbar.toast.note_save_error'));
    }
  };

  const handleDescriptionKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showMentionDropdown) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionIndex(prev => Math.min(prev + 1, mentionFilteredUsers.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (mentionIndex >= 0 && mentionIndex < mentionFilteredUsers.length) {
          selectMention(mentionFilteredUsers[mentionIndex]);
        }
        // After selecting mention, save note and clear input
        if (runningTaskId) {
          await saveRunningNote();
          setDescription('');
        }
      } else if (e.key === 'Escape') {
        setShowMentionDropdown(false);
        setMentionIndex(-1);
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (runningTaskId) {
        await handleSaveNote();
      }
    }
  };

  const filteredTasks = tasks.filter(t =>
    t.title.toLowerCase().includes(taskSearch.toLowerCase()) ||
    t.projectKey.toLowerCase().includes(taskSearch.toLowerCase())
  );

  const selectedTask = tasks.find(t => t.id === selectedTaskId);

  const mentionFilteredUsers = users.filter(u =>
    (u.name || u.email).toLowerCase().includes(mentionSearch.toLowerCase())
  ).slice(0, 5);

  const mentionDropdownEl = (
    <MentionDropdown
      show={showMentionDropdown}
      filteredUsers={mentionFilteredUsers}
      selectedIndex={mentionIndex}
      onSelect={selectMention}
    />
  );

  // ─────────────────────────────────────────────
  // Shared sub-components
  // ─────────────────────────────────────────────

  const TaskSelectorDropdown = (
    <div ref={taskDropdownRef} className="relative flex-1">
      <button
        onClick={() => setShowTaskDropdown(!showTaskDropdown)}
        className="flex items-center gap-2 w-full rounded-xl bg-background border border-border px-4 py-2 text-sm text-left hover:border-border transition-colors"
      >
        <Clock size={16} className="text-muted-foreground shrink-0" />
        <span className={selectedTask ? 'text-foreground' : 'text-muted-foreground'}>
          {selectedTask ? (
            <span className="truncate">
              <span className="font-mono text-muted-foreground mr-1.5 text-xs">[{selectedTask.projectKey}]</span>
              {selectedTask.clientName ? `${selectedTask.clientName}: ` : ''}
              {selectedTask.title}
            </span>
          ) : t('timerbar.task_placeholder')}
        </span>
        <ChevronUp size={16} className="text-muted-foreground ml-auto shrink-0" />
      </button>

      {showTaskDropdown && (
        <div className="absolute bottom-full mb-3 left-0 right-0 sm:w-auto sm:min-w-[340px] rounded-2xl border border-border bg-background shadow-2xl shadow-black/50 overflow-hidden z-50">
          <div className="p-3 border-b border-border">
            <Input
              placeholder={t('timerbar.task_search')}
              value={taskSearch}
              onChange={(e) => setTaskSearch(e.target.value)}
              className="bg-card border-border text-sm rounded-xl"
              autoFocus
            />
          </div>
          <div className="max-h-64 overflow-y-auto p-1">
            {filteredTasks.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground italic flex flex-col items-center gap-2">
                <span>{t('timerbar.no_tasks')}</span>
                <a href="/tasks" className="text-xs text-primary hover:underline">
                  Aufgaben verwalten →
                </a>
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
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition-all flex flex-col gap-1 hover:bg-accent/50 ${selectedTaskId === task.id ? 'bg-primary/10 text-primary' : 'text-muted-foreground'
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold tracking-wider text-primary/70 bg-primary/5 border border-primary/10 px-2 py-0.5 rounded-md shrink-0">
                      {task.projectKey}
                    </span>
                    <span className="truncate font-medium text-foreground">{task.title}</span>
                  </div>
                  {task.clientName && (
                    <span className="text-[10px] text-muted-foreground ml-1.5">
                      Kunde: {task.clientName} ({task.projectName})
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );

  const BillableToggle = (
    <div className="flex items-center gap-2 shrink-0 select-none px-2">
      <Switch
        id="timerbar-billable-switch"
        checked={isBillable}
        onCheckedChange={setBillable}
      />
      <label
        htmlFor="timerbar-billable-switch"
        className={`text-xs font-semibold cursor-pointer transition-colors ${
          isBillable ? 'text-primary' : 'text-muted-foreground'
        }`}
      >
        {isBillable ? t('timerbar.billable') : t('timerbar.internal')}
      </label>
    </div>
  );

  const CustomStartTimePanel = (
    <div className="relative">
      <button
        onClick={() => setShowCustomStart(!showCustomStart)}
        className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-2 rounded-xl transition-all ${showCustomStart
          ? 'text-primary bg-primary/10 border border-primary/20'
          : 'text-muted-foreground hover:text-foreground border border-transparent'
          }`}
        title={t('timerbar.title.set_start_time')}
      >
        <CalendarClock size={14} />
      </button>
      {showCustomStart && (
        <div className="absolute bottom-full mb-2 right-0 bg-background border border-border rounded-2xl p-4 shadow-2xl shadow-black/50 z-50 min-w-[240px]">
          <div className="space-y-3">
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {t('timerbar.backdate_title')}
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Offset (Minuten vor jetzt)</label>
              <Input
                type="number"
                placeholder="z.B. 15"
                value={customStartOffset}
                onChange={(e) => handleOffsetChange(e.target.value)}
                className="bg-card border-border text-sm rounded-xl h-9"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider">{t('timerbar.date_label')}</label>
              <DatePicker
                value={customStartDate ? new Date(customStartDate) : undefined}
                onChange={(date) => setCustomStartDate(date ? format(date, 'yyyy-MM-dd') : '')}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider">{t('timerbar.time_label')}</label>
              <TimePicker
                value={customStartTime}
                onChange={setCustomStartTime}
              />
            </div>
            <button
              onClick={() => setShowCustomStart(false)}
              className="w-full text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground py-1"
            >
              {t('timerbar.done')}
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const DragHandle = () => (
    <div
      onPointerDown={handleDragStart}
      onPointerMove={handleDragMove}
      onPointerUp={handleDragEnd}
      onPointerCancel={handleDragEnd}
      className={`p-1 text-muted-foreground shrink-0 ${!isMobile ? 'cursor-grab active:cursor-grabbing' : ''}`}
    >
      <div className="grid grid-cols-2 gap-0.5">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="w-1 h-1 bg-current rounded-full" />
        ))}
      </div>
    </div>
  );

  const MinimizeButton = ({ className = '' }: { className?: string }) => (
    <button
      onClick={() => setIsCollapsed(true)}
      className={`p-2 text-muted-foreground hover:text-foreground transition-colors ${className}`}
      title={t('timerbar.title.minimize')}
    >
      <MinusSquare size={18} />
    </button>
  );

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────

  // ── Mobile: FAB (Floating Action Button) ──
  const mobileFAB = (
    <button
      onClick={() => setShowMobileOverlay(true)}
      className="sm:hidden fixed bottom-20 right-4 z-50 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center transition-all active:scale-95"
    >
      {runningTaskId ? (
        <Clock size={22} className={isPaused ? '' : 'animate-pulse'} />
      ) : (
        <Play size={22} />
      )}
    </button>
  );

  // ── Mobile: Fullscreen Overlay ──
  const mobileOverlay = showMobileOverlay && (
    <div className="sm:hidden fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center p-8">
      <button
        onClick={() => setShowMobileOverlay(false)}
        className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <X size={24} />
      </button>

      {runningTaskId ? (
        <div className="flex flex-col items-center gap-8">
          <p className="text-sm text-muted-foreground font-medium">{taskTitle}</p>
          <p className="text-6xl font-bold text-foreground tabular-nums font-mono">
            {formatTime(elapsed)}
          </p>
          <div className="flex items-center gap-2 w-full max-w-xs">
            <DescriptionInput
              value={description}
              onChange={handleDescriptionChange}
              onKeyDown={handleDescriptionKeyDown}
              onSave={handleSaveNote}
              inline={false}
              showSave
              compact={false}
              mentionDropdown={mentionDropdownEl}
            />
          </div>
          <div className="flex items-center gap-4">
            <Button
              onClick={handlePauseToggle}
              size="icon"
              className="h-14 w-14 rounded-full bg-accent hover:bg-accent/80 text-foreground"
            >
              {isPaused ? <Play size={24} fill="currentColor" /> : <Pause size={24} fill="currentColor" />}
            </Button>
            <Button
              onClick={handleStop}
              disabled={isStopping}
              size="icon"
              className="h-14 w-14 rounded-full bg-destructive/80 hover:bg-destructive text-destructive-foreground"
            >
              {isStopping ? <Loader2 className="h-6 w-6 animate-spin" /> : <Square size={20} fill="currentColor" />}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 text-muted-foreground w-full max-w-sm">
          <Clock size={48} className="mb-2" />
          <p className="text-lg font-medium text-foreground">{t('timerbar.timer_inactive')}</p>
          <p className="text-sm">{t('timerbar.select_task_hint')}</p>
          <div className="w-full mt-4 space-y-3">
            {TaskSelectorDropdown}
            <div className="flex items-center gap-2 justify-center pt-2">
              {BillableToggle}
              {CustomStartTimePanel}
            </div>
            <div className="flex justify-center">
              <DescriptionInput
                value={description}
                onChange={handleDescriptionChange}
                onKeyDown={handleDescriptionKeyDown}
                onSave={handleSaveNote}
                inline={false}
                mentionDropdown={mentionDropdownEl}
              />
            </div>
            <Button
              onClick={handleStart}
              disabled={!selectedTaskId}
              className="w-full h-12 rounded-full bg-primary hover:bg-primary/80 text-primary-foreground font-bold shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Play size={18} fill="currentColor" />
              {t('timerbar.collapsed_label')} starten
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  // ── Desktop: Collapsed floating pill ──
  const desktopCollapsed = isCollapsed && !isMobile && (
    <button
      onPointerDown={handleDragStart}
      onPointerMove={handleDragMove}
      onPointerUp={handleDragEnd}
      onPointerCancel={handleDragEnd}
      onClick={() => {
        if (!wasDragRef.current) setIsCollapsed(false);
      }}
      style={{ transform: `translate(${dragPos.x}px, ${dragPos.y}px)` }}
      className="hidden sm:flex fixed bottom-6 right-6 z-50 items-center gap-3 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-3 rounded-full shadow-2xl font-bold transition-all group cursor-grab active:cursor-grabbing select-none touch-none max-w-[calc(100vw-1rem)]"
    >
      <div className="relative">
        <Clock size={20} className={runningTaskId && !isPaused ? 'animate-pulse' : ''} />
        {runningTaskId && !isPaused && <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary-foreground rounded-full" />}
      </div>
      <span className="tabular-nums">
        {runningTaskId ? formatTime(elapsed) : t('timerbar.collapsed_label')}
      </span>
      <Maximize2 size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );

  // ── Desktop: Expanded bar ──
  const desktopExpanded = !isCollapsed && !isMobile && (
    <div
      style={{ left: '50%', transform: `translate(calc(-50% + ${dragPos.x}px), ${dragPos.y}px)` }}
      className={`hidden sm:block fixed bottom-6 z-50 max-w-[calc(100vw-1rem)] ${!isMobile ? 'cursor-default' : ''}`}
    >
      <div className="bg-card/95 border border-border shadow-2xl shadow-black/50 rounded-2xl px-5 py-3 pb-8 flex items-center gap-4 backdrop-blur-xl w-full sm:min-w-[500px] max-w-[calc(100vw-2rem)] sm:max-w-none">
        <DragHandle />

        {runningTaskId ? (
          <>
            <div className="flex items-center gap-3 min-w-0 flex-1 sm:flex-initial">
              <div className={`h-2 w-2 rounded-full ${isPaused ? 'bg-muted-foreground' : 'bg-primary animate-pulse'} shrink-0`} />
              <span className="text-sm font-medium text-foreground truncate max-w-[120px] sm:max-w-[200px]">{taskTitle}</span>
            </div>

            <div className="h-5 w-px bg-border hidden sm:block" />

            <div className="hidden md:flex items-center gap-1">
              <DescriptionInput
                value={description}
                onChange={handleDescriptionChange}
                onKeyDown={handleDescriptionKeyDown}
                onSave={handleSaveNote}
                showSave
                compact
                mentionDropdown={mentionDropdownEl}
              />
            </div>

            <div className="h-5 w-px bg-border hidden md:block" />

            <span className={`font-mono ${isPaused ? 'text-muted-foreground' : 'text-primary'} font-bold tabular-nums text-lg`}>
              {formatTime(elapsed)}
            </span>

            <div className="flex items-center gap-2 ml-auto">
              <Button
                onClick={handlePauseToggle}
                size="icon"
                variant="ghost"
                className="h-9 w-9 rounded-full hover:bg-accent/50 text-muted-foreground hover:text-foreground"
                title={isPaused ? t('timerbar.title.resume') : t('timerbar.title.pause')}
              >
                {isPaused ? <Play size={18} fill="currentColor" /> : <Pause size={18} fill="currentColor" />}
              </Button>

              <Button
                onClick={handleStop}
                disabled={isStopping}
                size="icon"
                className="h-9 w-9 rounded-full bg-destructive/80 hover:bg-destructive text-destructive-foreground shrink-0 shadow-lg shadow-destructive/20"
              >
                {isStopping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Square size={16} fill="currentColor" />}
              </Button>

              <div className="h-5 w-px bg-border mx-1" />

              <MinimizeButton />
            </div>
          </>
        ) : (
          <>
            {TaskSelectorDropdown}
            <div className="flex items-center gap-2 ml-auto sm:ml-0">
              {BillableToggle}
              {CustomStartTimePanel}
              <DescriptionInput
                value={description}
                onChange={handleDescriptionChange}
                onKeyDown={handleDescriptionKeyDown}
                onSave={handleSaveNote}
                mentionDropdown={mentionDropdownEl}
              />
              <MinimizeButton className="hidden sm:block" />
              <Button
                onClick={handleStart}
                disabled={!selectedTaskId}
                size="icon"
                className="h-10 w-10 rounded-full bg-primary hover:bg-primary/80 text-primary-foreground shrink-0 shadow-lg shadow-primary/20 transition-all active:scale-95"
              >
                <Play size={18} fill="currentColor" />
              </Button>
            </div>
          </>
        )}

        <div className="absolute bottom-0 left-0 right-0 px-5 py-1 bg-primary/5 border-t border-primary/10">
          <p className="text-[10px] text-primary/70 text-center tracking-wide">
            {t('timerbar.zeroclaw_active')}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {mobileFAB}
      {mobileOverlay}
      {desktopCollapsed}
      {desktopExpanded}
    </>
  );
}
