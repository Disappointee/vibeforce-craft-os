import { NextRequest, NextResponse } from 'next/server';
import { verifyUserSession } from '@/lib/pocketbase-server';
import { buildStundenreportFullHtml, type StundenreportInput, type ReportTemplate } from '@/lib/stundenreport';
import { pdfService } from '@/lib/pdf-service';
import { reportsRateLimiter, createRateLimitResponse } from '@/lib/rate-limiter';

export async function POST(request: NextRequest) {
  const user = await verifyUserSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rateLimitKey = String(user.id || request.headers.get('x-forwarded-for') || 'anonymous');
  const rateLimit = reportsRateLimiter.check(rateLimitKey);
  if (!rateLimit.success) {
    return createRateLimitResponse(rateLimit);
  }

  const body = await request.json();
  const { template, ...reportData } = body as StundenreportInput & { template?: ReportTemplate };
  const fullHtml = buildStundenreportFullHtml(reportData as StundenreportInput, template || 'default');

  const abortController = new AbortController();
  const onAbort = () => abortController.abort();
  request.signal.addEventListener('abort', onAbort, { once: true });

  try {
    const pdfBuffer = await pdfService.renderHtmlToPdf(fullHtml, {
      format: 'A4',
      margin: { top: '15mm', bottom: '20mm', left: '15mm', right: '15mm' },
      printBackground: true,
      signal: abortController.signal,
    });

    const safeTimestamp = String(reportData.meta?.generatedAt || 'export').replace(/[^a-zA-Z0-9_-]/g, '-');

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="stundenauswertung_${safeTimestamp}.pdf"`,
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
  } finally {
    request.signal.removeEventListener('abort', onAbort);
  }
}
