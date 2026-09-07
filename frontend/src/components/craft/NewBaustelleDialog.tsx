'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Hammer,
  Loader2,
  Plus,
  Building2,
  MapPin,
  User,
  ShieldCheck,
  Calendar,
  Layers,
  Sparkles,
  Search,
} from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { pb } from '@/lib/pocketbase';
import { createBaustelleAction } from '@/app/actions/craft/projects';
import { NewCraftClientDialog } from './NewCraftClientDialog';
import type { ClientRecord, ProjectRecord, UserRecord } from '@/lib/pocketbase-types';

interface NewBaustelleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBaustelleCreated?: (baustelle: ProjectRecord) => void;
  defaultClient?: string;
}

const TRADES_LIST = [
  'Sanitär, Heizung & Klima (SHK)',
  'Elektrotechnik & Gebäudeautomation',
  'Trockenbau & Akustik',
  'Maler & Lackierer',
  'Fliesen-, Platten- & Mosaikleger',
  'Dachdeckerei & Spenglerei',
  'Rohbau, Maurer & Betonbauer',
  'Garten- & Landschaftsbau (GaLaBau)',
  'Schreinerei & Innenausbau',
  'Metallbau & Schlosserarbeiten',
  'Estrichleger',
  'Generalübernehmer / Allg. Bauleistung',
];

export function NewBaustelleDialog({
  open,
  onOpenChange,
  onBaustelleCreated,
  defaultClient,
}: NewBaustelleDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    key: '',
    client: defaultClient || '',
    trade: 'Sanitär, Heizung & Klima (SHK)',
    street: '',
    zip: '',
    city: '',
    site_manager: '',
    budget_hours: '',
    budget_money: '',
    vob_compliant: true,
    reverse_charge_13b: true,
    geofence_lat: undefined as number | undefined,
    geofence_lng: undefined as number | undefined,
    geofence_radius: 150,
  });

  // Auto-generate key suggestion
  useEffect(() => {
    if (open && !formData.key) {
      const year = new Date().getFullYear();
      const randomNum = Math.floor(Math.random() * 900) + 100;
      setFormData((prev) => ({
        ...prev,
        key: `BAU-${year}-${randomNum}`,
      }));
    }
  }, [open, formData.key]);

  // Load clients and users on open
  useEffect(() => {
    if (!open) return;

    const loadData = async () => {
      try {
        const [clientsRes, usersRes] = await Promise.all([
          pb.collection('clients').getList(1, 100, { sort: 'name' }),
          pb.collection('users').getList(1, 100, { sort: 'name' }),
        ]);
        setClients(clientsRes.items as unknown as ClientRecord[]);
        setUsers(usersRes.items as unknown as UserRecord[]);

        // Set default site manager to logged in user if empty
        if (!formData.site_manager && pb.authStore.record?.id) {
          setFormData((prev) => ({ ...prev, site_manager: pb.authStore.record!.id }));
        }
      } catch (err) {
        console.warn('Failed to load clients or users for NewBaustelleDialog:', err);
      }
    };
    loadData();
  }, [open, formData.site_manager]);

  // Geocoding helper to detect coordinates from address
  const handleGeocodeAddress = async () => {
    const addressStr = [formData.street, formData.zip, formData.city].filter(Boolean).join(', ');
    if (!addressStr.trim()) {
      toast.error('Bitte gib zuerst Straße und Ort ein.');
      return;
    }

    setIsGeocoding(true);
    try {
      const res = await fetch(`/api/craft/geocoding?q=${encodeURIComponent(addressStr)}`);
      if (res.ok) {
        const results = await res.json();
        if (results && results.length > 0) {
          const first = results[0];
          const lat = parseFloat(first.lat);
          const lon = parseFloat(first.lon);
          setFormData((prev) => ({
            ...prev,
            geofence_lat: lat,
            geofence_lng: lon,
          }));
          toast.success(`GPS-Standort ermittelt: ${lat.toFixed(5)}° N, ${lon.toFixed(5)}° E`);
          return;
        }
      }
      toast.info('Keine exakten Koordinaten gefunden. Du kannst die Baustelle trotzdem speichern.');
    } catch {
      toast.info('Geocoding-Dienst aktuell nicht erreichbar.');
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Bitte gib die Bezeichnung des Bauvorhabens an.');
      return;
    }
    if (!formData.key.trim()) {
      toast.error('Bitte gib ein Baustellen-Kürzel an.');
      return;
    }

    setIsLoading(true);
    try {
      const newBaustelle = await createBaustelleAction({
        name: formData.name.trim(),
        key: formData.key.trim(),
        client: formData.client || null,
        trade: formData.trade || null,
        street: formData.street.trim() || null,
        zip: formData.zip.trim() || null,
        city: formData.city.trim() || null,
        site_manager: formData.site_manager || null,
        budget_hours: formData.budget_hours ? parseFloat(formData.budget_hours) : null,
        budget_money: formData.budget_money ? parseFloat(formData.budget_money) : null,
        vob_compliant: formData.vob_compliant,
        reverse_charge_13b: formData.reverse_charge_13b,
        geofence_lat: formData.geofence_lat ?? null,
        geofence_lng: formData.geofence_lng ?? null,
        geofence_radius: formData.geofence_radius || 150,
        status: 'active',
      });

      toast.success(`Baustelle "${newBaustelle.name}" erfolgreich angelegt`);
      onBaustelleCreated?.(newBaustelle);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || 'Fehler beim Anlegen der Baustelle');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl border-border bg-card max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <DialogHeader className="pb-3 border-b border-border/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-amber-500 uppercase tracking-wider">
                  <Hammer size={14} />
                  <span>Vibe Craft • Baustellen-Akte</span>
                </div>
                <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-600 font-mono">
                  VOB/B § 4 & § 13b UStG
                </Badge>
              </div>
              <DialogTitle className="text-xl font-bold text-foreground">
                Neue Baustelle / Bauvorhaben anlegen
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Erfasse Ausführungsort, Auftraggeber/Bauherr, Gewerk und VOB-Rahmenbedingungen.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Bauvorhaben & Baustellen-Kürzel */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1.5">
                  <Label className="text-xs font-medium text-foreground">
                    Bezeichnung des Bauvorhabens <span className="text-amber-500">*</span>
                  </Label>
                  <Input
                    placeholder="z.B. Neubau EFH Familie Huber – Sanitär & Fußbodenheizung"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="h-9 text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-foreground">
                    Baustellen-ID / Kürzel <span className="text-amber-500">*</span>
                  </Label>
                  <Input
                    placeholder="BAU-2026-001"
                    value={formData.key}
                    onChange={(e) => setFormData({ ...formData, key: e.target.value.toUpperCase() })}
                    className="h-9 text-xs font-mono font-bold"
                    required
                  />
                </div>
              </div>

              {/* Auftraggeber / Bauherr & Gewerk */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                      <Building2 size={13} className="text-muted-foreground" />
                      Auftraggeber / Bauherr
                    </Label>
                    <button
                      type="button"
                      onClick={() => setIsClientModalOpen(true)}
                      className="text-[11px] text-amber-500 hover:text-amber-600 font-semibold flex items-center gap-0.5"
                    >
                      <Plus size={12} /> Neu
                    </button>
                  </div>
                  <Select
                    value={formData.client}
                    onValueChange={(val) => setFormData({ ...formData, client: val })}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Auftraggeber auswählen..." />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name} {c.company ? `(${c.company})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                    <Layers size={13} className="text-muted-foreground" />
                    Hauptgewerk
                  </Label>
                  <Select
                    value={formData.trade}
                    onValueChange={(val) => setFormData({ ...formData, trade: val })}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TRADES_LIST.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Physischer Einsatzort & Baustellenadresse */}
              <div className="p-3.5 rounded-xl border border-border/70 bg-card/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <MapPin size={14} className="text-amber-500" />
                    <span>Baustellen-Adresse (Leistungs- & Einsatzort)</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleGeocodeAddress}
                    disabled={isGeocoding}
                    className="h-7 text-[11px] text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 px-2 flex items-center gap-1"
                  >
                    {isGeocoding ? (
                      <Loader2 size={11} className="animate-spin" />
                    ) : (
                      <Search size={11} />
                    )}
                    <span>GPS-Koordinaten ermitteln</span>
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="sm:col-span-2 space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Straße und Hausnummer</Label>
                    <Input
                      placeholder="z.B. Handwerkerstraße 14"
                      value={formData.street}
                      onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">PLZ &amp; Ort</Label>
                    <div className="flex gap-1.5">
                      <Input
                        placeholder="PLZ"
                        value={formData.zip}
                        onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                        className="h-8 text-xs w-20 shrink-0"
                      />
                      <Input
                        placeholder="Ort"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="h-8 text-xs flex-1"
                      />
                    </div>
                  </div>
                </div>

                {formData.geofence_lat && formData.geofence_lng && (
                  <div className="flex items-center gap-2 text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                    <ShieldCheck size={13} />
                    <span>
                      GPS-Geofence aktiv: {formData.geofence_lat.toFixed(4)}° N, {formData.geofence_lng.toFixed(4)}° E (Radius: {formData.geofence_radius}m)
                    </span>
                  </div>
                )}
              </div>

              {/* Bauleiter, Soll-Stunden & Bausumme */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                    <User size={13} className="text-muted-foreground" />
                    Bauleiter / Meister vor Ort
                  </Label>
                  <Select
                    value={formData.site_manager}
                    onValueChange={(val) => setFormData({ ...formData, site_manager: val })}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Bauleiter wählen..." />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name || u.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-foreground">Kalkulierte Soll-Stunden</Label>
                  <Input
                    type="number"
                    step="0.5"
                    placeholder="z.B. 120"
                    value={formData.budget_hours}
                    onChange={(e) => setFormData({ ...formData, budget_hours: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-foreground">Bausumme Netto (€)</Label>
                  <Input
                    type="number"
                    step="100"
                    placeholder="z.B. 25000"
                    value={formData.budget_money}
                    onChange={(e) => setFormData({ ...formData, budget_money: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              {/* VOB & Steuern Toggles */}
              <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    id="reverse_charge_13b"
                    checked={formData.reverse_charge_13b}
                    onChange={(e) => setFormData({ ...formData, reverse_charge_13b: e.target.checked })}
                    className="h-4 w-4 rounded border-border text-amber-500 focus:ring-amber-500"
                  />
                  <div>
                    <Label htmlFor="reverse_charge_13b" className="text-xs cursor-pointer font-bold text-foreground">
                      § 13b UStG Bauleistung
                    </Label>
                    <p className="text-[10px] text-muted-foreground">
                      Steuerschuldnerschaft des Leistungsempfängers (0% USt. auf Rechnungen)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    id="vob_compliant"
                    checked={formData.vob_compliant}
                    onChange={(e) => setFormData({ ...formData, vob_compliant: e.target.checked })}
                    className="h-4 w-4 rounded border-border text-amber-500 focus:ring-amber-500"
                  />
                  <div>
                    <Label htmlFor="vob_compliant" className="text-xs cursor-pointer font-bold text-foreground">
                      Vertragsbasis VOB/B &amp; VOB/C
                    </Label>
                    <p className="text-[10px] text-muted-foreground">
                      Abrechnung nach DIN 18299 &amp; witterungsbedingte Behinderungsanzeige (§ 6)
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-3 border-t border-border/60">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
                className="text-xs"
              >
                Abbrechen
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isLoading}
                className="bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs h-9 px-4"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={14} className="mr-1.5 animate-spin" />
                    Wird angelegt...
                  </>
                ) : (
                  <>
                    <Plus size={15} className="mr-1.5" />
                    Baustelle verbindlich anlegen
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Inline Bauherr Erfassungs-Modal */}
      <NewCraftClientDialog
        open={isClientModalOpen}
        onOpenChange={setIsClientModalOpen}
        onClientCreated={(newClient) => {
          setClients((prev) => [newClient, ...prev]);
          setFormData((prev) => ({ ...prev, client: newClient.id }));
        }}
      />
    </>
  );
}
