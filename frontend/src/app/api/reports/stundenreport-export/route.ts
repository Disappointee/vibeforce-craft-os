import { NextRequest, NextResponse } from 'next/server';
import { verifyUserSession } from '@/lib/pocketbase-server';
import { buildStundenreportFullHtml, type StundenreportInput, type ReportTemplate } from '@/lib/stundenreport';

export async function POST(request: NextRequest) {
  const user = await verifyUserSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await request.json();
  const { template, ...reportData } = body as StundenreportInput & { template?: ReportTemplate };
  const fullHtml = buildStundenreportFullHtml(reportData as StundenreportInput, template || 'default');

  try {
    const { chromium } = await import('playwright');

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.setContent(fullHtml, { waitUntil: 'networkidle' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: { top: '15mm', bottom: '20mm', left: '15mm', right: '15mm' },
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: '<span></span>',
      footerTemplate: `<div style="font-size:8px;text-align:center;width:100%;color:#9ca3af;font-family:Inter,system-ui,sans-serif;">Seite <span class="pageNumber"></span> von <span class="totalPages"></span></div>`,
    });

    await browser.close();

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="stundenauswertung_${reportData.meta.generatedAt.replace(/\./g, '-')}.pdf"`,
      },
    });
  } catch {
    const htmlWithPrint = fullHtml.replace(
      '</body>',
      '<script>window.print();</script></body>'
    );

    return new NextResponse(htmlWithPrint, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
}
