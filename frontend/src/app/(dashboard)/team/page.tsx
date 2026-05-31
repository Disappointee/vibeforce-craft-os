'use client';

import { useEffect, useState } from 'react';
import { pb } from '@/lib/pocketbase';
import { Users, Mail, Clock, MoreVertical, AlertCircle, Activity, Edit3, ListTodo, Save, Loader2, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import type { UserRecord, TaskRecord, TimeEntryRecord, UserRole, TeamRecord, TeamMemberRecord } from '@/lib/pocketbase-types';
import { ROLE_LABELS } from '@/lib/i18n';
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
  const [workloads, setWorkloads] = useState<UserWorkload[]>([]);
  const [allTasks, setAllTasks] = useState<TaskRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchErrors, setFetchErrors] = useState<string[]>([]);
  
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
  const [isSaving, setIsSaving] = useState(false);

  const currentUser = pb.authStore.record as unknown as UserRecord | null;

  useEffect(() => {
    if (selectedUser) {
      setEditName(selectedUser.user.name || '');
      setEditWeeklyHours(Number(selectedUser.user.weekly_hours_target) || 40);
      setEditExpertise(selectedUser.user.expertise || []);
      setEditRole(selectedUser.user.role || 'employee');
    }
  }, [selectedUser]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setIsSaving(true);
    try {
      await pb.collection('users').update(selectedUser.user.id, {
        name: editName,
        weekly_hours_target: editWeeklyHours,
        expertise: editExpertise,
        role: editRole as UserRole,
      });

      setWorkloads(prev => prev.map(w => {
        if (w.user.id === selectedUser.user.id) {
          return {
            ...w,
            user: {
              ...w.user,
              name: editName,
              weekly_hours_target: editWeeklyHours,
              expertise: editExpertise,
              role: editRole as UserRole,
            }
          };
        }
        return w;
      }));

      // Update dialog values
      setSelectedUser(prev => prev ? {
        ...prev,
        user: {
          ...prev.user,
          name: editName,
          weekly_hours_target: editWeeklyHours,
          expertise: editExpertise,
          role: editRole as UserRole,
        }
      } : null);

      toast.success('Profil erfolgreich aktualisiert');
    } catch (error) {
      console.error('Failed to update user profile:', error);
      toast.error('Profil konnte nicht aktualisiert werden');
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
    const errors: string[] = [];
    let users: UserRecord[] = [];
    let tasks: TaskRecord[] = [];
    let timeEntries: TimeEntryRecord[] = [];
    let teamsList: TeamRecord[] = [];
    let teamMembersList: TeamMemberRecord[] = [];

    // Fetch users
    try {
      const userResult = await pb.collection('users').getList<UserRecord>(1, 50, {
        sort: 'created',
      });
      users = userResult.items;
    } catch (err) {
      console.error('[Team] Failed to fetch users:', err);
      errors.push('Benutzer konnten nicht geladen werden');
    }

    // Fetch tasks
    try {
      const taskResult = await pb.collection('tasks').getList<TaskRecord>(1, 200, {
        expand: 'assignees,project',
        sort: '-created',
      });
      tasks = taskResult.items;
    } catch (err) {
      console.error('[Team] Failed to fetch tasks:', err);
      errors.push('Aufgaben konnten nicht geladen werden');
    }

    // Fetch time entries
    try {
      const timeResult = await pb.collection('time_entries').getList<TimeEntryRecord>(1, 500, {
        sort: '-created',
      });
      timeEntries = timeResult.items;
    } catch (err) {
      console.error('[Team] Failed to fetch time entries:', err);
      errors.push('Zeiteinträge konnten nicht geladen werden');
    }

    // Fetch teams
    try {
      const teamsResult = await pb.collection('teams').getFullList<TeamRecord>({
        sort: 'name',
        expand: 'lead',
      });
      teamsList = teamsResult;
    } catch (err) {
      console.error('[Team] Failed to fetch teams:', err);
      errors.push('Teams konnten nicht geladen werden');
    }

    // Fetch team members
    try {
      const membersResult = await pb.collection('team_members').getFullList<TeamMemberRecord>({
        expand: 'user',
      });
      teamMembersList = membersResult;
    } catch (err) {
      console.error('[Team] Failed to fetch team members:', err);
      errors.push('Team-Mitglieder konnten nicht geladen werden');
    }

    if (errors.length > 0) {
      setFetchErrors(errors);
    }

    // Build maps even with partial data
    try {
      const loggedHoursMap = new Map<string, number>();
      for (const entry of timeEntries) {
        const userId = entry.user;
        if (!userId) continue;
        const minutes = Number((entry as any).duration_minutes) || 0;
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

        let workloadPercentage = 0;
        if (totalBudgetedHours > 0) {
          workloadPercentage = Math.min(
            100,
            Math.round((totalLoggedHours / totalBudgetedHours) * 100)
          );
        }

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

  // Team creation & edit handlers
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
        // Edit mode
        await pb.collection('teams').update(editingTeam.id, {
          name: teamName,
          description: teamDescription,
          lead: finalLeadId,
        });

        const currentMembers = teamMembers.filter(m => m.team === editingTeam.id);
        const memberIdsToAdd = selectedMemberIds.filter(id => !currentMembers.some(m => m.user === id));
        const membersToRemove = currentMembers.filter(m => !selectedMemberIds.includes(m.user));
        const membersToUpdate = currentMembers.filter(m => selectedMemberIds.includes(m.user));

        // Create new member records
        await Promise.all(
          memberIdsToAdd.map(userId =>
            pb.collection('team_members').create({
              team: editingTeam.id,
              user: userId,
              role: userId === finalLeadId ? 'lead' : 'member',
            })
          )
        );

        // Delete removed member records
        await Promise.all(
          membersToRemove.map(m =>
            pb.collection('team_members').delete(m.id)
          )
        );

        // Update roles for existing members
        await Promise.all(
          membersToUpdate.map(m => {
            const targetRole = m.user === finalLeadId ? 'lead' : 'member';
            if (m.role !== targetRole) {
              return pb.collection('team_members').update(m.id, { role: targetRole });
            }
            return Promise.resolve();
          })
        );

        toast.success('Team erfolgreich aktualisiert');
      } else {
        // Create mode
        const newTeam = await pb.collection('teams').create<TeamRecord>({
          name: teamName,
          description: teamDescription,
          lead: finalLeadId,
        });

        // Create team member records
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
      <div className="max-w-6xl mx-auto space-y-12">

        <div className="flex items-center justify-between border-b border-border/40 pb-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-3">
              <Users size={24} className="text-indigo-400" />
              Team & Ressourcen
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">Verwalte dein Team und überprüfe den aktuellen Workload.</p>
          </div>
          <button
            onClick={() => toast.info('Einladungs-Funktion wird vorbereitet. (PocketBase SMTP erforderlich)')}
            className="bg-white text-zinc-950 px-4 py-2 rounded-full font-medium text-sm hover:bg-zinc-200 transition-colors"
          >
            Mitglied einladen
          </button>
        </div>

        <Tabs defaultValue="workloads" className="space-y-8">
          <TabsList className="bg-muted/50 border border-border/30 rounded-lg p-1">
            <TabsTrigger value="workloads" className="cursor-pointer">
              Mitarbeiter & Auslastung
            </TabsTrigger>
            <TabsTrigger value="teams" className="cursor-pointer">
              Teams
            </TabsTrigger>
          </TabsList>

          <TabsContent value="workloads" className="space-y-8 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workloads.map((workloadItem) => {
                const { user, totalBudgetedHours, totalLoggedHours, workloadPercentage, taskCount } = workloadItem;
                return (
                  <Card
                    key={user.id}
                    className="border-border bg-card/40 relative overflow-hidden group cursor-pointer hover:border-indigo-500/30 transition-all duration-300"
                    onClick={() => setSelectedUser(workloadItem)}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 via-transparent to-purple-500/0 group-hover:from-indigo-500/5 group-hover:to-purple-500/5 transition-all duration-500"></div>

                    <CardHeader className="pb-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-lg shadow-lg">
                            {user.email ? user.email.charAt(0).toUpperCase() : '?'}
                          </div>
                          <div>
                            <CardTitle className="text-lg text-foreground">{user.name || (user.email ? user.email.split('@')[0] : 'Unbekannt')}</CardTitle>
                            <div className="flex items-center gap-1.5 text-muted-foreground text-xs mt-1">
                              <Mail size={12} /> {user.email || '—'}
                            </div>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger render={
                            <button
                              className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-accent cursor-pointer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical size={16} />
                            </button>
                          } />
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
                                {[5, 10, 15, 20, 25, 30, 35, 40].map((hours) => {
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
                          <div className="flex flex-wrap gap-2 items-center">
                            <Badge variant="outline" className="bg-background border-border text-muted-foreground uppercase tracking-wider text-[10px]">
                              {ROLE_LABELS[(user as any).role] || (user as any).role || 'Mitglied'}
                            </Badge>
                            {user.weekly_hours_target && (
                              <Badge variant="outline" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 text-[10px]">
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
                                  <span key={val} className="text-[10px] font-medium bg-zinc-800 text-zinc-300 border border-zinc-700/80 px-2 py-0.5 rounded-md">
                                    {opt.label}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        <div className="pt-4 border-t border-border/50">
                          <div className="flex justify-between text-xs font-medium mb-2">
                            <span className="text-muted-foreground flex items-center gap-1.5">
                              <Clock size={14} /> Workload
                            </span>
                            <span className={getWorkloadTextColor(workloadPercentage)}>
                              {totalBudgetedHours === 0
                                ? 'Nicht definiert'
                                : `${workloadPercentage}%`}
                            </span>
                          </div>

                          {totalBudgetedHours > 0 ? (
                            <>
                              <div className="h-2 w-full bg-background rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-700 ${getWorkloadColor(workloadPercentage)}`}
                                  style={{ width: `${workloadPercentage}%` }}
                                ></div>
                              </div>
                              <div className="flex justify-between text-[11px] text-muted-foreground mt-1.5">
                                <span>{totalLoggedHours.toFixed(1)}h / {totalBudgetedHours.toFixed(1)}h budgetiert</span>
                                <span>{taskCount} {taskCount === 1 ? 'Aufgabe' : 'Aufgaben'}</span>
                              </div>
                            </>
                          ) : (
                            <div className="flex items-center gap-2 text-muted-foreground text-xs mt-1">
                              <AlertCircle size={12} />
                              <span>Keine Aufgaben zugewiesen</span>
                            </div>
                          )}
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
                <h3 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-3">
                  Teams & Abteilungen
                </h3>
                <p className="text-muted-foreground mt-1 text-sm">
                  Verwalte Projekt-Teams, weise Leiter zu und verwalte die Mitglieder.
                </p>
              </div>
              {((currentUser?.role as string) === 'admin' || (currentUser?.role as string) === 'manager') && (
                <Button
                  onClick={handleOpenCreateTeam}
                  className="bg-white text-zinc-950 hover:bg-zinc-200 transition-colors flex items-center gap-1.5 font-semibold py-1.5 px-4 rounded-full text-xs shadow-md border-0"
                >
                  <Plus size={14} /> Team erstellen
                </Button>
              )}
            </div>

            {teams.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-border/40 rounded-2xl text-muted-foreground">
                <Users size={48} className="mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-sm font-medium">Keine Teams gefunden.</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Erstelle ein neues Team, um loszulegen.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teams.map((team) => {
                  const members = teamMembers.filter(m => m.team === team.id);
                  const leadUser = team.expand?.lead;
                  const leadName = leadUser?.name || leadUser?.email || 'Kein Teamleiter';
                  const canEdit = currentUser?.role === 'admin' || team.lead === currentUser?.id;
                  
                  return (
                    <Card
                      key={team.id}
                      className="border-border bg-card/40 relative overflow-hidden group hover:border-indigo-500/30 transition-all duration-300"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 via-transparent to-purple-500/0 group-hover:from-indigo-500/5 group-hover:to-purple-500/5 transition-all duration-500"></div>
                      
                      <CardHeader className="pb-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg text-foreground font-bold">{team.name}</CardTitle>
                            <p className="text-xs text-muted-foreground mt-1">
                              Leiter: <span className="text-indigo-400 font-medium">{leadName}</span>
                            </p>
                          </div>
                          {canEdit && (
                            <DropdownMenu>
                              <DropdownMenuTrigger render={
                                <button
                                  className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-accent cursor-pointer"
                                >
                                  <MoreVertical size={16} />
                                </button>
                              } />
                              <DropdownMenuContent align="end" className="w-40 bg-background border-border text-foreground">
                                <DropdownMenuItem
                                  onClick={() => handleOpenEditTeam(team)}
                                  className="cursor-pointer flex items-center gap-2 text-xs"
                                >
                                  <Edit3 size={14} /> Bearbeiten
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => setTeamToDelete(team)}
                                  className="cursor-pointer flex items-center gap-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                >
                                  <Trash2 size={14} /> Löschen
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </CardHeader>
                      
                      <CardContent>
                        <div className="flex flex-col gap-4">
                          <p className="text-xs text-muted-foreground line-clamp-2 min-h-[2rem]">
                            {team.description || 'Keine Beschreibung vorhanden.'}
                          </p>
                          
                          <div className="pt-4 border-t border-border/50 flex flex-col gap-2">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-muted-foreground font-medium">Mitglieder ({members.length})</span>
                            </div>
                            
                            {members.length > 0 ? (
                              <div className="flex -space-x-2 overflow-hidden mt-1 py-1">
                                {members.slice(0, 8).map((m) => {
                                  const user = m.expand?.user;
                                  const initial = user?.name 
                                    ? user.name.charAt(0).toUpperCase() 
                                    : (user?.email ? user.email.charAt(0).toUpperCase() : '?');
                                  return (
                                    <div
                                      key={m.id}
                                      className="inline-block h-8 w-8 rounded-full ring-2 ring-background bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-300 uppercase shadow-md border border-zinc-700/50"
                                      title={user?.name || user?.email}
                                    >
                                      {initial}
                                    </div>
                                  );
                                })}
                                {members.length > 8 && (
                                  <div className="inline-block h-8 w-8 rounded-full ring-2 ring-background bg-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-300 shadow-md">
                                    +{members.length - 8}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground italic mt-1">Keine Mitglieder zugewiesen.</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>

      </div>

      {selectedUser && (
        <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
          <DialogContent className="sm:max-w-2xl border-border bg-background/95 backdrop-blur-xl text-foreground">
            <DialogHeader className="pb-2 border-b border-border/50">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-xl shadow-lg border border-indigo-500/20">
                  {selectedUser.user.email ? selectedUser.user.email.charAt(0).toUpperCase() : '?'}
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold tracking-tight flex items-center gap-2.5">
                    {selectedUser.user.name || (selectedUser.user.email ? selectedUser.user.email.split('@')[0] : 'Mitglied')}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                    <Mail size={12} /> {selectedUser.user.email}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <Tabs defaultValue="workload" className="mt-4">
              <TabsList className="grid grid-cols-2 bg-muted/50 border border-border/30 rounded-lg p-1">
                <TabsTrigger value="workload" className="flex items-center gap-2 py-2 cursor-pointer">
                  <Activity size={14} />
                  Auslastung & Aufgaben
                </TabsTrigger>
                <TabsTrigger value="edit" className="flex items-center gap-2 py-2 cursor-pointer">
                  <Edit3 size={14} />
                  Profil bearbeiten
                </TabsTrigger>
              </TabsList>

              {/* Tab 1: Auslastung & Aufgaben */}
              <TabsContent value="workload" className="space-y-6 pt-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-muted/30 border border-border/40 rounded-xl p-4 flex flex-col justify-between">
                    <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Workload</span>
                    <span className={`text-2xl font-bold mt-2 ${getWorkloadTextColor(selectedUser.workloadPercentage)}`}>
                      {selectedUser.totalBudgetedHours === 0 ? '—' : `${selectedUser.workloadPercentage}%`}
                    </span>
                  </div>
                  <div className="bg-muted/30 border border-border/40 rounded-xl p-4 flex flex-col justify-between">
                    <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Erfasst / Budgetiert</span>
                    <span className="text-xl font-bold mt-2 text-foreground">
                      {selectedUser.totalLoggedHours.toFixed(1)}h <span className="text-xs text-muted-foreground font-normal">/ {selectedUser.totalBudgetedHours.toFixed(1)}h</span>
                    </span>
                  </div>
                  <div className="bg-muted/30 border border-border/40 rounded-xl p-4 flex flex-col justify-between">
                    <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Wochenstundenziel</span>
                    <span className="text-xl font-bold mt-2 text-indigo-400">
                      {selectedUser.user.weekly_hours_target ? `${selectedUser.user.weekly_hours_target}h` : 'Nicht definiert'}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <ListTodo size={15} className="text-indigo-400" />
                    Aktive Aufgaben ({allTasks.filter(t => t.status !== 'done' && Array.isArray(t.assignees) && t.assignees.includes(selectedUser.user.id)).length})
                  </h4>

                  <div className="max-h-[220px] overflow-y-auto pr-1 space-y-2.5">
                    {allTasks.filter(t => t.status !== 'done' && Array.isArray(t.assignees) && t.assignees.includes(selectedUser.user.id)).length === 0 ? (
                      <div className="text-center py-8 border border-dashed border-border/40 rounded-xl text-muted-foreground text-xs">
                        Keine aktiven Aufgaben zugewiesen.
                      </div>
                    ) : (
                      allTasks
                        .filter(t => t.status !== 'done' && Array.isArray(t.assignees) && t.assignees.includes(selectedUser.user.id))
                        .map((task) => {
                          const project = task.expand?.project as any;
                          return (
                            <div key={task.id} className="flex justify-between items-center p-3 bg-muted/20 border border-border/30 rounded-xl hover:bg-muted/30 transition-colors">
                              <div>
                                <p className="text-xs font-semibold text-foreground">{task.title}</p>
                                <p className="text-[10px] text-muted-foreground mt-0.5">
                                  {project ? `[${project.key}] ${project.name}` : 'Kein Projekt'}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                {task.estimated_hours && (
                                  <Badge variant="outline" className="bg-background text-[10px]">
                                    {task.estimated_hours}h Est.
                                  </Badge>
                                )}
                                <Badge variant="secondary" className="text-[10px] capitalize bg-zinc-800 text-zinc-300">
                                  {task.status || 'todo'}
                                </Badge>
                              </div>
                            </div>
                          );
                        })
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* Tab 2: Profil bearbeiten */}
              <TabsContent value="edit" className="pt-4">
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-name" className="text-xs">Name</Label>
                      <Input
                        id="edit-name"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Name des Mitarbeiter"
                        className="bg-muted/20 border-border text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-weekly-hours" className="text-xs">Stundenziel / Woche</Label>
                      <Select
                        value={String(editWeeklyHours)}
                        onValueChange={(val) => val && setEditWeeklyHours(Number(val))}
                      >
                        <SelectTrigger className="bg-muted/20 border-border text-sm">
                          <SelectValue placeholder="Wähle Stundenziel" />
                        </SelectTrigger>
                        <SelectContent className="bg-background border-border">
                          {[5, 10, 15, 20, 25, 30, 35, 40].map((hours) => (
                            <SelectItem key={hours} value={String(hours)} className="cursor-pointer">
                              {hours} Std. / Woche
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Expertise / Fähigkeiten</Label>
                      <div className="border border-border/40 bg-muted/10 rounded-xl p-3 max-h-[140px] overflow-y-auto space-y-1.5">
                        {EXPERTISE_OPTIONS.map((opt) => (
                          <div key={opt.value} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id={`exp-${opt.value}`}
                              checked={editExpertise.includes(opt.value)}
                              onChange={(e) => {
                                setEditExpertise(prev =>
                                  e.target.checked
                                    ? [...prev, opt.value]
                                    : prev.filter(v => v !== opt.value)
                                );
                              }}
                              className="rounded border-zinc-700 bg-zinc-950 text-indigo-500 focus:ring-indigo-500/20 h-3.5 w-3.5"
                            />
                            <Label htmlFor={`exp-${opt.value}`} className="text-xs cursor-pointer text-muted-foreground hover:text-foreground">
                              {opt.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-role" className="text-xs">Systemrolle</Label>
                      <Select
                        value={editRole}
                        onValueChange={(val) => val && setEditRole(val)}
                      >
                        <SelectTrigger className="bg-muted/20 border-border text-sm">
                          <SelectValue placeholder="Wähle Rolle">
                            {(value: string) => ROLE_LABELS[value] || value}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="bg-background border-border">
                          <SelectItem value="admin">Administrator</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="employee">Mitarbeiter</SelectItem>
                          <SelectItem value="freelancer">Freelancer</SelectItem>
                          <SelectItem value="client">Kunde</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-[10px] text-muted-foreground mt-1">Ändert Berechtigungen im OS.</p>
                    </div>
                  </div>

                  <DialogFooter className="pt-4 border-t border-border/50 mt-6">
                    <Button type="button" variant="outline" size="sm" onClick={() => setSelectedUser(null)}>
                      Abbrechen
                    </Button>
                    <Button type="submit" size="sm" disabled={isSaving}>
                      {isSaving && <Loader2 size={12} className="animate-spin mr-1.5" />}
                      <Save size={14} className="mr-1.5" />
                      Speichern
                    </Button>
                  </DialogFooter>
                </form>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}

      {/* Team Create/Edit Dialog */}
      {isTeamDialogOpen && (
        <Dialog open={isTeamDialogOpen} onOpenChange={(open) => !open && setIsTeamDialogOpen(false)}>
          <DialogContent className="sm:max-w-lg border-border bg-background/95 backdrop-blur-xl text-foreground">
            <DialogHeader className="pb-2 border-b border-border/50">
              <DialogTitle className="text-xl font-bold tracking-tight">
                {editingTeam ? 'Team bearbeiten' : 'Neues Team erstellen'}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {editingTeam ? 'Passe die Team-Struktur, den Leiter und die Mitglieder an.' : 'Erstelle ein neues Team und weise Mitglieder und einen Leiter zu.'}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSaveTeam} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="team-name" className="text-xs">Teamname</Label>
                <Input
                  id="team-name"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="z.B. Marketing, Entwicklung"
                  className="bg-muted/20 border-border text-sm"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="team-desc" className="text-xs">Beschreibung</Label>
                <Input
                  id="team-desc"
                  value={teamDescription}
                  onChange={(e) => setTeamDescription(e.target.value)}
                  placeholder="Optionale Kurzbeschreibung des Teams"
                  className="bg-muted/20 border-border text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="team-lead" className="text-xs">Teamleiter</Label>
                <Select
                  value={teamLeadId || 'none'}
                  onValueChange={(val) => setTeamLeadId(!val || val === 'none' ? '' : val)}
                >
                  <SelectTrigger className="bg-muted/20 border-border text-sm">
                    <SelectValue placeholder="Wähle Teamleiter" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-border">
                    <SelectItem value="none" className="cursor-pointer">Kein Teamleiter</SelectItem>
                    {eligibleUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id} className="cursor-pointer">
                        {user.name || user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Mitglieder auswählen</Label>
                <div className="border border-border/40 bg-muted/10 rounded-xl p-3 max-h-[180px] overflow-y-auto space-y-1.5">
                  {eligibleUsers.map((user) => {
                    const isChecked = selectedMemberIds.includes(user.id);
                    return (
                      <div key={user.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`member-${user.id}`}
                          checked={isChecked}
                          onChange={(e) => {
                            setSelectedMemberIds(prev =>
                              e.target.checked
                                ? [...prev, user.id]
                                : prev.filter(id => id !== user.id)
                            );
                          }}
                          className="rounded border-zinc-700 bg-zinc-950 text-indigo-500 focus:ring-indigo-500/20 h-3.5 w-3.5"
                        />
                        <Label
                          htmlFor={`member-${user.id}`}
                          className="text-xs cursor-pointer text-muted-foreground hover:text-foreground"
                        >
                          {user.name || user.email}
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </div>

              <DialogFooter className="pt-4 border-t border-border/50 mt-6">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsTeamDialogOpen(false)} disabled={isSavingTeam}>
                  Abbrechen
                </Button>
                <Button type="submit" size="sm" disabled={isSavingTeam}>
                  {isSavingTeam && <Loader2 size={12} className="animate-spin mr-1.5" />}
                  <Save size={14} className="mr-1.5" />
                  Speichern
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Team Delete Confirmation Dialog */}
      {teamToDelete && (
        <Dialog open={!!teamToDelete} onOpenChange={(open) => !open && setTeamToDelete(null)}>
          <DialogContent className="sm:max-w-md border-border bg-background/95 backdrop-blur-xl text-foreground">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-red-400">Team löschen</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground mt-2">
                Bist du sicher, dass du das Team &ldquo;{teamToDelete.name}&rdquo; löschen möchtest? Diese Aktion kann nicht rückgängig gemacht werden.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-6 flex justify-end gap-3">
              <Button variant="outline" size="sm" onClick={() => setTeamToDelete(null)} disabled={isDeletingTeam}>
                Abbrechen
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="bg-red-500 hover:bg-red-600 text-white"
                onClick={handleDeleteTeam}
                disabled={isDeletingTeam}
              >
                {isDeletingTeam && <Loader2 size={12} className="animate-spin mr-1.5" />}
                Löschen
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
