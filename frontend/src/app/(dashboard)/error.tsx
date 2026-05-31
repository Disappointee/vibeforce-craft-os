'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Home } from 'lucide-react';

export default function DashboardError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    const router = useRouter();

    useEffect(() => {
        console.error('Dashboard error boundary caught:', error);
    }, [error]);

    return (
        <div className="min-h-[80vh] flex items-center justify-center">
            <div className="text-center space-y-6 max-w-md px-4">
                <div className="flex justify-center">
                    <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
                        <AlertTriangle size={32} className="text-red-400" />
                    </div>
                </div>
                <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-foreground">
                        Dashboard-Fehler
                    </h1>
                    <p className="text-sm text-zinc-400">
                        Beim Laden des Dashboards ist ein Fehler aufgetreten. Bitte versuche es erneut.
                    </p>
                </div>
                <div className="flex items-center justify-center gap-3">
                    <Button
                        onClick={() => reset()}
                        variant="outline"
                        className="border-zinc-800 hover:bg-zinc-900 text-foreground"
                    >
                        Erneut versuchen
                    </Button>
                    <Button
                        onClick={() => router.push('/')}
                        variant="ghost"
                        className="text-zinc-400 hover:text-foreground"
                    >
                        <Home size={16} className="mr-1" />
                        Zur Startseite
                    </Button>
                </div>
            </div>
        </div>
    );
}
