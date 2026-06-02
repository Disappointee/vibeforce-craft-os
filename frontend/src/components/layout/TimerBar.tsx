'use client';

import { useEffect, useState, useRef } from 'react';
import { useTimerStore } from '@/lib/store';
import { pb } from '@/lib/pocketbase';
import { Pause, Square, Play, Clock, Loader2, ChevronUp, CalendarClock, ArrowUp, X, GripHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { differenceInSeconds, format, parseISO } from 'date-fns';
import { t } from '@/lib/i18n';
import { Switch } from '@/components/ui/switch';
import { DatePicker } from '@/components/ui/date-picker';
import { TimePicker } from '@/components/ui/time-picker';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

interface TaskOption {
  id: string;
  title: string;
  projectKey: string;
  projectName: string;
  projectId: string;
  clientName?: string;
}

function MentionDropdown({
  show,
  filteredUsers,
  selectedIndex,
  onSelect,
}: {
  show: boolean;
  filteredUsers: Array<{ id: string; name?: string; email: string }>;
  selectedIndex: number;
  onSelect: (user: { id: string; name?: string; email: string }) => void;
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
}: {
  value: string;
  onChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onSave: () => void;
  showSave?: boolean;
}) {
  return (
    <div className="relative flex items-center gap-1">
      <Input
        placeholder={t('timerbar.note_placeholder')}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        className="bg-background border-border text-sm h-9 rounded-xl focus:border-primary/30 w-40 lg:w-56 pr-3"
      />
      {showSave && (
        <button
          type="button"
          onClick={onSave}
          className="shrink-0 p-1.5 text-muted-foreground hover:text-primary transition-colors"
          title="Notiz speichern"
        >
          <ArrowUp size={16} />
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
    isPaused,
    pauseStartTime,
    totalPausedSeconds,
    selectedTaskId,
    isBillable,
    startTimer,
    stopAndSaveTimer,
    saveRunningNote,
    setDescription,
    setPaused,
    setSelectedTaskId,
    setTotalPausedSeconds,
    setBillable,
  } = useTimerStore();

  const [elapsed, setElapsed] = useState(0);
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
  const [users, setUsers] = useState<Array<{ id: string; name?: string; email: string }>>([]);

  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);

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

  useEffect(() => {
    pb.collection('users').getFullList({ fields: 'id,name,email' })
      .then((r: any) => setUsers(r))
      .catch(() => {});
  }, []);

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
    setBottomSheetOpen(false);
  };

  const handleStop = async () => {
    if (!runningTaskId || !startTime) return;
    setIsStopping(true);

    try {
      const durationMinutes = Math.max(1, Math.round(elapsed / 60));
      const savedTitle = taskTitle;

      await stopAndSaveTimer();

      toast.success(`${t('timerbar.toast.stopped')} ${durationMinutes} ${t('timerbar.toast.stopped_unit')} "${savedTitle}"`);
    } catch {
      toast.error(t('timerbar.toast.save_error'));
    } finally {
      setIsStopping(false);
      setBottomSheetOpen(false);
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

  const selectMention = (user: { id: string; name?: string; email: string }) => {
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

  const BillableToggle = (
    <div className="flex items-center gap-2 shrink-0 select-none">
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
    <button
      onClick={() => setShowCustomStart(!showCustomStart)}
      className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-2 rounded-xl transition-all ${
        showCustomStart
          ? 'text-primary bg-primary/10 border border-primary/20'
          : 'text-muted-foreground hover:text-foreground border border-transparent'
      }`}
      title={t('timerbar.title.set_start_time')}
    >
      <CalendarClock size={14} />
    </button>
  );

  const CustomStartFields = (
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
    </div>
  );

  const TaskSelectorDropdown = (
    <div ref={taskDropdownRef} className="relative">
{/* <button
        onClick={() => setShowTaskDropdown(!showTaskDropdown)}
        className="flex items-center gap-2 rounded-xl bg-background border border-border px-3 py-2 text-sm text-left hover:border-border transition-colors min-w-[180px]"
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
      </button> */}

      {showTaskDropdown && (
        <div className="absolute bottom-full mb-3 left-0 w-[340px] rounded-2xl border border-border bg-background shadow-2xl shadow-black/50 overflow-hidden z-50">
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
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition-all flex flex-col gap-1 hover:bg-accent/50 ${
                    selectedTaskId === task.id ? 'bg-primary/10 text-primary' : 'text-muted-foreground'
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

  const hasRunningTimer = !!runningTaskId;

  const MobileMiniBarContent = (
    <div className="sm:hidden flex items-center justify-between w-full gap-2">
      {hasRunningTimer ? (
        <>
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className={`h-2 w-2 rounded-full shrink-0 ${isPaused ? 'bg-muted-foreground' : 'bg-primary animate-pulse'}`} />
            <span className="text-sm font-medium text-foreground truncate">{taskTitle}</span>
          </div>
          <span className={`font-mono font-bold tabular-nums text-base whitespace-nowrap ${isPaused ? 'text-muted-foreground' : 'text-primary'}`}>
            {formatTime(elapsed)}
          </span>
          <Button
            onClick={(e) => { e.stopPropagation(); handleStop(); }}
            disabled={isStopping}
            size="icon"
            className="h-9 w-9 rounded-full bg-destructive/80 hover:bg-destructive text-destructive-foreground shrink-0"
          >
            {isStopping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Square size={16} fill="currentColor" />}
          </Button>
        </>
      ) : (
        <>
{/* <button
            onClick={() => setBottomSheetOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-background border border-border px-3 py-2 text-sm text-left hover:border-border transition-colors min-w-0 flex-1"
          >
            <Clock size={16} className="text-muted-foreground shrink-0" />
            <span className="text-muted-foreground truncate">
              {selectedTask ? (
                <span className="truncate text-foreground">
                  <span className="font-mono text-muted-foreground mr-1.5 text-xs">[{selectedTask.projectKey}]</span>
                  {selectedTask.title}
                </span>
              ) : t('timerbar.task_placeholder')}
            </span>
          </button> */}
          <Button
            onClick={(e) => { e.stopPropagation(); handleStart(); }}
            disabled={!selectedTaskId}
            size="icon"
            className="h-10 w-10 rounded-full bg-primary hover:bg-primary/80 text-primary-foreground shrink-0 shadow-lg shadow-primary/20 ml-auto"
          >
            <Play size={18} fill="currentColor" />
          </Button>
        </>
      )}
    </div>
  );

  const BottomSheetTaskList = (
    <div className="space-y-1.5">
      <div className="p-2">
        <Input
          placeholder={t('timerbar.task_search')}
          value={taskSearch}
          onChange={(e) => setTaskSearch(e.target.value)}
          className="bg-card border-border text-sm rounded-xl"
          autoFocus
        />
      </div>
      <div className="max-h-48 overflow-y-auto p-1">
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
                setTaskSearch('');
              }}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition-all flex flex-col gap-1 hover:bg-accent/50 ${
                selectedTaskId === task.id ? 'bg-primary/10 text-primary' : 'text-muted-foreground'
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
  );

  return (
    <>
      <Sheet open={bottomSheetOpen} onOpenChange={setBottomSheetOpen}>
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
          <div className="flex items-center justify-between px-4 py-2.5 h-14 max-w-screen-2xl mx-auto">
            <div className="hidden sm:flex items-center gap-3 w-full">
              {hasRunningTimer ? (
                <>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`h-2 w-2 rounded-full shrink-0 ${isPaused ? 'bg-muted-foreground' : 'bg-primary animate-pulse'}`} />
                    <span className="text-sm font-medium text-foreground truncate max-w-[160px] lg:max-w-[240px]">
                      {taskTitle}
                    </span>
                  </div>

                  <div className="h-5 w-px bg-border" />

                  <div className="relative">
                    {mentionDropdownEl}
                    <DescriptionInput
                      value={description}
                      onChange={handleDescriptionChange}
                      onKeyDown={handleDescriptionKeyDown}
                      onSave={handleSaveNote}
                      showSave
                    />
                  </div>

                  <div className="h-5 w-px bg-border" />

                  <span className={`font-mono ${isPaused ? 'text-muted-foreground' : 'text-primary'} font-bold tabular-nums text-lg whitespace-nowrap`}>
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
                  </div>
                </>
              ) : (
                <>
                  {TaskSelectorDropdown}

                  <div className="flex items-center gap-2 ml-auto">
                    {BillableToggle}
                    {CustomStartTimePanel}
                    <div className="relative">
                      {mentionDropdownEl}
                      <DescriptionInput
                        value={description}
                        onChange={handleDescriptionChange}
                        onKeyDown={handleDescriptionKeyDown}
                        onSave={handleSaveNote}
                      />
                    </div>
                    {showCustomStart && (
                      <div className="absolute bottom-full mb-2 right-0 bg-background border border-border rounded-2xl p-4 shadow-2xl shadow-black/50 z-50 min-w-[240px]">
                        {CustomStartFields}
                        <button
                          onClick={() => setShowCustomStart(false)}
                          className="w-full text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground py-1 mt-3"
                        >
                          {t('timerbar.done')}
                        </button>
                      </div>
                    )}
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
            </div>

            <button
              className="sm:hidden flex-1 cursor-pointer"
              onClick={() => setBottomSheetOpen(true)}
            >
              {MobileMiniBarContent}
            </button>
          </div>
        </div>

        <SheetContent side="bottom" className="max-h-[85vh] rounded-t-2xl px-0" showCloseButton={false}>
          <div className="flex items-center justify-between px-4 pb-2">
            <GripHorizontal size={20} className="text-muted-foreground/40" />
            <button
              onClick={() => setBottomSheetOpen(false)}
              className="p-1 rounded-full hover:bg-accent/50 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <div className="px-4 pb-6 space-y-5 overflow-y-auto max-h-[calc(85vh-48px)]">
            {hasRunningTimer ? (
              <>
                <SheetHeader className="p-0">
                  <SheetTitle className="text-base">{taskTitle}</SheetTitle>
                </SheetHeader>

                <div className="flex items-center justify-between">
                  <span className={`font-mono font-bold tabular-nums text-2xl ${isPaused ? 'text-muted-foreground' : 'text-primary'}`}>
                    {formatTime(elapsed)}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handlePauseToggle}
                      size="sm"
                      variant="outline"
                      className="rounded-full border-border"
                    >
                      {isPaused ? (
                        <>
                          <Play size={14} className="mr-1" fill="currentColor" />
                          {t('timerbar.title.resume')}
                        </>
                      ) : (
                        <>
                          <Pause size={14} className="mr-1" fill="currentColor" />
                          {t('timerbar.title.pause')}
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={handleStop}
                      disabled={isStopping}
                      size="sm"
                      className="rounded-full bg-destructive/80 hover:bg-destructive text-destructive-foreground"
                    >
                      {isStopping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Square size={14} className="mr-1" fill="currentColor" />}
                      Stop
                    </Button>
                  </div>
                </div>

                {BillableToggle}

                <div className="relative">
                  {mentionDropdownEl}
                  <DescriptionInput
                    value={description}
                    onChange={handleDescriptionChange}
                    onKeyDown={handleDescriptionKeyDown}
                    onSave={handleSaveNote}
                    showSave
                  />
                </div>
              </>
            ) : (
              <>
                <SheetHeader className="p-0">
                  <SheetTitle className="text-base">{t('timerbar.collapsed_label')}</SheetTitle>
                </SheetHeader>

                {BottomSheetTaskList}

                <div className="flex items-center justify-between">
                  {BillableToggle}
                  {CustomStartTimePanel}
                </div>

                {showCustomStart && (
                  <div className="bg-card border border-border rounded-2xl p-4">
                    {CustomStartFields}
                    <button
                      onClick={() => setShowCustomStart(false)}
                      className="w-full text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground py-1 mt-3"
                    >
                      {t('timerbar.done')}
                    </button>
                  </div>
                )}

                <div className="relative">
                  {mentionDropdownEl}
                  <DescriptionInput
                    value={description}
                    onChange={handleDescriptionChange}
                    onKeyDown={handleDescriptionKeyDown}
                    onSave={handleSaveNote}
                  />
                </div>

                <Button
                  onClick={handleStart}
                  disabled={!selectedTaskId}
                  className="w-full rounded-full bg-primary hover:bg-primary/80 text-primary-foreground h-12 text-base font-semibold shadow-lg shadow-primary/20"
                >
                  <Play size={18} className="mr-2" fill="currentColor" />
                  {t('timerbar.collapsed_label')} starten
                </Button>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <div className="sm:hidden h-10" />
    </>
  );
}
