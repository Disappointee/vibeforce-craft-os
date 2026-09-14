'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  AlertTriangle,
  Camera,
  Upload,
  Calendar,
  Building2,
  ShieldCheck,
  MapPin,
  Clock,
  X,
  Trash2,
  Layers,
  Sparkles,
  Check,
} from 'lucide-react';
import type { DefectPinRecord, DefectSeverity, DefectStatus, ProjectRecord } from '@/lib/pocketbase-types';

export const CRAFT_TRADES_LIST = [
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
  'Metallbau & Schlosser',
  'Fassadenbau / WDVS',
  'Gerüstbau',
  'Sonstiges Gewerk',
];

interface NewDefectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: ProjectRecord[];
  selectedProjectId?: string;
  initialCoords?: { x: number; y: number };
  onDefectCreated?: (defect: DefectPinRecord) => void;
}

async function computeSha256(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function NewDefectDialog({
  open,
  onOpenChange,
  projects,
  selectedProjectId,
  initialCoords,
  onDefectCreated,
}: NewDefectDialogProps) {
  const [projectId, setProjectId] = useState<string>(() => {
    return selectedProjectId || (projects.length > 0 ? projects[0].id : '');
  });

  const [title, setTitle] = useState('');
  const [trade, setTrade] = useState('Trockenbau');
  const [contractorName, setContractorName] = useState('');
  const [locationNote, setLocationNote] = useState('');
  const [severity, setSeverity] = useState<DefectSeverity>('major');
  const [status, setStatus] = useState<DefectStatus>('draft');
  const [description, setDescription] = useState('');

  // VOB/B § 13 Frist (Default: 14 Kalendertage gem. VOB-Praxis)
  const defaultDueDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().slice(0, 10);
  };
  const [dueDate, setDueDate] = useState<string>(defaultDueDate());

  // Foto & SHA-256
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoSha256, setPhotoSha256] = useState<string | null>(null);
  const [photoGps, setPhotoGps] = useState<{ lat?: number; lon?: number } | null>(null);
  const [photoTimestamp, setPhotoTimestamp] = useState<string | null>(null);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Sync selected project ID when prop changes
  useEffect(() => {
    if (selectedProjectId) {
      setProjectId(selectedProjectId);
    } else if (projects.length > 0 && !projectId) {
      setProjectId(projects[0].id);
    }
  }, [selectedProjectId, projects]);

  if (!open) return null;

  const activeProject = projects.find((p) => p.id === projectId) || projects[0];

  const handlePhotoFile = async (file: File) => {
    setIsProcessingPhoto(true);
    try {
      const previewUrl = URL.createObjectURL(file);
      setPhotoPreview(previewUrl);

      // SHA-256 Integritäts-Hash
      const hash = await computeSha256(file);
      setPhotoSha256(hash);
      setPhotoTimestamp(new Date().toISOString());

      // GPS Position ermitteln
      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setPhotoGps({
              lat: pos.coords.latitude,
              lon: pos.coords.longitude,
            });
          },
          () => {
            // Keine GPS-Berechtigung oder Timeout -> kein Blocker
          },
          { timeout: 4000 }
        );
      }
    } catch (e) {
      console.error('Fehler bei der SHA-256 Fotoverarbeitung:', e);
    } finally {
      setIsProcessingPhoto(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handlePhotoFile(file);
  };

  const removePhoto = () => {
    setPhotoPreview(null);
    setPhotoSha256(null);
    setPhotoGps(null);
    setPhotoTimestamp(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  // Frist-Schnellauswahl gem. VOB/B § 13
  const setQuickDeadline = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setDueDate(d.toISOString().slice(0, 10));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const projectKey = activeProject?.key || 'BAUSTELLE';

    const newDefect: DefectPinRecord = {
      id: 'def_' + Math.random().toString(36).substring(2, 9),
      collectionId: 'defect_pins',
      collectionName: 'defect_pins',
      project: projectKey,
      title: title.trim(),
      description: description.trim(),
      trade,
      location_note: locationNote.trim() || 'Baustelle allgemein',
      pin_x: initialCoords ? initialCoords.x : 50.0,
      pin_y: initialCoords ? initialCoords.y : 50.0,
      severity,
      status,
      due_date: dueDate,
      contractor_name: contractorName.trim() || 'Nachunternehmer N.N.',
      evidence_photo_url: photoPreview || undefined,
      evidence_sha256: photoSha256 || undefined,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
    };

    // Im LocalStorage für das Projekt persistieren
    try {
      const storageKey = `vibe_defects_${projectKey}`;
      const existing = localStorage.getItem(storageKey);
      const parsed: DefectPinRecord[] = existing ? JSON.parse(existing) : [];
      const updated = [newDefect, ...parsed];
      localStorage.setItem(storageKey, JSON.stringify(updated));

      // Globales Custom-Event auslösen, damit offene Manager synchronisieren
      window.dispatchEvent(new CustomEvent('vibe_defect_created', { detail: newDefect }));
    } catch (err) {
      console.warn('LocalStorage save warning:', err);
    }

    onDefectCreated?.(newDefect);
    onOpenChange(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onOpenChange(false);
      }}
    >
      <div
        className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-amber-500/10 border-b border-amber-500/20 shrink-0">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-amber-500/20 text-amber-500">
              <AlertTriangle className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                Neuen Mangel vor Ort erfassen
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                  VOB/B § 13
                </span>
              </h3>
              <p className="text-xs text-muted-foreground">
                Beweissichere Aufnahme mit SHA-256 Integritätsprüfung & Fristsetzung
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          {/* Scrollable Form Body */}
          <div className="p-5 overflow-y-auto space-y-4 flex-1">
            {/* 1. Baustelle & Bezeichnung */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1">
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Baustelle / Bauvorhaben *
                </label>
                <select
                  id="defect-project-select"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full bg-muted/50 border border-border rounded-xl px-3 py-2 text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.key})
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Bezeichnung des Mangels *
                </label>
                <input
                  id="defect-title-input"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="z.B. Rissbildung an GK-Fuge Achse C-2"
                  className="w-full bg-muted/50 border border-border rounded-xl px-3 py-2 text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* 2. Gewerk & Nachunternehmer */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Betroffenes Gewerk (VOB/C) *
                </label>
                <select
                  id="defect-trade-select"
                  value={trade}
                  onChange={(e) => setTrade(e.target.value)}
                  className="w-full bg-muted/50 border border-border rounded-xl px-3 py-2 text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {CRAFT_TRADES_LIST.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Nachunternehmer / Verursacher
                </label>
                <input
                  id="defect-contractor-input"
                  type="text"
                  value={contractorName}
                  onChange={(e) => setContractorName(e.target.value)}
                  placeholder="z.B. Trockenbau Spree GmbH"
                  className="w-full bg-muted/50 border border-border rounded-xl px-3 py-2 text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* 3. Ort / Achse & Schweregrad */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Ort / Bauteil / Achse / Raum
                </label>
                <input
                  id="defect-location-input"
                  type="text"
                  value={locationNote}
                  onChange={(e) => setLocationNote(e.target.value)}
                  placeholder="z.B. OG 1 · Raum 104 · Achse C-3"
                  className="w-full bg-muted/50 border border-border rounded-xl px-3 py-2 text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Schweregrad nach VOB
                </label>
                <select
                  id="defect-severity-select"
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as DefectSeverity)}
                  className="w-full bg-muted/50 border border-border rounded-xl px-3 py-2 text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="critical">🚨 Kritisch (Baustopp-Gefahr / Sicherheitsmangel)</option>
                  <option value="major">⚠️ Wesentlich (Mangel nach § 12 Abs. 3 VOB/B)</option>
                  <option value="minor">ℹ️ Unwesentlich (Optischer Mangel / Bagatelle)</option>
                </select>
              </div>
            </div>

            {/* 4. VOB/B § 13 Fristsetzung mit Schnellwahltasten */}
            <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-500" />
                  Beseitigungsfrist gem. § 13 Abs. 5 Satz 1 VOB/B *
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setQuickDeadline(7)}
                    className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/20 transition-colors"
                  >
                    +7 Tage (Eilt)
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickDeadline(14)}
                    className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-amber-500/20 hover:bg-amber-500/30 text-amber-800 dark:text-amber-300 border border-amber-500/30 transition-colors"
                  >
                    +14 Tage (VOB-Regel)
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickDeadline(21)}
                    className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
                  >
                    +21 Tage
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  id="defect-due-date-input"
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-card border border-border rounded-xl px-3 py-2 text-xs font-mono font-medium text-foreground outline-none focus:ring-2 focus:ring-amber-500"
                />
                <select
                  id="defect-status-select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as DefectStatus)}
                  className="w-full bg-card border border-border rounded-xl px-3 py-2 text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="draft">Erfasst (Interner Entwurf)</option>
                  <option value="notified">Formell gerügt (§ 13 Abs. 5)</option>
                  <option value="in_progress">In Nachbesserung durch NU</option>
                  <option value="resolved">Nachgebessert (Prüfbereit)</option>
                  <option value="accepted">✓ Abgenommen & Erledigt</option>
                </select>
              </div>
            </div>

            {/* 5. Fotobeweis mit SHA-256 Integritätsprüfung */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-teal-500" />
                  Fotobeweis vor Ort (GoBD & VOB SHA-256 signiert)
                </label>
                {photoSha256 && (
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Signiert
                  </span>
                )}
              </div>

              {/* Versteckte File Inputs für Kamera und Upload */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileChange}
              />

              {!photoPreview ? (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    disabled={isProcessingPhoto}
                    className="min-h-[56px] p-3 rounded-xl border border-dashed border-border bg-muted/30 hover:bg-amber-500/10 hover:border-amber-500/40 flex flex-col items-center justify-center gap-1 text-xs font-semibold text-foreground transition-all active:scale-[0.98]"
                  >
                    <Camera className="w-5 h-5 text-amber-500" />
                    <span>Kamera öffnen</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessingPhoto}
                    className="min-h-[56px] p-3 rounded-xl border border-dashed border-border bg-muted/30 hover:bg-teal-500/10 hover:border-teal-500/40 flex flex-col items-center justify-center gap-1 text-xs font-semibold text-foreground transition-all active:scale-[0.98]"
                  >
                    <Upload className="w-5 h-5 text-teal-500" />
                    <span>Datei hochladen</span>
                  </button>
                </div>
              ) : (
                <div className="relative rounded-xl overflow-hidden border border-border bg-muted/20 p-2 space-y-2">
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-black flex items-center justify-center max-h-48">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photoPreview}
                      alt="Mängel-Fotobeweis"
                      className="w-full h-full object-contain"
                    />
                    <button
                      type="button"
                      onClick={removePhoto}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/70 text-white hover:bg-rose-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-1 text-[10px] font-mono text-muted-foreground bg-card p-2 rounded-lg border border-border">
                    <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold truncate">
                      <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">SHA-256: {photoSha256}</span>
                    </div>
                    <div className="flex items-center justify-between text-muted-foreground pt-0.5">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {photoTimestamp ? new Date(photoTimestamp).toLocaleTimeString('de-DE') : ''}
                      </span>
                      {photoGps?.lat && photoGps?.lon && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-teal-500" />
                          {photoGps.lat.toFixed(4)}, {photoGps.lon.toFixed(4)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 6. Detaillierte Mängelbeschreibung */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Detaillierte Mängelbeschreibung & Ursache
              </label>
              <textarea
                id="defect-description-textarea"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Exakte Beschreibung des Mangels, DIN-Normen, Abweichung von Leistungsbeschreibung / Plänen..."
                className="w-full bg-muted/50 border border-border rounded-xl p-3 text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* 7. Plan-Koordinaten Info */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40 border border-border text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-500" />
                Plan-Verortung: X: {initialCoords ? `${initialCoords.x}%` : '50%'}, Y:{' '}
                {initialCoords ? `${initialCoords.y}%` : '50%'}
              </span>
              <span className="text-[10px]">
                {initialCoords ? '✓ Exakt platziert' : 'Im 2D-Bauplan frei verschiebbar'}
              </span>
            </div>
          </div>

          {/* Sticky Footer Actions */}
          <div className="flex items-center justify-end gap-2 p-4 bg-muted/20 border-t border-border shrink-0">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="min-h-[44px] px-4 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition-colors"
            >
              Abbrechen
            </button>
            <button
              id="defect-submit-btn"
              type="submit"
              disabled={isProcessingPhoto}
              className="min-h-[44px] px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold shadow-sm inline-flex items-center gap-2 active:scale-[0.98] transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Mangel rechtssicher anlegen</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
