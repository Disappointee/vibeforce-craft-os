'use client';

import { useState } from 'react';
import { pb } from '@/lib/pocketbase';
import { Loader2 } from 'lucide-react';
import { ClientResponseError } from 'pocketbase';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { t } from '@/lib/i18n';

type Status = 'idle' | 'loading' | 'success' | 'error';

export function ForgotPasswordDialog({
    open,
    onOpenChange,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<Status>('idle');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email.trim()) return;

        setStatus('loading');

        try {
            await pb.collection('users').requestPasswordReset(email.trim());
            setStatus('success');
        } catch (error) {
            const _err = error as ClientResponseError;
            console.error('[ForgotPassword]', _err);
            setStatus('error');
        }
    };

    const handleBackToLogin = () => {
        setStatus('idle');
        setEmail('');
        onOpenChange(false);
    };

    const handleOpenChange = (nextOpen: boolean) => {
        if (!nextOpen) {
            setStatus('idle');
            setEmail('');
        }
        onOpenChange(nextOpen);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[400px] bg-background border-border text-foreground">
                <DialogHeader>
                    <DialogTitle>{t('auth.forgotPassword.title')}</DialogTitle>
                    <DialogDescription>
                        {t('auth.forgotPassword.desc')}
                    </DialogDescription>
                </DialogHeader>

                {status === 'success' ? (
                    <div className="space-y-6 pt-4">
                        <div className="rounded-lg bg-primary/10 p-4 text-sm text-foreground">
                            <p className="font-medium">{t('auth.forgotPassword.success')}</p>
                            <p className="mt-1 text-muted-foreground">
                                {t('auth.forgotPassword.successDesc')}
                            </p>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full min-h-[44px] transition-all duration-150"
                            onClick={handleBackToLogin}
                        >
                            {t('auth.forgotPassword.backToLogin')}
                        </Button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                        <div className="space-y-2">
                            <Label
                                htmlFor="forgot-email"
                                className="text-xs uppercase tracking-[0.06em] text-foreground"
                            >
                                {t('auth.forgotPassword.email')}
                            </Label>
                            <Input
                                id="forgot-email"
                                type="email"
                                placeholder="max@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoComplete="email"
                                className="bg-card border-border"
                            />
                        </div>

                        {status === 'error' && (
                            <p className="text-sm text-destructive">
                                {t('auth.forgotPassword.smtpError')}
                            </p>
                        )}

                        <Button
                            type="submit"
                            disabled={status === 'loading'}
                            className="w-full min-h-[44px] transition-all duration-150"
                        >
                            {status === 'loading' && (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            )}
                            {t('auth.forgotPassword.submit')}
                        </Button>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
