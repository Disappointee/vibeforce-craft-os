'use client';

import { useMemo } from 'react';
import { Users, TrendingUp, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { UserRecord, TimeEntryRecord, TaskRecord } from '@/lib/pocketbase-types';

interface UtilizationRow {
  userId: string;
  userName: string;
  userEmail: string;
  totalHours: number;
  billableHours: number;
  utilizationRate: number;
  budgetedHours: number;
}

interface UtilizationReportProps {
  users: UserRecord[];
  timeEntries: TimeEntryRecord[];
  tasks: TaskRecord[];
  dateFrom: string;
  dateTo: string;
}

export function UtilizationReport({ users, timeEntries, tasks, dateFrom, dateTo }: UtilizationReportProps) {
  const { rows, summary } = useMemo(() => {
    let capacityWeeks = 4;
    if (dateFrom && dateTo) {
      const diffMs = new Date(dateTo).getTime() - new Date(dateFrom).getTime();
      capacityWeeks = Math.max(1, Math.round(diffMs / (7 * 24 * 60 * 60 * 1000)));
    }

    const userBudgetMap = new Map<string, number>();
    for (const task of tasks) {
      const assignees = Array.isArray((task as any).expand?.assignees)
        ? (task as any).expand.assignees
        : [];
      const estimatedHours = Number(task.estimated_hours) || 0;
      for (const assignee of assignees) {
        if (assignee?.id) {
          userBudgetMap.set(assignee.id, (userBudgetMap.get(assignee.id) || 0) + estimatedHours);
        }
      }
    }

    const loggedMap = new Map<string, { total: number; billable: number }>();
    for (const entry of timeEntries) {
      const userId = entry.user;
      if (!userId) continue;
      const hours = (entry.duration_minutes || 0) / 60;
      const current = loggedMap.get(userId) || { total: 0, billable: 0 };
      current.total += hours;
      if (entry.is_billable !== false) current.billable += hours;
      loggedMap.set(userId, current);
    }

    const computedRows: UtilizationRow[] = users
      .filter(u => loggedMap.has(u.id) || userBudgetMap.has(u.id))
      .map(u => {
        const logged = loggedMap.get(u.id) || { total: 0, billable: 0 };
        const budgetedHours = userBudgetMap.get(u.id) || 0;
        const defaultCapacity = 40 * capacityWeeks;
        const capacity = budgetedHours > 0 ? budgetedHours : defaultCapacity;
        const utilizationRate = capacity > 0 ? (logged.billable / capacity) * 100 : 0;

        return {
          userId: u.id,
          userName: u.name || u.email?.split('@')[0] || 'Unbekannt',
          userEmail: u.email || '',
          totalHours: Math.round(logged.total * 100) / 100,
          billableHours: Math.round(logged.billable * 100) / 100,
          utilizationRate: Math.round(utilizationRate * 10) / 10,
          budgetedHours: Math.round(budgetedHours * 100) / 100,
        };
      })
      .sort((a, b) => b.utilizationRate - a.utilizationRate);

    const totalBillable = computedRows.reduce((s, r) => s + r.billableHours, 0);
    const totalAll = computedRows.reduce((s, r) => s + r.totalHours, 0);
    const totalCapacity = computedRows.reduce((s, r) => s + Math.max(r.budgetedHours, 40 * capacityWeeks), 0);
    const overallUtilization = totalCapacity > 0 ? (totalBillable / totalCapacity) * 100 : 0;

    return {
      rows: computedRows,
      summary: {
        totalUsers: computedRows.length,
        totalHours: totalAll,
        totalBillable,
        overallUtilization: Math.round(overallUtilization * 10) / 10,
      },
    };
  }, [users, timeEntries, tasks, dateFrom, dateTo]);

  const getUtilColor = (rate: number) => {
    if (rate >= 70) return 'text-emerald-400';
    if (rate >= 50) return 'text-amber-400';
    return 'text-red-400';
  };

  const getUtilBg = (rate: number) => {
    if (rate >= 70) return 'bg-emerald-500';
    if (rate >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  };

  if (rows.length === 0) {
    return (
      <Card className="border-border bg-card/40">
        <CardContent className="p-12 text-center text-muted-foreground text-sm">
          Keine Auslastungsdaten für den ausgewählten Zeitraum.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border bg-card/40">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Users size={20} />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Mitarbeiter</p>
                <h3 className="text-xl font-bold text-white tabular-nums">{summary.totalUsers}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card/40">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <TrendingUp size={20} />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Auslastung</p>
                <h3 className={`text-xl font-bold tabular-nums ${getUtilColor(summary.overallUtilization)}`}>
                  {summary.overallUtilization}%
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card/40">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Clock size={20} />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Abrechenbar / Gesamt</p>
                <h3 className="text-xl font-bold text-white tabular-nums">
                  {summary.totalBillable.toFixed(1)}h / {summary.totalHours.toFixed(1)}h
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border bg-card/40">
        <CardHeader>
          <CardTitle className="text-foreground">Auslastung pro Mitarbeiter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {rows.map((row) => (
              <div key={row.userId} className="p-4 rounded-xl bg-card/60 border border-border/50">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="font-semibold text-white">{row.userName}</span>
                    <span className="text-xs text-muted-foreground ml-2">{row.userEmail}</span>
                  </div>
                  <div className="text-right">
                    <span className={`text-lg font-bold ${getUtilColor(row.utilizationRate)}`}>
                      {row.utilizationRate}%
                    </span>
                    <span className="text-xs text-muted-foreground ml-2">Auslastung</span>
                  </div>
                </div>
                <div className="h-2 w-full bg-background rounded-full overflow-hidden mb-3">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${getUtilBg(row.utilizationRate)}`}
                    style={{ width: `${Math.min(row.utilizationRate, 100)}%` }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                  <div>
                    <span className="block">Gesamt</span>
                    <span className="text-white font-medium">{row.totalHours.toFixed(1)}h</span>
                  </div>
                  <div>
                    <span className="block">Abrechenbar</span>
                    <span className="text-white font-medium">{row.billableHours.toFixed(1)}h</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
