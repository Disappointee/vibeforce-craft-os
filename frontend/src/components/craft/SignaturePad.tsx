'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import SignaturePadLib, { type PointGroup } from 'signature_pad';
import { PenTool, Trash2, Check, X, Maximize2, Sparkles, Fingerprint } from 'lucide-react';
import { t } from '@/lib/i18n';

interface SignaturePadProps {
  label: string;
  initialSignature?: string;
  onSave?: (dataUrl: string) => void;
  onClear?: () => void;
  onTelemetry?: (telemetry: { dataUrl: string; strokes: number[][][]; recordedAt?: string }) => void;
  readOnly?: boolean;
}

export function SignaturePad({
  label,
  initialSignature,
  onSave,
  onClear,
  onTelemetry,
  readOnly = false,
}: SignaturePadProps) {
  const [currentSignature, setCurrentSignature] = useState<string | null>(initialSignature || null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [drawMode, setDrawMode] = useState<'fine' | 'finger'>('fine');
  const [isModalPadEmpty, setIsModalPadEmpty] = useState(true);

  const modalCanvasRef = useRef<HTMLCanvasElement>(null);
  const modalPadRef = useRef<SignaturePadLib | null>(null);

  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;
  const onTelemetryRef = useRef(onTelemetry);
  onTelemetryRef.current = onTelemetry;
  const onClearRef = useRef(onClear);
  onClearRef.current = onClear;

  // Sync external initialSignature if it changes
  useEffect(() => {
    if (initialSignature !== undefined) {
      setCurrentSignature(initialSignature || null);
    }
  }, [initialSignature]);

  // Handle modal canvas initialization & resize
  useEffect(() => {
    if (!isModalOpen || !modalCanvasRef.current) return;

    const canvas = modalCanvasRef.current;
    let padInstance: SignaturePadLib | null = null;

    const initPad = () => {
      const dpr = Math.max(window.devicePixelRatio || 1, 1);
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      const ctx = canvas.getContext('2d');
      ctx?.scale(dpr, dpr);

      // Determine pen color based on dark mode class on html/body
      const isDark =
        typeof document !== 'undefined' &&
        (document.documentElement.classList.contains('dark') ||
          document.body.classList.contains('dark'));

      const penColor = isDark ? '#38BDF8' : '#0284C7'; // Industrial Titanium Electric Blue / Teal

      padInstance = new SignaturePadLib(canvas, {
        backgroundColor: 'rgba(255, 255, 255, 0)',
        penColor: penColor,
        minWidth: drawMode === 'fine' ? 1.2 : 3.0,
        maxWidth: drawMode === 'fine' ? 2.6 : 6.0,
      });

      modalPadRef.current = padInstance;

      if (currentSignature) {
        padInstance.fromDataURL(currentSignature);
        setIsModalPadEmpty(false);
      } else {
        setIsModalPadEmpty(true);
      }

      padInstance.addEventListener('endStroke', () => {
        setIsModalPadEmpty(padInstance ? padInstance.isEmpty() : true);
      });
    };

    // Small delay to ensure DOM layout / modal animation has set client dimensions
    const timer = setTimeout(initPad, 50);

    const resizeObserver = new ResizeObserver(() => {
      if (!modalPadRef.current || !canvas) return;
      const pad = modalPadRef.current;
      const data = pad.toData();
      const prevDataUrl = !pad.isEmpty() ? pad.toDataURL() : null;

      const dpr = Math.max(window.devicePixelRatio || 1, 1);
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      const ctx = canvas.getContext('2d');
      ctx?.scale(dpr, dpr);

      pad.clear();
      if (data && data.length > 0) {
        pad.fromData(data);
      } else if (prevDataUrl) {
        pad.fromDataURL(prevDataUrl);
      }
    });

    resizeObserver.observe(canvas);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
      window.removeEventListener('keydown', handleKeyDown);
      if (padInstance) {
        padInstance.off();
      }
      modalPadRef.current = null;
    };
  }, [isModalOpen]);

  // Update stroke width dynamically when toggling between fine pen & finger mode
  const handleModeChange = (mode: 'fine' | 'finger') => {
    setDrawMode(mode);
    if (modalPadRef.current) {
      modalPadRef.current.minWidth = mode === 'fine' ? 1.2 : 3.0;
      modalPadRef.current.maxWidth = mode === 'fine' ? 2.6 : 6.0;
    }
  };

  const handleClearInModal = () => {
    if (modalPadRef.current) {
      modalPadRef.current.clear();
      setIsModalPadEmpty(true);
    }
  };

  const handleClear = () => {
    setCurrentSignature(null);
    if (modalPadRef.current) {
      modalPadRef.current.clear();
      setIsModalPadEmpty(true);
    }
    onClearRef.current?.();
  };

  const handleApplyModalSignature = () => {
    if (!modalPadRef.current || modalPadRef.current.isEmpty()) {
      alert('Bitte zeichnen Sie zuerst eine Unterschrift auf die Zeichenfläche.');
      return;
    }

    const pad = modalPadRef.current;
    const dataUrl = pad.toDataURL('image/png');

    // Extract biometric stroke telemetry for VOB/B § 15 Abs. 3 tamper-evident hash
    const rawStrokes = pad.toData();
    const strokes: number[][][] = rawStrokes.map((stroke: PointGroup) =>
      stroke.points.map((point: { x: number; y: number; time?: number }) => [
        Math.round(point.x * 100) / 100,
        Math.round(point.y * 100) / 100,
        Math.round(point.time ?? performance.now()),
      ])
    );

    const recordedAt = new Date().toISOString();
    setCurrentSignature(dataUrl);
    onSaveRef.current?.(dataUrl);
    onTelemetryRef.current?.({ dataUrl, strokes, recordedAt });
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
          <PenTool className="w-3.5 h-3.5 text-teal-500" />
          {label}
        </label>
        {!readOnly && currentSignature && (
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex items-center gap-1 text-xs text-rose-500 hover:text-rose-600 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {t('craft.site_report.clear_signature')}
          </button>
        )}
      </div>

      {/* COMPACT INLINE TRIGGER BOX */}
      <div
        role={readOnly ? undefined : 'button'}
        tabIndex={readOnly ? undefined : 0}
        onClick={() => {
          if (!readOnly) setIsModalOpen(true);
        }}
        onKeyDown={(e) => {
          if (!readOnly && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            setIsModalOpen(true);
          }
        }}
        className={`relative w-full h-36 rounded-2xl border transition-all select-none overflow-hidden flex flex-col items-center justify-center p-3 text-center ${
          currentSignature
            ? 'border-emerald-500/40 bg-emerald-500/5 hover:border-emerald-500/70 hover:bg-emerald-500/10 cursor-pointer shadow-sm'
            : readOnly
            ? 'border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-[#0c1017] cursor-default'
            : 'border-2 border-dashed border-gray-300 dark:border-white/15 bg-gray-50/60 dark:bg-[#0c1017] hover:border-teal-500 dark:hover:border-teal-400 hover:bg-teal-500/5 cursor-pointer group shadow-inner'
        }`}
      >
        {currentSignature ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentSignature}
              alt="Signatur-Vorschau"
              className="max-h-24 max-w-[90%] object-contain filter drop-shadow-sm pointer-events-none"
            />
            <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              <Check className="w-3.5 h-3.5" />
              <span>✓ Signatur erfasst {!readOnly && '(Tippen zum Bearbeiten)'}</span>
            </div>
          </div>
        ) : readOnly ? (
          <div className="text-xs text-gray-400 flex items-center gap-1.5">
            <span>Keine Signatur hinterlegt</span>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-teal-600/10 text-teal-600 dark:bg-teal-500/20 dark:text-teal-300 border border-teal-500/30 group-hover:scale-105 transition-transform shadow-xs">
              <Maximize2 className="w-3.5 h-3.5" />
              ✍️ Tippen zum Unterschreiben
            </span>
            <span className="text-[11px] text-gray-500 dark:text-gray-400">
              Öffnet das 92vh Vollbild Signature Studio (Feinstift & Finger)
            </span>
          </div>
        )}
      </div>

      {/* FULL-SURFACE EXPANDED SIGNATURE STUDIO MODAL */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
        >
          <div
            className="w-full max-w-4xl h-[92vh] max-h-[720px] bg-white dark:bg-[#121824] border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-gray-50/80 dark:bg-white/[0.03] border-b border-gray-200 dark:border-white/10">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">
                    Digitale Signatur erfassen
                  </h3>
                  <span className="hidden xs:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                    VOB/B § 15
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">
                  {label} — Maximierte Zeichenfläche für Finger- und Stift-Eingabe
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Feinstift vs Finger Mode Switcher */}
                <div className="inline-flex bg-gray-200/70 dark:bg-white/10 p-1 rounded-xl gap-1">
                  <button
                    type="button"
                    onClick={() => handleModeChange('fine')}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                      drawMode === 'fine'
                        ? 'bg-white dark:bg-teal-600 text-teal-700 dark:text-white shadow-xs font-semibold'
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'
                    }`}
                  >
                    <PenTool className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Feinstift</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleModeChange('finger')}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                      drawMode === 'finger'
                        ? 'bg-white dark:bg-teal-600 text-teal-700 dark:text-white shadow-xs font-semibold'
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'
                    }`}
                  >
                    <Fingerprint className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Finger / Baustelle</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                  aria-label="Schließen"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* EXPANDED CANVAS AREA */}
            <div className="flex-1 relative w-full h-full bg-gray-50/75 dark:bg-[#090d16] overflow-hidden select-none touch-none">
              <canvas
                ref={modalCanvasRef}
                className="w-full h-full touch-none cursor-crosshair block"
              />

              {/* VOB/B Orientierungs-Grundlinie (Baseline) */}
              <div className="absolute bottom-[20%] left-[6%] right-[6%] border-b-2 border-dashed border-gray-300 dark:border-white/20 pointer-events-none flex items-center gap-3">
                <span className="text-gray-400 dark:text-gray-500 font-mono font-bold text-lg select-none -mt-5">
                  ✕
                </span>
                <span className="text-[10px] font-mono tracking-wider text-gray-400/80 dark:text-gray-500/80 uppercase -mt-4 select-none">
                  Unterschriften-Basislinie (DIN 18299 / VOB/B § 15)
                </span>
              </div>

              {/* Empty state hint */}
              {isModalPadEmpty && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none gap-2 text-gray-400 dark:text-gray-500">
                  <span className="text-3xl">✍️</span>
                  <span className="text-sm font-medium">
                    Hier großzügig mit Stift oder Finger unterschreiben
                  </span>
                  <span className="text-xs text-gray-400/80">
                    Modus: {drawMode === 'fine' ? 'Feinstift (1.2–2.6px)' : 'Finger / Handschuh (3.0–6.0px)'}
                  </span>
                </div>
              )}
            </div>

            {/* Modal Footer (Glove-Ready Baustellen Buttons >= 44px) */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3.5 bg-gray-50/80 dark:bg-white/[0.03] border-t border-gray-200 dark:border-white/10">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleClearInModal}
                  disabled={isModalPadEmpty}
                  className="min-h-[44px] px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-rose-500/10 hover:border-rose-500/30 text-gray-700 dark:text-gray-300 hover:text-rose-500 text-xs font-semibold inline-flex items-center gap-2 disabled:opacity-30 transition-all active:scale-[0.98]"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Fläche leeren</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="min-h-[44px] px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 text-xs font-semibold inline-flex items-center gap-1.5 transition-all active:scale-[0.98]"
                >
                  <span>Abbrechen</span>
                </button>

                <button
                  type="button"
                  onClick={handleApplyModalSignature}
                  disabled={isModalPadEmpty}
                  className="min-h-[44px] px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-[0.98] text-white text-xs font-bold inline-flex items-center gap-2 shadow-md hover:shadow-lg disabled:opacity-40 transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>✓ Unterschrift übernehmen</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
