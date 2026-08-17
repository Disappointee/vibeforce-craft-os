'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { pb } from '@/lib/pocketbase';
import { BarChart3, Clock, TrendingUp, FileText, Download, FileCode } from 'lucide-react';
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
} from '@/lib/pocketbase-types';
import { ReportFilters, ReportFilterValues, DatePreset } from '@/components/reports/ReportFilters';
import { ReportChart, ChartDataPoint } from '@/components/reports/ReportChart';
import { ReportTable, ReportRow } from '@/components/reports/ReportTable';
import { SaveTemplateDialog } from '@/components/reports/SaveTemplateDialog';
import { downloadReportPDF, type TaskDetailReportData } from '@/lib/pdf-generator';
import { buildStundenreportInput, formatHoursHM, parseDurationHM } from '@/lib/stundenreport-utils';
import type { StundenreportInput } from '@/lib/stundenreport';
import { getUserDisplayName } from '@/lib/user-utils';
import { generateZugferdXml } from '@/lib/zugferd';

function getPresetDates(preset: DatePreset): { dateFrom: string; dateTo: string } {
    const now = new Date();
    const toISO = (d: Date) => d.toISOString().split('T')[0];
    switch (preset) {
        case 'this_month': {
            return { dateFrom: toISO(new Date(now.getFullYear(), now.getMonth(), 1)), dateTo: toISO(now) };
        }
        case 'last_month': {
            return {
                dateFrom: toISO(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
                dateTo: toISO(new Date(now.getFullYear(), now.getMonth(), 0)),
            };
        }
        case 'last_quarter': {
            const month = now.getMonth();
            const qStart = Math.floor(month / 3) * 3 - 3;
            const first = new Date(now.getFullYear(), qStart < 0 ? qStart + 12 : qStart, 1);
            const last = new Date(now.getFullYear(), Math.floor(month / 3) * 3, 0);
            return { dateFrom: toISO(first), dateTo: toISO(last) };
        }
        case 'this_quarter': {
            const month = now.getMonth();
            const qStart = Math.floor(month / 3) * 3;
            const first = new Date(now.getFullYear(), qStart, 1);
            return { dateFrom: toISO(first), dateTo: toISO(now) };
        }
        case 'this_year': {
            const first = new Date(now.getFullYear(), 0, 1);
            return { dateFrom: toISO(first), dateTo: toISO(now) };
        }
        case 'last_year': {
            const first = new Date(now.getFullYear() - 1, 0, 1);
            const last = new Date(now.getFullYear(), 0, 0);
            return { dateFrom: toISO(first), dateTo: toISO(last) };
        }
        default:
            return { dateFrom: '', dateTo: '' };
    }
}

function mapStundenreportToPdfData(data: StundenreportInput): TaskDetailReportData {
    return {
        clientName: data.meta.clientName,
        periodFrom: data.meta.periodFrom,
        periodTo: data.meta.periodTo,
        generatedAt: data.meta.generatedAt,
        clients: data.clients.map(c => ({
            clientName: c.clientName,
            clientTotalDuration: c.clientTotalDuration,
            projects: c.projects.map(p => ({
                projectName: p.projectName,
                projectKey: p.projectKey,
                clientName: p.clientName || '',
                projectTotalHours: p.entries.reduce((sum, e) => sum + parseDurationHM(e.duration), 0),
                projectTotalDuration: p.projectTotalDuration,
                entries: p.entries.map(e => ({
                    taskName: e.task,
                    note: e.note,
                    durationHours: parseDurationHM(e.duration),
                    duration: e.duration,
                })),
            })),
        })),
        grandTotalHours: data.clients.reduce((sum, c) =>
            sum + c.projects.reduce((ps, p) =>
                ps + p.entries.reduce((es, e) => es + parseDurationHM(e.duration), 0), 0), 0),
        grandTotalDuration: data.meta.totalDuration,
    };
}

function ReportsExportDropdown({
    entries,
    rows,
    groupBy,
    dateFrom,
    dateTo,
}: {
    entries: TimeEntryRecord[];
    rows: ReportRow[];
    groupBy: 'project' | 'user' | 'both';
    dateFrom: string;
    dateTo: string;
}) {
    const [isExporting, setIsExporting] = useState(false);

    const escapeCSV = (val: string) => {
        const clean = val.replace(/"/g, '""');
        return clean.includes(',') || clean.includes('\n') || clean.includes('"') ? `"${clean}"` : clean;
    };

    const handleSummaryCSV = () => {
        if (!rows.length) return;
        try {
            setIsExporting(true);
            const headers = [
                groupBy !== 'user' ? 'Projekt' : '',
                groupBy !== 'project' ? 'Mitarbeiter' : '',
                'Stunden', 'Tasks',
            ].filter(Boolean).join(',');

            const lines = rows.map(row => {
                const projectCol = groupBy !== 'user' ? escapeCSV(`${row.projectKey || ''} - ${row.projectName || ''}`) : '';
                const userCol = groupBy !== 'project' ? escapeCSV(row.userName || row.userEmail || '') : '';
                const cols: string[] = [];
                if (groupBy !== 'user') cols.push(projectCol);
                if (groupBy !== 'project') cols.push(userCol);
                cols.push(row.hours.toFixed(2), row.taskCount.toString());
                return cols.join(',');
            });

            const csv = [headers, ...lines].join('\n');
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `stundenauswertung_${dateFrom}_${dateTo}.csv`;
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

    const handleStundenreportPDF = async () => {
        if (entries.length === 0) {
            toast.error('Keine Daten zum Exportieren vorhanden');
            return;
        }
        const reportData = buildStundenreportInput(entries);
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
                toast.success('Leistungsnachweis (PDF) generiert');
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

    const handlePdfWithLogo = async () => {
        if (entries.length === 0) {
            toast.error('Keine Daten zum Exportieren vorhanden');
            return;
        }
        try {
            setIsExporting(true);
            const pdfData = mapStundenreportToPdfData(buildStundenreportInput(entries));
            await downloadReportPDF(pdfData);
            toast.success('PDF-Export erfolgreich gestartet');
        } catch {
            toast.error('Fehler beim PDF-Export');
        } finally {
            setIsExporting(false);
        }
    };

    const handleZugferdExport = () => {
        if (entries.length === 0) {
            toast.error('Keine Daten zum Exportieren vorhanden');
            return;
        }
        try {
            setIsExporting(true);
            const reportData = buildStundenreportInput(entries);
            const firstClient = reportData.clients[0]?.clientName || 'Kunde';
            
            const lineItems = entries.map((entry) => {
                const durationHours = ((entry.duration_minutes || 0) / 60);
                const task = (entry as any).expand?.task;
                const project = task?.expand?.project;
                return {
                    name: task?.title || 'Dienstleistung',
                    description: `${project?.name ? `[${project.name}] ` : ''}${entry.description || ''}`,
                    quantity: durationHours,
                    unitCode: 'HUR',
                    netAmount: 120,
                    taxPercent: 0.19,
                };
            });

            const subtotal = lineItems.reduce((sum, item) => sum + (item.quantity * item.netAmount), 0);
            const taxRate = 0.19;
            const taxAmount = subtotal * taxRate;
            const total = subtotal + taxAmount;

            const xmlString = generateZugferdXml({
                invoiceNumber: `VF-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`,
                invoiceDate: new Date().toISOString().split('T')[0],
                periodFrom: dateFrom || new Date().toISOString().split('T')[0],
                periodTo: dateTo || new Date().toISOString().split('T')[0],
                sellerName: 'Vibeforce GmbH',
                sellerStreet: 'Agenturstraße 1',
                sellerCity: '10115 Berlin',
                sellerCountry: 'DE',
                sellerTaxId: 'DE123456789',
                buyerName: firstClient,
                buyerStreet: 'Kundenstraße 10',
                buyerCity: '10115 Berlin',
                buyerCountry: 'DE',
                lineItems: lineItems.length > 0 ? lineItems : [{
                    name: 'Beratungsleistung',
                    description: 'Zeiterfassung',
                    quantity: 1,
                    unitCode: 'HUR',
                    netAmount: 120,
                    taxPercent: 0.19
                }],
                subtotal,
                taxRate,
                taxAmount,
                total,
                currency: 'EUR',
                paymentTerms: 'Zahlbar innerhalb von 14 Tagen ohne Abzug.',
            });

            const blob = new Blob([xmlString], { type: 'application/xml;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `zugferd-factur-x-${dateFrom || 'report'}.xml`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            toast.success('ZUGFeRD 2.1.1 E-Rechnungs-XML erfolgreich exportiert');
        } catch (err) {
            console.error('ZUGFeRD export failed:', err);
            toast.error('Fehler beim Generieren der ZUGFeRD-XML');
        } finally {
            setIsExporting(false);
        }
    };

    const disabled = isExporting || entries.length === 0;

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
                <DropdownMenuItem onClick={handleStundenreportPDF} className="flex items-center gap-2 cursor-pointer hover:bg-muted focus:bg-muted">
                    <FileText size={16} className="text-red-400" />
                    <span>PDF Leistungsnachweis</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handlePdfWithLogo} className="flex items-center gap-2 cursor-pointer hover:bg-muted focus:bg-muted">
                    <FileText size={16} className="text-orange-400" />
                    <span>PDF mit Logo</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleZugferdExport} className="flex items-center gap-2 cursor-pointer hover:bg-muted focus:bg-muted">
                    <FileCode size={16} className="text-primary" />
                    <span>ZUGFeRD 2.1.1 XML (E-Rechnung)</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export default function ReportsPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [projects, setProjects] = useState<ProjectRecord[]>([]);
    const [users, setUsers] = useState<UserRecord[]>([]);
    const [clients, setClients] = useState<ClientRecord[]>([]);
    const [timeEntries, setTimeEntries] = useState<TimeEntryRecord[]>([]);
    const [tasks, setTasks] = useState<TaskRecord[]>([]);

    const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const [filters, setFilters] = useState<ReportFilterValues>({
        datePreset: 'this_month',
        dateFrom: firstOfMonth,
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
        { icon: Clock, title: 'Projektübersicht', description: 'Gruppiert nach Projekt & Person', filter: { billableFilter: 'all' as const, groupBy: 'both' as const } },
        { icon: FileText, title: 'Stundenreport', description: 'Detaillierte Aufgabenliste je Projekt', filter: { billableFilter: 'all' as const, groupBy: 'both' as const } },
    ];

    const applyPreset = (presetFilter: Partial<ReportFilterValues>) => {
        setFilters(prev => ({ ...prev, ...presetFilter }));
        toast.success('Filter angewendet');
    };

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [projResult, usersResult, clientsResult, timeResult, tasksResult] = await Promise.all([
                    pb.collection('projects').getList(1, 100, { sort: 'name' }),
                    pb.collection('users').getList(1, 100, { sort: 'created' }),
                    pb.collection('clients').getList(1, 100, { sort: 'name' }),
                    pb.collection('time_entries').getList(1, 500, {
                        sort: '-created',
                        expand: 'task,task.project,task.project.client,user',
                    }),
                    pb.collection('tasks').getList(1, 200, { sort: '-created' }),
                ]);

                setProjects(projResult.items as ProjectRecord[]);
                setUsers(usersResult.items as UserRecord[]);
                setClients(clientsResult.items as ClientRecord[]);
                setTimeEntries(timeResult.items as TimeEntryRecord[]);
                setTasks(tasksResult.items as TaskRecord[]);
            } catch (error) {
                console.error('Failed to fetch report data:', error);
                toast.error('Fehler beim Laden der Auswertungsdaten');
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const taskProjectMap = useMemo(() => {
        const map = new Map<string, string>();
        tasks.forEach((t) => {
            map.set(t.id, t.project);
        });
        return map;
    }, [tasks]);

    const projectMap = useMemo(() => {
        const map = new Map<string, ProjectRecord>();
        projects.forEach((p) => map.set(p.id, p));
        return map;
    }, [projects]);

    const userMap = useMemo(() => {
        const map = new Map<string, UserRecord>();
        users.forEach((u) => map.set(u.id, u));
        return map;
    }, [users]);

    const projectClientMap = useMemo(() => {
        const map = new Map<string, string>();
        projects.forEach((p) => {
            if (p.client) {
                map.set(p.id, p.client);
            }
        });
        return map;
    }, [projects]);

    const filteredEntries = useMemo(() => {
        return timeEntries.filter((entry) => {
            if (filters.dateFrom) {
                const entryDate = entry.start_time || entry.created;
                if (entryDate < filters.dateFrom) return false;
            }
            if (filters.dateTo) {
                const entryDate = entry.start_time || entry.created;
                const endDate = new Date(filters.dateTo);
                endDate.setHours(23, 59, 59, 999);
                if (new Date(entryDate).getTime() > endDate.getTime()) return false;
            }

            if (filters.projectIds.length > 0) {
                const taskProjectId = taskProjectMap.get(entry.task);
                if (!taskProjectId || !filters.projectIds.includes(taskProjectId)) {
                    return false;
                }
            }

            if (filters.clientIds.length > 0) {
                const taskProjectId = taskProjectMap.get(entry.task);
                if (!taskProjectId) return false;
                const entryClientId = projectClientMap.get(taskProjectId);
                if (!entryClientId || !filters.clientIds.includes(entryClientId)) {
                    return false;
                }
            }

            if (filters.userIds.length > 0) {
                if (!filters.userIds.includes(entry.user)) return false;
            }

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

    const reportRows: ReportRow[] = useMemo(() => {
        if (filteredEntries.length === 0) return [];

        const rowsMap = new Map<string, {
            hours: number;
            taskCount: Set<string>;
            projectId?: string;
            userId?: string;
        }>();

        filteredEntries.forEach((entry) => {
            const taskProjectId = taskProjectMap.get(entry.task);
            const durationMinutes = entry.duration_minutes || (entry.duration ? entry.duration / 60 : 0);
            const hours = durationMinutes / 60;

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
                projectId = taskProjectId || 'unknown';
                userId = entry.user;
                key = `proj:${projectId}|user:${userId}`;
            }

            if (!rowsMap.has(key)) {
                rowsMap.set(key, {
                    hours: 0,
                    taskCount: new Set(),
                    projectId,
                    userId,
                });
            }

            const row = rowsMap.get(key)!;
            row.hours += hours;
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
                userName: getUserDisplayName(user) || 'Unbekannt',
                userEmail: user?.email || user?.id || '',
                hours: Math.round(data.hours * 100) / 100,
                taskCount: data.taskCount.size,
            };
        }).sort((a, b) => b.hours - a.hours);
    }, [filteredEntries, filters.groupBy, taskProjectMap, projectMap, userMap]);

    const chartData: ChartDataPoint[] = useMemo(() => {
        return reportRows.map((row) => {
            const label = filters.groupBy === 'project'
                ? row.projectName || row.projectKey || 'Unknown'
                : filters.groupBy === 'user'
                    ? row.userName || row.userEmail || 'Unknown'
                    : `${row.projectKey || '?'} - ${row.userName || row.userEmail || '?'}`;

            return { label, value: row.hours };
        });
    }, [reportRows, filters.groupBy]);

    const summary = useMemo(() => {
        const totalHours = reportRows.reduce((sum, r) => sum + r.hours, 0);
        const totalTasks = reportRows.reduce((sum, r) => sum + r.taskCount, 0);
        return { totalHours, totalTasks };
    }, [reportRows]);

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
                    escapeCSV(getUserDisplayName(user) || 'Mitarbeiter'),
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

    const handleActionBarPDF = async () => {
        if (filteredEntries.length === 0) {
            toast.error('Keine Daten zum Exportieren vorhanden');
            return;
        }
        const reportData = buildStundenreportInput(filteredEntries);
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
                toast.success('Leistungsnachweis (PDF) generiert');
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
        if (filteredEntries.length === 0) {
            toast.error('Keine Daten zum Exportieren vorhanden');
            return;
        }
        try {
            const pdfData = mapStundenreportToPdfData(buildStundenreportInput(filteredEntries));
            await downloadReportPDF(pdfData);
            toast.success('PDF-Export erfolgreich gestartet');
        } catch {
            toast.error('Fehler beim PDF-Export');
        }
    };

    const handleLoadTemplate = useCallback((templateFilters: ReportFilterValues) => {
        setFilters(templateFilters);
    }, []);

    if (isLoading) {
        return (
            <div className="p-8">
                <div className="max-w-7xl mx-auto space-y-8">
                    <div>
                        <Skeleton className="h-9 w-64 bg-muted" />
                        <Skeleton className="h-5 w-96 mt-2 bg-muted" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[1, 2, 3].map((i) => (
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
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                            <BarChart3 size={32} className="text-primary" />
                            Zeitauswertungen
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Stundenauswertungen und Leistungsnachweise.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <SaveTemplateDialog
                            currentFilters={filters}
                            onLoadTemplate={handleLoadTemplate}
                        />
                    </div>
                </div>

                {/* Preset Cards */}
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

                {/* Filters */}
                <ReportFilters
                    projects={projects}
                    users={users}
                    clients={clients}
                    filters={filters}
                    onChange={setFilters}
                />

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                                    <TrendingUp size={20} />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground text-caps">Aufgaben</p>
                                    <h3 className="text-xl font-bold text-foreground tabular-nums">
                                        {summary.totalTasks}
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
                                    <p className="text-xs font-medium text-muted-foreground text-caps">Einträge</p>
                                    <h3 className="text-xl font-bold text-foreground tabular-nums">
                                        {filteredEntries.length}
                                    </h3>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Report Export Actions */}
                <div className="flex items-center gap-2 flex-wrap">
                    <Button variant="outline" size="sm" onClick={handleActionBarCSV}>
                        <FileText size={14} className="mr-1.5" /> CSV Stundenauswertung
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleActionBarPDF}>
                        <FileText size={14} className="mr-1.5" /> PDF Leistungsnachweis
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleActionBarPdfWithLogo}>
                        <FileText size={14} className="mr-1.5" /> PDF mit Logo
                    </Button>
                </div>

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
            </div>
        </div>
    );
}
