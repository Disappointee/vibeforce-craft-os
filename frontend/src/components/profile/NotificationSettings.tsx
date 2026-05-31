'use client';

import { useState, useEffect } from 'react';
import { pb } from '@/lib/pocketbase';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Bell, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface NotificationPrefs {
    notify_on_assignment: boolean;
    notify_on_mention: boolean;
    notify_on_due: boolean;
    weekly_report: boolean;
}

export function NotificationSettings() {
    const [prefs, setPrefs] = useState<NotificationPrefs>({
        notify_on_assignment: true,
        notify_on_mention: true,
        notify_on_due: true,
        weekly_report: false,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);

    useEffect(() => {
        loadPrefs();
    }, []);

    const loadPrefs = async () => {
        try {
            const userId = pb.authStore.record?.id;
            if (!userId) return;

            const user = await pb.collection('users').getOne(userId);
            setPrefs({
                notify_on_assignment: user.notify_on_assignment ?? true,
                notify_on_mention: user.notify_on_mention ?? true,
                notify_on_due: user.notify_on_due ?? true,
                weekly_report: user.weekly_report ?? false,
            });
        } catch (error) {
            console.error('Error loading notification prefs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (key: keyof NotificationPrefs) => {
        const newValue = !prefs[key];
        setPrefs((prev) => ({ ...prev, [key]: newValue }));
        setSaving(key);

        try {
            const userId = pb.authStore.record?.id;
            if (!userId) return;

            await pb.collection('users').update(userId, { [key]: newValue });
        } catch (error: any) {
            console.error('Error updating notification pref:', error);
            setPrefs((prev) => ({ ...prev, [key]: !newValue }));
            toast.error(error?.message || 'Fehler beim Speichern der Einstellung');
        } finally {
            setSaving(null);
        }
    };

    if (loading) {
        return (
            <Card className="border-border bg-card/40">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                            <Bell size={18} />
                        </div>
                        <div>
                            <CardTitle>Benachrichtigungen</CardTitle>
                            <CardDescription>Verwalte deine Benachrichtigungseinstellungen</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center py-8">
                        <Loader2 size={20} className="text-muted-foreground animate-spin" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    const notifications = [
        {
            key: 'notify_on_assignment' as keyof NotificationPrefs,
            title: 'Aufgabenzuweisung',
            description: 'Benachrichtigung erhalten, wenn dir eine Aufgabe zugewiesen wird',
        },
        {
            key: 'notify_on_mention' as keyof NotificationPrefs,
            title: 'Erwähnungen',
            description: 'Benachrichtigung erhalten, wenn du in einem Kommentar erwähnt wirst',
        },
        {
            key: 'notify_on_due' as keyof NotificationPrefs,
            title: 'Fälligkeit',
            description: 'Benachrichtigung erhalten, wenn eine Aufgabe bald fällig ist',
        },
        {
            key: 'weekly_report' as keyof NotificationPrefs,
            title: 'Wochenbericht',
            description: 'Wöchentliche Zusammenfassung per E-Mail erhalten',
        },
    ];

    return (
        <Card className="border-border bg-card/40">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                        <Bell size={18} />
                    </div>
                    <div>
                        <CardTitle>Benachrichtigungen</CardTitle>
                        <CardDescription>Verwalte deine Benachrichtigungseinstellungen</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {notifications.map((notif) => (
                        <div
                            key={notif.key}
                            className="flex items-center justify-between rounded-lg border border-border bg-background/50 px-4 py-3"
                        >
                            <div className="space-y-0.5">
                                <Label htmlFor={notif.key} className="text-sm font-medium text-foreground cursor-pointer">
                                    {notif.title}
                                </Label>
                                <p className="text-xs text-muted-foreground">{notif.description}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                {saving === notif.key && <Loader2 size={14} className="text-muted-foreground animate-spin" />}
                                <button
                                    id={notif.key}
                                    role="switch"
                                    aria-checked={prefs[notif.key]}
                                    onClick={() => handleToggle(notif.key)}
                                    disabled={saving !== null}
                                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 disabled:opacity-50 disabled:cursor-not-allowed ${prefs[notif.key] ? 'bg-indigo-500' : 'bg-zinc-700'
                                        }`}
                                >
                                    <span
                                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${prefs[notif.key] ? 'translate-x-4' : 'translate-x-0'
                                            }`}
                                    />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
