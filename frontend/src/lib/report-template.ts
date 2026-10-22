import { reportFontsCss } from '@/lib/report-fonts';

export const reportTemplateHtml = `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
${reportFontsCss}

  :root {
    --brand: #00A699;
    --brand-light: rgba(0, 166, 153, 0.08);
    --brand-pill: rgba(0, 166, 153, 0.12);
    --text: #1e293b;
    --text-secondary: #475569;
    --text-muted: #94a3b8;
    --border: #e2e8f0;
    --surface: #f8fafc;
  }

  @page {
    size: A4;
    margin: 15mm 15mm 20mm 15mm;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  html {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  body {
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    font-size: 9.5pt;
    line-height: 1.6;
    color: var(--text);
  }

  /* ── Print Rules ── */
  thead { display: table-header-group; }
  tfoot { display: table-footer-group; }

  tr, td, th {
    page-break-inside: avoid;
    break-inside: avoid;
  }

  .project-group {
    page-break-inside: avoid;
    margin-bottom: 30px;
  }

  /* ── Report Header ── */
  .report-header {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-areas:
      "meta logo"
      "meta client"
      "meta total";
    gap: 8px 16px;
    margin-bottom: 25px;
    padding-bottom: 20px;
    border-bottom: 1px solid var(--border);
    align-items: flex-start;
  }

  .report-header > div:first-child {
    grid-area: meta;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .header-date {
    font-size: 8.5pt;
    color: var(--text-muted);
    font-weight: 400;
  }
  .header-date strong {
    color: var(--text-secondary);
    font-weight: 500;
  }

  .header-logo {
    grid-area: logo;
    text-align: right;
  }
  .header-logo img {
    max-height: 40px;
    max-width: 160px;
    object-fit: contain;
  }

  .header-client {
    grid-area: client;
    text-align: right;
    font-size: 16pt;
    font-weight: 700;
    color: var(--text);
    letter-spacing: -0.02em;
    line-height: 1.2;
  }

  .header-total {
    grid-area: total;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
    margin-top: 4px;
  }
  .header-total .total-label {
    display: block;
    font-size: 7.5pt;
    font-weight: 600;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }
  .header-total .total-duration,
  .header-total .total-cost {
    background: var(--brand-pill);
    color: var(--brand);
    padding: 6px 16px;
    border-radius: 9999px;
    font-weight: 700;
    font-size: 14pt;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(0, 166, 153, 0.15);
    margin-top: 2px;
  }
  .header-total .total-cost {
    font-size: 11pt;
    background: rgba(0, 166, 153, 0.04);
    margin-top: 4px;
  }

  /* ── Project Groups ── */
  .project-title {
    font-size: 11pt;
    font-weight: 700;
    color: var(--text);
    letter-spacing: -0.01em;
    margin-bottom: 2px;
  }
  .project-client-sub {
    font-size: 8pt;
    color: var(--text-muted);
    margin-bottom: 10px;
    font-weight: 500;
  }

  /* ── Table with Rounded Corners ── */
  .timesheet-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    font-size: 9pt;
    margin-bottom: 8px;
    border: 1px solid var(--border);
    border-radius: 8px;
    overflow: hidden;
  }

  .timesheet-table thead th {
    background: var(--brand);
    color: #ffffff;
    font-weight: 600;
    font-size: 8pt;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 10px 14px;
    border: none;
  }

  .timesheet-table tbody td {
    padding: 8px 14px;
    border-bottom: 1px solid var(--border);
    vertical-align: top;
    color: var(--text-secondary);
  }

  .timesheet-table tbody tr:last-child td {
    border-bottom: none;
  }

  .timesheet-table tbody tr:nth-child(even) td {
    background: var(--surface);
  }

  /* Column widths */
  .timesheet-table .col-date    { width: 12%; }
  .timesheet-table .col-task    { width: 30%; }
  .timesheet-table .col-note    { width: 26%; }
  .timesheet-table .col-duration{ width: 10%; }
  .timesheet-table .col-rate    { width: 11%; }
  .timesheet-table .col-cost    { width: 11%; }

  .timesheet-table .col-note {
    font-size: 8.5pt;
    color: var(--text-muted);
    font-style: italic;
  }

  .timesheet-table .numeric {
    text-align: right;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }

  /* ── tfoot (Summenzeile) ── */
  .timesheet-table tfoot td {
    padding: 10px 14px;
    font-weight: 700;
    font-size: 9.5pt;
    color: var(--text);
    background: var(--brand-light);
    border-top: 1px solid var(--brand);
  }

  /* ── Report Footer ── */
  .report-footer {
    margin-top: 24px;
    padding-top: 10px;
    border-top: 1px solid var(--border);
    text-align: center;
    font-size: 8pt;
    color: var(--text-muted);
    font-weight: 500;
  }
</style>
</head>
<body>
<div id="report-content">
</div>
</body>
</html>`;

/* ─────────────────────────────────────────────
   Variant A: Minimal Editorial
   Typografie-first, reduziert, grosse Weissraume
   ───────────────────────────────────────────── */
export const reportTemplateEditorial = `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
${reportFontsCss}

  :root {
    --brand: #00A699;
    --brand-light: #00A69910;
    --text: #111827;
    --text-secondary: #6b7280;
    --text-muted: #9ca3af;
    --border: #e5e7eb;
    --border-subtle: #f3f4f6;
    --surface: transparent;
  }

  @page {
    size: A4;
    margin: 18mm 18mm 22mm 18mm;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  html {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  body {
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    font-size: 9.5pt;
    line-height: 1.65;
    color: var(--text);
    font-weight: 300;
  }

  /* ── Print Rules ── */
  thead { display: table-header-group; }
  tfoot { display: table-footer-group; }

  tr, td, th {
    page-break-inside: avoid;
    break-inside: avoid;
  }

  .project-group {
    page-break-inside: avoid;
  }

  /* ── Report Header ── */
  .report-header {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 32px;
    padding-bottom: 20px;
    border-bottom: 1.5px solid var(--brand);
  }

  .header-date {
    font-size: 9pt;
    color: var(--text-muted);
    font-weight: 300;
    margin-bottom: 2px;
  }
  .header-date strong {
    color: var(--text-secondary);
    font-size: 10pt;
    font-weight: 500;
  }

  .header-logo {
    text-align: right;
  }
  .header-logo img {
    max-height: 36px;
    max-width: 140px;
    object-fit: contain;
    opacity: 0.85;
  }

  .header-client {
    font-size: 24pt;
    font-weight: 300;
    color: var(--text);
    letter-spacing: -0.01em;
    line-height: 1.2;
  }

  .header-total {
    text-align: right;
    font-size: 13pt;
    font-weight: 300;
    color: var(--text);
  }
  .header-total .total-label {
    display: block;
    font-size: 7.5pt;
    font-weight: 500;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.10em;
    margin-bottom: 4px;
  }
  .header-total .total-duration {
    margin-bottom: 2px;
    font-weight: 500;
    font-size: 15pt;
  }
  .header-total .total-cost {
    font-size: 11pt;
    font-weight: 400;
    color: var(--brand);
  }

  /* ── Project Groups ── */
  .project-title {
    font-size: 12pt;
    font-weight: 500;
    color: var(--text);
    border-bottom: 0.5px solid var(--border);
    padding-bottom: 6px;
    margin-bottom: 2px;
    margin-top: 28px;
    letter-spacing: -0.005em;
  }
  .project-title:first-child { margin-top: 0; }
  .project-client-sub {
    font-size: 8.5pt;
    color: var(--text-muted);
    margin-bottom: 10px;
    font-style: italic;
  }

  /* ── Table ── */
  .timesheet-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 8.5pt;
    margin-bottom: 8px;
  }

  .timesheet-table thead th {
    background: var(--border-subtle);
    color: var(--text-secondary);
    font-weight: 500;
    font-size: 7.5pt;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    padding: 8px 10px;
    text-align: left;
    border-bottom: 0.5px solid var(--border);
  }

  .timesheet-table tbody td {
    padding: 6px 10px;
    border-bottom: 0.5px solid var(--border-subtle);
    vertical-align: top;
    font-weight: 350;
  }

  .timesheet-table .col-date    { width: 12%; }
  .timesheet-table .col-task    { width: 26%; }
  .timesheet-table .col-note    { width: 30%; }
  .timesheet-table .col-duration{ width: 10%; }
  .timesheet-table .col-rate    { width: 11%; }
  .timesheet-table .col-cost    { width: 11%; }

  .timesheet-table .col-note {
    font-size: 7.5pt;
    color: var(--text-muted);
    font-style: italic;
    font-weight: 300;
  }

  .timesheet-table .numeric {
    text-align: right;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
    font-weight: 400;
  }

  /* ── tfoot (Summenzeile) ── */
  .timesheet-table tfoot td {
    padding: 8px 10px;
    font-weight: 500;
    font-size: 8.5pt;
    color: var(--text);
    background: var(--brand-light);
    border-top: 1px solid var(--brand);
    border-bottom: none;
  }

  /* ── Report Footer ── */
  .report-footer {
    margin-top: 36px;
    padding-top: 14px;
    border-top: 1px solid var(--border);
    text-align: center;
    font-size: 7pt;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.12em;
    font-weight: 400;
  }
</style>
</head>
<body>
<div id="report-content">
</div>
</body>
</html>`;

/* ─────────────────────────────────────────────
   Variant B: Dark Mode Executive
   Dunkles, modernes Dashboard-Feeling
   ───────────────────────────────────────────── */
export const reportTemplateDark = `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
${reportFontsCss}

  :root {
    --brand: #14b8a6;
    --brand-dim: rgba(20, 184, 166, 0.15);
    --bg: #0f0f0f;
    --text: #f0f0f0;
    --text-secondary: #a1a1aa;
    --text-muted: #71717a;
    --border: rgba(255, 255, 255, 0.08);
    --border-subtle: rgba(255, 255, 255, 0.05);
    --surface: rgba(255, 255, 255, 0.04);
    --card: #1c1c1c;
    --card-header: #161616;
  }

  @page {
    size: A4;
    margin: 15mm 15mm 20mm 15mm;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  html {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  body {
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    font-size: 9.5pt;
    line-height: 1.55;
    color: var(--text);
    background: var(--bg);
  }

  /* ── Print Rules ── */
  thead { display: table-header-group; }
  tfoot { display: table-footer-group; }

  tr, td, th {
    page-break-inside: avoid;
    break-inside: avoid;
  }

  .project-group {
    page-break-inside: avoid;
  }

  /* ── Report Header ── */
  .report-header {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 28px;
    padding: 20px 24px;
    background: var(--card-header);
    border: 1px solid var(--border);
    border-radius: 12px;
  }

  .header-date {
    font-size: 8.5pt;
    color: var(--text-muted);
  }
  .header-date strong {
    color: var(--text-secondary);
    font-size: 9.5pt;
    font-weight: 500;
  }

  .header-logo {
    text-align: right;
  }
  .header-logo img {
    max-height: 36px;
    max-width: 140px;
    object-fit: contain;
    filter: brightness(0.9);
  }

  .header-client {
    font-size: 18pt;
    font-weight: 600;
    color: var(--text);
    letter-spacing: -0.01em;
  }

  .header-total {
    text-align: right;
    font-size: 14pt;
    font-weight: 700;
    color: var(--brand);
  }
  .header-total .total-label {
    display: block;
    font-size: 7.5pt;
    font-weight: 500;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin-bottom: 4px;
  }
  .header-total .total-duration {
    margin-bottom: 2px;
  }
  .header-total .total-cost {
    font-size: 11pt;
    font-weight: 600;
    color: var(--brand);
  }

  /* ── Project Groups ── */
  .project-title {
    font-size: 11pt;
    font-weight: 600;
    color: var(--text);
    border-bottom: 1px solid var(--border);
    padding-bottom: 6px;
    margin-bottom: 2px;
    margin-top: 24px;
  }
  .project-title:first-child { margin-top: 0; }
  .project-client-sub {
    font-size: 8.5pt;
    color: var(--text-muted);
    margin-bottom: 10px;
  }

  /* ── Table ── */
  .timesheet-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 8.5pt;
    margin-bottom: 6px;
  }

  .timesheet-table thead th {
    background: #27272a;
    color: var(--text);
    font-weight: 600;
    font-size: 7.5pt;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    padding: 7px 10px;
    text-align: left;
    border: none;
  }
  .timesheet-table thead th:first-child { border-radius: 6px 0 0 0; }
  .timesheet-table thead th:last-child  { border-radius: 0 6px 0 0; }

  .timesheet-table tbody td {
    padding: 6px 10px;
    border-bottom: 1px solid var(--border-subtle);
    vertical-align: top;
    color: var(--text-secondary);
  }

  .timesheet-table tbody tr:nth-child(even) td {
    background: var(--surface);
  }

  .timesheet-table .col-date    { width: 11%; }
  .timesheet-table .col-task    { width: 26%; color: var(--text); }
  .timesheet-table .col-note    { width: 31%; }
  .timesheet-table .col-duration{ width: 10%; }
  .timesheet-table .col-rate    { width: 11%; }
  .timesheet-table .col-cost    { width: 11%; }

  .timesheet-table .col-note {
    font-size: 7.5pt;
    font-style: italic;
  }

  .timesheet-table .numeric {
    text-align: right;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
    color: var(--text);
  }

  /* ── tfoot (Summenzeile) ── */
  .timesheet-table tfoot td {
    padding: 8px 10px;
    font-weight: 700;
    font-size: 8.5pt;
    color: var(--text);
    background: var(--brand-dim);
    border-top: 2px solid rgba(20, 184, 166, 0.3);
  }
  .timesheet-table tfoot td:first-child { border-radius: 0 0 0 6px; }
  .timesheet-table tfoot td:last-child  { border-radius: 0 0 6px 0; }

  /* ── Report Footer ── */
  .report-footer {
    margin-top: 28px;
    padding-top: 12px;
    border-top: 1px solid var(--border);
    text-align: center;
    font-size: 7pt;
    color: var(--text-muted);
    letter-spacing: 0.04em;
  }
</style>
</head>
<body>
<div id="report-content">
</div>
</body>
</html>`;

/* ─────────────────────────────────────────────
   Variant C: Swiss Modern
   Rasterbasiert, asymmetrisch, mutig
   ───────────────────────────────────────────── */
export const reportTemplateSwiss = `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
${reportFontsCss}

  :root {
    --brand: #00A699;
    --brand-dark: #0d9488;
    --brand-light: #ccfbf1;
    --brand-dim: #f0fdfa;
    --text: #111827;
    --text-secondary: #4b5563;
    --text-muted: #9ca3af;
    --border: #e5e7eb;
    --border-light: #f3f4f6;
    --surface: #f9fafb;
  }

  @page {
    size: A4;
    margin: 15mm 15mm 20mm 15mm;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  html {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  body {
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    font-size: 9.5pt;
    line-height: 1.55;
    color: var(--text);
  }

  /* ── Print Rules ── */
  thead { display: table-header-group; }
  tfoot { display: table-footer-group; }

  tr, td, th {
    page-break-inside: avoid;
    break-inside: avoid;
  }

  .project-group {
    page-break-inside: avoid;
  }

  /* ── Report Header ── */
  .report-header {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 0;
    margin-bottom: 32px;
    padding: 24px 0 20px 0;
    border-bottom: none;
    position: relative;
    background:
      linear-gradient(to bottom, var(--brand-dim) 0%, var(--brand-dim) 80px, transparent 80px);
  }

  .header-date {
    font-size: 9pt;
    color: var(--text-muted);
    line-height: 1.6;
  }
  .header-date strong {
    color: var(--text-secondary);
    font-size: 10pt;
    font-weight: 600;
  }

  .header-logo {
    text-align: right;
    position: absolute;
    top: 0;
    right: 0;
  }
  .header-logo img {
    max-height: 32px;
    max-width: 130px;
    object-fit: contain;
    opacity: 0.8;
  }

  .header-client {
    font-size: 28pt;
    font-weight: 800;
    color: var(--text);
    letter-spacing: -0.02em;
    line-height: 1.05;
    padding-right: 20px;
  }

  .header-total {
    text-align: right;
    font-size: 0;
    border-left: 4px solid var(--brand);
    padding: 12px 0 12px 16px;
    margin-top: -4px;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  .header-total .total-label {
    display: block;
    font-size: 7.5pt;
    font-weight: 600;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin-bottom: 6px;
  }
  .header-total .total-duration {
    display: block;
    margin-bottom: 2px;
    font-size: 16pt;
    font-weight: 700;
    color: var(--text);
    font-family: 'Inter', system-ui, sans-serif;
  }
  .header-total .total-cost {
    display: block;
    font-size: 10pt;
    font-weight: 600;
    color: var(--brand-dark);
  }

  /* ── Project Groups ── */
  .project-title {
    font-size: 12pt;
    font-weight: 700;
    color: var(--text);
    border-bottom: 1.5px solid var(--border);
    padding-bottom: 5px;
    margin-bottom: 2px;
    margin-top: 24px;
    letter-spacing: -0.01em;
  }
  .project-title:first-child { margin-top: 0; }
  .project-client-sub {
    font-size: 8.5pt;
    color: var(--text-secondary);
    margin-bottom: 10px;
    font-weight: 500;
  }

  /* ── Table ── */
  .timesheet-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 8.5pt;
    margin-bottom: 6px;
  }

  .timesheet-table thead th {
    background: var(--brand);
    color: #ffffff;
    font-weight: 600;
    font-size: 7.5pt;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    padding: 7px 10px;
    text-align: left;
    border: none;
  }
  .timesheet-table thead th:first-child { border-radius: 0; }
  .timesheet-table thead th:last-child  { border-radius: 0; }

  .timesheet-table tbody td {
    padding: 6px 10px;
    border-bottom: 1px solid var(--border);
    vertical-align: top;
  }

  .timesheet-table .col-date    { width: 11%; }
  .timesheet-table .col-task    { width: 26%; }
  .timesheet-table .col-note    { width: 31%; }
  .timesheet-table .col-duration{ width: 10%; }
  .timesheet-table .col-rate    { width: 11%; }
  .timesheet-table .col-cost    { width: 11%; }

  .timesheet-table .col-note {
    font-size: 7.5pt;
    color: var(--text-muted);
    font-style: italic;
  }

  .timesheet-table .numeric {
    text-align: right;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
    font-family: 'Geist Mono', 'Courier New', monospace;
    font-weight: 500;
    font-size: 8pt;
  }

  /* ── tfoot (Summenzeile) ── */
  .timesheet-table tfoot td {
    padding: 8px 10px;
    font-weight: 700;
    font-size: 8.5pt;
    color: var(--text);
    background: var(--surface);
    border-top: 2px solid var(--border);
  }

  /* ── Report Footer ── */
  .report-footer {
    margin-top: 32px;
    padding-top: 14px;
    border-top: none;
    text-align: right;
    font-size: 7pt;
    color: var(--text-muted);
    position: relative;
  }
  .report-footer::before {
    content: '';
    display: inline-block;
    width: 60px;
    height: 2px;
    background: var(--brand);
    margin-right: 10px;
    vertical-align: middle;
  }
</style>
</head>
<body>
<div id="report-content">
</div>
</body>
</html>`;
