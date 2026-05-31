'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { pb } from '@/lib/pocketbase';
import { toast } from 'sonner';
import { Loader2, Play, Square, Plus, CheckCircle2, Circle, Trash2, Link2, Unlink, Search, X, GripVertical, RefreshCw, MessageSquare, Paperclip, Download, Upload, ChevronDown } from 'lucide-react';
import { useTimerStore } from '@/lib/store';
import { TaskRecord, UserRecord, TaskLinkRecord, TaskLinkType, ChecklistItemRecord, RecurringInterval, TaskCommentRecord, TaskType, TaskFileRecord } from '@/lib/pocketbase-types';
import { TaskComments } from '@/components/tasks/TaskComments';
import { decodeGermanHtmlEntities } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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

interface TaskDetailsDialogProps {
  taskId: string | null;
  projectKey: string;
  onClose: () => void;
  onTaskUpdated: () => void;
  onTaskClick?: (taskId: string) => void;
}

export function TaskDetailsDialog({ taskId, projectKey, onClose, onTaskUpdated, onTaskClick }: TaskDetailsDialogProps) {
  const { runningTaskId, startTimer, stopAndSaveTimer } = useTimerStore();
  const [task, setTask] = useState<TaskRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [allUsers, setAllUsers] = useState<UserRecord[]>([]);
  const [isStoppingTimer, setIsStoppingTimer] = useState(false);

  // Subtask state
  const [subtasks, setSubtasks] = useState<TaskRecord[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);

  // Task links state
  const [taskLinks, setTaskLinks] = useState<TaskLinkRecord[]>([]);
  const [linkedTasks, setLinkedTasks] = useState<TaskRecord[]>([]);
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [linkSearchQuery, setLinkSearchQuery] = useState('');
  const [linkSearchResults, setLinkSearchResults] = useState<TaskRecord[]>([]);
  const [selectedLinkType, setSelectedLinkType] = useState<TaskLinkType>('relates_to');
  const [isSearchingLinks, setIsSearchingLinks] = useState(false);

  // Comments state
  const [commentCount, setCommentCount] = useState(0);

  // Checklist state
  const [checklistItems, setChecklistItems] = useState<ChecklistItemRecord[]>([]);
  const [newChecklistTitle, setNewChecklistTitle] = useState('');
  const [isAddingChecklist, setIsAddingChecklist] = useState(false);

  // Recurring state
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringInterval, setRecurringInterval] = useState<RecurringInterval>('weekly');
  const [recurringCustomDays, setRecurringCustomDays] = useState<number>(7);
  const [recurringEndDate, setRecurringEndDate] = useState('');
  const [recurringNextDate, setRecurringNextDate] = useState('');

  // Type (Art) state
  const [taskType, setTaskType] = useState<TaskType>('other');

  // Hours overview state
  const [totalLoggedHours, setTotalLoggedHours] = useState(0);

  // File attachments state
  const [taskFiles, setTaskFiles] = useState<TaskFileRecord[]>([]);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Collapsible sections state
  const [collapsedSections, setCollapsedSections] = useState({
    zeiterfassung: false,
    checkliste: false,
    subtasks: false,
    dateien: true,
    verknupfungen: true,
    kommentare: true,
  });

  const toggleSection = (section: keyof typeof collapsedSections) => {
    setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [assigneeId, setAssigneeId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');

  // Auto-Escalation State
  const [isEscalateOptIn, setIsEscalateOptIn] = useState<boolean>(false);

  const getEscalatedPriority = useCallback((originalPrio: string, dueStr: string, optIn: boolean) => {
    if (!optIn || !dueStr) return originalPrio;
    const due = new Date(`${dueStr}T18:00:00`);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    const diffHours = diffTime / (1000 * 60 * 60);

    if (diffHours < 24) {
      return 'acute';
    }
    if (diffHours < 48) {
      if (originalPrio === 'acute') return 'acute';
      return 'high';
    }
    return originalPrio;
  }, []);

  const handleToggleEscalateOptIn = (val: boolean) => {
    setIsEscalateOptIn(val);
    if (typeof window !== 'undefined' && taskId) {
      localStorage.setItem(`vibeforce-task-escalate-${taskId}`, String(val));
    }
  };


  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const records = await pb.collection('users').getFullList({
          sort: 'name',
        });
        setAllUsers(records as UserRecord[]);
      } catch (error) {
        console.error('Failed to fetch users', error);
      }
    };
    fetchUsers();
  }, []);

  const fetchChecklistItems = useCallback(async (taskId: string) => {
    try {
      const result = await pb.collection('checklist_items').getList(1, 100, {
        filter: pb.filter('task = {:tid}', { tid: taskId }),
        sort: 'sort_order,created',
      });
      setChecklistItems(result.items as ChecklistItemRecord[]);
    } catch (error) {
      console.error('Failed to fetch checklist items', error);
    }
  }, []);

  useEffect(() => {
    if (!taskId) return;

    const fetchTask = async () => {
      setIsLoading(true);
      try {
        const record = await pb.collection('tasks').getOne(taskId);
        setTask(record as TaskRecord);
        setTitle(decodeGermanHtmlEntities(record.title));
        setDescription(decodeGermanHtmlEntities(record.description || ''));
        setStatus(record.status);
        setPriority(record.priority);
        setTaskType((record.type as TaskType) || 'other');
        const assigneeArr = record.assignees
          ? (Array.isArray(record.assignees) ? record.assignees : [record.assignees])
          : [];
        setAssigneeId(assigneeArr[0]?.id || null);
        setStartDate(record.start_date ? (record.start_date.includes('T') || record.start_date.includes(' ') ? record.start_date.replace(' ', 'T').substring(0, 16) : `${record.start_date}T00:00`) : '');
        setDueDate(record.due_date ? (record.due_date.includes('T') || record.due_date.includes(' ') ? record.due_date.replace(' ', 'T').substring(0, 16) : `${record.due_date}T00:00`) : '');

        if (typeof window !== 'undefined') {
          const savedEscalate = localStorage.getItem(`vibeforce-task-escalate-${taskId}`);
          setIsEscalateOptIn(savedEscalate === 'true');
        }

        setIsRecurring(record.is_recurring || false);
        setRecurringInterval(record.recurring_interval || 'weekly');
        setRecurringCustomDays(record.recurring_custom_days || 7);
        setRecurringEndDate(record.recurring_end_date ? record.recurring_end_date.split('T')[0] : '');
        setRecurringNextDate(record.recurring_next_date ? record.recurring_next_date.split('T')[0] : '');

        // Fetch all independent data in parallel
        const [
          subtaskResult,
          linkResult,
          commentResult,
          checklistResult,
          timeEntriesResult,
          filesResult,
        ] = await Promise.all([
          pb.collection('tasks').getList(1, 50, {
            filter: pb.filter('parent_task = {:tid}', { tid: taskId }),
            sort: 'created',
            expand: 'assignees',
          }),
          pb.collection('task_links').getList(1, 50, {
            filter: pb.filter('source_task = {:tid} || target_task = {:tid}', { tid: taskId }),
            sort: 'created',
            expand: 'source_task,target_task',
          }),
          pb.collection('task_comments').getList(1, 1, {
            filter: pb.filter('task = {:tid}', { tid: taskId }),
          }).catch(() => ({ totalItems: 0 } as any)),
          pb.collection('checklist_items').getList(1, 100, {
            filter: pb.filter('task = {:tid}', { tid: taskId }),
            sort: 'sort_order,created',
          }),
          pb.collection('time_entries').getList(1, 500, {
            filter: pb.filter('task = {:tid}', { tid: taskId }),
          }).catch(() => ({ items: [] } as any)),
          pb.collection('task_files').getList(1, 50, {
            filter: pb.filter('task = {:tid}', { tid: taskId }),
            sort: '-created',
          }).catch(() => ({ items: [] } as any)),
        ]);

        setSubtasks(subtaskResult.items as TaskRecord[]);

        const links = linkResult.items as TaskLinkRecord[];
        setTaskLinks(links);

        const linked: TaskRecord[] = [];
        for (const link of links) {
          const linkedTask = link.source_task === taskId
            ? (link.expand?.target_task)
            : (link.expand?.source_task);
          if (linkedTask) {
            linked.push(linkedTask);
          }
        }
        setLinkedTasks(linked);

        setCommentCount((commentResult as any).totalItems || 0);
        setChecklistItems(checklistResult.items as ChecklistItemRecord[]);

        const totalMinutes = (timeEntriesResult as any).items.reduce(
          (sum: number, te: any) => sum + (te.duration_minutes || te.duration || 0), 0,
        );
        setTotalLoggedHours(totalMinutes / 60);

        setTaskFiles((filesResult as any).items as TaskFileRecord[]);
      } catch (error) {
        toast.error('Aufgabe konnte nicht geladen werden');
        onCloseRef.current();
      } finally {
        setIsLoading(false);
      }
    };

    fetchTask();
  }, [taskId]);

  const toPbDate = (dateStr: string) => {
    if (!dateStr) return null;
    let formatted = dateStr.replace('T', ' ');
    if (formatted.length === 16) { // YYYY-MM-DD HH:MM
      formatted += ':00';
    }
    return formatted;
  };

  const handleSave = async () => {
    if (!taskId) return;
    setIsSaving(true);

    try {
      const updateData: Record<string, unknown> = {
        title,
        description,
        status,
        priority,
        type: taskType,
        assignees: assigneeId ? [assigneeId] : [],
        start_date: toPbDate(startDate),
        due_date: toPbDate(dueDate),
        is_recurring: isRecurring,
        recurring_interval: isRecurring ? recurringInterval : null,
        recurring_custom_days: isRecurring && recurringInterval === 'custom' ? recurringCustomDays : null,
        recurring_end_date: recurringEndDate ? `${recurringEndDate} 12:00:00` : null,
        recurring_next_date: recurringNextDate ? `${recurringNextDate} 12:00:00` : null,
      };

      await pb.collection('tasks').update(taskId, updateData);
      toast.success('Aufgabe aktualisiert');
      onTaskUpdated();
      onClose();
    } catch (error) {
      console.error('Failed to save task:', error);
      let errorMsg = 'Fehler beim Speichern';
      if (error && typeof error === 'object' && 'data' in error) {
        const pbError = error as any;
        if (pbError.data?.data) {
          const fieldErrors = Object.entries(pbError.data.data)
            .map(([field, errObj]: any) => `${field}: ${errObj.message}`)
            .join(', ');
          if (fieldErrors) {
            errorMsg += ` (${fieldErrors})`;
          }
        } else if (pbError.message) {
          errorMsg += `: ${pbError.message}`;
        }
      }
      toast.error(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSubtask = async () => {
    if (!taskId || !newSubtaskTitle.trim()) return;
    setIsAddingSubtask(true);

    try {
      const created = await pb.collection('tasks').create({
        project: task?.project || '',
        title: newSubtaskTitle.trim(),
        status: 'todo',
        priority: 'medium',
        parent_task: taskId,
      });

      setSubtasks(prev => [...prev, created as TaskRecord]);
      setNewSubtaskTitle('');
      toast.success('Unteraufgabe erstellt');
      onTaskUpdated();
    } catch (error) {
      console.error(error);
      toast.error('Fehler beim Erstellen der Unteraufgabe');
    } finally {
      setIsAddingSubtask(false);
    }
  };

  const handleToggleSubtaskStatus = async (subtask: TaskRecord) => {
    const newStatus = subtask.status === 'done' ? 'todo' : 'done';
    try {
      await pb.collection('tasks').update(subtask.id, { status: newStatus });
      setSubtasks(prev => prev.map(s =>
        s.id === subtask.id ? { ...s, status: newStatus as TaskRecord['status'] } : s
      ));
      onTaskUpdated();
    } catch (error) {
      toast.error('Fehler beim Aktualisieren');
    }
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    try {
      await pb.collection('tasks').delete(subtaskId);
      setSubtasks(prev => prev.filter(s => s.id !== subtaskId));
      toast.success('Unteraufgabe gelöscht');
      onTaskUpdated();
    } catch (error) {
      toast.error('Fehler beim Löschen');
    }
  };

  // Task link handlers
  const handleSearchLinkTask = async (query: string) => {
    setLinkSearchQuery(query);
    if (!query || query.length < 2) {
      setLinkSearchResults([]);
      return;
    }

    setIsSearchingLinks(true);
    try {
      const result = await pb.collection('tasks').getList(1, 10, {
        filter: pb.filter('title ~ {:query} && id != {:tid}', { query, tid: taskId }),
        sort: '-created',
        expand: 'project',
      });
      setLinkSearchResults(result.items as TaskRecord[]);
    } catch (error) {
      console.error('Failed to search tasks:', error);
    } finally {
      setIsSearchingLinks(false);
    }
  };

  const handleAddLink = async (targetTaskId: string) => {
    if (!taskId) return;

    try {
      await pb.collection('task_links').create({
        source_task: taskId,
        target_task: targetTaskId,
        link_type: selectedLinkType,
      });

      // Refresh links
      const linkResult = await pb.collection('task_links').getList(1, 50, {
        filter: pb.filter('source_task = {:tid} || target_task = {:tid}', { tid: taskId }),
        sort: 'created',
        expand: 'source_task,target_task',
      });
      const links = linkResult.items as TaskLinkRecord[];
      setTaskLinks(links);

      const linked: TaskRecord[] = [];
      for (const link of links) {
        const linkedTask = link.source_task === taskId
          ? (link.expand?.target_task)
          : (link.expand?.source_task);
        if (linkedTask) {
          linked.push(linkedTask);
        }
      }
      setLinkedTasks(linked);

      setIsAddingLink(false);
      setLinkSearchQuery('');
      setLinkSearchResults([]);
      toast.success('Aufgabe verknüpft');
      onTaskUpdated();
    } catch (error) {
      console.error(error);
      toast.error('Fehler beim Verknüpfen');
    }
  };

  const handleRemoveLink = async (linkId: string) => {
    try {
      await pb.collection('task_links').delete(linkId);
      setTaskLinks(prev => prev.filter(l => l.id !== linkId));
      toast.success('Verknüpfung entfernt');
      onTaskUpdated();
    } catch (error) {
      toast.error('Fehler beim Entfernen');
    }
  };

  // Checklist handlers
  const handleAddChecklistItem = async () => {
    if (!taskId || !newChecklistTitle.trim()) return;
    setIsAddingChecklist(true);

    try {
      const maxSort = checklistItems.reduce((max, item) => Math.max(max, item.sort_order || 0), 0);
      const created = await pb.collection('checklist_items').create({
        task: taskId,
        title: newChecklistTitle.trim(),
        completed: false,
        sort_order: maxSort + 1,
      });

      setChecklistItems(prev => [...prev, created as ChecklistItemRecord]);
      setNewChecklistTitle('');
      toast.success('Checklisteneintrag erstellt');
      onTaskUpdated();
    } catch (error) {
      console.error(error);
      toast.error('Fehler beim Erstellen');
    } finally {
      setIsAddingChecklist(false);
    }
  };

  const handleToggleChecklistItem = async (item: ChecklistItemRecord) => {
    try {
      const updated = await pb.collection('checklist_items').update(item.id, {
        completed: !item.completed,
      });
      setChecklistItems(prev => prev.map(i =>
        i.id === item.id ? { ...i, completed: !i.completed } : i
      ));
      onTaskUpdated();
    } catch (error) {
      toast.error('Fehler beim Aktualisieren');
    }
  };

  const handleDeleteChecklistItem = async (itemId: string) => {
    try {
      await pb.collection('checklist_items').delete(itemId);
      setChecklistItems(prev => prev.filter(i => i.id !== itemId));
      toast.success('Eintrag gelöscht');
      onTaskUpdated();
    } catch (error) {
      toast.error('Fehler beim Löschen');
    }
  };

  // File attachment handlers
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!taskId || !e.target.files || e.target.files.length === 0) return;
    setIsUploadingFile(true);

    try {
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append('task', taskId);
      formData.append('file', file);
      formData.append('name', file.name);
      formData.append('size', String(file.size));

      const created = await pb.collection('task_files').create(formData);
      setTaskFiles(prev => [created as TaskFileRecord, ...prev]);
      toast.success('Datei hochgeladen');
      onTaskUpdated();
    } catch (error) {
      console.error(error);
      toast.error('Fehler beim Hochladen');
    } finally {
      setIsUploadingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    try {
      await pb.collection('task_files').delete(fileId);
      setTaskFiles(prev => prev.filter(f => f.id !== fileId));
      toast.success('Datei gelöscht');
      onTaskUpdated();
    } catch (error) {
      toast.error('Fehler beim Löschen');
    }
  };

  const getFileUrl = (fileRecord: TaskFileRecord) => {
    return pb.files.getUrl(fileRecord, fileRecord.file, { thumb: '' });
  };

  const getLinkTypeLabel = (type: TaskLinkType) => {
    switch (type) {
      case 'depends_on': return 'hängt ab von';
      case 'blocks': return 'blockiert';
      case 'relates_to': return 'verknüpft mit';
      case 'duplicate_of': return 'Duplikat von';
    }
  };

  const getLinkTypeColor = (type: TaskLinkType) => {
    switch (type) {
      case 'depends_on': return 'text-amber-400 border-amber-500/20 bg-amber-500/10';
      case 'blocks': return 'text-red-400 border-red-500/20 bg-red-500/10';
      case 'relates_to': return 'text-blue-400 border-blue-500/20 bg-blue-500/10';
      case 'duplicate_of': return 'text-purple-400 border-purple-500/20 bg-purple-500/10';
    }
  };

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'acute': return 'text-red-400';
      case 'high': return 'text-orange-400';
      case 'medium': return 'text-blue-400';
      default: return 'text-muted-foreground';
    }
  };

  const completedSubtasks = subtasks.filter(s => s.status === 'done').length;
  const completedChecklist = checklistItems.filter(i => i.completed).length;

  const escalatedPriority = getEscalatedPriority(priority, dueDate, isEscalateOptIn);
  const isEscated = isEscalateOptIn && escalatedPriority !== priority;

  return (
    <Dialog open={!!taskId} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-[600px] bg-background border-border text-foreground max-h-[90vh] overflow-y-auto">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <DialogHeader className="p-6 border-b border-border/50">
              <div className="flex items-center justify-between mb-4 pr-10">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-muted-foreground bg-card px-2 py-1 rounded-md border border-border">
                    {projectKey}
                  </span>
                  {isEscated && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse flex items-center gap-1 shadow-[0_0_8px_rgba(239,68,68,0.2)]">
                      <span className="w-1 h-1 rounded-full bg-red-400 inline-block animate-ping" />
                      ESKALIERT ({escalatedPriority === 'acute' ? 'AKUT' : 'HOCH'})
                    </span>
                  )}
                </div>

                {runningTaskId === taskId ? (
                  <Button
                    onClick={async () => {
                      setIsStoppingTimer(true);
                      try {
                        await stopAndSaveTimer();
                        toast.success('Timer gestoppt und Zeit erfasst');
                      } catch {
                        toast.error('Fehler beim Speichern der Zeit');
                      } finally {
                        setIsStoppingTimer(false);
                      }
                    }}
                    disabled={isStoppingTimer}
                    variant="destructive"
                    size="sm"
                    className="rounded-full h-8 px-4"
                  >
                    {isStoppingTimer ? (
                      <Loader2 size={14} className="mr-2 animate-spin" />
                    ) : (
                      <Square size={14} className="mr-2" fill="currentColor" />
                    )}
                    Timer stoppen
                  </Button>
                ) : (
                  <Button
                    onClick={async () => {
                      try {
                        await startTimer(taskId!, title);
                        toast.success('Timer gestartet');
                      } catch {
                        toast.error('Fehler beim Starten des Timers');
                      }
                    }}
                    variant="outline"
                    size="sm"
                    className="rounded-full h-8 px-4 border-indigo-500/50 text-indigo-400 hover:bg-indigo-500/10"
                  >
                    <Play size={14} className="mr-2" fill="currentColor" />
                    Timer starten
                  </Button>
                )}
              </div>
              <DialogTitle className="sr-only">Aufgabe bearbeiten</DialogTitle>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-lg font-semibold bg-transparent border-none focus-visible:ring-0 px-0"
                placeholder="Aufgabentitel..."
              />
            </DialogHeader>

            <div className="flex-1 overflow-y-auto">
              {/* Jump Marks */}
              <div className="flex flex-wrap gap-1.5 pb-2 pt-1 px-6">
                {[
                  { id: 'beschreibung', label: 'Beschreibung' },
                  { id: 'checkliste', label: 'Checkliste' },
                  { id: 'zeiterfassung', label: 'Zeiteinträge' },
                  { id: 'subtasks', label: 'Subtasks' },
                  { id: 'verknupfungen', label: 'Verknüpfungen' },
                  { id: 'dateien', label: 'Dateien' },
                  { id: 'kommentare', label: 'Kommentare' },
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => document.getElementById(`section-${item.id}`)?.scrollIntoView({ behavior: 'smooth' })}
                    className="text-xs px-2.5 py-1 rounded-full bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-background transition-colors"
                  >
                    {item.label}
                  </button>
                ))}
              </div>

            <div className="px-6 space-y-8">
              {/* Meta Data Row */}
              <div className="flex flex-col gap-4 p-4 rounded-xl border border-border bg-card/30">
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs uppercase tracking-wider">Status</Label>
                  <Select value={status} onValueChange={(val) => val && setStatus(val)}>
                    <SelectTrigger className="bg-background border-border h-9 w-full">
                      <SelectValue>
                        {({todo: 'Offen', in_progress: 'In Arbeit', review: 'Prüfung', done: 'Erledigt'} as Record<string, string>)[status] || status}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-background border-border text-foreground">
                      <SelectItem value="todo">Offen</SelectItem>
                      <SelectItem value="in_progress">In Arbeit</SelectItem>
                      <SelectItem value="review">Prüfung</SelectItem>
                      <SelectItem value="done">Erledigt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-muted-foreground text-xs uppercase tracking-wider">Priorität</Label>
                  </div>
                  <Select value={priority} onValueChange={(val) => val && setPriority(val)}>
                    <SelectTrigger className={`bg-background border-border h-9 w-full ${getPriorityColor(isEscated ? escalatedPriority : priority)}`}>
                      <SelectValue>
                        {({low: 'Niedrig', medium: 'Mittel', high: 'Hoch', acute: 'Akut'} as Record<string, string>)[priority] || priority}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-background border-border text-foreground">
                      <SelectItem value="low">Niedrig</SelectItem>
                      <SelectItem value="medium">Mittel</SelectItem>
                      <SelectItem value="high">Hoch</SelectItem>
                      <SelectItem value="acute" className="text-red-400">Akut</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs uppercase tracking-wider">Art</Label>
                  <Select value={taskType} onValueChange={(val) => val && setTaskType(val as TaskType)}>
                    <SelectTrigger className={`bg-background border-border h-9 w-full ${taskType ? TASK_TYPE_COLORS[taskType]?.split(' ')[0] || '' : ''}`}>
                      <SelectValue>
                        {TASK_TYPE_LABELS[taskType] || taskType}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-background border-border text-foreground">
                      {(Object.keys(TASK_TYPE_LABELS) as TaskType[]).map((key) => (
                        <SelectItem key={key} value={key}>
                          {TASK_TYPE_LABELS[key]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2 p-4 rounded-xl border border-border bg-card/30">
                <Label className="text-muted-foreground text-xs uppercase tracking-wider">Verantwortlich</Label>
                <Select value={assigneeId || 'unassigned'} onValueChange={(val) => setAssigneeId(val === 'unassigned' ? null : val)}>
                  <SelectTrigger className="bg-background border-border h-9">
                    <SelectValue>
                      {!assigneeId || assigneeId === 'unassigned' ? 'Niemand zugewiesen' : decodeGermanHtmlEntities(allUsers.find(u => u.id === assigneeId)?.name || allUsers.find(u => u.id === assigneeId)?.email || assigneeId)}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-background border-border text-foreground">
                    <SelectItem value="unassigned">Nicht zugewiesen</SelectItem>
                    {allUsers.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {decodeGermanHtmlEntities(u.name || u.email)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4 p-4 rounded-xl border border-border bg-card/30">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground text-xs uppercase tracking-wider">Startdatum</Label>
                    <Input
                      type="datetime-local"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="bg-background border-border text-foreground"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-muted-foreground text-xs uppercase tracking-wider">Fälligkeitsdatum</Label>
                    <Input
                      type="datetime-local"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="bg-background border-border text-foreground"
                    />
                  </div>
                </div>

                {dueDate && (
                  <div className="flex items-center justify-between pt-2 border-t border-border/50">
                    <div className="space-y-0.5">
                      <Label className="text-xs cursor-pointer" htmlFor="escalate-toggle">Auto-Eskalation bei Frist</Label>
                      <p className="text-[10px] text-muted-foreground">Priorität automatisch erhöhen, wenn Deadline naht (48h/24h).</p>
                    </div>
                    <button
                      id="escalate-toggle"
                      type="button"
                      onClick={() => handleToggleEscalateOptIn(!isEscalateOptIn)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                        isEscalateOptIn ? 'bg-indigo-600' : 'bg-zinc-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                          isEscalateOptIn ? 'translate-x-4' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                )}
              </div>

              {/* Stunden-Rest Section */}
              {task && (
                <div id="section-zeiterfassung" className="space-y-3 p-4 rounded-xl border border-border bg-card/30">
                  <div
                    className="flex items-center justify-between cursor-pointer select-none"
                    onClick={() => toggleSection('zeiterfassung')}
                  >
                    <Label className="text-muted-foreground font-semibold text-lg flex items-center gap-2 cursor-pointer">
                      <Play size={16} className="text-muted-foreground" />
                      Aufwand
                    </Label>
                    <ChevronDown
                      size={16}
                      className={`text-muted-foreground transition-transform duration-200 ${collapsedSections.zeiterfassung ? '' : 'rotate-180'}`}
                    />
                  </div>
                  {!collapsedSections.zeiterfassung && (<>
                    {(() => {
                    const planned = task.estimated_hours || 0;
                    const logged = totalLoggedHours;
                    const remaining = Math.max(0, planned - logged);
                    const overBudget = planned > 0 && logged > planned;
                    const percentage = planned > 0 ? Math.min(100, (logged / planned) * 100) : 0;

                    let barColor = 'bg-emerald-500';
                    let textColor = 'text-emerald-400';
                    if (overBudget) {
                      barColor = 'bg-red-500';
                      textColor = 'text-red-400';
                    } else if (percentage >= 80) {
                      barColor = 'bg-amber-500';
                      textColor = 'text-amber-400';
                    }

                    return (
                      <>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Geplant: <strong className="text-foreground">{planned.toFixed(1)}h</strong>
                          </span>
                          <span className="text-muted-foreground">
                            Erfasst: <strong className={textColor}>{logged.toFixed(1)}h</strong>
                          </span>
                          <span className="text-muted-foreground">
                            Rest: <strong className={overBudget ? 'text-red-400' : 'text-emerald-400'}>{remaining.toFixed(1)}h</strong>
                          </span>
                        </div>

                        {planned > 0 && (
                          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full ${barColor} rounded-full transition-all duration-300`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        )}

                        {planned === 0 && (
                          <p className="text-xs text-muted-foreground">
                            {logged > 0
                              ? `${logged.toFixed(1)}h erfasst (keine Schätzung)`
                              : 'Keine Stunden geplant oder erfasst'}
                          </p>
                        )}
                      </>
                    );
                  })()}
                  </>)}
                </div>
              )}

              {/* Checklist Section */}
              <div id="section-checkliste" className="space-y-3 p-4 rounded-xl border border-border bg-card/30">
                <div
                  className="flex items-center justify-between cursor-pointer select-none"
                  onClick={() => toggleSection('checkliste')}
                >
                  <Label className="text-muted-foreground font-semibold text-lg flex items-center gap-2 cursor-pointer">
                    <CheckCircle2 size={16} className="text-muted-foreground" />
                    Checkliste
                  </Label>
                  <div className="flex items-center gap-2">
                    {checklistItems.length > 0 && (
                      <Badge variant="outline" className="bg-background border-border text-muted-foreground">
                        {completedChecklist}/{checklistItems.length}
                      </Badge>
                    )}
                    <ChevronDown
                      size={16}
                      className={`text-muted-foreground transition-transform duration-200 ${collapsedSections.checkliste ? '' : 'rotate-180'}`}
                    />
                  </div>
                </div>

                {!collapsedSections.checkliste && (
                  <>
                {/* Progress Bar */}
                {checklistItems.length > 0 && (
                  <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                      style={{ width: `${(completedChecklist / checklistItems.length) * 100}%` }}
                    />
                  </div>
                )}

                {/* Checklist Items List */}
                <div className="space-y-1">
                  {checklistItems.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-2">Keine Einträge vorhanden</p>
                  ) : (
                    checklistItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-background/50 transition-colors group"
                      >
                        <button
                          onClick={() => handleToggleChecklistItem(item)}
                          className="flex-shrink-0 text-muted-foreground hover:text-emerald-400 transition-colors"
                        >
                          {item.completed ? (
                            <CheckCircle2 size={18} className="text-emerald-400" />
                          ) : (
                            <Circle size={18} />
                          )}
                        </button>
                        <span className={`flex-1 text-sm ${item.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                          {decodeGermanHtmlEntities(item.title)}
                        </span>
                        <button
                          onClick={() => handleDeleteChecklistItem(item.id)}
                          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 transition-all p-1"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Checklist Item Input */}
                <div className="flex items-center gap-2 pt-1">
                  <Input
                    placeholder="Neuen Eintrag hinzufügen..."
                    value={newChecklistTitle}
                    onChange={(e) => setNewChecklistTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddChecklistItem();
                      }
                    }}
                    className="bg-background border-border h-9 text-sm flex-1"
                  />
                  <Button
                    onClick={handleAddChecklistItem}
                    disabled={isAddingChecklist || !newChecklistTitle.trim()}
                    size="sm"
                    variant="outline"
                    className="border-border text-muted-foreground hover:text-foreground h-9"
                  >
                    {isAddingChecklist ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Plus size={16} />
                    )}
                  </Button>
                </div>
                  </>
                )}
              </div>

              {/* Recurring Task Section */}
              <div className="space-y-3 p-4 rounded-xl border border-border bg-card/30">
                <div className="flex items-center justify-between">
                  <Label className="text-muted-foreground font-semibold text-lg flex items-center gap-2">
                    <RefreshCw size={16} className="text-muted-foreground" />
                    Wiederkehrende Aufgabe
                  </Label>
                  <button
                    onClick={() => setIsRecurring(!isRecurring)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isRecurring ? 'bg-indigo-600' : 'bg-zinc-700'
                      }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isRecurring ? 'translate-x-6' : 'translate-x-1'
                        }`}
                    />
                  </button>
                </div>

                {isRecurring && (
                  <div className="space-y-4 pt-2">
                    {/* Interval Selector */}
                    <div className="space-y-2">
                      <Label className="text-muted-foreground text-xs uppercase tracking-wider">Intervall</Label>
                      <Select
                        value={recurringInterval}
                        onValueChange={(val) => val && setRecurringInterval(val as RecurringInterval)}
                      >
                        <SelectTrigger className="bg-background border-border h-9 shadow-none focus-visible:ring-0">
                          <SelectValue>
                            {({daily: 'Täglich', weekly: 'Wöchentlich', monthly: 'Monatlich', yearly: 'Jährlich', custom: 'Benutzerdefiniert'} as Record<string, string>)[recurringInterval] || recurringInterval}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="bg-background border-border text-foreground">
                          <SelectItem value="daily">Täglich</SelectItem>
                          <SelectItem value="weekly">Wöchentlich</SelectItem>
                          <SelectItem value="monthly">Monatlich</SelectItem>
                          <SelectItem value="yearly">Jährlich</SelectItem>
                          <SelectItem value="custom">Benutzerdefiniert</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Custom Days Input */}
                    {recurringInterval === 'custom' && (
                      <div className="space-y-2">
                        <Label className="text-muted-foreground text-xs uppercase tracking-wider">Alle X Tage</Label>
                        <Input
                          type="number"
                          min={1}
                          value={recurringCustomDays}
                          onChange={(e) => setRecurringCustomDays(parseInt(e.target.value) || 7)}
                          className="bg-background border-border h-9 text-sm"
                        />
                      </div>
                    )}

                    {/* End Date */}
                    <div className="space-y-2">
                      <Label className="text-muted-foreground text-xs uppercase tracking-wider">Enddatum (optional)</Label>
                      <Input
                        type="date"
                        value={recurringEndDate}
                        onChange={(e) => setRecurringEndDate(e.target.value)}
                        className="bg-background border-border text-foreground"
                      />
                    </div>

                    {/* Next Scheduled Date */}
                    <div className="space-y-2">
                      <Label className="text-muted-foreground text-xs uppercase tracking-wider">Nächstes Datum</Label>
                      <Input
                        type="date"
                        value={recurringNextDate}
                        onChange={(e) => setRecurringNextDate(e.target.value)}
                        className="bg-background border-border text-foreground"
                      />
                    </div>

                    {/* Info Text */}
                    <p className="text-xs text-muted-foreground">
                      Die Aufgabe wird automatisch am nächsten Datum neu erstellt.
                    </p>
                  </div>
                )}
              </div>

              {/* File Attachments Section */}
              <div id="section-dateien" className="space-y-3 p-4 rounded-xl border border-border bg-card/30">
                <div
                  className="flex items-center justify-between cursor-pointer select-none"
                  onClick={() => toggleSection('dateien')}
                >
                  <Label className="text-muted-foreground font-semibold text-lg flex items-center gap-2 cursor-pointer">
                    <Paperclip size={16} className="text-muted-foreground" />
                    Dateianhänge
                  </Label>
                  <div className="flex items-center gap-2">
                    {taskFiles.length > 0 && (
                      <Badge variant="outline" className="bg-background border-border text-muted-foreground">
                        {taskFiles.length}
                      </Badge>
                    )}
                    <Button
                      onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                      disabled={isUploadingFile}
                      size="sm"
                      variant="outline"
                      className="border-border text-muted-foreground hover:text-foreground h-8"
                    >
                      {isUploadingFile ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Upload size={14} className="mr-1" />
                      )}
                      Hochladen
                    </Button>
                    <ChevronDown
                      size={16}
                      className={`text-muted-foreground transition-transform duration-200 ${collapsedSections.dateien ? '' : 'rotate-180'}`}
                    />
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </div>
                </div>

                {!collapsedSections.dateien && (
                <>
                {/* File List */}
                <div className="space-y-1">
                  {taskFiles.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-2">Keine Dateien vorhanden</p>
                  ) : (
                    taskFiles.map((fileRecord) => {
                      const fileUrl = getFileUrl(fileRecord);
                      const fileName = fileRecord.name || fileRecord.file;
                      const fileSize = fileRecord.size;
                      const uploadDate = formatDate(fileRecord.created);

                      return (
                        <div
                          key={fileRecord.id}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-background/50 transition-colors group"
                        >
                          <Paperclip size={14} className="text-muted-foreground flex-shrink-0" />
                          <a
                            href={fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 text-sm text-foreground hover:text-indigo-400 truncate transition-colors"
                          >
                            {decodeGermanHtmlEntities(fileName)}
                          </a>
                          <span className="text-xs text-muted-foreground flex-shrink-0">
                            {uploadDate}
                          </span>
                          {fileSize != null && (
                            <span className="text-xs text-muted-foreground flex-shrink-0 font-mono">
                              {formatFileSize(fileSize)}
                            </span>
                          )}
                          <a
                            href={fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-indigo-400 transition-all p-1"
                            download={fileName}
                          >
                            <Download size={14} />
                          </a>
                          <button
                            onClick={() => handleDeleteFile(fileRecord.id)}
                            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 transition-all p-1"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
                </>
                )}
              </div>

              {/* Subtasks Section */}
              <div id="section-subtasks" className="space-y-3 p-4 rounded-xl border border-border bg-card/30">
                <div
                  className="flex items-center justify-between cursor-pointer select-none"
                  onClick={() => toggleSection('subtasks')}
                >
                  <Label className="text-muted-foreground font-semibold text-lg cursor-pointer">Unteraufgaben</Label>
                  <div className="flex items-center gap-2">
                    {subtasks.length > 0 && (
                      <Badge variant="outline" className="bg-background border-border text-muted-foreground">
                        {completedSubtasks}/{subtasks.length}
                      </Badge>
                    )}
                    <ChevronDown
                      size={16}
                      className={`text-muted-foreground transition-transform duration-200 ${collapsedSections.subtasks ? '' : 'rotate-180'}`}
                    />
                  </div>
                </div>

                {!collapsedSections.subtasks && (
                <>
                {/* Subtask List */}
                <div className="space-y-1">
                  {subtasks.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-2">Keine Unteraufgaben vorhanden</p>
                  ) : (
                    subtasks.map((subtask) => (
                      <div
                        key={subtask.id}
                        className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-background/50 transition-colors group"
                      >
                        <button
                          onClick={() => handleToggleSubtaskStatus(subtask)}
                          className="flex-shrink-0 text-muted-foreground hover:text-emerald-400 transition-colors"
                        >
                          {subtask.status === 'done' ? (
                            <CheckCircle2 size={18} className="text-emerald-400" />
                          ) : (
                            <Circle size={18} />
                          )}
                        </button>
                        <span
                          className={`flex-1 text-sm cursor-pointer hover:text-indigo-400 transition-colors ${subtask.status === 'done' ? 'line-through text-muted-foreground' : 'text-foreground'}`}
                          onClick={() => onTaskClick?.(subtask.id)}
                        >
                          {decodeGermanHtmlEntities(subtask.title)}
                        </span>
                        <button
                          onClick={() => handleDeleteSubtask(subtask.id)}
                          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 transition-all p-1"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Subtask Input */}
                <div className="flex items-center gap-2 pt-1">
                  <Input
                    placeholder="Neue Unteraufgabe hinzufügen…"
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSubtask();
                      }
                    }}
                    className="bg-background border-border h-9 text-sm flex-1"
                  />
                  <Button
                    onClick={handleAddSubtask}
                    disabled={isAddingSubtask || !newSubtaskTitle.trim()}
                    size="sm"
                    variant="outline"
                    className="border-border text-muted-foreground hover:text-foreground h-9"
                  >
                    {isAddingSubtask ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Plus size={16} />
                    )}
                  </Button>
                </div>
                </>
                )}
              </div>

              {/* Task Links Section */}
              <div id="section-verknupfungen" className="space-y-3 p-4 rounded-xl border border-border bg-card/30">
                <div
                  className="flex items-center justify-between cursor-pointer select-none"
                  onClick={() => toggleSection('verknupfungen')}
                >
                  <Label className="text-muted-foreground font-semibold text-lg flex items-center gap-2 cursor-pointer">
                    <Link2 size={16} className="text-muted-foreground" />
                    Verknüpfte Aufgaben
                  </Label>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={(e) => { e.stopPropagation(); setIsAddingLink(true); }}
                      size="sm"
                      variant="outline"
                      className="border-border text-muted-foreground hover:text-foreground h-8"
                    >
                      <Plus size={14} className="mr-1" />
                      Verknüpfen
                    </Button>
                    <ChevronDown
                      size={16}
                      className={`text-muted-foreground transition-transform duration-200 ${collapsedSections.verknupfungen ? '' : 'rotate-180'}`}
                    />
                  </div>
                </div>

                {!collapsedSections.verknupfungen && (
                <>
                {/* Add Link Form */}
                {isAddingLink && (
                  <div className="space-y-3 p-3 rounded-lg bg-background border border-border">
                    <div className="flex items-center gap-2">
                      <Select
                        value={selectedLinkType}
                        onValueChange={(val) => val && setSelectedLinkType(val as TaskLinkType)}
                      >
                        <SelectTrigger className="bg-card border-border h-9 text-sm min-w-[140px]">
                          <SelectValue>
                            {getLinkTypeLabel(selectedLinkType) || selectedLinkType}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="bg-background border-border text-foreground">
                          <SelectItem value="relates_to">Verknüpft mit</SelectItem>
                          <SelectItem value="depends_on">Hängt ab von</SelectItem>
                          <SelectItem value="blocks">Blockiert</SelectItem>
                          <SelectItem value="duplicate_of">Duplikat von</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="relative flex-1">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="Aufgabe suchen..."
                          value={linkSearchQuery}
                          onChange={(e) => handleSearchLinkTask(e.target.value)}
                          className="bg-card border-border h-9 text-sm pl-9"
                          autoFocus
                        />
                      </div>
                      <Button
                        onClick={() => {
                          setIsAddingLink(false);
                          setLinkSearchQuery('');
                          setLinkSearchResults([]);
                        }}
                        size="sm"
                        variant="ghost"
                        className="text-muted-foreground hover:text-foreground h-9"
                      >
                        <X size={16} />
                      </Button>
                    </div>

                    {/* Search Results */}
                    {linkSearchQuery.length >= 2 && (
                      <div className="max-h-40 overflow-y-auto space-y-1">
                        {isSearchingLinks ? (
                          <div className="flex items-center justify-center py-4">
                            <Loader2 size={16} className="animate-spin text-muted-foreground" />
                          </div>
                        ) : linkSearchResults.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-2">Keine Aufgaben gefunden</p>
                        ) : (
                          linkSearchResults.map((t) => (
                            <button
                              key={t.id}
                              onClick={() => handleAddLink(t.id)}
                              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-card transition-colors text-left"
                            >
                              <span className="text-sm text-foreground flex-1 truncate">{decodeGermanHtmlEntities(t.title)}</span>
                              <span className="text-xs text-muted-foreground flex-shrink-0">
                                {t.expand?.project?.key || '—'}
                              </span>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Linked Tasks List */}
                <div className="space-y-1">
                  {taskLinks.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-2">Keine Verknüpfungen vorhanden</p>
                  ) : (
                    taskLinks.map((link) => {
                      const isSource = link.source_task === taskId;
                      const linkedTask = isSource
                        ? linkedTasks.find(t => t.id === link.target_task)
                        : linkedTasks.find(t => t.id === link.source_task);

                      return (
                        <div
                          key={link.id}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-background/50 transition-colors group"
                        >
                          <Badge
                            variant="outline"
                            className={`text-[10px] uppercase tracking-wider font-mono ${getLinkTypeColor(link.link_type)}`}
                          >
                            {isSource ? getLinkTypeLabel(link.link_type) : 'wird verknüpft von'}
                          </Badge>
                          <span className="flex-1 text-sm text-foreground truncate">
                            {decodeGermanHtmlEntities(linkedTask?.title || 'Unbekannte Aufgabe')}
                          </span>
                          <span className="text-xs text-muted-foreground flex-shrink-0">
                            {linkedTask?.expand?.project?.key || '—'}
                          </span>
                          <button
                            onClick={() => handleRemoveLink(link.id)}
                            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 transition-all p-1"
                          >
                            <Unlink size={14} />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
                </>
                )}
              </div>

              {/* Comments Section */}
              <div id="section-kommentare" className="space-y-3 p-4 rounded-xl border border-border bg-card/30">
                <div
                  className="flex items-center justify-between cursor-pointer select-none"
                  onClick={() => toggleSection('kommentare')}
                >
                  <Label className="text-muted-foreground font-semibold text-lg flex items-center gap-2 cursor-pointer">
                    <MessageSquare size={16} className="text-muted-foreground" />
                    Kommentare
                  </Label>
                  <div className="flex items-center gap-2">
                    {commentCount > 0 && (
                      <span className="text-xs text-muted-foreground bg-background border border-border px-2 py-0.5 rounded-full">
                        {commentCount}
                      </span>
                    )}
                    <ChevronDown
                      size={16}
                      className={`text-muted-foreground transition-transform duration-200 ${collapsedSections.kommentare ? '' : 'rotate-180'}`}
                    />
                  </div>
                </div>
                {!collapsedSections.kommentare && taskId && (
                  <TaskComments
                    taskId={taskId}
                    taskTitle={title}
                    projectKey={projectKey}
                  />
                )}
              </div>

              {/* Description */}
              <div id="section-beschreibung" className="space-y-3">
                <Label className="text-muted-foreground font-semibold text-lg">Beschreibung</Label>
                <RichTextEditor
                  content={description}
                  onChange={setDescription}
                />
              </div>
            </div>
            </div>

            <div className="p-6 border-t border-border/50 bg-background flex justify-end gap-3">
              <Button variant="ghost" onClick={onClose} className="text-muted-foreground hover:text-foreground hover:bg-card">
                Abbrechen
              </Button>
              <Button onClick={handleSave} disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_15px_rgba(79,70,229,0.2)]">
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Änderungen speichern
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
