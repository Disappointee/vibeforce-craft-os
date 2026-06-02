import type { TimeEntryRecord } from '@/lib/pocketbase-types';
import type { StundenreportInput, StundenreportProjectGroup, StundenreportEntry } from '@/lib/stundenreport';

export const formatHoursHM = (hours: number): string => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}:${String(m).padStart(2, '0')}h`;
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

export const buildStundenreportInput = (entries: TimeEntryRecord[]): StundenreportInput => {
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

        projectMap[key].totalMinutes += minutes;

        const entryData: StundenreportEntry = {
            date: formattedDate,
            task: task?.title || 'Keine Aufgabe',
            note: entry.description || '',
            duration: formatHoursHM(hours),
        };

        projectMap[key].entries.push(entryData);
    });

    let totalMinutes = 0;

    const projects: StundenreportProjectGroup[] = Object.entries(projectMap).map(([key, group]) => {
        totalMinutes += group.totalMinutes;
        const totalHours = group.totalMinutes / 60;

        return {
            projectName: group.name,
            projectKey: key,
            clientName: group.clientName,
            projectTotalDuration: formatHoursHM(totalHours),
            entries: group.entries,
        };
    });

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
            totalDuration: formatHoursHM(totalMinutes / 60),
        },
        projects,
    };
};
