'use client';

import { useState, useEffect } from 'react';
import { pb } from '@/lib/pocketbase';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
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
import type { ClientRecord } from '@/lib/pocketbase-types';

interface EditClientDialogProps {
    client: ClientRecord | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onClientUpdated: () => void;
}

const toPbDate = (dateStr: string) => {
    if (!dateStr) return null;
    let formatted = dateStr.replace('T', ' ');
    if (formatted.length === 16) { // YYYY-MM-DD HH:MM
        formatted += ':00';
    }
    return formatted;
};

export function EditClientDialog({ client, open, onOpenChange, onClientUpdated }: EditClientDialogProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        company: '',
        email: '',
        phone: '',
        address: '',
        notes: '',
        status: 'active',
        // Extended fields
        auftragsvolumen: '',
        stundenhonorar: '',
        stundenzahl_monatlich: '',
        stundenzahl_gesamt: '',
        laufzeit_start: '',
        laufzeit_ende: '',
        abrechenbar: 'true',
        kundenstatus: 'aktiv',
    });

    useEffect(() => {
        if (client) {
            setFormData({
                name: client.name || '',
                company: client.company || '',
                email: client.email || '',
                phone: client.phone || '',
                address: client.address || '',
                notes: client.notes || '',
                status: client.status || 'active',
                auftragsvolumen: client.auftragsvolumen != null ? String(client.auftragsvolumen) : '',
                stundenhonorar: client.stundenhonorar != null ? String(client.stundenhonorar) : '',
                stundenzahl_monatlich: client.stundenzahl_monatlich != null ? String(client.stundenzahl_monatlich) : '',
                stundenzahl_gesamt: client.stundenzahl_gesamt != null ? String(client.stundenzahl_gesamt) : '',
                laufzeit_start: client.laufzeit_start ? client.laufzeit_start.replace(' ', 'T').substring(0, 16) : '',
                laufzeit_ende: client.laufzeit_ende ? client.laufzeit_ende.replace(' ', 'T').substring(0, 16) : '',
                abrechenbar: client.abrechenbar !== false ? 'true' : 'false',
                kundenstatus: client.kundenstatus || 'aktiv',
            });
        }
    }, [client]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!client) return;

        if (!formData.name.trim()) {
            toast.error('Bitte gib einen Namen ein.');
            return;
        }

        setIsLoading(true);

        try {
            const updateData: Record<string, any> = {
                name: formData.name.trim(),
                company: formData.company.trim() || null,
                email: formData.email.trim() || null,
                phone: formData.phone.trim() || null,
                address: formData.address.trim() || null,
                notes: formData.notes.trim() || "",
                status: formData.status,
                // Extended fields
                auftragsvolumen: formData.auftragsvolumen ? parseFloat(formData.auftragsvolumen) : null,
                stundenhonorar: formData.stundenhonorar ? parseFloat(formData.stundenhonorar) : null,
                stundenzahl_monatlich: formData.stundenzahl_monatlich ? parseFloat(formData.stundenzahl_monatlich) : null,
                stundenzahl_gesamt: formData.stundenzahl_gesamt ? parseFloat(formData.stundenzahl_gesamt) : null,
                laufzeit_start: toPbDate(formData.laufzeit_start),
                laufzeit_ende: toPbDate(formData.laufzeit_ende),
                abrechenbar: formData.abrechenbar === 'true',
                kundenstatus: formData.kundenstatus,
            };

            await pb.collection('clients').update(client.id, updateData);

            toast.success('Kunde aktualisiert!');
            onOpenChange(false);
            onClientUpdated();
        } catch (error: any) {
            console.error('Update failed:', error?.data || error?.message || error);
            toast.error('Fehler beim Aktualisieren des Kunden.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!client) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] bg-background border-border text-foreground max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl">Kunde bearbeiten</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Bearbeite die Details des Kunden.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                    {/* Basic Info */}
                    <div className="space-y-2">
                        <Label htmlFor="edit-name" className="text-foreground text-xs uppercase tracking-wider">
                            Name <span className="text-red-400">*</span>
                        </Label>
                        <Input
                            id="edit-name"
                            placeholder="z.B. Max Mustermann"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                            className="bg-card border-border focus-visible:ring-indigo-500"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-company" className="text-foreground text-xs uppercase tracking-wider">Firma</Label>
                            <Input
                                id="edit-company"
                                placeholder="z.B. ACME GmbH"
                                value={formData.company}
                                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                className="bg-card border-border focus-visible:ring-indigo-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-status" className="text-foreground text-xs uppercase tracking-wider">Status (alt)</Label>
                            <Select
                                value={formData.status}
                                onValueChange={(val) => val && setFormData({ ...formData, status: val })}
                            >
                                <SelectTrigger className="bg-card border-border">
                                    <SelectValue>
                                        {(value: string) => ({ active: 'Aktiv', inactive: 'Inaktiv' } as Record<string, string>)[value] || value}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent className="bg-background border-border text-foreground">
                                    <SelectItem value="active">Aktiv</SelectItem>
                                    <SelectItem value="inactive">Inaktiv</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Contact */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-email" className="text-foreground text-xs uppercase tracking-wider">E-Mail</Label>
                            <Input
                                id="edit-email"
                                type="email"
                                placeholder="max@example.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="bg-card border-border focus-visible:ring-indigo-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-phone" className="text-foreground text-xs uppercase tracking-wider">Telefon</Label>
                            <Input
                                id="edit-phone"
                                type="tel"
                                placeholder="+49 123 456789"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="bg-card border-border focus-visible:ring-indigo-500"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="edit-address" className="text-foreground text-xs uppercase tracking-wider">Adresse</Label>
                        <Input
                            id="edit-address"
                            placeholder="Straße, Hausnummer, PLZ, Ort"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            className="bg-card border-border focus-visible:ring-indigo-500"
                        />
                    </div>

                    {/* B8: Extended Fields - Financial */}
                    <div className="border-t border-border pt-4">
                        <h3 className="text-sm font-semibold text-foreground mb-4">Finanzen & Stunden</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-auftragsvolumen" className="text-foreground text-xs uppercase tracking-wider">Auftragsvolumen (€)</Label>
                                <Input
                                    id="edit-auftragsvolumen"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="z.B. 50000"
                                    value={formData.auftragsvolumen}
                                    onChange={(e) => setFormData({ ...formData, auftragsvolumen: e.target.value })}
                                    className="bg-card border-border focus-visible:ring-indigo-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-stundenhonorar" className="text-foreground text-xs uppercase tracking-wider">Stundensatz (€/h)</Label>
                                <Input
                                    id="edit-stundenhonorar"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="z.B. 150"
                                    value={formData.stundenhonorar}
                                    onChange={(e) => setFormData({ ...formData, stundenhonorar: e.target.value })}
                                    className="bg-card border-border focus-visible:ring-indigo-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-stundenzahl-monatlich" className="text-foreground text-xs uppercase tracking-wider">Std./Monat</Label>
                                <Input
                                    id="edit-stundenzahl-monatlich"
                                    type="number"
                                    min="0"
                                    step="0.5"
                                    placeholder="z.B. 80"
                                    value={formData.stundenzahl_monatlich}
                                    onChange={(e) => setFormData({ ...formData, stundenzahl_monatlich: e.target.value })}
                                    className="bg-card border-border focus-visible:ring-indigo-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-stundenzahl-gesamt" className="text-foreground text-xs uppercase tracking-wider">Std. gesamt</Label>
                                <Input
                                    id="edit-stundenzahl-gesamt"
                                    type="number"
                                    min="0"
                                    step="0.5"
                                    placeholder="z.B. 1000"
                                    value={formData.stundenzahl_gesamt}
                                    onChange={(e) => setFormData({ ...formData, stundenzahl_gesamt: e.target.value })}
                                    className="bg-card border-border focus-visible:ring-indigo-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* B8: Extended Fields - Laufzeit */}
                    <div className="border-t border-border pt-4">
                        <h3 className="text-sm font-semibold text-foreground mb-4">Laufzeit</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-laufzeit-start" className="text-foreground text-xs uppercase tracking-wider">Startdatum</Label>
                                <Input
                                    id="edit-laufzeit-start"
                                    type="datetime-local"
                                    value={formData.laufzeit_start}
                                    onChange={(e) => setFormData({ ...formData, laufzeit_start: e.target.value })}
                                    className="bg-card border-border focus-visible:ring-indigo-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-laufzeit-ende" className="text-foreground text-xs uppercase tracking-wider">Enddatum</Label>
                                <Input
                                    id="edit-laufzeit-ende"
                                    type="datetime-local"
                                    value={formData.laufzeit_ende}
                                    onChange={(e) => setFormData({ ...formData, laufzeit_ende: e.target.value })}
                                    className="bg-card border-border focus-visible:ring-indigo-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* B8: Extended Fields - Status & Settings */}
                    <div className="border-t border-border pt-4">
                        <h3 className="text-sm font-semibold text-foreground mb-4">Status & Einstellungen</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-kundenstatus" className="text-foreground text-xs uppercase tracking-wider">Kundenstatus</Label>
                                <Select
                                    value={formData.kundenstatus}
                                    onValueChange={(val) => val && setFormData({ ...formData, kundenstatus: val })}
                                >
                                    <SelectTrigger className="bg-card border-border">
                                        <SelectValue>
                                            {(value: string) => ({
                                                noch_nicht_gestartet: 'Noch nicht gestartet',
                                                aktiv: 'Aktiv',
                                                beendet: 'Beendet',
                                            } as Record<string, string>)[value] || value}
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent className="bg-background border-border text-foreground">
                                        <SelectItem value="noch_nicht_gestartet">Noch nicht gestartet</SelectItem>
                                        <SelectItem value="aktiv">Aktiv</SelectItem>
                                        <SelectItem value="beendet">Beendet</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-abrechenbar" className="text-foreground text-xs uppercase tracking-wider">Abrechenbar</Label>
                                <Select
                                    value={formData.abrechenbar}
                                    onValueChange={(val) => val && setFormData({ ...formData, abrechenbar: val })}
                                >
                                    <SelectTrigger className="bg-card border-border">
                                        <SelectValue>
                                            {(value: string) => ({ true: 'Ja', false: 'Nein' } as Record<string, string>)[value] || value}
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent className="bg-background border-border text-foreground">
                                        <SelectItem value="true">Ja</SelectItem>
                                        <SelectItem value="false">Nein</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <Label htmlFor="edit-notes" className="text-foreground text-xs uppercase tracking-wider">Notizen</Label>
                        <textarea
                            id="edit-notes"
                            placeholder="Optionale Notizen zum Kunden..."
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            rows={3}
                            className="w-full rounded-lg bg-card border border-border focus-visible:ring-indigo-500 focus-visible:ring-1 focus-visible:outline-none px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none"
                        />
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={isLoading} className="w-full bg-white text-zinc-950 hover:bg-zinc-200 disabled:opacity-50">
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Speichern
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
