import { generateZugferdXml } from '../frontend/src/lib/zugferd.ts';
import { generateDatevCsv } from '../frontend/src/lib/datev-export.ts';

console.log('=== TEST 1: ZUGFeRD XML EDGE CASES ===');

// Edge Case 1: Empty line items fallback
const xml1 = generateZugferdXml({
  invoiceNumber: 'RE-EDGE-001',
  invoiceDate: '2026-09-02T14:30:00.000Z',
  periodFrom: '2026-08-01',
  periodTo: '2026-08-31T23:59:59.000Z',
  sellerName: 'Vibe Bau GmbH & Co. KG',
  sellerStreet: 'Baustr. 1 & 2 <Test>',
  sellerCity: 'München',
  sellerCountry: 'DE',
  sellerTaxId: '143/123/45678',
  sellerVatId: 'DE999888777',
  buyerName: 'Müller "Bauherren" GbR',
  buyerStreet: 'Hauptstr. 10',
  buyerCity: 'Berlin',
  buyerCountry: 'DE',
  lineItems: [], // EMPTY LINE ITEMS!
  subtotal: 5000,
  taxRate: 0,
  taxAmount: 0,
  total: 5000,
  currency: 'EUR',
  isReverseCharge: true,
});

console.log('XML1 generated. Length:', xml1.length);
if (!xml1.includes('<udt:DateTimeString format="102">20260902</udt:DateTimeString>')) {
  throw new Error('Test 1 failed: invoiceDate timestamp was not cleanly formatted to 8 digits (20260902)');
}
if (!xml1.includes('<udt:DateTimeString format="102">20260831</udt:DateTimeString>')) {
  throw new Error('Test 1 failed: periodTo timestamp was not cleanly formatted to 8 digits (20260831)');
}
if (xml1.includes('<ram:IncludedSupplyChainTradeLineItem><ram:IncludedSupplyChainTradeLineItem>')) {
  throw new Error('Test 1 failed: Double nested IncludedSupplyChainTradeLineItem detected!');
}
if (!xml1.includes('<ram:CategoryCode>AE</ram:CategoryCode>')) {
  throw new Error('Test 1 failed: Reverse Charge CategoryCode AE missing!');
}
if (!xml1.includes('&amp;') || !xml1.includes('&lt;Test&gt;')) {
  throw new Error('Test 1 failed: XML entity escaping not applied correctly!');
}
console.log('✅ TEST 1 PASSED: ZUGFeRD XML Edge Cases (Empty items, ISO dates, Reverse Charge AE, XML Escaping)');


console.log('\n=== TEST 2: DATEV EXTF EDGE CASES ===');

// Edge Case 2: Credit note (negative amount), German date format, special characters with quotes and semicolons
const datevCsv = generateDatevCsv([
  {
    bookingId: 'b1',
    date: '02.09.2026', // German dot format
    amount: -1500.50, // NEGATIVE AMOUNT (Credit Note / Gutschrift)!
    invoiceNumber: 'GS-2026-001;Test',
    bookingText: 'Gutschrift "Materialnachlass"; Baustelle Nord',
    isReverseCharge: true,
    costCenter: 'KST-001;"P1"',
  },
  {
    bookingId: 'b2',
    date: '2026-09-02T12:00:00Z', // ISO date
    amount: 8400.00,
    invoiceNumber: 'RE-2026-002',
    bookingText: 'Abschlagsrechnung VOB',
    taxRate: 0.19,
  }
], {
  beraterNummer: 12345,
  mandantenNummer: 67890,
  skr: 'SKR03',
});

console.log('DATEV CSV generated.');
const lines = datevCsv.split('\r\n');
console.log('Header line 1:', lines[0]);
console.log('Row 1 (Credit Note):', lines[2]);
console.log('Row 2 (Regular Invoice):', lines[3]);

// Credit note must have Soll/Haben = 'S'
if (!lines[2].includes('"1500,50";"S"')) {
  throw new Error('Test 2 failed: Credit note did not produce "1500,50";"S"');
}
// Date from 02.09.2026 must be 0902
if (!lines[2].includes(';"0902";')) {
  throw new Error('Test 2 failed: German date 02.09.2026 was not parsed to MMDD (0902)');
}
// Semicolons in bookingText and invoiceNumber must be replaced so column count stays valid
if (lines[2].split(';').length !== 22) {
  throw new Error(`Test 2 failed: Row 1 column count is ${lines[2].split(';').length}, expected exactly 22 DATEV columns!`);
}
// Row 2 regular invoice must have Soll/Haben = 'H' and account 8400
if (!lines[3].includes('"8400,00";"H"') || !lines[3].includes(';"8400";')) {
  throw new Error('Test 2 failed: Regular invoice must have "H" and Erlöskonto 8400');
}
console.log('✅ TEST 2 PASSED: DATEV EXTF 700 Edge Cases (Credit notes "S", German dates MMDD, 22-column alignment, quote/semicolon escaping)');

console.log('\n=== TEST 3: MEASUREMENT SAFE EVAL EDGE CASES ===');

const SAFE_EXPR_REGEX = /^[\d+\-*/().,\s]+$/;
function safeEval(expr) {
  const trimmed = expr.trim();
  if (!trimmed) return 0;
  if (!SAFE_EXPR_REGEX.test(trimmed)) {
    return 0;
  }
  try {
    const normalized = trimmed.replace(/,/g, '.');
    const fn = new Function(`'use strict'; return (${normalized})`);
    const res = fn();
    return typeof res === 'number' && Number.isFinite(res) ? Math.round(res * 1000) / 1000 : 0;
  } catch {
    return 0;
  }
}

// 1. German commas
if (safeEval('14,5 * 8,2') !== 118.9) {
  throw new Error(`Test 3 failed: German comma evaluation failed! Got ${safeEval('14,5 * 8,2')}, expected 118.9`);
}
// 2. Complex DIN 18299 formula
if (safeEval('2 * (12,4 + 6,8) * 3,1') !== 119.04) {
  throw new Error(`Test 3 failed: Complex formula failed! Got ${safeEval('2 * (12,4 + 6,8) * 3,1')}`);
}
// 3. Malicious code injection attempt
if (safeEval('console.log("hacked")') !== 0) {
  throw new Error('Test 3 failed: Malicious string was not blocked by regex!');
}
// 4. Division by zero
if (safeEval('10 / 0') !== 0) {
  throw new Error('Test 3 failed: Division by zero should return 0 (finite check)!');
}
// 5. Syntax error
if (safeEval('10 * + / 2') !== 0) {
  throw new Error('Test 3 failed: Syntax error should return 0 gracefully!');
}
console.log('✅ TEST 3 PASSED: Formula evaluation (German commas, DIN 18299 brackets, division by zero, script injection safety)');

console.log('\n🎉 ALL EDGE CASE TESTS PASSED WATERTIGHT!');
