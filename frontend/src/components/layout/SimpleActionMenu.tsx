'use client';

import { useEffect, useState } from 'react';
import { Zap, Plus, Clock, Building2, X, Loader2, Search, FolderGit2, Hammer, FileText } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useUiStore, useTimerStore } from '@/lib/store';
import { pb } from '@/lib/pocketbase';
import { toast } from 'sonner';
import { NewSimpleTaskDialog } from '@/components/tasks/NewSimpleTaskDialog';
import { NewClientDialog } from '@/components/clients/NewClientDialog';
import { NewProjectDialog } from '@/components/projects/NewProjectDialog';
import { NewBaustelleDialog } from '@/components/craft/NewBaustelleDialog';
import { NewCraftClientDialog } from '@/components/craft/NewCraftClientDialog';
import { Input } from '@/components/ui/input';
import { revalidateClientsPath } from '@/app/actions/clients';
import { revalidateProjectsPath } from '@/app/actions/projects';

interface TaskOption {
  id: string;
  title: string;
  projectKey: string;
  projectName: string;
  projectId: string;
  clientName?: string;
}

export function SimpleActionMenu() {
  const { actionMenuOpen: open, setActionMenuOpen: setOpen, taskDialogOpen, clientDialogOpen, projectDialogOpen, setTaskDialogOpen, setClientDialogOpen, setProjectDialogOpen } = useUiStore();
  const { startTimer } = useTimerStore();
  const router = useRouter();
  const pathname = usePathname();
  const isCraftContext = pathname?.startsWith('/craft') || pathname?.includes('/site-reports') || pathname?.includes('/geofence');

  const [baustelleDialogOpen, setBaustelleDialogOpen] = useState(false);
  const [craftClientDialogOpen, setCraftClientDialogOpen] = useState(false);
  const [showTimerSearch, setShowTimerSearch] = useState(false);
  const [timerTasks, setTimerTasks] = useState<TaskOption[]>([]);
  const [timerSearchQuery, setTimerSearchQuery] = useState('');
  const [timerTasksLoading, setTimerTasksLoading] = useState(false);

  useEffect(() => {
    if (!showTimerSearch) return;
    const fetchTasks = async () => {
      setTimerTasksLoading(true);
      try {
        const result = await pb.collection('tasks').getList(1, 100, {
          sort: '-created',
          expand: 'project,project.client',
          filter: pb.filter("status != {:status}", { status: 'done' }),
        });
        setTimerTasks(result.items.map((task: any) => {
          const project = task.expand?.project;
          const client = project?.expand?.client;
          return {
            id: task.id,
            title: task.title,
            projectKey: project?.key || '—',
            projectName: project?.name || 'Unbekanntes Projekt',
            projectId: project?.id || task.project,
            clientName: client?.name || client?.company || undefined,
          };
        }));
      } catch {
        toast.error('Aufgaben konnten nicht geladen werden');
      } finally {
        setTimerTasksLoading(false);
      }
    };
    fetchTasks();
  }, [showTimerSearch]);

  useEffect(() => {
    if (!open) {
      setShowTimerSearch(false);
      setTimerSearchQuery('');
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showTimerSearch) {
          setShowTimerSearch(false);
        } else {
          setOpen(false);
        }
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, setOpen, showTimerSearch]);

  const filteredTimerTasks = timerTasks.filter(t =>
    t.title.toLowerCase().includes(timerSearchQuery.toLowerCase()) ||
    t.projectKey.toLowerCase().includes(timerSearchQuery.toLowerCase())
  );

  const handleStartTimer = async (task: TaskOption) => {
    try {
      await startTimer(task.id, task.title);
      toast.success(`Timer gestartet: ${task.title}`);
      setOpen(false);
    } catch {
      toast.error('Timer konnte nicht gestartet werden');
    }
  };

  const actions = isCraftContext
    ? [
        {
          icon: <Hammer size={20} />,
          iconClass: 'text-amber-500 bg-amber-500/10',
          label: 'Neue Baustelle anlegen',
          description: 'Bauvorhaben mit Adresse, Gewerk & VOB erfassen',
          onClick: () => {
            setOpen(false);
            setBaustelleDialogOpen(true);
          },
        },
        {
          icon: <FileText size={20} />,
          iconClass: 'text-emerald-500 bg-emerald-500/10',
          label: 'Bautagesbericht erfassen',
          description: 'Tagesbericht, Wetter & Kolonnenstunden erfassen',
          onClick: () => {
            setOpen(false);
            router.push('/craft');
          },
        },
        {
          icon: <Clock size={20} />,
          iconClass: 'text-primary bg-primary/10',
          label: 'Zeiterfassung starten',
          description: 'Wähle ein Gewerk und starte den Timer sofort',
          onClick: () => {
            setShowTimerSearch(true);
            setTimerSearchQuery('');
          },
        },
        {
          icon: <Building2 size={20} />,
          iconClass: 'text-blue-500 bg-blue-500/10',
          label: 'Neuen Auftraggeber / Bauherr anlegen',
          description: 'Bauherrn mit Anschrift & § 48b EStG anlegen',
          onClick: () => {
            setOpen(false);
            setCraftClientDialogOpen(true);
          },
        },
      ]
    : [
        {
          icon: <Plus size={20} />,
          iconClass: 'text-indigo-500 bg-indigo-500/10',
          label: 'Neue Aufgabe erstellen',
          description: 'Lege eine neue Aufgabe in einem Projekt an',
          onClick: () => {
            setOpen(false);
            setTaskDialogOpen(true);
          },
        },
        {
          icon: <FolderGit2 size={20} />,
          iconClass: 'text-rose-500 bg-rose-500/10',
          label: 'Neues Projekt anlegen',
          description: 'Erstelle einen neuen Arbeitsbereich',
          onClick: () => {
            setOpen(false);
            setProjectDialogOpen(true);
          },
        },
        {
          icon: <Clock size={20} />,
          iconClass: 'text-primary bg-primary/10',
          label: 'Zeiterfassung starten',
          description: 'Wähle eine Aufgabe und starte den Timer sofort',
          onClick: () => {
            setShowTimerSearch(true);
            setTimerSearchQuery('');
          },
        },
        {
          icon: <Building2 size={20} />,
          iconClass: 'text-blue-500 bg-blue-500/10',
          label: 'Neuen Kunden anlegen',
          description: 'Erstelle einen neuen Kunden-Eintrag',
          onClick: () => {
            setOpen(false);
            setClientDialogOpen(true);
          },
        },
      ];

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150"
          onClick={() => {
            if (showTimerSearch) {
              setShowTimerSearch(false);
            } else {
              setOpen(false);
            }
          }}
        >
          <div
            className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
                  <Zap size={18} />
                </div>
                <h2 className="text-base font-semibold text-foreground">
                  {showTimerSearch ? 'Aufgabe wählen & Timer starten' : 'Schnellzugriff-Aktionen'}
                </h2>
              </div>
              <button
                onClick={() => {
                  if (showTimerSearch) {
                    setShowTimerSearch(false);
                  } else {
                    setOpen(false);
                  }
                }}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {showTimerSearch ? (
              <div className="p-3">
                <div className="relative mb-2">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Aufgabe suchen..."
                    value={timerSearchQuery}
                    onChange={(e) => setTimerSearchQuery(e.target.value)}
                    className="pl-9 bg-background border-border text-sm rounded-xl h-10"
                    autoFocus
                  />
                </div>
                <div className="max-h-64 overflow-y-auto space-y-0.5">
                  {timerTasksLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : filteredTimerTasks.length === 0 ? (
                    <div className="px-3 py-8 text-center text-sm text-muted-foreground italic">
                      {timerSearchQuery ? 'Keine passenden Aufgaben gefunden' : 'Keine offenen Aufgaben verfügbar'}
                    </div>
                  ) : (
                    filteredTimerTasks.map((task) => (
                      <button
                        key={task.id}
                        onClick={() => handleStartTimer(task)}
                        className="w-full text-left px-4 py-3 rounded-xl text-sm transition-all hover:bg-accent flex items-center gap-3 group"
                      >
                        <div className="p-1.5 rounded-lg bg-primary/10 text-primary shrink-0">
                          <Clock size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold tracking-wider text-primary/70 bg-primary/5 border border-primary/10 px-2 py-0.5 rounded-md shrink-0">
                              {task.projectKey}
                            </span>
                            <span className="font-medium text-foreground truncate">{task.title}</span>
                          </div>
                          {task.clientName && (
                            <p className="text-[10px] text-muted-foreground mt-0.5 ml-7">
                              {task.clientName} · {task.projectName}
                            </p>
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
                <button
                  onClick={() => setShowTimerSearch(false)}
                  className="w-full mt-2 text-xs text-muted-foreground hover:text-foreground py-2 transition-colors"
                >
                  ← Zurück zu den Aktionen
                </button>
              </div>
            ) : (
              <div className="p-3 space-y-1.5">
                {actions.map((action, idx) => (
                  <button
                    key={idx}
                    onClick={action.onClick}
                    className="flex w-full items-center gap-4 px-4 py-3 rounded-xl hover:bg-accent transition-colors text-left group"
                  >
                    <div className={`p-2 rounded-lg shrink-0 ${action.iconClass}`}>
                      {action.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground group-hover:text-foreground">
                        {action.label}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {action.description}
                      </p>
                    </div>
                  </button>
                ))}


              </div>
            )}
          </div>
        </div>
      )}

      <NewSimpleTaskDialog
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        onTaskCreated={() => {
          router.refresh();
        }}
      />

      <NewClientDialog
        open={clientDialogOpen}
        onOpenChange={setClientDialogOpen}
        onClientCreated={async () => {
          await revalidateClientsPath();
          router.refresh();
        }}
      />

      <NewProjectDialog
        open={projectDialogOpen}
        onOpenChange={setProjectDialogOpen}
        onProjectCreated={async () => {
          await revalidateProjectsPath();
          router.refresh();
        }}
      />

      <NewBaustelleDialog
        open={baustelleDialogOpen}
        onOpenChange={setBaustelleDialogOpen}
        onBaustelleCreated={() => {
          router.refresh();
        }}
      />

      <NewCraftClientDialog
        open={craftClientDialogOpen}
        onOpenChange={setCraftClientDialogOpen}
        onClientCreated={() => {
          router.refresh();
        }}
      />
    </>
  );
}
