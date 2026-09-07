'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  CloudSun,
  FileText,
  Clock,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { t } from '@/lib/i18n';
import { MeasurementGrid, type MeasurementRowItem } from '@/components/craft/MeasurementGrid';
import { EvidencePhotoUpload, type EvidencePhotoItem } from '@/components/craft/EvidencePhotoUpload';
import { SignaturePad } from '@/components/craft/SignaturePad';
import { createSiteReportAction, updateSiteReportAction, signSiteReportAction } from '@/app/actions/craft/site-reports';
import { createMeasurementAction } from '@/app/actions/craft/measurements';
import { createEvidenceItemAction } from '@/app/actions/craft/evidence';
import { saveMediaBlob } from '@/lib/offline-sync';
import type { SiteReportRecord, QualificationLevel } from '@/lib/pocketbase-types';
import { useDraftAutosave } from '@/hooks/useOfflineSync';

interface DailySiteReportFormProps {
  projectId: string;
  initialReport?: Partial<SiteReportRecord>;
  onSaved?: (report: SiteReportRecord) => void;
  redirectTo?: string | false;
}

export function DailySiteReportForm({
  projectId,
  initialReport,
  onSaved,
  redirectTo,
}: DailySiteReportFormProps) {
  const router = useRouter();
  const [reportDate, setReportDate] = useState(
    initialReport?.report_date || new Date().toISOString().split('T')[0]
  );
  const [weather, setWeather] = useState(initialReport?.weather || 'Sonnig');
  const [temperature, setTemperature] = useState<number | undefined>(
    initialReport?.temperature || 18
  );
  const [workPerformed, setWorkPerformed] = useState(
    initialReport?.work_performed || ''
  );
  const [specialEvents, setSpecialEvents] = useState(
    initialReport?.special_events || ''
  );
  const [clientName, setClientName] = useState(initialReport?.client_name || '');
  const [qualificationHours, setQualificationHours] = useState<
    Record<QualificationLevel, number>
  >(
    initialReport?.qualification_hours || {
      meister: 0,
      geselle: 0,
      helfer: 0,
      azubi: 0,
    }
  );
  const [isRegieExtra, setIsRegieExtra] = useState<boolean>(
    Boolean(initialReport?.is_regie_extra)
  );

  const [measurements, setMeasurements] = useState<MeasurementRowItem[]>([]);
  const [evidencePhotos, setEvidencePhotos] = useState<EvidencePhotoItem[]>([]);
  const [clientSignature, setClientSignature] = useState(
    initialReport?.client_signature || ''
  );
  const [contractorSignature, setContractorSignature] = useState(
    initialReport?.contractor_signature || ''
  );

  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const reportKey = initialReport?.id ?? `draft_${projectId}`;
  const { saveDraft, draft, clearDraft } = useDraftAutosave(reportKey, true);
  const signatureTelemetryRef = useRef<{ dataUrl: string; strokes: number[][][] } | null>(null);
  const initialMergeDone = useRef(false);

  const handleHourChange = (level: QualificationLevel, val: number) => {
    setQualificationHours((prev) => ({ ...prev, [level]: Math.max(0, val) }));
  };

  useEffect(() => {
    if (initialMergeDone.current || !draft?.data) return;
    initialMergeDone.current = true;
    const d = draft.data;
    if (!reportDate && d.report_date) setReportDate(d.report_date);
    if (!weather && d.weather) setWeather(d.weather);
    if (!temperature && d.temperature !== undefined) setTemperature(d.temperature);
    if (!workPerformed && d.work_performed) setWorkPerformed(d.work_performed);
    if (!specialEvents && d.special_events) setSpecialEvents(d.special_events);
    if (!clientName && d.client_name) setClientName(d.client_name);
    if (!clientSignature && d.client_signature) setClientSignature(d.client_signature);
    if (!contractorSignature && d.contractor_signature) setContractorSignature(d.contractor_signature);
    if (d.is_regie_extra !== undefined) setIsRegieExtra(Boolean(d.is_regie_extra));
    if (d.qualification_hours) {
      setQualificationHours((prev) => {
        const next = { ...prev };
        let changed = false;
        for (const key of Object.keys(prev) as QualificationLevel[]) {
          if ((prev[key] === 0 || prev[key] === undefined) && d.qualification_hours![key] !== undefined) {
            next[key] = d.qualification_hours[key];
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }
  }, [draft]);

  useEffect(() => {
    saveDraft({
      report_date: reportDate,
      weather,
      temperature,
      work_performed: workPerformed,
      special_events: specialEvents,
      qualification_hours: qualificationHours,
      client_name: clientName,
      client_signature: clientSignature,
      contractor_signature: contractorSignature,
      is_regie_extra: isRegieExtra,
    });
  }, [reportDate, weather, temperature, workPerformed, specialEvents, qualificationHours, clientName, clientSignature, contractorSignature, isRegieExtra, saveDraft]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMessage(null);

    try {
      let savedReport: SiteReportRecord;

      const payload = {
        project: projectId,
        report_date: reportDate,
        status: (clientSignature ? 'signed' : 'draft') as 'signed' | 'draft',
        weather,
        temperature,
        work_performed: workPerformed,
        special_events: specialEvents,
        client_name: clientName,
        qualification_hours: qualificationHours,
        is_regie_extra: isRegieExtra,
        client_signature: clientSignature || undefined,
        client_signed_at: clientSignature ? new Date().toISOString() : undefined,
        contractor_signature: contractorSignature || undefined,
        contractor_signed_at: contractorSignature ? new Date().toISOString() : undefined,
      };

      if (initialReport?.id) {
        savedReport = await updateSiteReportAction(initialReport.id, payload);
      } else {
        savedReport = await createSiteReportAction(payload);
      }

      // Save Measurements (must precede signing to respect GoBD status lock)
      if (measurements.length > 0) {
        for (const m of measurements) {
          if (m.title.trim()) {
            await createMeasurementAction({
              site_report: savedReport.id,
              position_nr: m.position_nr,
              title: m.title,
              formula: m.formula,
              quantity: m.quantity,
              unit: m.unit,
              unit_price: m.unit_price,
              total_price: m.total_price,
            });
          }
        }
      }

      // Save Evidence Photos (Beweisfotodokumentation GoBD & Baustellennachweis)
      if (evidencePhotos.length > 0) {
        for (const photo of evidencePhotos) {
          if (photo.file) {
            try {
              await createEvidenceItemAction({
                site_report: savedReport.id,
                file: photo.file,
                caption: photo.caption,
                sha256_hash: photo.sha256_hash,
                taken_at: photo.taken_at,
                gps_lat: photo.gps_lat,
                gps_lon: photo.gps_lon,
              });
            } catch (photoErr) {
              console.error('Failed to upload evidence photo to server, saving offline media blob:', photoErr);
              try {
                await saveMediaBlob(savedReport.id, photo.file, photo.file.type || 'image/jpeg');
              } catch {}
            }
          }
        }
      }

      // Sign Site Report (final step: seals report, marks status='signed' and enforces GoBD immutability)
      let signError: string | undefined;
      if (clientSignature && savedReport?.id) {
        try {
          const telemetry = signatureTelemetryRef.current
            ? {
                strokes: signatureTelemetryRef.current.strokes,
                gpsLat: undefined as number | undefined,
                gpsLon: undefined as number | undefined,
                gpsAccuracy: undefined as number | undefined,
              }
            : undefined;

          if (telemetry && typeof navigator !== 'undefined' && navigator.geolocation) {
            try {
              const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                  enableHighAccuracy: true,
                  timeout: 5000,
                });
              });
              telemetry.gpsLat = position.coords.latitude;
              telemetry.gpsLon = position.coords.longitude;
              telemetry.gpsAccuracy = position.coords.accuracy;
            } catch {
              // GPS-Fehler → Werte bleiben undefined
            }
          }

          const signedReport = await signSiteReportAction(
            savedReport.id,
            clientName,
            clientSignature,
            telemetry
          );
          savedReport = signedReport;
        } catch (signErr: any) {
          signError = signErr?.message || 'Fehler beim Signieren des Berichts.';
        }
      }

      await clearDraft();

      if (signError) {
        setStatusMessage({
          type: 'error',
          text: signError,
        });
      } else {
        setStatusMessage({
          type: 'success',
          text: 'Bautagesbericht erfolgreich gespeichert!',
        });
        onSaved?.(savedReport);
        if (redirectTo !== false) {
          router.push(typeof redirectTo === 'string' ? redirectTo : `/projects/${projectId}/site-reports`);
        }
      }
    } catch (err: any) {
      console.error('Failed to save site report:', err);
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Fehler beim Speichern des Berichts.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* 1. Basis-Daten & Wetter */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#121824] border border-gray-200 dark:border-white/10 shadow-sm space-y-5">
        <div className="flex items-center gap-2 border-b border-gray-100 dark:border-white/5 pb-3">
          <Calendar className="w-5 h-5 text-teal-500" />
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            Rahmendaten & Wetterbedingungen
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              {t('craft.site_report.date')}
            </label>
            <input
              type="date"
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              <CloudSun className="w-3.5 h-3.5 inline mr-1 text-teal-500" />
              {t('craft.site_report.weather')}
            </label>
            <input
              type="text"
              value={weather}
              onChange={(e) => setWeather(e.target.value)}
              placeholder="z.B. Sonnig / Trocken"
              className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              {t('craft.site_report.temperature')}
            </label>
            <input
              type="number"
              value={temperature ?? ''}
              onChange={(e) => { const val = parseFloat(e.target.value); setTemperature(isNaN(val) ? undefined : val); }}
              placeholder="18"
              className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 text-sm"
            />
          </div>
        </div>
      </div>

      {/* 2. Ausgeführte Arbeiten & Behinderungen */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#121824] border border-gray-200 dark:border-white/10 shadow-sm space-y-5">
        <div className="flex items-center gap-2 border-b border-gray-100 dark:border-white/5 pb-3">
          <FileText className="w-5 h-5 text-teal-500" />
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            Tätigkeitsbericht & Vorkommnisse
          </h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              {t('craft.site_report.work_performed')}
            </label>
            <textarea
              rows={4}
              value={workPerformed}
              onChange={(e) => setWorkPerformed(e.target.value)}
              placeholder="Detaillierte Beschreibung der ausgeführten Arbeiten..."
              className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 text-sm placeholder-gray-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              {t('craft.site_report.special_events')}
            </label>
            <textarea
              rows={2}
              value={specialEvents}
              onChange={(e) => setSpecialEvents(e.target.value)}
              placeholder="Witterungsbedingte Unterbrechungen, bauseitige Verzögerungen..."
              className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 text-sm placeholder-gray-400"
            />
          </div>
        </div>
      </div>

      {/* 3. Stunden nach Qualifikation */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#121824] border border-gray-200 dark:border-white/10 shadow-sm space-y-5">
        <div className="flex items-center gap-2 border-b border-gray-100 dark:border-white/5 pb-3">
          <Clock className="w-5 h-5 text-teal-500" />
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            {t('craft.site_report.qualification_hours')}
          </h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              {t('craft.site_report.hours_meister')}
            </label>
            <input
              type="number"
              step="0.5"
              value={qualificationHours.meister || ''}
              onChange={(e) => handleHourChange('meister', parseFloat(e.target.value) || 0)}
              placeholder="0"
              className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 text-sm font-medium"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              {t('craft.site_report.hours_geselle')}
            </label>
            <input
              type="number"
              step="0.5"
              value={qualificationHours.geselle || ''}
              onChange={(e) => handleHourChange('geselle', parseFloat(e.target.value) || 0)}
              placeholder="0"
              className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 text-sm font-medium"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              {t('craft.site_report.hours_helfer')}
            </label>
            <input
              type="number"
              step="0.5"
              value={qualificationHours.helfer || ''}
              onChange={(e) => handleHourChange('helfer', parseFloat(e.target.value) || 0)}
              placeholder="0"
              className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 text-sm font-medium"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              {t('craft.site_report.hours_azubi')}
            </label>
            <input
              type="number"
              step="0.5"
              value={qualificationHours.azubi || ''}
              onChange={(e) => handleHourChange('azubi', parseFloat(e.target.value) || 0)}
              placeholder="0"
              className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 text-sm font-medium"
            />
          </div>
        </div>

        {/* VOB/B § 2 Abs. 10 Regie-Zusatzleistung */}
        <div className="flex items-start gap-3 p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl">
          <input
            id="is_regie_extra"
            type="checkbox"
            checked={isRegieExtra}
            onChange={(e) => setIsRegieExtra(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-amber-400 text-amber-600 focus:ring-amber-500"
          />
          <label htmlFor="is_regie_extra" className="text-xs text-foreground cursor-pointer select-none">
            <span className="font-semibold text-amber-600 dark:text-amber-400 block">
              Zusatzleistung als Regiestunden gem. § 2 Abs. 10 VOB/B abrechnen
            </span>
            Stunden dieses Bautagesberichts gelten als gesondert vergütungspflichtige Regiearbeiten und werden im Margen-Cockpit zusätzlich zu den App-Stempelzeiten der Monteure erfasst.
          </label>
        </div>
      </div>

      {/* 4. VOB-Aufmaß Grid */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#121824] border border-gray-200 dark:border-white/10 shadow-sm">
        <MeasurementGrid onChange={setMeasurements} />
      </div>

      {/* 5. Fotodokumentation */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#121824] border border-gray-200 dark:border-white/10 shadow-sm">
        <EvidencePhotoUpload onChange={setEvidencePhotos} />
      </div>

      {/* 6. Signaturen */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#121824] border border-gray-200 dark:border-white/10 shadow-sm space-y-6">
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            {t('craft.site_report.client_name')}
          </label>
          <input
            type="text"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="Name des Bauleiters / Auftraggebers"
            className="w-full max-w-md px-3 py-2 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 text-sm"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SignaturePad
            label={t('craft.site_report.sign_client')}
            initialSignature={clientSignature}
            onSave={setClientSignature}
            onClear={() => setClientSignature('')}
            onTelemetry={(telemetry) => {
              signatureTelemetryRef.current = telemetry;
            }}
          />

          <SignaturePad
            label={t('craft.site_report.sign_contractor')}
            initialSignature={contractorSignature}
            onSave={setContractorSignature}
            onClear={() => setContractorSignature('')}
          />
        </div>
      </div>

      {/* Status Alert */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-sm ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Action Bar */}
      <div className="flex items-center justify-end gap-4 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-sm font-medium hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
        >
          Abbrechen
        </button>

        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center gap-2 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-[0.98] px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-teal-500/20 transition-all disabled:opacity-50"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {isSaving ? 'Speichert…' : t('craft.site_report.save_report')}
        </button>
      </div>
    </form>
  );
}
