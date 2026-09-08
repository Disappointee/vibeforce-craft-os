'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus, Hammer } from 'lucide-react';
import { DailySiteReportForm } from './DailySiteReportForm';
import { NewBaustelleDialog } from './NewBaustelleDialog';
import type { ProjectRecord, SiteReportRecord } from '@/lib/pocketbase-types';

interface QuickCreateReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: ProjectRecord[];
  defaultProjectId?: string;
  onSuccess: (savedReport: SiteReportRecord) => void;
  onBaustelleCreated?: (baustelle: ProjectRecord) => void;
}

export function QuickCreateReportModal({
  isOpen,
  onClose,
  projects,
  defaultProjectId,
  onSuccess,
  onBaustelleCreated,
}: QuickCreateReportModalProps) {
  const [availableProjects, setAvailableProjects] = useState<ProjectRecord[]>(projects);
  const [projectId, setProjectId] = useState<string>(
    defaultProjectId || projects[0]?.id || ''
  );
  const [isBaustelleModalOpen, setIsBaustelleModalOpen] = useState(false);

  useEffect(() => {
    setAvailableProjects(projects);
    if (!projectId && projects[0]?.id) {
      setProjectId(projects[0].id);
    }
  }, [projects, projectId]);

  const handleBaustelleCreated = (newBaustelle: ProjectRecord) => {
    setAvailableProjects((prev) => [newBaustelle, ...prev]);
    setProjectId(newBaustelle.id);
    onBaustelleCreated?.(newBaustelle);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="w-[96vw] sm:w-[94vw] md:w-[92vw] lg:w-[90vw] max-w-[calc(100vw-1rem)] sm:max-w-2xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl max-h-[92vh] overflow-y-auto overflow-x-hidden p-3.5 sm:p-5 md:p-6 bg-card border-border">
          <DialogHeader className="pb-3 border-b border-border pr-8 sm:pr-10">
            <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2">
              <DialogTitle className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                <Hammer size={18} className="text-amber-500 shrink-0" />
                <span>Bautagesbericht erfassen</span>
              </DialogTitle>
              {availableProjects.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsBaustelleModalOpen(true)}
                  className="h-8 text-xs font-semibold border-amber-500/30 hover:bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0"
                >
                  <Plus size={13} className="mr-1" />
                  Neue Baustelle
                </Button>
              )}
            </div>

            {availableProjects.length > 0 && (
              <div className="pt-2">
                <label className="text-xs text-muted-foreground font-medium block mb-1">
                  Baustelle / Bauvorhaben:
                </label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  {availableProjects.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.key || 'BAU'}] {p.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </DialogHeader>

          {availableProjects.length === 0 ? (
            <div className="py-10 px-4 text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                <Hammer size={24} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-foreground">Noch keine Baustelle angelegt</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Um einen Bautagesbericht zu erfassen, lege jetzt direkt deine erste Baustelle mit Adresse und Bauherr an.
                </p>
              </div>
              <Button
                onClick={() => setIsBaustelleModalOpen(true)}
                className="bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs h-9 px-4"
              >
                <Plus size={15} className="mr-1.5" />
                Erste Baustelle anlegen
              </Button>
            </div>
          ) : projectId ? (
            <div className="pt-2 sm:pt-3">
              <DailySiteReportForm
                key={projectId}
                projectId={projectId}
                redirectTo={false}
                onSaved={(report) => {
                  onSuccess(report);
                  onClose();
                }}
                onCancel={onClose}
              />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Inline Baustelle Erfassungs-Modal */}
      <NewBaustelleDialog
        open={isBaustelleModalOpen}
        onOpenChange={setIsBaustelleModalOpen}
        onBaustelleCreated={handleBaustelleCreated}
      />
    </>
  );
}
