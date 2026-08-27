'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';

export default function DashboardError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    const router = useRouter();

    useEffect(() => {
        console.error('[Dashboard Error Boundary]', error);
    }, [error]);

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-6">
            <div className="text-center space-y-6 max-w-lg px-4 bg-card/60 backdrop-blur-xl border border-border/80 p-8 rounded-3xl shadow-2xl">
                <div className="flex justify-center">
                    <div className="w-16 h-16 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center">
                        <AlertTriangle size={32} className="text-destructive" />
                    </div>
                </div>
                <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-foreground">
                        Ansicht konnte nicht geladen werden
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {error?.message || 'Beim Laden dieser Ansicht ist ein unerwarteter Fehler aufgetreten.'}
                    </p>
                </div>
                <div className="flex items-center justify-center gap-3 pt-2">
                    <Button
                        onClick={() => reset()}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl"
                    >
                        <RefreshCw size={16} className="mr-2" />
                        Erneut versuchen
                    </Button>
                    <Button
                        onClick={() => router.push('/tasks')}
                        variant="outline"
                        className="border-border hover:bg-muted text-foreground rounded-xl"
                    >
                        <Home size={16} className="mr-2" />
                        Zu den Aufgaben
                    </Button>
                </div>
            </div>
        </div>
    );
}
