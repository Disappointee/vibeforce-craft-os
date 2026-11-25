'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { pb } from '@/lib/pocketbase';
import { BarChart3, Clock, TrendingUp, DollarSign, FileText, Receipt, ExternalLink, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import {
    ProjectRecord,
    UserRecord,
    TimeEntryRecord,
    TaskRecord,
    ClientRecord,
    ExternalExpenseRecord,
} from '@/lib/pocketbase-types';
import { ReportFilters, ReportFilterValues } from '@/components/reports/ReportFilters';
import { ReportChart, ChartDataPoint } from '@/components/reports/ReportChart';
import { ReportTable, ReportRow } from '@/components/reports/ReportTable';
import { SaveTemplateDialog } from '@/components/reports/SaveTemplateDialog';
import { printServiceRecord, printInvoice, BillingLineItem, downloadReportPDF } from '@/lib/pdf-generator';
import { buildStundenreportInput, formatHoursHM } from '@/lib/stundenreport-utils';
import {
    filterProjectsByMode,
    filterClientsByMode,
    filterTasksByMode,
    filterTimeEntriesByMode,
} from '@/lib/data-isolation';

type ReportTab = 'hours' | 'billing';

function ReportsExportDropdown({
    entries,
    rows,
    groupBy,
    dateFrom,
    dateTo,
    mode,
    projectId,
    taskProjectMap,
    onPrintServiceRecord,
}: {
    entries: TimeEntryRecord[];
    rows?: ReportRow[];
    groupBy?: 'project' | 'user' | 'both';
    dateFrom?: string;
    dateTo?: string;
    mode: 'hours' | 'billing';
    projectId?: string;
    taskProjectMap?: Map<string, string>;
    onPrintServiceRecord?: () => void;
}) {
    const [isExporting, setIsExporting] = useState(false);

    const projectEntries = useMemo(() => {
        if (!projectId || !taskProjectMap) return entries;
        return entries.filter(e => taskProjectMap.get(e.task) === projectId);
    }, [entries, projectId, taskProjectMap]);

    const escapeCSV = (val: string) => {
        const clean = val.replace(/"/g, '""');
        return clean.includes(',') || clean.includes('\n') || clean.includes('"') ? `"${clean}"` : clean;
    };

    const getExportDateRange = () => {
        const dates = projectEntries
            .map(e => e.date || e.created.split('T')[0])
            .filter(Boolean)
            .sort();
        if (dates.length === 0) return new Date().toISOString().split('T')[0];
        return dates[0] === dates[dates.length - 1] ? dates[0] : `${dates[0]}_bis_${dates[dates.length - 1]}`;
    };

    const handleSummaryCSV = () => {
        if (!rows || !groupBy) return;
        try {
            setIsExporting(true);
            const headers = [
                groupBy !== 'user' ? 'Projekt' : '',
                groupBy !== 'project' ? 'Mitarbeiter' : '',
                'Stunden', 'Abrechenbar', 'Tasks', 'Budget %',
            ].filter(Boolean).join(',');

            const lines = rows.map(row => {
                const projectCol = groupBy !== 'user' ? escapeCSV(`${row.projectKey || ''} - ${row.projectName || ''}`) : '';
                const userCol = groupBy !== 'project' ? escapeCSV(row.userName || row.userEmail || '') : '';
                const cols: string[] = [];
                if (groupBy !== 'user') cols.push(projectCol);
                if (groupBy !== 'project') cols.push(userCol);
                cols.push(
                    row.hours.toFixed(2),
                    row.billableHours.toFixed(2),
                    row.taskCount.toString(),
                    row.budgetHours ? ((row.hours / row.budgetHours) * 100).toFixed(1) : '',
                );
                return cols.join(',');
            });

            const csv = [headers, ...lines].join('\n');
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            const dateStr = dateFrom && dateTo ? `${dateFrom}_${dateTo}` : new Date().toISOString().split('T')[0];
            link.download = `stundenauswertung_${dateStr}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            toast.success('CSV-Export erfolgreich');
        } catch {
            toast.error('Fehler beim CSV-Export');
        } finally {
            setIsExporting(false);
        }
    };

    const handlePdfWithLogo = async () => {
        if (!rows || !groupBy) return;
        try {
            setIsExporting(true);
            await downloadReportPDF(rows, groupBy, dateFrom, dateTo);
            toast.success('PDF-Export erfolgreich gestartet');
        } catch {
            toast.error('Fehler beim PDF-Export');
        } finally {
            setIsExporting(false);
        }
    };

    const handleStundenreportCSV = () => {
        if (projectEntries.length === 0) {
            toast.error('Keine Daten zum Exportieren vorhanden');
            return;
        }
        try {
            setIsExporting(true);
            const isBilling = mode === 'billing';
            const headerFields = ['Datum', 'Kunde', 'Projekt', 'Mitarbeiter', 'Tätigkeit', 'Beschreibung', 'Dauer'];
            if (isBilling) headerFields.push('Stundensatz', 'Betrag');
            const headers = headerFields.join(',');

            const lines = projectEntries.map(entry => {
                const task = (entry as any).expand?.task;
                const proj = task?.expand?.project;
                const client = proj?.expand?.client;
                const user = (entry as any).expand?.user || pb.authStore.record;
                const hours = (entry.duration_minutes || 0) / 60;

                const dateObj = entry.date ? new Date(entry.date) : new Date(entry.created);
                const formattedDate = dateObj.toLocaleDateString('de-DE');

                const defaultRate = Number(process.env.NEXT_PUBLIC_DEFAULT_HOURLY_RATE) || 150;
                const hourlyRate = client?.stundenhonorar || defaultRate;

                const base = [
                    formattedDate,
                    escapeCSV(client?.name || 'Kein Kunde'),
                    escapeCSV(proj ? `${proj.key} - ${proj.name}` : 'Kein Projekt'),
                    escapeCSV(user?.name || user?.email || 'Mitarbeiter'),
                    escapeCSV(task?.title || 'Keine Aufgabe'),
                    escapeCSV(entry.description || ''),
                    formatHoursHM(hours),
                ];
                if (isBilling) {
                    base.push(hourlyRate.toFixed(2).replace('.', ',') + ' €');
                    base.push((hours * hourlyRate).toFixed(2).replace('.', ',') + ' €');
                }
                return base.join(',');
            });

            const csvContent = [headers, ...lines].join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            const prefix = isBilling ? 'abrechnung' : 'zeiterfassung';
            link.download = `${prefix}_${getExportDateRange()}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            toast.success('CSV-Export erfolgreich');
        } catch {
            toast.error('Fehler beim CSV-Export');
        } finally {
            setIsExporting(false);
        }
    };

    const handleStundenreportPDF = async (showHourlyRate: boolean) => {
        if (projectEntries.length === 0) {
            toast.error('Keine Daten zum Exportieren vorhanden');
            return;
        }
        const reportData = buildStundenreportInput(projectEntries, showHourlyRate);
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            toast.error('Bitte Pop-ups für diese Seite erlauben');
            return;
        }
        printWindow.document.write('<html><body style="font-family:sans-serif;padding:40px;text-align:center;color:#666;"><p>Report wird generiert…</p></body></html>');

        try {
            setIsExporting(true);
            const res = await fetch('/api/reports/stundenreport-export', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reportData),
            });
            if (!res.ok) throw new Error(`API error: ${res.status}`);
            const contentType = res.headers.get('content-type') || '';
            if (contentType.includes('application/pdf')) {
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                printWindow.location.href = url;
                toast.success('Stundenzettel (PDF) generiert');
            } else {
                const html = await res.text();
                printWindow.document.open();
                printWindow.document.write(html);
                printWindow.document.close();
            }
        } catch {
            printWindow.close();
            toast.error('Fehler beim PDF-Export');
        } finally {
            setIsExporting(false);
        }
    };

    const disabled = isExporting || projectEntries.length === 0;

    if (mode === 'hours') {
        return (
            <DropdownMenu>
                <DropdownMenuTrigger
                    render={
                        <Button variant="outline" size="sm" disabled={disabled}>
                            <Download size={16} />
                            {isExporting ? 'Exportiere...' : 'Export'}
                        </Button>
                    }
                />
                <DropdownMenuContent align="end" className="bg-background border-border text-foreground min-w-[220px]">
                    <DropdownMenuItem onClick={handleSummaryCSV} className="flex items-center gap-2 cursor-pointer hover:bg-muted focus:bg-muted">
                        <FileText size={16} className="text-emerald-400" />
                        <span>CSV Stundenauswertung</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleStundenreportPDF(false)} className="flex items-center gap-2 cursor-pointer hover:bg-muted focus:bg-muted">
                        <FileText size={16} className="text-red-400" />
                        <span>PDF Leistungsnachweis</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handlePdfWithLogo} className="flex items-center gap-2 cursor-pointer hover:bg-muted focus:bg-muted">
                        <FileText size={16} className="text-orange-400" />
                        <span>PDF mit Logo</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                render={
                    <Button variant="outline" size="sm" disabled={disabled}>
                        <Download size={16} />
                        {isExporting ? 'Exportiere...' : 'Export'}
                    </Button>
                }
            />
            <DropdownMenuContent align="end" className="bg-background border-border text-foreground min-w-[220px]">
                <DropdownMenuItem onClick={handleStundenreportCSV} className="flex items-center gap-2 cursor-pointer hover:bg-muted focus:bg-muted">
                    <FileText size={16} className="text-emerald-400" />
                    <span>CSV Abrechnung</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStundenreportPDF(true)} className="flex items-center gap-2 cursor-pointer hover:bg-muted focus:bg-muted">
                    <FileText size={16} className="text-orange-400" />
                    <span>PDF Stundenreport (mit Kosten)</span>
                </DropdownMenuItem>
                {onPrintServiceRecord && (
                    <DropdownMenuItem onClick={onPrintServiceRecord} className="flex items-center gap-2 cursor-pointer hover:bg-muted focus:bg-muted">
                        <ExternalLink size={16} className="text-blue-400" />
                        <span>Leistungsnachweis</span>
                    </DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export default function ReportsPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<ReportTab>('hours');
    const [projects, setProjects] = useState<ProjectRecord[]>([]);
    const [users, setUsers] = useState<UserRecord[]>([]);
    const [clients, setClients] = useState<ClientRecord[]>([]);
    const [timeEntries, setTimeEntries] = useState<TimeEntryRecord[]>([]);
    const [tasks, setTasks] = useState<TaskRecord[]>([]);
    const [externalExpenses, setExternalExpenses] = useState<ExternalExpenseRecord[]>([]);

    const [filters, setFilters] = useState<ReportFilterValues>({
        dateFrom: '',
        dateTo: '',
        projectIds: [],
        userIds: [],
        clientIds: [],
        billableFilter: 'all',
        groupBy: 'project',
    });

    const presets = [
        { icon: BarChart3, title: 'Monatliche Erfassungsübersicht', description: 'Gruppiert nach Monat / Mitarbeiter', filter: { billableFilter: 'all' as const, groupBy: 'user' as const } },
        { icon: TrendingUp, title: 'Erfasst vs. geplant', description: 'Budget-Prüfung der Projekte', filter: { billableFilter: 'all' as const, groupBy: 'project' as const } },
        { icon: DollarSign, title: 'Abrechenbarkeit pro Mitarbeiter', description: 'Nur abrechenbare Zeiten', filter: { billableFilter: 'billable' as const, groupBy: 'user' as const } },
        { icon: Receipt, title: 'Bereit zur Rechnungsstellung', description: 'Abrechenbar und noch offen', filter: { billableFilter: 'ready_to_invoice' as const, groupBy: 'project' as const } },
        { icon: FileText, title: 'Stundenreport', description: 'Gruppiert nach Projekt & Person', filter: { billableFilter: 'all' as const, groupBy: 'both' as const } },
    ];

    const applyPreset = (presetFilter: Partial<ReportFilterValues>) => {
        setFilters(prev => ({ ...prev, ...presetFilter }));
        toast.success('Filter angewendet');
    };

    // Fetch initial data
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [projResult, usersResult, clientsResult, timeResult, tasksResult, expensesResult] = await Promise.all([
                    pb.collection('projects').getList(1, 100, { sort: 'name' }),
                    pb.collection('users').getList(1, 100, { sort: 'created' }),
                    pb.collection('clients').getList(1, 100, { sort: 'name' }),
                    pb.collection('time_entries').getList(1, 500, {
                        sort: '-created',
                        expand: 'task,task.project,task.project.client,user',
                    }),
                    pb.collection('tasks').getList(1, 200, { sort: '-created' }),
                    pb.collection('external_expenses').getList(1, 200, { sort: '-created' }).catch(() => ({ items: [] })),
                ]);

                setProjects(filterProjectsByMode(projResult.items as ProjectRecord[]));
                setUsers(usersResult.items as UserRecord[]);
                setClients(filterClientsByMode(clientsResult.items as ClientRecord[]));
                setTimeEntries(filterTimeEntriesByMode(timeResult.items as TimeEntryRecord[]));
                setTasks(filterTasksByMode(tasksResult.items as TaskRecord[]));
                setExternalExpenses(expensesResult.items as ExternalExpenseRecord[]);
            } catch (error) {
                console.error('Failed to fetch report data:', error);
                toast.error('Fehler beim Laden der Auswertungsdaten');
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    // Build a map of taskId -> projectId for quick lookup
    const taskProjectMap = useMemo(() => {
        const map = new Map<string, string>();
        tasks.forEach((t) => {
            map.set(t.id, t.project);
        });
        return map;
    }, [tasks]);

    // Build a map of projectId -> project
    const projectMap = useMemo(() => {
        const map = new Map<string, ProjectRecord>();
        projects.forEach((p) => map.set(p.id, p));
        return map;
    }, [projects]);

    // Build a map of userId -> user
    const userMap = useMemo(() => {
        const map = new Map<string, UserRecord>();
        users.forEach((u) => map.set(u.id, u));
        return map;
    }, [users]);

    // Build a map of projectId -> clientId
    const projectClientMap = useMemo(() => {
        const map = new Map<string, string>();
        projects.forEach((p) => {
            if (p.client) {
                map.set(p.id, p.client);
            }
        });
        return map;
    }, [projects]);

    // Filter time entries based on current filters
    const filteredEntries = useMemo(() => {
        return timeEntries.filter((entry) => {
            // Date range filter
            if (filters.dateFrom) {
                const entryDate = entry.start_time || entry.created;
                if (entryDate < filters.dateFrom) return false;
            }
            if (filters.dateTo) {
                const entryDate = entry.start_time || entry.created;
                // Include entries up to end of the "to" day
                const endDate = new Date(filters.dateTo);
                endDate.setHours(23, 59, 59, 999);
                if (new Date(entryDate).getTime() > endDate.getTime()) return false;
            }

            // Project filter (via task relation)
            if (filters.projectIds.length > 0) {
                const taskProjectId = taskProjectMap.get(entry.task);
                if (!taskProjectId || !filters.projectIds.includes(taskProjectId)) {
                    return false;
                }
            }

            // Client filter (via project -> client relation)
            if (filters.clientIds.length > 0) {
                const taskProjectId = taskProjectMap.get(entry.task);
                if (!taskProjectId) return false;
                const entryClientId = projectClientMap.get(taskProjectId);
                if (!entryClientId || !filters.clientIds.includes(entryClientId)) {
                    return false;
                }
            }

            // User filter
            if (filters.userIds.length > 0) {
                if (!filters.userIds.includes(entry.user)) return false;
            }

            // Billable filter
            if (filters.billableFilter === 'billable') {
                if (entry.is_billable === false) return false;
            } else if (filters.billableFilter === 'non_billable') {
                if (entry.is_billable !== false) return false;
            } else if (filters.billableFilter === 'ready_to_invoice') {
                if (entry.is_billable === false) return false;
                if (entry.is_billed === true) return false;
            }

            return true;
        });
    }, [timeEntries, filters, taskProjectMap, projectClientMap]);

    // Compute report rows based on groupBy
    const reportRows: ReportRow[] = useMemo(() => {
        if (filteredEntries.length === 0) return [];

        const rowsMap = new Map<string, {
            hours: number;
            billableHours: number;
            taskCount: Set<string>;
            projectId?: string;
            userId?: string;
        }>();

        filteredEntries.forEach((entry) => {
            const taskProjectId = taskProjectMap.get(entry.task);
            const durationMinutes = entry.duration_minutes || (entry.duration ? entry.duration / 60 : 0);
            const hours = durationMinutes / 60;
            const isBillable = entry.is_billable !== false; // default billable

            let key: string;
            let projectId: string | undefined;
            let userId: string | undefined;

            if (filters.groupBy === 'project') {
                projectId = taskProjectId || 'unknown';
                key = `proj:${projectId}`;
            } else if (filters.groupBy === 'user') {
                userId = entry.user;
                key = `user:${userId}`;
            } else {
                // both
                projectId = taskProjectId || 'unknown';
                userId = entry.user;
                key = `proj:${projectId}|user:${userId}`;
            }

            if (!rowsMap.has(key)) {
                rowsMap.set(key, {
                    hours: 0,
                    billableHours: 0,
                    taskCount: new Set(),
                    projectId,
                    userId,
                });
            }

            const row = rowsMap.get(key)!;
            row.hours += hours;
            if (isBillable) row.billableHours += hours;
            row.taskCount.add(entry.task);
        });

        return Array.from(rowsMap.entries()).map(([key, data]) => {
            const project = data.projectId ? projectMap.get(data.projectId) : undefined;
            const user = data.userId ? userMap.get(data.userId) : undefined;

            return {
                id: key,
                projectId: data.projectId,
                projectName: project?.name,
                projectKey: project?.key,
                userName: user?.name || user?.email || 'Unbekannt',
                userEmail: user?.email || user?.id || '',
                hours: Math.round(data.hours * 100) / 100,
                billableHours: Math.round(data.billableHours * 100) / 100,
                percentage: 0,
                taskCount: data.taskCount.size,
                budgetHours: project?.budget_hours,
            };
        }).sort((a, b) => b.hours - a.hours);
    }, [filteredEntries, filters.groupBy, taskProjectMap, projectMap, userMap]);

    // Chart data
    const chartData: ChartDataPoint[] = useMemo(() => {
        return reportRows.map((row) => {
            const label = filters.groupBy === 'project'
                ? row.projectName || row.projectKey || 'Unknown'
                : filters.groupBy === 'user'
                    ? row.userName || row.userEmail || 'Unknown'
                    : `${row.projectKey || '?'} - ${row.userName || row.userEmail || '?'}`;

            return {
                label,
                value: row.hours,
            };
        });
    }, [reportRows, filters.groupBy]);

    // Summary stats
    const summary = useMemo(() => {
        const totalHours = reportRows.reduce((sum, r) => sum + r.hours, 0);
        const totalBillable = reportRows.reduce((sum, r) => sum + r.billableHours, 0);
        const totalBudget = projects.reduce((sum, p) => sum + (p.budget_hours || 0), 0);
        const budgetUsed = totalBudget > 0 ? (totalHours / totalBudget) * 100 : 0;

        return { totalHours, totalBillable, totalBudget, budgetUsed };
    }, [reportRows, projects]);

    // ============================================
    // Billing Dashboard Computations
    // ============================================

    // Build a local project map for billing computations
    const projectMapLocal = useMemo(() => {
        const map = new Map<string, ProjectRecord>();
        projects.forEach((p) => map.set(p.id, p));
        return map;
    }, [projects]);

    // Projects ready for billing (have billable hours)
    const billingReadyProjects = useMemo(() => {
        const projMap = new Map<string, {
            project: ProjectRecord;
            billableHours: number;
            totalHours: number;
            unbilledAmount: number;
            taskCount: number;
            entryCount: number;
        }>();

        for (const entry of timeEntries) {
            // Filter out already billed or non-billable entries for the billing dashboard
            if (entry.is_billed === true) continue;
            if (entry.is_billable === false) continue;

            const taskProjectId = taskProjectMap.get(entry.task);
            if (!taskProjectId) continue;

            // Apply project filter
            if (filters.projectIds.length > 0 && !filters.projectIds.includes(taskProjectId)) {
                continue;
            }

            // Apply client filter
            if (filters.clientIds.length > 0) {
                const entryClientId = projectClientMap.get(taskProjectId);
                if (!entryClientId || !filters.clientIds.includes(entryClientId)) continue;
            }

            // Apply user filter
            if (filters.userIds.length > 0 && !filters.userIds.includes(entry.user)) {
                continue;
            }

            // Apply date filters
            if (filters.dateFrom) {
                const entryDate = entry.start_time || entry.created;
                if (entryDate < filters.dateFrom) continue;
            }
            if (filters.dateTo) {
                const entryDate = entry.start_time || entry.created;
                const endDate = new Date(filters.dateTo);
                endDate.setHours(23, 59, 59, 999);
                if (new Date(entryDate).getTime() > endDate.getTime()) continue;
            }

            const project = projMap.get(taskProjectId);
            const durationMinutes = entry.duration_minutes || (entry.duration ? entry.duration / 60 : 0);
            const hours = durationMinutes / 60;

            if (project) {
                project.totalHours += hours;
                project.billableHours += hours;
                project.entryCount++;
            } else {
                const proj = projectMapLocal.get(taskProjectId);
                if (proj) {
                    projMap.set(taskProjectId, {
                        project: proj,
                        billableHours: hours,
                        totalHours: hours,
                        unbilledAmount: 0,
                        taskCount: 1,
                        entryCount: 1,
                    });
                }
            }
        }

        // Calculate unbilled amount per project using client's hourly rate
        const clientMap = new Map(clients.map(c => [c.id, c]));
        const defaultRate = Number(process.env.NEXT_PUBLIC_DEFAULT_HOURLY_RATE) || 150;

        for (const [projId, data] of projMap) {
            const proj = data.project;
            const budgetType = (proj as any).budget_type || 'hourly';
            const client = proj.client ? clientMap.get(proj.client) : undefined;
            const hourlyRate = client?.stundenhonorar || defaultRate;

            if (budgetType === 'fixed') {
                data.unbilledAmount = (proj as any).budget_fixed || 0;
            } else {
                data.unbilledAmount = data.billableHours * hourlyRate;
            }
        }

        return Array.from(projMap.values())
            .filter(d => d.billableHours > 0)
            .sort((a, b) => b.billableHours - a.billableHours);
    }, [timeEntries, taskProjectMap, projectMapLocal, clients, filters, projectClientMap]);

    const totalUnbilledAmount = useMemo(() => {
        return billingReadyProjects.reduce((sum, p) => sum + p.unbilledAmount, 0);
    }, [billingReadyProjects]);

    const totalBillableHoursAll = useMemo(() => {
        return billingReadyProjects.reduce((sum, p) => sum + p.billableHours, 0);
    }, [billingReadyProjects]);

    const markAsBilled = async (entries: TimeEntryRecord[], reference: string) => {
        const batchSize = 25;
        try {
            for (let i = 0; i < entries.length; i += batchSize) {
                const batch = entries.slice(i, i + batchSize);
                await Promise.all(batch.map(e =>
                    pb.collection('time_entries').update(e.id, {
                        is_billed: true,
                        billing_reference: reference,
                    })
                ));
            }
            setTimeEntries(prev => prev.map(e =>
                entries.some(pe => pe.id === e.id)
                    ? { ...e, is_billed: true, billing_reference: reference }
                    : e
            ));
            toast.success(`${entries.length} Einträge als abgerechnet markiert`);
        } catch (err) {
            toast.error('Fehler beim Markieren der Einträge');
        }
    };

    const handlePrintInvoice = (project: ProjectRecord, billableHours: number) => {
        const projectTaskSet = new Set(
            tasks.filter(t => t.project === project.id).map(t => t.id)
        );

        const projectEntries = timeEntries.filter(e => {
            if (!projectTaskSet.has(e.task)) return false;
            if (e.is_billable === false) return false;
            if (e.is_billed === true) return false;

            // Apply user filter if active
            if (filters.userIds.length > 0 && !filters.userIds.includes(e.user)) return false;

            // Apply date filters if active
            if (filters.dateFrom) {
                const entryDate = e.start_time || e.created;
                if (entryDate < filters.dateFrom) return false;
            }
            if (filters.dateTo) {
                const entryDate = e.start_time || e.created;
                const endDate = new Date(filters.dateTo);
                endDate.setHours(23, 59, 59, 999);
                if (new Date(entryDate).getTime() > endDate.getTime()) return false;
            }

            return true;
        });

        if (projectEntries.length === 0) {
            toast.error('Keine abrechenbaren Einträge für dieses Projekt');
            return;
        }

        const client = project.client ? clients.find(c => c.id === project.client) : undefined;
        const defaultRate = Number(process.env.NEXT_PUBLIC_DEFAULT_HOURLY_RATE) || 150;
        const invoiceNumber = `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${project.key}`;

        const taskMap = new Map(tasks.map(t => [t.id, t]));
        const lineItems: BillingLineItem[] = projectEntries.map(entry => {
            const task = taskMap.get(entry.task);
            const hours = (entry.duration_minutes || 0) / 60;
            const hourlyRate = client?.stundenhonorar || defaultRate;
            return {
                date: entry.start_time ? new Date(entry.start_time).toLocaleDateString('de-DE') : new Date(entry.created).toLocaleDateString('de-DE'),
                taskName: task?.title || 'Unbekannter Task',
                projectKey: project.key,
                description: entry.description || '',
                hours,
                hourlyRate,
                total: hours * hourlyRate,
            };
        });

        const subtotal = lineItems.reduce((sum, li) => sum + li.total, 0);
        const taxRate = 0.19;
        const taxAmount = subtotal * taxRate;

        printInvoice({
            companyName: process.env.NEXT_PUBLIC_COMPANY_NAME || 'Vibeforce GmbH',
            companyAddress: process.env.NEXT_PUBLIC_COMPANY_ADDRESS || '',
            clientName: client?.company || client?.name || 'Kunde',
            clientAddress: '', // Can be extended with client address fields
            invoiceNumber,
            invoiceDate: new Date().toLocaleDateString('de-DE'),
            periodFrom: new Date(Math.min(...projectEntries.map(e => new Date(e.start_time || e.created).getTime()))).toLocaleDateString('de-DE'),
            periodTo: new Date(Math.max(...projectEntries.map(e => new Date(e.start_time || e.created).getTime()))).toLocaleDateString('de-DE'),
            lineItems,
            subtotal,
            taxRate,
            taxAmount,
            total: subtotal + taxAmount,
            notes: `Rechnungsnummer: ${invoiceNumber}\nProjekt: ${project.name} [${project.key}]`,
        });

        toast.success(`Rechnung ${invoiceNumber} generiert`, {
            description: `${projectEntries.length} abrechenbare Einträge`,
            action: {
                label: 'Als abgerechnet markieren',
                onClick: () => markAsBilled(projectEntries, invoiceNumber),
            },
            duration: 10000,
        });
    };

    const handlePrintServiceRecord = (project: ProjectRecord, billableHours: number) => {
        const projectTaskSet = new Set(
            tasks.filter(t => t.project === project.id).map(t => t.id)
        );

        const projectEntries = timeEntries.filter(e => {
            if (!projectTaskSet.has(e.task)) return false;
            if (e.is_billable === false) return false;
            if (e.is_billed === true) return false;

            // Apply user filter if active
            if (filters.userIds.length > 0 && !filters.userIds.includes(e.user)) return false;

            // Apply date filters if active
            if (filters.dateFrom) {
                const entryDate = e.start_time || e.created;
                if (entryDate < filters.dateFrom) return false;
            }
            if (filters.dateTo) {
                const entryDate = e.start_time || e.created;
                const endDate = new Date(filters.dateTo);
                endDate.setHours(23, 59, 59, 999);
                if (new Date(entryDate).getTime() > endDate.getTime()) return false;
            }

            return true;
        });

        if (projectEntries.length === 0) {
            toast.error('Keine abrechenbaren Einträge für dieses Projekt');
            return;
        }

        const client = project.client ? clients.find(c => c.id === project.client) : undefined;

        const taskMap = new Map(tasks.map(t => [t.id, t]));
        const lineItems: BillingLineItem[] = projectEntries.map(entry => {
            const task = taskMap.get(entry.task);
            const hours = (entry.duration_minutes || 0) / 60;
            const hourlyRate = client?.stundenhonorar || Number(process.env.NEXT_PUBLIC_DEFAULT_HOURLY_RATE) || 150;
            return {
                date: entry.start_time ? new Date(entry.start_time).toLocaleDateString('de-DE') : new Date(entry.created).toLocaleDateString('de-DE'),
                taskName: task?.title || 'Unbekannter Task',
                projectKey: project.key,
                description: entry.description || '',
                hours,
                hourlyRate,
                total: hours * hourlyRate,
            };
        });

        printServiceRecord({
            projectName: project.name,
            projectKey: project.key,
            clientName: client?.name,
            periodFrom: new Date(Math.min(...projectEntries.map(e => new Date(e.start_time || e.created).getTime()))).toLocaleDateString('de-DE'),
            periodTo: new Date(Math.max(...projectEntries.map(e => new Date(e.start_time || e.created).getTime()))).toLocaleDateString('de-DE'),
            lineItems,
            totalHours: billableHours,
            totalAmount: billableHours * (client?.stundenhonorar || Number(process.env.NEXT_PUBLIC_DEFAULT_HOURLY_RATE) || 150),
        });
    };

    const handleLoadTemplate = useCallback((templateFilters: ReportFilterValues) => {
        setFilters(templateFilters);
    }, []);

    const escapeCSV = (val: string) => {
        const clean = val.replace(/"/g, '""');
        return clean.includes(',') || clean.includes('\n') || clean.includes('"') ? `"${clean}"` : clean;
    };

    const handleActionBarCSV = () => {
        if (filteredEntries.length === 0) {
            toast.error('Keine Daten zum Exportieren vorhanden');
            return;
        }
        try {
            const headerFields = ['Datum', 'Kunde', 'Projekt', 'Mitarbeiter', 'Tätigkeit', 'Beschreibung', 'Dauer'];
            const headers = headerFields.join(',');

            const lines = filteredEntries.map(entry => {
                const task = (entry as any).expand?.task;
                const proj = task?.expand?.project;
                const client = proj?.expand?.client;
                const user = (entry as any).expand?.user || pb.authStore.record;
                const hours = (entry.duration_minutes || 0) / 60;

                const dateObj = entry.date ? new Date(entry.date) : new Date(entry.created);
                const formattedDate = dateObj.toLocaleDateString('de-DE');

                return [
                    formattedDate,
                    escapeCSV(client?.name || 'Kein Kunde'),
                    escapeCSV(proj ? `${proj.key} - ${proj.name}` : 'Kein Projekt'),
                    escapeCSV(user?.name || user?.email || 'Mitarbeiter'),
                    escapeCSV(task?.title || 'Keine Aufgabe'),
                    escapeCSV(entry.description || ''),
                    formatHoursHM(hours),
                ].join(',');
            });

            const csvContent = [headers, ...lines].join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `zeiterfassung_${filters.dateFrom || 'export'}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            toast.success('CSV-Export erfolgreich');
        } catch {
            toast.error('Fehler beim CSV-Export');
        }
    };

    const handleActionBarPDF = async (showHourlyRate: boolean) => {
        if (filteredEntries.length === 0) {
            toast.error('Keine Daten zum Exportieren vorhanden');
            return;
        }
        const reportData = buildStundenreportInput(filteredEntries, showHourlyRate);
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            toast.error('Bitte Pop-ups für diese Seite erlauben');
            return;
        }
        printWindow.document.write('<html><body style="font-family:sans-serif;padding:40px;text-align:center;color:#666;"><p>Report wird generiert…</p></body></html>');

        try {
            const res = await fetch('/api/reports/stundenreport-export', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reportData),
            });
            if (!res.ok) throw new Error(`API error: ${res.status}`);
            const contentType = res.headers.get('content-type') || '';
            if (contentType.includes('application/pdf')) {
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                printWindow.location.href = url;
                toast.success('Stundenzettel (PDF) generiert');
            } else {
                const html = await res.text();
                printWindow.document.open();
                printWindow.document.write(html);
                printWindow.document.close();
            }
        } catch {
            printWindow.close();
            toast.error('Fehler beim PDF-Export');
        }
    };

    const handleActionBarPdfWithLogo = async () => {
        if (!reportRows.length || !filters.groupBy) return;
        try {
            await downloadReportPDF(reportRows, filters.groupBy, filters.dateFrom, filters.dateTo);
            toast.success('PDF-Export erfolgreich gestartet');
        } catch {
            toast.error('Fehler beim PDF-Export');
        }
    };

    if (isLoading) {
        return (
            <div className="p-8">
                <div className="max-w-7xl mx-auto space-y-8">
                    <div>
                        <Skeleton className="h-9 w-64 bg-muted" />
                        <Skeleton className="h-5 w-96 mt-2 bg-muted" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                            <Skeleton key={i} className="h-24 bg-muted rounded-xl" />
                        ))}
                    </div>
                    <Skeleton className="h-[400px] bg-muted rounded-xl" />
                </div>
            </div>
        );
    }

    return (
        <div className="p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                            <BarChart3 size={32} className="text-primary" />
                            Zeitauswertungen
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Stundenauswertungen, Abrechnungs-Dashboard und Leistungsnachweise.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <SaveTemplateDialog
                            currentFilters={filters}
                            onLoadTemplate={handleLoadTemplate}
                        />
                    </div>
                </div>

                {/* Preset Cards (Sofort-Auswertung) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {presets.map((preset, idx) => (
                        <Card
                            key={idx}
                            className="border-border bg-card/40 cursor-pointer hover:bg-muted/50 hover:border-primary/30 transition-all group"
                            onClick={() => applyPreset(preset.filter)}
                        >
                            <CardContent className="p-5">
                                <div className="flex flex-col gap-3">
                                    <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20 w-fit group-hover:scale-110 transition-transform">
                                        <preset.icon size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-foreground leading-tight">{preset.title}</h3>
                                        <p className="text-[11px] text-muted-foreground mt-1">{preset.description}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>


                {/* Tab Navigation */}
                <div className="flex items-center gap-1 p-1 rounded-xl bg-card/60 border border-border w-fit">
                    <button
                        onClick={() => setActiveTab('hours')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'hours'
                            ? 'bg-muted text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        <BarChart3 size={16} />
                        Stundenauswertung
                    </button>
                    <button
                        onClick={() => setActiveTab('billing')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'billing'
                            ? 'bg-muted text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        <Receipt size={16} />
                        Abrechnungs-Dashboard
                    </button>
                </div>

                {/* Filters */}
                <ReportFilters
                    projects={projects}
                    users={users}
                    clients={clients}
                    filters={filters}
                    onChange={setFilters}
                />

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="border-border bg-card/40">
                        <CardContent className="p-5">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
                                    <Clock size={20} />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground text-caps">Gesamtstunden</p>
                                    <h3 className="text-xl font-bold text-foreground tabular-nums">
                                        {summary.totalHours.toFixed(1)}h
                                    </h3>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border bg-card/40">
                        <CardContent className="p-5">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
                                    <DollarSign size={20} />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground text-caps">Abrechenbar</p>
                                    <h3 className="text-xl font-bold text-foreground tabular-nums">
                                        {summary.totalBillable.toFixed(1)}h
                                    </h3>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border bg-card/40">
                        <CardContent className="p-5">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
                                    <TrendingUp size={20} />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground text-caps">Budget gesamt</p>
                                    <h3 className="text-xl font-bold text-foreground tabular-nums">
                                        {summary.totalBudget > 0 ? `${summary.totalBudget}h` : '—'}
                                    </h3>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border bg-card/40">
                        <CardContent className="p-5">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
                                    <BarChart3 size={20} />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground text-caps">Budget genutzt</p>
                                    <h3 className={`text-xl font-bold tabular-nums ${
                                        summary.budgetUsed > 100 ? 'text-destructive' : summary.budgetUsed > 80 ? 'text-warning' : 'text-info'
                                    }`}
                                    >
                                        {summary.totalBudget > 0 ? `${summary.budgetUsed.toFixed(1)}%` : '—'}
                                    </h3>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Report Export Actions */}
                {activeTab === 'hours' && (
                    <div className="flex items-center gap-2 flex-wrap">
                        <Button variant="outline" size="sm" onClick={handleActionBarCSV}>
                            <FileText size={14} className="mr-1.5" /> CSV Stundenauswertung
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleActionBarPDF(false)}>
                            <FileText size={14} className="mr-1.5" /> PDF Leistungsnachweis
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleActionBarPdfWithLogo}>
                            <FileText size={14} className="mr-1.5" /> PDF mit Logo
                        </Button>
                    </div>
                )}

                {/* Chart */}
                <Card className="border-border bg-card/40">
                    <CardHeader>
                        <CardTitle className="text-foreground">Stundenverteilung</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ReportChart
                            data={chartData}
                            title=""
                            unit="h"
                            height={300}
                        />
                    </CardContent>
                </Card>

                {/* Table */}
                <Card className="border-border bg-card/40">
                    <CardHeader>
                        <CardTitle className="text-foreground">Detailtabelle</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ReportTable rows={reportRows} groupBy={filters.groupBy} />
                    </CardContent>
                </Card>
                {/* Billing Dashboard Tab */}
                {activeTab === 'billing' && (
                    <div className="space-y-6">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Card className="border-border bg-card/40">
                                <CardContent className="p-5">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
                                            <DollarSign size={20} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-muted-foreground text-caps">Offener Umsatz</p>
                                            <h3 className="text-xl font-bold text-foreground tabular-nums">
                                                {totalUnbilledAmount.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€
                                            </h3>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-border bg-card/40">
                                <CardContent className="p-5">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
                                            <Clock size={20} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-muted-foreground text-caps">Abrechenbare Stunden</p>
                                            <h3 className="text-xl font-bold text-foreground tabular-nums">
                                                {totalBillableHoursAll.toFixed(1)}h
                                            </h3>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-border bg-card/40">
                                <CardContent className="p-5">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
                                            <FileText size={20} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-muted-foreground text-caps">Rechnungsbereit</p>
                                            <h3 className="text-xl font-bold text-foreground tabular-nums">
                                                {billingReadyProjects.length} Projekte
                                            </h3>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-border bg-card/40">
                                <CardContent className="p-5">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
                                            <TrendingUp size={20} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-muted-foreground text-caps">Ø pro Projekt</p>
                                            <h3 className="text-xl font-bold text-foreground tabular-nums">
                                                {billingReadyProjects.length > 0
                                                    ? (totalUnbilledAmount / billingReadyProjects.length).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '€'
                                                    : '—'}
                                            </h3>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Projects ready for billing */}
                        <Card className="border-border bg-card/40">
                            <CardHeader>
                                <CardTitle className="text-foreground flex items-center gap-2">
                                    <Receipt size={18} className="text-primary" />
                                    Rechnungsbereite Projekte
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {billingReadyProjects.length === 0 ? (
                                    <div className="text-center py-12 text-muted-foreground text-sm">
                                        Keine Projekte mit abrechenbaren Stunden gefunden.
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {billingReadyProjects.map((data) => {
                                            const proj = data.project;
                                            const client = proj.client ? clients.find(c => c.id === proj.client) : undefined;
                                            const budgetType = (proj as any).budget_type || 'hourly';

                                            return (
                                                <div
                                                    key={proj.id}
                                                    className="flex items-center justify-between p-4 rounded-xl bg-card/60 border border-border/50 hover:border-primary/30 transition-colors"
                                                >
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-semibold text-foreground">{proj.name}</span>
                                                            <Badge variant="outline" className="bg-background border-border text-muted-foreground font-mono text-[10px] shadow-none">
                                                                {proj.key}
                                                            </Badge>
                                                            {client && (
                                                                <span className="text-xs text-muted-foreground">· {client.name}</span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-4 mt-1.5 text-xs text-muted-foreground">
                                                            <span>{data.billableHours.toFixed(1)}h abrechenbar</span>
                                                            <span>{data.entryCount} Einträge</span>
                                                              <Badge className={`text-[10px] shadow-none ${budgetType === 'fixed'
                                                                  ? 'bg-info/10 text-info border-info/20'
                                                                  : budgetType === 'retainer'
                                                                      ? 'bg-primary/10 text-primary border-primary/20'
                                                                      : 'bg-muted/50 text-muted-foreground border-border'
                                                            }`}>
                                                                {budgetType === 'fixed' ? 'Festpreis' : budgetType === 'retainer' ? 'Retainer' : 'Stundensatz'}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <div className="text-right">
                                                            <div className="text-lg font-bold text-foreground tabular-nums">
                                                                {data.unbilledAmount.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€
                                                            </div>
                                                            <div className="text-xs text-muted-foreground">offen</div>
                                                        </div>
                                                        <ReportsExportDropdown
                                                            entries={timeEntries}
                                                            taskProjectMap={taskProjectMap}
                                                            projectId={proj.id}
                                                            mode="billing"
                                                            onPrintServiceRecord={() => handlePrintServiceRecord(proj, data.billableHours)}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Quick Actions */}
                        <Card className="border-border bg-card/40">
                            <CardHeader>
                                <CardTitle className="text-foreground flex items-center gap-2">
                                    <FileText size={18} className="text-primary" />
                                    Rechnungsvorlage erstellen
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Wähle ein Projekt aus, um eine Rechnungsvorlage mit allen abrechenbaren
                                    Leistungen zu generieren. Die Vorlage kann als PDF gespeichert werden.
                                </p>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                    {billingReadyProjects.slice(0, 8).map((data) => (
                                        <button
                                            key={data.project.id}
                                            onClick={() => handlePrintInvoice(data.project, data.billableHours)}
                                            className="p-3 rounded-xl bg-card/60 border border-border/50 hover:border-primary/30 hover:bg-muted/50 transition-all text-left"
                                        >
                                            <div className="text-sm font-medium text-foreground truncate">{data.project.name}</div>
                                            <div className="text-xs text-muted-foreground mt-1">
                                                {data.billableHours.toFixed(1)}h · {data.unbilledAmount.toLocaleString('de-DE', { minimumFractionDigits: 0 })}€
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

            </div>
        </div>
    );
}
