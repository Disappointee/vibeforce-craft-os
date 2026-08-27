'use client';

import { useState, useCallback } from 'react';
import { ProjectList } from '@/components/projects/ProjectList';
import { NewProjectDialog } from '@/components/projects/NewProjectDialog';
import { Columns3, List } from 'lucide-react';
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

  const handleProjectCreated = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  return (
    <div className="p-6 md:p-8 space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Projekte</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Übersicht aller Projekte mit Budget und Fortschritt
          </p>
        </div>
        <div className="flex items-center gap-2">
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
          <NewProjectDialog onProjectCreated={handleProjectCreated} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 bg-card/20 p-4 rounded-xl border border-border/50">
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

      <ProjectList refreshTrigger={refreshTrigger} viewMode={viewMode} clientFilter={clientFilter} statusFilter={statusFilter} />
    </div>
  );
}
