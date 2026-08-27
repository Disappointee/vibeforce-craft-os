'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ArrowLeft } from 'lucide-react';

export default function ProjectDetailError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    const router = useRouter();

    useEffect(() => {
        console.error('Project detail error boundary caught:', error);
    }, [error]);

    return (
        <div className="h-full p-8 flex items-center justify-center">
            <div className="text-center space-y-6 max-w-md">
                <div className="flex justify-center">
                    <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
                        <AlertTriangle size={32} className="text-red-400" />
                    </div>
                </div>
                <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">
                        Projekt-Fehler
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Beim Laden des Projekts ist ein Fehler aufgetreten. Bitte versuche es erneut.
                    </p>
                </div>
                <div className="flex items-center justify-center gap-3">
                    <Button
                        onClick={() => reset()}
                        variant="outline"
                        className="border-border text-foreground hover:bg-accent/50"
                    >
                        Erneut versuchen
                    </Button>
                    <Button
                        onClick={() => router.push('/projects')}
                        variant="ghost"
                        className="text-muted-foreground hover:text-foreground"
                    >
                        <ArrowLeft size={16} className="mr-1" />
                        Zur Projektübersicht
                    </Button>
                </div>
            </div>
        </div>
    );
}
