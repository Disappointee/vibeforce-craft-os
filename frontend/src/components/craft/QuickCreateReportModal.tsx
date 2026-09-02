'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
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
          <div className="py-8 px-4 text-center space-y-4">
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Es ist noch keine Baustelle angelegt. Um einen Bautagesbericht zu erfassen, lege bitte zuerst ein Projekt an.
            </p>
            <Link href="/projects" onClick={onClose}>
              <Button className="bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs h-9 px-4">
                <Plus size={15} className="mr-1.5" />
                Erste Baustelle anlegen
              </Button>
            </Link>
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
