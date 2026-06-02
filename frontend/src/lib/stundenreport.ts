import { reportTemplateHtml } from '@/lib/report-template';

export interface StundenreportMeta {
  clientName: string;
  periodFrom: string;
  periodTo: string;
  generatedAt: string;
  logoUrl?: string;
  totalDuration: string;
}

export interface StundenreportEntry {
  date: string;
  task: string;
  note: string;
  duration: string;
}

export interface StundenreportProjectGroup {
  projectName: string;
  projectKey: string;
  clientName?: string;
  projectTotalDuration: string;
  entries: StundenreportEntry[];
}

export interface StundenreportClientGroup {
  clientName: string;
  clientId?: string;
  projects: StundenreportProjectGroup[];
  clientTotalDuration: string;
}

export interface StundenreportInput {
  meta: StundenreportMeta;
  clients: StundenreportClientGroup[];
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

function buildClientSection(client: StundenreportClientGroup): string {
  const projectsHtml = client.projects.map((project) => {
    const rowsHtml = project.entries.map((entry) => {
      return `
    <tr>
      <td class="col-task">${esc(entry.task)}</td>
      <td class="col-duration numeric">${esc(entry.duration)}</td>
      <td class="col-note">${esc(entry.note)}</td>
    </tr>`;
    }).join('');

    const headerCells = `<th class="col-task">Aufgabe</th><th class="col-duration numeric">Dauer</th><th class="col-note">Beschreibung</th>`;

    const footerCells = `<td>Summe ${esc(project.projectKey)}</td>
       <td class="numeric" colspan="2">${esc(project.projectTotalDuration)}</td>`;

    return `
  <div class="project-group">
    <h2 class="project-title">${esc(project.projectKey)} — ${esc(project.projectName)}</h2>
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
  }).join('\n');

  return `
  <div class="client-group">
    <h1 class="client-title">${esc(client.clientName)}</h1>
    <div class="client-total">Gesamt: ${esc(client.clientTotalDuration)}</div>
    ${projectsHtml}
  </div>`;
}

export function buildStundenreportBodyHtml(data: StundenreportInput): string {
  const { meta, clients } = data;

  const logoHtml = meta.logoUrl
    ? `<div class="header-logo"><img src="${escAttr(meta.logoUrl)}" alt="Logo" /></div>`
    : '';

  const totalBlock = `
        <span class="total-label">Gesamtsumme</span>
        <span class="total-duration">${esc(meta.totalDuration)}</span>`;

  const clientsHtml = clients.map((c) => buildClientSection(c)).join('\n');

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

  ${clientsHtml}

  <div class="report-footer">
    Erstellt mit Vibeforce Flow OS — ${esc(meta.generatedAt)}
  </div>`;
}

export function buildStundenreportFullHtml(data: StundenreportInput): string {
  const bodyContent = buildStundenreportBodyHtml(data);
  return reportTemplateHtml.replace(
    /<div id="report-content">[\s\S]*?<\/div>/,
    `<div id="report-content">${bodyContent}</div>`
  );
}
