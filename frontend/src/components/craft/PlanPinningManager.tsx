'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  MapPin,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  ShieldAlert,
  FileText,
  Camera,
  Calendar,
  Clock,
  User,
  Layers,
  Filter,
  Search,
  Download,
  Printer,
  Copy,
  Plus,
  Trash2,
  Edit3,
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Check,
  Building2,
  HardHat,
  ChevronRight,
  ExternalLink,
  Upload,
} from 'lucide-react';
import type { DefectPinRecord, DefectSeverity, DefectStatus } from '@/lib/pocketbase-types';

interface PlanPinningManagerProps {
  projectId?: string;
  projectName?: string;
  projectKey?: string;
  readOnly?: boolean;
}

const TRADES_LIST = [
  'Trockenbau',
  'Maler & Lackierer',
  'Estrichleger',
  'Fliesenleger',
  'Elektroinstallation',
  'Sanitär & Heizung',
  'Lüftung / Klima',
  'Dachdecker & Spengler',
  'Tischler & Fenster',
  'Rohbau & Beton',
  'Garten- & Landschaftsbau',
];

const INITIAL_SAMPLE_DEFECTS: DefectPinRecord[] = [
  {
    id: 'def-01',
    collectionId: 'defect_pins',
    collectionName: 'defect_pins',
    project: 'ULB',
    title: 'Rissbildung GK-Wand / Deckenanschluss',
    description: 'Deutliche Haarrissbildung entlang des gleitenden Deckenanschlusses über 3,20 m Länge. Verdacht auf fehlendes Trennband oder mangelhaften Spachtelaufbau nach DIN 18181.',
    trade: 'Trockenbau',
    location_note: 'Wohnen / Essen EG · Achse B-3',
    pin_x: 38.5,
    pin_y: 32.0,
    severity: 'major',
    status: 'notified',
    due_date: new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10),
    contractor_name: 'Trockenbau Spree GmbH',
    evidence_photo_url: 'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=600&q=80',
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
    description: 'Durchdringung der F90-Wand durch Steigeleitung ohne baurechtlich zugelassenes Brandschottkissen / Intumeszenz-Mörtel nach DIN 4102-9. Akuter Sicherheitsmangel!',
    trade: 'Elektroinstallation',
    location_note: 'Technikzentrale / Steigeschacht · Achse D-1',
    pin_x: 74.0,
    pin_y: 68.5,
    severity: 'critical',
    status: 'in_progress',
    due_date: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
    contractor_name: 'VoltCraft Elektroanlagen KG',
    evidence_photo_url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186156a?auto=format&fit=crop&w=600&q=80',
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
    description: 'Schallbrücke im Türdurchgang durch überlaufenden Fließestrich an der Zarge. Gefahr von Trittschallübertragung gem. DIN 4109.',
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
];

async function computeSha256(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function PlanPinningManager({
  projectId = 'proj_spree',
  projectName = 'Quartier Spreeauen · Los 3',
  projectKey = 'ULB',
  readOnly = false,
}: PlanPinningManagerProps) {
  const [defects, setDefects] = useState<DefectPinRecord[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`vibe_defects_${projectKey}`);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // fallback
        }
      }
    }
    return INITIAL_SAMPLE_DEFECTS;
  });

  const [activeView, setActiveView] = useState<'plan' | 'list'>('plan');
  const [selectedDefect, setSelectedDefect] = useState<DefectPinRecord | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreatingNewPin, setIsCreatingNewPin] = useState(false);
  const [newPinCoords, setNewPinCoords] = useState<{ x: number; y: number } | null>(null);
  const [noticeDefect, setNoticeDefect] = useState<DefectPinRecord | null>(null);
  const [noticeCopied, setNoticeCopied] = useState(false);

  // Filters
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterTrade, setFilterTrade] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Zoom & Pan for 2D Canvas
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const planContainerRef = useRef<HTMLDivElement>(null);
  const customPlanInputRef = useRef<HTMLInputElement>(null);
  const [customPlanUrl, setCustomPlanUrl] = useState<string | null>(null);

  // Sync to local storage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`vibe_defects_${projectKey}`, JSON.stringify(defects));
    }
  }, [defects, projectKey]);

  // Load from local storage when projectKey changes or when an external defect is created
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`vibe_defects_${projectKey}`);
      if (saved) {
        try {
          setDefects(JSON.parse(saved));
        } catch {}
      }
    }
    const handleSync = () => {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(`vibe_defects_${projectKey}`);
        if (saved) {
          try {
            setDefects(JSON.parse(saved));
          } catch {}
        }
      }
    };
    window.addEventListener('vibe_defect_created', handleSync);
    return () => window.removeEventListener('vibe_defect_created', handleSync);
  }, [projectKey]);

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

  // Plan click handler: Add new pin if in creation mode
  const handlePlanClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) return;
    if (!planContainerRef.current) return;

    if (isCreatingNewPin && !readOnly) {
      const rect = planContainerRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      const pctX = Math.round(((clickX / rect.width) * 100) * 10) / 10;
      const pctY = Math.round(((clickY / rect.height) * 100) * 10) / 10;

      const clampedX = Math.max(2, Math.min(98, pctX));
      const clampedY = Math.max(2, Math.min(98, pctY));

      setNewPinCoords({ x: clampedX, y: clampedY });
      setSelectedDefect(null);
      setIsEditing(true);
      setIsCreatingNewPin(false);
    }
  };

  // Zoom helpers
  const handleZoomIn = () => setZoom((z) => Math.min(2.5, Math.round((z + 0.2) * 10) / 10));
  const handleZoomOut = () => setZoom((z) => Math.max(0.6, Math.round((z - 0.2) * 10) / 10));
  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Drag pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    if (isCreatingNewPin) return; // let click register for pin
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Custom plan image upload
  const handleCustomPlanUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setCustomPlanUrl(url);
  };

  // Save / Update defect
  const handleSaveDefect = (data: Partial<DefectPinRecord>) => {
    if (selectedDefect) {
      // update
      setDefects((prev) =>
        prev.map((d) => (d.id === selectedDefect.id ? ({ ...d, ...data, updated: new Date().toISOString() } as DefectPinRecord) : d))
      );
      setSelectedDefect((prev) => (prev ? ({ ...prev, ...data } as DefectPinRecord) : null));
    } else if (newPinCoords) {
      // create new
      const newRecord: DefectPinRecord = {
        id: 'def_' + Math.random().toString(36).substring(2, 9),
        collectionId: 'defect_pins',
        collectionName: 'defect_pins',
        project: projectKey,
        title: data.title || 'Unbenannter Mangel',
        description: data.description || '',
        trade: data.trade || 'Trockenbau',
        location_note: data.location_note || 'EG · Bereich unbekannt',
        pin_x: newPinCoords.x,
        pin_y: newPinCoords.y,
        severity: (data.severity as DefectSeverity) || 'major',
        status: (data.status as DefectStatus) || 'draft',
        due_date: data.due_date || new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
        contractor_name: data.contractor_name || 'Nachunternehmer N.N.',
        evidence_photo_url: data.evidence_photo_url,
        evidence_sha256: data.evidence_sha256,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
      };
      setDefects((prev) => [newRecord, ...prev]);
      setSelectedDefect(newRecord);
      setNewPinCoords(null);
    }
    setIsEditing(false);
  };

  const handleDeleteDefect = (id: string) => {
    if (confirm('Möchten Sie diesen Mangel wirklich aus dem Bauplan entfernen?')) {
      setDefects((prev) => prev.filter((d) => d.id !== id));
      setSelectedDefect(null);
      setIsEditing(false);
    }
  };

  // Generate legal notice text for VOB/B § 13 Abs. 5
  const generateLegalNoticeText = (d: DefectPinRecord) => {
    const today = new Date().toLocaleDateString('de-DE');
    const dueDateFormatted = new Date(d.due_date).toLocaleDateString('de-DE');

    return `FORMELLE MÄNGELRÜGE GEMÄSS § 13 ABS. 5 VOB/B
MIT FRISTSETZUNG UND ANDROHUNG DER ERSATZVORNAHME

Datum: ${today}
Bauvorhaben: ${projectName} (${projectKey})
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
Kryptografischer SHA-256 Fingerprint: ${d.evidence_sha256 || 'Erfasst in Vibeforce Flow OS'}

AUFFORDERUNG ZUR MÄNGELBESEITIGUNG:
Gemäß § 13 Abs. 5 Satz 1 VOB/B fordern wir Sie hiermit auf, den vorbezeichneten Mangel unverzüglich fachgerecht und dauerhaft zu beseitigen. Hierzu setzen wir Ihnen eine verbindliche Frist bis zum:

>>> ${dueDateFormatted} (Ablauf des Arbeitstages) <<<

ANDROHUNG DER ERSATZVORNAHME:
Sollte die Mängelbeseitigung bis zum Ablauf dieser Frist nicht oder nicht fachgerecht erfolgt sein, werden wir gem. § 13 Abs. 5 Satz 2 VOB/B die Mängelbeseitigung unverzüglich auf Ihre Kosten im Wege der Ersatzvornahme durch einen Drittbetrieb ausführen lassen. Die hierbei entstehenden Aufwendungen und etwaige Verzögerungsschäden werden wir gegen offene Werklohnforderungen aufrechnen bzw. gesondert einfordern.

Bitte bestätigen Sie unverzüglich den Eingang dieses Schreibens sowie den Beginn der Nachbesserungsarbeiten.

Mit freundlichen Grüßen,
Bauleitung / Generalunternehmer`;
  };

  const copyNoticeToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setNoticeCopied(true);
    setTimeout(() => setNoticeCopied(false), 2500);

    // Update status to 'notified' if it was draft
    if (noticeDefect && noticeDefect.status === 'draft') {
      setDefects((prev) =>
        prev.map((d) => (d.id === noticeDefect.id ? { ...d, status: 'notified', updated: new Date().toISOString() } : d))
      );
      setNoticeDefect((prev) => (prev ? { ...prev, status: 'notified' } : null));
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* 1. TOP MASTER BAR & METRICS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-[#121824] border border-gray-200 dark:border-white/10 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Layers className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                2D-Plan-Pinning & VOB/B § 13 Mängelmanagement
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                  DIN 18299 / § 13 Abs. 5
                </span>
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {projectName} ({projectKey}) · Grundriss-Viewer mit punktgenauen Stecknadeln & formellen Mängelrügen
              </p>
            </div>
          </div>
        </div>

        {/* View Switcher & Action Buttons */}
        <div className="flex items-center gap-2">
          <div className="inline-flex bg-gray-100 dark:bg-white/10 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveView('plan')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeView === 'plan'
                  ? 'bg-white dark:bg-amber-500 text-gray-900 dark:text-black shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
              }`}
            >
              🗺️ Plan-Ansicht
            </button>
            <button
              type="button"
              onClick={() => setActiveView('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeView === 'list'
                  ? 'bg-white dark:bg-amber-500 text-gray-900 dark:text-black shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
              }`}
            >
              📋 Mängelliste ({defects.length})
            </button>
          </div>

          {!readOnly && (
            <button
              type="button"
              onClick={() => {
                setIsCreatingNewPin(true);
                setActiveView('plan');
              }}
              className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-all shadow-xs ${
                isCreatingNewPin
                  ? 'bg-rose-600 text-white ring-4 ring-rose-500/20 animate-pulse'
                  : 'bg-amber-500 hover:bg-amber-600 text-black active:scale-[0.98]'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>{isCreatingNewPin ? 'Klick auf Plan zum Platzieren...' : 'Pin setzen'}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. KPI STATUS TILES */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-white dark:bg-[#121824] border border-gray-200 dark:border-white/10">
          <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 block mb-1">
            Offene Mängel
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold font-mono text-gray-900 dark:text-white">
              {totalOpen}
            </span>
            <span className="text-xs text-gray-400">/ {defects.length} gesamt</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-[#121824] border border-rose-500/20 bg-rose-500/[0.02]">
          <span className="text-[11px] font-medium text-rose-600 dark:text-rose-400 flex items-center gap-1 mb-1">
            <ShieldAlert className="w-3.5 h-3.5" />
            Sicherheitsrelevant
          </span>
          <span className="text-xl sm:text-2xl font-bold font-mono text-rose-600 dark:text-rose-400">
            {criticalCount}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-[#121824] border border-amber-500/20 bg-amber-500/[0.02]">
          <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1 mb-1">
            <FileText className="w-3.5 h-3.5" />
            Formell gerügt (§ 13)
          </span>
          <span className="text-xl sm:text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
            {notifiedCount}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-[#121824] border border-gray-200 dark:border-white/10">
          <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1 mb-1">
            <Clock className="w-3.5 h-3.5 text-rose-500" />
            Frist überschritten
          </span>
          <span className={`text-xl sm:text-2xl font-bold font-mono ${overdueCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600'}`}>
            {overdueCount}
          </span>
        </div>
      </div>

      {/* 3. FILTER BAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-gray-50/75 dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 text-xs">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative flex-1 min-w-[140px] max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Suchen nach Mangel, Gewerk, Ort..."
              className="w-full bg-white dark:bg-[#121824] border border-gray-200 dark:border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="bg-white dark:bg-[#121824] border border-gray-200 dark:border-white/10 rounded-lg px-2.5 py-1.5 text-xs outline-none"
          >
            <option value="all">Alle Schweregrade</option>
            <option value="critical">🚨 Kritisch (Baustopp)</option>
            <option value="major">⚠️ Wesentlich (§ 12/3)</option>
            <option value="minor">ℹ️ Unwesentlich</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-white dark:bg-[#121824] border border-gray-200 dark:border-white/10 rounded-lg px-2.5 py-1.5 text-xs outline-none"
          >
            <option value="all">Alle Status</option>
            <option value="draft">Erfasst (Entwurf)</option>
            <option value="notified">Formell gerügt (§ 13)</option>
            <option value="in_progress">In Nachbesserung</option>
            <option value="resolved">Nachgebessert</option>
            <option value="accepted">Abgenommen & Zu</option>
          </select>

          <select
            value={filterTrade}
            onChange={(e) => setFilterTrade(e.target.value)}
            className="bg-white dark:bg-[#121824] border border-gray-200 dark:border-white/10 rounded-lg px-2.5 py-1.5 text-xs outline-none"
          >
            <option value="all">Alle Gewerke</option>
            {TRADES_LIST.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* Plan Upload Helper */}
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={customPlanInputRef}
            onChange={handleCustomPlanUpload}
            accept="image/*,.svg,.pdf"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => customPlanInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#121824] hover:bg-gray-50 text-gray-700 dark:text-gray-300 transition-colors"
            title="Eigenen Grundrissplan hochladen"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Plan tauschen</span>
          </button>
        </div>
      </div>

      {/* 4. MAIN VIEW: PLAN VIEW OR LIST VIEW */}
      {activeView === 'plan' ? (
        <div className="relative w-full rounded-2xl border border-gray-200 dark:border-white/10 bg-[#090d16] overflow-hidden shadow-inner flex flex-col">
          {/* Plan Toolbar Overlay */}
          <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 bg-black/70 backdrop-blur-md p-1.5 rounded-xl border border-white/15 text-white">
            <button
              type="button"
              onClick={handleZoomIn}
              className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
              title="Vergrößern"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
              title="Verkleinern"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
              title="Ansicht zurücksetzen"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-mono px-2 text-gray-300">
              {Math.round(zoom * 100)}%
            </span>
          </div>

          {/* Creation Mode Indicator */}
          {isCreatingNewPin && (
            <div className="absolute top-3 right-3 z-20 bg-rose-600/90 backdrop-blur-md text-white px-3.5 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-2 animate-bounce">
              <MapPin className="w-4 h-4" />
              <span>Klicken Sie an die gewünschte Stelle im Grundriss</span>
            </div>
          )}

          {/* Pan & Zoom Canvas Container */}
          <div
            className="w-full h-[520px] sm:h-[620px] overflow-hidden flex items-center justify-center select-none cursor-grab active:cursor-grabbing relative"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            <div
              ref={planContainerRef}
              onClick={handlePlanClick}
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: 'center center',
                transition: isDragging ? 'none' : 'transform 120ms ease-out',
              }}
              className={`relative w-[850px] h-[580px] bg-[#111827] border-2 border-dashed border-gray-700 rounded-xl shadow-2xl flex-shrink-0 ${
                isCreatingNewPin ? 'cursor-crosshair' : ''
              }`}
            >
              {/* If custom plan uploaded, display it, otherwise display high-precision SVG blueprint */}
              {customPlanUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={customPlanUrl}
                  alt="Bauplan Grundriss"
                  className="w-full h-full object-contain pointer-events-none"
                />
              ) : (
                <svg
                  className="w-full h-full pointer-events-none opacity-90"
                  viewBox="0 0 850 580"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Blueprint Grid Lines */}
                  <defs>
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />

                  {/* Exterior Walls */}
                  <rect x="40" y="40" width="770" height="500" fill="none" stroke="#475569" strokeWidth="8" />

                  {/* Interior Walls */}
                  {/* Horizontal dividers */}
                  <line x1="40" y1="260" x2="520" y2="260" stroke="#334155" strokeWidth="5" />
                  <line x1="520" y1="360" x2="810" y2="360" stroke="#334155" strokeWidth="5" />
                  <line x1="40" y1="420" x2="380" y2="420" stroke="#334155" strokeWidth="5" />

                  {/* Vertical dividers */}
                  <line x1="380" y1="260" x2="380" y2="540" stroke="#334155" strokeWidth="5" />
                  <line x1="520" y1="40" x2="520" y2="540" stroke="#334155" strokeWidth="6" />
                  <line x1="680" y1="40" x2="680" y2="360" stroke="#334155" strokeWidth="4" />

                  {/* Axis Grid Markers */}
                  <g fill="#64748B" fontSize="11" fontFamily="JetBrains Mono, monospace" fontWeight="600">
                    <text x="50" y="25">ACHSE A</text>
                    <text x="360" y="25">ACHSE B</text>
                    <text x="510" y="25">ACHSE C</text>
                    <text x="670" y="25">ACHSE D</text>
                    <text x="15" y="150">1</text>
                    <text x="15" y="340">2</text>
                    <text x="15" y="480">3</text>
                  </g>

                  {/* Room Labels */}
                  <g fill="#94A3B8" fontSize="12" fontFamily="Inter, sans-serif" fontWeight="600">
                    <text x="180" y="140">Wohnen / Essen</text>
                    <text x="180" y="160" fontSize="10" fill="#64748B">38.4 m² · FBH</text>

                    <text x="580" y="140">Schlafen 01</text>
                    <text x="580" y="160" fontSize="10" fill="#64748B">18.2 m² · Parkett</text>

                    <text x="730" y="140">Bad / WC</text>
                    <text x="730" y="160" fontSize="10" fill="#64748B">9.5 m²</text>

                    <text x="160" y="340">Küche</text>
                    <text x="160" y="360" fontSize="10" fill="#64748B">14.1 m² · Fliesen</text>

                    <text x="430" y="390">Flur / Diele</text>
                    <text x="430" y="410" fontSize="10" fill="#64748B">16.8 m²</text>

                    <text x="160" y="480">Büro / Gast</text>
                    <text x="160" y="500" fontSize="10" fill="#64748B">12.0 m²</text>

                    <text x="620" y="460">Technikzentrale</text>
                    <text x="620" y="480" fontSize="10" fill="#64748B">F90 Steigeschacht</text>
                  </g>

                  {/* Doors Arc representation */}
                  <path d="M 520 200 A 40 40 0 0 1 480 240" fill="none" stroke="#2563EB" strokeWidth="1.5" strokeDasharray="3 3" />
                  <path d="M 380 300 A 40 40 0 0 1 340 340" fill="none" stroke="#2563EB" strokeWidth="1.5" strokeDasharray="3 3" />
                  <path d="M 680 200 A 40 40 0 0 1 640 240" fill="none" stroke="#2563EB" strokeWidth="1.5" strokeDasharray="3 3" />
                </svg>
              )}

              {/* RENDER PINS ON TOP OF THE PLAN */}
              {filteredDefects.map((d, index) => {
                const isSelected = selectedDefect?.id === d.id;
                const isCritical = d.severity === 'critical';
                const isMajor = d.severity === 'major';
                const isResolved = d.status === 'resolved' || d.status === 'accepted';

                let pinBg = 'bg-blue-600 border-blue-400';
                if (isCritical) pinBg = 'bg-rose-600 border-rose-400';
                else if (isMajor) pinBg = 'bg-amber-500 border-amber-300';
                else if (isResolved) pinBg = 'bg-emerald-600 border-emerald-400';

                return (
                  <div
                    key={d.id}
                    style={{
                      left: `${d.pin_x}%`,
                      top: `${d.pin_y}%`,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDefect(d);
                    }}
                    className={`absolute -translate-x-1/2 -translate-y-full cursor-pointer group z-10 transition-transform ${
                      isSelected ? 'scale-125 z-30' : 'hover:scale-115'
                    }`}
                  >
                    {/* Pin Head */}
                    <div className="relative flex flex-col items-center">
                      <div
                        className={`w-7 h-7 rounded-full border-2 ${pinBg} text-white flex items-center justify-center font-mono font-bold text-xs shadow-lg transition-all`}
                      >
                        {index + 1}
                      </div>
                      {/* Pin needle */}
                      <div className={`w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[7px] ${
                        isCritical ? 'border-t-rose-600' : isMajor ? 'border-t-amber-500' : isResolved ? 'border-t-emerald-600' : 'border-t-blue-600'
                      }`} />

                      {/* Critical Pulse */}
                      {isCritical && d.status !== 'accepted' && (
                        <span className="absolute -inset-1 rounded-full bg-rose-500/40 animate-ping pointer-events-none" />
                      )}
                    </div>

                    {/* Hover Tooltip */}
                    <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2.5 rounded-xl bg-gray-950 text-white text-xs shadow-2xl border border-white/20 pointer-events-none z-40">
                      <div className="font-bold truncate">{d.title}</div>
                      <div className="text-[11px] text-gray-400 mt-0.5">{d.trade} · {d.location_note}</div>
                      <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-white/10 text-[10px]">
                        <span className={`font-semibold ${isCritical ? 'text-rose-400' : isMajor ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {d.severity.toUpperCase()}
                        </span>
                        <span className="font-mono text-gray-400">Frist: {d.due_date}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* LIST VIEW */
        <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#121824] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/75 dark:bg-white/[0.02] border-b border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-3 w-12">#</th>
                  <th className="py-3 px-3 min-w-[200px]">Mangel / Bezeichnung</th>
                  <th className="py-3 px-3 min-w-[140px]">Gewerk & Nachunternehmer</th>
                  <th className="py-3 px-3 min-w-[130px]">Ort / Achse</th>
                  <th className="py-3 px-3 w-28">Schweregrad</th>
                  <th className="py-3 px-3 w-28">Status</th>
                  <th className="py-3 px-3 w-24">Frist</th>
                  <th className="py-3 px-3 w-28 text-right">Aktionen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-gray-900 dark:text-gray-200">
                {filteredDefects.map((d, idx) => (
                  <tr
                    key={d.id}
                    onClick={() => setSelectedDefect(d)}
                    className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-3 font-mono font-bold text-gray-500">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-gray-900 dark:text-white">{d.title}</div>
                      <div className="text-[11px] text-gray-500 truncate max-w-sm">{d.description}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-gray-800 dark:text-gray-200">{d.trade}</div>
                      <div className="text-[11px] text-gray-400">{d.contractor_name}</div>
                    </td>
                    <td className="py-3 px-3 font-medium text-gray-600 dark:text-gray-300">
                      {d.location_note}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          d.severity === 'critical'
                            ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                            : d.severity === 'major'
                            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                            : 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                        }`}
                      >
                        {d.severity === 'critical' ? '🚨 Kritisch' : d.severity === 'major' ? '⚠️ Wesentlich' : 'ℹ️ Unwesentlich'}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                          d.status === 'accepted'
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                            : d.status === 'notified'
                            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                            : d.status === 'in_progress'
                            ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                            : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300'
                        }`}
                      >
                        {d.status === 'accepted'
                          ? '✓ Abgenommen'
                          : d.status === 'notified'
                          ? 'Gerügt (§ 13)'
                          : d.status === 'in_progress'
                          ? 'In Nachbesserung'
                          : d.status === 'resolved'
                          ? 'Behoben'
                          : 'Erfasst'}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono font-medium text-xs">
                      {d.due_date}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setNoticeDefect(d);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-teal-600/10 hover:bg-teal-600 text-teal-700 hover:text-white text-[11px] font-semibold transition-colors"
                      >
                        Mängelrüge
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. DEFECT DETAIL / EDIT MODAL */}
      {(selectedDefect || isEditing) && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedDefect(null);
              setIsEditing(false);
              setNewPinCoords(null);
            }
          }}
        >
          <div
            className="w-full max-w-2xl bg-white dark:bg-[#121824] border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 bg-gray-50/80 dark:bg-white/[0.03] border-b border-gray-200 dark:border-white/10">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <MapPin className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    {isEditing
                      ? selectedDefect
                        ? 'Mangel bearbeiten'
                        : 'Neuen Mangel erfassen'
                      : selectedDefect?.title}
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    VOB/B § 13 Mängelansprüche vor/nach Abnahme
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!isEditing && selectedDefect && !readOnly && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="p-2 rounded-xl text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                    title="Bearbeiten"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDefect(null);
                    setIsEditing(false);
                    setNewPinCoords(null);
                  }}
                  className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {isEditing ? (
                /* EDIT / CREATE FORM */
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const formData = new FormData(form);
                    handleSaveDefect({
                      title: formData.get('title') as string,
                      description: formData.get('description') as string,
                      trade: formData.get('trade') as string,
                      location_note: formData.get('location_note') as string,
                      contractor_name: formData.get('contractor_name') as string,
                      severity: formData.get('severity') as DefectSeverity,
                      status: formData.get('status') as DefectStatus,
                      due_date: formData.get('due_date') as string,
                    });
                  }}
                  className="space-y-3.5"
                >
                  <div>
                    <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Bezeichnung des Mangels *
                    </label>
                    <input
                      name="title"
                      required
                      defaultValue={selectedDefect?.title || ''}
                      placeholder="z.B. Rissbildung an GK-Fuge Achse C-2"
                      className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Gewerk *
                      </label>
                      <select
                        name="trade"
                        defaultValue={selectedDefect?.trade || 'Trockenbau'}
                        className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-amber-500"
                      >
                        {TRADES_LIST.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Nachunternehmer / Verursacher
                      </label>
                      <input
                        name="contractor_name"
                        defaultValue={selectedDefect?.contractor_name || ''}
                        placeholder="z.B. Trockenbau Spree GmbH"
                        className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Ort / Achse / Raum
                      </label>
                      <input
                        name="location_note"
                        defaultValue={selectedDefect?.location_note || ''}
                        placeholder="z.B. Wohnen EG · Achse B-3"
                        className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Schweregrad nach VOB
                      </label>
                      <select
                        name="severity"
                        defaultValue={selectedDefect?.severity || 'major'}
                        className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-amber-500"
                      >
                        <option value="critical">🚨 Kritisch (Baustopp-Gefahr)</option>
                        <option value="major">⚠️ Wesentlich (§ 12 Abs. 3)</option>
                        <option value="minor">ℹ️ Unwesentlich / Optisch</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Beseitigungsfrist (VOB/B § 13/5)
                      </label>
                      <input
                        type="date"
                        name="due_date"
                        required
                        defaultValue={
                          selectedDefect?.due_date ||
                          new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10)
                        }
                        className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Status-Workflow
                    </label>
                    <select
                      name="status"
                      defaultValue={selectedDefect?.status || 'draft'}
                      className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-amber-500"
                    >
                      <option value="draft">Erfasst (Interner Entwurf)</option>
                      <option value="notified">Formell gerügt (§ 13 Abs. 5)</option>
                      <option value="in_progress">In Nachbesserung durch NU</option>
                      <option value="resolved">Nachgebessert (Prüfbereit)</option>
                      <option value="accepted">✓ Abgenommen & Erledigt</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Detaillierte Mängelbeschreibung & Ursache
                    </label>
                    <textarea
                      name="description"
                      rows={3}
                      defaultValue={selectedDefect?.description || ''}
                      placeholder="Exakte Beschreibung des Mangels, DIN-Normen, Abweichung von Leistungsbeschreibung..."
                      className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl p-3 text-xs outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200 dark:border-white/10">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 font-semibold"
                    >
                      Abbrechen
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-bold shadow-sm"
                    >
                      {selectedDefect ? 'Änderungen speichern' : 'Mangel anlegen'}
                    </button>
                  </div>
                </form>
              ) : selectedDefect ? (
                /* VIEW DETAILS */
                <div className="space-y-4">
                  {/* Status Banner */}
                  <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          selectedDefect.severity === 'critical'
                            ? 'bg-rose-500/20 text-rose-500'
                            : selectedDefect.severity === 'major'
                            ? 'bg-amber-500/20 text-amber-500'
                            : 'bg-blue-500/20 text-blue-500'
                        }`}
                      >
                        {selectedDefect.severity === 'critical'
                          ? '🚨 Sicherheitsmangel / Baustopp'
                          : selectedDefect.severity === 'major'
                          ? '⚠️ Wesentlicher Mangel (§ 12/3)'
                          : 'ℹ️ Unwesentlicher Mangel'}
                      </span>
                      <span className="font-semibold text-gray-700 dark:text-gray-300">
                        {selectedDefect.trade}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 font-mono">Frist:</span>
                      <span className="font-mono font-bold text-gray-900 dark:text-white">
                        {selectedDefect.due_date}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white mb-1">
                      Mängelbeschreibung
                    </h4>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed bg-gray-50/50 dark:bg-black/20 p-3 rounded-xl border border-gray-200 dark:border-white/5">
                      {selectedDefect.description || 'Keine Beschreibung vorhanden.'}
                    </p>
                  </div>

                  {/* Metadata Grid */}
                  <div className="grid grid-cols-2 gap-3 text-gray-600 dark:text-gray-400">
                    <div className="p-2.5 rounded-xl border border-gray-100 dark:border-white/5 bg-gray-50/30 dark:bg-white/[0.01]">
                      <span className="text-[10px] uppercase text-gray-400 block">Ort / Achse:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{selectedDefect.location_note}</span>
                    </div>
                    <div className="p-2.5 rounded-xl border border-gray-100 dark:border-white/5 bg-gray-50/30 dark:bg-white/[0.01]">
                      <span className="text-[10px] uppercase text-gray-400 block">Nachunternehmer:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{selectedDefect.contractor_name}</span>
                    </div>
                  </div>

                  {/* Fotobeweis */}
                  {selectedDefect.evidence_photo_url && (
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-1.5">
                        <Camera className="w-4 h-4 text-teal-500" />
                        Beweisfoto (GoBD SHA-256 verifiziert)
                      </h4>
                      <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 max-h-56 bg-black flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={selectedDefect.evidence_photo_url}
                          alt="Beweisfoto"
                          className="max-h-56 object-contain"
                        />
                      </div>
                      {selectedDefect.evidence_sha256 && (
                        <span className="text-[10px] font-mono text-gray-400 block mt-1 truncate">
                          SHA-256: {selectedDefect.evidence_sha256}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Bottom Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-200 dark:border-white/10">
                    {!readOnly && (
                      <button
                        type="button"
                        onClick={() => handleDeleteDefect(selectedDefect.id)}
                        className="px-3 py-1.5 rounded-xl text-rose-500 hover:bg-rose-500/10 font-medium inline-flex items-center gap-1.5 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Löschen
                      </button>
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setNoticeDefect(selectedDefect)}
                        className="min-h-[40px] px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold inline-flex items-center gap-2 shadow-sm transition-all"
                      >
                        <FileText className="w-4 h-4" />
                        <span>Mängelrüge gem. § 13 VOB/B generieren</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* 6. FORMELLE MÄNGELRÜGE GENERATOR MODAL */}
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
            className="w-full max-w-2xl bg-white dark:bg-[#121824] border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 bg-teal-500/10 border-b border-teal-500/20">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    Formelle Mängelrüge nach VOB/B § 13 Abs. 5
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    Rechtswirksame Fristsetzung mit Androhung von Ersatzvornahme
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setNoticeDefect(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-5 overflow-y-auto space-y-3">
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-700 dark:text-amber-300 leading-relaxed">
                <strong>Rechtlicher Hinweis nach VOB/B § 13 Abs. 5 Satz 1 & 2:</strong> Das Anschreiben setzt dem Nachunternehmer eine taggenaue Frist zur Beseitigung und droht bei fruchtlosem Ablauf explizit die Ersatzvornahme auf dessen Kosten an.
              </div>

              <div className="relative">
                <textarea
                  readOnly
                  rows={14}
                  value={generateLegalNoticeText(noticeDefect)}
                  className="w-full font-mono text-xs p-4 rounded-xl bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 text-gray-800 dark:text-gray-200 outline-none leading-relaxed select-all"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/[0.03] border-t border-gray-200 dark:border-white/10">
              <div className="text-[11px] text-gray-400">
                Status wird auf <strong className="text-amber-500">„Gerügt (§ 13)“</strong> gesetzt.
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-gray-100 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Drucken
                </button>

                <button
                  type="button"
                  onClick={() => copyNoticeToClipboard(generateLegalNoticeText(noticeDefect))}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold inline-flex items-center gap-2 shadow-sm transition-all"
                >
                  {noticeCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{noticeCopied ? 'Kopiert!' : 'Mängelrüge kopieren'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
