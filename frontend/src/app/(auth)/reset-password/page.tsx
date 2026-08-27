'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { pb } from '@/lib/pocketbase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, ArrowRight } from 'lucide-react';
import { t } from '@/lib/i18n';
import { ClientResponseError } from 'pocketbase';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenExpired, setTokenExpired] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError(t('auth.resetPassword.passwordRules'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t('auth.resetPassword.mismatch'));
      return;
    }

    setIsLoading(true);

    try {
      await pb.collection('users').confirmPasswordReset(token!, newPassword, confirmPassword);
      toast.success(t('auth.resetPassword.success'), {
        description: t('auth.resetPassword.successDesc'),
      });
      router.push('/login');
    } catch (err) {
      const pbError = err as ClientResponseError;
      console.error(pbError);
      setTokenExpired(true);
    } finally {
      setIsLoading(false);
    }
  };

  const requestNewLink = (
    <a href="/login" className="inline-block mt-4 text-sm text-primary/80 font-medium hover:text-primary transition-all duration-150">
      {t('auth.resetPassword.requestNew')}
    </a>
  );

  if (!token) {
    return (
      <div className="text-center space-y-3 py-4">
        <p className="text-lg font-semibold text-foreground">{t('auth.resetPassword.invalidToken')}</p>
        <p className="text-muted-foreground">{t('auth.resetPassword.invalidTokenDesc')}</p>
        {requestNewLink}
      </div>
    );
  }

  if (tokenExpired) {
    return (
      <div className="text-center space-y-3 py-4">
        <p className="text-lg font-semibold text-foreground">{t('auth.resetPassword.expiredToken')}</p>
        <p className="text-muted-foreground">{t('auth.resetPassword.expiredTokenDesc')}</p>
        {requestNewLink}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg p-3">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="newPassword" className="text-muted-foreground ml-1 text-xs uppercase tracking-[0.06em] font-bold">
          {t('auth.resetPassword.newPassword')}
        </Label>
        <Input
          id="newPassword"
          type="password"
          required
          minLength={8}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="bg-background/50 border-border h-12 rounded-2xl px-4 focus:border-primary/50 transition-all focus:ring-primary/20"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword" className="text-muted-foreground ml-1 text-xs uppercase tracking-[0.06em] font-bold">
          {t('auth.resetPassword.confirmPassword')}
        </Label>
        <Input
          id="confirmPassword"
          type="password"
          required
          minLength={8}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="bg-background/50 border-border h-12 rounded-2xl px-4 focus:border-primary/50 transition-all focus:ring-primary/20"
        />
      </div>

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl font-bold text-base shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all flex items-center justify-center group min-h-[44px]"
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <>
            {t('auth.resetPassword.submit')}
            <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
          </>
        )}
      </Button>
    </form>
  );
}

function ResetPasswordLoading() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/30 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/30 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-[420px] z-10 animate-in fade-in zoom-in-95 duration-700">
        <div className="text-center mb-10 space-y-3">
          <div className="inline-flex h-24 w-24 items-center justify-center rounded-3xl bg-white dark:bg-white border border-border shadow-2xl mb-4 p-3 animate-in zoom-in duration-1000">
            <img src="/logo-vfos.svg" alt="Vibeforce Flow OS Logo" className="h-full w-full object-contain invert-0 dark:brightness-0 dark:invert" />
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-foreground">{t('auth.resetPassword.title')}</h1>
          <p className="text-muted-foreground font-medium">{t('auth.resetPassword.desc')}</p>
        </div>

        <div className="bg-card/40 backdrop-blur-2xl border border-border p-8 rounded-[2.5rem] shadow-2xl">
          <Suspense fallback={<ResetPasswordLoading />}>
            <ResetPasswordForm />
          </Suspense>
        </div>

        <p className="text-center mt-8 text-sm text-muted-foreground">
          <a href="/login" className="text-primary/80 font-medium hover:text-primary transition-all duration-150">
            {t('auth.resetPassword.requestNew')}
          </a>
        </p>
      </div>

      <div className="text-muted-foreground text-[10px] uppercase tracking-[0.2em] font-black mt-auto pb-8 pt-8">
        {t('auth.login.selfHosted')}
      </div>
    </div>
  );
}
