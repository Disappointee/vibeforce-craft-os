'use client';

import React from 'react';
import {
  Building2,
  ShieldCheck,
  Landmark,
  Scale,
  Calendar,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Info,
  Phone,
  Mail,
  Globe,
  FileText
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export interface CompanySettingsData {
  company_name: string;
  company_legal_form: string;
  company_owner: string;
  company_street: string;
  company_zip: string;
  company_city: string;
  company_country: string;
  company_phone: string;
  company_emergency_phone: string;
  company_email: string;
  company_website: string;
  bank_name: string;
  bank_iban: string;
  bank_bic: string;
  creditor_id: string;
  hwk_name: string;
  hwk_number: string;
  hwk_trade: string;
  hwk_registered: boolean;
  master_qualification: string;
  tax_id: string;
  vat_id: string;
  freistellung_status: boolean;
  freistellung_aktenzeichen: string;
  freistellung_gueltig_bis: string;
  freistellung_issuer: string;
  reverse_charge_active: boolean;
  vob_din18299_active: boolean;
  vob_payment_term_days: number;
}

interface CompanySettingsTabProps {
  data: CompanySettingsData;
  onChange: (field: keyof CompanySettingsData, value: any) => void;
}

export function CompanySettingsTab({ data, onChange }: CompanySettingsTabProps) {
  // § 48b EStG Status calculation
  const getFreistellungAmpel = () => {
    if (!data.freistellung_status || !data.freistellung_gueltig_bis) {
      return {
        status: 'danger',
        label: 'Nicht hinterlegt / Unvollständig',
        sublabel: 'Achtung: Gewerbliche Bauherren müssen gesetzlich 15% Bauabzugsteuer einbehalten!',
        color: 'text-rose-400',
        bg: 'bg-rose-500/10 border-rose-500/30'
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const validUntil = new Date(data.freistellung_gueltig_bis);
    const diffDays = Math.ceil((validUntil.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        status: 'danger',
        label: `Seit ${Math.abs(diffDays)} Tagen abgelaufen!`,
        sublabel: 'Dringend Verlängerung beim Finanzamt beantragen. Rechnungen droht 15% Einbehalt.',
        color: 'text-rose-400',
        bg: 'bg-rose-500/10 border-rose-500/30'
      };
    } else if (diffDays <= 30) {
      return {
        status: 'warning',
        label: `Läuft in ${diffDays} Tagen ab (${data.freistellung_gueltig_bis})`,
        sublabel: 'Rechtzeitig Antrag auf Verlängerung nach § 48b Abs. 1 EStG beim Finanzamt stellen.',
        color: 'text-amber-400',
        bg: 'bg-amber-500/10 border-amber-500/30'
      };
    } else {
      return {
        status: 'success',
        label: `Gültig bis ${data.freistellung_gueltig_bis} (Noch ${diffDays} Tage)`,
        sublabel: '0% Bauabzugsteuer — Berechtigt zum steuerfreien Sofortabzug für Bauleistungen.',
        color: 'text-emerald-400',
        bg: 'bg-emerald-500/10 border-emerald-500/30'
      };
    }
  };

  const ampel = getFreistellungAmpel();

  return (
    <div className="space-y-6">
      {/* 1. Handwerksbetrieb & Stammdaten */}
      <Card className="border-border bg-card/40">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
                <Building2 size={18} />
              </div>
              <div>
                <CardTitle className="text-base font-bold">Handwerksbetrieb & Stammdaten</CardTitle>
                <CardDescription className="text-xs">
                  Offizieller Firmenname, Anschrift und rechtliche Vertretung für Rechnungen und Bautagesberichte
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-[11px]">
              Rechnungs-Kopf
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-1.5">
              <Label htmlFor="company_name" className="text-xs font-semibold">
                Offizieller Firmenname / Betrieb
              </Label>
              <Input
                id="company_name"
                value={data.company_name}
                onChange={(e) => onChange('company_name', e.target.value)}
                placeholder="z.B. Vey Haustechnik & Bedachungen GmbH"
                className="bg-background border-border text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="company_legal_form" className="text-xs font-semibold">
                Rechtsform
              </Label>
              <Input
                id="company_legal_form"
                value={data.company_legal_form}
                onChange={(e) => onChange('company_legal_form', e.target.value)}
                placeholder="GmbH, e.K., GbR, etc."
                className="bg-background border-border text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="company_owner" className="text-xs font-semibold">
                Inhaber / Geschäftsführer / Meister
              </Label>
              <Input
                id="company_owner"
                value={data.company_owner}
                onChange={(e) => onChange('company_owner', e.target.value)}
                placeholder="z.B. Tillmann Vey (Geschäftsführer)"
                className="bg-background border-border text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="master_qualification" className="text-xs font-semibold">
                Handwerksmeister-Qualifikation / Titel
              </Label>
              <Input
                id="master_qualification"
                value={data.master_qualification}
                onChange={(e) => onChange('master_qualification', e.target.value)}
                placeholder="z.B. Dachdeckermeister, Installateur- und Heizungsbauermeister"
                className="bg-background border-border text-sm"
              />
            </div>
          </div>

          <Separator className="bg-border/60 my-2" />

          {/* Anschrift */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="company_street" className="text-xs">Straße & Hausnummer</Label>
              <Input
                id="company_street"
                value={data.company_street}
                onChange={(e) => onChange('company_street', e.target.value)}
                placeholder="Handwerkerstraße 12"
                className="bg-background border-border text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="company_zip" className="text-xs">PLZ</Label>
              <Input
                id="company_zip"
                value={data.company_zip}
                onChange={(e) => onChange('company_zip', e.target.value)}
                placeholder="50667"
                className="bg-background border-border text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="company_city" className="text-xs">Ort</Label>
              <Input
                id="company_city"
                value={data.company_city}
                onChange={(e) => onChange('company_city', e.target.value)}
                placeholder="Köln"
                className="bg-background border-border text-xs"
              />
            </div>
          </div>

          {/* Kommunikation */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="space-y-1.5">
              <Label htmlFor="company_phone" className="text-xs flex items-center gap-1.5">
                <Phone size={12} className="text-muted-foreground" />
                Telefon (Zentrale)
              </Label>
              <Input
                id="company_phone"
                value={data.company_phone}
                onChange={(e) => onChange('company_phone', e.target.value)}
                placeholder="+49 (0) 221 123456"
                className="bg-background border-border text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="company_email" className="text-xs flex items-center gap-1.5">
                <Mail size={12} className="text-muted-foreground" />
                Betriebs- & Rechnungs-E-Mail
              </Label>
              <Input
                id="company_email"
                type="email"
                value={data.company_email}
                onChange={(e) => onChange('company_email', e.target.value)}
                placeholder="kontakt@handwerk-vey.de"
                className="bg-background border-border text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="company_website" className="text-xs flex items-center gap-1.5">
                <Globe size={12} className="text-muted-foreground" />
                Webseite (optional)
              </Label>
              <Input
                id="company_website"
                value={data.company_website}
                onChange={(e) => onChange('company_website', e.target.value)}
                placeholder="https://www.handwerk-vey.de"
                className="bg-background border-border text-xs"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Handwerkskammer (HWK) & Handwerksrolle */}
      <Card className="border-border bg-card/40">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
                <ShieldCheck size={18} />
              </div>
              <div>
                <CardTitle className="text-base font-bold">Handwerkskammer (HWK) & Handwerksrolle</CardTitle>
                <CardDescription className="text-xs">
                  Rechtliche Legitimation und Eintragungsnachweis nach Handwerksordnung (HwO)
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="hwk_registered"
                checked={data.hwk_registered}
                onCheckedChange={(checked) => onChange('hwk_registered', checked)}
                className="data-[state=checked]:bg-teal-500"
              />
              <Label htmlFor="hwk_registered" className="text-xs cursor-pointer font-medium">
                Eingetragen in Handwerksrolle
              </Label>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="hwk_name" className="text-xs font-semibold">
                Zuständige Handwerkskammer
              </Label>
              <Input
                id="hwk_name"
                value={data.hwk_name}
                onChange={(e) => onChange('hwk_name', e.target.value)}
                placeholder="z.B. Handwerkskammer zu Köln"
                className="bg-background border-border text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hwk_number" className="text-xs font-semibold">
                Betriebsnummer / Handwerksrollennummer
              </Label>
              <Input
                id="hwk_number"
                value={data.hwk_number}
                onChange={(e) => onChange('hwk_number', e.target.value)}
                placeholder="z.B. 1048291"
                className="bg-background border-border text-sm font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hwk_trade" className="text-xs font-semibold">
                Eingetragenes Hauptgewerk
              </Label>
              <Input
                id="hwk_trade"
                value={data.hwk_trade}
                onChange={(e) => onChange('hwk_trade', e.target.value)}
                placeholder="z.B. Dachdecker (Anlage A HwO)"
                className="bg-background border-border text-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Bau- & Steuer-Compliance (§ 48b / § 13b / VOB) */}
      <Card className="border-border bg-card/40">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Scale size={18} />
              </div>
              <div>
                <CardTitle className="text-base font-bold">Bau- & Steuer-Compliance (§ 48b / § 13b / VOB)</CardTitle>
                <CardDescription className="text-xs">
                  Steuernummern, Freistellungsbescheinigung (0% Bauabzugsteuer) und Reverse-Charge-Automatisierung
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[11px]">
              Liquiditäts-Schutz
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Steuernummer & USt-IdNr */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="tax_id" className="text-xs font-semibold">
                Steuernummer (Finanzamt)
              </Label>
              <Input
                id="tax_id"
                value={data.tax_id}
                onChange={(e) => onChange('tax_id', e.target.value)}
                placeholder="z.B. 214/5829/1048"
                className="bg-background border-border text-sm font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vat_id" className="text-xs font-semibold">
                Umsatzsteuer-Identifikationsnummer (USt-IdNr.)
              </Label>
              <Input
                id="vat_id"
                value={data.vat_id}
                onChange={(e) => onChange('vat_id', e.target.value)}
                placeholder="DE123456789"
                className="bg-background border-border text-sm font-mono"
              />
            </div>
          </div>

          <Separator className="bg-border/60" />

          {/* § 48b EStG Freistellungsbescheinigung Card */}
          <div className={`p-4 rounded-xl border transition-all ${ampel.bg} space-y-4`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                {ampel.status === 'success' && <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />}
                {ampel.status === 'warning' && <AlertTriangle size={18} className="text-amber-400 shrink-0" />}
                {ampel.status === 'danger' && <AlertCircle size={18} className="text-rose-400 shrink-0" />}
                <div>
                  <h4 className="text-sm font-bold text-foreground">§ 48b EStG Freistellungsbescheinigung</h4>
                  <p className={`text-xs font-medium ${ampel.color}`}>{ampel.label}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Switch
                  id="freistellung_status"
                  checked={data.freistellung_status}
                  onCheckedChange={(checked) => onChange('freistellung_status', checked)}
                  className="data-[state=checked]:bg-emerald-500"
                />
                <Label htmlFor="freistellung_status" className="text-xs cursor-pointer font-medium">
                  Bescheinigung aktiv
                </Label>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground">{ampel.sublabel}</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="space-y-1">
                <Label htmlFor="freistellung_aktenzeichen" className="text-[11px]">Aktenzeichen / Sicherheitsnummer</Label>
                <Input
                  id="freistellung_aktenzeichen"
                  value={data.freistellung_aktenzeichen}
                  onChange={(e) => onChange('freistellung_aktenzeichen', e.target.value)}
                  placeholder="z.B. FB-2025-99201"
                  className="bg-background/80 border-border text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="freistellung_gueltig_bis" className="text-[11px]">Gültig bis (Ablaufdatum)</Label>
                <Input
                  id="freistellung_gueltig_bis"
                  type="date"
                  value={data.freistellung_gueltig_bis}
                  onChange={(e) => onChange('freistellung_gueltig_bis', e.target.value)}
                  className="bg-background/80 border-border text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="freistellung_issuer" className="text-[11px]">Ausstellendes Finanzamt</Label>
                <Input
                  id="freistellung_issuer"
                  value={data.freistellung_issuer}
                  onChange={(e) => onChange('freistellung_issuer', e.target.value)}
                  placeholder="z.B. Finanzamt Köln-Altstadt"
                  className="bg-background/80 border-border text-xs"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* § 13b UStG Schalter */}
            <div className="p-4 rounded-xl bg-background/60 border border-border flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-foreground">§ 13b UStG Reverse Charge</span>
                  <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30">
                    Bauleistungen
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Automatische Netto-Abrechnung mit Übergang der Steuerschuldnerschaft bei Rechnungen an andere Bauunternehmer.
                </p>
              </div>
              <Switch
                checked={data.reverse_charge_active}
                onCheckedChange={(checked) => onChange('reverse_charge_active', checked)}
                className="data-[state=checked]:bg-primary mt-1"
              />
            </div>

            {/* VOB/B & DIN 18299 Aufmaß */}
            <div className="p-4 rounded-xl bg-background/60 border border-border flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-foreground">VOB/B & DIN 18299 Aufmaß</span>
                  <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-400 border-amber-500/30">
                    Formel-Check
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Konforme Mengenprüfung und standardmäßiges 14-Tage Zahlungsziel nach VOB/B.
                </p>
              </div>
              <Switch
                checked={data.vob_din18299_active}
                onCheckedChange={(checked) => onChange('vob_din18299_active', checked)}
                className="data-[state=checked]:bg-amber-500 mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. Bankverbindung & Rechnungsangaben */}
      <Card className="border-border bg-card/40">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Landmark size={18} />
              </div>
              <div>
                <CardTitle className="text-base font-bold">Bankverbindung & Rechnungsangaben</CardTitle>
                <CardDescription className="text-xs">
                  Bankdaten für automatische Rechnungsfußzeilen und ZUGFeRD 2.1.1 EN16931 E-Rechnungen
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/30 text-[11px]">
              ZUGFeRD BT-84
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="bank_name" className="text-xs font-semibold">Bankinstitut</Label>
              <Input
                id="bank_name"
                value={data.bank_name}
                onChange={(e) => onChange('bank_name', e.target.value)}
                placeholder="z.B. Sparkasse KölnBonn"
                className="bg-background border-border text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bank_iban" className="text-xs font-semibold">IBAN</Label>
              <Input
                id="bank_iban"
                value={data.bank_iban}
                onChange={(e) => onChange('bank_iban', e.target.value)}
                placeholder="DE89 3705 0198 0000 0123 45"
                className="bg-background border-border text-sm font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bank_bic" className="text-xs font-semibold">BIC / SWIFT</Label>
              <Input
                id="bank_bic"
                value={data.bank_bic}
                onChange={(e) => onChange('bank_bic', e.target.value)}
                placeholder="COBADE33XXX"
                className="bg-background border-border text-sm font-mono"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
