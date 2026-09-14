'use client';

import React, { useState, useRef } from 'react';
import { Camera, Upload, Trash2, ShieldCheck, MapPin, Clock } from 'lucide-react';
import { t } from '@/lib/i18n';

export interface EvidencePhotoItem {
  id: string;
  file?: File;
  previewUrl: string;
  caption: string;
  sha256_hash: string;
  taken_at: string;
  gps_lat?: number;
  gps_lon?: number;
}

interface EvidencePhotoUploadProps {
  initialItems?: EvidencePhotoItem[];
  onChange?: (items: EvidencePhotoItem[]) => void;
  readOnly?: boolean;
}

async function computeSha256(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function EvidencePhotoUpload({
  initialItems = [],
  onChange,
  readOnly = false,
}: EvidencePhotoUploadProps) {
  const [items, setItems] = useState<EvidencePhotoItem[]>(initialItems);
  const [isHashing, setIsHashing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsHashing(true);
    const newItems: EvidencePhotoItem[] = [];

    // Capture current GPS position if available
    let currentGps: { lat?: number; lon?: number } = {};
    try {
      if (navigator.geolocation) {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
        );
        currentGps = { lat: pos.coords.latitude, lon: pos.coords.longitude };
      }
    } catch {
      // Ignore GPS error on photo upload fallback
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const previewUrl = URL.createObjectURL(file);
      const sha256_hash = await computeSha256(file);
      const taken_at = new Date().toISOString();

      newItems.push({
        id: 'photo_' + Math.random().toString(36).substring(2, 9),
        file,
        previewUrl,
        caption: '',
        sha256_hash,
        taken_at,
        gps_lat: currentGps.lat,
        gps_lon: currentGps.lon,
      });
    }

    const updated = [...items, ...newItems];
    setItems(updated);
    onChange?.(updated);
    setIsHashing(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const updateCaption = (id: string, caption: string) => {
    const updated = items.map((it) => (it.id === id ? { ...it, caption } : it));
    setItems(updated);
    onChange?.(updated);
  };

  const removeItem = (id: string) => {
    const updated = items.filter((it) => it.id !== id);
    setItems(updated);
    onChange?.(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-teal-500" />
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            {t('craft.evidence.title')}
          </h3>
        </div>
        {!readOnly && (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isHashing}
              className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-[0.98] px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-all"
            >
              <Upload className="w-3.5 h-3.5" />
              {isHashing ? 'Wird signiert…' : t('craft.evidence.upload')}
            </button>
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 dark:border-white/10 p-8 text-center bg-gray-50/50 dark:bg-white/[0.01]">
          <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t('craft.evidence.no_items')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {items.map((it) => (
            <div
              key={it.id}
              className="group relative rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10 bg-white dark:bg-[#121824] shadow-sm flex flex-col"
            >
              <div className="relative aspect-video bg-black/5 overflow-hidden">
                <img
                  src={it.previewUrl}
                  alt={it.caption || 'Beweisfoto'}
                  className="w-full h-full object-cover"
                />
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => removeItem(it.id)}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white hover:bg-rose-600 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
                <input
                  type="text"
                  value={it.caption}
                  disabled={readOnly}
                  onChange={(e) => updateCaption(it.id, e.target.value)}
                  placeholder={t('craft.evidence.caption')}
                  className="w-full text-xs bg-transparent border border-gray-200 dark:border-white/10 rounded-lg px-2.5 py-1.5 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />

                <div className="space-y-1 pt-1 border-t border-gray-100 dark:border-white/5 text-[10px] text-gray-500 dark:text-gray-400 font-mono">
                  <div className="flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-500 shrink-0" />
                    <span className="truncate" title={it.sha256_hash}>
                      SHA-256: {it.sha256_hash.substring(0, 16)}…
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {new Date(it.taken_at).toLocaleTimeString('de-DE', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {it.gps_lat && it.gps_lon && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5 text-teal-500" />
                        {it.gps_lat.toFixed(4)}, {it.gps_lon.toFixed(4)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
