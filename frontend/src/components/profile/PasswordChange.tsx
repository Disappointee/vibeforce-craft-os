'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Lock, Loader2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { updatePasswordAction } from '@/app/actions/profile';

export function PasswordChange() {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPasswords, setShowPasswords] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!currentPassword || !newPassword || !confirmPassword) {
            toast.error('Bitte alle Felder ausfüllen');
            return;
        }

        if (newPassword.length < 8) {
            toast.error('Neues Passwort muss mindestens 8 Zeichen lang sein');
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error('Die neuen Passwörter stimmen nicht überein');
            return;
        }

        setLoading(true);
        try {
            const result = await updatePasswordAction({
                oldPassword: currentPassword,
                password: newPassword,
                passwordConfirm: confirmPassword,
            });

            if (result.success) {
                toast.success('Passwort erfolgreich geändert');
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                toast.error(result.error || 'Fehler beim Ändern des Passworts');
            }
        } catch (error: any) {
            console.error('Password change error:', error);
            toast.error(error?.message || 'Fehler beim Ändern des Passworts');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="border-border bg-card/40">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                        <Lock size={18} />
                    </div>
                    <div>
                        <CardTitle>Passwort ändern</CardTitle>
                        <CardDescription>Ändere dein Passwort für die Anmeldung</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="current-password">Aktuelles Passwort</Label>
                        <div className="relative">
                            <Input
                                id="current-password"
                                type={showPasswords ? 'text' : 'password'}
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                placeholder="••••••••"
                                className="bg-background border-border pr-10"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="new-password">Neues Passwort</Label>
                        <div className="relative">
                            <Input
                                id="new-password"
                                type={showPasswords ? 'text' : 'password'}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="••••••••"
                                className="bg-background border-border pr-10"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirm-password">Neues Passwort bestätigen</Label>
                        <div className="relative">
                            <Input
                                id="confirm-password"
                                type={showPasswords ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                className="bg-background border-border pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPasswords(!showPasswords)}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                                {showPasswords ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 size={14} className="animate-spin" />}
                            {loading ? 'Wird geändert...' : 'Passwort ändern'}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
