'use client';

import { useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { t } from '@/lib/i18n';

export function ContactAdminDialog({
    open,
    onOpenChange,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const [email, setEmail] = useState('');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorType, setErrorType] = useState<'rateLimit' | 'generic' | null>(null);
    const websiteRef = useRef<HTMLInputElement>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const website = websiteRef.current?.value ?? '';
        if (website) return;

        setStatus('loading');
        setErrorType(null);

        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_POCKETBASE_URL}/api/custom/contact-admin`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, subject, message, website }),
                }
            );

            if (res.ok) {
                setStatus('success');
                setTimeout(() => {
                    onOpenChange(false);
                    setStatus('idle');
                    setEmail('');
                    setSubject('');
                    setMessage('');
                }, 2000);
            } else if (res.status === 429) {
                setStatus('error');
                setErrorType('rateLimit');
            } else {
                setStatus('error');
                setErrorType('generic');
            }
        } catch {
            setStatus('error');
            setErrorType('generic');
        }
    };

    const handleOpenChange = (newOpen: boolean) => {
        if (status === 'loading') return;
        if (!newOpen) {
            setStatus('idle');
            setErrorType(null);
            setEmail('');
            setSubject('');
            setMessage('');
        }
        onOpenChange(newOpen);
    };

    const isLoading = status === 'loading';
    const isSuccess = status === 'success';

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[440px]">
                <DialogHeader>
                    <DialogTitle>{t('auth.contactAdmin.title')}</DialogTitle>
                    <DialogDescription>{t('auth.contactAdmin.desc')}</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-5 pt-2">
                    <input
                        ref={websiteRef}
                        type="text"
                        name="website"
                        tabIndex={-1}
                        autoComplete="off"
                        style={{ position: 'absolute', left: '-9999px' }}
                        aria-hidden="true"
                    />

                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-xs uppercase tracking-[0.06em] text-foreground">
                            {t('auth.contactAdmin.email')} <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="name@example.com"
                            className="bg-card border-border min-h-[44px]"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="subject" className="text-xs uppercase tracking-[0.06em] text-foreground">
                            {t('auth.contactAdmin.subject')} <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="subject"
                            type="text"
                            required
                            maxLength={200}
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            className="bg-card border-border min-h-[44px]"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="message" className="text-xs uppercase tracking-[0.06em] text-foreground">
                            {t('auth.contactAdmin.message')} <span className="text-destructive">*</span>
                        </Label>
                        <textarea
                            id="message"
                            required
                            maxLength={2000}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={5}
                            className="w-full min-h-[44px] rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm text-foreground placeholder:text-muted-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 resize-none dark:bg-input/30"
                        />
                    </div>

                    {status === 'error' && (
                        <p className="text-sm text-destructive">
                            {errorType === 'rateLimit'
                                ? t('auth.contactAdmin.rateLimit')
                                : t('auth.contactAdmin.error')}
                        </p>
                    )}

                    {status === 'success' && (
                        <p className="text-sm text-emerald-600 dark:text-emerald-400">
                            {t('auth.contactAdmin.success')} — {t('auth.contactAdmin.successDesc')}
                        </p>
                    )}

                    <p className="text-xs text-muted-foreground">
                        {t('auth.contactAdmin.privacy')}
                    </p>

                    <DialogFooter>
                        <Button
                            type="submit"
                            disabled={isLoading || isSuccess}
                            className="w-full min-h-[44px]"
                        >
                            {isLoading && <Loader2 className="size-4 animate-spin" />}
                            {t('auth.contactAdmin.submit')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
