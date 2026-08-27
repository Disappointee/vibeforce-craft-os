'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { pb } from '@/lib/pocketbase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Users,
  Shield,
  UserPlus,
  Trash2,
  Save,
  CheckCircle,
  Loader2,
  Mail,
  Edit3,
} from 'lucide-react';
import { toast } from 'sonner';

interface TeamRecord {
  id: string;
  name: string;
  description?: string;
  lead?: string;
  expand?: {
    lead?: {
      id: string;
      name?: string;
      email: string;
    };
  };
}

interface TeamMemberRecord {
  id: string;
  team: string;
  user: string;
  role?: string;
  expand?: {
    user?: {
      id: string;
      name?: string;
      email: string;
      role?: string;
    };
  };
}

interface UserItem {
  id: string;
  name?: string;
  email: string;
  role?: string;
}

export default function TeamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = params.id as string;

  const [team, setTeam] = useState<TeamRecord | null>(null);
  const [members, setMembers] = useState<TeamMemberRecord[]>([]);
  const [allUsers, setAllUsers] = useState<UserItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [leadId, setLeadId] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

  useEffect(() => {
    if (teamId) {
      loadTeamData();
    }
  }, [teamId]);

  const loadTeamData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Team
      const teamRes = await pb.collection('teams').getOne<TeamRecord>(teamId, {
        expand: 'lead',
      });
      setTeam(teamRes);
      setName(teamRes.name || '');
      setDescription(teamRes.description || '');
      setLeadId(teamRes.lead || '');

      // 2. Fetch Team Members
      const membersRes = await pb.collection('team_members').getFullList<TeamMemberRecord>({
        filter: pb.filter('team = {:teamId}', { teamId }),
        expand: 'user',
      });
      setMembers(membersRes);
      setSelectedMemberIds(membersRes.map((m) => m.user));

      // 3. Fetch All Users
      const usersRes = await pb.collection('users').getFullList<UserItem>({
        sort: 'name',
      });
      setAllUsers(usersRes);
    } catch (err: any) {
      console.error('Error loading team details:', err);
      toast.error('Team konnte nicht geladen werden');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleMember = (userId: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Teamname ist erforderlich');
      return;
    }

    setIsSaving(true);
    try {
      const finalLeadId = leadId && leadId !== 'none' ? leadId : null;

      // 1. Update Team
      await pb.collection('teams').update(teamId, {
        name,
        description,
        lead: finalLeadId,
      });

      // 2. Sync Members
      const currentMembers = members;
      const memberIdsToAdd = selectedMemberIds.filter(
        (id) => !currentMembers.some((m) => m.user === id)
      );
      const membersToRemove = currentMembers.filter(
        (m) => !selectedMemberIds.includes(m.user)
      );

      // Create new member records
      await Promise.all(
        memberIdsToAdd.map((userId) =>
          pb.collection('team_members').create({
            team: teamId,
            user: userId,
          })
        )
      );

      // Delete removed member records
      await Promise.all(
        membersToRemove.map((m) => pb.collection('team_members').delete(m.id))
      );

      toast.success('Team erfolgreich gespeichert');
      await loadTeamData();
    } catch (err: any) {
      console.error('Error saving team:', err);
      toast.error(err?.message || 'Fehler beim Speichern des Teams');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTeam = async () => {
    if (!confirm(`Möchtest du das Team "${name}" wirklich löschen?`)) return;

    try {
      // Delete team members first
      await Promise.all(members.map((m) => pb.collection('team_members').delete(m.id)));
      // Delete team
      await pb.collection('teams').delete(teamId);

      toast.success(`Team "${name}" gelöscht`);
      router.push('/team?tab=teams');
    } catch (err: any) {
      console.error('Error deleting team:', err);
      toast.error('Fehler beim Löschen des Teams');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Team nicht gefunden.</p>
        <Button onClick={() => router.push('/team?tab=teams')} className="mt-4">
          Zurück zur Team-Übersicht
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 max-w-5xl mx-auto">
      {/* Top Bar / Header */}
      <div className="flex items-center justify-between border-b border-border/50 pb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/team?tab=teams')}
            className="rounded-full hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">{team.name}</h1>
              <Badge variant="outline" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
                Team
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Verwalte Details, Leiter und Mitglieder dieses Teams.
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={handleDeleteTeam}
          className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
        >
          <Trash2 className="h-4 w-4 mr-2" /> Team löschen
        </Button>
      </div>

      {/* Main Edit Form */}
      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Team Settings */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border bg-card/40">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Edit3 className="h-5 w-5 text-indigo-400" /> Allgemeine Informationen
              </CardTitle>
              <CardDescription>Name, Beschreibung und Teamleiter anpassen</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="teamName" className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                  Teamname
                </Label>
                <Input
                  id="teamName"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="z.B. Marketing & Growth"
                  className="bg-background border-border"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="teamDesc" className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                  Beschreibung
                </Label>
                <textarea
                  id="teamDesc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Aufgabenbereich und Fokus dieses Teams..."
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="teamLead" className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                  Teamleiter
                </Label>
                <Select value={leadId || 'none'} onValueChange={setLeadId}>
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue placeholder="Wähle einen Teamleiter...">
                      {(() => {
                        if (!leadId || leadId === 'none') return 'Kein Teamleiter';
                        const u = allUsers.find((x) => x.id === leadId);
                        return u ? (u.name || u.email) : leadId;
                      })()}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-background border-border text-foreground">
                    <SelectItem value="none">Kein Teamleiter</SelectItem>
                    {allUsers.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name || u.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Members Selection Card */}
          <Card className="border-border bg-card/40">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-400" /> Team-Mitglieder ({selectedMemberIds.length})
              </CardTitle>
              <CardDescription>Mitglieder zum Team hinzufügen oder entfernen</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-2">
                {allUsers.map((u) => {
                  const isMember = selectedMemberIds.includes(u.id);
                  return (
                    <div
                      key={u.id}
                      onClick={() => handleToggleMember(u.id)}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                        isMember
                          ? 'border-indigo-500/50 bg-indigo-500/10 text-foreground'
                          : 'border-border/50 bg-background/50 hover:bg-muted/30 text-muted-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
                          {u.name?.charAt(0).toUpperCase() || u.email.charAt(0).toUpperCase()}
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-medium text-foreground truncate">{u.name || u.email}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{u.email}</p>
                        </div>
                      </div>
                      {isMember && <CheckCircle className="h-4 w-4 text-indigo-400 shrink-0" />}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Actions & Meta */}
        <div className="space-y-6">
          <Card className="border-border bg-card/40">
            <CardHeader>
              <CardTitle className="text-base font-bold">Speichern & Übernehmen</CardTitle>
              <CardDescription>Änderungen auf das Team anwenden</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                type="submit"
                disabled={isSaving}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold h-10 flex items-center justify-center gap-2"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Änderungen speichern
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/team?tab=teams')}
                className="w-full border-border text-foreground hover:bg-muted"
              >
                Abbrechen
              </Button>
            </CardContent>
          </Card>

          {/* Quick Summary Card */}
          <Card className="border-border/50 bg-muted/20">
            <CardContent className="p-4 space-y-3 text-xs">
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Team ID</span>
                <span className="font-mono text-foreground">{team.id}</span>
              </div>
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Teamleiter</span>
                <span className="font-medium text-indigo-400">
                  {allUsers.find((u) => u.id === leadId)?.name || 'Keiner'}
                </span>
              </div>
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Mitgliederanzahl</span>
                <span className="font-bold text-foreground">{selectedMemberIds.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
