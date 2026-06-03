'use client';

import { useEffect, useState, useCallback } from 'react';
import { pb } from '@/lib/pocketbase';

function getGreeting(hour: number, name: string): string {
  if (hour < 12) return `Guten Morgen, ${name}`;
  if (hour < 18) return `Guten Tag, ${name}`;
  return `Guten Abend, ${name}`;
}

export function DashboardGreeting() {
  const [userName, setUserName] = useState<string>('');
  const [totalOpenTasks, setTotalOpenTasks] = useState<number | null>(null);
  const [acuteTasks, setAcuteTasks] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    const user = pb.authStore.record;
    if (!user?.id) return;

    setUserName(user.name || user.email || '');

    try {
      const items = await pb.collection('tasks').getFullList({
        filter: pb.filter('assignees ~ {:uid} && status != "done"', { uid: user.id }),
      });
      const total = items.length;
      const acute = items.filter((t: any) => t.priority === 'acute').length;
      setTotalOpenTasks(total);
      setAcuteTasks(acute);
    } catch {
      setTotalOpenTasks(0);
      setAcuteTasks(0);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const hour = new Date().getHours();
  const greeting = getGreeting(hour, userName || '');
  const isLoading = totalOpenTasks === null;

  if (isLoading) {
    return (
      <div className="w-full rounded-xl bg-gradient-to-r from-indigo-500/5 via-primary/5 to-emerald-500/5 p-6 animate-pulse">
        <div className="h-10 w-3/4 bg-muted rounded-lg" />
      </div>
    );
  }

  return (
    <div className="w-full rounded-xl bg-gradient-to-r from-indigo-500/10 via-primary/5 to-emerald-500/10 border border-border/50 p-6">
      <h1 className="text-4xl md:text-5xl font-bold text-foreground leading-tight">
        {greeting}, du hast heute <span className="text-primary">{totalOpenTasks}</span> offene Aufgaben,{' '}
        <span className="text-red-500">{acuteTasks}</span> davon akut.
      </h1>
    </div>
  );
}
