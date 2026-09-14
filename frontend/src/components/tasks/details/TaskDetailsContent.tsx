import React, { useState } from 'react';
import { pb } from '@/lib/pocketbase';
import { Loader2, Play, GripVertical, MessageSquare, Paperclip, Download, Upload, Clock, Square, Link2, Trash2, CheckSquare, ListTodo, Plus, Check, X } from 'lucide-react';
import { TaskType, TaskFileRecord } from '@/lib/pocketbase-types';
import { TaskComments } from '@/components/tasks/TaskComments';
import { decodeGermanHtmlEntities } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { useTaskDetails } from '@/hooks/useTaskDetails';
import { toast } from 'sonner';

const TASK_TYPE_LABELS: Record<TaskType, string> = {
  sea: 'SEA',
  social_ads: 'Social Ads',
  tracking: 'Tracking',
  seo: 'SEO',
  content: 'Content',
  design: 'Design',
  development: 'Entwicklung',
  consulting: 'Beratung',
  other: 'Sonstiges',
};

const TASK_TYPE_COLORS: Record<TaskType, string> = {
  sea: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10',
  social_ads: 'text-blue-400 border-blue-500/20 bg-blue-500/10',
  tracking: 'text-amber-400 border-amber-500/20 bg-amber-500/10',
  seo: 'text-purple-400 border-purple-500/20 bg-purple-500/10',
  content: 'text-rose-400 border-rose-500/20 bg-rose-500/10',
  design: 'text-pink-400 border-pink-500/20 bg-pink-500/10',
  development: 'text-cyan-400 border-cyan-500/20 bg-cyan-500/10',
  consulting: 'text-orange-400 border-orange-500/20 bg-orange-500/10',
  other: 'text-muted-foreground border-zinc-500/20 bg-zinc-500/10',
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatMinutes(totalMin: number): string {
  if (!totalMin || totalMin <= 0) return '0m';
  const hours = Math.floor(totalMin / 60);
  const mins = Math.round(totalMin % 60);
  if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h`;
  return `${mins}m`;
}

function parseMinutesInput(input: string): number {
  if (!input) return 0;
  const str = input.trim().toLowerCase();

  const combinedMatch = str.match(/^(\d+(?:\.\d+)?)\s*h\s*(\d+)?\s*m?$/);
  if (combinedMatch) {
    const hours = parseFloat(combinedMatch[1]) || 0;
    const mins = parseFloat(combinedMatch[2]) || 0;
    return Math.round(hours * 60 + mins);
  }

  if (str.endsWith('h')) {
    const hours = parseFloat(str.replace('h', '').trim());
    return isNaN(hours) ? 0 : Math.round(hours * 60);
  }

  const cleanNum = parseFloat(str.replace('m', '').trim());
  return isNaN(cleanNum) ? 0 : Math.round(cleanNum);
}

const getPriorityColor = (p: string) => {
  switch (p) {
    case 'acute': return 'text-red-400 font-semibold';
    case 'high': return 'text-orange-400 font-semibold';
    case 'medium': return 'text-blue-400 font-semibold';
    default: return 'text-muted-foreground';
  }
};

const getFileUrl = (fileRecord: TaskFileRecord) => {
  return pb.files.getURL(fileRecord as unknown as Record<string, any>, fileRecord.file, { thumb: '' });
};

interface TaskDetailsContentProps {
  taskId: string | null;
  projectKey: string;
  onClose: () => void;
  onTaskUpdated: () => void;
  onTaskClick?: (taskId: string) => void;
  headerControls?: React.ReactNode;
}

export function TaskDetailsContent({ taskId, projectKey, onClose, onTaskUpdated, onTaskClick, headerControls }: TaskDetailsContentProps) {
  const taskDetails = useTaskDetails(taskId, onClose, onTaskUpdated);
  const [customTypeMode, setCustomTypeMode] = useState(false);
  const [customStatusMode, setCustomStatusMode] = useState(false);
  const [newChecklistTitle, setNewChecklistTitle] = useState('');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [showManualTimeForm, setShowManualTimeForm] = useState(false);
  const [manualTimeInput, setManualTimeInput] = useState('');
  const [manualTimeNote, setManualTimeNote] = useState('');

  if (taskDetails.isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full min-h-[300px]">
        <Loader2 className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!taskDetails.task) {
    return null;
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 h-full w-full bg-background/95 backdrop-blur-md overflow-x-hidden">
      {/* Header Bar */}
      <div className="p-5 sm:p-6 border-b border-border/40 bg-card/10 shrink-0 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-medium text-muted-foreground bg-card/80 px-3 py-1 rounded-lg border border-border/60 shadow-xs">
              {projectKey}{taskId ? `-${taskId.substring(0, 4).toUpperCase()}` : ''}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {taskDetails.runningTaskId === taskId ? (
              <Button
                type="button"
                onClick={async () => {
                  taskDetails.isStoppingTimer = true;
                  try {
                    await taskDetails.stopAndSaveTimer();
                    toast.success('Timer gestoppt und Zeit erfasst');
                  } catch {
                    toast.error('Fehler beim Speichern der Zeit');
                  } finally {
                    taskDetails.isStoppingTimer = false;
                  }
                }}
                disabled={taskDetails.isStoppingTimer}
                variant="destructive"
                size="sm"
                className="rounded-full h-8 px-4 font-medium"
              >
                {taskDetails.isStoppingTimer ? (
                  <Loader2 size={14} className="mr-2 animate-spin" />
                ) : (
                  <Square size={14} className="mr-2" fill="currentColor" />
                )}
                Timer stoppen
              </Button>
            ) : (
              <Button
                type="button"
                onClick={async () => {
                  try {
                    await taskDetails.startTimer(taskId!, taskDetails.title);
                    toast.success('Timer gestartet');
                  } catch {
                    toast.error('Fehler beim Starten des Timers');
                  }
                }}
                variant="outline"
                size="sm"
                className="rounded-full h-8 px-4 border-indigo-500/50 text-indigo-400 hover:bg-indigo-500/10 font-medium"
              >
                <Play size={14} className="mr-2" fill="currentColor" />
                Timer starten
              </Button>
            )}

            {headerControls}

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-card border border-transparent hover:border-border/50"
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/tasks?taskId=${taskId}`);
                toast.success('Task-Link kopiert');
              }}
              title="Link kopieren"
            >
              <Link2 size={14} />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full text-muted-foreground hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-border/50"
              onClick={() => {
                if (confirm('Möchtest du diese Aufgabe wirklich löschen?')) {
                  taskDetails.handleDeleteTask();
                }
              }}
              disabled={taskDetails.isDeletingTask}
              title="Aufgabe löschen"
            >
              {taskDetails.isDeletingTask ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            </Button>
          </div>
        </div>

        {/* Title Input */}
        <Input
          value={taskDetails.title}
          onChange={(e) => taskDetails.setTitle(e.target.value)}
          className="text-xl sm:text-2xl font-bold tracking-tight bg-transparent border-b border-transparent hover:border-border/30 focus-visible:border-primary/50 focus-visible:ring-0 transition-colors px-0 py-1 rounded-none text-foreground placeholder:text-muted-foreground/45 w-full min-w-0"
          placeholder="Aufgabentitel..."
        />
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 space-y-6 p-5 sm:p-6">
        {/* Sticky Jump Navigation Bar */}
        <div className="flex flex-wrap gap-1.5 py-2.5 px-4 shrink-0 rounded-2xl border border-border/30 bg-card/20 sticky top-0 backdrop-blur-md z-10">
          {[
            { id: 'details', label: 'Details' },
            { id: 'termine-aufwand', label: 'Termine & Aufwand' },
            { id: 'beschreibung', label: 'Beschreibung' },
            { id: 'checkliste', label: 'Checkliste & Subtasks' },
            { id: 'dateien', label: 'Dateien' },
            { id: 'kommentare', label: 'Kommentare' },
          ].map(item => (
            <button
              type="button"
              key={item.id}
              onClick={() => document.getElementById(`section-${item.id}`)?.scrollIntoView({ behavior: 'smooth' })}
              className="text-[11px] font-semibold px-3 py-1 rounded-full bg-card/65 border border-border/60 text-muted-foreground hover:text-foreground hover:bg-card transition-all cursor-pointer"
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* 1. Meta Attributes Hero Card */}
        <div id="section-details" className="bg-card/25 p-5 rounded-2xl border border-border/40 backdrop-blur-xs space-y-4">
          <h3 className="text-foreground font-semibold text-xs uppercase tracking-wider pb-2 border-b border-border/30 flex items-center gap-2">
            <GripVertical size={13} className="text-muted-foreground/70" />
            Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Status */}
            <div className="space-y-1.5 min-w-0">
              <Label className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold">Status</Label>
              {customStatusMode ? (
                <Input 
                  autoFocus
                  placeholder="Neuer Status..."
                  className="h-9 text-xs"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const val = e.currentTarget.value.trim();
                      if (val) taskDetails.setStatus(val);
                      setCustomStatusMode(false);
                    } else if (e.key === 'Escape') {
                      setCustomStatusMode(false);
                    }
                  }}
                  onBlur={(e) => {
                    const val = e.currentTarget.value.trim();
                    if (val) taskDetails.setStatus(val);
                    setCustomStatusMode(false);
                  }}
                />
              ) : (
                <Select value={taskDetails.status} onValueChange={(val) => {
                  if (val === '_custom') setCustomStatusMode(true);
                  else taskDetails.setStatus(val);
                }}>
                  <SelectTrigger className="bg-background/50 border-border h-9 w-full rounded-lg transition-colors hover:bg-card/50 text-xs font-medium min-w-0">
                    <SelectValue className="truncate">
                      {({todo: 'Offen', in_progress: 'In Arbeit', review: 'Prüfung', done: 'Erledigt'} as Record<string, string>)[taskDetails.status] || taskDetails.status}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-background border-border text-foreground z-[1001]">
                    <SelectItem value="todo">Offen</SelectItem>
                    <SelectItem value="in_progress">In Arbeit</SelectItem>
                    <SelectItem value="review">Prüfung</SelectItem>
                    <SelectItem value="done">Erledigt</SelectItem>
                    {!['todo', 'in_progress', 'review', 'done', ''].includes(taskDetails.status) && (
                      <SelectItem value={taskDetails.status}>{taskDetails.status}</SelectItem>
                    )}
                    <SelectItem value="_custom" className="text-indigo-400 font-semibold">+ Neu erstellen...</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Priority */}
            <div className="space-y-1.5 min-w-0">
              <Label className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold">Priorität</Label>
              <Select value={taskDetails.priority} onValueChange={(val) => val && taskDetails.setPriority(val)}>
                <SelectTrigger className={`bg-background/50 border-border h-9 w-full rounded-lg transition-colors hover:bg-card/50 text-xs font-medium min-w-0 ${getPriorityColor(taskDetails.priority)}`}>
                  <SelectValue className="truncate">
                    {({low: 'Niedrig', medium: 'Mittel', high: 'Hoch', acute: 'Akut'} as Record<string, string>)[taskDetails.priority] || taskDetails.priority}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-background border-border text-foreground z-[1001]">
                  <SelectItem value="low">Niedrig</SelectItem>
                  <SelectItem value="medium">Mittel</SelectItem>
                  <SelectItem value="high">Hoch</SelectItem>
                  <SelectItem value="acute" className="text-red-400 font-semibold">Akut</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Art / Typ */}
            <div className="space-y-1.5 min-w-0">
              <Label className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold">Art</Label>
              {customTypeMode ? (
                <Input 
                  autoFocus
                  placeholder="Neue Art..."
                  className="h-9 text-xs"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const val = e.currentTarget.value.trim();
                      if (val) taskDetails.setTaskType(val as any);
                      setCustomTypeMode(false);
                    } else if (e.key === 'Escape') {
                      setCustomTypeMode(false);
                    }
                  }}
                  onBlur={(e) => {
                    const val = e.currentTarget.value.trim();
                    if (val) taskDetails.setTaskType(val as any);
                    setCustomTypeMode(false);
                  }}
                />
              ) : (
                <Select value={taskDetails.taskType} onValueChange={(val) => {
                  if (val === '_custom') setCustomTypeMode(true);
                  else taskDetails.setTaskType(val as any);
                }}>
                  <SelectTrigger className={`bg-background/50 border-border h-9 w-full rounded-lg transition-colors hover:bg-card/50 text-xs font-medium min-w-0 ${taskDetails.taskType ? TASK_TYPE_COLORS[taskDetails.taskType as any]?.split(' ')[0] || '' : ''}`}>
                    <SelectValue className="truncate">
                      {TASK_TYPE_LABELS[taskDetails.taskType as any] || taskDetails.taskType}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-background border-border text-foreground z-[1001]">
                    {(Object.keys(TASK_TYPE_LABELS)).map((key) => (
                      <SelectItem key={key} value={key}>
                        {TASK_TYPE_LABELS[key as any]}
                      </SelectItem>
                    ))}
                    {!Object.keys(TASK_TYPE_LABELS).includes(taskDetails.taskType) && taskDetails.taskType !== '' && (
                      <SelectItem value={taskDetails.taskType}>{taskDetails.taskType}</SelectItem>
                    )}
                    <SelectItem value="_custom" className="text-indigo-400 font-semibold">+ Neu erstellen...</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Assignee */}
            <div className="space-y-1.5 min-w-0">
              <Label className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold">Verantwortlich</Label>
              <Select value={taskDetails.assigneeId || 'unassigned'} onValueChange={(val) => taskDetails.setAssigneeId(val === 'unassigned' ? null : val)}>
                <SelectTrigger className="bg-background/50 border-border h-9 w-full rounded-lg transition-colors hover:bg-card/50 text-xs font-medium min-w-0">
                  <SelectValue className="truncate">
                    {!taskDetails.assigneeId || taskDetails.assigneeId === 'unassigned' ? 'Niemand zugewiesen' : decodeGermanHtmlEntities(taskDetails.allUsers.find(u => u.id === taskDetails.assigneeId)?.name || taskDetails.allUsers.find(u => u.id === taskDetails.assigneeId)?.email || taskDetails.assigneeId)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-background border-border text-foreground z-[1001]">
                  <SelectItem value="unassigned">Nicht zugewiesen</SelectItem>
                  {taskDetails.allUsers.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {decodeGermanHtmlEntities(u.name || u.email)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* 2. Termine & Aufwand Row */}
        <div id="section-termine-aufwand" className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Dates Card */}
          <div className="bg-card/25 p-5 rounded-2xl border border-border/40 backdrop-blur-xs space-y-4">
            <h3 className="text-foreground font-semibold text-xs uppercase tracking-wider pb-2 border-b border-border/30 flex items-center gap-2">
              <Clock size={13} className="text-muted-foreground/70" />
              Termine
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 min-w-0">
                <Label className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold">Startdatum</Label>
                <DateTimePicker
                  value={taskDetails.startDate}
                  onChange={taskDetails.setStartDate}
                  placeholder="Startdatum"
                />
              </div>

              <div className="space-y-1.5 min-w-0">
                <Label className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold">Fälligkeit</Label>
                <DateTimePicker
                  value={taskDetails.dueDate}
                  onChange={taskDetails.setDueDate}
                  placeholder="Fälligkeit"
                />
              </div>
            </div>
          </div>

          {/* Effort & Time Tracking Card */}
          <div className="bg-card/25 p-5 rounded-2xl border border-border/40 backdrop-blur-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border/30">
              <h3 className="text-foreground font-semibold text-xs uppercase tracking-wider flex items-center gap-2">
                <Clock size={13} className="text-indigo-400" />
                Aufwand & Zeiten
              </h3>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setShowManualTimeForm(prev => !prev)}
                className="h-7 text-xs px-2.5 border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 font-medium cursor-pointer"
              >
                <Plus size={12} className="mr-1" />
                + Zeit buchen
              </Button>
            </div>

            {/* Inline Manual Time Entry Form */}
            {showManualTimeForm && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const mins = parseMinutesInput(manualTimeInput);
                  if (mins > 0) {
                    taskDetails.handleCreateManualTimeEntry(mins, manualTimeNote);
                    setManualTimeInput('');
                    setManualTimeNote('');
                    setShowManualTimeForm(false);
                  } else {
                    toast.error('Bitte gültige Dauer eingeben (z.B. 45m oder 1.5h)');
                  }
                }}
                className="p-3.5 rounded-xl bg-card/60 border border-indigo-500/30 space-y-3"
              >
                <div className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>Arbeitszeit manuell erfassen</span>
                  <button type="button" onClick={() => setShowManualTimeForm(false)} className="text-muted-foreground hover:text-foreground cursor-pointer">
                    <X size={14} />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-[10px] text-muted-foreground uppercase font-semibold">Dauer (z.B. 45m, 1.5h)</Label>
                    <Input
                      value={manualTimeInput}
                      onChange={(e) => setManualTimeInput(e.target.value)}
                      placeholder="z.B. 30m oder 1.5h"
                      className="h-8 text-xs bg-background/50 border-border mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground uppercase font-semibold">Notiz / Beschreibung</Label>
                    <Input
                      value={manualTimeNote}
                      onChange={(e) => setManualTimeNote(e.target.value)}
                      placeholder="Was hast du erledigt?"
                      className="h-8 text-xs bg-background/50 border-border mt-1"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <Button type="submit" disabled={taskDetails.isAddingTimeEntry} size="sm" className="h-7 text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-medium cursor-pointer">
                    {taskDetails.isAddingTimeEntry ? <Loader2 size={12} className="animate-spin" /> : 'Zeit speichern'}
                  </Button>
                </div>
              </form>
            )}

            {(() => {
              const planned = taskDetails.estimatedHours || 0;
              const logged = taskDetails.totalLoggedHours;
              const remaining = Math.max(0, planned - logged);
              const overBudget = planned > 0 && logged > planned;
              const percentage = planned > 0 ? Math.min(100, (logged / planned) * 100) : 0;

              let barColor = 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]';
              if (overBudget) {
                barColor = 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]';
              } else if (percentage >= 80) {
                barColor = 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.3)]';
              }

              return (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-card/30 border border-border/30 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <span className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold truncate">Geplant (Soll)</span>
                      <div className="flex items-center gap-1 mt-1">
                        <Input
                          type="number"
                          step="0.5"
                          min="0"
                          value={taskDetails.estimatedHours || ''}
                          onChange={(e) => taskDetails.setEstimatedHours(parseFloat(e.target.value) || 0)}
                          className="h-6 w-16 text-center text-xs font-mono font-bold bg-background/50 border-border p-0 rounded-md"
                          placeholder="0"
                        />
                        <span className="text-xs text-muted-foreground font-mono">h</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-center justify-center">
                      <span className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold truncate">Erfasst (Ist)</span>
                      <span className="text-indigo-400 font-bold font-mono text-sm mt-1">
                        {formatMinutes(logged * 60)}
                      </span>
                    </div>

                    <div className="flex flex-col items-center justify-center">
                      <span className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold truncate">Rest</span>
                      <span className={`font-bold font-mono text-sm mt-1 ${overBudget ? 'text-red-400' : 'text-emerald-400'}`}>
                        {planned > 0 ? formatMinutes(Math.max(0, (planned - logged) * 60)) : '—'}
                      </span>
                    </div>
                  </div>

                  {planned > 0 && (
                    <div className="w-full h-2 bg-muted/60 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${barColor} rounded-full transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  )}

                  {/* Task Time Entries History List */}
                  {taskDetails.taskTimeEntries.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-border/30">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1">
                        <span>Gebuchte Zeiten ({taskDetails.taskTimeEntries.length})</span>
                      </div>
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                        {taskDetails.taskTimeEntries.map((entry: any) => {
                          const dateFormatted = entry.start_time ? new Date(entry.start_time).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—';
                          const userDisplayName = entry.expand?.user?.name || entry.expand?.user?.email || 'Mitarbeiter';
                          const entryMin = entry.duration_minutes || entry.duration || 0;

                          return (
                            <div key={entry.id} className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-card/40 hover:bg-card/70 border border-border/30 text-xs">
                              <div className="flex items-center gap-2 min-w-0">
                                <Clock size={12} className="text-indigo-400 shrink-0" />
                                <span className="font-mono text-muted-foreground text-[11px] shrink-0">{dateFormatted}</span>
                                <span className="font-medium text-foreground truncate">{userDisplayName}</span>
                                {entry.description && <span className="text-muted-foreground/70 truncate italic">({entry.description})</span>}
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <Badge variant="outline" className="font-mono text-indigo-300 bg-indigo-500/10 border-indigo-500/20 text-[10px]">
                                  {formatMinutes(entryMin)}
                                </Badge>
                                <button
                                  type="button"
                                  onClick={() => taskDetails.handleDeleteTimeEntry(entry.id, entryMin)}
                                  className="text-muted-foreground hover:text-red-400 transition-colors p-1 cursor-pointer"
                                  title="Zeiteintrag löschen"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>

        {/* 3. Description Section */}
        <div id="section-beschreibung" className="space-y-3 bg-card/15 p-5 rounded-2xl border border-border/40 backdrop-blur-xs">
          <Label className="text-muted-foreground font-semibold text-xs uppercase tracking-wider">Beschreibung</Label>
          <RichTextEditor
            content={taskDetails.description}
            onChange={taskDetails.setDescription}
          />
        </div>

        {/* 3b. Checkliste & Subtasks Section */}
        <div id="section-checkliste" className="space-y-6">
          {/* Checkliste Card */}
          <div className="space-y-4 bg-card/15 p-5 rounded-2xl border border-border/40 backdrop-blur-xs">
            <div className="flex items-center justify-between pb-2 border-b border-border/30">
              <Label className="text-muted-foreground font-semibold text-xs uppercase tracking-wider flex items-center gap-2">
                <CheckSquare size={14} className="text-indigo-400" />
                Checkliste
              </Label>
              {taskDetails.checklistItems.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-medium text-muted-foreground">
                    {taskDetails.checklistItems.filter(i => i.completed).length} / {taskDetails.checklistItems.length}
                  </span>
                  <Badge variant="outline" className="bg-card border-border text-xs font-mono">
                    {Math.round((taskDetails.checklistItems.filter(i => i.completed).length / taskDetails.checklistItems.length) * 100)}%
                  </Badge>
                </div>
              )}
            </div>

            {/* Checklist Progress Bar */}
            {taskDetails.checklistItems.length > 0 && (
              <div className="w-full h-1.5 bg-muted/60 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                  style={{ width: `${(taskDetails.checklistItems.filter(i => i.completed).length / taskDetails.checklistItems.length) * 100}%` }}
                />
              </div>
            )}

            {/* Checklist Items List */}
            <div className="space-y-2">
              {taskDetails.checklistItems.length === 0 ? (
                <p className="text-xs text-muted-foreground/60 py-1">Keine Checklisten-Einträge vorhanden.</p>
              ) : (
                taskDetails.checklistItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-card/30 hover:bg-card/50 border border-border/30 transition-all group"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => taskDetails.handleToggleChecklistItem(item)}
                        className={`h-5 w-5 rounded-md border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                          item.completed
                            ? 'bg-indigo-600 border-indigo-600 text-white'
                            : 'border-border bg-background/50 hover:border-indigo-500/50'
                        }`}
                      >
                        {item.completed && <Check size={12} strokeWidth={3} />}
                      </button>
                      <span className={`text-sm text-foreground transition-colors truncate ${item.completed ? 'line-through text-muted-foreground/60' : ''}`}>
                        {item.title}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => taskDetails.handleDeleteChecklistItem(item.id)}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 transition-all p-1 cursor-pointer shrink-0"
                      title="Eintrag löschen"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Add Checklist Item Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (newChecklistTitle.trim()) {
                  taskDetails.handleCreateChecklistItem(newChecklistTitle);
                  setNewChecklistTitle('');
                }
              }}
              className="flex items-center gap-2 pt-1"
            >
              <Input
                value={newChecklistTitle}
                onChange={(e) => setNewChecklistTitle(e.target.value)}
                placeholder="Neuen Checklisten-Punkt hinzufügen..."
                className="h-8 text-xs bg-background/50 border-border"
              />
              <Button
                type="submit"
                disabled={taskDetails.isAddingChecklist || !newChecklistTitle.trim()}
                size="sm"
                variant="outline"
                className="h-8 px-3 text-xs shrink-0 font-medium"
              >
                {taskDetails.isAddingChecklist ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} className="mr-1" />}
                Hinzufügen
              </Button>
            </form>
          </div>

          {/* Subtasks Card */}
          <div className="space-y-4 bg-card/15 p-5 rounded-2xl border border-border/40 backdrop-blur-xs">
            <div className="flex items-center justify-between pb-2 border-b border-border/30">
              <Label className="text-muted-foreground font-semibold text-xs uppercase tracking-wider flex items-center gap-2">
                <ListTodo size={14} className="text-teal-400" />
                Unteraufgaben (Subtasks)
              </Label>
              {taskDetails.subtasks.length > 0 && (
                <Badge variant="secondary" className="bg-card text-muted-foreground font-mono text-[10px]">
                  {taskDetails.subtasks.length}
                </Badge>
              )}
            </div>

            {/* Subtasks List */}
            <div className="space-y-2">
              {taskDetails.subtasks.length === 0 ? (
                <p className="text-xs text-muted-foreground/60 py-1">Keine Unteraufgaben zugewiesen.</p>
              ) : (
                taskDetails.subtasks.map((subtask) => (
                  <div
                    key={subtask.id}
                    className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl bg-card/30 hover:bg-card/50 border border-border/30 transition-all group"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => taskDetails.handleToggleSubtaskStatus(subtask)}
                        className={`h-4 w-4 rounded border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                          subtask.status === 'done'
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-border bg-background/50 hover:border-emerald-500/50'
                        }`}
                      >
                        {subtask.status === 'done' && <Check size={10} strokeWidth={3} />}
                      </button>
                      <span
                        onClick={() => onTaskClick?.(subtask.id)}
                        className={`text-sm text-foreground hover:text-indigo-400 transition-colors cursor-pointer truncate ${
                          subtask.status === 'done' ? 'line-through text-muted-foreground/60' : 'font-medium'
                        }`}
                      >
                        {subtask.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className="text-[9px] uppercase tracking-wider">
                        {subtask.status === 'done' ? 'Erledigt' : 'Offen'}
                      </Badge>
                      <button
                        type="button"
                        onClick={() => taskDetails.handleDeleteSubtask(subtask.id)}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 transition-all p-1 cursor-pointer"
                        title="Unteraufgabe löschen"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Add Subtask Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (newSubtaskTitle.trim()) {
                  taskDetails.handleCreateSubtask(newSubtaskTitle);
                  setNewSubtaskTitle('');
                }
              }}
              className="flex items-center gap-2 pt-1"
            >
              <Input
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                placeholder="Neue Unteraufgabe eingeben..."
                className="h-8 text-xs bg-background/50 border-border"
              />
              <Button
                type="submit"
                disabled={taskDetails.isAddingSubtask || !newSubtaskTitle.trim()}
                size="sm"
                variant="outline"
                className="h-8 px-3 text-xs shrink-0 font-medium border-teal-500/30 text-teal-400 hover:bg-teal-500/10"
              >
                {taskDetails.isAddingSubtask ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} className="mr-1" />}
                Unteraufgabe erstellen
              </Button>
            </form>
          </div>
        </div>

        {/* 4. Attachments Section */}
        <div id="section-dateien" className="space-y-4 bg-card/15 p-5 rounded-2xl border border-border/40 backdrop-blur-xs">
          <div className="flex items-center justify-between">
            <Label className="text-muted-foreground font-semibold text-xs uppercase tracking-wider flex items-center gap-2">
              <Paperclip size={14} />
              Dateianhänge
            </Label>
            <div className="flex items-center gap-2">
              {taskDetails.taskFiles.length > 0 && (
                <Badge variant="outline" className="bg-background border-border text-muted-foreground font-mono text-[10px]">
                  {taskDetails.taskFiles.length}
                </Badge>
              )}
              <Button
                type="button"
                onClick={(e) => { e.stopPropagation(); taskDetails.fileInputRef.current?.click(); }}
                disabled={taskDetails.isUploadingFile}
                size="sm"
                variant="outline"
                className="border-border text-muted-foreground hover:text-foreground h-8 text-xs font-semibold"
              >
                {taskDetails.isUploadingFile ? (
                  <Loader2 size={12} className="animate-spin mr-1" />
                ) : (
                  <Upload size={12} className="mr-1" />
                )}
                Hochladen
              </Button>
              <input
                ref={taskDetails.fileInputRef}
                type="file"
                className="hidden"
                onChange={taskDetails.handleFileUpload}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            {taskDetails.taskFiles.length === 0 ? (
              <p className="text-sm text-muted-foreground/60 py-1 pl-1">Keine Dateien vorhanden</p>
            ) : (
              taskDetails.taskFiles.map((fileRecord) => {
                const fileUrl = getFileUrl(fileRecord);
                const fileName = fileRecord.name || fileRecord.file;
                const fileSize = fileRecord.size;
                const uploadDate = formatDate(fileRecord.created);

                return (
                  <div
                    key={fileRecord.id}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-card/30 border border-transparent hover:border-border/30 transition-all group"
                  >
                    <Paperclip size={14} className="text-muted-foreground shrink-0" />
                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 text-sm text-foreground hover:text-indigo-400 truncate transition-colors font-medium min-w-0"
                    >
                      {decodeGermanHtmlEntities(fileName)}
                    </a>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {uploadDate}
                    </span>
                    {fileSize != null && (
                      <span className="text-[10px] text-muted-foreground shrink-0 font-mono">
                        {formatFileSize(fileSize)}
                      </span>
                    )}
                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-indigo-400 transition-all p-1 shrink-0"
                      download={fileName}
                    >
                      <Download size={14} />
                    </a>
                    <button
                      type="button"
                      onClick={() => taskDetails.handleDeleteFile(fileRecord.id)}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 transition-all p-1 shrink-0 cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 5. Comments Section */}
        <div id="section-kommentare" className="space-y-4 bg-card/15 p-5 rounded-2xl border border-border/40 backdrop-blur-xs">
          <div className="flex items-center justify-between pb-2 border-b border-border/30">
            <Label className="text-muted-foreground font-semibold text-xs uppercase tracking-wider flex items-center gap-2">
              <MessageSquare size={14} />
              Kommentare
            </Label>
            {taskDetails.commentCount > 0 && (
              <Badge variant="secondary" className="bg-card text-muted-foreground font-mono text-[10px]">
                {taskDetails.commentCount}
              </Badge>
            )}
          </div>
          {taskId && (
            <TaskComments
              taskId={taskId}
              taskTitle={taskDetails.title}
              projectKey={projectKey}
            />
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-5 px-6 border-t border-border/40 bg-card/15 flex items-center justify-end gap-3 shrink-0">
        <Button
          type="button"
          variant="ghost"
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground hover:bg-card border border-transparent hover:border-border/50 cursor-pointer"
        >
          Abbrechen
        </Button>
        <Button
          type="button"
          onClick={taskDetails.handleSave}
          disabled={taskDetails.isSaving}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-[0_0_15px_rgba(79,70,229,0.25)] transition-all hover:scale-102 active:scale-98 cursor-pointer"
        >
          {taskDetails.isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Änderungen speichern
        </Button>
      </div>
    </div>
  );
}
