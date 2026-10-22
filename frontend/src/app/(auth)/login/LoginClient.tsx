'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Hammer, ArrowRight, Sparkles } from 'lucide-react';
import { ForgotPasswordDialog } from '@/components/auth/ForgotPasswordDialog';
import { ContactAdminDialog } from '@/components/auth/ContactAdminDialog';
import { t } from '@/lib/i18n';
import { getAppConfig } from '@/config/app-mode';
import { pb } from '@/lib/pocketbase';

export function LoginClient({ initialCraftMode }: { initialCraftMode: boolean }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [forgotDialogOpen, setForgotDialogOpen] = useState(false);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const craftMode = initialCraftMode;
  const appConfig = getAppConfig(craftMode ? 'craft' : 'agency');

  // Zero-Click Demo Auto-Login Parameter Handler
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('auto') || params.get('demo') || params.get('guest')) {
        setIsDemoLoading(true);
        const slot = params.get('slot') === 'slot_b' ? 'slot_b' : 'slot_a';
        const redirect = params.get('redirect') || '';
        const target = `/api/auth/demo?slot=${slot}${redirect ? `&redirect=${encodeURIComponent(redirect)}` : ''}`;
        window.location.href = target;
      }
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || t('auth.login_error'));
      }

      if (data.token && data.record) {
        pb.authStore.save(data.token, data.record);
      }

      toast.success(t('auth.login.submit'));
      window.location.href = appConfig.startRoute;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('auth.login_error');
      toast.error(message);
      console.error('Login failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handle1ClickDemo = (slot: 'slot_a' | 'slot_b' = 'slot_a') => {
    setIsDemoLoading(true);
    window.location.href = `/api/auth/demo?slot=${slot}`;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">

      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/30 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]"></div>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-[440px] z-10 animate-in fade-in zoom-in-95 duration-700">
        <div className="text-center mb-8 space-y-3">
          {craftMode ? (
            <div className="inline-flex h-24 w-24 items-center justify-center rounded-3xl bg-amber-500/15 border border-amber-500/30 shadow-2xl mb-4 p-3 animate-in zoom-in duration-1000">
              <Hammer className="h-12 w-12 text-amber-500" />
            </div>
          ) : (
            <div className="inline-flex h-24 w-24 items-center justify-center rounded-3xl bg-white dark:bg-white border border-border shadow-2xl mb-4 p-3 animate-in zoom-in duration-1000">
              <img src="/logo-vfos.svg" alt="Vibeforce Flow OS Logo" className="h-full w-full object-contain invert-0 dark:brightness-0 dark:invert" />
            </div>
          )}
          <h1 className="text-4xl sm:text-5xl font-black tracking-tighter text-foreground">
            {craftMode ? 'Vibeforce Craft OS' : t('auth.login.title')}
          </h1>
          <p className="text-muted-foreground font-medium">
            {craftMode ? 'Das Handwerks- & Baustellen-Betriebssystem' : t('auth.login.subtitle')}
          </p>
        </div>

        <div className="bg-card/40 backdrop-blur-2xl border border-border p-8 rounded-[2.5rem] shadow-2xl space-y-6">

          {/* 1-Click Demo Schnellzugang */}
          <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-xs font-bold uppercase tracking-wider text-primary">Prüfer & Personal</span>
              </div>
              <span className="text-[11px] text-muted-foreground font-medium">1-Klick Login</span>
            </div>
            <Button
              type="button"
              variant="default"
              disabled={isDemoLoading || isLoading}
              onClick={() => handle1ClickDemo('slot_a')}
              className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              {isDemoLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Gast-Zugang sofort öffnen
                  <ArrowRight size={14} />
                </>
              )}
            </Button>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-border w-full"></div>
            <span className="bg-card/40 px-3 text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Oder regulär</span>
            <div className="border-t border-border w-full"></div>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-muted-foreground ml-1 text-xs uppercase tracking-[0.06em] font-bold">{t('auth.login.email')}</Label>
              <Input
                id="email"
                type="email"
                placeholder={appConfig.defaultEmailPlaceholder}
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-background/50 border-border h-12 rounded-2xl px-4 focus:border-primary/50 transition-all focus:ring-primary/20"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <Label htmlFor="password" className="text-muted-foreground text-xs uppercase tracking-[0.06em] font-bold">{t('auth.login.password')}</Label>
                <button
                  type="button"
                  onClick={() => setForgotDialogOpen(true)}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-150"
                >
                  {t('auth.login.forgot')}
                </button>
              </div>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-background/50 border-border h-12 rounded-2xl px-4 focus:border-primary/50 transition-all focus:ring-primary/20"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading || isDemoLoading}
              className="w-full h-12 bg-card hover:bg-muted text-foreground border border-border rounded-2xl font-bold text-sm shadow-sm transition-all flex items-center justify-center group"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  {t('auth.login.submit')}
                  <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </form>
        </div>

        <p className="text-center mt-8 text-sm text-muted-foreground">
          {t('auth.login.noAccount')}{' '}
          <button
            type="button"
            onClick={() => setContactDialogOpen(true)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-150"
          >
            {t('auth.login.contactAdmin')}
          </button>
        </p>
      </div>

      {/* Bottom info */}
      <div className="text-muted-foreground text-[10px] uppercase tracking-[0.06em] font-black mt-auto pb-8 pt-8 flex flex-col items-center gap-2">
        <span>{t('auth.login.selfHosted')}</span>
        <span className="flex items-center gap-3">
          <Link href="/impressum" className="hover:text-foreground transition-colors duration-150">
            Impressum
          </Link>
          <span aria-hidden="true">·</span>
          <Link href="/datenschutz" className="hover:text-foreground transition-colors duration-150">
            Datenschutz
          </Link>
        </span>
      </div>

      <ForgotPasswordDialog open={forgotDialogOpen} onOpenChange={setForgotDialogOpen} />
      <ContactAdminDialog open={contactDialogOpen} onOpenChange={setContactDialogOpen} />
    </div>
  );
}
