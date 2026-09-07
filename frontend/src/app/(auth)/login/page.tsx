'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, ArrowRight } from 'lucide-react';
import { ForgotPasswordDialog } from '@/components/auth/ForgotPasswordDialog';
import { ContactAdminDialog } from '@/components/auth/ContactAdminDialog';
import { t } from '@/lib/i18n';
import { getAppConfig, isCraftMode } from '@/config/app-mode';
import { Hammer } from 'lucide-react';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [forgotDialogOpen, setForgotDialogOpen] = useState(false);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const appConfig = getAppConfig();
  const craftMode = isCraftMode();

  const handleDemoLogin = async () => {
    setIsDemoLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: '***REMOVED***',
          password: '***REMOVED***',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || t('auth.login_error'));
      }

      toast.success(
        craftMode
          ? 'Erfolgreich als Handwerksmeister & Bauleiter angemeldet!'
          : 'Erfolgreich als Agenturleiter & Admin angemeldet!'
      );
      window.location.href = appConfig.startRoute;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('auth.login_error');
      toast.error(message);
      console.error('Demo login failed:', err);
    } finally {
      setIsDemoLoading(false);
    }
  };

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

          {/* ⚡ 1-Klick Demo Login Box */}
          <div className={`p-4 rounded-2xl border transition-all ${
            craftMode 
              ? 'bg-amber-500/10 border-amber-500/30' 
              : 'bg-primary/10 border-primary/30'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <span className={`text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 ${
                craftMode ? 'text-amber-500' : 'text-primary'
              }`}>
                <span className="relative flex h-2 w-2">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    craftMode ? 'bg-amber-400' : 'bg-primary'
                  }`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${
                    craftMode ? 'bg-amber-500' : 'bg-primary'
                  }`}></span>
                </span>
                {craftMode ? 'Express-Zugang für Prüfer' : 'Express-Zugang für Tester'}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                craftMode 
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' 
                  : 'bg-primary/20 text-primary border-primary/30'
              }`}>
                1-Klick
              </span>
            </div>

            <Button
              type="button"
              id="demo-login-button"
              data-testid="demo-login-button"
              onClick={handleDemoLogin}
              disabled={isLoading || isDemoLoading}
              className={`w-full h-12 font-black text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 group cursor-pointer ${
                craftMode
                  ? 'bg-amber-500 hover:bg-amber-600 text-amber-950 shadow-amber-500/20'
                  : 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/20'
              }`}
            >
              {isDemoLoading ? (
                <>
                  <Loader2 className={`h-5 w-5 animate-spin ${craftMode ? 'text-amber-950' : 'text-primary-foreground'}`} />
                  <span>{craftMode ? 'Meister-Zugang wird aktiviert...' : 'Admin-Zugang wird aktiviert...'}</span>
                </>
              ) : (
                <>
                  <span>
                    {craftMode 
                      ? '⚡ Als Handwerksmeister & Bauleiter testen' 
                      : '⚡ Als Agenturleiter & Admin testen'}
                  </span>
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>

            <div className="text-[11px] text-muted-foreground flex flex-col gap-1 pt-3 font-medium border-t border-border/40 mt-3">
              {craftMode ? (
                <>
                  <span className="flex items-center gap-1.5 text-foreground/80">
                    <span className="text-amber-500 font-bold">✓</span> Inkl. 2 Live-Baustellen (BAU-01 EFH Huber & BAU-02 Schmidt)
                  </span>
                  <span className="flex items-center gap-1.5 text-foreground/80">
                    <span className="text-amber-500 font-bold">✓</span> Bautagesberichte mit SHA-256 Signatur & DIN 18299 Aufmaße
                  </span>
                </>
              ) : (
                <>
                  <span className="flex items-center gap-1.5 text-foreground/80">
                    <span className="text-primary font-bold">✓</span> Vollständiges Agentur-Projektmanagement & Kunden-CRM
                  </span>
                  <span className="flex items-center gap-1.5 text-foreground/80">
                    <span className="text-primary font-bold">✓</span> Aufgaben-Kanban, Zeiterfassung & Finanzberichte
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/60"></div>
            </div>
            <span className="relative bg-card/90 px-3 text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
              Oder regulär mit E-Mail anmelden
            </span>
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
      <div className="text-muted-foreground text-[10px] uppercase tracking-[0.06em] font-black mt-auto pb-8 pt-8">
        {t('auth.login.selfHosted')}
      </div>

      <ForgotPasswordDialog open={forgotDialogOpen} onOpenChange={setForgotDialogOpen} />
      <ContactAdminDialog open={contactDialogOpen} onOpenChange={setContactDialogOpen} />
    </div>
  );
}
