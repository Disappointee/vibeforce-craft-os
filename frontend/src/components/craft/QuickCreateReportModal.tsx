'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DailySiteReportForm } from './DailySiteReportForm';
import type { ProjectRecord, SiteReportRecord } from '@/lib/pocketbase-types';

interface QuickCreateReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: ProjectRecord[];
  defaultProjectId?: string;
  onSuccess: (savedReport: SiteReportRecord) => void;
}

export function QuickCreateReportModal({
  isOpen,
  onClose,
  projects,
  defaultProjectId,
  onSuccess,
}: QuickCreateReportModalProps) {
  const [projectId, setProjectId] = useState<string>(
    defaultProjectId || projects[0]?.id || ''
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 bg-card border-border">
        <DialogHeader className="pb-3 border-b border-border">
          <DialogTitle className="text-lg font-bold text-foreground">
            Bautagesbericht erfassen
          </DialogTitle>
          {projects.length > 0 && (
            <div className="pt-2">
              <label className="text-xs text-muted-foreground font-medium block mb-1">
                Baustelle / Projekt:
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.key || 'BAU'}] {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </DialogHeader>

        {projects.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground">
            Keine Baustellen vorhanden. Bitte lege zuerst ein Projekt an.
          </div>
        ) : projectId ? (
          <div className="pt-3">
            <DailySiteReportForm
              key={projectId}
              projectId={projectId}
              redirectTo={false}
              onSaved={(report) => {
                onSuccess(report);
                onClose();
              }}
            />
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
