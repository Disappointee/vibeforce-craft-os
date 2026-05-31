'use client';

import { useState } from 'react';
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
import { DatePicker } from '@/components/ui/date-picker';
import { TimePicker } from '@/components/ui/time-picker';

export function NewClientDialog({
    open,
    onOpenChange,
    onClientCreated,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onClientCreated: () => void;
}) {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        company: '',
        email: '',
        phone: '',
        address: '',
        notes: '',
        status: 'active',
        auftragsvolumen: '',
        stundenhonorar: '',
        stundenzahl_monatlich: '',
        stundenzahl_gesamt: '',
        laufzeit_start: '',
        laufzeit_ende: '',
        abrechenbar: 'true',
        kundenstatus: 'aktiv',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            toast.error('Bitte gib einen Namen ein.');
            return;
        }

        setIsLoading(true);

        try {
            await pb.collection('clients').create({
                name: formData.name.trim(),
                company: formData.company.trim() || null,
                email: formData.email.trim() || null,
                phone: formData.phone.trim() || null,
                address: formData.address.trim() || null,
                notes: formData.notes.trim() || null,
                status: formData.status,
                auftragsvolumen: formData.auftragsvolumen ? parseFloat(formData.auftragsvolumen) : null,
                stundenhonorar: formData.stundenhonorar ? parseFloat(formData.stundenhonorar) : null,
                stundenzahl_monatlich: formData.stundenzahl_monatlich ? parseFloat(formData.stundenzahl_monatlich) : null,
                stundenzahl_gesamt: formData.stundenzahl_gesamt ? parseFloat(formData.stundenzahl_gesamt) : null,
                laufzeit_start: formData.laufzeit_start || null,
                laufzeit_ende: formData.laufzeit_ende || null,
                abrechenbar: formData.abrechenbar === 'true',
                kundenstatus: formData.kundenstatus,
            });

            toast.success('Kunde erfolgreich erstellt!');
            onOpenChange(false);
            setFormData({
                name: '',
                company: '',
                email: '',
                phone: '',
                address: '',
                notes: '',
                status: 'active',
                auftragsvolumen: '',
                stundenhonorar: '',
                stundenzahl_monatlich: '',
                stundenzahl_gesamt: '',
                laufzeit_start: '',
                laufzeit_ende: '',
                abrechenbar: 'true',
                kundenstatus: 'aktiv',
            });
            onClientCreated();
        } catch (error: any) {
            console.error(error);
            toast.error('Fehler beim Erstellen des Kunden.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] bg-background border-border text-foreground max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl">Neuen Kunden anlegen</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Erfasse die Kontaktdaten und Details eines neuen Kunden.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-foreground text-xs uppercase tracking-wider">
                            Name <span className="text-red-400">*</span>
                        </Label>
                        <Input
                            id="name"
                            placeholder="z.B. Max Mustermann"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                            className="bg-card border-border focus-visible:ring-indigo-500"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="company" className="text-foreground text-xs uppercase tracking-wider">Firma</Label>
                            <Input
                                id="company"
                                placeholder="z.B. ACME GmbH"
                                value={formData.company}
                                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                className="bg-card border-border focus-visible:ring-indigo-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="status" className="text-foreground text-xs uppercase tracking-wider">Status (alt)</Label>
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

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-foreground text-xs uppercase tracking-wider">E-Mail</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="max@example.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="bg-card border-border focus-visible:ring-indigo-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone" className="text-foreground text-xs uppercase tracking-wider">Telefon</Label>
                            <Input
                                id="phone"
                                type="tel"
                                placeholder="+49 123 456789"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="bg-card border-border focus-visible:ring-indigo-500"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="address" className="text-foreground text-xs uppercase tracking-wider">Adresse</Label>
                        <Input
                            id="address"
                            placeholder="Straße, Hausnummer, PLZ, Ort"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            className="bg-card border-border focus-visible:ring-indigo-500"
                        />
                    </div>

                    {/* Extended Fields - Financial */}
                    <div className="border-t border-border pt-4">
                        <h3 className="text-sm font-semibold text-foreground mb-4">Finanzen & Stunden</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="auftragsvolumen" className="text-foreground text-xs uppercase tracking-wider">Auftragsvolumen (€)</Label>
                                <Input
                                    id="auftragsvolumen"
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
                                <Label htmlFor="stundenhonorar" className="text-foreground text-xs uppercase tracking-wider">Stundensatz (€/h)</Label>
                                <Input
                                    id="stundenhonorar"
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
                                <Label htmlFor="stundenzahl-monatlich" className="text-foreground text-xs uppercase tracking-wider">Std./Monat</Label>
                                <Input
                                    id="stundenzahl-monatlich"
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
                                <Label htmlFor="stundenzahl-gesamt" className="text-foreground text-xs uppercase tracking-wider">Std. gesamt</Label>
                                <Input
                                    id="stundenzahl-gesamt"
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

                    {/* Extended Fields - Laufzeit */}
                    <div className="border-t border-border pt-4">
                        <h3 className="text-sm font-semibold text-foreground mb-4">Laufzeit</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="laufzeit-start" className="text-foreground text-xs uppercase tracking-wider">Startdatum</Label>
                                <div className="flex items-center gap-2">
                                    <DatePicker
                                        value={formData.laufzeit_start ? new Date(formData.laufzeit_start) : undefined}
                                        onChange={(date) => setFormData({ ...formData, laufzeit_start: date ? date.toISOString().slice(0, 16) : '' })}
                                        placeholder="tt.mm.jjjj"
                                    />
                                    <TimePicker
                                        value={formData.laufzeit_start ? formData.laufzeit_start.slice(11, 16) : '00:00'}
                                        onChange={(time) => {
                                            const date = formData.laufzeit_start ? new Date(formData.laufzeit_start) : new Date();
                                            const [h, m] = time.split(':');
                                            date.setHours(parseInt(h), parseInt(m));
                                            setFormData({ ...formData, laufzeit_start: date.toISOString().slice(0, 16) });
                                        }}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="laufzeit-ende" className="text-foreground text-xs uppercase tracking-wider">Enddatum</Label>
                                <div className="flex items-center gap-2">
                                    <DatePicker
                                        value={formData.laufzeit_ende ? new Date(formData.laufzeit_ende) : undefined}
                                        onChange={(date) => setFormData({ ...formData, laufzeit_ende: date ? date.toISOString().slice(0, 16) : '' })}
                                        placeholder="tt.mm.jjjj"
                                    />
                                    <TimePicker
                                        value={formData.laufzeit_ende ? formData.laufzeit_ende.slice(11, 16) : '00:00'}
                                        onChange={(time) => {
                                            const date = formData.laufzeit_ende ? new Date(formData.laufzeit_ende) : new Date();
                                            const [h, m] = time.split(':');
                                            date.setHours(parseInt(h), parseInt(m));
                                            setFormData({ ...formData, laufzeit_ende: date.toISOString().slice(0, 16) });
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Extended Fields - Status & Settings */}
                    <div className="border-t border-border pt-4">
                        <h3 className="text-sm font-semibold text-foreground mb-4">Status & Einstellungen</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="kundenstatus" className="text-foreground text-xs uppercase tracking-wider">Kundenstatus</Label>
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
                                <Label htmlFor="abrechenbar" className="text-foreground text-xs uppercase tracking-wider">Abrechenbar</Label>
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

                    <div className="space-y-2">
                        <Label htmlFor="notes" className="text-foreground text-xs uppercase tracking-wider">Notizen</Label>
                        <textarea
                            id="notes"
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
                            Kunde erstellen
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
