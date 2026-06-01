const puppeteer = require('puppeteer');
const { marked } = require('marked');
const path = require('path');
const fs = require('fs');

// Brand colors
const BRANDS = {
  vibeforce: { primary: '#2563EB', name: 'Vibeforce Flow OS' },
  oa:        { primary: '#2563EB', name: 'OA' },
  seshforce: { primary: '#7C3AED', name: 'Seshforce' },
  neutral:   { primary: '#1F2937', name: 'AI Research Insights' },
};

async function generatePDF(inputPath, brand = 'neutral') {
  const brandCfg = BRANDS[brand] || BRANDS.neutral;

  // Read markdown
  let md = fs.readFileSync(inputPath, 'utf-8');

  // Extract front-matter
  let metadata = {};
  const fmMatch = md.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (fmMatch) {
    const fmText = fmMatch[1];
    md = md.substring(fmMatch[0].length); // Strip front-matter from content
    fmText.split('\n').forEach(line => {
      const parts = line.split(':');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const val = parts.slice(1).join(':').trim().replace(/^['"]|['"]$/g, '');
        metadata[key] = val;
      }
    });
  }

  // Convert to HTML
  const bodyHtml = marked(md);

  // Determine doc details
  const docTitle = metadata.title || 'Dokument';
  const docRole = metadata.role ? `Rolle: ${metadata.role}` : '';
  const docBrand = metadata.brand || brand;

  const html = `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap');
  
  @page {
    margin: 14mm 15mm;
  }
  * { box-sizing: border-box; }
  body {
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    font-size: 9.5pt;
    line-height: 1.5;
    color: #1e293b;
    max-width: 180mm;
    margin: 0 auto;
    padding: 0;
    background-color: #ffffff;
    -webkit-print-color-adjust: exact;
  }
  
  /* Prevent orphans and breaks in wrong places */
  h1, h2, h3 {
    page-break-after: avoid;
    break-after: avoid;
  }
  tr, li {
    page-break-inside: avoid;
    break-inside: avoid;
  }

  /* Minimalist Header section */
  .header-container {
    margin-bottom: 22px;
    margin-top: 0;
    padding-bottom: 12px;
    border-bottom: 1px solid #e2e8f0;
  }
  .brand-badge {
    font-size: 7.5pt;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: #64748b;
    margin-bottom: 4px;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }
  .doc-title {
    font-family: 'Plus Jakarta Sans', sans-serif;
    color: #0f172a;
    font-size: 18pt;
    font-weight: 700;
    margin: 0 0 2px 0;
    letter-spacing: -0.02em;
    line-height: 1.15;
  }
  .doc-role {
    font-family: 'Inter', sans-serif;
    font-size: 9pt;
    color: #94a3b8;
    font-weight: 500;
  }

  h1 {
    font-family: 'Plus Jakarta Sans', sans-serif;
    color: #0f172a;
    font-size: 14pt;
    font-weight: 700;
    margin-top: 18px;
    margin-bottom: 8px;
    letter-spacing: -0.015em;
  }
  h2 {
    font-family: 'Plus Jakarta Sans', sans-serif;
    color: #1e293b;
    font-size: 11pt;
    font-weight: 600;
    margin-top: 18px;
    margin-bottom: 6px;
    border-bottom: 1px dashed #e2e8f0;
    padding-bottom: 3px;
    letter-spacing: -0.01em;
  }
  h3 {
    font-family: 'Plus Jakarta Sans', sans-serif;
    color: #334155;
    font-size: 10pt;
    font-weight: 600;
    margin-top: 12px;
    margin-bottom: 4px;
  }
  
  /* Minimalist Classic Table style */
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 12px 0;
    font-size: 9pt;
    border-top: 1px solid #0f172a;
    border-bottom: 1px solid #0f172a;
  }
  th, td {
    padding: 6px 8px;
    text-align: left;
  }
  th {
    color: #0f172a;
    font-weight: 600;
    font-size: 8.5pt;
    border-bottom: 1px solid #e2e8f0;
  }
  td {
    color: #334155;
    border-bottom: 1px solid #f1f5f9;
  }
  tr:last-child td {
    border-bottom: none;
  }
  
  code {
    font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
    background-color: #f8fafc;
    color: #0f172a;
    border: 1px solid #e2e8f0;
    padding: 1px 4px;
    border-radius: 3px;
    font-size: 8pt;
    font-weight: 500;
  }
  pre code {
    display: block;
    padding: 8px 12px;
    overflow-x: auto;
  }
  
  /* Classic Minimalist Quote */
  blockquote {
    border-left: 2px solid #0f172a;
    margin: 10px 0;
    padding: 2px 12px;
    color: #475569;
  }
  blockquote p {
    margin: 0;
    font-weight: 500;
  }
  ul, ol { 
    padding-left: 18px; 
    margin: 6px 0;
  }
  li { 
    margin-bottom: 3px; 
    color: #334155;
  }
  p {
    margin-top: 0;
    margin-bottom: 6px;
    color: #334155;
  }
  a {
    color: #0f172a;
    text-decoration: underline;
    font-weight: 500;
  }
  hr {
    border: none;
    border-top: 1px solid #e2e8f0;
    margin: 12px 0;
  }
  .footer-note {
    margin-top: 24px;
    padding-top: 8px;
    border-top: 1px solid #e2e8f0;
    font-size: 7.5pt;
    color: #94a3b8;
    text-align: center;
    font-weight: 500;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }
</style>
</head>
<body>
  <div class="header-container">
    <div class="brand-badge">${brandCfg.name}</div>
    <h1 class="doc-title">${docTitle}</h1>
    ${docRole ? `<div class="doc-role">${docRole}</div>` : ''}
  </div>
  
  ${bodyHtml}
  
  <div class="footer-note">Erstellt von ${brandCfg.name} | ${new Date().toLocaleDateString('de-DE')}</div>
</body>
</html>`;

  const outputPath = inputPath.replace(/\.md$/, '.pdf');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  await page.pdf({
    path: outputPath,
    format: 'A4',
    margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' },
    printBackground: true,
  });

  await browser.close();
  console.log(`PDF generated: ${outputPath}`);
  return outputPath;
}

// CLI
const args = process.argv.slice(2);
if (args.length < 1) {
  console.error('Usage: node tools/generate-pdf.js <input.md> [brand]');
  console.error('Brands: vibeforce, oa, seshforce');
  process.exit(1);
}

generatePDF(args[0], args[1]).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
