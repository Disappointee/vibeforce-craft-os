'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { pb } from '@/lib/pocketbase';
import { toast } from 'sonner';
import { Loader2, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { DatePicker } from '@/components/ui/date-picker';

export function NewProjectDialog({
  onProjectCreated,
  open: externalOpen,
  onOpenChange: setExternalOpen,
}: {
  onProjectCreated: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = setExternalOpen || setInternalOpen;
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingKey, setIsCheckingKey] = useState(false);
  const [keyError, setKeyError] = useState<string | null>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    key: '',
    budget_hours: '',
    client: '',
    start_date: undefined as Date | undefined,
    due_date: undefined as Date | undefined,
  });

  // Fetch clients when dialog opens
  useEffect(() => {
    if (open) {
      const fetchClients = async () => {
        try {
          const result = await pb.collection('clients').getList(1, 100, {
            filter: 'status = "active"',
            sort: 'name',
          });
          setClients(result.items);
        } catch (error) {
          console.error('Failed to fetch clients:', error);
        }
      };
      fetchClients();
    }
  }, [open]);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced duplicate key check
  const checkDuplicateKey = useCallback(async (key: string) => {
    if (!key || key.length < 2) {
      setKeyError(null);
      return;
    }

    setIsCheckingKey(true);
    try {
      const existing = await pb.collection('projects').getList(1, 1, {
        filter: pb.filter('key = {:key}', { key: key.toUpperCase() }),
      });
      if (existing.totalItems > 0) {
        setKeyError('Dieser Projekt-Key existiert bereits.');
      } else {
        setKeyError(null);
      }
    } catch {
      // Silently fail – the submit handler will catch duplicates too
      setKeyError(null);
    } finally {
      setIsCheckingKey(false);
    }
  }, []);

  // Debounce key changes: 300ms after user stops typing
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      checkDuplicateKey(formData.key);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [formData.key, checkDuplicateKey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Final check before submit
    if (keyError) {
      toast.error(keyError);
      return;
    }

    setIsLoading(true);

    try {
      // Check for duplicate key one more time (in case debounce didn't finish)
      const existing = await pb.collection('projects').getList(1, 1, {
        filter: pb.filter('key = {:key}', { key: formData.key.toUpperCase() })
      });
      if (existing.totalItems > 0) {
        setKeyError('Dieser Projekt-Key existiert bereits.');
        setIsLoading(false);
        return;
      }

      // In PocketBase, the schema requires status. We default to 'active'
      await pb.collection('projects').create({
        name: formData.name,
        key: formData.key.toUpperCase(),
        status: 'active',
        budget_hours: formData.budget_hours ? Number(formData.budget_hours) : null,
        client: formData.client || null,
        start_date: formData.start_date ? formData.start_date.toISOString() : null,
        due_date: formData.due_date ? formData.due_date.toISOString() : null,
      });

      toast.success('Projekt erfolgreich erstellt!');
      setOpen(false);
      setFormData({ name: '', key: '', budget_hours: '', client: '', start_date: undefined, due_date: undefined });
      setKeyError(null);
      onProjectCreated(); // Trigger reload
    } catch (error: any) {
      console.error(error);
      toast.error('Fehler beim Erstellen des Projekts. Projektschlüssel evtl. schon vergeben?');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-generate a Key from the name if the user hasn't typed one
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setFormData(prev => ({
      ...prev,
      name: newName,
      // Only auto-generate if key is empty or looks auto-generated (max 3 chars)
      key: prev.key.length <= 3 ? newName.substring(0, 3).toUpperCase() : prev.key
    }));
  };

  const isSubmitDisabled = isLoading || isCheckingKey || !!keyError;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {externalOpen === undefined && (
        <DialogTrigger
          render={
            <button className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-full px-6 py-2 flex items-center gap-2 shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-all font-medium text-sm outline-none">
              <Plus size={18} />
              Neues Projekt
            </button>
          }
        />
      )}
      <DialogContent className="sm:max-w-[425px] bg-background border-border text-foreground">
        <DialogHeader>
          <DialogTitle className="text-xl">Neues Projekt anlegen</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Erstelle einen neuen Arbeitsbereich für das Team. Der Projektschlüssel wird für alle Aufgaben verwendet (z.B. DEV-1).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-foreground text-xs uppercase tracking-wider">Projektname</Label>
            <Input
              id="name"
              placeholder="z.B. Website Relaunch"
              value={formData.name}
              onChange={handleNameChange}
              required
              className="bg-card border-border focus-visible:ring-indigo-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="key" className="text-foreground text-xs uppercase tracking-wider">Projektschlüssel</Label>
              <Input
                id="key"
                placeholder="WEB"
                maxLength={5}
                value={formData.key}
                onChange={(e) => setFormData({ ...formData, key: e.target.value.toUpperCase() })}
                required
                className={`bg-card border focus-visible:ring-indigo-500 font-mono uppercase ${keyError ? 'border-red-500' : 'border-border'}`}
              />
              {isCheckingKey && (
                <p className="text-xs text-muted-foreground mt-1">Prüfe Verfügbarkeit...</p>
              )}
              {keyError && (
                <p className="text-xs text-red-400 mt-1">{keyError}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget" className="text-foreground text-xs uppercase tracking-wider">Stunden-Budget</Label>
              <Input
                id="budget"
                type="number"
                placeholder="optional"
                value={formData.budget_hours}
                onChange={(e) => setFormData({ ...formData, budget_hours: e.target.value })}
                className="bg-card border-border focus-visible:ring-indigo-500"
              />
            </div>
          </div>

          {/* Date fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-foreground text-xs uppercase tracking-wider">Startdatum</Label>
              <DatePicker
                value={formData.start_date}
                onChange={(date) => setFormData({ ...formData, start_date: date })}
                placeholder="tt.mm.jjjj"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground text-xs uppercase tracking-wider">Enddatum</Label>
              <DatePicker
                value={formData.due_date}
                onChange={(date) => setFormData({ ...formData, due_date: date })}
                placeholder="tt.mm.jjjj"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="client" className="text-foreground text-xs uppercase tracking-wider">Kunde (optional)</Label>
            <Select
              value={formData.client}
              onValueChange={(val) => val && setFormData({ ...formData, client: val === 'none' ? '' : val })}
            >
              <SelectTrigger className="bg-card border-border">
                <SelectValue placeholder="Kein Kunde zugeordnet">
                  {(value: string) => {
                    if (!value) return 'Kein Kunde zugeordnet';
                    const client = clients.find(c => c.id === value);
                    return client ? `${client.name}${client.company ? ` (${client.company})` : ''}` : value;
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-background border-border text-foreground">
                <SelectItem value="none">Kein Kunde</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}{client.company ? ` (${client.company})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitDisabled} className="w-full bg-white text-zinc-950 hover:bg-zinc-200 disabled:opacity-50">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Projekt erstellen
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
