'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { pb } from '@/lib/pocketbase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, ArrowRight } from 'lucide-react';
import { ForgotPasswordDialog } from '@/components/auth/ForgotPasswordDialog';
import { ContactAdminDialog } from '@/components/auth/ContactAdminDialog';
import { t } from '@/lib/i18n';
import { ClientResponseError } from 'pocketbase';

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [forgotDialogOpen, setForgotDialogOpen] = useState(false);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await pb.collection('users').authWithPassword(email, password);
      toast.success(t('auth.login.submit'));
      router.push('/');
    } catch (err) {
      const pbError = err as ClientResponseError;
      toast.error(t('auth.login_error'));
      console.error(pbError);
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
      <div className="w-full max-w-[420px] z-10 animate-in fade-in zoom-in-95 duration-700">
        <div className="text-center mb-10 space-y-3">
          <div className="inline-flex h-24 w-24 items-center justify-center rounded-3xl bg-white dark:bg-white border border-border shadow-2xl mb-4 p-3 animate-in zoom-in duration-1000">
            <img src="/logo-vfos.svg" alt="Vibeforce Flow OS Logo" className="h-full w-full object-contain invert-0 dark:brightness-0 dark:invert" />
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-foreground">{t('auth.login.title')}</h1>
          <p className="text-muted-foreground font-medium">{t('auth.login.subtitle')}</p>
        </div>

        <div className="bg-card/40 backdrop-blur-2xl border border-border p-8 rounded-[2.5rem] shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-muted-foreground ml-1 text-xs uppercase tracking-[0.06em] font-bold">{t('auth.login.email')}</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@agentur.de"
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
              disabled={isLoading}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl font-bold text-base shadow-lg shadow-primary/20 transition-all flex items-center justify-center group"
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
