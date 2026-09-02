'use client';

import React, { useRef, useEffect, useState } from 'react';
import SignaturePadLib from 'signature_pad';
import { PenTool, Trash2, Check } from 'lucide-react';
import { t } from '@/lib/i18n';

interface SignaturePadProps {
  label: string;
  initialSignature?: string;
  onSave?: (dataUrl: string) => void;
  onClear?: () => void;
  readOnly?: boolean;
}

export function SignaturePad({
  label,
  initialSignature,
  onSave,
  onClear,
  readOnly = false,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const padRef = useRef<SignaturePadLib | null>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;

    // Handle high DPI displays
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    canvas.getContext('2d')?.scale(ratio, ratio);

    const pad = new SignaturePadLib(canvas, {
      backgroundColor: 'rgba(255, 255, 255, 0)',
      penColor: '#0f766e', // Teal 700
      minWidth: 1.5,
      maxWidth: 3.5,
    });

    if (initialSignature) {
      pad.fromDataURL(initialSignature);
      setIsEmpty(false);
    }

    if (readOnly) {
      pad.off();
    } else {
      pad.addEventListener('endStroke', () => {
        setIsEmpty(pad.isEmpty());
        if (!pad.isEmpty()) {
          onSave?.(pad.toDataURL('image/png'));
        }
      });
    }

    const resizeCanvas = () => {
      if (!canvas) return;
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      const prevData = !pad.isEmpty() ? pad.toDataURL() : null;
      canvas.width = canvas.offsetWidth * ratio;
      canvas.height = canvas.offsetHeight * ratio;
      canvas.getContext('2d')?.scale(ratio, ratio);
      pad.clear();
      if (prevData) {
        pad.fromDataURL(prevData);
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      resizeCanvas();
    });
    resizeObserver.observe(canvas);

    return () => {
      resizeObserver.disconnect();
      pad.off();
    };
  }, [initialSignature, readOnly, onSave]);

  const handleClear = () => {
    padRef.current?.clear();
    setIsEmpty(true);
    onClear?.();
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
          <PenTool className="w-3.5 h-3.5 text-teal-500" />
          {label}
        </label>
        {!readOnly && (
          <button
            type="button"
            onClick={handleClear}
            disabled={isEmpty}
            className="inline-flex items-center gap-1 text-xs text-rose-500 hover:text-rose-600 disabled:opacity-30 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {t('craft.site_report.clear_signature')}
          </button>
        )}
      </div>

      <div className="relative w-full h-36 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-[#0c1017] shadow-inner overflow-hidden flex items-center justify-center">
        <canvas
          ref={canvasRef}
          className="w-full h-full touch-none cursor-crosshair"
        />
        {isEmpty && !readOnly && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-xs text-gray-400">
            Hier mit Finger oder Stift unterschreiben
          </div>
        )}
      </div>
    </div>
  );
}
