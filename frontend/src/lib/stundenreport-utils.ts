import type { TimeEntryRecord } from '@/lib/pocketbase-types';
import type { StundenreportInput, StundenreportProjectGroup, StundenreportEntry } from '@/lib/stundenreport';

export const formatHoursHM = (hours: number): string => {
    const totalMinutes = Math.round(hours * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h}:${String(m).padStart(2, '0')}h`;
};

const formatCurrency = (amount: number): string => {
    return `${amount.toFixed(2).replace('.', ',')} €`;
};

export const getClientName = (entries: TimeEntryRecord[]): string => {
    const uniqueClients = Array.from(new Set(
        entries
            .map(entry => (entry as any).expand?.task?.expand?.project?.expand?.client?.name)
            .filter(Boolean)
    ));
    if (uniqueClients.length === 1) return uniqueClients[0] as string;
    if (uniqueClients.length > 1) return uniqueClients.join(', ');
    return 'Kein Kunde';
};

export const hasHourlyRates = (entries: TimeEntryRecord[]): boolean => {
    return entries.some(
        (entry) => ((entry as any).expand?.task?.expand?.project?.expand?.client?.stundenhonorar || 0) > 0
    );
};

export const buildStundenreportInput = (entries: TimeEntryRecord[], showHourlyRate: boolean): StundenreportInput => {
    const projectMap: Record<string, { name: string; clientName: string; entries: StundenreportEntry[]; totalMinutes: number }> = {};

    entries.forEach((entry) => {
        const task = (entry as any).expand?.task;
        const project = task?.expand?.project;
        const client = project?.expand?.client;
        const key = project?.key || 'OHNE';
        const name = project?.name || 'Kein Projekt';

        if (!projectMap[key]) {
            projectMap[key] = { name, clientName: client?.name || 'Kein Kunde', entries: [], totalMinutes: 0 };
        }

        const minutes = entry.duration_minutes || 0;
        const hours = minutes / 60;
        const dateObj = entry.date ? new Date(entry.date) : new Date(entry.created);
        const formattedDate = dateObj.toLocaleDateString('de-DE');
        const clientHourlyRate = client?.stundenhonorar || 0;

        projectMap[key].totalMinutes += minutes;

        const entryData: StundenreportEntry = {
            date: formattedDate,
            task: task?.title || 'Keine Aufgabe',
            note: entry.description || '',
            duration: formatHoursHM(hours),
        };

        if (showHourlyRate && clientHourlyRate > 0) {
            entryData.hourlyRate = formatCurrency(clientHourlyRate);
            entryData.cost = formatCurrency(clientHourlyRate * hours);
        }

        projectMap[key].entries.push(entryData);
    });

    let totalMinutes = 0;
    let totalCostCents = 0;

    const projects: StundenreportProjectGroup[] = Object.entries(projectMap).map(([key, group]) => {
        totalMinutes += group.totalMinutes;
        const totalHours = group.totalMinutes / 60;

        const project: StundenreportProjectGroup = {
            projectName: group.name,
            projectKey: key,
            clientName: group.clientName,
            projectTotalDuration: formatHoursHM(totalHours),
            entries: group.entries,
        };

        if (showHourlyRate && group.entries.some((e) => e.cost)) {
            const projectCost = group.entries.reduce((sum, e) => {
                const costStr = e.cost?.replace(/[^0-9,]/g, '').replace(',', '.') || '0';
                return sum + parseFloat(costStr);
            }, 0);
            totalCostCents += Math.round(projectCost * 100);
            project.projectTotalCost = formatCurrency(projectCost);
        }

        return project;
    });

    const hasRates = showHourlyRate && projects.some((p) => p.projectTotalCost);

    const dates = entries
        .map((e) => e.date || e.created.split('T')[0])
        .filter(Boolean)
        .sort();
    const formatDate = (dStr: string) => {
        try { return new Date(dStr).toLocaleDateString('de-DE'); }
        catch { return dStr; }
    };

    return {
        meta: {
            clientName: getClientName(entries),
            periodFrom: dates.length ? formatDate(dates[0]) : new Date().toLocaleDateString('de-DE'),
            periodTo: dates.length ? formatDate(dates[dates.length - 1]) : new Date().toLocaleDateString('de-DE'),
            generatedAt: new Date().toLocaleDateString('de-DE'),
            showHourlyRate: hasRates,
            totalDuration: formatHoursHM(totalMinutes / 60),
            totalCost: hasRates ? formatCurrency(totalCostCents / 100) : undefined,
        },
        projects,
    };
};
