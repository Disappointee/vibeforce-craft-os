'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { pb } from '@/lib/pocketbase';
import { Bell, Loader2, CheckCheck } from 'lucide-react';
import { t } from '@/lib/i18n';
import { NotificationRecord } from '@/lib/pocketbase-types';
import { decodeGermanHtmlEntities } from '@/lib/utils';
import { useRealtime } from '@/hooks/useRealtime';
import { toast } from 'sonner';
import {
  markNotificationAsReadAction,
  markAllNotificationsAsReadAction,
} from '@/app/actions/notifications';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

const NOTIFICATION_ICONS: Record<string, string> = {
    task_assigned: '👤',
    task_due: '⏰',
    task_comment: '💬',
    task_mention: '@',
    status_change: '🔄',
    project_update: '📋',
};

export function NotificationBell() {
    const router = useRouter();
    const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isMarkingAll, setIsMarkingAll] = useState(false);


    const fetchNotifications = useCallback(async () => {
        if (!pb.authStore.isValid || !pb.authStore.record?.id) return;

        setIsLoading(true);
        try {
            const result = await pb.collection('notifications').getList(1, 10, {
                sort: '-created',
                filter: pb.filter('user = {:uid}', { uid: pb.authStore.record.id }),
            });
            setNotifications(result.items as NotificationRecord[]);
            setUnreadCount(result.items.filter((n: any) => !n.read).length);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const uid = pb.authStore.isValid ? pb.authStore.record?.id : null;

    useRealtime<NotificationRecord>(
        'notifications',
        (event) => {
            if (event.action === 'create') {
                const notif = event.record;
                if (notif && notif.id) {
                    setNotifications((prev) => [notif, ...prev]);
                    if (!notif.read) {
                        setUnreadCount((prev) => prev + 1);
                    }
                    const title = decodeGermanHtmlEntities(notif.title) || 'Neue Benachrichtigung';
                    toast(title, {
                        description: decodeGermanHtmlEntities(notif.message) || '',
                        duration: 4000,
                    });
                }
            }
        },
        {
            filter: uid ? pb.filter('user = {:uid}', { uid }) : undefined,
            enabled: !!uid,
        }
    );

    const handleMarkAllRead = async () => {
        setIsMarkingAll(true);
        try {
            const uid = pb.authStore.record?.id;
            if (!uid) return;
            await markAllNotificationsAsReadAction(uid);
            setNotifications((prev) =>
                prev.map((n) => ({ ...n, read: true }))
            );
            setUnreadCount(0);
            router.refresh();
        } catch (error) {
            console.error('Failed to mark notifications as read:', error);
        } finally {
            setIsMarkingAll(false);
        }
    };

    const handleNotificationClick = async (notification: NotificationRecord) => {
        // Mark as read
        if (!notification.read) {
            try {
                await markNotificationAsReadAction(notification.id);
                setNotifications((prev) =>
                    prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
                );
                setUnreadCount((prev) => Math.max(0, prev - 1));
                router.refresh();
            } catch (error) {
                console.error('Failed to mark notification as read:', error);
            }
        }

        setIsOpen(false);

        // Navigate if link exists
        if (notification.link) {
            router.push(notification.link);
        }
    };

    const getTimeAgo = (dateStr: string | undefined) => {
        if (!dateStr) return '';
        const now = new Date();
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return '';
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Gerade eben';
        if (diffMins < 60) return `Vor ${diffMins} Min.`;
        if (diffHours < 24) return `Vor ${diffHours} Std.`;
        return `Vor ${diffDays} Tagen`;
    };

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger className="relative p-2 text-muted-foreground hover:text-foreground transition-colors data-popup-open:text-foreground">
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-2 h-4 w-4 rounded-full bg-indigo-500 text-[10px] font-bold text-white flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                className="w-80 bg-background border-border text-foreground mt-2"
            >
                <DropdownMenuLabel className="flex items-center justify-between text-muted-foreground">
                    <span>{t('notifications.title')}</span>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleMarkAllRead}
                            disabled={isMarkingAll}
                            className="h-7 text-xs text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 px-2"
                        >
                            {isMarkingAll ? (
                                <Loader2 size={12} className="animate-spin mr-1" />
                            ) : (
                                <CheckCheck size={12} className="mr-1" />
                            )}
                            {t('notifications.all_read')}
                        </Button>
                    )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-muted" />
                <div className="max-h-80 overflow-y-auto">
                    {isLoading && notifications.length === 0 ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 size={20} className="animate-spin text-muted-foreground" />
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="py-8 text-center text-sm text-muted-foreground">
                            <Bell size={24} className="mx-auto mb-2 opacity-50" />
                            {t('notifications.no_notifications')}
                        </div>
                    ) : (
                        notifications.map((notification) => (
                            <DropdownMenuItem
                                key={notification.id}
                                onClick={() => handleNotificationClick(notification)}
                                className={`cursor-pointer px-4 py-3 border-b border-border/50 last:border-b-0 focus:bg-card ${!notification.read ? 'bg-indigo-500/5' : ''
                                    }`}
                            >
                                <div className="flex items-start gap-3 min-w-0">
                                    <span className="text-lg flex-shrink-0 mt-0.5">
                                        {NOTIFICATION_ICONS[notification.type] || '🔔'}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm truncate ${!notification.read ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>
                                            {decodeGermanHtmlEntities(notification.title)}
                                        </p>
                                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                                            {decodeGermanHtmlEntities(notification.message)}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground mt-1">
                                            {getTimeAgo(notification.created)}
                                        </p>
                                    </div>
                                    {!notification.read && (
                                        <span className="h-2 w-2 rounded-full bg-indigo-500 flex-shrink-0 mt-2" />
                                    )}
                                </div>
                            </DropdownMenuItem>
                        ))
                    )}
                </div>
                <DropdownMenuSeparator className="bg-muted" />
                <DropdownMenuItem
                    onClick={() => {
                        setIsOpen(false);
                        router.push('/notifications');
                    }}
                    className="cursor-pointer text-center text-sm text-indigo-400 hover:text-indigo-300 focus:bg-card justify-center py-2"
                >
                    {t('notifications.show_all')}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
