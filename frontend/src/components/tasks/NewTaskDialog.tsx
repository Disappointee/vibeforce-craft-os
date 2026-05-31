'use client';

import { useState } from 'react';
import { pb } from '@/lib/pocketbase';
import { toast } from 'sonner';
import { Loader2, Plus } from 'lucide-react';
import { decodeGermanHtmlEntities } from '@/lib/utils';
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
import { TaskType } from '@/lib/pocketbase-types';

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

export function NewTaskDialog({ projectId, onTaskCreated }: { projectId: string, onTaskCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('medium');
  const [status, setStatus] = useState('todo');
  const [type, setType] = useState<TaskType>('other');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const userId = pb.authStore.record?.id;
      await pb.collection('tasks').create({
        project: projectId,
        title,
        status,
        priority,
        type,
        assignees: userId ? [userId] : [],
      });

      toast.success('Aufgabe erstellt!');
      setOpen(false);
      setTitle('');
      setPriority('medium');
      setStatus('todo');
      setType('other');
      onTaskCreated(); // Trigger reload
    } catch (error: any) {
      console.error(error);
      toast.error('Fehler beim Erstellen der Aufgabe.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <button className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-full px-6 py-2 flex items-center gap-2 shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-all font-medium text-sm outline-none">
            <Plus size={18} />
            Neue Aufgabe
          </button>
        }
      />
      <DialogContent className="sm:max-w-[800px] max-w-[90vw] bg-background border-border text-foreground">
        <DialogHeader>
          <DialogTitle className="text-xl">Neue Aufgabe anlegen</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">

          <div className="space-y-2">
            <Label htmlFor="title" className="text-foreground text-xs uppercase tracking-wider">Titel</Label>
            <Input
              id="title"
              placeholder="Was muss erledigt werden?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="bg-card border-border focus-visible:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-foreground text-xs uppercase tracking-wider">Art</Label>
              <Select value={type} onValueChange={(val) => val && setType(val as TaskType)}>
                <SelectTrigger className="bg-card border-border">
                  <SelectValue placeholder="Art wählen">
                    {(value: string) => decodeGermanHtmlEntities(TASK_TYPE_LABELS[value as TaskType] || value || 'Art wählen')}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-background border-border text-foreground">
                  {(Object.keys(TASK_TYPE_LABELS) as TaskType[]).map((key) => (
                    <SelectItem key={key} value={key}>
                      {decodeGermanHtmlEntities(TASK_TYPE_LABELS[key])}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground text-xs uppercase tracking-wider">Status</Label>
              <Select value={status} onValueChange={(val) => val && setStatus(val)}>
                <SelectTrigger className="bg-card border-border">
                  <SelectValue placeholder="Status wählen">
                    {(value: string) => (
                      {todo: 'Offen', in_progress: 'In Arbeit', review: 'Prüfung', done: 'Erledigt'}[value] || value || 'Status wählen'
                    )}
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
              <Label className="text-foreground text-xs uppercase tracking-wider">Priorität</Label>
              <Select value={priority} onValueChange={(val) => val && setPriority(val)}>
                <SelectTrigger className="bg-card border-border">
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

          <DialogFooter>
            <Button type="submit" disabled={isLoading} className="w-full bg-white text-zinc-950 hover:bg-zinc-200 mt-4">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Speichern
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
