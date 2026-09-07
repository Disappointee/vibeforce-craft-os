'use client';

import { useEffect, useState } from 'react';
import { pb } from '@/lib/pocketbase';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, FolderGit2, MoreVertical, MapPin, Hammer } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { EditProjectDialog } from '@/components/projects/EditProjectDialog';
import { toast } from 'sonner';
import { revalidateProjectsPath, updateProjectAction } from '@/app/actions/projects';

export function ProjectList({
  refreshTrigger,
  viewMode = 'grid',
  clientFilter = 'all',
  statusFilter = 'active',
  typeFilter = 'all',
}: {
  refreshTrigger: number;
  viewMode?: 'grid' | 'list';
  clientFilter?: string;
  statusFilter?: string;
  typeFilter?: string;
}) {
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editProject, setEditProject] = useState<any | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const result = await pb.collection('projects').getList(1, 50, {
          expand: 'client',
        });
        const projectsData = result.items;

        const projectIds = projectsData.map((p: any) => p.id);
        if (projectIds.length > 0) {
          try {
            const tasksResult = await pb.collection('tasks').getList(1, 5000, {
              filter: projectIds.map((pid: string) => pb.filter('project = {:id}', { id: pid })).join(' || '),
              fields: 'id,project',
            });
            const taskIds = tasksResult.items.map((t: any) => t.id);

            if (taskIds.length > 0) {
              const allTEResult = await pb.collection('time_entries').getList(1, 10000, {
                filter: taskIds.map((tid: string) => pb.filter('task = {:id}', { id: tid })).join(' || '),
                fields: 'duration_minutes,task',
              });

              const taskProjectMap: Record<string, string> = {};
              for (const t of tasksResult.items) {
                taskProjectMap[t.id] = t.project;
              }

              const projectMinutes: Record<string, number> = {};
              for (const te of allTEResult.items) {
                const pid = taskProjectMap[(te as any).task];
                if (pid) {
                  projectMinutes[pid] = (projectMinutes[pid] || 0) + ((te as any).duration_minutes || 0);
                }
              }

              for (const p of projectsData) {
                (p as any)._workedHours = (projectMinutes[p.id] || 0) / 60;
              }
            }
          } catch { /* time_entries might not be available, show 0 */ }
        }

        setProjects(projectsData);
      } catch (error) {
        console.error('Failed to fetch projects:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, [refreshTrigger]);

  const handleEdit = (project: any) => {
    setEditProject(project);
    setEditDialogOpen(true);
  };

  const handleArchive = async (project: any) => {
    const newStatus = project.status === 'archived' ? 'active' : 'archived';
    const label = newStatus === 'archived' ? 'archiviert' : 'reaktiviert';

    try {
      await updateProjectAction(project.id, { status: newStatus });
      toast.success(`Projekt "${project.name}" ${label}!`);
      setProjects(prev => prev.map(p =>
        p.id === project.id ? { ...p, status: newStatus } : p
      ));
    } catch (error) {
      console.error(error);
      toast.error(`Fehler beim ${label} des Projekts.`);
    }
  };

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="border-border bg-card/30">
            <CardHeader className="space-y-2">
              <Skeleton className="h-4 w-1/3 bg-muted" />
              <Skeleton className="h-6 w-2/3 bg-muted" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-2 w-full bg-muted mb-4" />
              <Skeleton className="h-4 w-1/4 bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const filteredProjects = projects.filter((p: any) => {
    const matchesClient = clientFilter === 'all' || p.client === clientFilter;
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const isCraft = p.project_type === 'craft' || p.key?.startsWith('BAU') || p.key?.startsWith('CRAFT');
    const matchesType =
      typeFilter === 'all' ||
      (typeFilter === 'craft' && isCraft) ||
      (typeFilter === 'agency' && !isCraft);
    return matchesClient && matchesStatus && matchesType;
  });

  if (projects.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/20 p-12 flex flex-col items-center justify-center text-center">
        <FolderGit2 size={48} className="text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold text-foreground">Keine Projekte gefunden</h3>
        <p className="text-muted-foreground text-sm mt-2 max-w-md">
          Du hast noch keine Projekte erstellt. Klicke oben rechts auf "Neues Projekt", um deinen ersten Arbeitsbereich anzulegen.
        </p>
      </div>
    );
  }

  if (filteredProjects.length === 0) {
    if (typeFilter === 'craft') {
      return (
        <div className="rounded-2xl border border-dashed border-border bg-card/20 p-12 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 mb-3.5">
            <Hammer size={24} />
          </div>
          <h3 className="text-xl font-semibold text-foreground">Keine Baustellen gefunden</h3>
          <p className="text-muted-foreground text-sm mt-2 max-w-md">
            Für diesen Filter wurden keine Handwerks-Baustellen gefunden. Lege oben rechts über &quot;Baustelle anlegen&quot; deine nächste Baustelle an.
          </p>
        </div>
      );
    }
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/20 p-12 flex flex-col items-center justify-center text-center">
        <FolderGit2 size={48} className="text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold text-foreground">Keine Projekte mit Filter</h3>
        <p className="text-muted-foreground text-sm mt-2 max-w-md">
          Für den ausgewählten Filter wurden keine Projekte gefunden.
        </p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-500/10 text-emerald-400';
      case 'archived': return 'bg-zinc-500/10 text-muted-foreground';
      case 'completed': return 'bg-indigo-500/10 text-indigo-400';
      default: return 'bg-zinc-500/10 text-muted-foreground';
    }
  };

  const renderBudgetBar = (project: any) => {
    const workedHours = project._workedHours || 0;
    const budgetHours = project.budget_hours || 0;
    const percent = budgetHours > 0 ? Math.min(100, Math.round((workedHours / budgetHours) * 100)) : 0;
    const isOverBudget = budgetHours > 0 && workedHours > budgetHours;
    const isNearBudget = budgetHours > 0 && !isOverBudget && percent >= 80;

    return (
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground flex items-center gap-1">
            <Clock size={12} /> {workedHours.toFixed(1)} / {budgetHours || '?'} h
          </span>
          <span className={`font-mono font-bold ${isOverBudget ? 'text-red-400' : isNearBudget ? 'text-amber-400' : 'text-muted-foreground'}`}>
            {percent}%
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${isOverBudget ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : isNearBudget ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.4)]' : 'bg-primary'}`}
            style={{ width: `${Math.max(2, percent)}%` }}
          ></div>
        </div>
        {isOverBudget && (
          <span className="text-[10px] font-semibold text-red-400 flex items-center gap-1 mt-1">
            ⚠️ Budget-Überschreitung (+{(workedHours - budgetHours).toFixed(1)}h)
          </span>
        )}
        {isNearBudget && (
          <span className="text-[10px] font-semibold text-amber-400 flex items-center gap-1 mt-1">
            ⚠️ Budget zu {percent}% erschöpft
          </span>
        )}
      </div>
    );
  };

  const renderActions = (project: any) => (
    <div onClick={(e) => e.stopPropagation()} className="ml-2 shrink-0">
      <DropdownMenu>
        <DropdownMenuTrigger className="min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-accent">
          <MoreVertical size={18} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-background border-border text-foreground">
          <DropdownMenuItem
            className="hover:bg-card hover:text-foreground cursor-pointer"
            onClick={() => handleEdit(project)}
          >
            Bearbeiten
          </DropdownMenuItem>
          <DropdownMenuItem
            className={`cursor-pointer ${project.status === 'archived'
                ? 'text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300'
                : 'text-red-400 hover:bg-red-500/20 hover:text-red-300'
              }`}
            onClick={() => handleArchive(project)}
          >
            {project.status === 'archived' ? 'Reaktivieren' : 'Archivieren'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  const statusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Aktiv';
      case 'archived': return 'Archiviert';
      case 'completed': return 'Abgeschlossen';
      default: return status;
    }
  };

  return (
    <>
      {viewMode === 'grid' ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              onClick={() => router.push(`/projects/${project.id}`)}
              className="group cursor-pointer bg-card border border-border rounded-[10px] p-4 overflow-hidden hover:border-primary/30 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0 flex-1">
                  <span className="text-[11px] font-mono text-muted-foreground">{project.key}</span>
                  <h3 className="text-base font-semibold text-foreground truncate mt-0.5">{project.name}</h3>
                  {project.expand?.client && (
                    <span className="text-xs text-muted-foreground truncate block mt-0.5">
                      {project.expand.client.company || project.expand.client.name}
                    </span>
                  )}
                </div>
                {renderActions(project)}
              </div>

              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <span className={`inline-block rounded-full px-3 py-0.5 text-[11px] font-semibold uppercase ${getStatusColor(project.status)}`}>
                  {statusLabel(project.status)}
                </span>
                {(project.project_type === 'craft' || project.key?.startsWith('BAU') || project.key?.startsWith('CRAFT')) && (
                  <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                    🔨 Baustelle
                  </span>
                )}
                {project.trade && (
                  <span className="text-[10px] text-muted-foreground truncate">
                    {project.trade}
                  </span>
                )}
              </div>

              {project.site_address && (
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-3 truncate">
                  <MapPin size={11} className="text-amber-500 shrink-0" />
                  <span className="truncate">{project.site_address}</span>
                </div>
              )}

              {renderBudgetBar(project)}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card/30 overflow-hidden">
          {filteredProjects.map((project, idx) => (
            <div
              key={project.id}
              onClick={() => router.push(`/projects/${project.id}`)}
              className={`flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-accent/50 transition-colors ${
                idx < filteredProjects.length - 1 ? 'border-b border-border' : ''
              }`}
            >
              <span className="text-[10px] font-mono text-muted-foreground bg-background px-2 py-0.5 rounded shrink-0">
                {project.key}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-semibold text-foreground truncate">{project.name}</h3>
                  <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase shrink-0 ${getStatusColor(project.status)}`}>
                    {statusLabel(project.status)}
                  </span>
                  {(project.project_type === 'craft' || project.key?.startsWith('BAU') || project.key?.startsWith('CRAFT')) && (
                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 shrink-0">
                      🔨 Baustelle
                    </span>
                  )}
                </div>
                {project.expand?.client && (
                  <span className="text-xs text-muted-foreground truncate block mt-0.5">
                    {project.expand.client.company || project.expand.client.name}
                  </span>
                )}
                {project.site_address && (
                  <span className="text-[11px] text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                    <MapPin size={10} className="text-amber-500 shrink-0" />
                    {project.site_address}
                  </span>
                )}
              </div>
              <div className="w-32 shrink-0">
                {renderBudgetBar(project)}
              </div>
              {renderActions(project)}
            </div>
          ))}
        </div>
      )}

      <EditProjectDialog
        project={editProject}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onProjectUpdated={async () => {
          await revalidateProjectsPath();
        }}
      />
    </>
  );
}
