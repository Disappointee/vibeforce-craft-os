'use client';

import { useEffect } from 'react';
import { X, MapPin, Play } from 'lucide-react';
import { t } from '@/lib/i18n';

interface GeofenceCheckinPromptProps {
  isOpen: boolean;
  projectName: string;
  projectId: string;
  onStartTimer: (projectId: string) => void;
  onDismiss: () => void;
}

export function GeofenceCheckinPrompt({
  isOpen,
  projectName,
  projectId,
  onStartTimer,
  onDismiss,
}: GeofenceCheckinPromptProps) {
  useEffect(() => {
    if (isOpen) {
      const firstButton = document.getElementById('geofence-start-btn');
      firstButton?.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const rawMessage = t('craft.geofence.prompt_message');
  const formattedMessage = rawMessage.replace('{project}', projectName);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#121824] border border-gray-200 dark:border-white/10 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/10 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center">
              <MapPin className="h-5 w-5" />
            </div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              {t('craft.geofence.prompt_title')}
            </h2>
          </div>
          <button
            onClick={onDismiss}
            className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
            aria-label={t('craft.geofence.prompt_dismiss')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
            {formattedMessage}
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-100 dark:border-white/10 px-6 py-4 bg-gray-50/50 dark:bg-black/20">
          <button
            onClick={onDismiss}
            className="rounded-xl px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
          >
            {t('craft.geofence.prompt_dismiss')}
          </button>
          <button
            id="geofence-start-btn"
            onClick={() => onStartTimer(projectId)}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-[0.98] px-5 py-2.5 text-sm font-semibold text-black shadow-lg shadow-amber-500/20 transition-all focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <Play className="h-4 w-4 fill-current" />
            {t('craft.geofence.prompt_start')}
          </button>
        </div>
      </div>
    </div>
  );
}
