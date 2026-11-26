'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { pb } from '@/lib/pocketbase';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ProjectList } from '@/components/projects/ProjectList';
import { NewProjectDialog } from '@/components/projects/NewProjectDialog';
import { EditProjectDialog } from '@/components/projects/EditProjectDialog';
import { ProjectRecord, ClientRecord } from '@/lib/pocketbase-types';
import { Plus, Filter, Building2, ChevronDown, Search, X, LayoutDashboard, FolderGit2 } from 'lucide-react';
import { toast } from 'sonner';
import { t } from '@/lib/i18n';
import { isCraftMode } from '@/config/app-mode';
import { filterProjectsByMode, filterClientsByMode } from '@/lib/data-isolation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

export function ProjectsPageClient({
  initialClients,
}: {
  initialClients: ClientRecord[];
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const craft = isCraftMode();
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [clients] = useState(initialClients);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editProject, setEditProject] = useState<Pick<ProjectRecord, 'id' | 'name' | 'key' | 'budget_hours' | 'client' | 'start_date' | 'due_date'> & { status: string } | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const visibleClients = useMemo(() => {
    return filterClientsByMode(clients);
  }, [clients]);

  useEffect(() => {
    const fetchAllProjects = async () => {
      setIsLoading(true);
      try {
        const result = await pb.collection('projects').getList(1, 100, {
          sort: '-created',
          expand: 'client',
        });
        const modeFiltered = filterProjectsByMode(result.items as ProjectRecord[]);
        setProjects(modeFiltered);
      } catch (error) {
        console.error('Failed to fetch projects:', error);
        toast.error('Fehler beim Laden der Projekte');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllProjects();
  }, [refreshTrigger, craft]);

  useEffect(() => {
    const handleUpdate = () => setRefreshTrigger(prev => prev + 1);
    window.addEventListener('project-updated', handleUpdate);
    return () => {
      window.removeEventListener('project-updated', handleUpdate);
    };
  }, []);

  const filteredProjects = projects
    .filter(project =>
      !searchQuery ||
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.key?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .filter(project => statusFilter === 'active' || project.status === statusFilter)
    .filter(project => {
      if (clientFilter === 'all') return true;
      return (project as any).client === clientFilter;
    });

  const activeFilterCount = [
    statusFilter !== 'active',
    clientFilter !== 'all',
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setStatusFilter('active');
    setClientFilter('all');
    setSearchQuery('');
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-8">

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
              <FolderGit2 size={32} className="text-indigo-400" />
              Projekte
            </h1>
            <p className="text-muted-foreground mt-1">Alle Projekte und Baustellen im Überblick.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input
                placeholder="Projekte durchsuchen…"
                className="pl-10 bg-card border-border w-full md:w-[240px] lg:w-[300px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <button
              onClick={() => setCreateDialogOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shrink-0"
            >
              <Plus size={16} />
              <span className="hidden sm:inline text-sm font-medium">Neues Projekt</span>
            </button>

            <Badge
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="bg-card border-border py-1.5 px-3 flex items-center gap-2 cursor-pointer hover:bg-muted transition-colors relative shrink-0"
            >
              <Filter size={14} /> Filter
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-indigo-500 text-[10px] font-bold text-white flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </Badge>
          </div>
        </div>

        {/* Active Filter Pills Bar */}
        {(activeFilterCount > 0 || !!searchQuery) && (
          <div className="flex flex-wrap items-center gap-2 pt-1 animate-in fade-in duration-200">
            <span className="text-xs text-muted-foreground font-medium mr-1">Aktive Filter:</span>

            {searchQuery && (
              <Badge variant="secondary" className="bg-card border border-border text-foreground px-2.5 py-1 flex items-center gap-1.5 text-xs font-medium">
                Suche: "{searchQuery}"
                <button onClick={() => setSearchQuery('')} className="text-muted-foreground hover:text-foreground">
                  <X size={12} />
                </button>
              </Badge>
            )}

            {statusFilter !== 'active' && (
              <Badge variant="secondary" className="bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 px-2.5 py-1 flex items-center gap-1.5 text-xs font-medium">
                Status: {statusFilter === 'archived' ? 'Archiviert' : statusFilter === 'completed' ? 'Abgeschlossen' : statusFilter}
                <button onClick={() => setStatusFilter('active')} className="text-indigo-400 hover:text-white">
                  <X size={12} />
                </button>
              </Badge>
            )}

            {clientFilter !== 'all' && (
              <Badge variant="secondary" className="bg-blue-500/10 border border-blue-500/30 text-blue-400 px-2.5 py-1 flex items-center gap-1.5 text-xs font-medium">
                Kunde: {visibleClients.find(c => c.id === clientFilter)?.name || 'Kunde'}
                <button onClick={() => setClientFilter('all')} className="text-blue-400 hover:text-white">
                  <X size={12} />
                </button>
              </Badge>
            )}

            <button
              onClick={clearAllFilters}
              className="text-xs text-muted-foreground hover:text-red-400 transition-colors underline ml-2 cursor-pointer"
            >
              Alle Filter zurücksetzen
            </button>
          </div>
        )}

        {showFilters && (
          <div className="flex flex-wrap gap-3 items-center p-4 rounded-xl border border-border bg-card/40">
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium block">Status</label>
              <Select value={statusFilter} onValueChange={(val) => val && setStatusFilter(val)}>
                <SelectTrigger className="bg-background border-border h-9 min-w-[130px]">
                  <SelectValue>
                    {(value: string) => (
                      {active: 'Aktiv', archived: 'Archiviert', completed: 'Abgeschlossen', all: 'Alle'}[value] || value
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-background border-border text-foreground">
                  <SelectItem value="active">Aktiv</SelectItem>
                  <SelectItem value="archived">Archiviert</SelectItem>
                  <SelectItem value="completed">Abgeschlossen</SelectItem>
                  <SelectItem value="all">Alle</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium block">Kunde</label>
              <Select value={clientFilter} onValueChange={(val) => val && setClientFilter(val)}>
                <SelectTrigger className="bg-background border-border h-9 min-w-[150px]">
                  <SelectValue placeholder="Alle Kunden">
                    {(value: string) => {
                      if (value === 'all') return 'Alle Kunden';
                      const client = visibleClients.find(c => c.id === value);
                      return client?.name || value;
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-background border-border text-foreground">
                  <SelectItem value="all">Alle Kunden</SelectItem>
                  {visibleClients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {activeFilterCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="self-end p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/50"
                title="Filter zurücksetzen"
              >
                <X size={16} />
              </button>
            )}
          </div>
        )}

        {isLoading ? (
          <Card className="border-border bg-card/30">
            <CardContent className="p-0">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 bg-muted rounded-xl" />
              ))}
            </CardContent>
          </Card>
        ) : filteredProjects.length === 0 ? (
          <Card className="border-dashed border-border bg-card/20">
            <CardContent className="p-16 flex flex-col items-center justify-center text-center">
              <FolderGit2 size={48} className="text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold text-foreground">Keine Projekte gefunden</h3>
              <p className="text-muted-foreground text-sm mt-2 max-w-md">
                Es wurden keine Projekte gefunden, die deiner Suche entsprechen.
              </p>
              {activeFilterCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="mt-4 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Filter zurücksetzen
                </button>
              )}
            </CardContent>
          </Card>
        ) : (
          <ProjectList
            refreshTrigger={refreshTrigger}
            projects={filteredProjects}
          />
        )}
      </div>

      <NewProjectDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onProjectCreated={() => setRefreshTrigger(r => r + 1)}
      />
      <EditProjectDialog
        project={editProject}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onProjectUpdated={async () => {
          setRefreshTrigger(prev => prev + 1);
        }}
      />
    </div>
  );
}