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
import { Users, UserPlus, Shield, Loader2, Ban, CheckCircle, Mail, Trash2, KeyRound, Copy, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { USER_ROLES, USER_ROLE_LABEL_MAP, labelFor } from '@/lib/constants';
import {
    updateUserRoleAction,
    toggleUserActiveAction,
    deleteUserAdminAction,
    createUserAction,
    resetUserPasswordAction,
    updateUserSupervisorAction,
} from '@/app/actions/admin-users';

interface UserItem {
    id: string;
    email: string;
    name?: string;
    role?: string;
    supervisor?: string;
    avatar?: string;
    verified: boolean;
    created: string;
    language?: string;
    expand?: {
        supervisor?: {
            id: string;
            name?: string;
            email: string;
        };
    };
}

export default function AdminUsersPage() {
    const router = useRouter();
    const [users, setUsers] = useState<UserItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    // Invite dialog
    const [inviteOpen, setInviteOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteName, setInviteName] = useState('');
    const [inviteRole, setInviteRole] = useState('employee');
    const [inviteSupervisor, setInviteSupervisor] = useState<string>('none');
    const [inviteHourlyRate, setInviteHourlyRate] = useState('');
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
            const result = await pb.collection('users').getList(1, 100, {
                sort: '-created',
                expand: 'supervisor',
            });
            setUsers(result.items as unknown as UserItem[]);
        } catch (error) {
            console.error('Error loading users:', error);
            toast.error('Fehler beim Laden der Benutzer');
        }
    };

    const handleSupervisorChange = async (userId: string, supervisorId: string) => {
        const targetId = supervisorId === 'none' ? null : supervisorId;
        try {
            const res = await updateUserSupervisorAction(userId, targetId);
            if (res?.error) throw new Error(res.error);
            toast.success('Zuständiger Admin erfolgreich zugewiesen');
            await loadUsers();
        } catch (error: any) {
            console.error('Supervisor update error:', error);
            toast.error(error?.message || 'Fehler beim Zuweisen des Admins');
        }
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!inviteEmail) {
            toast.error('Bitte E-Mail-Adresse eingeben');
            return;
        }

        setInviting(true);
        try {
            const generatedPw = crypto.randomUUID() + '!Aa1';

            try {
                const res = await createUserAction({
                    email: inviteEmail,
                    password: generatedPw,
                    passwordConfirm: generatedPw,
                    name: inviteName || undefined,
                    role: inviteRole,
                    supervisor: inviteSupervisor === 'none' ? null : inviteSupervisor,
                    stundenhonorar: inviteHourlyRate ? Number(inviteHourlyRate) : null,
                    hourly_rate: inviteHourlyRate ? Number(inviteHourlyRate) : null,
                    emailVisibility: true,
                });
                if (res?.error) throw new Error(res.error);
                
                if (res?.smtpFailed) {
                    setFallbackEmail(inviteEmail);
                    setFallbackPassword(generatedPw);
                    setFallbackOpen(true);
                } else {
                    toast.success(`Benutzer erstellt. E-Mail mit Set-Link wurde an ${inviteEmail} gesendet.`);
                }
            } catch (actionErr: any) {
                throw actionErr;
            }

            setInviteOpen(false);
            setInviteEmail('');
            setInviteName('');
            setInviteRole('employee');
            setInviteSupervisor('none');
            setInviteHourlyRate('');
            await loadUsers();
        } catch (error: any) {
            console.error('Invite error:', error);
            if (error?.data?.data?.email?.code === 'validation_invalid_email') {
                toast.error('Ungültige E-Mail-Adresse');
            } else if (error?.data?.data?.email?.code === 'validation_unique_email') {
                toast.error('Ein Benutzer mit dieser E-Mail existiert bereits');
            } else {
                toast.error(error?.message || 'Fehler beim Erstellen des Benutzers');
            }
        } finally {
            setInviting(false);
        }
    };

    const handleToggleStatus = async (user: UserItem) => {
        if (user.id === pb.authStore.record?.id) {
            toast.error('Du kannst dich nicht selbst deaktivieren');
            return;
        }

        try {
            const res = await toggleUserActiveAction(user.id, !user.verified);
            if (res?.error) throw new Error(res.error);
            toast.success(`Benutzer ${user.verified ? 'deaktiviert' : 'aktiviert'}`);
            await loadUsers();
        } catch (error: any) {
            console.error('Toggle status error:', error);
            toast.error(error?.message || 'Fehler beim Ändern des Status');
        }
    };

    const handleRoleChange = async (userId: string, newRole: string) => {
        if (userId === pb.authStore.record?.id && newRole !== 'admin') {
            toast.error('Du kannst dir selbst nicht die Admin-Rolle entziehen');
            return;
        }

        try {
            const res = await updateUserRoleAction(userId, newRole);
            if (res?.error) throw new Error(res.error);
            toast.success('Rolle erfolgreich aktualisiert');
            await loadUsers();
        } catch (error: any) {
            console.error('Role change error:', error);
            toast.error(error?.message || 'Fehler beim Ändern der Rolle');
        }
    };

    const handleDelete = async (user: UserItem) => {
        if (user.id === pb.authStore.record?.id) {
            toast.error('Du kannst dich nicht selbst löschen');
            return;
        }

        if (!confirm(`Möchtest du "${user.name || user.email}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`)) return;

        try {
            const res = await deleteUserAdminAction(user.id);
            if (res?.error) throw new Error(res.error);
            toast.success(`Benutzer "${user.name || user.email}" gelöscht`);
            await loadUsers();
        } catch (error: any) {
            console.error('Delete error:', error);
            toast.error(error?.message || 'Fehler beim Löschen des Benutzers');
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
            const res = await resetUserPasswordAction(resetUserId, {
                password: resetPassword,
                passwordConfirm: resetPasswordConfirm,
            });
            if (res?.error) throw new Error(res.error);
            toast.success(`Passwort für ${resetUserEmail} zurückgesetzt`);
            setResetOpen(false);
            setResetUserId('');
            setResetUserEmail('');
            setResetPassword('');
            setResetPasswordConfirm('');
        } catch (error: any) {
            console.error('Reset password error:', error);
            toast.error(error?.message || 'Fehler beim Zurücksetzen des Passworts');
        } finally {
            setResetting(false);
        }
    };

    const ROLE_LABELS_FALLBACK: Record<string, string> = {
        freelancer: 'Freelancer',
    };

    const getRoleBadge = (role?: string) => {
        let label: string;
        if (!role) {
            label = '—';
        } else if ((USER_ROLES as readonly string[]).includes(role)) {
            label = labelFor(USER_ROLE_LABEL_MAP, role as (typeof USER_ROLES)[number]);
        } else {
            label = ROLE_LABELS_FALLBACK[role] || role;
        }
        switch (role) {
            case 'admin':
                return <Badge variant="default" className="bg-indigo-500/20 text-indigo-400 border-indigo-500/30">{label}</Badge>;
            case 'manager':
                return <Badge variant="default" className="bg-amber-500/10 text-amber-400 border-amber-500/30">{label}</Badge>;
            case 'employee':
                return <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">{label}</Badge>;
            case 'freelancer':
                return <Badge variant="outline" className="text-orange-400 border-orange-500/20">{label}</Badge>;
            case 'client':
                return <Badge variant="ghost" className="text-muted-foreground">{label}</Badge>;
            default:
                return <Badge variant="outline">{label}</Badge>;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
                    <p className="text-muted-foreground font-medium tracking-wide">Lade Benutzer...</p>
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
                            <Shield size={24} className="text-indigo-400" />
                            Benutzerverwaltung
                        </h1>
                        <p className="text-muted-foreground mt-1 text-sm">Benutzer einladen, verwalten und deaktivieren</p>
                    </div>
                    <Button onClick={() => setInviteOpen(true)}>
                        <UserPlus size={16} />
                        Mitarbeiter anlegen
                    </Button>
                </div>

                {/* Users Table */}
                <Card className="border-border bg-card/40">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                                <Users size={18} />
                            </div>
                            <div>
                                <CardTitle>Alle Benutzer ({users.length})</CardTitle>
                                <CardDescription>Verwalte Rollen und Status der Benutzer</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-border">
                                    <TableHead className="text-muted-foreground">Benutzer</TableHead>
                                    <TableHead className="text-muted-foreground">Rolle</TableHead>
                                    <TableHead className="text-muted-foreground">Zuständiger Admin</TableHead>
                                    <TableHead className="text-muted-foreground">Status</TableHead>
                                    <TableHead className="text-muted-foreground">Erstellt</TableHead>
                                    <TableHead className="text-muted-foreground text-right">Aktionen</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                                            <Users size={32} className="mx-auto mb-2 opacity-30" />
                                            Keine Benutzer gefunden
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    users.map((user) => (
                                        <TableRow key={user.id} className="border-border/50 hover:bg-muted/20">
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
                                                        {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-foreground">
                                                            {user.name || 'Kein Name'}
                                                            {user.id === pb.authStore.record?.id && (
                                                                <span className="ml-2 text-xs text-indigo-400">(Du)</span>
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
                                                    <SelectTrigger className="w-32 h-7 text-xs bg-background border-border">
                                                        <span>
                                                            {ROLE_LABELS_FALLBACK[user.role || 'employee'] || 
                                                                ((USER_ROLES as readonly string[]).includes(user.role || 'employee') 
                                                                    ? labelFor(USER_ROLE_LABEL_MAP, (user.role || 'employee') as any) 
                                                                    : (user.role || 'employee'))
                                                            }
                                                        </span>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {(USER_ROLES as readonly string[]).map(r => (
                                                            <SelectItem key={r} value={r}>{labelFor(USER_ROLE_LABEL_MAP, r as (typeof USER_ROLES)[number])}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell>
                                                <Select
                                                    value={user.supervisor || 'none'}
                                                    onValueChange={(val) => handleSupervisorChange(user.id, val)}
                                                >
                                                    <SelectTrigger className="w-40 h-7 text-xs bg-background border-border">
                                                        <SelectValue placeholder="Zuständiger Admin">
                                                            {(value: string) => {
                                                                if (value === 'none' || !value) return 'Kein Lead (GL)';
                                                                const lead = users.find(u => u.id === value);
                                                                return lead ? (lead.name || lead.email) : 'Lead zugewiesen';
                                                            }}
                                                        </SelectValue>
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-background border-border text-foreground">
                                                        <SelectItem value="none">Kein Lead (GL)</SelectItem>
                                                        {users
                                                            .filter(u => (u.role === 'admin' || u.role === 'manager') && u.id !== user.id)
                                                            .map(adminUser => (
                                                                <SelectItem key={adminUser.id} value={adminUser.id}>
                                                                    {adminUser.name || adminUser.email} ({adminUser.role})
                                                                </SelectItem>
                                                            ))}
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell>
                                                {user.verified || user.id === pb.authStore.record?.id ? (
                                                    <Badge variant="default" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                                                        <CheckCircle size={12} className="mr-1" />
                                                        Aktiv
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="destructive" className="bg-red-500/10 text-red-400 border-red-500/20">
                                                        <Ban size={12} className="mr-1" />
                                                        Deaktiviert
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm text-muted-foreground">
                                                    {new Date(user.created).toLocaleDateString('de-DE')}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="xs"
                                                        onClick={() => {
                                                            setResetUserId(user.id);
                                                            setResetUserEmail(user.email);
                                                            setResetPassword('');
                                                            setResetPasswordConfirm('');
                                                            setResetOpen(true);
                                                        }}
                                                        className="text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10"
                                                        title="Passwort zurücksetzen"
                                                    >
                                                        <KeyRound size={14} />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="xs"
                                                        onClick={() => handleToggleStatus(user)}
                                                        disabled={user.id === pb.authStore.record?.id}
                                                        className={user.verified || user.id === pb.authStore.record?.id ? 'text-red-400 hover:text-red-300 hover:bg-red-500/10' : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10'}
                                                    >
                                                        {user.verified || user.id === pb.authStore.record?.id ? <Ban size={14} /> : <CheckCircle size={14} />}
                                                        {user.verified || user.id === pb.authStore.record?.id ? 'Deaktivieren' : 'Aktivieren'}
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="xs"
                                                        onClick={() => handleDelete(user)}
                                                        disabled={user.id === pb.authStore.record?.id}
                                                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                                    >
                                                        <Trash2 size={14} />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
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
                }
            }}>
                <DialogContent className="sm:max-w-md border-border bg-background">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <UserPlus size={18} className="text-indigo-400" />
                            Mitarbeiter anlegen
                        </DialogTitle>
                        <DialogDescription>
                            Lege einen neuen Mitarbeiter an. Der Benutzer erhält eine E-Mail zum Setzen seines Passworts.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleInvite} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="invite-email">E-Mail *</Label>
                            <Input
                                id="invite-email"
                                type="email"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                placeholder="max@example.com"
                                className="bg-card border-border"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="invite-name">Name</Label>
                            <Input
                                id="invite-name"
                                value={inviteName}
                                onChange={(e) => setInviteName(e.target.value)}
                                placeholder="Max Mustermann"
                                className="bg-card border-border"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="invite-role">Rolle</Label>
                            <Select value={inviteRole} onValueChange={(val) => val && setInviteRole(val)}>
                                <SelectTrigger className="bg-card border-border">
                                    <span>{ROLE_LABELS_FALLBACK[inviteRole || 'employee']}</span>
                                </SelectTrigger>
                                <SelectContent>
                                    {(USER_ROLES as readonly string[]).map(r => (
                                        <SelectItem key={r} value={r}>{labelFor(USER_ROLE_LABEL_MAP, r as (typeof USER_ROLES)[number])}</SelectItem>
                                    ))}
                                    <SelectItem value="freelancer">Freelancer</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="invite-supervisor">Zuständiger Admin / Lead</Label>
                            <Select value={inviteSupervisor} onValueChange={setInviteSupervisor}>
                                <SelectTrigger id="invite-supervisor" className="bg-card border-border">
                                    <SelectValue placeholder="Lead auswählen">
                                        {(value: string) => {
                                            if (value === 'none' || !value) return 'Kein Lead (GL)';
                                            const lead = users.find(u => u.id === value);
                                            return lead ? `${lead.name || lead.email} (${lead.role})` : 'Lead ausgewählt';
                                        }}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent className="bg-background border-border text-foreground">
                                    <SelectItem value="none">Kein Lead (Direkt Geschäftsleitung)</SelectItem>
                                    {users
                                        .filter(u => u.role === 'admin' || u.role === 'manager')
                                        .map(adminUser => (
                                            <SelectItem key={adminUser.id} value={adminUser.id}>
                                                {adminUser.name || adminUser.email} ({adminUser.role})
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="invite-rate">Stundensatz (€/h)</Label>
                            <Input
                                id="invite-rate"
                                type="number"
                                value={inviteHourlyRate}
                                onChange={(e) => setInviteHourlyRate(e.target.value)}
                                placeholder="z.B. 90"
                                className="bg-card border-border"
                            />
                        </div>

                        <DialogFooter className="pt-2">
                            <Button type="button" variant="outline" onClick={() => setInviteOpen(false)}>
                                Abbrechen
                            </Button>
                            <Button type="submit" disabled={inviting}>
                                {inviting && <Loader2 size={14} className="animate-spin" />}
                                <Mail size={14} />
                                {inviting ? 'Wird erstellt...' : 'Mitarbeiter anlegen'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Fallback: SMTP not configured – show generated password */}
            <Dialog open={fallbackOpen} onOpenChange={setFallbackOpen}>
                <DialogContent className="sm:max-w-md border-border bg-background">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle size={18} className="text-amber-400" />
                            E-Mail-Versand nicht verfügbar
                        </DialogTitle>
                        <DialogDescription>
                            Das System konnte keine E-Mail an <strong>{fallbackEmail}</strong> senden, da kein SMTP-Server konfiguriert ist.
                            Bitte teile dem Benutzer das folgende temporäre Passwort mit:
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3">
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                            <code className="flex-1 text-sm font-mono text-amber-400 break-all select-all">
                                {fallbackPassword}
                            </code>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    navigator.clipboard.writeText(fallbackPassword);
                                    toast.success('Passwort kopiert');
                                }}
                                className="shrink-0 border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                            >
                                <Copy size={14} className="mr-1" />
                                Kopieren
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Der Benutzer kann das Passwort nach der ersten Anmeldung in seinem Profil ändern.
                        </p>
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
                            <KeyRound size={18} className="text-indigo-400" />
                            Passwort zurücksetzen
                        </DialogTitle>
                        <DialogDescription>
                            Neues Passwort für <strong>{resetUserEmail}</strong> vergeben. Der Benutzer wird beim nächsten Login das neue Passwort verwenden müssen.
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
                                {resetting ? 'Wird gespeichert...' : 'Passwort speichern'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
