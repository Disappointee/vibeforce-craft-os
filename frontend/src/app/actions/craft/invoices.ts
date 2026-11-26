'use server';

import { revalidatePath } from 'next/cache';
import { withAdminPB, verifyUserSession } from '@/lib/pocketbase-server';
import { assertCraftFeatureEntitlement } from '@/lib/server-entitlements';
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
    // 1. Fetch site report with project, client and measurements
    const report = (await pb.collection('site_reports').getOne(siteReportId, {
      expand: 'project,project.client,measurements(site_report)',
    })) as unknown as SiteReportRecord & {
      expand?: {
        project?: ProjectRecord & { expand?: { client?: Record<string, any> } };
        'measurements(site_report)'?: MeasurementRecord[];
      };
    };

    const project = report.expand?.project;
    const measurements = report.expand?.['measurements(site_report)'] || [];

    if (!project) throw new Error('Projekt zum Bericht nicht gefunden.');

    // Hard server-side entitlement check
    await assertCraftFeatureEntitlement('invoices', project.id);

    // GoBD double-invoice lock
    if (report.status === 'invoiced') {
      throw new Error('Dieser Bautagesbericht wurde bereits abgerechnet (GoBD-Doppelabrechnungssperre).');
    }

    const existingByReport = await pb.collection('invoices_zugferd').getList(1, 1, {
      filter: pb.filter('site_report = {:reportId}', { reportId: siteReportId }),
    });
    if (existingByReport.totalItems > 0) {
      throw new Error('Für diesen Bautagesbericht existiert bereits eine Rechnung (Doppelabrechnungssperre).');
    }

    const existingByNumber = await pb.collection('invoices_zugferd').getList(1, 1, {
      filter: pb.filter('invoice_number = {:invNum}', { invNum: invoiceNumber }),
    });
    if (existingByNumber.totalItems > 0) {
      throw new Error(`Rechnungsnummer "${invoiceNumber}" ist bereits vergeben.`);
    }

    // 2. Compute sums & map VOB units to UN/ECE Rec 20
    const mapUnitCode = (u: string) => {
      switch (u) {
        case 'h': return 'HUR';
        case 'm': return 'MTR';
        case 'm2': return 'MTK';
        case 'm3': return 'MTQ';
        case 'kg': return 'KGM';
        case 'stk': return 'C62';
        default: return 'C62';
      }
    };

    const isReverseCharge = Boolean((project as any)?.reverse_charge_13b);
    const defaultTaxRateType = isReverseCharge ? 'reverse_charge_13b' : 'standard_19';
    const resolveTaxPercent = (taxRateType?: string): number => {
      switch (taxRateType || defaultTaxRateType) {
        case 'reverse_charge_13b':
        case 'zero_0':
          return 0.0;
        case 'reduced_7':
          return 0.07;
        case 'standard_19':
        default:
          return 0.19;
      }
    };

    const lineItems = measurements.map((m) => {
      const taxPercent = resolveTaxPercent((m as any).tax_rate_type);
      return {
        name: m.title,
        description: m.formula || '',
        quantity: m.quantity || 1,
        unitCode: mapUnitCode(m.unit || 'm2'),
        netAmount: m.unit_price || 0,
        taxPercent,
      };
    });

    const netTotal = Math.round(lineItems.reduce((acc, item) => acc + item.quantity * item.netAmount, 0) * 100) / 100;
    const taxTotal = Math.round(lineItems.reduce((acc, item) => acc + item.quantity * item.netAmount * item.taxPercent, 0) * 100) / 100;
    const grossTotal = Math.round((netTotal + taxTotal) * 100) / 100;
    const has19Items = lineItems.some((item) => item.taxPercent === 0.19);
    const has13bItems = lineItems.some((item) => item.taxPercent === 0);
    const effectiveTaxRate = has19Items ? 0.19 : (lineItems[0]?.taxPercent ?? (isReverseCharge ? 0.0 : 0.19));
    const effectiveIsReverseCharge = (isReverseCharge || has13bItems) && !has19Items;

    const client = project.expand?.client;
    const rawBuyerVatId =
      (project as any)?.buyer_vat_id ||
      (project as any)?.vat_id ||
      client?.vat_id ||
      client?.ust_idnr ||
      client?.tax_id;

    const buyerVatId = typeof rawBuyerVatId === 'string' && rawBuyerVatId.trim()
      ? rawBuyerVatId.trim()
      : undefined;

    // 3. Resolve Seller Master Data & Optional § 48b EStG Notice
    let sellerName = process.env.CRAFT_SELLER_NAME || 'Vibeforce One Handwerk GmbH';
    let sellerStreet = process.env.CRAFT_SELLER_STREET || 'Baustellenring 1';
    let sellerCity = process.env.CRAFT_SELLER_CITY || '10115 Berlin';
    let sellerCountry = process.env.CRAFT_SELLER_COUNTRY || 'DE';
    let sellerTaxId = process.env.CRAFT_SELLER_TAX_ID || '12/345/67890';
    let sellerVatId = process.env.CRAFT_SELLER_VAT_ID || 'DE123456789';
    let freistellungAktenzeichen = process.env.CRAFT_FREISTELLUNG_AKTENZEICHEN || '';
    let freistellungGueltigBis = process.env.CRAFT_FREISTELLUNG_GUELTIG_BIS || '';

    try {
      const settings = await pb.collection('app_settings').getFirstListItem('');
      if (settings) {
        if (settings.app_name) sellerName = settings.app_name;
        if ((settings as any).company_name) sellerName = (settings as any).company_name;
        if ((settings as any).company_street) sellerStreet = (settings as any).company_street;
        const zip = (settings as any).company_zip ? `${(settings as any).company_zip} ` : '';
        if ((settings as any).company_city) sellerCity = `${zip}${(settings as any).company_city}`;
        if ((settings as any).company_country) sellerCountry = (settings as any).company_country;
        if ((settings as any).tax_id) sellerTaxId = (settings as any).tax_id;
        if ((settings as any).vat_id) sellerVatId = (settings as any).vat_id;
        if ((settings as any).freistellung_aktenzeichen) freistellungAktenzeichen = (settings as any).freistellung_aktenzeichen;
        if ((settings as any).freistellung_gueltig_bis) freistellungGueltigBis = (settings as any).freistellung_gueltig_bis;
      }
    } catch {
      // app_settings record may be empty, fallback used
    }

    // § 48b EStG Bauabzugsteuer Check (Ampel: nur aktiv, wenn nicht abgelaufen)
    let freistellungNotice: string | undefined;
    const todayStr = new Date().toISOString().split('T')[0];
    if (freistellungAktenzeichen && freistellungGueltigBis) {
      if (freistellungGueltigBis >= todayStr) {
        freistellungNotice = `Freistellungsbescheinigung nach § 48b Abs. 1 Satz 1 EStG (${freistellungAktenzeichen}, gültig bis ${freistellungGueltigBis}) liegt vor.`;
      } else {
        console.warn(`[Craft Invoice] Freistellungsbescheinigung ${freistellungAktenzeichen} ist seit ${freistellungGueltigBis} abgelaufen!`);
      }
    }

    const paymentTerms = [
      isReverseCharge
        ? 'Steuerschuldnerschaft des Leistungsempfängers gemäß § 13b UStG (Reverse Charge). Zahlbar innerhalb von 14 Tagen nach VOB/B.'
        : 'Zahlbar innerhalb von 14 Tagen nach VOB/B.',
      freistellungNotice,
    ].filter(Boolean).join(' ');

    const rawClientAddress = typeof client?.address === 'string' ? client.address.trim() : '';
    const addressParts = rawClientAddress ? rawClientAddress.split(',').map((s: string) => s.trim()) : [];
    const buyerName = client?.company || client?.name || report.client_name || project.name;
    const buyerStreet =
      (typeof client?.street === 'string' && client.street.trim()) ||
      addressParts[0] ||
      project.site_address?.street ||
      '';
    const buyerCity =
      (typeof client?.city === 'string' && client.city.trim()) ||
      addressParts.slice(1).join(', ') ||
      [project.site_address?.zip, project.site_address?.city].filter(Boolean).join(' ') ||
      '';
    const buyerCountry =
      (typeof client?.country === 'string' && client.country.trim()) ||
      project.site_address?.country ||
      'DE';

    // 4. Generate ZUGFeRD 2.1.1 XML (EN16931 Compliant)
    const zugferdData: ZugferdInvoiceData = {
      invoiceNumber,
      invoiceDate: new Date().toISOString().split('T')[0],
      periodFrom: report.report_date,
      periodTo: report.report_date,
      sellerName,
      sellerStreet,
      sellerCity,
      sellerCountry,
      sellerTaxId,
      sellerVatId,
      buyerName,
      buyerStreet,
      buyerCity,
      buyerCountry,
      buyerVatId,
      lineItems,
      subtotal: netTotal,
      taxRate: effectiveTaxRate,
      taxAmount: taxTotal,
      total: grossTotal,
      currency: 'EUR',
      isReverseCharge: effectiveIsReverseCharge,
      paymentTerms,
    };

    const zugferdXml = generateZugferdXml(zugferdData);

    // 5. Generate PDF/A rendering in ~400ms
    const html = generateSiteReportHtml({
      report,
      projectName: project.name,
      projectKey: project.key,
      clientName: report.client_name,
      authorName: typeof user.name === 'string' ? user.name : 'Monteur',
      measurements,
      isReverseCharge,
      freistellungNotice,
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
      tax_rate: Math.round(effectiveTaxRate * 100),
      tax_total: taxTotal,
      gross_total: grossTotal,
      zugferd_xml: zugferdXml,
    });

    // Also update report status to invoiced
    await pb.collection('site_reports').update(siteReportId, {
      status: 'invoiced',
    });

    revalidatePath('/craft');
    revalidatePath('/projects');
    revalidatePath(`/projects/${project.id}`);

    return {
      invoice: JSON.parse(JSON.stringify(invoiceRecord)) as InvoiceZugferdRecord,
      zugferdXml,
      pdfBase64: pdfBuffer.toString('base64'),
    };
  });
}
