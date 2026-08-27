import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { pb } from '@/lib/pocketbase';
import { toast } from 'sonner';
import { useTimerStore } from '@/lib/store';
import { TaskRecord, UserRecord, TaskType, TaskFileRecord, ChecklistItemRecord } from '@/lib/pocketbase-types';
import { updateTaskAction, deleteTaskAction, uploadTaskFileAction, deleteTaskFileAction, createChecklistItemAction, updateChecklistItemAction, deleteChecklistItemAction, createTaskAction } from '@/app/actions/tasks';
import { createTimeEntryAction, deleteTimeEntryAction } from '@/app/actions/time-entries';
import { decodeGermanHtmlEntities } from '@/lib/utils';

export function useTaskDetails(taskId: string | null, onClose: () => void, onTaskUpdated: () => void) {
  const router = useRouter();
  const { runningTaskId, startTimer, stopAndSaveTimer } = useTimerStore();
  
  const [task, setTask] = useState<TaskRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeletingTask, setIsDeletingTask] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [allUsers, setAllUsers] = useState<UserRecord[]>([]);
  const [isStoppingTimer, setIsStoppingTimer] = useState(false);

  // Comments state
  const [commentCount, setCommentCount] = useState(0);

  // Type (Art) state
  const [taskType, setTaskType] = useState<string>('other');

  // Hours overview & manual entry state
  const [totalLoggedHours, setTotalLoggedHours] = useState(0);
  const [estimatedHours, setEstimatedHours] = useState<number>(0);
  const [taskTimeEntries, setTaskTimeEntries] = useState<any[]>([]);
  const [isAddingTimeEntry, setIsAddingTimeEntry] = useState(false);

  // File attachments state
  const [taskFiles, setTaskFiles] = useState<TaskFileRecord[]>([]);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Checklist items & Subtasks state
  const [checklistItems, setChecklistItems] = useState<ChecklistItemRecord[]>([]);
  const [subtasks, setSubtasks] = useState<TaskRecord[]>([]);
  const [isAddingChecklist, setIsAddingChecklist] = useState(false);
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);

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
        setEstimatedHours(record.estimated_hours || 0);
        const assigneeArr = record.assignees
          ? (Array.isArray(record.assignees) ? record.assignees : [record.assignees])
          : [];
        setAssigneeId(assigneeArr[0]?.id || null);
        setStartDate(record.start_date ? (record.start_date.includes('T') || record.start_date.includes(' ') ? record.start_date.replace(' ', 'T').substring(0, 16) : `${record.start_date}T00:00`) : '');
        setDueDate(record.due_date ? (record.due_date.includes('T') || record.due_date.includes(' ') ? record.due_date.replace(' ', 'T').substring(0, 16) : `${record.due_date}T00:00`) : '');

        // Fetch all independent data in parallel with catch fallbacks
        const [
          commentResult,
          timeEntriesResult,
          filesResult,
          checklistResult,
          subtasksResult,
        ] = await Promise.all([
          pb.collection('task_comments').getList(1, 1, {
            filter: pb.filter('task = {:tid}', { tid: taskId }),
          }).catch(() => ({ totalItems: 0 } as any)),
          pb.collection('time_entries').getList(1, 500, {
            filter: pb.filter('task = {:tid}', { tid: taskId }),
            sort: '-start_time',
            expand: 'user',
          }).catch(() => ({ items: [] } as any)),
          pb.collection('task_files').getList(1, 50, {
            filter: pb.filter('task = {:tid}', { tid: taskId }),
            sort: '-created',
          }).catch(() => ({ items: [] } as any)),
          pb.collection('checklist_items').getList(1, 100, {
            filter: pb.filter('task = {:tid}', { tid: taskId }),
            sort: 'sort_order,created',
          }).catch(() => ({ items: [] } as any)),
          pb.collection('tasks').getList(1, 50, {
            filter: pb.filter('parent_task = {:tid}', { tid: taskId }),
            expand: 'assignees',
            sort: '-created',
          }).catch(() => ({ items: [] } as any)),
        ]);

        setCommentCount((commentResult as any).totalItems || 0);

        const fetchedEntries = (timeEntriesResult as any).items || [];
        setTaskTimeEntries(fetchedEntries);
        const totalMinutes = fetchedEntries.reduce(
          (sum: number, te: any) => sum + (te.duration_minutes || te.duration || 0), 0,
        );
        setTotalLoggedHours(totalMinutes / 60);

        setTaskFiles((filesResult as any).items as TaskFileRecord[]);
        setChecklistItems((checklistResult as any).items as ChecklistItemRecord[]);
        setSubtasks((subtasksResult as any).items as TaskRecord[]);
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
        estimated_hours: Number(estimatedHours) || 0,
        assignees: assigneeId ? [assigneeId] : [],
        start_date: toPbDate(startDate),
        due_date: toPbDate(dueDate),
      };

      await updateTaskAction(taskId, updateData);
      toast.success('Aufgabe aktualisiert');
      router.refresh();
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

  const handleDeleteTask = async () => {
    if (!taskId) return;
    setIsDeletingTask(true);
    try {
      await deleteTaskAction(taskId);
      toast.success('Aufgabe gelöscht');
      router.refresh();
      onTaskUpdated();
      onClose();
    } catch (error) {
      console.error('Failed to delete task:', error);
      toast.error('Fehler beim Löschen der Aufgabe');
    } finally {
      setIsDeletingTask(false);
      setShowDeleteConfirm(false);
    }
  };

  // Manual Time Entry Handler
  const handleCreateManualTimeEntry = async (durationMinutes: number, note: string) => {
    if (!taskId || durationMinutes <= 0) return;
    setIsAddingTimeEntry(true);
    try {
      const now = new Date();
      const startTime = now.toISOString().replace('T', ' ').substring(0, 19);
      const endDateObj = new Date(now.getTime() + durationMinutes * 60000);
      const endTime = endDateObj.toISOString().replace('T', ' ').substring(0, 19);

      const created = await createTimeEntryAction({
        task: taskId,
        start_time: startTime,
        end_time: endTime,
        duration_minutes: durationMinutes,
        description: note || 'Manuelle Buchung',
        is_billable: true,
      });

      setTaskTimeEntries(prev => [created, ...prev]);
      setTotalLoggedHours(prev => prev + durationMinutes / 60);
      toast.success('Zeit erfolgreich gebucht');
      router.refresh();
      onTaskUpdated();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Fehler beim Buchen der Zeit');
    } finally {
      setIsAddingTimeEntry(false);
    }
  };

  const handleDeleteTimeEntry = async (entryId: string, durationMin: number) => {
    try {
      await deleteTimeEntryAction(entryId);
      setTaskTimeEntries(prev => prev.filter(e => e.id !== entryId));
      setTotalLoggedHours(prev => Math.max(0, prev - durationMin / 60));
      toast.success('Zeiteintrag gelöscht');
      router.refresh();
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

      const created = await uploadTaskFileAction(formData);
      setTaskFiles(prev => [created as TaskFileRecord, ...prev]);
      toast.success('Datei hochgeladen');
      router.refresh();
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
      await deleteTaskFileAction(fileId);
      setTaskFiles(prev => prev.filter(f => f.id !== fileId));
      toast.success('Datei gelöscht');
      router.refresh();
      onTaskUpdated();
    } catch (error) {
      toast.error('Fehler beim Löschen');
    }
  };

  // Checklist Item Handlers
  const handleCreateChecklistItem = async (itemTitle: string) => {
    if (!taskId || !itemTitle.trim()) return;
    setIsAddingChecklist(true);
    try {
      const created = await createChecklistItemAction(taskId, itemTitle.trim(), checklistItems.length);
      setChecklistItems(prev => [...prev, created as ChecklistItemRecord]);
      toast.success('Eintrag hinzugefügt');
    } catch (error) {
      console.error(error);
      toast.error('Fehler beim Hinzufügen des Eintrags');
    } finally {
      setIsAddingChecklist(false);
    }
  };

  const handleToggleChecklistItem = async (item: ChecklistItemRecord) => {
    const updatedCompleted = !item.completed;
    setChecklistItems(prev => prev.map(i => i.id === item.id ? { ...i, completed: updatedCompleted } : i));
    try {
      await updateChecklistItemAction(item.id, { completed: updatedCompleted });
    } catch (error) {
      console.error(error);
      toast.error('Fehler beim Aktualisieren');
      setChecklistItems(prev => prev.map(i => i.id === item.id ? { ...i, completed: item.completed } : i));
    }
  };

  const handleDeleteChecklistItem = async (itemId: string) => {
    const previous = [...checklistItems];
    setChecklistItems(prev => prev.filter(i => i.id !== itemId));
    try {
      await deleteChecklistItemAction(itemId);
      toast.success('Eintrag gelöscht');
    } catch (error) {
      console.error(error);
      toast.error('Fehler beim Löschen');
      setChecklistItems(previous);
    }
  };

  // Subtask Handlers
  const handleCreateSubtask = async (subtaskTitle: string) => {
    if (!taskId || !task || !subtaskTitle.trim()) return;
    setIsAddingSubtask(true);
    try {
      const created = await createTaskAction({
        project: task.project,
        title: subtaskTitle.trim(),
        parent_task: taskId,
        status: 'todo',
        priority: 'medium',
      });
      setSubtasks(prev => [created as TaskRecord, ...prev]);
      toast.success('Unteraufgabe erstellt');
      router.refresh();
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
    setSubtasks(prev => prev.map(s => s.id === subtask.id ? { ...s, status: newStatus } : s));
    try {
      await updateTaskAction(subtask.id, { status: newStatus });
      router.refresh();
      onTaskUpdated();
    } catch (error) {
      console.error(error);
      toast.error('Fehler beim Aktualisieren der Unteraufgabe');
      setSubtasks(prev => prev.map(s => s.id === subtask.id ? { ...s, status: subtask.status } : s));
    }
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    const previous = [...subtasks];
    setSubtasks(prev => prev.filter(s => s.id !== subtaskId));
    try {
      await deleteTaskAction(subtaskId);
      toast.success('Unteraufgabe gelöscht');
      router.refresh();
      onTaskUpdated();
    } catch (error) {
      console.error(error);
      toast.error('Fehler beim Löschen der Unteraufgabe');
      setSubtasks(previous);
    }
  };

  return {
    taskId,
    task,
    isLoading,
    isSaving,
    isDeletingTask,
    showDeleteConfirm,
    setShowDeleteConfirm,
    allUsers,
    isStoppingTimer,
    runningTaskId,
    startTimer,
    stopAndSaveTimer,
    commentCount,
    taskType,
    setTaskType,
    totalLoggedHours,
    estimatedHours,
    setEstimatedHours,
    taskTimeEntries,
    isAddingTimeEntry,
    handleCreateManualTimeEntry,
    handleDeleteTimeEntry,
    taskFiles,
    isUploadingFile,
    fileInputRef,
    collapsedSections,
    toggleSection,
    title,
    setTitle,
    description,
    setDescription,
    status,
    setStatus,
    priority,
    setPriority,
    assigneeId,
    setAssigneeId,
    startDate,
    setStartDate,
    dueDate,
    setDueDate,
    handleSave,
    handleDeleteTask,
    handleFileUpload,
    handleDeleteFile,
    checklistItems,
    subtasks,
    isAddingChecklist,
    isAddingSubtask,
    handleCreateChecklistItem,
    handleToggleChecklistItem,
    handleDeleteChecklistItem,
    handleCreateSubtask,
    handleToggleSubtaskStatus,
    handleDeleteSubtask,
  };
}

