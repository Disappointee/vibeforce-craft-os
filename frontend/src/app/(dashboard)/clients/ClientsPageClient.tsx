'use client';

import { useState, useEffect } from 'react';
import { Users, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ClientList } from '@/components/clients/ClientList';
import { NewClientDialog } from '@/components/clients/NewClientDialog';
import { useUiStore } from '@/lib/store';
import { pb } from '@/lib/pocketbase';

export function ClientsPageClient() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { clientDialogOpen, setClientDialogOpen } = useUiStore();

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
              <Building2 size={26} className="text-blue-500" />Kunden & Auftraggeber
            </h1>
            <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
              Verwalte Kunden, Auftraggeber und Bauherren.
            </p>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <Button
              id="craft-create-client-btn"
              onClick={() => setClientDialogOpen(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs h-9 px-3.5 shadow-sm flex items-center gap-1.5 shrink-0"
            >
              <Users size={14} />+ Kunde anlegen
            </Button>
          </div>
        </div>

        <NewClientDialog
          open={clientDialogOpen}
          onOpenChange={setClientDialogOpen}
          onClientCreated={handleClientCreated}
        />

        <ClientList refreshTrigger={refreshTrigger} />
      </div>
    </div>
  );
}