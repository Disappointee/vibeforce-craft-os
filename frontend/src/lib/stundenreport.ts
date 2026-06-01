import { reportTemplateHtml, reportTemplateEditorial, reportTemplateDark, reportTemplateSwiss } from '@/lib/report-template';

export type ReportTemplate = 'default' | 'editorial' | 'dark' | 'swiss';

const templateMap: Record<ReportTemplate, string> = {
  default: reportTemplateHtml,
  editorial: reportTemplateEditorial,
  dark: reportTemplateDark,
  swiss: reportTemplateSwiss,
};

export interface StundenreportMeta {
  clientName: string;
  periodFrom: string;
  periodTo: string;
  generatedAt: string;
  logoUrl?: string;
  showHourlyRate: boolean;
  totalDuration: string;
  totalCost?: string;
}

export interface StundenreportEntry {
  date: string;
  task: string;
  note: string;
  duration: string;
  hourlyRate?: string;
  cost?: string;
}

export interface StundenreportProjectGroup {
  projectName: string;
  projectKey: string;
  clientName?: string;
  projectTotalDuration: string;
  projectTotalCost?: string;
  entries: StundenreportEntry[];
}

export interface StundenreportInput {
  meta: StundenreportMeta;
  projects: StundenreportProjectGroup[];
}

function esc(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escAttr(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function buildProjectTable(project: StundenreportProjectGroup, showHourlyRate: boolean, showProjectClient: boolean): string {
  const rowsHtml = project.entries.map((entry) => {
    const rateCell = showHourlyRate
      ? `<td class="numeric">${entry.hourlyRate ? esc(entry.hourlyRate) : '—'}</td>`
      : '';
    const costCellEntry = showHourlyRate
      ? `<td class="numeric">${entry.cost ? esc(entry.cost) : '—'}</td>`
      : '';
    return `
    <tr>
      <td class="col-date">${esc(entry.date)}</td>
      <td class="col-task">${esc(entry.task)}</td>
      <td class="col-note">${esc(entry.note)}</td>
      <td class="col-duration numeric">${esc(entry.duration)}</td>${rateCell}${costCellEntry}
    </tr>`;
  }).join('');

  const headerCells = showHourlyRate
    ? `<th class="col-date">Datum</th><th class="col-task">Aufgabe</th><th class="col-note">Notiz</th><th class="col-duration numeric">Dauer</th><th class="col-rate numeric">Stundensatz</th><th class="col-cost numeric">Kosten</th>`
    : `<th class="col-date">Datum</th><th class="col-task">Aufgabe</th><th class="col-note">Notiz</th><th class="col-duration numeric">Dauer</th>`;

  const footerCells = showHourlyRate
    ? `<td colspan="3">Summe ${esc(project.projectKey)}</td>
       <td class="numeric">${esc(project.projectTotalDuration)}</td>
       <td></td>
       <td class="numeric">${project.projectTotalCost ? esc(project.projectTotalCost) : '—'}</td>`
    : `<td colspan="3">Summe ${esc(project.projectKey)}</td>
       <td class="numeric">${esc(project.projectTotalDuration)}</td>`;

  return `
  <div class="project-group">
    <h2 class="project-title">${esc(project.projectKey)} — ${esc(project.projectName)}</h2>
    ${showProjectClient && project.clientName && project.clientName !== 'Kein Kunde' ? `<div class="project-client-sub">Kunde: ${esc(project.clientName)}</div>` : ''}
    <table class="timesheet-table">
      <thead><tr>${headerCells}</tr></thead>
      <tbody>${rowsHtml}</tbody>
      <tfoot>
        <tr>
          ${footerCells}
        </tr>
      </tfoot>
    </table>
  </div>`;
}

export function buildStundenreportBodyHtml(data: StundenreportInput): string {
  const { meta, projects } = data;

  const uniqueClients = Array.from(new Set(projects.map(p => p.clientName).filter(Boolean)));
  const showProjectClient = uniqueClients.length > 1;

  const logoHtml = meta.logoUrl
    ? `<div class="header-logo"><img src="${escAttr(meta.logoUrl)}" alt="Logo" /></div>`
    : '';

  let totalBlock = `
        <span class="total-label">Gesamtsumme</span>
        <span class="total-duration">${esc(meta.totalDuration)}</span>`;
  if (meta.showHourlyRate && meta.totalCost) {
    totalBlock += `\n        <span class="total-cost">${esc(meta.totalCost)}</span>`;
  }

  const projectsHtml = projects.map((p) => buildProjectTable(p, meta.showHourlyRate, showProjectClient)).join('\n');

  return `
  <div class="report-header">
    <div>
      <div class="header-date">
        Zeitraum: <strong>${esc(meta.periodFrom)} – ${esc(meta.periodTo)}</strong>
      </div>
      <div class="header-date">
        Erstellt am: <strong>${esc(meta.generatedAt)}</strong>
      </div>
    </div>
    ${logoHtml}
    <div class="header-client">${esc(meta.clientName)}</div>
    <div class="header-total">${totalBlock}
    </div>
  </div>

  ${projectsHtml}

  <div class="report-footer">
    Erstellt mit Klicklaut OS — ${esc(meta.generatedAt)}
  </div>`;
}

export function buildStundenreportFullHtml(data: StundenreportInput, template: ReportTemplate = 'default'): string {
  const bodyContent = buildStundenreportBodyHtml(data);
  const templateHtml = templateMap[template] || templateMap.default;
  return templateHtml.replace(
    /<div id="report-content">[\s\S]*?<\/div>/,
    `<div id="report-content">${bodyContent}</div>`
  );
}
