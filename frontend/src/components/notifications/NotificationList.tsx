'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { pb } from '@/lib/pocketbase';
import { NotificationRecord } from '@/lib/pocketbase-types';
import { decodeGermanHtmlEntities } from '@/lib/utils';
import { Bell, Loader2, CheckCheck, ArrowLeft, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { t } from '@/lib/i18n';

const NOTIFICATION_ICONS: Record<string, string> = {
    task_assigned: '👤',
    task_due: '⏰',
    task_comment: '💬',
    task_mention: '@',
    status_change: '🔄',
    project_update: '📋',
};

const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
    task_assigned: t('notifications.type.task_assigned'),
    task_due: t('notifications.type.task_due'),
    task_comment: t('notifications.type.task_comment'),
    task_mention: t('notifications.type.task_mention'),
    status_change: t('notifications.type.status_change'),
    project_update: t('notifications.type.project_update'),
};

export function NotificationList() {
    const router = useRouter();
    const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isMarkingAll, setIsMarkingAll] = useState(false);
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [readFilter, setReadFilter] = useState<string>('all');

    const fetchNotifications = useCallback(async () => {
        if (!pb.authStore.isValid) return;

        setIsLoading(true);
        try {
            const uid = pb.authStore.record?.id;
            if (!uid) return;
            const filters = [pb.filter('user = {:uid}', { uid })];
            if (typeFilter !== 'all') {
                filters.push(pb.filter('type = {:type}', { type: typeFilter }));
            }
            if (readFilter === 'unread') {
                filters.push('read = false');
            } else if (readFilter === 'read') {
                filters.push('read = true');
            }

            const result = await pb.collection('notifications').getList(1, 50, {
                sort: '-created',
                filter: filters.join(' && '),
            });
            setNotifications(result.items as NotificationRecord[]);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setIsLoading(false);
        }
    }, [typeFilter, readFilter]);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const handleMarkAllRead = async () => {
        setIsMarkingAll(true);
        try {
            const unread = notifications.filter((n) => !n.read);
            await Promise.all(
                unread.map((n) =>
                    pb.collection('notifications').update(n.id, { read: true })
                )
            );
            setNotifications((prev) =>
                prev.map((n) => ({ ...n, read: true }))
            );
        } catch (error) {
            console.error('Failed to mark notifications as read:', error);
        } finally {
            setIsMarkingAll(false);
        }
    };

    const handleToggleRead = async (notification: NotificationRecord) => {
        try {
            await pb.collection('notifications').update(notification.id, {
                read: !notification.read,
            });
            setNotifications((prev) =>
                prev.map((n) =>
                    n.id === notification.id ? { ...n, read: !n.read } : n
                )
            );
        } catch (error) {
            console.error('Failed to toggle notification read status:', error);
        }
    };

    const handleDelete = async (notificationId: string) => {
        try {
            await pb.collection('notifications').delete(notificationId);
            setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
        } catch (error) {
            console.error('Failed to delete notification:', error);
        }
    };

    const getTimeAgo = (dateStr: string) => {
        const now = new Date();
        const date = new Date(dateStr);
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Gerade eben';
        if (diffMins < 60) return `Vor ${diffMins} Min.`;
        if (diffHours < 24) return `Vor ${diffHours} Std.`;
        if (diffDays < 7) return `Vor ${diffDays} Tagen`;
        return new Date(dateStr).toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    const unreadCount = notifications.filter((n) => !n.read).length;

    return (
        <div className="p-8">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => router.push('/')}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                <ArrowLeft size={20} />
                            </Button>
                            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                                <Bell size={32} className="text-indigo-400" />
                                {t('notifications.title')}
                            </h1>
                            {unreadCount > 0 && (
                                <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
                                    {unreadCount} {t('notifications.unread_badge')}
                                </Badge>
                            )}
                        </div>
                        <p className="text-muted-foreground mt-1 ml-12">
                            {t('notifications.subtitle')}
                        </p>
                    </div>

                    {unreadCount > 0 && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleMarkAllRead}
                            disabled={isMarkingAll}
                            className="border-border text-muted-foreground hover:text-foreground"
                        >
                            {isMarkingAll ? (
                                <Loader2 size={14} className="animate-spin mr-2" />
                            ) : (
                                <CheckCheck size={14} className="mr-2" />
                            )}
                            {t('notifications.mark_all_read')}
                        </Button>
                    )}
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-3 items-center p-4 rounded-xl border border-border bg-card/40">
                    <Filter size={16} className="text-muted-foreground" />
                    <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium block">
                            {t('notifications.filter.type')}
                        </label>
                        <Select value={typeFilter} onValueChange={(val) => val && setTypeFilter(val)}>
                            <SelectTrigger className="bg-background border-border h-9 min-w-[160px]">
                                <SelectValue>
                                    {(value: string) => {
                                        if (value === 'all') return t('notifications.filter.all_types');
                                        return `${NOTIFICATION_ICONS[value] || ''} ${NOTIFICATION_TYPE_LABELS[value] || value}`;
                                    }}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent className="bg-background border-border text-foreground">
                                <SelectItem value="all">{t('notifications.filter.all_types')}</SelectItem>
                                {Object.entries(NOTIFICATION_TYPE_LABELS).map(([key, label]) => (
                                    <SelectItem key={key} value={key}>
                                        {NOTIFICATION_ICONS[key]} {label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium block">
                            {t('notifications.filter.status')}
                        </label>
                        <Select value={readFilter} onValueChange={(val) => val && setReadFilter(val)}>
                            <SelectTrigger className="bg-background border-border h-9 min-w-[140px]">
                                <SelectValue>
                                    {(value: string) => ({
                                        all: t('notifications.filter.all_statuses'),
                                        unread: t('notifications.filter.unread'),
                                        read: t('notifications.filter.read'),
                                    } as Record<string, string>)[value] || value}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent className="bg-background border-border text-foreground">
                                <SelectItem value="all">{t('notifications.filter.all_statuses')}</SelectItem>
                                <SelectItem value="unread">{t('notifications.filter.unread')}</SelectItem>
                                <SelectItem value="read">{t('notifications.filter.read')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Notification List */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 size={32} className="animate-spin text-muted-foreground" />
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <Bell size={48} className="text-muted-foreground mb-4" />
                        <h3 className="text-xl font-semibold text-foreground">{t('notifications.no_notifications')}</h3>
                        <p className="text-muted-foreground text-sm mt-2 max-w-md">
                            {typeFilter !== 'all' || readFilter !== 'all'
                                ? t('notifications.filter_empty')
                                : t('notifications.empty')}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {notifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={`flex items-start gap-4 p-4 rounded-xl border transition-colors ${!notification.read
                                    ? 'border-indigo-500/20 bg-indigo-500/5'
                                    : 'border-border bg-card/30 hover:bg-card/50'
                                    }`}
                            >
                                <span className="text-2xl flex-shrink-0 mt-0.5">
                                    {NOTIFICATION_ICONS[notification.type] || '🔔'}
                                </span>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <p
                                                className={`text-sm ${!notification.read ? 'text-foreground font-semibold' : 'text-muted-foreground'
                                                    }`}
                                            >
                                                {decodeGermanHtmlEntities(notification.title)}
                                            </p>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                {decodeGermanHtmlEntities(notification.message)}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <Badge
                                                variant="outline"
                                                className={`text-[10px] uppercase tracking-wider ${!notification.read
                                                    ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                                                    : 'bg-muted/50 text-muted-foreground border-zinc-700'
                                                    }`}
                                            >
                                                {NOTIFICATION_TYPE_LABELS[notification.type] || notification.type}
                                            </Badge>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 mt-2">
                                        <span className="text-xs text-muted-foreground">
                                            {getTimeAgo(notification.created)}
                                        </span>
                                        <button
                                            onClick={() => handleToggleRead(notification)}
                                            className="text-xs text-muted-foreground hover:text-indigo-400 transition-colors"
                                        >
                                            {notification.read ? t('notifications.mark_unread') : t('notifications.mark_read')}
                                        </button>
                                        {notification.link && (
                                            <button
                                                onClick={() => router.push(notification.link!)}
                                                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                                            >
                                                {t('notifications.view')}
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDelete(notification.id)}
                                            className="text-xs text-muted-foreground hover:text-red-400 transition-colors ml-auto"
                                        >
                                            {t('notifications.delete')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
