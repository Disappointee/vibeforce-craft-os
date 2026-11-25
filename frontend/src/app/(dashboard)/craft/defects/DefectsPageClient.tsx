'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Layers,
  MapPin,
  Calendar,
  Clock,
  Building2,
  HardHat,
  Search,
  Filter,
  Plus,
  Printer,
  Copy,
  Check,
  CheckCircle2,
  FileText,
  Camera,
  ShieldCheck,
  ShieldAlert,
  ArrowLeft,
  ChevronRight,
  Trash2,
  Edit3,
  X,
  ExternalLink,
  Hammer,
} from 'lucide-react';
import type { ProjectRecord, DefectPinRecord, DefectSeverity, DefectStatus } from '@/lib/pocketbase-types';
import { NewDefectDialog, CRAFT_TRADES_LIST } from '@/components/craft/NewDefectDialog';
import { PlanPinningManager } from '@/components/craft/PlanPinningManager';

interface DefectsPageClientProps {
  initialProjects: ProjectRecord[];
}

const INITIAL_SAMPLE_DEFECTS: Record<string, DefectPinRecord[]> = {
  ULB: [
    {
      id: 'def-01',
      collectionId: 'defect_pins',
      collectionName: 'defect_pins',
      project: 'ULB',
      title: 'Rissbildung GK-Wand / Deckenanschluss',
      description:
        'Deutliche Haarrissbildung entlang des gleitenden Deckenanschlusses über 3,20 m Länge. Verdacht auf fehlendes Trennband oder mangelhaften Spachtelaufbau nach DIN 18181.',
      trade: 'Trockenbau',
      location_note: 'Wohnen / Essen EG · Achse B-3',
      pin_x: 38.5,
      pin_y: 32.0,
      severity: 'major',
      status: 'notified',
      due_date: new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10),
      contractor_name: 'Trockenbau Spree GmbH',
      evidence_photo_url: '/images/defect-drywall.svg',
      evidence_sha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
      created: '2026-09-01T08:30:00Z',
      updated: '2026-09-02T10:15:00Z',
    },
    {
      id: 'def-02',
      collectionId: 'defect_pins',
      collectionName: 'defect_pins',
      project: 'ULB',
      title: 'Fehlende Brandschottung Kabeltrasse F90',
      description:
        'Durchdringung der F90-Wand durch Steigeleitung ohne baurechtlich zugelassenes Brandschottkissen / Intumeszenz-Mörtel nach DIN 4102-9. Akuter Sicherheitsmangel!',
      trade: 'Elektroinstallation',
      location_note: 'Technikzentrale / Steigeschacht · Achse D-1',
      pin_x: 74.0,
      pin_y: 68.5,
      severity: 'critical',
      status: 'in_progress',
      due_date: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
      contractor_name: 'VoltCraft Elektroanlagen KG',
      evidence_photo_url: '/images/defect-firestop.svg',
      evidence_sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      created: '2026-09-03T14:20:00Z',
      updated: '2026-09-04T09:00:00Z',
    },
    {
      id: 'def-03',
      collectionId: 'defect_pins',
      collectionName: 'defect_pins',
      project: 'ULB',
      title: 'Verbundestrich Randdämmstreifen überbrückt',
      description:
        'Schallbrücke im Türdurchgang durch überlaufenden Fließestrich an der Zarge. Gefahr von Trittschallübertragung gem. DIN 4109.',
      trade: 'Estrichleger',
      location_note: 'Flur / Diele EG · Achse C-2',
      pin_x: 48.0,
      pin_y: 54.0,
      severity: 'minor',
      status: 'resolved',
      due_date: new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10),
      contractor_name: 'Estrichbau Nord GmbH',
      resolved_at: '2026-09-06T16:00:00Z',
      created: '2026-08-28T11:00:00Z',
      updated: '2026-09-06T16:00:00Z',
    },
  ],
  'BAU-HUBER': [
    {
      id: 'def-huber-01',
      collectionId: 'defect_pins',
      collectionName: 'defect_pins',
      project: 'BAU-HUBER',
      title: 'Dampfbremsfolie an Pfette unvollständig verklebt',
      description:
        'Luftdichtheitsmangel im Kehlbalkenbereich nach DIN 4108-7. Blower-Door-Test gefährdet.',
      trade: 'Dachdecker & Spengler',
      location_note: 'Dachgeschoss Südseite · Achse 2',
      pin_x: 52.0,
      pin_y: 28.0,
      severity: 'major',
      status: 'draft',
      due_date: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
      contractor_name: 'Holzbau Huber & Partner',
      evidence_sha256: '8b7a6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b',
      created: '2026-09-10T09:15:00Z',
      updated: '2026-09-10T09:15:00Z',
    },
  ],
};

export function DefectsPageClient({ initialProjects }: DefectsPageClientProps) {
  const [projects] = useState<ProjectRecord[]>(initialProjects);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    initialProjects.length > 0 ? initialProjects[0].id : ''
  );

  const activeProject = useMemo(() => {
    return projects.find((p) => p.id === selectedProjectId) || projects[0];
  }, [projects, selectedProjectId]);

  const activeKey = activeProject?.key || 'ULB';

  // State
  const [defects, setDefects] = useState<DefectPinRecord[]>([]);
  const [activeView, setActiveView] = useState<'list' | 'plan'>('list');
  const [isNewDefectModalOpen, setIsNewDefectModalOpen] = useState(false);
  const [noticeDefect, setNoticeDefect] = useState<DefectPinRecord | null>(null);
  const [noticeCopied, setNoticeCopied] = useState(false);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterTrade, setFilterTrade] = useState<string>('all');

  // Load defects for active project
  const loadDefects = () => {
    if (typeof window === 'undefined') return;
    const storageKey = `vibe_defects_${activeKey}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setDefects(parsed);
          return;
        }
      } catch {
        // fallback
      }
    }
    // Fallback zu Samples
    const samples = INITIAL_SAMPLE_DEFECTS[activeKey] || INITIAL_SAMPLE_DEFECTS['ULB'] || [];
    setDefects(samples);
    localStorage.setItem(storageKey, JSON.stringify(samples));
  };

  useEffect(() => {
    loadDefects();
  }, [activeKey]);

  // Event listener for sync with NewDefectDialog & PlanPinningManager
  useEffect(() => {
    const handleCreated = () => {
      loadDefects();
    };
    window.addEventListener('vibe_defect_created', handleCreated);
    return () => window.removeEventListener('vibe_defect_created', handleCreated);
  }, [activeKey]);

  // Sync state changes back to storage
  const persistDefects = (updated: DefectPinRecord[]) => {
    setDefects(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`vibe_defects_${activeKey}`, JSON.stringify(updated));
    }
  };

  // KPIs
  const totalOpen = useMemo(
    () => defects.filter((d) => d.status !== 'accepted').length,
    [defects]
  );
  const criticalCount = useMemo(
    () => defects.filter((d) => d.severity === 'critical' && d.status !== 'accepted').length,
    [defects]
  );
  const notifiedCount = useMemo(
    () => defects.filter((d) => d.status === 'notified').length,
    [defects]
  );
  const overdueCount = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return defects.filter(
      (d) => d.status !== 'accepted' && d.status !== 'resolved' && d.due_date < today
    ).length;
  }, [defects]);

  // Filtered defects
  const filteredDefects = useMemo(() => {
    return defects.filter((d) => {
      if (filterSeverity !== 'all' && d.severity !== filterSeverity) return false;
      if (filterStatus !== 'all' && d.status !== filterStatus) return false;
      if (filterTrade !== 'all' && d.trade !== filterTrade) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = d.title.toLowerCase().includes(q);
        const matchDesc = d.description.toLowerCase().includes(q);
        const matchLoc = d.location_note.toLowerCase().includes(q);
        const matchTrade = d.trade.toLowerCase().includes(q);
        const matchContractor = d.contractor_name.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchLoc && !matchTrade && !matchContractor) {
          return false;
        }
      }
      return true;
    });
  }, [defects, filterSeverity, filterStatus, filterTrade, searchQuery]);

  // Update Status
  const handleUpdateStatus = (defectId: string, newStatus: DefectStatus) => {
    const updated = defects.map((d) =>
      d.id === defectId
        ? {
            ...d,
            status: newStatus,
            resolved_at: newStatus === 'resolved' ? new Date().toISOString() : d.resolved_at,
            accepted_at: newStatus === 'accepted' ? new Date().toISOString() : d.accepted_at,
            updated: new Date().toISOString(),
          }
        : d
    );
    persistDefects(updated);
  };

  // Delete defect
  const handleDeleteDefect = (id: string) => {
    if (confirm('Möchten Sie diesen Mangel wirklich unwiderruflich löschen?')) {
      const updated = defects.filter((d) => d.id !== id);
      persistDefects(updated);
    }
  };

  // Generate legal notice text for VOB/B § 13 Abs. 5
  const generateLegalNoticeText = (d: DefectPinRecord) => {
    const today = new Date().toLocaleDateString('de-DE');
    const dueDateFormatted = new Date(d.due_date).toLocaleDateString('de-DE');

    return `FORMELLE MÄNGELRÜGE GEMÄSS § 13 ABS. 5 VOB/B
MIT FRISTSETZUNG UND ANDROHUNG DER ERSATZVORNAHME

Datum: ${today}
Bauvorhaben: ${activeProject?.name} (${activeKey})
Bauteil / Ort: ${d.location_note} (Plan-Koordinate X: ${d.pin_x}%, Y: ${d.pin_y}%)
Gewerk: ${d.trade}

An:
${d.contractor_name}
(per Einschreiben mit Rückschein / vorab per E-Mail)

Sehr geehrte Damen und Herren,

bei der gutachterlichen Überprüfung der von Ihnen ausgeführten Leistungen auf der oben bezeichneten Baustelle wurden am heutigen Tage nachfolgende wesentliche Mängel festgestellt:

MANGELBESCHREIBUNG:
${d.title}
${d.description}

Schweregrad nach VOB/C: ${d.severity.toUpperCase()}
Beweissicherung: Vektor-Plan-Pin #${d.id.slice(0, 6)} mit digitalem Fotobeweis
Kryptografischer SHA-256 Fingerprint: ${d.evidence_sha256 || 'Erfasst in Vibeforce Craft OS'}

AUFFORDERUNG ZUR MÄNGELBESEITIGUNG:
Gemäß § 13 Abs. 5 Satz 1 VOB/B fordern wir Sie hiermit auf, den vorbezeichneten Mangel unverzüglich fachgerecht und dauerhaft zu beseitigen. Hierzu setzen wir Ihnen eine verbindliche Frist bis zum:

>>> ${dueDateFormatted} (Ablauf des Arbeitstages) <<<

ANDROHUNG DER ERSATZVORNAHME:
Sollte die Mängelbeseitigung bis zum Ablauf dieser Frist nicht oder nicht fachgerecht erfolgt sein, werden wir gem. § 13 Abs. 5 Satz 2 VOB/B die Mängelbeseitigung unverzüglich auf Ihre Kosten im Wege der Ersatzvornahme durch einen Drittbetrieb ausführen lassen. Die hierbei entstehenden Aufwendungen und etwaige Verzögerungsschäden werden wir gegen offene Werklohnforderungen aufrechnen bzw. gesondert einfordern.

Bitte bestätigen Sie unverzüglich den Eingang dieses Schreibens sowie den Beginn der Nachbesserungsarbeiten.

Mit freundlichen Grüßen,
Bauleitung / Handwerksmeister
${activeProject?.name}`;
  };

  const copyNoticeToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setNoticeCopied(true);
    setTimeout(() => setNoticeCopied(false), 2500);

    // Status automatisch auf 'notified' aktualisieren
    if (noticeDefect && noticeDefect.status === 'draft') {
      handleUpdateStatus(noticeDefect.id, 'notified');
      setNoticeDefect((prev) => (prev ? { ...prev, status: 'notified' } : null));
    }
  };

  const getSeverityBadge = (sev: DefectSeverity) => {
    switch (sev) {
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <ShieldAlert className="w-3.5 h-3.5" />
            Kritisch (Baustopp)
          </span>
        );
      case 'major':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-3.5 h-3.5" />
            Wesentlich (§ 12/3)
          </span>
        );
      case 'minor':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            ℹ️ Unwesentlich
          </span>
        );
    }
  };

  const getStatusBadge = (st: DefectStatus) => {
    switch (st) {
      case 'draft':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-500/15 text-gray-700 dark:text-gray-300">
            Entwurf (Intern)
          </span>
        );
      case 'notified':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-400">
            ✉️ Gerügt (§ 13/5)
          </span>
        );
      case 'in_progress':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/20 text-purple-700 dark:text-purple-300">
            🔄 In Nachbesserung
          </span>
        );
      case 'resolved':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-teal-500/20 text-teal-700 dark:text-teal-300">
            🔍 Nachgebessert
          </span>
        );
      case 'accepted':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
            ✓ Abgenommen
          </span>
        );
    }
  };

  return (
    <div className="w-full space-y-6 pb-20">
      {/* 1. TOP HEADER BAR */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl bg-card border border-border shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Link
              href="/craft"
              className="hover:text-foreground inline-flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Handwerks-Zentrale
            </Link>
            <span>/</span>
            <span className="text-foreground font-semibold">Mängelmanagement</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <AlertTriangle className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                Mängel & Baustellen-Aufgaben
                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                  VOB/B § 13
                </span>
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Beweissichere Vor-Ort-Erfassung, 2D-Bauplan-Pinning & formelle Nachunternehmer-Rügen
              </p>
            </div>
          </div>
        </div>

        {/* Baustellenauswahl & Hauptaktionen */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Baustelle Selector */}
          <div className="flex items-center gap-2 bg-muted/60 p-1.5 rounded-xl border border-border">
            <Building2 className="w-4 h-4 text-amber-500 ml-1.5 shrink-0" />
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="bg-transparent text-xs font-bold text-foreground outline-none cursor-pointer pr-2"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id} className="bg-card text-foreground">
                  {p.name} ({p.key})
                </option>
              ))}
            </select>
          </div>

          {/* View Switcher (Liste vs. Plan) */}
          <div className="inline-flex bg-muted/80 p-1 rounded-xl border border-border">
            <button
              type="button"
              onClick={() => setActiveView('list')}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeView === 'list'
                  ? 'bg-amber-500 text-black shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              📋 Mängelliste ({defects.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveView('plan')}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeView === 'plan'
                  ? 'bg-amber-500 text-black shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              🗺️ 2D-Bauplan
            </button>
          </div>

          {/* New Defect Button */}
          <button
            type="button"
            onClick={() => setIsNewDefectModalOpen(true)}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-black text-xs font-bold shadow-sm inline-flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Mangel erfassen</span>
          </button>
        </div>
      </div>

      {/* 2. KPI METRICS CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Offene Mängel */}
        <div className="p-4 rounded-2xl bg-card border border-border shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-muted-foreground font-semibold block">Offene Mängel</span>
            <span className="text-2xl font-black text-foreground mt-0.5 block">{totalOpen}</span>
          </div>
          <span className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Layers className="w-5 h-5" />
          </span>
        </div>

        {/* Kritisch / Baustopp */}
        <div className="p-4 rounded-2xl bg-card border border-border shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-rose-600 dark:text-rose-400 font-semibold block">
              🚨 Kritisch / Baustopp
            </span>
            <span className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-0.5 block">
              {criticalCount}
            </span>
          </div>
          <span className="p-2.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
            <ShieldAlert className="w-5 h-5" />
          </span>
        </div>

        {/* Formell gerügt */}
        <div className="p-4 rounded-2xl bg-card border border-border shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold block">
              ✉️ Gerügt gem. § 13
            </span>
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-0.5 block">
              {notifiedCount}
            </span>
          </div>
          <span className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <FileText className="w-5 h-5" />
          </span>
        </div>

        {/* Frist überfällig */}
        <div className="p-4 rounded-2xl bg-card border border-border shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-muted-foreground font-semibold block">
              ⏰ Frist überfällig
            </span>
            <span
              className={`text-2xl font-black mt-0.5 block ${
                overdueCount > 0 ? 'text-rose-500' : 'text-emerald-500'
              }`}
            >
              {overdueCount}
            </span>
          </div>
          <span className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
            <Clock className="w-5 h-5" />
          </span>
        </div>
      </div>

      {/* 3. VIEW: 2D-BAUPLAN ODER MÄNGELLISTE */}
      {activeView === 'plan' ? (
        <div className="space-y-4">
          <PlanPinningManager
            projectId={activeProject?.id}
            projectName={activeProject?.name}
            projectKey={activeKey}
          />
        </div>
      ) : (
        /* MÄNGELLISTE ANSICHT */
        <div className="space-y-4">
          {/* Filters & Search Toolbar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-2xl bg-card border border-border">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Mängel durchsuchen (Titel, Raum, Gewerk, Nachunternehmer)..."
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-muted/50 border border-border text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-amber-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Filter Gewerk */}
              <select
                id="filter-trade-select"
                value={filterTrade}
                onChange={(e) => setFilterTrade(e.target.value)}
                className="bg-muted/50 border border-border rounded-xl px-3 py-2 text-xs text-foreground outline-none cursor-pointer"
              >
                <option value="all">Alle Gewerke</option>
                {CRAFT_TRADES_LIST.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>

              {/* Filter Schweregrad */}
              <select
                id="filter-severity-select"
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="bg-muted/50 border border-border rounded-xl px-3 py-2 text-xs text-foreground outline-none cursor-pointer"
              >
                <option value="all">Alle Schweregrade</option>
                <option value="critical">🚨 Kritisch (Baustopp)</option>
                <option value="major">⚠️ Wesentlich (§ 12/3)</option>
                <option value="minor">ℹ️ Unwesentlich</option>
              </select>

              {/* Filter Status */}
              <select
                id="filter-status-select"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-muted/50 border border-border rounded-xl px-3 py-2 text-xs text-foreground outline-none cursor-pointer"
              >
                <option value="all">Alle Status</option>
                <option value="draft">Entwurf (Intern)</option>
                <option value="notified">Gerügt (§ 13/5)</option>
                <option value="in_progress">In Nachbesserung</option>
                <option value="resolved">Nachgebessert</option>
                <option value="accepted">✓ Abgenommen</option>
              </select>
            </div>
          </div>

          {/* Mängelliste Content Grid */}
          {filteredDefects.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-card">
              <AlertTriangle className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
              <h3 className="text-base font-bold text-foreground mb-1">
                Keine Mängel gefunden
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-4">
                {searchQuery || filterSeverity !== 'all' || filterStatus !== 'all'
                  ? 'Keine Mängel entsprechen den aktuellen Filtern.'
                  : 'Auf dieser Baustelle sind aktuell keine Mängel dokumentiert.'}
              </p>
              <button
                type="button"
                onClick={() => setIsNewDefectModalOpen(true)}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold inline-flex items-center gap-2 shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>+ Ersten Mangel erfassen</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredDefects.map((d) => {
                const today = new Date().toISOString().slice(0, 10);
                const isOverdue = d.status !== 'accepted' && d.status !== 'resolved' && d.due_date < today;

                return (
                  <div
                    key={d.id}
                    className={`p-4 rounded-2xl bg-card border transition-all hover:shadow-md ${
                      d.severity === 'critical'
                        ? 'border-rose-500/30'
                        : isOverdue
                        ? 'border-amber-500/40'
                        : 'border-border'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Left: Thumbnail & Main Info */}
                      <div className="flex items-start gap-3.5 min-w-0 flex-1">
                        {/* Fotobeweis Thumbnail */}
                        {d.evidence_photo_url ? (
                          <button
                            type="button"
                            onClick={() => setPreviewPhotoUrl(d.evidence_photo_url || null)}
                            className="relative w-16 h-16 rounded-xl overflow-hidden bg-black shrink-0 border border-border group cursor-pointer"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={d.evidence_photo_url}
                              alt={d.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            {d.evidence_sha256 && (
                              <span className="absolute bottom-0 inset-x-0 bg-black/80 text-[8px] font-mono text-emerald-400 py-0.5 text-center flex items-center justify-center gap-0.5">
                                <ShieldCheck className="w-2 h-2" /> SHA
                              </span>
                            )}
                          </button>
                        ) : (
                          <div className="w-16 h-16 rounded-xl bg-muted/60 border border-dashed border-border flex flex-col items-center justify-center text-muted-foreground shrink-0">
                            <Camera className="w-5 h-5 opacity-40" />
                            <span className="text-[9px] mt-0.5">Kein Foto</span>
                          </div>
                        )}

                        <div className="space-y-1.5 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            {getSeverityBadge(d.severity)}
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-muted text-muted-foreground">
                              {d.trade}
                            </span>
                            {getStatusBadge(d.status)}
                          </div>

                          <h3 className="text-sm font-bold text-foreground truncate">
                            {d.title}
                          </h3>

                          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                            {d.description || 'Keine nähere Beschreibung hinterlegt.'}
                          </p>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground pt-0.5">
                            <span className="flex items-center gap-1 font-medium text-foreground">
                              <MapPin className="w-3.5 h-3.5 text-amber-500" />
                              {d.location_note} (Pin: {d.pin_x}%, {d.pin_y}%)
                            </span>
                            <span className="flex items-center gap-1">
                              <HardHat className="w-3.5 h-3.5 text-teal-500" />
                              Verursacher: <strong className="text-foreground">{d.contractor_name}</strong>
                            </span>
                            {d.evidence_sha256 && (
                              <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 truncate max-w-[200px]" title={d.evidence_sha256}>
                                <ShieldCheck className="w-3 h-3" /> {d.evidence_sha256.slice(0, 12)}…
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Frist & Actions */}
                      <div className="flex flex-wrap lg:flex-col lg:items-end justify-between gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-border">
                        {/* Due Date Indicator */}
                        <div className="text-left lg:text-right">
                          <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                            Beseitigungsfrist (§ 13/5)
                          </span>
                          <div
                            className={`inline-flex items-center gap-1 text-xs font-mono font-bold mt-0.5 px-2 py-0.5 rounded-lg ${
                              isOverdue
                                ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                                : 'bg-muted text-foreground'
                            }`}
                          >
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(d.due_date).toLocaleDateString('de-DE')}</span>
                            {isOverdue && <span className="text-[10px] ml-0.5">(Überfällig!)</span>}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                          {/* Formelle Mängelrüge Button */}
                          <button
                            type="button"
                            onClick={() => setNoticeDefect(d)}
                            className="min-h-[36px] px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-[0.98] text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-xs transition-all"
                            title="Formelle Mängelrüge nach VOB/B § 13 Abs. 5 generieren"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Mängelrüge (§ 13)</span>
                          </button>

                          {/* Quick Status dropdown */}
                          <select
                            value={d.status}
                            onChange={(e) => handleUpdateStatus(d.id, e.target.value as DefectStatus)}
                            className="min-h-[36px] bg-muted/60 border border-border rounded-xl px-2.5 py-1.5 text-xs font-medium text-foreground outline-none cursor-pointer"
                          >
                            <option value="draft">Entwurf</option>
                            <option value="notified">Gerügt</option>
                            <option value="in_progress">In Arbeit</option>
                            <option value="resolved">Nachgebessert</option>
                            <option value="accepted">✓ Abgenommen</option>
                          </select>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => handleDeleteDefect(d.id)}
                            className="min-h-[36px] min-w-[36px] p-2 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-colors flex items-center justify-center"
                            title="Mangel löschen"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 4. NEW DEFECT DIALOG */}
      <NewDefectDialog
        open={isNewDefectModalOpen}
        onOpenChange={setIsNewDefectModalOpen}
        projects={projects}
        selectedProjectId={selectedProjectId}
        onDefectCreated={(newDefect) => {
          setFilterSeverity('all');
          setFilterStatus('all');
          setFilterTrade('all');
          setSearchQuery('');
          if (newDefect.project === activeKey) {
            setDefects((prev) => [newDefect, ...prev.filter((d) => d.id !== newDefect.id)]);
          } else {
            const targetProj = projects.find((p) => p.key === newDefect.project);
            if (targetProj) {
              setSelectedProjectId(targetProj.id);
            }
          }
        }}
      />

      {/* 5. FORMELLE MÄNGELRÜGE GENERATOR MODAL */}
      {noticeDefect && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setNoticeDefect(null);
          }}
        >
          <div
            className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 bg-teal-500/10 border-b border-teal-500/20">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    Formelle Mängelrüge nach VOB/B § 13 Abs. 5
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Rechtswirksame Fristsetzung mit Androhung von Ersatzvornahme
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setNoticeDefect(null)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-3">
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                <strong>Rechtlicher Hinweis nach VOB/B § 13 Abs. 5 Satz 1 & 2:</strong> Das
                Anschreiben setzt dem Nachunternehmer eine taggenaue Frist zur Beseitigung und droht
                bei fruchtlosem Ablauf explizit die Ersatzvornahme auf dessen Kosten an.
              </div>

              <div className="relative">
                <textarea
                  readOnly
                  rows={14}
                  value={generateLegalNoticeText(noticeDefect)}
                  className="w-full font-mono text-xs p-4 rounded-xl bg-muted/30 border border-border text-foreground outline-none leading-relaxed select-all"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-4 bg-muted/20 border-t border-border">
              <div className="text-[11px] text-muted-foreground">
                Status wird auf <strong className="text-amber-500">„Gerügt (§ 13)“</strong> gesetzt.
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="min-h-[40px] px-3.5 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Drucken
                </button>

                <button
                  type="button"
                  onClick={() => copyNoticeToClipboard(generateLegalNoticeText(noticeDefect))}
                  className="min-h-[40px] px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold inline-flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  {noticeCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{noticeCopied ? 'Kopiert!' : 'Mängelrüge kopieren'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. PHOTO PREVIEW MODAL */}
      {previewPhotoUrl && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setPreviewPhotoUrl(null)}
        >
          <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center">
            <button
              type="button"
              onClick={() => setPreviewPhotoUrl(null)}
              className="absolute -top-10 right-0 p-2 text-white hover:text-gray-300"
            >
              <X className="w-6 h-6" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewPhotoUrl}
              alt="Beweisfoto Vollansicht"
              className="max-h-[85vh] max-w-full rounded-xl object-contain border border-white/20 shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
