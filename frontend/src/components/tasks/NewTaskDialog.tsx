'use client';

import { useState, useEffect } from 'react';
import { pb } from '@/lib/pocketbase';
import { useUiStore } from '@/lib/store';
import { toast } from 'sonner';
import { Loader2, Plus, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ClientRecord, ProjectRecord } from '@/lib/pocketbase-types';

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {[1, 2, 3].map((s) => (
        <div key={s} className="flex items-center gap-2">
          <div
            className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all ${
              currentStep > s ? 'bg-indigo-600 text-white' :
              currentStep === s ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' :
              'bg-card border border-border text-muted-foreground'
            }`}
          >
            {currentStep > s ? <Check size={14} /> : s}
          </div>
          {s < 3 && (
            <div className={`w-10 h-0.5 rounded transition-colors ${currentStep > s ? 'bg-indigo-600' : 'bg-border'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

export function NewTaskDialog({ onTaskCreated }: { onTaskCreated: () => void }) {
  const taskDialogOpen = useUiStore(s => s.taskDialogOpen);
  const setTaskDialogOpen = useUiStore(s => s.setTaskDialogOpen);

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('medium');

  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientsResult, projectsResult] = await Promise.all([
          pb.collection('clients').getList(1, 200, { sort: 'name' }),
          pb.collection('projects').getList(1, 200, { sort: 'name' }),
        ]);
        setClients(clientsResult.items as unknown as ClientRecord[]);
        setProjects(projectsResult.items as unknown as ProjectRecord[]);
      } catch (error) {
        console.error('Error fetching clients/projects:', error);
      }
    };
    fetchData();
  }, []);

  const availableProjects = selectedClientId
    ? projects.filter(p => (p as any).client === selectedClientId)
    : [];

  const selectedClient = clients.find(c => c.id === selectedClientId);
  const selectedProject = projects.find(p => p.id === selectedProjectId);

  const canProceedStep1 = !!selectedClientId;
  const canProceedStep2 = !!selectedProjectId;
  const canSave = !!(selectedClientId && selectedProjectId && title.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId || !title.trim()) {
      toast.error('Bitte fülle alle Pflichtfelder aus (Projekt und Titel).');
      return;
    }
    setIsLoading(true);

    try {
      const userId = pb.authStore.record?.id;
      await pb.collection('tasks').create({
        project: selectedProjectId,
        title: title.trim(),
        status: 'todo',
        priority,
        type: 'other',
        assignees: userId ? [userId] : [],
      });

      toast.success('Aufgabe erstellt!');
      setTaskDialogOpen(false);
      setTitle('');
      setPriority('medium');
      setSelectedClientId('');
      setSelectedProjectId('');
      setStep(1);
      onTaskCreated();
    } catch (error) {
      console.error(error);
      toast.error('Fehler beim Erstellen der Aufgabe.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setTaskDialogOpen(open);
    if (!open) {
      setTitle('');
      setPriority('medium');
      setSelectedClientId('');
      setSelectedProjectId('');
      setStep(1);
    }
  };

  return (
    <Dialog open={taskDialogOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <button className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-full px-6 py-2 flex items-center gap-2 shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-all font-medium text-sm outline-none" type="button">
            <Plus size={18} />
            Neue Aufgabe
          </button>
        }
      />
      <DialogContent className="sm:max-w-[500px] max-w-[90vw] bg-background border-border text-foreground">
        <DialogHeader>
          <DialogTitle className="text-xl">Neue Aufgabe anlegen</DialogTitle>
        </DialogHeader>

        <StepIndicator currentStep={step} />

        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          {step === 1 && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground text-center">Wähle den Kunden aus, für den die Aufgabe erstellt wird.</div>
              <div className="space-y-2">
                <Label className="text-foreground text-xs uppercase tracking-wider">Kunde</Label>
                <Select value={selectedClientId} onValueChange={(val) => { if (val) { setSelectedClientId(val); setSelectedProjectId(''); } }}>
                  <SelectTrigger className="bg-card border-border w-full">
                    <SelectValue placeholder="Kunde wählen">
                      {(value: string) => {
                        const client = clients.find(c => c.id === value);
                        return client?.name || 'Kunde wählen';
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-background border-border text-foreground max-h-60">
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground text-center">
                Kunde: <span className="text-foreground font-medium">{selectedClient?.name || '—'}</span>
              </div>
              <div className="space-y-2">
                <Label className="text-foreground text-xs uppercase tracking-wider">Projekt</Label>
                <Select value={selectedProjectId} onValueChange={(val) => val && setSelectedProjectId(val)}>
                  <SelectTrigger className="bg-card border-border w-full">
                    <SelectValue placeholder="Projekt wählen">
                      {(value: string) => {
                        const project = projects.find(p => p.id === value);
                        return project?.name || 'Projekt wählen';
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-background border-border text-foreground max-h-60">
                    {availableProjects.length === 0 ? (
                      <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                        Keine Projekte für diesen Kunden
                      </div>
                    ) : (
                      availableProjects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground text-center">
                Kunde: <span className="text-foreground font-medium">{selectedClient?.name || '—'}</span>
                <span className="mx-2"> / </span>
                Projekt: <span className="text-foreground font-medium">{selectedProject?.name || '—'}</span>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title" className="text-foreground text-xs uppercase tracking-wider">Titel</Label>
                <Input
                  id="title"
                  placeholder="Was muss erledigt werden?"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  autoFocus
                  className="bg-card border-border focus-visible:ring-indigo-500"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-foreground text-xs uppercase tracking-wider">Priorität</Label>
                <Select value={priority} onValueChange={(val) => { if (val) setPriority(val); }}>
                  <SelectTrigger className="bg-card border-border w-full">
                    <SelectValue placeholder="Priorität wählen">
                      {(value: string) => (
                        {low: 'Niedrig', medium: 'Mittel', high: 'Hoch', acute: 'Akut'}[value] || value || 'Priorität wählen'
                      )}
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
            </div>
          )}

          <DialogFooter className="flex-row justify-between gap-2 sm:gap-2">
            {step > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(step - 1)}
                className="border-border text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft size={16} className="mr-1.5" />
                Zurück
              </Button>
            )}
            {step < 3 && (
              <Button
                type="button"
                onClick={() => setStep(step + 1)}
                disabled={step === 1 ? !canProceedStep1 : !canProceedStep2}
                className="ml-auto bg-indigo-600 hover:bg-indigo-500 text-white"
              >
                Weiter
                <ArrowRight size={16} className="ml-1.5" />
              </Button>
            )}
            {step === 3 && (
              <Button
                type="submit"
                disabled={isLoading || !canSave}
                className="ml-auto bg-white text-zinc-950 hover:bg-zinc-200"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Speichern
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
