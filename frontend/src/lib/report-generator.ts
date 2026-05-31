import type { TimeEntryRecord, TaskRecord, ProjectRecord, ClientRecord } from '@/lib/pocketbase-types';

export interface ReportGenerationContext {
    timeEntry: TimeEntryRecord;
    task?: TaskRecord;
    project?: ProjectRecord;
    client?: ClientRecord;
    sessionTitle?: string;
}

export function generateTimeEntryReport(context: ReportGenerationContext): string {
    const { timeEntry, task, project, client, sessionTitle } = context;

    const date = timeEntry.start_time
        ? new Date(timeEntry.start_time).toLocaleDateString('de-DE', { year: 'numeric', month: '2-digit', day: '2-digit' })
        : new Date(timeEntry.created).toLocaleDateString('de-DE', { year: 'numeric', month: '2-digit', day: '2-digit' });

    const durationHours = (timeEntry.duration_minutes || 0) / 60;
    const durationStr = timeEntry.duration_minutes
        ? `${Math.floor(timeEntry.duration_minutes / 60)}h ${timeEntry.duration_minutes % 60}m`
        : '—';

    const lines: string[] = [];

    lines.push(`# ${sessionTitle || 'Session Report'}`);
    lines.push('');
    lines.push(`> **Datum:** ${date}`);
    if (durationHours > 0) {
        lines.push(`> **Dauer:** ${durationStr} (${durationHours.toFixed(1)}h)`);
    }
    if (client) {
        lines.push(`> **Kunde:** ${client.name}`);
    }
    if (project) {
        lines.push(`> **Projekt:** ${project.name} [${project.key}]`);
    }
    if (task) {
        lines.push(`> **Aufgabe:** ${task.title}`);
    }
    if (timeEntry.is_billable) {
        lines.push(`> **Abrechenbar:** Ja`);
    }
    lines.push('');

    if (project || client) {
        lines.push('---');
        lines.push('');
        lines.push('## Projektkontext');
        lines.push('');
        if (project) {
            lines.push(`- **Projekt:** ${project.name} (${project.key})`);
            if (project.budget_hours) lines.push(`- **Budget:** ${project.budget_hours}h`);
        }
        if (client) {
            if (client.stundenhonorar) lines.push(`- **Stundensatz:** ${client.stundenhonorar}€/h`);
        }
        lines.push('');
    }

    lines.push('---');
    lines.push('');
    lines.push('## Erledigte Arbeit');
    lines.push('');
    if (timeEntry.description) {
        lines.push(timeEntry.description);
    } else if (task) {
        lines.push(`Bearbeitung der Aufgabe "${task.title}"`);
    } else {
        lines.push('Keine detaillierte Beschreibung erfasst.');
    }
    lines.push('');

    if (task?.description) {
        lines.push('### Aufgabenbeschreibung');
        lines.push('');
        lines.push(task.description);
        lines.push('');
    }

    lines.push('---');
    lines.push('');
    lines.push('## Zeiterfassung');
    lines.push('');
    lines.push(`| Feld | Wert |`);
    lines.push(`|------|------|`);
    lines.push(`| Datum | ${date} |`);
    lines.push(`| Dauer | ${durationStr} |`);
    if (timeEntry.start_time) {
        lines.push(`| Startzeit | ${new Date(timeEntry.start_time).toLocaleTimeString('de-DE')} |`);
    }
    if (timeEntry.end_time) {
        lines.push(`| Endzeit | ${new Date(timeEntry.end_time).toLocaleTimeString('de-DE')} |`);
    }
    lines.push(`| Abrechenbar | ${timeEntry.is_billable ? 'Ja' : 'Nein'} |`);
    if (timeEntry.is_billed) {
        lines.push(`| Abgerechnet | Ja (Ref: ${timeEntry.billing_reference || '—'}) |`);
    }
    lines.push('');

    lines.push('---');
    lines.push(`*Automatisch generiert am ${new Date().toLocaleDateString('de-DE', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}*`);

    return lines.join('\n');
}

export function generateTimeEntryReportBlob(content: string): Blob {
    return new Blob([content], { type: 'text/markdown' });
}
