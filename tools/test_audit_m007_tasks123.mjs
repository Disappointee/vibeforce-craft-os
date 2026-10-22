/**
 * Watertight Tests: Audit M007 Aufgaben 1-3 (ZUGFeRD BT-10/11/13, IDS-Connect Token/JSON-Cart,
 * LabourSource-Konsolidierung). Run: node tools/test_audit_m007_tasks123.mjs
 */
import { generateZugferdXml, validateLeitwegId } from '../frontend/src/lib/zugferd.ts';
import {
  createIdsHookToken,
  verifyIdsHookToken,
  parseIdsCartJson,
} from '../frontend/src/lib/ids-connect.ts';
import { calculateProjectCostSummary } from '../frontend/src/lib/cost-calculation.ts';

let passed = 0;
function assert(cond, label) {
  if (!cond) throw new Error(`FAILED: ${label}`);
  passed++;
  console.log(`  ✅ ${label}`);
}

// ---------- Aufgabe 1: ZUGFeRD ----------
console.log('=== A1: ZUGFeRD BT-10/11/13 + Leitweg-ID ===');

const valid = validateLeitwegId('04011001-12345-01');
assert(valid.valid === true, 'validateLeitwegId akzeptiert gültige Leitweg-ID');
assert(validateLeitwegId('04011001-12345-1').valid === false, 'lehnt 1-stellige Endziffer ab');
assert(validateLeitwegId('0-ABC-01').valid === false, 'lehnt zu kurzen Präfix ab');
assert(validateLeitwegId('').valid === false, 'lehnt leere ID ab');
assert(validateLeitwegId('04011001-12345-01').valid && !validateLeitwegId('x-y-z').valid, 'lehnt Sonderzeichen ab');

const xml = generateZugferdXml({
  invoiceNumber: 'RE-BT10-2026',
  invoiceDate: '2026-09-07',
  periodFrom: '2026-09-01',
  periodTo: '2026-09-07',
  sellerName: 'Testbetrieb & Co <KG>',
  sellerStreet: 'Weg 1',
  sellerCity: 'München',
  sellerCountry: 'DE',
  sellerTaxId: '123/456',
  buyerName: 'Stadt Teststadt',
  buyerStreet: 'Platz 2',
  buyerCity: 'Teststadt',
  buyerCountry: 'DE',
  currency: 'EUR',
  subtotal: 100,
  taxRate: 0.19,
  taxAmount: 19,
  total: 119,
  lineItems: [{ name: 'Montage', quantity: 1, unitCode: 'HUR', netAmount: 100, taxPercent: 0.19 }],
  buyerReference: '04011001-12345-01',
  buyerOrderReference: 'BEST-2026-<4711>',
  projectReference: 'PRJ-99',
});
const compact = xml.replace(/\s+/g, '');
assert(compact.includes('<ram:BusinessProcessSpecifiedDocumentContextParameter><ram:ID>urn:cen.eu:en16931:2017</ram:ID></ram:BusinessProcessSpecifiedDocumentContextParameter>'), 'BusinessProcess-Kontext vorhanden');
assert(compact.includes('<ram:BuyerReference>04011001-12345-01</ram:BuyerReference>'), 'BT-10 BuyerReference ausgegeben');
assert(xml.indexOf('<ram:BuyerReference>') < xml.indexOf('<ram:SellerTradeParty>'), 'BT-10 unmittelbar vor SellerTradeParty');
assert(compact.includes('<ram:BuyerOrderReferencedDocument><ram:IssuerAssignedID>BEST-2026-&lt;4711&gt;</ram:IssuerAssignedID>'), 'BT-13 mit XML-Escaping');
assert(compact.includes('<ram:SpecifiedProcuringProject><ram:ID>PRJ-99</ram:ID>'), 'BT-11 Projektreferenz ausgegeben');
assert(xml.indexOf('</ram:BuyerTradeParty>') < xml.indexOf('<ram:BuyerOrderReferencedDocument>'), 'BT-13 nach BuyerTradeParty (CII-Schema-Sequenz)');
assert(xml.indexOf('<ram:SpecifiedProcuringProject>') > xml.indexOf('</ram:BuyerTradeParty>'), 'BT-11 nach BuyerTradeParty');

const xmlNoRefs = generateZugferdXml({
  invoiceNumber: 'RE-PLAIN',
  invoiceDate: '2026-09-07', periodFrom: '2026-09-01', periodTo: '2026-09-07',
  sellerName: 'A', sellerStreet: 'B', sellerCity: 'C', sellerCountry: 'DE', sellerTaxId: '1',
  buyerName: 'D', buyerStreet: 'E', buyerCity: 'F', buyerCountry: 'DE', currency: 'EUR',
  subtotal: 1, taxRate: 0.19, taxAmount: 0.19, total: 1.19,
});
assert(!xmlNoRefs.includes('<ram:BuyerReference>') && !xmlNoRefs.includes('<ram:SpecifiedProcuringProject>'), 'keine leeren Referenz-Elemente ohne Angaben');

let publicSectorWithoutRefThrew = false;
try {
  generateZugferdXml({
    invoiceNumber: 'RE-PUB-1',
    invoiceDate: '2026-09-07', periodFrom: '2026-09-01', periodTo: '2026-09-07',
    sellerName: 'A', sellerStreet: 'B', sellerCity: 'C', sellerCountry: 'DE', sellerTaxId: '1',
    buyerName: 'Bauamt', buyerStreet: 'E', buyerCity: 'F', buyerCountry: 'DE', currency: 'EUR',
    subtotal: 1, taxRate: 0.19, taxAmount: 0.19, total: 1.19,
    isPublicSector: true,
  });
} catch (e) {
  publicSectorWithoutRefThrew = true;
}
assert(publicSectorWithoutRefThrew, 'isPublicSector: true ohne buyerReference wirft Fehler (Fail-Closed)');

let publicSectorInvalidRefThrew = false;
try {
  generateZugferdXml({
    invoiceNumber: 'RE-PUB-2',
    invoiceDate: '2026-09-07', periodFrom: '2026-09-01', periodTo: '2026-09-07',
    sellerName: 'A', sellerStreet: 'B', sellerCity: 'C', sellerCountry: 'DE', sellerTaxId: '1',
    buyerName: 'Bauamt', buyerStreet: 'E', buyerCity: 'F', buyerCountry: 'DE', currency: 'EUR',
    subtotal: 1, taxRate: 0.19, taxAmount: 0.19, total: 1.19,
    isPublicSector: true,
    buyerReference: 'ungueltig',
  });
} catch (e) {
  publicSectorInvalidRefThrew = true;
}
assert(publicSectorInvalidRefThrew, 'isPublicSector: true mit ungültiger Leitweg-ID wirft Fehler');

const xmlPublicValid = generateZugferdXml({
  invoiceNumber: 'RE-PUB-3',
  invoiceDate: '2026-09-07', periodFrom: '2026-09-01', periodTo: '2026-09-07',
  sellerName: 'A', sellerStreet: 'B', sellerCity: 'C', sellerCountry: 'DE', sellerTaxId: '1',
  buyerName: 'Bauamt', buyerStreet: 'E', buyerCity: 'F', buyerCountry: 'DE', currency: 'EUR',
  subtotal: 1, taxRate: 0.19, taxAmount: 0.19, total: 1.19,
  isPublicSector: true,
  buyerReference: '04011001-12345-01',
});
assert(xmlPublicValid.includes('<ram:BuyerReference>04011001-12345-01</ram:BuyerReference>'), 'isPublicSector: true mit gültiger Leitweg-ID erzeugt XML');

// ---------- Aufgabe 2: IDS-Connect ----------
console.log('=== A2: IDS-Connect hookToken + JSON-Cart ===');

const secret = process.env.IDS_HOOK_SECRET;
const token = createIdsHookToken('proj-1', secret, 1);
const check = verifyIdsHookToken(token, secret);
assert(check.valid === true && check.projectId === 'proj-1', 'Token-Roundtrip gültig mit korrekter projectId');
assert(verifyIdsHookToken(token, 'wrong-secret').valid === false, 'falsches Secret → ungültig');
assert(verifyIdsHookToken(token.slice(0, -2) + 'ff', secret).valid === false, 'manipulierte Signatur → ungültig');
const expiredToken = createIdsHookToken('proj-1', secret, -1);
const expired = verifyIdsHookToken(expiredToken, secret);
assert(expired.valid === false && (expired.error || '').includes('abgelaufen'), 'negatives expiresIn → abgelaufen');
const dotted = verifyIdsHookToken(createIdsHookToken('a.b.c', secret), secret);
assert(dotted.valid === true && dotted.projectId === 'a.b.c', 'projectId mit Punkten roundtrip-sicher');
assert(token.split('.').length === 3, 'Token-Format payload.expiry.signature');

const jsonCart = parseIdsCartJson({
  header: { wholesalerName: 'Sonepar', cartId: 'C-1', orderDate: '2026-09-07', currency: 'EUR' },
  items: [
    { itemNumber: 'SON-1', description: 'Verteiler', quantity: 2, unit: 'STK', priceGross: 100, discountPercent: 10 },
    { itemNumber: 'SON-2', description: 'Kabel', quantity: 10, unit: 'm', priceNet: 1.5 },
  ],
});
assert(jsonCart.items.length === 2, 'parseIdsCartJson liest beide Positionen');
assert(jsonCart.items[0].priceNet === 90, 'priceNet aus Rabatt abgeleitet (100 * 0.9)');
assert(jsonCart.items[1].totalNet === 15, 'totalNet = qty * priceNet');
assert(jsonCart.totalNet === 195, 'totalNet korrekt summiert');
try {
  parseIdsCartJson({ noItems: true });
  assert(false, 'parseIdsCartJson ohne items wirft');
} catch {
  assert(true, 'parseIdsCartJson ohne items wirft');
}

// ---------- Aufgabe 3: LabourSource-Konsolidierung ----------
console.log('=== A3: labourSource Antidoppelzählung ===');

const project = { id: 'p1', name: 'Testprojekt', budget_hours: 20, budget_money: 3000, external_costs_total: 0 };
const timeEntries = [{ duration_minutes: 480 }]; // 8 h
const siteReports = [
  { qualification_hours: { meister: 8, geselle: 0, helfer: 0, azubi: 0 } }, // 8 h
  { qualification_hours: { meister: 2, geselle: 0, helfer: 0, azubi: 0 }, is_regie_extra: true }, // 2 h Regie-Extra
];

const sTime = calculateProjectCostSummary({ project, timeEntries, siteReports, labourSource: 'time_entries' });
assert(sTime.istHours === 8, 'time_entries: nur 8 Stempelstunden (nicht 18)');
assert(sTime.ignoredHoursFromOtherSource === 10 && sTime.hasDataCollisionWarning, 'time_entries: 10 h Regie ignoriert + Warnung');
assert((sTime.collisionWarningText || '').includes('aus Bautagesberichten'), 'Warnungstext nach Spec');

const sReports = calculateProjectCostSummary({ project, timeEntries, siteReports, labourSource: 'site_reports' });
assert(sReports.istHours === 10, 'site_reports: nur 10 Berichtsstunden');
assert(sReports.ignoredHoursFromOtherSource === 8, 'site_reports: 8 Stempelstunden ignoriert');

const sAdditive = calculateProjectCostSummary({ project, timeEntries, siteReports, labourSource: 'regie_additive' });
assert(sAdditive.istHours === 10, 'regie_additive: 8 Stempel + nur 2 markierte Regiestunden');
assert(sAdditive.ignoredHoursFromOtherSource === 8 && sAdditive.hasDataCollisionWarning, 'regie_additive: 8 unmarkierte Regiestunden ignoriert');

const sDefault = calculateProjectCostSummary({ project, timeEntries, siteReports });
assert(sDefault.labourSourceUsed === 'time_entries', 'Default-Quelle ist time_entries');

console.log(`\n🎉 ALL M007 TASKS 1-3 TESTS PASSED (${passed} assertions)`);
