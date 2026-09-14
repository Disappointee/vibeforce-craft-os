'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { Users, UserPlus, Shield, Loader2, Ban, CheckCircle, Mail, Trash2, KeyRound, Copy, AlertTriangle, Hammer } from 'lucide-react';
import { toast } from 'sonner';
import {
    USER_ROLES,
    USER_ROLE_LABEL_MAP,
    labelFor,
    CRAFT_ROLE_OPTIONS,
    CRAFT_TRADES,
    getCraftRoleLabel,
    getCraftRoleBadgeClasses,
    type CraftRole,
} from '@/lib/constants';
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
    deactivated?: boolean;
    created: string;
    language?: string;
    expertise?: string[];
    hourly_rate?: number;
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
    const searchParams = useSearchParams();
    const [users, setUsers] = useState<UserItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    // Invite dialog
    const [inviteOpen, setInviteOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteName, setInviteName] = useState('');
    const [inviteRole, setInviteRole] = useState<string>('geselle');
    const [inviteTrade, setInviteTrade] = useState<string>('none');
    const [inviteSupervisor, setInviteSupervisor] = useState<string>('none');
    const [inviteHourlyRate, setInviteHourlyRate] = useState('64');
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

    useEffect(() => {
        if (searchParams.get('invite') === 'true') {
            setInviteOpen(true);
        }
    }, [searchParams]);

    const checkAuth = async () => {
        if (!pb.authStore.isValid) {
            router.push('/login');
            return;
        }
        try {
            const record = await pb.collection('users').authRefresh();
            const userRole = record.record?.role;
            if (userRole !== 'admin' && userRole !== 'meister') {
                toast.error('Zugriff verweigert. Nur Administratoren und Meister können diese Seite aufrufen.');
                router.push('/craft');
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

        const currentlyActive = !user.deactivated;
        const targetActiveState = !currentlyActive;
        const targetDeactivated = !targetActiveState;

        // Optimistic UI update
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, deactivated: targetDeactivated } : u));

        try {
            const res = await toggleUserActiveAction(user.id, targetActiveState);
            if (res?.error) {
                // Fallback via client SDK
                await pb.collection('users').update(user.id, { deactivated: targetDeactivated });
            }
            toast.success(`Benutzer ${targetActiveState ? 'aktiviert' : 'deaktiviert'}`);
            await loadUsers();
        } catch (error: any) {
            console.error('Toggle status error:', error);
            toast.error(error?.message || 'Fehler beim Ändern des Status');
            await loadUsers();
        }
    };

    const handleRoleChange = async (userId: string, newRole: string) => {
        if (userId === pb.authStore.record?.id && newRole !== 'admin') {
            toast.error('Du kannst dir selbst nicht die Admin-Rolle entziehen');
            return;
        }

        // Optimistic UI update
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));

        try {
            const res = await updateUserRoleAction(userId, newRole);
            if (res?.error) {
                // Fallback via client SDK if server action had a session error
                await pb.collection('users').update(userId, { role: newRole });
            }
            toast.success('Rolle erfolgreich aktualisiert');
            await loadUsers();
        } catch (error: any) {
            console.error('Role change error:', error);
            toast.error(error?.message || 'Fehler beim Ändern der Rolle');
            await loadUsers();
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

    const getRoleBadge = (role?: string) => {
        const label = getCraftRoleLabel(role, 'craft');
        const badgeClasses = getCraftRoleBadgeClasses(role);
        return <Badge variant="outline" className={badgeClasses}>{label}</Badge>;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
                    <p className="text-muted-foreground font-medium tracking-wide">Lade Monteure & Benutzer...</p>
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
                            <Shield size={24} className="text-amber-500" />
                            Personal- & Monteurverwaltung
                        </h1>
                        <p className="text-muted-foreground mt-1 text-sm">
                            Handwerker-Rollen, Kalkulationsstundensätze und Zugangsdaten verwalten
                        </p>
                    </div>
                    <Button onClick={() => setInviteOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold flex items-center gap-2 cursor-pointer shadow-md shadow-primary/20">
                        <UserPlus size={16} />
                        Monteur anlegen
                    </Button>
                </div>

                {/* Users Table */}
                <Card className="border-border bg-card/40">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Alle Monteure & Mitarbeiter</CardTitle>
                        <CardDescription>
                            {users.length} {users.length === 1 ? 'Benutzer' : 'Benutzer'} im System registriert
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-border hover:bg-transparent">
                                    <TableHead className="w-[280px]">Handwerker / Benutzer</TableHead>
                                    <TableHead>Rolle & Funktion</TableHead>
                                    <TableHead>Zuständiger Lead</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Registriert am</TableHead>
                                    <TableHead className="text-right">Aktionen</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((user) => (
                                    <TableRow key={user.id} className="border-border">
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 rounded-full bg-muted/60 border border-border flex items-center justify-center font-bold text-xs shrink-0 text-foreground">
                                                    {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-foreground">
                                                        {user.name || 'Kein Name'}
                                                        {user.id === pb.authStore.record?.id && (
                                                            <span className="ml-2 text-xs text-amber-500">(Du)</span>
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
                                                <SelectTrigger className="w-44 h-7 text-xs bg-background border-border">
                                                    <span>{getCraftRoleLabel(user.role, 'craft')}</span>
                                                </SelectTrigger>
                                                <SelectContent className="bg-background border-border">
                                                    {CRAFT_ROLE_OPTIONS.map(opt => (
                                                        <SelectItem key={opt.value} value={opt.value} className="cursor-pointer text-xs">
                                                            {opt.label}
                                                        </SelectItem>
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
                                                 {!user.deactivated || user.id === pb.authStore.record?.id ? (
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
                                                         className={!user.deactivated || user.id === pb.authStore.record?.id ? 'text-red-400 hover:text-red-300 hover:bg-red-500/10' : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10'}
                                                     >
                                                         {!user.deactivated || user.id === pb.authStore.record?.id ? <Ban size={14} /> : <CheckCircle size={14} />}
                                                         {!user.deactivated || user.id === pb.authStore.record?.id ? 'Deaktivieren' : 'Aktivieren'}
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
                                     ))}
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
                            <Label htmlFor="invite-role">Handwerkliche Rolle</Label>
                            <Select
                                value={inviteRole}
                                onValueChange={(val) => {
                                    if (!val) return;
                                    setInviteRole(val);
                                    const opt = CRAFT_ROLE_OPTIONS.find(o => o.value === val);
                                    if (opt && opt.defaultHourlyRate > 0) {
                                        setInviteHourlyRate(String(opt.defaultHourlyRate));
                                    }
                                }}
                            >
                                <SelectTrigger className="bg-card border-border">
                                    <span>{getCraftRoleLabel(inviteRole, 'craft')}</span>
                                </SelectTrigger>
                                <SelectContent className="bg-background border-border max-h-60">
                                    {CRAFT_ROLE_OPTIONS.map(opt => (
                                        <SelectItem key={opt.value} value={opt.value} className="cursor-pointer">
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-xs text-foreground">{opt.label}</span>
                                                <span className="text-[10px] text-muted-foreground">{opt.description}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="invite-trade">Gewerk / Fachbereich (Optional)</Label>
                            <Select value={inviteTrade} onValueChange={setInviteTrade}>
                                <SelectTrigger id="invite-trade" className="bg-card border-border">
                                    <SelectValue placeholder="Gewerk auswählen">
                                        {inviteTrade === 'none' ? 'Kein spezifisches Gewerk' : CRAFT_TRADES.find(t => t.value === inviteTrade)?.label || inviteTrade}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent className="bg-background border-border max-h-60">
                                    <SelectItem value="none">Kein spezifisches Gewerk</SelectItem>
                                    {CRAFT_TRADES.map(trade => (
                                        <SelectItem key={trade.value} value={trade.value} className="cursor-pointer">
                                            {trade.label}
                                        </SelectItem>
                                    ))}
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
