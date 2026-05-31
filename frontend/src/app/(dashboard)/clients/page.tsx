'use client';

import { useState, useEffect } from 'react';
import { Users } from 'lucide-react';
import { ClientList } from '@/components/clients/ClientList';
import { NewClientDialog } from '@/components/clients/NewClientDialog';
import { useUiStore } from '@/lib/store';
import { pb } from '@/lib/pocketbase';

export default function ClientsPage() {
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const { clientDialogOpen, setClientDialogOpen } = useUiStore();

    // Auth check — defense-in-depth
    useEffect(() => {
        if (!pb.authStore.isValid) {
            window.location.href = '/login';
        }
    }, []);

    // Listen for client-updated custom event from EditClientDialog
    useEffect(() => {
        const handleClientUpdated = () => setRefreshTrigger(prev => prev + 1);
        window.addEventListener('client-updated', handleClientUpdated);
        return () => window.removeEventListener('client-updated', handleClientUpdated);
    }, []);

    const handleClientCreated = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    return (
        <div className="p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                            <Users size={28} className="text-primary" />
                            Kunden
                        </h1>
                        <p className="text-muted-foreground mt-1 text-sm">
                            Verwalte deine Kundenkontakte und ordne sie Projekten zu.
                        </p>
                    </div>
                    <NewClientDialog
                        open={clientDialogOpen}
                        onOpenChange={setClientDialogOpen}
                        onClientCreated={handleClientCreated}
                    />
                </div>

                {/* Client List */}
                <ClientList refreshTrigger={refreshTrigger} />
            </div>
        </div>
    );
}
