'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { pb } from '@/lib/pocketbase';
import { Users, Mail, Clock, MoreVertical, AlertCircle, Activity, Edit3, ListTodo, Save, Loader2, Plus, Trash2, ExternalLink, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import type { UserRecord, TaskRecord, TimeEntryRecord, UserRole, TeamRecord, TeamMemberRecord } from '@/lib/pocketbase-types';
import { ROLE_LABELS } from '@/lib/i18n';
import { updateUserSupervisor, updateUserRole } from '@/app/actions/admin-users';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getUserDisplayName, getUserInitials } from '@/lib/user-utils';

const EXPERTISE_OPTIONS = [
  { value: 'sea', label: 'SEA' },
  { value: 'social_ads', label: 'Social Ads' },
  { value: 'tracking', label: 'Tracking' },
  { value: 'seo', label: 'SEO' },
  { value: 'content', label: 'Content' },
  { value: 'design', label: 'Design' },
  { value: 'development', label: 'Entwicklung' },
  { value: 'consulting', label: 'Beratung' },
  { value: 'other', label: 'Sonstiges' },
];

interface UserWorkload {
  user: UserRecord;
  totalBudgetedHours: number;
  totalLoggedHours: number;
  workloadPercentage: number;
  taskCount: number;
}

function getWorkloadColor(percentage: number): string {
  if (percentage < 50) return 'bg-emerald-500';
  if (percentage <= 80) return 'bg-amber-500';
  return 'bg-red-500';
}

function getWorkloadTextColor(percentage: number): string {
  if (percentage < 50) return 'text-emerald-400';
  if (percentage <= 80) return 'text-amber-400';
  return 'text-red-400';
}

export default function TeamPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') === 'teams' ? 'teams' : 'workloads';
  const [workloads, setWorkloads] = useState<UserWorkload[]>([]);
  const [allTasks, setAllTasks] = useState<TaskRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [teamScope, setTeamScope] = useState<'all' | 'my_team'>('all');
  
  // Teams states
  const [teams, setTeams] = useState<TeamRecord[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMemberRecord[]>([]);
  
  // Team dialog states
  const [isTeamDialogOpen, setIsTeamDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<TeamRecord | null>(null);
  const [teamName, setTeamName] = useState('');
  const [teamDescription, setTeamDescription] = useState('');
  const [teamLeadId, setTeamLeadId] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [isSavingTeam, setIsSavingTeam] = useState(false);
  
  // Team deletion confirmation states
  const [teamToDelete, setTeamToDelete] = useState<TeamRecord | null>(null);
  const [isDeletingTeam, setIsDeletingTeam] = useState(false);
  
  // Edit profile dialog states
  const [selectedUser, setSelectedUser] = useState<UserWorkload | null>(null);
  const [editName, setEditName] = useState('');
  const [editWeeklyHours, setEditWeeklyHours] = useState(40);
  const [editExpertise, setEditExpertise] = useState<string[]>([]);
  const [editRole, setEditRole] = useState('employee');
  const [editSupervisor, setEditSupervisor] = useState<string>('none');
  const [isSaving, setIsSaving] = useState(false);

  const currentUser = pb.authStore.record as unknown as UserRecord | null;

  useEffect(() => {
    if (selectedUser) {
      setEditName(selectedUser.user.name || '');
      setEditWeeklyHours(Number(selectedUser.user.weekly_hours_target) || 40);
      setEditExpertise(selectedUser.user.expertise || []);
      setEditRole(selectedUser.user.role || 'employee');
      setEditSupervisor(selectedUser.user.supervisor || 'none');
    }
  }, [selectedUser]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setIsSaving(true);
    try {
      const updateData: Record<string, unknown> = {
        name: editName,
        weekly_hours_target: editWeeklyHours,
        expertise: editExpertise,
        supervisor: editSupervisor === 'none' ? null : editSupervisor,
      };

      if (currentUser?.role === 'admin') {
        updateData.role = editRole;
      }

      await pb.collection('users').update(selectedUser.user.id, updateData);

      setWorkloads(prev => prev.map(w => {
        if (w.user.id === selectedUser.user.id) {
          return {
            ...w,
            user: {
              ...w.user,
              name: editName,
              weekly_hours_target: editWeeklyHours,
              expertise: editExpertise,
              supervisor: editSupervisor === 'none' ? undefined : editSupervisor,
              role: currentUser?.role === 'admin' ? (editRole as UserRole) : w.user.role,
            }
          };
        }
        return w;
      }));

      setSelectedUser(null);
      toast.success('Mitarbeiterdaten erfolgreich aktualisiert');
    } catch (error: unknown) {
      console.error('Failed to update user profile:', error);
      const msg = error instanceof Error ? error.message : 'Profil konnte nicht aktualisiert werden';
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleExpertise = async (userId: string, value: string, currentExpertise: string[]) => {
    const updatedExpertise = currentExpertise.includes(value)
      ? currentExpertise.filter(v => v !== value)
      : [...currentExpertise, value];

    try {
      await pb.collection('users').update(userId, {
        expertise: updatedExpertise,
      });
      setWorkloads(prev => prev.map(w => {
        if (w.user.id === userId) {
          return {
            ...w,
            user: {
              ...w.user,
              expertise: updatedExpertise
            }
          };
        }
        return w;
      }));
      toast.success('Expertise erfolgreich aktualisiert');
    } catch (error) {
      console.error('Failed to update expertise:', error);
      toast.error('Expertise konnte nicht aktualisiert werden');
    }
  };

  const handleSetWeeklyHours = async (userId: string, hours: number) => {
    try {
      await pb.collection('users').update(userId, {
        weekly_hours_target: hours,
      });
      setWorkloads(prev => prev.map(w => {
        if (w.user.id === userId) {
          return {
            ...w,
            user: {
              ...w.user,
              weekly_hours_target: hours
            }
          };
        }
        return w;
      }));
      toast.success('Stundenziel erfolgreich aktualisiert');
    } catch (error) {
      console.error('Failed to update weekly hours target:', error);
      toast.error('Stundenziel konnte nicht aktualisiert werden');
    }
  };

  const fetchWorkloadData = async (showSkeleton = false) => {
    if (showSkeleton) setIsLoading(true);
    let users: UserRecord[] = [];
    let tasks: TaskRecord[] = [];
    let timeEntries: TimeEntryRecord[] = [];
    let teamsList: TeamRecord[] = [];
    let teamMembersList: TeamMemberRecord[] = [];

    // Fetch users
    try {
      const userResult = await pb.collection('users').getList<UserRecord>(1, 100, {
        sort: 'created',
        expand: 'supervisor',
      });
      users = userResult.items;
    } catch (err) {
      console.error('[Team] Failed to fetch users:', err);
    }

    // Fetch tasks
    try {
      const taskResult = await pb.collection('tasks').getList<TaskRecord>(1, 200, {
        expand: 'assignees,project',
        filter: "status != 'done'",
        sort: '-created',
      });
      tasks = taskResult.items;
    } catch (err) {
      console.error('[Team] Failed to fetch tasks:', err);
    }

    // Fetch time entries (letzter Monat für Workload-Berechnung)
    try {
      const timeResult = await pb.collection('time_entries').getList<TimeEntryRecord>(1, 500, {
        sort: '-created',
      });
      timeEntries = timeResult.items;
    } catch (err) {
      console.error('[Team] Failed to fetch time entries:', err);
    }

    // Fetch teams
    try {
      const teamsResult = await pb.collection('teams').getFullList<TeamRecord>({
        sort: 'name',
        expand: 'lead',
      });
      teamsList = teamsResult;
    } catch (err) {
      console.warn('[Team] Teams collection might be empty or not yet created:', err);
    }

    // Fetch team members
    try {
      const membersResult = await pb.collection('team_members').getFullList<TeamMemberRecord>({
        expand: 'user',
      });
      teamMembersList = membersResult;
    } catch (err) {
      console.warn('[Team] Team members collection optional load:', err);
    }

    try {
      const loggedHoursMap = new Map<string, number>();
      for (const entry of timeEntries) {
        const userId = entry.user;
        if (!userId) continue;
        const minutes = Number(entry.duration_minutes) || 0;
        const hours = minutes / 60;
        loggedHoursMap.set(userId, (loggedHoursMap.get(userId) || 0) + hours);
      }

      const budgetedHoursMap = new Map<string, number>();
      const taskCountMap = new Map<string, number>();

      for (const task of tasks) {
        const assignees = Array.isArray(task.expand?.assignees) ? task.expand.assignees : [];
        const estimatedHours = Number(task.estimated_hours) || 0;

        for (const assignee of assignees) {
          if (!assignee?.id) continue;
          const userId = assignee.id;
          budgetedHoursMap.set(userId, (budgetedHoursMap.get(userId) || 0) + estimatedHours);
          taskCountMap.set(userId, (taskCountMap.get(userId) || 0) + 1);
        }
      }

      const calculatedWorkloads: UserWorkload[] = users.map((user) => {
        const totalBudgetedHours = budgetedHoursMap.get(user.id) || 0;
        const totalLoggedHours = loggedHoursMap.get(user.id) || 0;
        const taskCount = taskCountMap.get(user.id) || 0;

        const targetCapacity = user.weekly_hours_target || 40;
        const workloadPercentage = Math.min(
          150,
          Math.round((totalLoggedHours / targetCapacity) * 100)
        );

        return {
          user,
          totalBudgetedHours,
          totalLoggedHours,
          workloadPercentage,
          taskCount,
        };
      });

      setWorkloads(calculatedWorkloads);
      setAllTasks(tasks);
      setTeams(teamsList);
      setTeamMembers(teamMembersList);
    } catch (err) {
      console.error('[Team] Workload computation failed:', err);
    }

    if (showSkeleton) setIsLoading(false);
  };

  useEffect(() => {
    fetchWorkloadData(true);
  }, []);

  const handleOpenCreateTeam = () => {
    setEditingTeam(null);
    setTeamName('');
    setTeamDescription('');
    setTeamLeadId('');
    setSelectedMemberIds([]);
    setIsTeamDialogOpen(true);
  };

  const handleOpenEditTeam = (team: TeamRecord) => {
    setEditingTeam(team);
    setTeamName(team.name || '');
    setTeamDescription(team.description || '');
    setTeamLeadId(team.lead || '');
    
    const members = teamMembers.filter(m => m.team === team.id).map(m => m.user);
    setSelectedMemberIds(members);
    
    setIsTeamDialogOpen(true);
  };

  const handleSaveTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) {
      toast.error('Teamname ist erforderlich');
      return;
    }
    setIsSavingTeam(true);

    try {
      const finalLeadId = teamLeadId && teamLeadId !== 'none' ? teamLeadId : null;

      if (editingTeam) {
        await pb.collection('teams').update(editingTeam.id, {
          name: teamName,
          description: teamDescription,
          lead: finalLeadId,
        });

        const currentMembers = teamMembers.filter(m => m.team === editingTeam.id);
        const memberIdsToAdd = selectedMemberIds.filter(id => !currentMembers.some(m => m.user === id));
        const membersToRemove = currentMembers.filter(m => !selectedMemberIds.includes(m.user));

        await Promise.all(
          memberIdsToAdd.map(userId =>
            pb.collection('team_members').create({
              team: editingTeam.id,
              user: userId,
              role: userId === finalLeadId ? 'lead' : 'member',
            })
          )
        );

        await Promise.all(
          membersToRemove.map(m =>
            pb.collection('team_members').delete(m.id)
          )
        );

        toast.success('Team erfolgreich aktualisiert');
      } else {
        const newTeam = await pb.collection('teams').create<TeamRecord>({
          name: teamName,
          description: teamDescription,
          lead: finalLeadId,
        });

        await Promise.all(
          selectedMemberIds.map(userId =>
            pb.collection('team_members').create({
              team: newTeam.id,
              user: userId,
              role: userId === finalLeadId ? 'lead' : 'member',
            })
          )
        );

        toast.success('Team erfolgreich erstellt');
      }

      setIsTeamDialogOpen(false);
      await fetchWorkloadData(false);
    } catch (error) {
      console.error('Failed to save team:', error);
      toast.error('Team konnte nicht gespeichert werden');
    } finally {
      setIsSavingTeam(false);
    }
  };

  const handleDeleteTeam = async () => {
    if (!teamToDelete) return;
    setIsDeletingTeam(true);

    try {
      const members = teamMembers.filter(m => m.team === teamToDelete.id);
      await Promise.all(members.map(m => pb.collection('team_members').delete(m.id)));
      await pb.collection('teams').delete(teamToDelete.id);

      toast.success('Team erfolgreich gelöscht');
      setTeamToDelete(null);
      await fetchWorkloadData(false);
    } catch (error) {
      console.error('Failed to delete team:', error);
      toast.error('Team konnte nicht gelöscht werden');
    } finally {
      setIsDeletingTeam(false);
    }
  };

  const eligibleUsers = workloads.map(w => w.user).filter(u => u.role !== 'client');

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <Skeleton className="h-10 w-48 bg-card" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-56 bg-card rounded-2xl" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto space-y-10">

        {/* Page Header */}
        <div className="flex items-center justify-between border-b border-border/40 pb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-3">
              <Users size={24} className="text-primary" />
              Team & Ressourcen
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">Übersicht über Team-Workload, Auslastung und Zuständigkeiten.</p>
          </div>
          {currentUser?.role === 'admin' && (
            <Button
              onClick={() => router.push('/admin/users')}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs rounded-lg"
            >
              Mitarbeiter anlegen
            </Button>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={(val) => router.push(`/team?tab=${val}`)} className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <TabsList className="bg-muted/50 border border-border/30 rounded-lg p-1">
              <TabsTrigger value="workloads" className="cursor-pointer">
                Mitarbeiter & Auslastung
              </TabsTrigger>
              <TabsTrigger value="teams" className="cursor-pointer">
                Teams & Abteilungen
              </TabsTrigger>
            </TabsList>

            {activeTab === 'workloads' && (currentUser?.role === 'admin' || currentUser?.role === 'manager') && (
              <div className="flex items-center gap-1.5 bg-muted/40 p-1 rounded-lg border border-border/30">
                <button
                  type="button"
                  onClick={() => setTeamScope('all')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                    teamScope === 'all'
                      ? 'bg-background text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Alle Mitarbeiter ({workloads.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTeamScope('my_team')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                    teamScope === 'my_team'
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Mein Team ({workloads.filter(w => w.user.supervisor === currentUser?.id || w.user.id === currentUser?.id).length})
                </button>
              </div>
            )}
          </div>

          <TabsContent value="workloads" className="space-y-8 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workloads
                .filter(w => {
                  if (teamScope === 'my_team' && currentUser) {
                    return w.user.supervisor === currentUser.id || w.user.id === currentUser.id;
                  }
                  return true;
                })
                .map((workloadItem) => {
                const { user, totalBudgetedHours, totalLoggedHours, workloadPercentage, taskCount } = workloadItem;
                return (
                  <Card
                    key={user.id}
                    className="border-border bg-card/40 relative overflow-hidden group cursor-pointer hover:border-primary/40 transition-all duration-300"
                    onClick={() => setSelectedUser(workloadItem)}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-transparent to-primary/0 group-hover:from-primary/5 transition-all duration-500"></div>

                    <CardHeader className="pb-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3.5">
                          <div className="h-11 w-11 rounded-full bg-gradient-to-tr from-primary to-emerald-500 flex items-center justify-center font-bold text-sm text-black shadow-md">
                            {getUserInitials(user) || 'M'}
                          </div>
                          <div>
                            <CardTitle className="text-base text-foreground font-semibold">
                              {getUserDisplayName(user)}
                            </CardTitle>
                            <div className="flex items-center gap-1.5 text-muted-foreground text-xs mt-0.5">
                              <Mail size={12} /> {user.email || '—'}
                            </div>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-accent cursor-pointer"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical size={16} />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56 bg-background border-border text-foreground">
                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger className="cursor-pointer">
                                Expertise bearbeiten
                              </DropdownMenuSubTrigger>
                              <DropdownMenuSubContent className="bg-background border border-border text-foreground w-48">
                                {EXPERTISE_OPTIONS.map((opt) => {
                                  const isSelected = (user.expertise || []).includes(opt.value);
                                  return (
                                    <DropdownMenuCheckboxItem
                                      key={opt.value}
                                      checked={isSelected}
                                      onCheckedChange={() => handleToggleExpertise(user.id, opt.value, user.expertise || [])}
                                      onSelect={(e) => e.preventDefault()}
                                      className="cursor-pointer"
                                    >
                                      {opt.label}
                                    </DropdownMenuCheckboxItem>
                                  );
                                })}
                              </DropdownMenuSubContent>
                            </DropdownMenuSub>
                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger className="cursor-pointer">
                                Stundenziel ändern
                              </DropdownMenuSubTrigger>
                              <DropdownMenuSubContent className="bg-background border border-border text-foreground w-44">
                                {[10, 20, 30, 35, 40].map((hours) => {
                                  const isCurrent = Number(user.weekly_hours_target) === hours;
                                  return (
                                    <DropdownMenuCheckboxItem
                                      key={hours}
                                      checked={isCurrent}
                                      onCheckedChange={() => handleSetWeeklyHours(user.id, hours)}
                                      onSelect={(e) => e.preventDefault()}
                                      className="cursor-pointer"
                                    >
                                      {hours} Std. / Woche
                                    </DropdownMenuCheckboxItem>
                                  );
                                })}
                              </DropdownMenuSubContent>
                            </DropdownMenuSub>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>

                    <CardContent>
                      <div className="flex flex-col gap-4">
                        <div>
                          <div className="flex flex-wrap gap-1.5 items-center">
                            <Badge variant="outline" className="bg-background border-border text-muted-foreground uppercase tracking-wider text-[10px]">
                              {ROLE_LABELS[user.role as keyof typeof ROLE_LABELS] || user.role || 'Mitarbeiter'}
                            </Badge>
                            {user.weekly_hours_target && (
                              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px]">
                                Ziel: {user.weekly_hours_target}h/Woche
                              </Badge>
                            )}
                            {taskCount > 0 && (
                              <Badge variant="outline" className="bg-background border-border text-muted-foreground text-[10px]">
                                {taskCount} {taskCount === 1 ? 'Aufgabe' : 'Aufgaben'}
                              </Badge>
                            )}
                          </div>
                          {user.expertise && user.expertise.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2.5">
                              {user.expertise.map((val: string) => {
                                const opt = EXPERTISE_OPTIONS.find(o => o.value === val);
                                if (!opt) return null;
                                return (
                                  <span key={val} className="text-[10px] font-medium bg-muted/60 text-muted-foreground border border-border/60 px-2 py-0.5 rounded-md">
                                    {opt.label}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        <div className="pt-3 border-t border-border/50">
                          <div className="flex justify-between text-xs font-medium mb-1.5">
                            <span className="text-muted-foreground flex items-center gap-1.5">
                              <Clock size={13} /> Workload
                            </span>
                            <span className={getWorkloadTextColor(workloadPercentage)}>
                              {workloadPercentage}%
                            </span>
                          </div>

                          <div className="h-2 w-full bg-muted/50 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-700 ${getWorkloadColor(workloadPercentage)}`}
                              style={{ width: `${Math.min(100, workloadPercentage)}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-[11px] text-muted-foreground mt-1.5">
                            <span>
                              {totalLoggedHours.toFixed(1)}h erfasst / {user.weekly_hours_target || 40}h Soll
                            </span>
                            <span>{taskCount} offen</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="teams" className="space-y-8 mt-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold tracking-tight text-foreground">
                  Teams & Abteilungen
                </h3>
                <p className="text-muted-foreground text-xs mt-0.5">
                  Verwalte Projekt-Teams, weise Leiter zu und verwalte die Mitglieder.
                </p>
              </div>
              {(currentUser?.role === 'admin' || currentUser?.role === 'manager') && (
                <Button
                  onClick={handleOpenCreateTeam}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-1.5 font-medium py-1.5 px-3 rounded-lg text-xs"
                >
                  <Plus size={14} /> Team erstellen
                </Button>
              )}
            </div>

            {teams.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-border/40 rounded-2xl text-muted-foreground">
                <Users size={40} className="mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-sm font-medium">Keine Teams angelegt.</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Erstelle ein neues Team, um Abteilungen und Leiter zu strukturieren.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teams.map((team) => {
                  const members = teamMembers.filter(m => m.team === team.id);
                  const leadUser = team.expand?.lead;
                  const leadName = leadUser?.name || leadUser?.email || 'Kein Teamleiter';
                  
                  return (
                    <Card
                      key={team.id}
                      className="border-border bg-card/40 relative overflow-hidden group hover:border-primary/40 transition-all duration-300 cursor-pointer"
                      onClick={() => router.push(`/team/teams/${team.id}`)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-base text-foreground font-bold hover:text-primary transition-colors">
                              {team.name}
                            </CardTitle>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Leiter: <span className="text-primary font-medium">{leadName}</span>
                            </p>
                          </div>
                          <div onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-card border border-border/50 cursor-pointer"
                              >
                                <MoreVertical size={16} />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48 bg-background border-border text-foreground">
                                <DropdownMenuItem
                                  onSelect={() => router.push(`/team/teams/${team.id}`)}
                                  className="cursor-pointer flex items-center gap-2 text-xs text-primary font-medium"
                                >
                                  <Edit3 size={14} /> Team bearbeiten
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onSelect={(e) => {
                                    e.preventDefault();
                                    setTimeout(() => handleOpenEditTeam(team), 50);
                                  }}
                                  className="cursor-pointer flex items-center gap-2 text-xs"
                                >
                                  <Edit3 size={14} /> Schnelldialog
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onSelect={(e) => {
                                    e.preventDefault();
                                    setTimeout(() => setTeamToDelete(team), 50);
                                  }}
                                  className="cursor-pointer flex items-center gap-2 text-xs text-destructive hover:bg-destructive/10"
                                >
                                  <Trash2 size={14} /> Löschen
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xs text-muted-foreground line-clamp-2 min-h-[32px]">
                          {team.description || 'Keine Beschreibung hinterlegt.'}
                        </p>
                        <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
                          <span>{members.length} Mitglieder</span>
                          <span className="text-primary text-[11px] font-medium group-hover:underline">Details &rarr;</span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Edit User Profile Dialog */}
        <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
          <DialogContent className="sm:max-w-md border-border bg-background">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit3 size={18} className="text-primary" />
                Mitarbeiter bearbeiten
              </DialogTitle>
              <DialogDescription>
                Profil und Zielvorgaben für {selectedUser?.user.email} anpassen.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Vollständiger Name</Label>
                <Input
                  id="edit-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="bg-card border-border"
                  placeholder="Max Mustermann"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-hours">Soll-Stunden / Woche</Label>
                  <Input
                    id="edit-hours"
                    type="number"
                    min="1"
                    max="60"
                    value={editWeeklyHours}
                    onChange={(e) => setEditWeeklyHours(Number(e.target.value))}
                    className="bg-card border-border"
                  />
                </div>

                {currentUser?.role === 'admin' && (
                  <div className="space-y-2">
                    <Label htmlFor="edit-role">Rolle</Label>
                    <Select value={editRole} onValueChange={(val) => val && setEditRole(val)}>
                      <SelectTrigger className="bg-card border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrator</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="employee">Mitarbeiter</SelectItem>
                        <SelectItem value="freelancer">Freelancer</SelectItem>
                        <SelectItem value="client">Kunde</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-supervisor">Vorgesetzter / Teamleiter</Label>
                <Select value={editSupervisor} onValueChange={(val) => val && setEditSupervisor(val)}>
                  <SelectTrigger className="bg-card border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Kein Vorgesetzter</SelectItem>
                    {eligibleUsers
                      .filter(u => u.id !== selectedUser?.user.id)
                      .map(u => (
                        <SelectItem key={u.id} value={u.id}>
                          {getUserDisplayName(u)} ({ROLE_LABELS[u.role as keyof typeof ROLE_LABELS] || u.role})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setSelectedUser(null)}>
                  Abbrechen
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving && <Loader2 size={14} className="animate-spin mr-2" />}
                  Speichern
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Team Dialog (Create / Edit) */}
        <Dialog open={isTeamDialogOpen} onOpenChange={setIsTeamDialogOpen}>
          <DialogContent className="sm:max-w-lg border-border bg-background">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users size={18} className="text-primary" />
                {editingTeam ? 'Team bearbeiten' : 'Neues Team anlegen'}
              </DialogTitle>
              <DialogDescription>
                Strukturiere Abteilungen und weise einen Teamleiter sowie Mitglieder zu.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSaveTeam} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="team-name">Teamname *</Label>
                <Input
                  id="team-name"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="z.B. Marketing & SEA"
                  className="bg-card border-border"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="team-desc">Beschreibung</Label>
                <Input
                  id="team-desc"
                  value={teamDescription}
                  onChange={(e) => setTeamDescription(e.target.value)}
                  placeholder="Aufgabenbereich des Teams"
                  className="bg-card border-border"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="team-lead">Teamleiter</Label>
                <Select value={teamLeadId || 'none'} onValueChange={(val) => setTeamLeadId(val || 'none')}>
                  <SelectTrigger className="bg-card border-border">
                    <SelectValue placeholder="Kein Leiter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Kein Teamleiter</SelectItem>
                    {eligibleUsers.map(u => (
                      <SelectItem key={u.id} value={u.id}>
                        {getUserDisplayName(u)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Teammitglieder</Label>
                <div className="max-h-48 overflow-y-auto border border-border rounded-lg p-2 space-y-1 bg-card/50">
                  {eligibleUsers.map(u => {
                    const isChecked = selectedMemberIds.includes(u.id);
                    return (
                      <label
                        key={u.id}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/50 cursor-pointer text-xs"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedMemberIds([...selectedMemberIds, u.id]);
                            } else {
                              setSelectedMemberIds(selectedMemberIds.filter(id => id !== u.id));
                            }
                          }}
                          className="rounded border-border"
                        />
                        <span className="text-foreground">{getUserDisplayName(u)}</span>
                        <span className="text-muted-foreground text-[10px]">({u.email})</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setIsTeamDialogOpen(false)}>
                  Abbrechen
                </Button>
                <Button type="submit" disabled={isSavingTeam}>
                  {isSavingTeam && <Loader2 size={14} className="animate-spin mr-2" />}
                  {editingTeam ? 'Änderungen speichern' : 'Team erstellen'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Team Dialog */}
        <Dialog open={!!teamToDelete} onOpenChange={(open) => !open && setTeamToDelete(null)}>
          <DialogContent className="sm:max-w-md border-border bg-background">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <Trash2 size={18} />
                Team löschen
              </DialogTitle>
              <DialogDescription>
                Möchtest du das Team <strong>{teamToDelete?.name}</strong> wirklich löschen? Die Mitglieder bleiben im System erhalten.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setTeamToDelete(null)}>
                Abbrechen
              </Button>
              <Button variant="destructive" onClick={handleDeleteTeam} disabled={isDeletingTeam}>
                {isDeletingTeam && <Loader2 size={14} className="animate-spin mr-2" />}
                Löschen
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}
