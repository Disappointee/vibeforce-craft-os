'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
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
  Trash2,
  Save,
  CheckCircle,
  Loader2,
  Mail,
  Edit3,
} from 'lucide-react';
import { toast } from 'sonner';
import { ROLE_LABELS } from '@/lib/i18n';
import type { TeamRecord, TeamMemberRecord, UserRecord } from '@/lib/pocketbase-types';
import { getUserDisplayName, getUserInitials } from '@/lib/user-utils';

export default function TeamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: teamId } = use(params);
  const router = useRouter();

  const [team, setTeam] = useState<TeamRecord | null>(null);
  const [members, setMembers] = useState<TeamMemberRecord[]>([]);
  const [allUsers, setAllUsers] = useState<UserRecord[]>([]);
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
      setLeadId(teamRes.lead || 'none');

      // 2. Fetch Members
      const membersRes = await pb.collection('team_members').getFullList<TeamMemberRecord>({
        filter: pb.filter('team = {:teamId}', { teamId }),
        expand: 'user',
      });
      setMembers(membersRes);
      setSelectedMemberIds(membersRes.map(m => m.user));

      // 3. Fetch All Users
      const usersRes = await pb.collection('users').getFullList<UserRecord>({
        sort: 'name',
      });
      setAllUsers(usersRes.filter(u => u.role !== 'client'));

    } catch (err: unknown) {
      console.error('Failed to load team data:', err);
      toast.error('Team konnte nicht geladen werden');
    } finally {
      setIsLoading(false);
    }
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

      // Update Team
      await pb.collection('teams').update(teamId, {
        name,
        description,
        lead: finalLeadId,
      });

      // Update Members
      const currentMemberUserIds = members.map(m => m.user);
      const memberIdsToAdd = selectedMemberIds.filter(id => !currentMemberUserIds.includes(id));
      const membersToRemove = members.filter(m => !selectedMemberIds.includes(m.user));

      await Promise.all([
        ...memberIdsToAdd.map(userId =>
          pb.collection('team_members').create({
            team: teamId,
            user: userId,
            role: userId === finalLeadId ? 'lead' : 'member',
          })
        ),
        ...membersToRemove.map(m =>
          pb.collection('team_members').delete(m.id)
        ),
      ]);

      toast.success('Team erfolgreich aktualisiert');
      await loadTeamData();
    } catch (err) {
      console.error('Failed to save team:', err);
      toast.error('Fehler beim Speichern des Teams');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTeam = async () => {
    if (!confirm(`Möchtest du das Team "${name}" wirklich löschen?`)) return;

    try {
      await Promise.all(members.map(m => pb.collection('team_members').delete(m.id)));
      await pb.collection('teams').delete(teamId);
      toast.success('Team gelöscht');
      router.push('/team?tab=teams');
    } catch (err) {
      console.error('Failed to delete team:', err);
      toast.error('Fehler beim Löschen des Teams');
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 max-w-4xl mx-auto flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Team wird geladen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/team?tab=teams')}
            className="rounded-lg"
          >
            <ArrowLeft size={18} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Users className="text-primary" size={22} />
              {team?.name || 'Team bearbeiten'}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">Teamdetails, Teamleiter und Mitglieder anpassen.</p>
          </div>
        </div>

        <Button
          variant="destructive"
          size="sm"
          onClick={handleDeleteTeam}
          className="flex items-center gap-1.5"
        >
          <Trash2 size={14} /> Team löschen
        </Button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Basic Settings */}
        <Card className="border-border bg-card/40">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Allgemeine Angaben</CardTitle>
            <CardDescription className="text-xs">Stammdaten des Teams oder der Abteilung</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="team-name">Teamname *</Label>
              <Input
                id="team-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="z.B. Digital Marketing"
                className="bg-card border-border"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="team-desc">Beschreibung</Label>
              <Input
                id="team-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Kurze Beschreibung des Tätigkeitsfelds"
                className="bg-card border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="team-lead">Teamleiter</Label>
              <Select value={leadId || 'none'} onValueChange={(val) => setLeadId(val || 'none')}>
                <SelectTrigger className="bg-card border-border">
                  <SelectValue placeholder="Kein Teamleiter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Kein Teamleiter</SelectItem>
                  {allUsers.map(u => (
                    <SelectItem key={u.id} value={u.id}>
                      {getUserDisplayName(u)} ({u.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Member Assignment */}
        <Card className="border-border bg-card/40">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Mitglieder ({selectedMemberIds.length})</CardTitle>
                <CardDescription className="text-xs">Wähle alle Mitarbeiter aus, die diesem Team angehören</CardDescription>
              </div>
              <Badge variant="outline" className="text-primary border-primary/20 bg-primary/10">
                {selectedMemberIds.length} ausgewählt
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto p-1">
              {allUsers.map((u) => {
                const isChecked = selectedMemberIds.includes(u.id);
                return (
                  <label
                    key={u.id}
                    className={`flex items-center gap-3 p-2.5 rounded-lg border transition-all cursor-pointer ${
                      isChecked
                        ? 'border-primary/40 bg-primary/5'
                        : 'border-border/60 bg-card/30 hover:bg-card/70'
                    }`}
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
                      className="rounded border-border text-primary"
                    />
                    <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-primary to-emerald-500 flex items-center justify-center font-bold text-[10px] text-black shrink-0">
                      {getUserInitials(u) || 'M'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-foreground truncate">{getUserDisplayName(u)}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{u.email}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/team?tab=teams')}
          >
            Abbrechen
          </Button>
          <Button type="submit" disabled={isSaving} className="flex items-center gap-2">
            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Änderungen speichern
          </Button>
        </div>
      </form>
    </div>
  );
}
