'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Plus, Building2, User, ShieldCheck, Mail, Phone, MapPin } from 'lucide-react';
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
} from '@/components/ui/select';
import { createCraftClientAction } from '@/app/actions/craft/clients';
import type { ClientRecord } from '@/lib/pocketbase-types';

interface NewCraftClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClientCreated: (client: ClientRecord) => void;
}

export function NewCraftClientDialog({
  open,
  onOpenChange,
  onClientCreated,
}: NewCraftClientDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    client_type: 'privat' as 'privat' | 'gewerblich' | 'bautraeger' | 'gu' | 'oeffentlich',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    vat_id: '',
    has_48b_certificate: false,
    notes: '',
  });

  const resetForm = () => {
    setFormData({
      name: '',
      company: '',
      client_type: 'privat',
      contact_person: '',
      email: '',
      phone: '',
      address: '',
      vat_id: '',
      has_48b_certificate: false,
      notes: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Bitte gib den Namen oder die Firma des Auftraggebers an.');
      return;
    }

    setIsLoading(true);
    try {
      const newClient = await createCraftClientAction({
        name: formData.name.trim(),
        company: formData.company.trim() || undefined,
        client_type: formData.client_type,
        contact_person: formData.contact_person.trim() || undefined,
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        address: formData.address.trim() || undefined,
        vat_id: formData.vat_id.trim() || undefined,
        has_48b_certificate: formData.has_48b_certificate,
        notes: formData.notes.trim() || undefined,
      });

      toast.success(`Auftraggeber "${newClient.name}" erfolgreich angelegt`);
      onClientCreated(newClient);
      onOpenChange(false);
      resetForm();
    } catch (err: any) {
      toast.error(err.message || 'Fehler beim Anlegen des Auftraggebers');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg border-border bg-card max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="pb-3 border-b border-border/60">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-500 uppercase tracking-wider">
              <Building2 size={14} />
              <span>Vibe Craft • Auftraggeber & Bauherren</span>
            </div>
            <DialogTitle className="text-xl font-bold text-foreground">
              Neuen Auftraggeber / Bauherr anlegen
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Erfasse Bauherren, Generalunternehmer oder Bauträger inklusive § 13b / § 48b EStG Stammdaten.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-medium text-foreground">
                  Name / Firma des Auftraggebers <span className="text-amber-500">*</span>
                </Label>
                <Input
                  placeholder="z.B. Familie Huber oder Bauunternehmung Süd GmbH"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="h-9 text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Auftraggeber-Typ</Label>
                <Select
                  value={formData.client_type}
                  onValueChange={(val: any) => setFormData({ ...formData, client_type: val })}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="privat">Privatkunde / Privat-Bauherr</SelectItem>
                    <SelectItem value="bautraeger">Bauträger / Projektentwickler</SelectItem>
                    <SelectItem value="gu">Generalunternehmer (GU)</SelectItem>
                    <SelectItem value="gewerblich">Gewerbekunde / Unternehmen</SelectItem>
                    <SelectItem value="oeffentlich">Öffentlicher Auftraggeber (VOB/A)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Ansprechpartner vor Ort</Label>
                <Input
                  placeholder="z.B. Hr. Martin Huber"
                  value={formData.contact_person}
                  onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <Mail size={12} className="text-muted-foreground" />
                  E-Mail für Rechnungsversand
                </Label>
                <Input
                  type="email"
                  placeholder="rechnung@auftraggeber.de"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <Phone size={12} className="text-muted-foreground" />
                  Telefon / Mobil
                </Label>
                <Input
                  placeholder="+49 89 12345678"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <MapPin size={12} className="text-muted-foreground" />
                Rechnungsadresse (Firmensitz / Wohnort)
              </Label>
              <Input
                placeholder="Musterstraße 12, 80331 München"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="h-9 text-xs"
              />
            </div>

            {/* Steuern & VOB / Handwerk Rechtliches */}
            <div className="p-3 rounded-xl border border-border/70 bg-accent/20 space-y-3">
              <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-amber-500" />
                <span>Steuer- & Handwerks-Stammdaten</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">USt-IdNr. (für § 13b UStG)</Label>
                  <Input
                    placeholder="DE123456789"
                    value={formData.vat_id}
                    onChange={(e) => setFormData({ ...formData, vat_id: e.target.value })}
                    className="h-8 text-xs font-mono"
                  />
                </div>

                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    id="has_48b"
                    checked={formData.has_48b_certificate}
                    onChange={(e) => setFormData({ ...formData, has_48b_certificate: e.target.checked })}
                    className="h-4 w-4 rounded border-border text-amber-500 focus:ring-amber-500"
                  />
                  <Label htmlFor="has_48b" className="text-xs cursor-pointer font-medium text-foreground">
                    § 48b EStG Freistellung (Bauabzugsteuer)
                  </Label>
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
              className="bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs"
            >
              {isLoading ? (
                <>
                  <Loader2 size={13} className="mr-1.5 animate-spin" />
                  Wird gespeichert...
                </>
              ) : (
                <>
                  <Plus size={14} className="mr-1.5" />
                  Auftraggeber speichern
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
