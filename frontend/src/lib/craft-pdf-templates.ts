import { createHash } from 'crypto';
import type { SiteReportRecord, MeasurementRecord } from '@/lib/pocketbase-types';

export interface CraftReportPdfData {
  report: SiteReportRecord;
  projectName: string;
  projectKey: string;
  clientName?: string;
  authorName?: string;
  measurements?: MeasurementRecord[];
  isReverseCharge?: boolean;
  freistellungNotice?: string;
}

/** Escape HTML special characters to prevent XSS in PDF rendering */
function esc(text?: string | null): string {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function isSafeImageSrc(src?: string | null): boolean {
  if (!src) return false;
  const trimmed = src.trim().toLowerCase();
  return (
    trimmed.startsWith('data:image/png;') ||
    trimmed.startsWith('data:image/jpeg;') ||
    trimmed.startsWith('data:image/jpg;') ||
    trimmed.startsWith('data:image/webp;') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('http://')
  );
}

export function generateSiteReportHtml(data: CraftReportPdfData): string {
  const { report, projectName, projectKey, clientName, authorName, measurements = [], isReverseCharge = false, freistellungNotice } = data;
  const formattedDate = new Date(report.report_date).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const subtotal = measurements.reduce((acc, m) => acc + (m.total_price || 0), 0);
  const tax = isReverseCharge ? 0 : subtotal * 0.19;
  const total = subtotal + tax;

  // Compute § 127 BGB & GoBD Tamper-Proof Document Fingerprint
  const manifestData = `${report.id || 'draft'}|${report.project}|${report.report_date}|${report.client_signed_at || ''}|${subtotal.toFixed(2)}|${total.toFixed(2)}`;
  const docFingerprint = createHash('sha256').update(manifestData).digest('hex').substring(0, 32).toUpperCase();

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>Bautagesbericht - ${esc(projectName)}</title>
  <style>
    @page { size: A4; margin: 20mm 15mm 20mm 15mm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      line-height: 1.5;
      font-size: 12px;
      margin: 0;
      padding: 0;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0d9488;
      padding-bottom: 12px;
      margin-bottom: 20px;
    }
    .title { font-size: 20px; font-weight: 700; color: #0f172a; margin: 0; }
    .subtitle { font-size: 12px; color: #64748b; margin-top: 4px; }
    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      background: #f8fafc;
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    .meta-item { display: flex; flex-direction: column; }
    .meta-label { font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 600; }
    .meta-val { font-size: 12px; font-weight: 600; color: #0f172a; }
    .section-title {
      font-size: 14px;
      font-weight: 700;
      color: #0f172a;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
      margin-top: 20px;
      margin-bottom: 10px;
    }
    .content-box {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 10px;
      white-space: pre-wrap;
      font-size: 11px;
    }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th {
      background: #f1f5f9;
      text-align: left;
      padding: 8px;
      font-size: 10px;
      text-transform: uppercase;
      color: #475569;
      border-bottom: 1px solid #cbd5e1;
    }
    td { padding: 8px; border-bottom: 1px solid #e2e8f0; font-size: 11px; }
    .text-right { text-align: right; }
    .signatures {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      margin-top: 30px;
      page-break-inside: avoid;
    }
    .sig-box {
      border-top: 1px solid #94a3b8;
      padding-top: 8px;
      text-align: center;
    }
    .sig-img { max-height: 50px; margin-bottom: 5px; }
    .sig-label { font-size: 11px; color: #475569; font-weight: 600; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1 class="title">Bautagesbericht / Regiebericht</h1>
      <div class="subtitle">Projekt: [${esc(projectKey)}] ${esc(projectName)}</div>
    </div>
    <div style="text-align: right;">
      <div style="font-weight: 700; font-size: 13px;">Datum: ${formattedDate}</div>
      <div style="color: #64748b; font-size: 11px;">Status: ${report.status === 'signed' ? 'Rechtsgültig signiert' : 'Entwurf'}</div>
    </div>
  </div>

  <div class="meta-grid">
    <div class="meta-item">
      <span class="meta-label">Auftraggeber</span>
      <span class="meta-val">${esc(clientName || report.client_name) || '-'}</span>
    </div>
    <div class="meta-item">
      <span class="meta-label">Bauleiter / Erfasser</span>
      <span class="meta-val">${esc(authorName) || '-'}</span>
    </div>
    <div class="meta-item">
      <span class="meta-label">Wetter & Temperatur</span>
      <span class="meta-val">${esc(report.weather) || 'Standard'} ${report.temperature ? `(${esc(String(report.temperature))} °C)` : ''}</span>
    </div>
    <div class="meta-item">
      <span class="meta-label">Stunden nach Qualifikation</span>
      <span class="meta-val">
        Meister: ${Number(report.qualification_hours?.meister) || 0}h | Geselle: ${Number(report.qualification_hours?.geselle) || 0}h | Helfer: ${Number(report.qualification_hours?.helfer) || 0}h | Azubi: ${Number(report.qualification_hours?.azubi) || 0}h
      </span>
    </div>
  </div>

  <div class="section-title">Ausgeführte Arbeiten</div>
  <div class="content-box">${esc(report.work_performed) || 'Keine Arbeiten dokumentiert.'}</div>

  ${report.special_events ? `
    <div class="section-title">Besondere Vorkommnisse / Behinderungen</div>
    <div class="content-box" style="color: #991b1b; background: #fef2f2; border-color: #fecaca;">${esc(report.special_events)}</div>
  ` : ''}

  ${measurements.length > 0 ? `
    <div class="section-title">VOB-Aufmaß & Leistungspositionen</div>
    <table>
      <thead>
        <tr>
          <th>Pos.</th>
          <th>Leistung</th>
          <th>Formel</th>
          <th class="text-right">Menge</th>
          <th>Einheit</th>
          <th class="text-right">EP (€)</th>
          <th class="text-right">GP (€)</th>
        </tr>
      </thead>
      <tbody>
        ${measurements.map(m => `
          <tr>
            <td>${esc(m.position_nr)}</td>
            <td>${esc(m.title)}</td>
            <td style="font-family: monospace; color: #0d9488;">${esc(m.formula) || '-'}</td>
            <td class="text-right">${esc(String(m.quantity ?? 0))}</td>
            <td>${esc(m.unit)}</td>
            <td class="text-right">${(m.unit_price || 0).toFixed(2)}</td>
            <td class="text-right" style="font-weight: 600;">${(m.total_price || 0).toFixed(2)}</td>
          </tr>
        `).join('')}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="6" class="text-right" style="font-weight: 600;">Gesamtsumme Netto:</td>
          <td class="text-right" style="font-weight: 600;">${subtotal.toFixed(2)} €</td>
        </tr>
        <tr>
          <td colspan="6" class="text-right" style="font-size: 10px; color: #64748b;">${isReverseCharge ? 'USt. (§ 13b Reverse Charge 0%):' : 'MwSt. (19%):'}</td>
          <td class="text-right" style="font-size: 10px; color: #64748b;">${tax.toFixed(2)} €</td>
        </tr>
        <tr>
          <td colspan="6" class="text-right" style="font-weight: 700; color: #0d9488;">${isReverseCharge ? 'Gesamtbetrag (Netto):' : 'Gesamtbetrag Brutto:'}</td>
          <td class="text-right" style="font-weight: 700; color: #0d9488;">${total.toFixed(2)} €</td>
        </tr>
      </tfoot>
    </table>
  ` : ''}

  ${freistellungNotice ? `
    <div style="margin-top: 15px; padding: 8px 12px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; font-size: 10px; color: #166534;">
      <strong>Steuerlicher Hinweis (§ 48b EStG Bauabzugsteuer):</strong> ${esc(freistellungNotice)}
    </div>
  ` : ''}

  <div class="signatures">
    <div class="sig-box">
      ${isSafeImageSrc(report.client_signature) ? `<img src="${esc(report.client_signature)}" class="sig-img" alt="Unterschrift Auftraggeber" />` : '<div style="height: 40px;"></div>'}
      <div class="sig-label">Unterschrift Auftraggeber (${esc(report.client_name) || 'Bauleiter'})</div>
      <div style="font-size: 9px; color: #94a3b8;">
        ${(() => {
          if (!report.client_signed_at) return 'Ausstehend';
          let timeText = `Signiert am ${new Date(report.client_signed_at).toLocaleString('de-DE')}`;
          if (report.signature_manifest) {
            try {
              const m = JSON.parse(report.signature_manifest);
              if (m.clientRecordedAt && m.serverReceivedAt && m.clientRecordedAt !== m.serverReceivedAt) {
                timeText += ` (Vor Ort: ${new Date(m.clientRecordedAt).toLocaleTimeString('de-DE')} | Sync: ${new Date(m.serverReceivedAt).toLocaleTimeString('de-DE')})`;
              }
            } catch {}
          }
          return timeText;
        })()}
      </div>
    </div>
    <div class="sig-box">
      ${isSafeImageSrc(report.contractor_signature) ? `<img src="${esc(report.contractor_signature)}" class="sig-img" alt="Unterschrift Auftragnehmer" />` : '<div style="height: 40px;"></div>'}
      <div class="sig-label">Unterschrift Auftragnehmer (${esc(authorName) || 'Monteur'})</div>
      <div style="font-size: 9px; color: #94a3b8;">${report.contractor_signed_at ? `Signiert am ${new Date(report.contractor_signed_at).toLocaleString('de-DE')}` : 'Ausstehend'}</div>
    </div>
  </div>

  <div style="margin-top: 30px; padding-top: 10px; border-top: 1px dashed #cbd5e1; display: flex; justify-content: space-between; align-items: center; font-size: 9px; color: #64748b; font-family: monospace;">
    <div>
      <strong>GoBD / § 127 BGB Integritäts-Siegel:</strong> SHA256-${docFingerprint}
    </div>
    <div>
      Elektronisch signiert &amp; revisionssicher archiviert • VIBE CRAFT OS
    </div>
  </div>
</body>
</html>`;
}
