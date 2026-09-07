'use client';

import { useState, useCallback } from 'react';
import { ProjectList } from '@/components/projects/ProjectList';
import { NewProjectDialog } from '@/components/projects/NewProjectDialog';
import { NewBaustelleDialog } from '@/components/craft/NewBaustelleDialog';
import { Button } from '@/components/ui/button';
import { Columns3, List, Hammer, Plus } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ClientRecord } from '@/lib/pocketbase-types';

export function ProjectsPageClient({ initialClients }: { initialClients: ClientRecord[] }) {
  const [clients] = useState(initialClients);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isBaustelleModalOpen, setIsBaustelleModalOpen] = useState(false);

  const handleProjectCreated = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  return (
    <div className="p-6 md:p-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Projekte &amp; Baustellen</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Übersicht aller Bauvorhaben und Arbeitsbereiche mit Budget und Fortschritt
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setViewMode('grid')}
            title="Grid-Ansicht"
            className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-primary text-black shadow-lg shadow-teal-500/20' : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'}`}
          >
            <Columns3 size={16} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            title="Listen-Ansicht"
            className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-primary text-black shadow-lg shadow-teal-500/20' : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'}`}
          >
            <List size={16} />
          </button>
          <Button
            onClick={() => setIsBaustelleModalOpen(true)}
            className="bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs h-9 px-3.5 flex items-center gap-1.5 shadow-sm"
          >
            <Hammer size={14} />
            <span>Baustelle anlegen</span>
          </Button>
          <NewProjectDialog onProjectCreated={handleProjectCreated} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 bg-card/20 p-4 rounded-xl border border-border/50">
        {/* Bereich / Typ Filter (Baustellen vs. Agentur) */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Bereich:</span>
          <Select value={typeFilter} onValueChange={(val) => val && setTypeFilter(val)}>
            <SelectTrigger className="bg-background border-border h-9 min-w-[180px] text-foreground text-xs font-semibold">
              <SelectValue placeholder="Alle Bereiche">
                {(value: string) => {
                  if (value === 'all') return 'Alle Bereiche';
                  if (value === 'craft') return '🔨 Nur Baustellen (Handwerk)';
                  if (value === 'agency') return '💼 Nur Agentur & Tech';
                  return value;
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-background border-border text-foreground">
              <SelectItem value="all">Alle Bereiche</SelectItem>
              <SelectItem value="craft">🔨 Nur Baustellen (Handwerk)</SelectItem>
              <SelectItem value="agency">💼 Nur Agentur &amp; Tech</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {clients.length > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Kunde:</span>
            <Select value={clientFilter} onValueChange={(val) => val && setClientFilter(val)}>
              <SelectTrigger className="bg-background border-border h-9 min-w-[180px]">
                <SelectValue placeholder="Alle Kunden">
                  {(value: string) => {
                    if (value === 'all') return 'Alle Kunden';
                    const client = clients.find(c => c.id === value);
                    return client?.name || value;
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-background border-border text-foreground">
                <SelectItem value="all">Alle Kunden</SelectItem>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Status:</span>
          <Select value={statusFilter} onValueChange={(val) => val && setStatusFilter(val)}>
            <SelectTrigger className="bg-background border-border h-9 min-w-[180px] text-foreground">
              <SelectValue placeholder="Aktiv">
                {(value: string) => {
                  if (value === 'all') return 'Alle Status';
                  if (value === 'active') return 'Aktiv';
                  if (value === 'completed') return 'Abgeschlossen';
                  if (value === 'archived') return 'Archiviert';
                  return value;
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-background border-border text-foreground">
              <SelectItem value="all">Alle Status</SelectItem>
              <SelectItem value="active">Aktiv</SelectItem>
              <SelectItem value="completed">Abgeschlossen</SelectItem>
              <SelectItem value="archived">Archiviert</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <ProjectList
        refreshTrigger={refreshTrigger}
        viewMode={viewMode}
        clientFilter={clientFilter}
        statusFilter={statusFilter}
        typeFilter={typeFilter}
      />

      <NewBaustelleDialog
        open={isBaustelleModalOpen}
        onOpenChange={setIsBaustelleModalOpen}
        onBaustelleCreated={handleProjectCreated}
      />
    </div>
  );
}
