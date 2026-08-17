'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { pb } from '@/lib/pocketbase';
import { useTimerStore } from '@/lib/store';
import { toast } from 'sonner';
import type { TaskRecord, NotificationRecord, TimeEntryRecord, TaskCommentRecord } from '@/lib/pocketbase-types';

export function useRealtimeSync() {
  const router = useRouter();
  const isSubscribedRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!pb.authStore.isValid || !pb.authStore.record?.id) return;

    const currentUserId = pb.authStore.record.id;
    isSubscribedRef.current = true;

    // 1. Tasks Subscription
    const subscribeTasks = async () => {
      try {
        await pb.collection('tasks').subscribe('*', (e) => {
          const task = e.record as unknown as TaskRecord;
          const action = e.action; // 'create' | 'update' | 'delete'

          // Dispatch standard event for views
          window.dispatchEvent(new CustomEvent('task-updated', { detail: e }));
          window.dispatchEvent(new CustomEvent('vibeforce:tasks-updated', { detail: e }));

          // Toast when another user assigns a task or updates it
          if (action === 'create') {
            const isAssigned = Array.isArray(task.assignees)
              ? task.assignees.includes(currentUserId)
              : task.assignees === currentUserId;

            if (isAssigned) {
              toast.info('Neue Aufgabe zugewiesen', {
                description: task.title,
                action: {
                  label: 'Öffnen',
                  onClick: () => router.push(`/tasks?task=${task.id}`),
                },
              });
            }
          }
        });
      } catch (err) {
        console.warn('[RealtimeSync] Tasks subscription error:', err);
      }
    };

    // 2. Time Entries Subscription (Timer Live Sync)
    const subscribeTimeEntries = async () => {
      try {
        await pb.collection('time_entries').subscribe('*', (e) => {
          const entry = e.record as unknown as TimeEntryRecord;

          // Dispatch event for reporting & time tracker views
          window.dispatchEvent(new CustomEvent('time-entry-updated', { detail: e }));
          window.dispatchEvent(new CustomEvent('vibeforce:time-entries-updated', { detail: e }));

          // If it affects current user, sync running timer from DB
          if (entry.user === currentUserId) {
            useTimerStore.getState().syncTimerFromDB();
          }
        });
      } catch (err) {
        console.warn('[RealtimeSync] Time entries subscription error:', err);
      }
    };

    // 3. Task Comments Subscription
    const subscribeComments = async () => {
      try {
        await pb.collection('task_comments').subscribe('*', (e) => {
          const comment = e.record as unknown as TaskCommentRecord;

          window.dispatchEvent(new CustomEvent('task-comment-created', { detail: e }));
          window.dispatchEvent(new CustomEvent('vibeforce:comment-created', { detail: e }));

          // If mentioned and not authored by oneself
          if (
            e.action === 'create' &&
            comment.author !== currentUserId &&
            comment.mentions &&
            comment.mentions.includes(currentUserId)
          ) {
            toast.info('Du wurdest in einem Kommentar erwähnt', {
              description: comment.content.length > 80 ? `${comment.content.slice(0, 80)}…` : comment.content,
              action: {
                label: 'Zur Aufgabe',
                onClick: () => router.push(`/tasks?task=${comment.task}`),
              },
            });
          }
        });
      } catch (err) {
        console.warn('[RealtimeSync] Comments subscription error:', err);
      }
    };

    // 4. Notifications Subscription
    const subscribeNotifications = async () => {
      try {
        await pb.collection('notifications').subscribe('*', (e) => {
          const notification = e.record as unknown as NotificationRecord;

          // Only notify if directed to current user
          if (notification.user === currentUserId) {
            window.dispatchEvent(new CustomEvent('notification-received', { detail: e }));
            window.dispatchEvent(new CustomEvent('vibeforce:notifications-updated', { detail: e }));

            if (e.action === 'create' && !notification.read) {
              toast(notification.title, {
                description: notification.message,
                action: notification.link
                  ? {
                      label: 'Öffnen',
                      onClick: () => router.push(notification.link!),
                    }
                  : undefined,
              });
            }
          }
        });
      } catch (err) {
        console.warn('[RealtimeSync] Notifications subscription error:', err);
      }
    };

    // Initial timer sync on mount
    useTimerStore.getState().syncTimerFromDB();

    subscribeTasks();
    subscribeTimeEntries();
    subscribeComments();
    subscribeNotifications();

    return () => {
      isSubscribedRef.current = false;
      try {
        pb.collection('tasks').unsubscribe('*');
        pb.collection('time_entries').unsubscribe('*');
        pb.collection('task_comments').unsubscribe('*');
        pb.collection('notifications').unsubscribe('*');
      } catch (err) {
        console.warn('[RealtimeSync] Unsubscribe cleanup:', err);
      }
    };
  }, [router]);
}
