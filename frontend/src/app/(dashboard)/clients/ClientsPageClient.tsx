'use client';

import { useState, useEffect } from 'react';
import { Users, Hammer, HardHat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ClientList } from '@/components/clients/ClientList';
import { NewClientDialog } from '@/components/clients/NewClientDialog';
import { NewCraftClientDialog } from '@/components/craft/NewCraftClientDialog';
import { useUiStore } from '@/lib/store';
import { pb } from '@/lib/pocketbase';
import { isCraftMode } from '@/config/app-mode';

export function ClientsPageClient() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isCraftClientModalOpen, setIsCraftClientModalOpen] = useState(false);
  const { clientDialogOpen, setClientDialogOpen } = useUiStore();
  const craft = isCraftMode();

  useEffect(() => {
    if (!pb.authStore.isValid) {
      window.location.href = '/login';
    }
  }, []);

  useEffect(() => {
    const handleClientUpdated = () => setRefreshTrigger(prev => prev + 1);
    window.addEventListener('client-updated', handleClientUpdated);
    return () => window.removeEventListener('client-updated', handleClientUpdated);
  }, []);

  const handleClientCreated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
              {craft ? (
                <>
                  <HardHat size={26} className="text-amber-500" />
                  Bauherren &amp; Auftraggeber (§ 13b &amp; § 48b)
                </>
              ) : (
                <>
                  <Users size={26} className="text-primary" />
                  Kunden &amp; Auftraggeber
                </>
              )}
            </h1>
            <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
              {craft
                ? 'Verwalte Bauherren, Bauträger und Auftraggeber inklusive Bauabzugsteuer (§ 48b) und Steuerschuldnerschaft (§ 13b).'
                : 'Verwalte Kundenbeziehungen, Ansprechpartner und Verträge.'}
            </p>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            {craft ? (
              <Button
                id="craft-create-client-btn"
                onClick={() => setIsCraftClientModalOpen(true)}
                className="bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs h-9 px-3.5 shadow-sm flex items-center gap-1.5 shrink-0"
              >
                <Hammer size={14} />
                <span>+ Bauherr / Auftraggeber anlegen</span>
              </Button>
            ) : (
              <NewClientDialog
                open={clientDialogOpen}
                onOpenChange={setClientDialogOpen}
                onClientCreated={handleClientCreated}
              />
            )}
          </div>
        </div>

        <NewCraftClientDialog
          open={isCraftClientModalOpen}
          onOpenChange={setIsCraftClientModalOpen}
          onClientCreated={handleClientCreated}
        />

        <ClientList refreshTrigger={refreshTrigger} />
      </div>
    </div>
  );
}
