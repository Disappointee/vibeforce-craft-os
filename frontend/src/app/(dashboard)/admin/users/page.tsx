'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { pb } from '@/lib/pocketbase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Users, UserPlus, Shield, Loader2, Ban, CheckCircle, Mail, Trash2, KeyRound, Copy, AlertTriangle, Pencil, LogIn, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { USER_ROLES, USER_ROLE_LABEL_MAP, labelFor } from '@/lib/constants';
import { getUserDisplayName, getUserInitials } from '@/lib/user-utils';
import { impersonateUser } from '@/lib/impersonate';
import {
    fetchAdminUsers,
    inviteUser,
    updateUserRole,
    toggleUserDeactivation,
    updateUserSupervisor,
    adminResetUserPassword,
    deleteUserAdmin,
} from '@/app/actions/admin-users';
import type { UserRecord } from '@/lib/pocketbase-types';

export default function AdminUsersPage() {
    const router = useRouter();
    const [users, setUsers] = useState<UserRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    // Invite dialog
    const [inviteOpen, setInviteOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteName, setInviteName] = useState('');
    const [inviteRole, setInviteRole] = useState('employee');
    const [inviteSupervisor, setInviteSupervisor] = useState<string>('none');
    const [inviteWeeklyHours, setInviteWeeklyHours] = useState(40);
    const [inviting, setInviting] = useState(false);

    // Fallback dialog when SMTP is not configured
    const [fallbackOpen, setFallbackOpen] = useState(false);
    const [fallbackEmail, setFallbackEmail] = useState('');
    const [fallbackPassword, setFallbackPassword] = useState('');

    // Password reset dialog
    const [resetOpen, setResetOpen] = useState(false);
    const [resetUserId, setResetUserId] = useState('');
    const [resetUserEmail, setResetUserEmail] = useState('');
    const [resetPassword, setResetPassword] = useState('');
    const [resetPasswordConfirm, setResetPasswordConfirm] = useState('');
    const [resetting, setResetting] = useState(false);

    // Edit user dialog
    const [editOpen, setEditOpen] = useState(false);
    const [editUserId, setEditUserId] = useState('');
    const [editName, setEditName] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [editRole, setEditRole] = useState('employee');
    const [editSupervisor, setEditSupervisor] = useState<string>('none');
    const [editWeeklyHours, setEditWeeklyHours] = useState(40);
    const [editing, setEditing] = useState(false);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        if (!pb.authStore.isValid) {
            router.push('/login');
            return;
        }
        try {
            const record = await pb.collection('users').authRefresh();
            const userRole = record.record?.role;
            if (userRole !== 'admin') {
                toast.error('Zugriff verweigert. Nur Administratoren können diese Seite aufrufen.');
                router.push('/');
                return;
            }
            setIsAdmin(true);
            await loadUsers();
        } catch {
            pb.authStore.clear();
            router.push('/login');
            return;
        }
        setLoading(false);
    };

    const loadUsers = async () => {
        try {
            const res = await fetchAdminUsers();
            if (res.success && res.data) {
                setUsers(res.data);
            } else {
                // Fallback to client-side load if needed
                const result = await pb.collection('users').getList<UserRecord>(1, 100, {
                    sort: '-created',
                    expand: 'supervisor',
                });
                setUsers(result.items);
            }
        } catch (error) {
            console.error('Error loading users:', error);
            toast.error('Fehler beim Laden der Benutzer');
        }
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!inviteEmail.trim()) {
            toast.error('Bitte E-Mail-Adresse eingeben');
            return;
        }

        setInviting(true);
        try {
            const res = await inviteUser({
                email: inviteEmail.trim(),
                name: inviteName.trim() || undefined,
                role: inviteRole,
                supervisor: inviteSupervisor !== 'none' ? inviteSupervisor : undefined,
                weekly_hours_target: inviteWeeklyHours,
            });

            if (!res.success) {
                toast.error(res.error || 'Fehler beim Anlegen des Benutzers');
                return;
            }

            if (res.smtpFailed) {
                setFallbackEmail(inviteEmail);
                setFallbackPassword('Einladungs-Passwort wurde generiert. Bitte neues Passwort über Reset anfordern.');
                setFallbackOpen(true);
            } else {
                toast.success(`Benutzer ${inviteEmail} erfolgreich angelegt`);
            }

            setInviteOpen(false);
            setInviteEmail('');
            setInviteName('');
            setInviteRole('employee');
            setInviteSupervisor('none');
            setInviteWeeklyHours(40);
            await loadUsers();
        } catch (error: unknown) {
            console.error('Invite error:', error);
            const msg = error instanceof Error ? error.message : 'Fehler beim Erstellen des Benutzers';
            toast.error(msg);
        } finally {
            setInviting(false);
        }
    };

    const handleToggleStatus = async (user: UserRecord) => {
        if (user.id === pb.authStore.record?.id) {
            toast.error('Du kannst dich nicht selbst deaktivieren');
            return;
        }

        try {
            const res = await toggleUserDeactivation(user.id, !user.deactivated);
            if (!res.success) {
                toast.error(res.error || 'Status konnte nicht geändert werden');
                return;
            }

            toast.success(`Benutzer ${user.deactivated ? 'aktiviert' : 'deaktiviert'}`);
            await loadUsers();
        } catch (error: unknown) {
            console.error('Toggle status error:', error);
            toast.error('Fehler beim Ändern des Status');
        }
    };

    const handleRoleChange = async (userId: string, newRole: string) => {
        if (userId === pb.authStore.record?.id && newRole !== 'admin') {
            toast.error('Du kannst dir selbst nicht die Admin-Rolle entziehen');
            return;
        }

        try {
            const res = await updateUserRole(userId, newRole);
            if (!res.success) {
                toast.error(res.error || 'Rolle konnte nicht geändert werden');
                return;
            }
            toast.success('Rolle erfolgreich aktualisiert');
            await loadUsers();
        } catch (error: unknown) {
            console.error('Role change error:', error);
            toast.error('Fehler beim Ändern der Rolle');
        }
    };

    const handleSupervisorChange = async (userId: string, supervisorId: string) => {
        try {
            const finalSupervisor = supervisorId === 'none' ? null : supervisorId;
            const res = await updateUserSupervisor(userId, finalSupervisor);
            if (!res.success) {
                toast.error(res.error || 'Vorgesetzter konnte nicht geändert werden');
                return;
            }
            toast.success('Vorgesetzter erfolgreich zugewiesen');
            await loadUsers();
        } catch (error: unknown) {
            console.error('Supervisor change error:', error);
            toast.error('Fehler beim Zuweisen des Vorgesetzten');
        }
    };

    const handleDelete = async (user: UserRecord) => {
        if (user.id === pb.authStore.record?.id) {
            toast.error('Du kannst dich nicht selbst löschen');
            return;
        }

        if (!confirm(`Möchtest du "${getUserDisplayName(user)}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`)) return;

        try {
            const res = await deleteUserAdmin(user.id);
            if (!res.success) {
                toast.error(res.error || 'Fehler beim Löschen des Benutzers');
                return;
            }
            toast.success(`Benutzer "${getUserDisplayName(user)}" gelöscht`);
            await loadUsers();
        } catch (error: unknown) {
            console.error('Delete error:', error);
            toast.error('Fehler beim Löschen des Benutzers');
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!resetPassword || resetPassword.length < 8) {
            toast.error('Passwort muss mindestens 8 Zeichen lang sein');
            return;
        }

        if (resetPassword !== resetPasswordConfirm) {
            toast.error('Passwörter stimmen nicht überein');
            return;
        }

        setResetting(true);
        try {
            const res = await adminResetUserPassword(resetUserId, {
                password: resetPassword,
                passwordConfirm: resetPasswordConfirm,
            });

            if (!res.success) {
                toast.error(res.error || 'Fehler beim Zurücksetzen des Passworts');
                return;
            }

            toast.success(`Passwort für ${resetUserEmail} zurückgesetzt`);
            setResetOpen(false);
            setResetUserId('');
            setResetUserEmail('');
            setResetPassword('');
            setResetPasswordConfirm('');
        } catch (error: unknown) {
            console.error('Reset password error:', error);
            toast.error('Fehler beim Zurücksetzen des Passworts');
        } finally {
            setResetting(false);
        }
    };

    const handleEdit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!editName.trim()) {
            toast.error('Name darf nicht leer sein');
            return;
        }

        setEditing(true);
        try {
            await pb.collection('users').update(editUserId, {
                name: editName.trim(),
                role: editRole,
                supervisor: editSupervisor === 'none' ? null : editSupervisor,
                weekly_hours_target: editWeeklyHours,
            });
            toast.success('Benutzerdaten erfolgreich aktualisiert');
            setEditOpen(false);
            await loadUsers();
        } catch (error: unknown) {
            console.error('Edit user error:', error);
            const msg = error instanceof Error ? error.message : 'Fehler beim Aktualisieren';
            toast.error(msg);
        } finally {
            setEditing(false);
        }
    };

    const ROLE_LABELS_FALLBACK: Record<string, string> = {
        admin: 'Administrator',
        manager: 'Manager',
        employee: 'Mitarbeiter',
        freelancer: 'Freelancer',
        client: 'Kunde',
    };

    const getRoleBadge = (role?: string) => {
        const label = ROLE_LABELS_FALLBACK[role || 'employee'] || role || '—';
        switch (role) {
            case 'admin':
                return <Badge variant="default" className="bg-primary/10 text-primary border-primary/20 text-[11px]">{label}</Badge>;
            case 'manager':
                return <Badge variant="default" className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[11px]">{label}</Badge>;
            case 'employee':
                return <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[11px]">{label}</Badge>;
            case 'freelancer':
                return <Badge variant="outline" className="text-orange-400 border-orange-500/20 text-[11px]">{label}</Badge>;
            case 'client':
                return <Badge variant="outline" className="text-muted-foreground border-border text-[11px]">{label}</Badge>;
            default:
                return <Badge variant="outline" className="text-[11px]">{label}</Badge>;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground text-sm font-medium">Lade Benutzer...</p>
                </div>
            </div>
        );
    }

    if (!isAdmin) return null;

    return (
        <div className="p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Page Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-3">
                            <Shield size={24} className="text-primary" />
                            Benutzerverwaltung
                        </h1>
                        <p className="text-muted-foreground mt-1 text-sm">Mitarbeiter einladen, Rollen und Vorgesetzte zuweisen sowie Konten verwalten.</p>
                    </div>
                    <Button onClick={() => setInviteOpen(true)} className="flex items-center gap-2">
                        <UserPlus size={16} />
                        Mitarbeiter anlegen
                    </Button>
                </div>

                {/* Users Table */}
                <Card className="border-border bg-card/40">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                <Users size={18} />
                            </div>
                            <div>
                                <CardTitle className="text-base font-semibold">Alle Benutzer ({users.length})</CardTitle>
                                <CardDescription className="text-xs">Rollen, Vorgesetzte und Zugriffsstatus der Teammitglieder</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-border">
                                    <TableHead className="text-muted-foreground text-xs font-semibold">Benutzer</TableHead>
                                    <TableHead className="text-muted-foreground text-xs font-semibold">Rolle</TableHead>
                                    <TableHead className="text-muted-foreground text-xs font-semibold">Vorgesetzter</TableHead>
                                    <TableHead className="text-muted-foreground text-xs font-semibold">Status</TableHead>
                                    <TableHead className="text-muted-foreground text-xs font-semibold text-right">Aktionen</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                                            <Users size={32} className="mx-auto mb-2 opacity-30" />
                                            Keine Benutzer gefunden
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    users.map((user) => {
                                        const supervisorUser = (user.expand?.supervisor as UserRecord | undefined);
                                        return (
                                            <TableRow key={user.id} className="border-border/50 hover:bg-muted/20">
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-primary to-emerald-500 flex items-center justify-center text-xs font-bold text-black shrink-0">
                                                            {getUserInitials(user)}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-foreground">
                                                                {getUserDisplayName(user)}
                                                                {user.id === pb.authStore.record?.id && (
                                                                    <span className="ml-2 text-xs text-primary font-semibold">(Du)</span>
                                                                )}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">{user.email}</p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Select
                                                        value={user.role || 'employee'}
                                                        onValueChange={(val) => val && handleRoleChange(user.id, val)}
                                                    >
                                                        <SelectTrigger className="w-32 h-8 text-xs bg-background border-border">
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
                                                </TableCell>
                                                <TableCell>
                                                    <Select
                                                        value={user.supervisor || 'none'}
                                                        onValueChange={(val) => val && handleSupervisorChange(user.id, val)}
                                                    >
                                                        <SelectTrigger className="w-40 h-8 text-xs bg-background border-border">
                                                            <span className="truncate">
                                                                {supervisorUser ? getUserDisplayName(supervisorUser) : 'Kein Vorgesetzter'}
                                                            </span>
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="none">Kein Vorgesetzter</SelectItem>
                                                            {users
                                                                .filter(u => u.id !== user.id && u.role !== 'client')
                                                                .map(u => (
                                                                    <SelectItem key={u.id} value={u.id}>
                                                                        {getUserDisplayName(u)}
                                                                    </SelectItem>
                                                                ))}
                                                        </SelectContent>
                                                    </Select>
                                                </TableCell>
                                                <TableCell>
                                                    {!user.deactivated || user.id === pb.authStore.record?.id ? (
                                                        <Badge variant="default" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">
                                                            <CheckCircle size={11} className="mr-1" />
                                                            Aktiv
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="destructive" className="bg-red-500/10 text-red-400 border-red-500/20 text-[10px]">
                                                            <Ban size={11} className="mr-1" />
                                                            Deaktiviert
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        {pb.authStore.record?.role === 'admin' && user.id !== pb.authStore.record?.id && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={async () => {
                                                                    try {
                                                                        const { token, record } = await impersonateUser(user.id);
                                                                        pb.authStore.save(token, record);
                                                                        toast.success('Eingeloggt als ' + getUserDisplayName(user));
                                                                        router.push('/');
                                                                    } catch (error: unknown) {
                                                                        const msg = error instanceof Error ? error.message : 'Fehler bei der Impersonation';
                                                                        toast.error(msg);
                                                                    }
                                                                }}
                                                                className="text-amber-400 hover:bg-amber-500/10 h-8 w-8 p-0"
                                                                title="Als Benutzer einloggen"
                                                            >
                                                                <LogIn size={14} />
                                                            </Button>
                                                        )}
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => {
                                                                setEditUserId(user.id);
                                                                setEditName(user.name || '');
                                                                setEditEmail(user.email);
                                                                setEditRole(user.role || 'employee');
                                                                setEditSupervisor(user.supervisor || 'none');
                                                                setEditWeeklyHours(Number(user.weekly_hours_target) || 40);
                                                                setEditOpen(true);
                                                            }}
                                                            className="text-primary hover:bg-primary/10 h-8 w-8 p-0"
                                                            title="Benutzer bearbeiten"
                                                        >
                                                            <Pencil size={14} />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => {
                                                                setResetUserId(user.id);
                                                                setResetUserEmail(user.email);
                                                                setResetPassword('');
                                                                setResetPasswordConfirm('');
                                                                setResetOpen(true);
                                                            }}
                                                            className="text-primary hover:bg-primary/10 h-8 w-8 p-0"
                                                            title="Passwort zurücksetzen"
                                                        >
                                                            <KeyRound size={14} />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleToggleStatus(user)}
                                                            disabled={user.id === pb.authStore.record?.id}
                                                            className={!user.deactivated || user.id === pb.authStore.record?.id ? 'text-destructive hover:bg-destructive/10 h-8 w-8 p-0' : 'text-emerald-400 hover:bg-emerald-500/10 h-8 w-8 p-0'}
                                                            title={!user.deactivated ? 'Deaktivieren' : 'Aktivieren'}
                                                        >
                                                            {!user.deactivated || user.id === pb.authStore.record?.id ? <Ban size={14} /> : <CheckCircle size={14} />}
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDelete(user)}
                                                            disabled={user.id === pb.authStore.record?.id}
                                                            className="text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                                                            title="Benutzer löschen"
                                                        >
                                                            <Trash2 size={14} />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

            </div>

            {/* Invite User Dialog */}
            <Dialog open={inviteOpen} onOpenChange={(open) => {
                setInviteOpen(open);
                if (!open) {
                    setInviteEmail('');
                    setInviteName('');
                    setInviteRole('employee');
                    setInviteSupervisor('none');
                }
            }}>
                <DialogContent className="sm:max-w-md border-border bg-background">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <UserPlus size={18} className="text-primary" />
                            Mitarbeiter anlegen
                        </DialogTitle>
                        <DialogDescription>
                            Erstelle ein neues Benutzerkonto. Der Mitarbeiter erhält einen Einladungs-Link per E-Mail.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleInvite} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="invite-email">E-Mail-Adresse *</Label>
                            <Input
                                id="invite-email"
                                type="email"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                placeholder="name@vibeforce.de"
                                className="bg-card border-border"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="invite-name">Vollständiger Name</Label>
                            <Input
                                id="invite-name"
                                value={inviteName}
                                onChange={(e) => setInviteName(e.target.value)}
                                placeholder="Max Mustermann"
                                className="bg-card border-border"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="invite-role">Rolle</Label>
                                <Select value={inviteRole} onValueChange={(val) => val && setInviteRole(val)}>
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

                            <div className="space-y-2">
                                <Label htmlFor="invite-hours">Soll-Stunden / Woche</Label>
                                <Input
                                    id="invite-hours"
                                    type="number"
                                    min="1"
                                    max="60"
                                    value={inviteWeeklyHours}
                                    onChange={(e) => setInviteWeeklyHours(Number(e.target.value))}
                                    className="bg-card border-border"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="invite-supervisor">Vorgesetzter</Label>
                            <Select value={inviteSupervisor} onValueChange={(val) => val && setInviteSupervisor(val)}>
                                <SelectTrigger className="bg-card border-border">
                                    <SelectValue placeholder="Kein Vorgesetzter" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Kein Vorgesetzter</SelectItem>
                                    {users.filter(u => u.role !== 'client').map(u => (
                                        <SelectItem key={u.id} value={u.id}>
                                            {getUserDisplayName(u)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <DialogFooter className="pt-2">
                            <Button type="button" variant="outline" onClick={() => setInviteOpen(false)}>
                                Abbrechen
                            </Button>
                            <Button type="submit" disabled={inviting}>
                                {inviting && <Loader2 size={14} className="animate-spin mr-2" />}
                                <Mail size={14} className="mr-1.5" />
                                {inviting ? 'Wird erstellt...' : 'Mitarbeiter anlegen'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Fallback Dialog */}
            <Dialog open={fallbackOpen} onOpenChange={setFallbackOpen}>
                <DialogContent className="sm:max-w-md border-border bg-background">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle size={18} className="text-amber-400" />
                            E-Mail-Hinweis
                        </DialogTitle>
                        <DialogDescription>
                            Benutzerkonto für <strong>{fallbackEmail}</strong> wurde angelegt.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
                        {fallbackPassword}
                    </div>

                    <DialogFooter>
                        <Button onClick={() => setFallbackOpen(false)}>
                            Verstanden
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reset Password Dialog */}
            <Dialog open={resetOpen} onOpenChange={(open) => { setResetOpen(open); if (!open) { setResetPassword(''); setResetPasswordConfirm(''); } }}>
                <DialogContent className="sm:max-w-md border-border bg-background">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <KeyRound size={18} className="text-primary" />
                            Passwort zurücksetzen
                        </DialogTitle>
                        <DialogDescription>
                            Neues Passwort für <strong>{resetUserEmail}</strong> vergeben.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleResetPassword} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="reset-password">Neues Passwort *</Label>
                            <Input
                                id="reset-password"
                                type="password"
                                value={resetPassword}
                                onChange={(e) => setResetPassword(e.target.value)}
                                placeholder="Mindestens 8 Zeichen"
                                className="bg-card border-border"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="reset-password-confirm">Passwort bestätigen *</Label>
                            <Input
                                id="reset-password-confirm"
                                type="password"
                                value={resetPasswordConfirm}
                                onChange={(e) => setResetPasswordConfirm(e.target.value)}
                                placeholder="Passwort wiederholen"
                                className="bg-card border-border"
                                required
                            />
                        </div>

                        <DialogFooter className="pt-2">
                            <Button type="button" variant="outline" onClick={() => setResetOpen(false)}>
                                Abbrechen
                            </Button>
                            <Button type="submit" disabled={resetting}>
                                {resetting && <Loader2 size={14} className="animate-spin mr-2" />}
                                Passwort speichern
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit User Dialog */}
            <Dialog open={editOpen} onOpenChange={(open) => { setEditOpen(open); if (!open) { setEditName(''); setEditEmail(''); setEditRole('employee'); } }}>
                <DialogContent className="sm:max-w-md border-border bg-background">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Pencil size={18} className="text-primary" />
                            Benutzer bearbeiten
                        </DialogTitle>
                        <DialogDescription>
                            Stammdaten von <strong>{editEmail}</strong> ändern.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleEdit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-user-name">Vollständiger Name *</Label>
                            <Input
                                id="edit-user-name"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                placeholder="Max Mustermann"
                                className="bg-card border-border"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
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
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-user-supervisor">Vorgesetzter</Label>
                            <Select value={editSupervisor} onValueChange={(val) => val && setEditSupervisor(val)}>
                                <SelectTrigger className="bg-card border-border">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Kein Vorgesetzter</SelectItem>
                                    {users
                                        .filter(u => u.id !== editUserId && u.role !== 'client')
                                        .map(u => (
                                            <SelectItem key={u.id} value={u.id}>
                                                {getUserDisplayName(u)}
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <DialogFooter className="pt-2">
                            <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                                Abbrechen
                            </Button>
                            <Button type="submit" disabled={editing}>
                                {editing && <Loader2 size={14} className="animate-spin mr-2" />}
                                Speichern
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
