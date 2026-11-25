'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  AlertTriangle,
  Clock,
  Euro,
  Users,
  Settings2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  ArrowUpRight,
  ArrowDownRight,
  ChevronDown,
  ChevronRight,
  ShieldAlert,
  Download,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  calculateProjectCostSummary,
  DEFAULT_COST_RATES,
  DEFAULT_LABOUR_SOURCE,
  type CostRates,
  type LabourSource,
  type ProjectCostSummary,
} from '@/lib/cost-calculation';
import type { ProjectRecord, SiteReportRecord, TimeEntryRecord } from '@/lib/pocketbase-types';

const LABOUR_SOURCE_OPTIONS: Array<{ value: LabourSource; label: string; hint: string }> = [
  {
    value: 'time_entries',
    label: 'Zeiterfassung (Stempelzeiten)',
    hint: 'Nur Stempelzeiten zählen. Bautagesberichte dienen der VOB-Dokumentation.',
  },
  {
    value: 'site_reports',
    label: 'Bautagesberichte (Polier)',
    hint: 'Nur Stunden aus Bautagesberichten zählen (Betriebe ohne Monteur-Smartphones).',
  },
  {
    value: 'regie_additive',
    label: 'Stempelzeiten + Regiestunden (§ 2 Abs. 10 VOB/B)',
    hint: 'Alle Stempelzeiten plus nur explizit als Regiestunden markierte Berichtsstunden.',
  },
];

interface CostCockpitProps {
  project: ProjectRecord;
  timeEntries?: TimeEntryRecord[];
  siteReports?: SiteReportRecord[];
  invoices?: Array<{ net_total?: number; gross_total?: number }>;
  plannedBoqNetTotal?: number;
}

export function CostCockpit({
  project,
  timeEntries = [],
  siteReports = [],
  invoices = [],
  plannedBoqNetTotal,
}: CostCockpitProps) {
  const storageKey = project?.id ? `craft_labour_source_${project.id}` : null;
  const [costRates, setCostRates] = useState<CostRates>(DEFAULT_COST_RATES);
  const [labourSource, setLabourSource] = useState<LabourSource>(() => {
    if (typeof window !== 'undefined' && storageKey) {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved && LABOUR_SOURCE_OPTIONS.some((o) => o.value === saved)) {
          return saved as LabourSource;
        }
      } catch {
        // Fallback auf Default
      }
    }
    return DEFAULT_LABOUR_SOURCE;
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [activeView, setActiveView] = useState<'overview' | 'qualification' | 'time_entries'>('overview');

  // Compute Cost Summary Live
  const summary: ProjectCostSummary = useMemo(() => {
    return calculateProjectCostSummary({
      project,
      timeEntries,
      siteReports,
      invoices,
      customCostRates: costRates,
      plannedBoqNetTotal,
      labourSource,
    });
  }, [project, timeEntries, siteReports, invoices, costRates, plannedBoqNetTotal, labourSource]);

  const handleLabourSourceChange = (value: string) => {
    const option = LABOUR_SOURCE_OPTIONS.find((o) => o.value === value);
    if (option) {
      setLabourSource(option.value);
      if (typeof window !== 'undefined' && storageKey) {
        try {
          localStorage.setItem(storageKey, option.value);
        } catch {
          // localStorage nicht verfügbar
        }
      }
      toast.info(`Stunden-Quelle: ${option.label}`, {
        description: option.hint,
      });
    }
  };

  const handleRateChange = (key: keyof CostRates, valueStr: string) => {
    const val = parseFloat(valueStr.replace(',', '.'));
    setCostRates((prev) => ({
      ...prev,
      [key]: isNaN(val) || val < 0 ? 0 : val,
    }));
  };

  const handleResetRates = () => {
    setCostRates(DEFAULT_COST_RATES);
    toast.info('Standard-Verrechnungssätze wiederhergestellt');
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <Card className="border-border/60 shadow-sm bg-card/60 backdrop-blur-sm">
        <CardHeader className="pb-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl shrink-0">
                <TrendingUp size={22} />
              </div>
              <div className="space-y-0.5">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="text-xl font-bold text-foreground tracking-tight">Soll/Ist-Nachkalkulation &amp; Margen-Cockpit</span>
                  <Badge
                    variant="outline"
                    className={`text-xs font-semibold shrink-0 whitespace-nowrap px-2.5 py-0.5 ${
                      summary.profitMarginStatus === 'healthy'
                        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                        : summary.profitMarginStatus === 'warning'
                        ? 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                        : 'bg-rose-500/10 text-rose-600 border-rose-500/30'
                    }`}
                  >
                    {summary.profitMarginStatus === 'healthy'
                      ? 'Rentabel (DB II > 20%)'
                      : summary.profitMarginStatus === 'warning'
                      ? 'Mittlere Marge (5-20%)'
                      : 'Kritisch (< 5% DB II)'}
                  </Badge>
                </div>
                <CardDescription className="text-xs text-muted-foreground">
                  Baustelle: <strong className="text-foreground">{project.name}</strong> • Live-Abgleich von Monteur-Stempelungen, Regieberichten und Deckungsbeiträgen
                </CardDescription>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <span className="hidden sm:inline">Stunden-Quelle:</span>
              <select
                value={labourSource}
                onChange={(e) => handleLabourSourceChange(e.target.value)}
                className="h-8 rounded-md border border-border/60 bg-card px-2 text-xs font-medium text-foreground shadow-sm outline-none focus:ring-2 focus:ring-amber-500/40"
                title={LABOUR_SOURCE_OPTIONS.find((o) => o.value === labourSource)?.hint}
              >
                {LABOUR_SOURCE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className="gap-1.5 text-xs font-medium"
            >
              <Settings2 size={14} />
              Stundensätze {isSettingsOpen ? 'ausblenden' : 'anpassen'}
            </Button>
          </div>
        </CardHeader>

        {/* Collapsible Hourly Cost Rate Config */}
        {isSettingsOpen && (
          <CardContent className="pt-2 pb-4 border-t border-border/40 bg-muted/20">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">
                  Betriebliche Verrechnungssätze (€ / Stunde)
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetRates}
                  className="h-7 text-[11px] text-muted-foreground hover:text-foreground"
                >
                  Auf Standard zurücksetzen
                </Button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-2.5 bg-card rounded-xl border border-border/60">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground block">
                    Meister
                  </label>
                  <div className="flex items-center gap-1 mt-1">
                    <Input
                      type="text"
                      value={costRates.meister}
                      onChange={(e) => handleRateChange('meister', e.target.value)}
                      className="h-8 text-xs font-mono text-right"
                    />
                    <span className="text-xs text-muted-foreground">€/h</span>
                  </div>
                </div>

                <div className="p-2.5 bg-card rounded-xl border border-border/60">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground block">
                    Geselle
                  </label>
                  <div className="flex items-center gap-1 mt-1">
                    <Input
                      type="text"
                      value={costRates.geselle}
                      onChange={(e) => handleRateChange('geselle', e.target.value)}
                      className="h-8 text-xs font-mono text-right"
                    />
                    <span className="text-xs text-muted-foreground">€/h</span>
                  </div>
                </div>

                <div className="p-2.5 bg-card rounded-xl border border-border/60">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground block">
                    Helfer / Fachwerker
                  </label>
                  <div className="flex items-center gap-1 mt-1">
                    <Input
                      type="text"
                      value={costRates.helfer}
                      onChange={(e) => handleRateChange('helfer', e.target.value)}
                      className="h-8 text-xs font-mono text-right"
                    />
                    <span className="text-xs text-muted-foreground">€/h</span>
                  </div>
                </div>

                <div className="p-2.5 bg-card rounded-xl border border-border/60">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground block">
                    Azubi
                  </label>
                  <div className="flex items-center gap-1 mt-1">
                    <Input
                      type="text"
                      value={costRates.azubi}
                      onChange={(e) => handleRateChange('azubi', e.target.value)}
                      className="h-8 text-xs font-mono text-right"
                    />
                    <span className="text-xs text-muted-foreground">€/h</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* VOB/B § 2 Abs. 3 Warning Banner (If Overrun > 10%) */}
      {summary.isVobOverrun && (
        <div className="p-4 rounded-2xl border border-rose-500/40 bg-rose-500/10 text-foreground flex items-start gap-3.5 shadow-sm animate-in fade-in">
          <div className="p-2 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5">
            <ShieldAlert size={20} />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-rose-700 dark:text-rose-300">
                VOB/B § 2 Abs. 3 Mehrkosten-Schranke: Mengenüberschreitung von +{summary.vobOverrunPercent}%
              </span>
              <Badge variant="outline" className="text-[10px] border-rose-500/30 text-rose-600 font-mono">
                Rechtsanspruch
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Die geleisteten Stunden ({summary.istHours} h) überschreiten das vereinbarte Budget ({summary.sollHours} h) um mehr als 10%.
              Gemäß <strong>VOB/B § 2 Abs. 3 Nr. 2</strong> hat der Auftragnehmer Anspruch auf Vereinbarung eines neuen Einheitspreises bzw. einer Vergütungsanpassung für die über 10% hinausgehende Leistung.
              <strong> Empfehlung:</strong> Bauherrn umgehend förmlich in Verzug setzen und Nachtragsvereinbarung einreichen.
            </p>
          </div>
        </div>
      )}

      {/* Labour Source Data Collision Warning (Antidoppelzählung, dezent aber sichtbar) */}
      {summary.hasDataCollisionWarning && summary.collisionWarningText && (
        <div className="p-4 rounded-2xl border border-amber-500/40 bg-amber-500/10 text-foreground flex items-start gap-3.5 shadow-sm animate-in fade-in">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
            <AlertTriangle size={20} />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm text-amber-700 dark:text-amber-300">
                Stunden-Datenkollision: {summary.ignoredHoursFromOtherSource.toLocaleString('de-DE')} h nicht in der Kostenrechnung
              </span>
              <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-600 font-mono">
                Quelle: {LABOUR_SOURCE_OPTIONS.find((o) => o.value === summary.labourSourceUsed)?.label || summary.labourSourceUsed}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {summary.collisionWarningText} Die Quelle kann über das Dropdown <strong>„Stunden-Quelle"</strong> oben rechts geändert werden.
            </p>
          </div>
        </div>
      )}

      {/* 4 Main KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Deckungsbeitrag I */}
        <Card className="border-border/60 shadow-sm bg-card/40">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-semibold uppercase tracking-wider">
                Deckungsbeitrag I (Rohertrag)
              </span>
              <Badge variant="outline" className="text-[10px] font-mono text-teal-600 dark:text-teal-400 border-teal-500/30">
                {summary.deckungsbeitrag1MarginPercent}% Marge
              </Badge>
            </div>
            <div className="text-2xl font-black text-foreground">
              {summary.deckungsbeitrag1.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
            </div>
            <div className="text-[11px] text-muted-foreground space-y-0.5">
              <div className="flex justify-between">
                <span>Erlöse:</span>
                <span className="font-medium text-foreground">{summary.effectiveRevenue.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €</span>
              </div>
              <div className="flex justify-between">
                <span>Material & Fremdleistung:</span>
                <span className="font-medium text-rose-600 dark:text-rose-400">- {summary.materialAndExternalCosts.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPI 2: Deckungsbeitrag II */}
        <Card className="border-border/60 shadow-sm bg-card/40">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-semibold uppercase tracking-wider">
                Deckungsbeitrag II (Reingewinn)
              </span>
              <Badge
                variant="outline"
                className={`text-[10px] font-mono ${
                  summary.deckungsbeitrag2 >= 0
                    ? 'text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                    : 'text-rose-600 dark:text-rose-400 border-rose-500/30'
                }`}
              >
                {summary.deckungsbeitrag2MarginPercent}% Reingewinn
              </Badge>
            </div>
            <div
              className={`text-2xl font-black ${
                summary.deckungsbeitrag2 >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {summary.deckungsbeitrag2.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
            </div>
            <div className="text-[11px] text-muted-foreground space-y-0.5">
              <div className="flex justify-between">
                <span>DB I:</span>
                <span className="font-medium text-foreground">{summary.deckungsbeitrag1.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €</span>
              </div>
              <div className="flex justify-between">
                <span>Lohnkosten:</span>
                <span className="font-medium text-rose-600 dark:text-rose-400">- {summary.laborCosts.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPI 3: Stunden Soll vs. Ist */}
        <Card className="border-border/60 shadow-sm bg-card/40">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-semibold uppercase tracking-wider">
                Stunden-Burnup
              </span>
              <span className="text-[10px] font-mono font-bold text-foreground">
                {summary.hoursBurnupPercent}%
              </span>
            </div>
            <div className="text-2xl font-black text-foreground">
              {summary.istHours} <span className="text-sm font-normal text-muted-foreground">/ {summary.sollHours} h</span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-muted/60 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  summary.hoursBurnupPercent > 110
                    ? 'bg-rose-500'
                    : summary.hoursBurnupPercent > 90
                    ? 'bg-amber-500'
                    : 'bg-teal-500'
                }`}
                style={{ width: `${Math.min(100, summary.hoursBurnupPercent)}%` }}
              />
            </div>

            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>Status:</span>
              <span
                className={`font-semibold ${
                  summary.hoursDelta < 0
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {summary.hoursDelta >= 0 ? `${summary.hoursDelta} h Rest` : `+${Math.abs(summary.hoursDelta)} h Überhang`}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* KPI 4: Lohn- & Personalkosten */}
        <Card className="border-border/60 shadow-sm bg-card/40">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-semibold uppercase tracking-wider">
                Lohn- & Personalkosten
              </span>
              <span className="text-[10px] text-muted-foreground">
                {summary.istHours} Std. erfasst
              </span>
            </div>
            <div className="text-2xl font-black text-foreground">
              {summary.laborCosts.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
            </div>
            <div className="text-[11px] text-muted-foreground space-y-0.5">
              <div className="flex justify-between">
                <span>Monteur-Stempelungen:</span>
                <span className="font-medium text-foreground">{summary.monteurHours} h ({summary.monteurTimeEntriesCount} Einträge)</span>
              </div>
              <div className="flex justify-between">
                <span>Regieberichte:</span>
                <span className="font-medium text-foreground">{summary.regieHours} h ({summary.siteReportsCount} Berichte)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Detailed Breakdowns */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-border/60 pb-2">
          <Button
            variant={activeView === 'overview' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveView('overview')}
            className="text-xs h-8"
          >
            Kostenstruktur & DB-Analyse
          </Button>
          <Button
            variant={activeView === 'qualification' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveView('qualification')}
            className="text-xs h-8"
          >
            Stunden nach Qualifikation ({summary.regieHours} h)
          </Button>
          <Button
            variant={activeView === 'time_entries' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveView('time_entries')}
            className="text-xs h-8"
          >
            Monteur-Zeiterfassungen ({timeEntries.length})
          </Button>
        </div>

        {/* VIEW 1: KOSTENSTRUKTUR & DECKUNGSBEITRÄGE */}
        {activeView === 'overview' && (
          <Card className="border-border/60 shadow-none bg-card/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">Kostenstruktur-Aufschlüsselung</CardTitle>
              <CardDescription className="text-xs">
                Verhältnis von Materialeinsatz, Personalkosten und realisiertem Deckungsbeitrag II
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Stacked Percentage Bar */}
              {summary.effectiveRevenue > 0 && (
                <div className="space-y-2">
                  <div className="h-4 w-full rounded-full overflow-hidden flex bg-muted/60">
                    <div
                      className="bg-amber-500 transition-all"
                      style={{ width: `${Math.max(0, (summary.materialAndExternalCosts / summary.effectiveRevenue) * 100)}%` }}
                      title={`Material/Fremd: ${summary.materialAndExternalCosts} €`}
                    />
                    <div
                      className="bg-teal-500 transition-all"
                      style={{ width: `${Math.max(0, (summary.laborCosts / summary.effectiveRevenue) * 100)}%` }}
                      title={`Lohnkosten: ${summary.laborCosts} €`}
                    />
                    <div
                      className="bg-emerald-500 transition-all"
                      style={{ width: `${Math.max(0, (summary.deckungsbeitrag2 / summary.effectiveRevenue) * 100)}%` }}
                      title={`Reingewinn (DB II): ${summary.deckungsbeitrag2} €`}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      <span>Material & Fremdleistungen: {summary.materialAndExternalCosts.toLocaleString('de-DE')} €</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                      <span>Lohnkosten: {summary.laborCosts.toLocaleString('de-DE')} €</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span>Reingewinn (DB II): {summary.deckungsbeitrag2.toLocaleString('de-DE')} €</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Numerical Comparison Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border/40 text-muted-foreground font-semibold text-[11px]">
                      <th className="py-2 px-3">Position</th>
                      <th className="py-2 px-3 text-right">Soll (Plan)</th>
                      <th className="py-2 px-3 text-right">Ist (Aktuell)</th>
                      <th className="py-2 px-3 text-right">Abweichung</th>
                      <th className="py-2 px-3 text-right">Anteil an Erlös</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30 font-mono">
                    <tr>
                      <td className="py-2.5 px-3 font-sans font-medium text-foreground">Gesamtstunden</td>
                      <td className="py-2.5 px-3 text-right">{summary.sollHours} h</td>
                      <td className="py-2.5 px-3 text-right font-bold text-foreground">{summary.istHours} h</td>
                      <td className={`py-2.5 px-3 text-right font-semibold ${summary.hoursDelta >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {summary.hoursDelta >= 0 ? `-${summary.hoursDelta} h` : `+${Math.abs(summary.hoursDelta)} h`}
                      </td>
                      <td className="py-2.5 px-3 text-right">{summary.hoursBurnupPercent}%</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-sans font-medium text-foreground">Erlöse (Netto)</td>
                      <td className="py-2.5 px-3 text-right">{summary.sollRevenue.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €</td>
                      <td className="py-2.5 px-3 text-right font-bold text-foreground">{summary.effectiveRevenue.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €</td>
                      <td className="py-2.5 px-3 text-right text-muted-foreground">-</td>
                      <td className="py-2.5 px-3 text-right">100.0%</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-sans font-medium text-foreground">Material- & Fremdkosten</td>
                      <td className="py-2.5 px-3 text-right">{summary.materialAndExternalCosts.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €</td>
                      <td className="py-2.5 px-3 text-right font-bold text-rose-600">{summary.materialAndExternalCosts.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €</td>
                      <td className="py-2.5 px-3 text-right text-muted-foreground">-</td>
                      <td className="py-2.5 px-3 text-right">
                        {summary.effectiveRevenue > 0
                          ? `${((summary.materialAndExternalCosts / summary.effectiveRevenue) * 100).toFixed(1)}%`
                          : '0.0%'}
                      </td>
                    </tr>
                    <tr className="bg-muted/10 font-semibold">
                      <td className="py-2.5 px-3 font-sans text-teal-600 dark:text-teal-400">Deckungsbeitrag I</td>
                      <td className="py-2.5 px-3 text-right">-</td>
                      <td className="py-2.5 px-3 text-right text-teal-600 dark:text-teal-400">
                        {summary.deckungsbeitrag1.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €
                      </td>
                      <td className="py-2.5 px-3 text-right text-teal-600">-</td>
                      <td className="py-2.5 px-3 text-right text-teal-600">{summary.deckungsbeitrag1MarginPercent}%</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-sans font-medium text-foreground">Personalkosten gesamt</td>
                      <td className="py-2.5 px-3 text-right">-</td>
                      <td className="py-2.5 px-3 text-right font-bold text-rose-600">{summary.laborCosts.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €</td>
                      <td className="py-2.5 px-3 text-right text-muted-foreground">-</td>
                      <td className="py-2.5 px-3 text-right">
                        {summary.effectiveRevenue > 0
                          ? `${((summary.laborCosts / summary.effectiveRevenue) * 100).toFixed(1)}%`
                          : '0.0%'}
                      </td>
                    </tr>
                    <tr className="bg-muted/20 font-bold">
                      <td className="py-3 px-3 font-sans text-foreground">Deckungsbeitrag II (Reingewinn)</td>
                      <td className="py-3 px-3 text-right">-</td>
                      <td className={`py-3 px-3 text-right ${summary.deckungsbeitrag2 >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {summary.deckungsbeitrag2.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €
                      </td>
                      <td className="py-3 px-3 text-right">-</td>
                      <td className={`py-3 px-3 text-right ${summary.deckungsbeitrag2 >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {summary.deckungsbeitrag2MarginPercent}%
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* VIEW 2: STUNDEN NACH QUALIFIKATION */}
        {activeView === 'qualification' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {(['meister', 'geselle', 'helfer', 'azubi'] as const).map((level) => {
              const q = summary.qualificationHoursBreakdown[level];
              const labelMap: Record<string, string> = {
                meister: 'Meister',
                geselle: 'Geselle',
                helfer: 'Helfer / Fachwerker',
                azubi: 'Auszubildender',
              };

              return (
                <Card key={level} className="border-border/60 shadow-none bg-card/40">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold flex items-center justify-between">
                      <span>{labelMap[level]}</span>
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {q.rate} €/h
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="text-xl font-bold text-foreground">
                      {q.hours} <span className="text-xs font-normal text-muted-foreground">Std.</span>
                    </div>
                    <div className="text-xs font-mono font-semibold text-rose-600 dark:text-rose-400">
                      {q.cost.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} € Lohnkosten
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      Aus Bautagesberichten kumulierte Arbeitszeit für dieses Gewerk.
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* VIEW 3: MONTEUR-ZEITERFASSUNGEN */}
        {activeView === 'time_entries' && (
          <Card className="border-border/60 shadow-none bg-card/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">Gestempelte Monteur-Zeiten</CardTitle>
              <CardDescription className="text-xs">
                Einzelstempelungen über die Craft OS Monteur-Zeiterfassung (/craft/time)
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {timeEntries.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-xs">
                  Keine gestempelten Einzelzeiten für die Aufgaben dieses Projekts vorhanden.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border/40 text-muted-foreground font-medium text-[11px] bg-muted/20">
                        <th className="py-2.5 px-4">Datum</th>
                        <th className="py-2.5 px-3">Mitarbeiter</th>
                        <th className="py-2.5 px-3">Aufgabe / Beschreibung</th>
                        <th className="py-2.5 px-3 text-right">Dauer</th>
                        <th className="py-2.5 px-3 text-right">Stundensatz</th>
                        <th className="py-2.5 px-4 text-center">Abrechenbar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {timeEntries.map((entry) => {
                        const durationH =
                          entry.duration_minutes !== undefined && entry.duration_minutes !== null
                            ? (entry.duration_minutes / 60).toFixed(2)
                            : (entry.duration || 0).toFixed(2);
                        const userName =
                          (entry as any).expand?.user?.name ||
                          (entry as any).expand?.user?.first_name ||
                          'Monteur';
                        const taskTitle = (entry as any).expand?.task?.title || 'Projektarbeit';
                        const rate = (entry as any).expand?.user?.hourly_rate || costRates.defaultRate;

                        return (
                          <tr key={entry.id} className="hover:bg-muted/20">
                            <td className="py-2.5 px-4 font-mono text-muted-foreground">
                              {entry.date || entry.start_time?.slice(0, 10) || '-'}
                            </td>
                            <td className="py-2.5 px-3 font-medium text-foreground">{userName}</td>
                            <td className="py-2.5 px-3 text-muted-foreground">
                              <span className="text-foreground">{taskTitle}</span>
                              {entry.description && <span className="block text-[11px] truncate max-w-xs">{entry.description}</span>}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-semibold text-foreground">
                              {durationH} h
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-muted-foreground">
                              {rate} €/h
                            </td>
                            <td className="py-2.5 px-4 text-center">
                              <Badge
                                variant="outline"
                                className={`text-[10px] ${
                                  entry.is_billable !== false
                                    ? 'border-emerald-500/30 text-emerald-600'
                                    : 'border-muted text-muted-foreground'
                                }`}
                              >
                                {entry.is_billable !== false ? 'Ja' : 'Nein'}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
