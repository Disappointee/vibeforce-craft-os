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
  const md = fs.readFileSync(inputPath, 'utf-8');

  // Convert to HTML
  const bodyHtml = marked(md);

  const html = `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<style>
  @page { margin: 20mm 15mm; }
  * { box-sizing: border-box; }
  body {
    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    font-size: 11pt;
    line-height: 1.6;
    color: #1a1a1a;
    max-width: 180mm;
    margin: 0 auto;
    padding: 0;
  }
  h1 {
    color: ${brandCfg.primary};
    font-size: 22pt;
    border-bottom: 3px solid ${brandCfg.primary};
    padding-bottom: 8px;
    margin-top: 0;
  }
  h2 {
    color: ${brandCfg.primary};
    font-size: 16pt;
    margin-top: 24px;
    border-bottom: 1px solid #ddd;
    padding-bottom: 4px;
  }
  h3 {
    font-size: 13pt;
    margin-top: 18px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 12px 0;
    font-size: 10pt;
  }
  th, td {
    border: 1px solid #ccc;
    padding: 6px 10px;
    text-align: left;
  }
  th {
    background: ${brandCfg.primary};
    color: white;
    font-weight: 600;
  }
  tr:nth-child(even) { background: #f6f8fa; }
  code {
    background: #f0f0f0;
    padding: 1px 4px;
    border-radius: 3px;
    font-size: 10pt;
  }
  blockquote {
    border-left: 4px solid ${brandCfg.primary};
    margin: 12px 0;
    padding: 8px 16px;
    background: #f9fafb;
    font-style: italic;
  }
  ul, ol { padding-left: 20px; }
  li { margin-bottom: 3px; }
  .footer-note {
    margin-top: 30px;
    padding-top: 10px;
    border-top: 1px solid #ddd;
    font-size: 9pt;
    color: #888;
    text-align: center;
  }
</style>
</head>
<body>
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
