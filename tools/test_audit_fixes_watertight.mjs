import { generateZugferdXml } from '../frontend/src/lib/zugferd.ts';
import { generateDatevCsv } from '../frontend/src/lib/datev-export.ts';
import { generateSiteReportHtml } from '../frontend/src/lib/craft-pdf-templates.ts';

console.log('=== TEST 1: ZUGFeRD MULTI-TAX EN 16931 SPLIT ===');
const multiTaxXml = generateZugferdXml({
  invoiceNumber: 'RE-MULTITAX-2026',
  invoiceDate: '2026-09-02',
  periodFrom: '2026-09-01',
  periodTo: '2026-09-02',
  sellerName: 'Meisterbetrieb Test',
  sellerStreet: 'Werkstatt 1',
  sellerCity: 'München',
  sellerCountry: 'DE',
  sellerTaxId: '123/456',
  buyerName: 'Kunde AG',
  buyerStreet: 'Allee 1',
  buyerCity: 'Berlin',
  buyerCountry: 'DE',
  buyerVatId: 'DE123456789', // § 14a Abs. 5 UStG: Pflicht bei § 13b Reverse-Charge-Positionen
  currency: 'EUR',
  lineItems: [
    {
      name: 'Montage Estrich VOB',
      quantity: 10,
      unitCode: 'MTK',
      netAmount: 50,
      taxPercent: 0, // § 13b
    },
    {
      name: 'Spezialkleber Materialverkauf',
      quantity: 5,
      unitCode: 'C62',
      netAmount: 20,
      taxPercent: 0.19, // 19%
    }
  ],
  subtotal: 600,
  taxRate: 0.19,
  taxAmount: 19,
  total: 619,
});

if (!multiTaxXml.includes('<rsm:CrossIndustryInvoice')) {
  throw new Error('Root element must be CrossIndustryInvoice');
}
if (!multiTaxXml.includes('<ram:CategoryCode>AE</ram:CategoryCode>')) {
  throw new Error('Multi-tax XML missing AE tax category for § 13b');
}
if (!multiTaxXml.includes('<ram:CategoryCode>S</ram:CategoryCode>')) {
  throw new Error('Multi-tax XML missing S tax category for 19%');
}
if (!multiTaxXml.includes('<ram:BasisAmount>500.00</ram:BasisAmount>')) {
  throw new Error('BasisAmount for 13b must be 500.00');
}
if (!multiTaxXml.includes('<ram:BasisAmount>100.00</ram:BasisAmount>')) {
  throw new Error('BasisAmount for 19% must be 100.00');
}
if (!multiTaxXml.includes('<ram:CalculatedAmount>19.00</ram:CalculatedAmount>')) {
  throw new Error('CalculatedAmount for 19% must be 19.00');
}
console.log('✅ TEST 1 PASSED: ZUGFeRD multi-tax split correctly generated!');


console.log('\n=== TEST 2: DATEV SPLIT BOOKINGS ===');
const datevCsv = generateDatevCsv([
  {
    bookingId: 'B1',
    date: '02.09.2026',
    amount: 500.00,
    invoiceNumber: 'RE-MULTITAX-2026',
    accountNumber: '8337',
    contraAccount: '10000',
    bookingText: 'VOB § 13b Montage',
    isReverseCharge: true,
    buKey: '68',
  },
  {
    bookingId: 'B2',
    date: '02.09.2026',
    amount: 119.00,
    invoiceNumber: 'RE-MULTITAX-2026',
    accountNumber: '8400',
    contraAccount: '10000',
    bookingText: '19% Material',
    taxRate: 0.19,
    isReverseCharge: false,
  }
]);

const rows = datevCsv.split('\r\n');
if (rows.length !== 4) { // 2 header lines + 2 rows
  throw new Error(`Expected 4 CSV lines, got ${rows.length}`);
}
if (!rows[2].includes('"8337"') || !rows[2].includes('"68"')) {
  throw new Error('Row 1 must book on 8337 with BU 68');
}
if (!rows[3].includes('"8400"') || !rows[3].includes('"119,00"')) {
  throw new Error('Row 2 must book on 8400 with 119,00 gross');
}
console.log('✅ TEST 2 PASSED: DATEV split bookings aligned!');


console.log('\n=== TEST 3: PDF SHA-256 INTEGRITY SEAL ===');
const pdfHtml = generateSiteReportHtml({
  report: {
    id: 'rep_12345',
    project: 'proj_abc',
    report_date: '2026-09-02',
    status: 'signed',
    weather: 'Sonnig',
    temperature: 21,
    work_performed: 'Estricharbeiten DIN 18560',
    client_signed_at: '2026-09-02T16:00:00.000Z',
    client_name: 'Bauleiter Meier',
    qualification_hours: { meister: 2, geselle: 6, helfer: 0, azubi: 0 },
    created: '2026-09-02',
    updated: '2026-09-02',
    collectionId: 'site_reports',
    collectionName: 'site_reports',
  },
  projectName: 'Neubau Gewerbepark',
  projectKey: 'NGP-01',
  authorName: 'Vorarbeiter Schmidt',
  measurements: [
    {
      id: 'm1',
      site_report: 'rep_12345',
      position_nr: '01.01',
      title: 'Estrich CT-C25-F4',
      quantity: 118.9,
      unit: 'm2',
      unit_price: 38.5,
      total_price: 4577.65,
      formula: '14.5 * 8.2',
      created: '',
      updated: '',
      collectionId: '',
      collectionName: '',
    }
  ],
  isReverseCharge: true,
});

if (!pdfHtml.includes('GoBD / § 127 BGB Integritäts-Siegel:')) {
  throw new Error('PDF missing integrity seal header');
}
if (!pdfHtml.includes('SHA256-')) {
  throw new Error('PDF missing SHA-256 fingerprint');
}
console.log('✅ TEST 3 PASSED: PDF SHA-256 seal correctly generated and rendered!');

console.log('\n🎉 ALL ARCHITECTURE REINFORCEMENTS TESTED AND VERIFIED CLEAN!');
