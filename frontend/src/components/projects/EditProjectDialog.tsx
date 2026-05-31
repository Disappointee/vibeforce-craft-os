'use client';

import { useState, useEffect } from 'react';
import { pb } from '@/lib/pocketbase';
import { toast } from 'sonner';
import { Loader2, Pencil } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
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

interface EditProjectDialogProps {
    project: {
        id: string;
        name: string;
        key: string;
        status: string;
        budget_hours?: number | null;
        client?: string | null;
        start_date?: string | null;
        due_date?: string | null;
    } | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onProjectUpdated: () => void;
}

export function EditProjectDialog({ project, open, onOpenChange, onProjectUpdated }: EditProjectDialogProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [clients, setClients] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        name: '',
        key: '',
        status: 'active',
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

    // Populate form when project changes
    useEffect(() => {
        if (project) {
            setFormData({
                name: project.name,
                key: project.key,
                status: project.status || 'active',
                budget_hours: project.budget_hours?.toString() || '',
                client: project.client || '',
                start_date: project.start_date ? new Date(project.start_date) : undefined,
                due_date: project.due_date ? new Date(project.due_date) : undefined,
            });
        }
    }, [project]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!project) return;

        setIsLoading(true);

        try {
            await pb.collection('projects').update(project.id, {
                name: formData.name,
                key: formData.key.toUpperCase(),
                status: formData.status,
                budget_hours: formData.budget_hours ? Number(formData.budget_hours) : null,
                client: formData.client || null,
                start_date: formData.start_date ? formData.start_date.toISOString() : null,
                due_date: formData.due_date ? formData.due_date.toISOString() : null,
            });

            toast.success('Projekt aktualisiert!');
            onOpenChange(false);
            onProjectUpdated();
        } catch (error: any) {
            console.error(error);
            toast.error('Fehler beim Aktualisieren des Projekts.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleArchive = async () => {
        if (!project) return;

        const newStatus = project.status === 'archived' ? 'active' : 'archived';
        const label = newStatus === 'archived' ? 'archiviert' : 'reaktiviert';

        setIsLoading(true);
        try {
            await pb.collection('projects').update(project.id, {
                status: newStatus,
            });

            toast.success(`Projekt ${label}!`);
            onOpenChange(false);
            onProjectUpdated();
        } catch (error) {
            console.error(error);
            toast.error(`Fehler beim ${label} des Projekts.`);
        } finally {
            setIsLoading(false);
        }
    };

    if (!project) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] bg-background border-border text-foreground">
                <DialogHeader>
                    <DialogTitle className="text-xl">Projekt bearbeiten</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Bearbeite die Projektdetails oder archiviere das Projekt.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="edit-name" className="text-foreground text-xs uppercase tracking-wider">Projektname</Label>
                        <Input
                            id="edit-name"
                            placeholder="z.B. Website Relaunch"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                            className="bg-card border-border focus-visible:ring-indigo-500"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-key" className="text-foreground text-xs uppercase tracking-wider">Projektschlüssel</Label>
                            <Input
                                id="edit-key"
                                placeholder="WEB"
                                maxLength={5}
                                value={formData.key}
                                onChange={(e) => setFormData({ ...formData, key: e.target.value.toUpperCase() })}
                                required
                                className="bg-card border-border focus-visible:ring-indigo-500 font-mono uppercase"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-budget" className="text-foreground text-xs uppercase tracking-wider">Stunden-Budget</Label>
                            <Input
                                id="edit-budget"
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
                        <Label className="text-foreground text-xs uppercase tracking-wider">Status</Label>
                        <Select value={formData.status} onValueChange={(val) => val && setFormData({ ...formData, status: val })}>
                            <SelectTrigger className="bg-card border-border">
                                <SelectValue>
                                    {(value: string) => ({ active: 'Aktiv', archived: 'Archiviert', completed: 'Abgeschlossen' } as Record<string, string>)[value] || value}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent className="bg-background border-border text-foreground">
                                <SelectItem value="active">Aktiv</SelectItem>
                                <SelectItem value="archived">Archiviert</SelectItem>
                                <SelectItem value="completed">Abgeschlossen</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="edit-client" className="text-foreground text-xs uppercase tracking-wider">Kunde (optional)</Label>
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

                    <DialogFooter className="flex-row justify-between gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleArchive}
                            disabled={isLoading}
                            className={`border-border ${project.status === 'archived' ? 'text-emerald-400 hover:text-emerald-300' : 'text-red-400 hover:text-red-300'}`}
                        >
                            {project.status === 'archived' ? 'Reaktivieren' : 'Archivieren'}
                        </Button>
                        <Button type="submit" disabled={isLoading} className="bg-white text-zinc-950 hover:bg-zinc-200 disabled:opacity-50">
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Speichern
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
