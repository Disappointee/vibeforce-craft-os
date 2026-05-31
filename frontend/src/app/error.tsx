'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function RootError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Root error boundary caught:', error);
    }, [error]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950">
            <div className="text-center space-y-6 max-w-md px-4">
                <div className="flex justify-center">
                    <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
                        <AlertTriangle size={32} className="text-red-400" />
                    </div>
                </div>
                <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-foreground">
                        Etwas ist schiefgelaufen
                    </h1>
                    <p className="text-sm text-zinc-400">
                        Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es erneut oder kontaktiere den Support.
                    </p>
                </div>
                <Button
                    onClick={() => reset()}
                    variant="outline"
                    className="border-zinc-800 hover:bg-zinc-900 text-foreground"
                >
                    Erneut versuchen
                </Button>
            </div>
        </div>
    );
}
