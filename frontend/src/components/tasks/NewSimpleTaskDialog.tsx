'use client';

import { useState, useEffect } from 'react';
import { pb } from '@/lib/pocketbase';
import { toast } from 'sonner';
import { Loader2, ChevronDown, ChevronRight } from 'lucide-react';
import { parseSlashCommands } from '@/lib/slashParser';
import { decodeGermanHtmlEntities } from '@/lib/utils';
import { getUserDisplayName } from '@/lib/user-utils';
import { createTaskAction } from '@/app/actions/tasks';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ProjectRecord, UserRecord, ClientRecord } from '@/lib/pocketbase-types';
import { DatePicker } from '@/components/ui/date-picker';

export function NewSimpleTaskDialog({
  open,
  onOpenChange,
  onTaskCreated,
  defaultProjectId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskCreated: () => void;
  defaultProjectId?: string;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [projectId, setProjectId] = useState('');
  const [priority, setPriority] = useState('medium');
  const [status, setStatus] = useState('todo');
  const [description, setDescription] = useState('');
  const [showDescription, setShowDescription] = useState(false);
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [assigneeId, setAssigneeId] = useState('');

  const availableProjects = selectedClientId
    ? projects.filter(p => (p as any).client === selectedClientId)
    : projects;
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    if (!open) return;
    const fetchData = async () => {
      setProjectsLoading(true);
      try {
        const [projectsResult, usersResult, clientsResult] = await Promise.all([
          pb.collection('projects').getFullList({ sort: 'name' }),
          pb.collection('users').getFullList({ sort: 'name' }),
          pb.collection('clients').getFullList({ sort: 'name' }),
        ]);
        setProjects(projectsResult as ProjectRecord[]);
        setUsers(usersResult as UserRecord[]);
        setClients(clientsResult as ClientRecord[]);
      } catch {
        toast.error('Fehler beim Laden der Daten');
      } finally {
        setProjectsLoading(false);
      }
    };
    fetchData();
  }, [open]);

  useEffect(() => {
    if (open && defaultProjectId) {
      setProjectId(defaultProjectId);
    } else if (open && !defaultProjectId) {
      const lastProjectId = localStorage.getItem('vibeforce-last-project-id');
      if (lastProjectId) setProjectId(lastProjectId);
    }
  }, [open, defaultProjectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) {
      toast.error('Bitte wähle ein Projekt aus.');
      return;
    }
    setIsLoading(true);

    try {
      await createTaskAction({
        project: projectId,
        title,
        description: description || undefined,
        status,
        priority,
        assignees: assigneeId ? [assigneeId] : [],
        due_date: dueDate ? dueDate.toISOString() : undefined,
      });

      toast.success('Aufgabe erstellt!');
      localStorage.setItem('vibeforce-last-project-id', projectId);
      onOpenChange(false);
      setTitle('');
      setDescription('');
      setShowDescription(false);
      setProjectId('');
      setSelectedClientId('');
      setPriority('medium');
      setStatus('todo');
      setAssigneeId('');
      setDueDate(undefined);
      onTaskCreated();
    } catch {
      toast.error('Fehler beim Erstellen der Aufgabe.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1000px] max-w-[95vw] bg-background border-border text-foreground">
        <DialogHeader>
          <DialogTitle className="text-xl">Neue Aufgabe anlegen</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="st-title" className="text-foreground text-xs uppercase tracking-[0.06em]">Titel</Label>
            <Input
              id="st-title"
              placeholder="Was muss erledigt werden?"
              value={title}
              onChange={(e) => {
                const value = e.target.value;
                if (value.endsWith(' ')) {
                  try {
                    const parsed = parseSlashCommands(value);
                    setTitle(parsed.cleanText + ' ');
                    if (parsed.isPriority) setPriority('high');
                    if (parsed.projectName) {
                      const match = projects.find(p =>
                        p.name.toLowerCase().includes(parsed.projectName!.toLowerCase()) ||
                        p.key.toLowerCase() === parsed.projectName!.toLowerCase()
                      );
                      if (match) setProjectId(match.id);
                    }
                  } catch {
                    setTitle(value);
                  }
                } else {
                  setTitle(value);
                }
              }}
              required
              className="bg-card border-border focus-visible:ring-indigo-500"
            />
          </div>

          <div className="space-y-1">
            <button
              type="button"
              onClick={() => setShowDescription(!showDescription)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground tracking-[0.06em] uppercase transition-colors"
            >
              {showDescription ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              + Beschreibung hinzufügen
            </button>
            {showDescription && (
              <Textarea
                placeholder="Notizen, Details..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="bg-card border-border focus-visible:ring-indigo-500 rounded-lg mt-1"
              />
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label className="text-foreground text-xs uppercase tracking-[0.06em]">Kunde</Label>
              <Select value={selectedClientId || 'all'} onValueChange={(val) => {
                if (val === 'all' || !val) {
                  setSelectedClientId('');
                } else {
                  setSelectedClientId(val);
                  setProjectId('');
                }
              }}>
                <SelectTrigger className="bg-card border-border">
                  <SelectValue placeholder="Kunde wählen">
                    {selectedClientId ? decodeGermanHtmlEntities(clients.find(c => c.id === selectedClientId)?.name || '') : 'Alle Kunden'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-background border-border text-foreground">
                  <SelectItem value="all">Alle Kunden</SelectItem>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {decodeGermanHtmlEntities(c.name)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="st-project" className="text-foreground text-xs uppercase tracking-[0.06em]">Projekt *</Label>
              <Select value={projectId} onValueChange={(val) => {
                if (val) {
                  setProjectId(val);
                  const selectedProj = projects.find(p => p.id === val);
                  if (selectedProj && (selectedProj as any).client) {
                    setSelectedClientId((selectedProj as any).client);
                  }
                }
              }}>
                <SelectTrigger id="st-project" className="bg-card border-border">
                  <SelectValue placeholder={projectsLoading ? 'Lade Projekte...' : 'Projekt auswählen'}>
                    {projectId ? decodeGermanHtmlEntities(projects.find(p => p.id === projectId)?.name || '') : (projectsLoading ? 'Lade Projekte...' : 'Projekt auswählen')}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-background border-border text-foreground">
                  {availableProjects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {decodeGermanHtmlEntities(p.name)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground text-xs uppercase tracking-[0.06em]">Status</Label>
              <Select value={status} onValueChange={(val) => val && setStatus(val)}>
                <SelectTrigger className="bg-card border-border">
                  <SelectValue placeholder="Status wählen">
                    {({todo: 'Offen', in_progress: 'In Arbeit', review: 'Prüfung', done: 'Erledigt'} as Record<string, string>)[status] || 'Status wählen'}
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
              <Label className="text-foreground text-xs uppercase tracking-[0.06em]">Priorität</Label>
              <Select value={priority} onValueChange={(val) => val && setPriority(val)}>
                <SelectTrigger className="bg-card border-border">
                  <SelectValue placeholder="Priorität wählen">
                    {({low: 'Niedrig', medium: 'Mittel', high: 'Hoch', acute: 'Akut'} as Record<string, string>)[priority] || 'Priorität wählen'}
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
              <Label className="text-foreground text-xs uppercase tracking-[0.06em]">Zuständig</Label>
              <Select value={assigneeId || 'unassigned'} onValueChange={(val) => setAssigneeId(!val || val === 'unassigned' ? '' : val)}>
                <SelectTrigger className="bg-card border-border">
                  <SelectValue placeholder="Nicht zugewiesen">
                    {assigneeId ? (getUserDisplayName(users.find(u => u.id === assigneeId)) || '') : 'Nicht zugewiesen'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-background border-border text-foreground">
                  <SelectItem value="unassigned">Nicht zugewiesen</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name || u.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-foreground text-xs uppercase tracking-[0.06em]">Zu erledigen bis</Label>
            <DatePicker
              value={dueDate}
              onChange={setDueDate}
              placeholder="tt.mm.jjjj"
              minYear={new Date().getFullYear()}
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isLoading || !projectId} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 mt-4">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Speichern
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
