'use server';

import { withAdminPB, verifyUserSession } from '@/lib/pocketbase-server';
import { generateZugferdXml, type ZugferdInvoiceData } from '@/lib/zugferd';
import { generateSiteReportHtml } from '@/lib/craft-pdf-templates';
import { pdfService } from '@/lib/pdf-service';
import type {
  SiteReportRecord,
  MeasurementRecord,
  ProjectRecord,
  InvoiceZugferdRecord,
} from '@/lib/pocketbase-types';

export async function generateCraftInvoiceAction(
  siteReportId: string,
  invoiceNumber: string,
  invoiceType: 'abschlag' | 'schluss' | 'standard' = 'standard'
) {
  const user = await verifyUserSession();
  if (!user) throw new Error('Nicht autorisiert. Bitte erneut anmelden.');

  return withAdminPB(async (pb) => {
    // 1. Fetch site report with project and measurements
    const report = (await pb.collection('site_reports').getOne(siteReportId, {
      expand: 'project,measurements(site_report)',
    })) as unknown as SiteReportRecord & {
      expand?: {
        project?: ProjectRecord;
        'measurements(site_report)'?: MeasurementRecord[];
      };
    };

    const project = report.expand?.project;
    const measurements = report.expand?.['measurements(site_report)'] || [];

    if (!project) throw new Error('Projekt zum Bericht nicht gefunden.');

    // 2. Compute sums
    const lineItems = measurements.map((m) => ({
      name: m.title,
      description: m.formula || '',
      quantity: m.quantity || 1,
      unitCode: m.unit === 'h' ? 'HUR' : m.unit === 'stk' ? 'C62' : 'MTR',
      netAmount: m.unit_price || 0,
      taxPercent: 0.19,
    }));

    const netTotal = lineItems.reduce((acc, item) => acc + item.quantity * item.netAmount, 0);
    const taxTotal = Math.round(netTotal * 0.19 * 100) / 100;
    const grossTotal = Math.round((netTotal + taxTotal) * 100) / 100;

    // 3. Generate ZUGFeRD 2.1.1 XML
    const zugferdData: ZugferdInvoiceData = {
      invoiceNumber,
      invoiceDate: new Date().toISOString().split('T')[0],
      periodFrom: report.report_date,
      periodTo: report.report_date,
      sellerName: 'Vibeforce One Handwerk GmbH',
      sellerStreet: 'Baustellenring 1',
      sellerCity: '10115 Berlin',
      sellerCountry: 'DE',
      sellerTaxId: 'DE123456789',
      buyerName: report.client_name || project.name,
      buyerStreet: 'Musterstraße 42',
      buyerCity: '10115 Berlin',
      buyerCountry: 'DE',
      lineItems,
      subtotal: netTotal,
      taxRate: 0.19,
      taxAmount: taxTotal,
      total: grossTotal,
      currency: 'EUR',
      paymentTerms: 'Zahlbar innerhalb von 14 Tagen nach VOB/B.',
    };

    const zugferdXml = generateZugferdXml(zugferdData);

    // 4. Generate PDF/A rendering in ~400ms
    const html = generateSiteReportHtml({
      report,
      projectName: project.name,
      projectKey: project.key,
      clientName: report.client_name,
      authorName: typeof user.name === 'string' ? user.name : 'Monteur',
      measurements,
    });

    const pdfBuffer = await pdfService.renderHtmlToPdf(html, {
      format: 'A4',
      printBackground: true,
    });

    // 5. Persist into invoices_zugferd
    const invoiceRecord = await pb.collection('invoices_zugferd').create({
      site_report: siteReportId,
      project: project.id,
      invoice_number: invoiceNumber,
      invoice_type: invoiceType,
      net_total: netTotal,
      tax_rate: 19,
      tax_total: taxTotal,
      gross_total: grossTotal,
      zugferd_xml: zugferdXml,
    });

    // Also update report status to invoiced
    await pb.collection('site_reports').update(siteReportId, {
      status: 'invoiced',
    });

    return {
      invoice: JSON.parse(JSON.stringify(invoiceRecord)) as InvoiceZugferdRecord,
      zugferdXml,
      pdfBase64: pdfBuffer.toString('base64'),
    };
  });
}
