export const reportTemplateHtml = `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

  :root {
    --brand: #2563EB;
    --brand-light: rgba(37, 99, 235, 0.08);
    --brand-pill: rgba(37, 99, 235, 0.12);
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

  thead { display: table-header-group; }
  tfoot { display: table-footer-group; }

  tr, td, th {
    page-break-inside: avoid;
    break-inside: avoid;
  }

  .client-group {
    page-break-inside: avoid;
    margin-bottom: 30px;
  }

  .client-title {
    font-size: 14pt;
    font-weight: 700;
    color: var(--brand);
    margin-bottom: 4px;
    padding-bottom: 8px;
    border-bottom: 2px solid var(--brand);
  }

  .client-total {
    font-size: 9pt;
    color: var(--text-muted);
    margin-bottom: 16px;
    font-weight: 500;
  }

  .project-group {
    page-break-inside: avoid;
    margin-bottom: 20px;
  }

  .project-title {
    font-size: 11pt;
    font-weight: 700;
    color: var(--text);
    letter-spacing: -0.01em;
    margin-bottom: 2px;
  }

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
  .header-total .total-duration {
    background: var(--brand-pill);
    color: var(--brand);
    padding: 6px 16px;
    border-radius: 9999px;
    font-weight: 700;
    font-size: 14pt;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(37, 99, 235, 0.2);
    margin-top: 2px;
  }

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

  .timesheet-table .col-task    { width: 40%; }
  .timesheet-table .col-duration{ width: 18%; }
  .timesheet-table .col-note    { width: 42%; }

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

  .timesheet-table tfoot td {
    padding: 10px 14px;
    font-weight: 700;
    font-size: 9.5pt;
    color: var(--text);
    background: var(--brand-light);
    border-top: 1px solid var(--brand);
  }

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
