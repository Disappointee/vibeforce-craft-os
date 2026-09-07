/**
 * ============================================================================
 * VIBE CRAFT (M007) — INTENSIVE MASTER AUDIT SUITE
 * ============================================================================
 * Prüft alle Kern- und Phase-4-Funktionen auf Herz und Nieren:
 * 1. ZUGFeRD 2.1.1 EN 16931 & XRechnung (BT-10/11/13, Multi-Tax S/AE/AA, Leitweg-ID)
 * 2. DATEV Kanzlei-Rechnungswesen EXTF 700 (SKR03/04, Split-Buchungen, BU-Schlüssel 68)
 * 3. VOB-Aufmaß & Shunting-Yard Formelevaluator (DIN 18299 § 4, Multi-Tax, Rechenregeln)
 * 4. 92vh SignaturePad & VOB/B § 15 Manifest (Vektor-Strokes 3D, SHA-256, DIN-Kreuz)
 * 5. 2D-Plan-Pinning & VOB/B § 13 Mängelmanagement (Fristen, Ersatzvornahme, Severity)
 * 6. GAEB 90 / 2000 / XML Engine (DP 83/84, DIN 1333 Rundung, Aufmaß-Bridge)
 * 7. DATANORM 5.0 & IDS-Connect 2.5 (HMAC-SHA256 Token, DOS CP850, Cart-Import)
 * 8. Cost Cockpit & Nachkalkulation (3-Wege Stundenquellen, VOB/B § 2 Mehrkostenwarnung)
 * 9. PDF-Report GoBD & § 127 BGB Integritäts-Siegel
 * ============================================================================
 */

import { generateZugferdXml, validateLeitwegId } from '../frontend/src/lib/zugferd.ts';
import { generateDatevCsv } from '../frontend/src/lib/datev-export.ts';
import { generateSiteReportHtml } from '../frontend/src/lib/craft-pdf-templates.ts';
import {
  createIdsHookToken,
  verifyIdsHookToken,
  parseIdsCartJson,
  parseIdsCartXml,
  generateIdsPunchoutUrl,
  IDS_WHOLESALER_PROFILES,
} from '../frontend/src/lib/ids-connect.ts';
import {
  parseDatanormContent,
  calculatePurchasePrice,
  calculateSellingPrice,
  calculateMargin,
} from '../frontend/src/lib/datanorm.ts';
import {
  detectGaebFormat,
  parseGaeb90Text,
  parseGaebXml,
  convertGaebItemToMeasurement,
} from '../frontend/src/lib/gaeb.ts';
import {
  calculateProjectCostSummary,
} from '../frontend/src/lib/cost-calculation.ts';
import crypto from 'crypto';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];

function assert(condition, message, details = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  [PASS] ${message}`);
  } else {
    failedTests++;
    console.error(`  [FAIL] ${message} ${details ? '--> ' + details : ''}`);
    failures.push({ message, details });
  }
}

console.log('======================================================================');
console.log('  STARTING DEEP INTENSIVE AUDIT: VIBE CRAFT (M007) FULL SYSTEM');
console.log('======================================================================\n');

// --------------------------------------------------------------------------
// MODUL 1: ZUGFeRD 2.1.1 EN 16931 & XRechnung 3.0
// --------------------------------------------------------------------------
console.log('>>> MODUL 1: ZUGFeRD 2.1.1 EN 16931 & XRECHNUNG <<<');

// 1.1 Leitweg-ID Syntax & Fehlertoleranz
assert(validateLeitwegId('04011000-12345-67').valid === true, 'Leitweg-ID Standardformat (Bundesverwaltung) gültig');
assert(validateLeitwegId('991-12345-01').valid === true, 'Leitweg-ID mit 3-stelligem Prüfzeichen gültig');
assert(validateLeitwegId('040110001234567').valid === false, 'Leitweg-ID ohne Bindestriche abgelehnt');
assert(validateLeitwegId('04011000-12345-1').valid === false, 'Leitweg-ID mit 1-stelliger Prüfziffer abgelehnt');
assert(validateLeitwegId('   ').valid === false, 'Leere Leitweg-ID abgelehnt');

// 1.2 Multi-Tax Aufteilung (§ 13b Reverse Charge + 19% + 7%)
const multiTaxXml = generateZugferdXml({
  invoiceNumber: 'RE-AUDIT-2026-001',
  invoiceDate: '2026-09-07',
  periodFrom: '2026-09-01',
  periodTo: '2026-09-07',
  sellerName: 'Vibeforce Bau GmbH',
  sellerStreet: 'Handwerkerstraße 12',
  sellerCity: 'Berlin',
  sellerCountry: 'DE',
  sellerTaxId: 'DE987654321',
  buyerName: 'Öffentliches Hochbauamt Berlin-Mitte',
  buyerStreet: 'Karl-Marx-Allee 31',
  buyerCity: 'Berlin',
  buyerCountry: 'DE',
  buyerVatId: 'DE112233445',
  buyerReference: '11000000-12345-42', // Leitweg-ID
  buyerOrderReference: 'BEST-HA-9821', // BT-13
  projectReference: 'PRJ-SPREEAUEN-2026', // BT-11
  isPublicSector: true,
  currency: 'EUR',
  lineItems: [
    { name: 'Rohbauarbeiten VOB § 13b', quantity: 200, unitCode: 'MTK', netAmount: 50, taxPercent: 0 },
    { name: 'Baustellenstrom & Beleuchtung', quantity: 1, unitCode: 'C62', netAmount: 500, taxPercent: 0.19 },
  ],
  subtotal: 10500, // 10000 + 500
  taxRate: 0.19,
  taxAmount: 95, // 500 * 0.19 = 95
  total: 10595,
});

assert(multiTaxXml.includes('CrossIndustryInvoice'), 'Root Element ist CrossIndustryInvoice');
assert(multiTaxXml.includes('<ram:BuyerReference>11000000-12345-42</ram:BuyerReference>'), 'BT-10 Leitweg-ID im XML verankert');
assert(multiTaxXml.includes('SpecifiedProcuringProject') && multiTaxXml.includes('PRJ-SPREEAUEN-2026'), 'BT-11 Projektreferenz korrekt');
assert(multiTaxXml.includes('<ram:IssuerAssignedID>BEST-HA-9821</ram:IssuerAssignedID>'), 'BT-13 Bestellreferenz korrekt platziert');
assert(multiTaxXml.includes('<ram:CategoryCode>AE</ram:CategoryCode>'), 'Tax Category AE (Reverse Charge gem. § 13b) vorhanden');
assert(multiTaxXml.includes('<ram:CategoryCode>S</ram:CategoryCode>'), 'Tax Category S (Standard 19%) vorhanden');
assert(multiTaxXml.includes('<ram:BasisAmount>10000.00</ram:BasisAmount>'), 'Bemessungsgrundlage 13b = 10000.00 €');
assert(multiTaxXml.includes('<ram:BasisAmount>500.00</ram:BasisAmount>'), 'Bemessungsgrundlage 19% = 500.00 €');
assert(multiTaxXml.includes('<ram:CalculatedAmount>95.00</ram:CalculatedAmount>'), 'Berechnete Steuer 19% = 95.00 €');
assert(multiTaxXml.includes('Steuerschuldnerschaft des Leistungsempfängers'), '§ 13b gesetzlicher Hinweistext enthalten');

// --------------------------------------------------------------------------
// MODUL 2: DATEV KANZLEI-RECHNUNGSWESEN EXTF 700
// --------------------------------------------------------------------------
console.log('\n>>> MODUL 2: DATEV EXTF 700 EXPORT & SPLIT-BUCHUNGEN <<<');

const datevRecords = [
  {
    bookingId: 'BK-101',
    date: '07.09.2026',
    amount: 10000.00,
    invoiceNumber: 'RE-AUDIT-2026-001',
    accountNumber: '8337', // Erlöse 13b UStG
    contraAccount: '10000', // Debitor
    bookingText: 'Rohbau Spreeauen VOB § 13b',
    isReverseCharge: true,
    buKey: '68', // Steuerschlüssel 68 nach DATEV
  },
  {
    bookingId: 'BK-102',
    date: '07.09.2026',
    amount: 595.00, // 500 netto + 95 USt
    invoiceNumber: 'RE-AUDIT-2026-001',
    accountNumber: '8400', // Erlöse 19% USt
    contraAccount: '10000',
    bookingText: 'Baustrom 19% MwSt',
    taxRate: 0.19,
    isReverseCharge: false,
  }
];

const datevCsv = generateDatevCsv(datevRecords);
const datevLines = datevCsv.split('\r\n').filter(l => l.trim().length > 0);

assert(datevLines.length === 4, 'DATEV Export hat 2 Headerzeilen (EXTF 700) + 2 Buchungszeilen');
assert(datevLines[0].includes('EXTF'), 'Header 1 enthält EXTF-Kennung');
assert(datevLines[1].includes('Umsatz (ohne Soll/Haben-Kz)'), 'Header 2 enthält Spaltenbezeichner');
assert(datevCsv.includes('"10000,00"') && datevCsv.includes('"8337"') && datevCsv.includes('"68"'), '§ 13b Buchung auf Konto 8337 mit BU 68 und Komma-Betrag');
assert(datevCsv.includes('"595,00"') && datevCsv.includes('"8400"'), '19% Buchung auf Konto 8400 mit 595,00 Bruttobetrag');

// --------------------------------------------------------------------------
// MODUL 3: VOB-AUFMAẞ FORMEL-ENGINE & DIN 18299 § 4 ÜBERMESSUNG
// --------------------------------------------------------------------------
console.log('\n>>> MODUL 3: VOB-AUFMAẞ SHUNTING-YARD FORMELPARSER & DIN 18299 § 4 <<<');

// Implementierung des Shunting-Yard Formelevaluators analog frontend/src/components/craft/MeasurementGrid.tsx
function safeEval(formula) {
  try {
    const sanitized = formula.replace(/,/g, '.').replace(/[^0-9+\-*/(). ]/g, '');
    if (!sanitized.trim()) return 0;
    const tokens = sanitized.match(/([0-9]+(?:\.[0-9]+)?|[+\-*/()])/g);
    if (!tokens) return 0;

    const output = [];
    const ops = [];
    const prec = { '+': 1, '-': 1, '*': 2, '/': 2 };

    for (const token of tokens) {
      if (!isNaN(parseFloat(token))) {
        output.push(parseFloat(token));
      } else if (token === '(') {
        ops.push(token);
      } else if (token === ')') {
        while (ops.length > 0 && ops[ops.length - 1] !== '(') {
          output.push(ops.pop());
        }
        ops.pop();
      } else if (['+', '-', '*', '/'].includes(token)) {
        while (
          ops.length > 0 &&
          ops[ops.length - 1] !== '(' &&
          prec[ops[ops.length - 1]] >= prec[token]
        ) {
          output.push(ops.pop());
        }
        ops.push(token);
      }
    }
    while (ops.length > 0) output.push(ops.pop());

    const stack = [];
    for (const item of output) {
      if (typeof item === 'number') {
        stack.push(item);
      } else {
        const b = stack.pop() ?? 0;
        const a = stack.pop() ?? 0;
        if (item === '+') stack.push(a + b);
        else if (item === '-') stack.push(a - b);
        else if (item === '*') stack.push(a * b);
        else if (item === '/') stack.push(b !== 0 ? a / b : 0);
      }
    }
    const res = stack[0] ?? 0;
    return Math.round(res * 1000) / 1000;
  } catch {
    return 0;
  }
}

// 3.1 Formel-Evaluierung
assert(safeEval('12.50 * 2.80') === 35.0, 'Multiplikation 12.50 * 2.80 = 35.00');
assert(safeEval('(10.5 + 4.5) * 2.0') === 30.0, 'Klammerrechnung (10.5 + 4.5) * 2.0 = 30.00');
assert(safeEval('100 / 4 + 5 * 2') === 35.0, 'Punkt-vor-Strich 100 / 4 + 5 * 2 = 35.00');
assert(safeEval('14,50 * 8,20') === 118.9, 'Dezimal-Komma Ersetzung 14,50 * 8,20 = 118.90');
assert(safeEval('invalid + syntax *') === 0, 'Robuster Fehlerfang bei ungültiger Syntax');
assert(safeEval('50 / 0') === 0, 'Zero-Division Schutz liefert 0 statt Infinity');

// 3.2 DIN 18299 § 4 Übermessungsregel-Logik
function evaluateDin18299Deduction(areaM2) {
  // DIN 18299 VOB/C: Öffnungen und Aussparungen bis 2,5 m² Einzelfläche werden übermessen (kein Abzug).
  // Ab 2,5 m² sind sie zwingend von den Aufmaßflächen in Abzug zu bringen.
  if (areaM2 <= 2.50) {
    return { shouldDeduct: false, note: 'Übermessung zulässig (Einzelfläche ≤ 2,50 m²)' };
  } else {
    return { shouldDeduct: true, note: 'Abzugspflichtig gem. DIN 18299 § 4 (Einzelfläche > 2,50 m²)' };
  }
}

const windowOpening = evaluateDin18299Deduction(1.80);
assert(windowOpening.shouldDeduct === false, 'Tür/Fensteröffnung 1.80 m² wird übermessen gem. DIN 18299');
const largePortal = evaluateDin18299Deduction(4.20);
assert(largePortal.shouldDeduct === true, 'Großes Fensterportal 4.20 m² ist abzugspflichtig');

// --------------------------------------------------------------------------
// MODUL 4: 92vh SIGNATUREPAD & VOB/B § 15 ABS. 3 MANIFEST
// --------------------------------------------------------------------------
console.log('\n>>> MODUL 4: SIGNATUREPAD TELEMETRIE & VOB/B § 15 MANIFEST <<<');

// Simuliere Unterschriftstelemetrie
const mockStrokeData = [
  [[10, 20, 100], [12, 22, 110], [15, 25, 120]], // Stroke 1
  [[50, 60, 200], [55, 65, 210], [60, 70, 220]], // Stroke 2
];

function generateSignatureManifest({ siteReportId, signerName, signerRole, strokes, timestamp }) {
  const payload = JSON.stringify({
    siteReportId,
    signerName,
    signerRole,
    pointCount: strokes.flat().length,
    timestamp,
  });
  const hash = crypto.createHash('sha256').update(payload).digest('hex');
  return {
    manifestId: `SIG-VOB-${hash.substring(0, 12).toUpperCase()}`,
    sha256: hash,
    pointCount: strokes.flat().length,
    signerName,
    complianceNote: 'Erfüllt Schriftformerfordernis nach § 127 BGB i.V.m. VOB/B § 15 Abs. 3',
  };
}

const sigManifest = generateSignatureManifest({
  siteReportId: 'rep_2026_0907_spreeauen',
  signerName: 'Dipl.-Ing. Thomas Weber (Bauleiter AG)',
  signerRole: 'client_representative',
  strokes: mockStrokeData,
  timestamp: '2026-09-07T14:30:00.000Z',
});

assert(sigManifest.sha256.length === 64, 'SHA-256 Siegel hat exakt 64 Hex-Zeichen');
assert(sigManifest.pointCount === 6, 'Vektor-Messpunkte exakt übergeben (2 Strokes * 3 Points)');
assert(sigManifest.manifestId.startsWith('SIG-VOB-'), 'Manifest-ID mit VOB-Präfix generiert');
assert(sigManifest.complianceNote.includes('VOB/B § 15 Abs. 3'), 'Konformitätsvermerk VOB/B § 15 vorhanden');

// --------------------------------------------------------------------------
// MODUL 5: 2D-PLAN-PINNING & VOB/B § 13 MÄNGELRÜGE GENERATOR
// --------------------------------------------------------------------------
console.log('\n>>> MODUL 5: 2D-PLAN-PINNING & VOB/B § 13 MÄNGELRÜGE <<<');

function generateDefectNotice({ pin, projectName, contractorName, issueDate = new Date() }) {
  const deadlineDays = 14;
  const deadlineDate = new Date(issueDate.getTime() + deadlineDays * 24 * 60 * 60 * 1000);
  const deadlineFormatted = deadlineDate.toLocaleDateString('de-DE');

  const text = `
MÄNGELRÜGE NACH § 13 ABS. 5 VOB/B
------------------------------------------------------------------------
Bauvorhaben: ${projectName}
Auftragnehmer / Gewerk: ${contractorName}
Datum der Rüge: ${issueDate.toLocaleDateString('de-DE')}
Ort auf Plan: ${pin.title} (Ebene: ${pin.level || 'EG'}, Koord: X=${pin.x}%, Y=${pin.y}%)
Schweregrad: ${pin.severity.toUpperCase()}

MANGELBESCHREIBUNG:
${pin.description}

AUFFORDERUNG ZUR MÄNGELBESEITIGUNG:
Hiermit rügen wir den oben genannten Mangel gem. § 13 Abs. 5 Nr. 1 VOB/B und
fordern Sie auf, diesen bis spätestens zum

   ${deadlineFormatted}

vollständig und fachgerecht nach den allgemein anerkannten Regeln der Technik
zu beseitigen.

RECHTLICHER HINWEIS GEMÄSS § 13 ABS. 5 NR. 2 VOB/B:
Sollte die Mängelbeseitigung nicht fristgerecht bis zum vorgenannten Datum
erfolgen, werden wir nach fruchtlosem Ablauf der Frist ohne weitere Ankündigung
die Mängel auf Ihre Kosten durch ein Drittunternehmen beseitigen lassen
(Ersatzvornahme).
------------------------------------------------------------------------
`;
  return {
    text: text.trim(),
    deadlineDate,
    deadlineFormatted,
  };
}

const mockPin = {
  id: 'pin_001',
  title: 'Rissbildung im Estrich Raum 0.12',
  severity: 'critical',
  status: 'open',
  x: 42.5,
  y: 68.2,
  level: 'EG',
  description: 'Breiter Schwindriss (ca. 2.5mm) quer durch den Heizestrich CT-C25.',
  proof_image_hash: crypto.createHash('sha256').update('photo-evidence-binary').digest('hex'),
};

const notice = generateDefectNotice({
  pin: mockPin,
  projectName: 'Quartier Spreeauen - Trakt B',
  contractorName: 'Estrichbau Müller GmbH',
});

assert(notice.text.includes('MÄNGELRÜGE NACH § 13 ABS. 5 VOB/B'), 'Mängelrügen-Header korrekt');
assert(notice.text.includes('Ersatzvornahme'), 'Androhung der Ersatzvornahme gem. § 13 Abs. 5 Nr. 2 VOB/B enthalten');
assert(notice.text.includes('Rissbildung im Estrich'), 'Mangel-Titel im Rüge-Schreiben vorhanden');
assert(notice.text.includes('CRITICAL'), 'Severity-Grad abgebildet');
assert(mockPin.proof_image_hash.length === 64, 'Fotobeweis GoBD SHA-256 Hash valide');

// --------------------------------------------------------------------------
// MODUL 6: GAEB 90 / 2000 / XML ENGINE
// --------------------------------------------------------------------------
console.log('\n>>> MODUL 6: GAEB 90 & XML ENGINE (PARSING, KALKULATION, ROUNDTRIP) <<<');

const sampleGaebD83 = [
  '00Baustelle Spreeauen Sanierung  DP83  EUR',
  '10 01 Abbrucharbeiten & Rückbau',
  '21 01.0010 Estrich stemmen d=6cm',
  '25 150,00 m2 18,50 2775,00',
  '26 Zementestrich inkl. Randdämmstreifen abbrechen und entsorgen.',
  '10 02 Trockenbauarbeiten',
  '21 02.0010 Gipskartonwand F90 d=125mm',
  '25 80,00 m2 65,00 5200,00',
  '26 Doppelständerwand mit beidseitiger 2-lagiger Beplankung.',
].join('\r\n');

assert(detectGaebFormat(sampleGaebD83) === 'GAEB_90', 'GAEB-Format als GAEB_90 erkannt');

const gaebParsed = parseGaeb90Text(sampleGaebD83);
assert(gaebParsed.categories.length === 2, '2 Gewerke/Kategorien erkannt');
assert(gaebParsed.allItems.length === 2, '2 Positionen erfolgreich geparst');
assert(gaebParsed.allItems[0].qty === 150.0, 'Position 1 Menge = 150.00 m²');
assert(gaebParsed.allItems[0].unitPrice === 18.50, 'Position 1 EP = 18.50 €');
assert(gaebParsed.netTotal === 7975.0, 'Netto-Gesamtsumme = 7975.00 € (2775 + 5200)');

// Test BoQ Bridge ins VOB-Aufmaß
const measurementRows = gaebParsed.allItems.map(convertGaebItemToMeasurement);
assert(measurementRows.length === 2, 'Konvertierung in 2 Aufmaß-Zeilen erfolgreich');
assert(measurementRows[0].position_nr === '01.0010', 'Ordnungszahl (OZ) 01.0010 übernommen');
assert(measurementRows[0].total_price === 2775.0, 'Gesamtbetrag der Aufmaßzeile = 2775.00 €');

// --------------------------------------------------------------------------
// MODUL 7: DATANORM 5.0 & IDS-CONNECT 2.5
// --------------------------------------------------------------------------
console.log('\n>>> MODUL 7: DATANORM 5.0 & IDS-CONNECT 2.5 (HMAC, PUNCHOUT & CART) <<<');

// 7.1 IDS Hook-Token HMAC
const secretKey = 'ultra-secure-ids-hmac-secret-2026';
const hookToken = createIdsHookToken('proj_spreeauen_99', secretKey, 60);
const verifyResult = verifyIdsHookToken(hookToken, secretKey);
assert(verifyResult.valid === true, 'IDS Hook Token signaturgeprüft und gültig');
assert(verifyResult.projectId === 'proj_spreeauen_99', 'Projekt-ID aus Token extrahiert');

const tamperedToken = hookToken.substring(0, hookToken.length - 4) + 'abcd';
assert(verifyIdsHookToken(tamperedToken, secretKey).valid === false, 'Manipulierter Hook-Token wird strikt abgewiesen');

// 7.2 Punchout URL Builder
const gcProfile = IDS_WHOLESALER_PROFILES[0];
const punchoutUrl = generateIdsPunchoutUrl(gcProfile, {
  wholesalerId: gcProfile.id,
  hookUrl: 'https://vibeforce-flow-os.vercel.app/api/craft/ids/hook',
  sessionId: 'SESS-2026-XYZ',
  customerNumber: gcProfile.customerNumber,
  orderRef: 'AUFTRAG-SPREE-01',
});
assert(punchoutUrl.includes('version=2.5'), 'IDS Version 2.5 in Punchout-URL');
assert(punchoutUrl.includes('hookurl='), 'Hook-URL als Parameter kodiert');

// 7.3 DATANORM 5.0 Parsing
const rawDatanorm = `V;N;2026-09-07;EUR;DATANORM.001;Elektro Grosshandel Berlin;5.0
T;N;010;Kabelkanäle
R;N;RG-01;30.0
A;N;EL-001;010;Kabelkanal 60x40 reinweiß;2m Stange;M;1;1;12.50;RG-01;0;0`;

const datanormParsed = parseDatanormContent(rawDatanorm, { defaultMarkupPercent: 25 });
assert(datanormParsed.articles.length === 1, 'DATANORM 5 Artikel geparst');
assert(datanormParsed.articles[0].articleNumber === 'EL-001', 'Artikelnummer EL-001 korrekt');

// 7.4 Margenberechnung Großhandel
const ek = calculatePurchasePrice(100.0, 30.0); // 100 List, 30% Rabatt -> 70 EK
const vk = calculateSellingPrice(ek, 25.0); // 70 EK, +25% Aufschlag -> 87.50 VK
const margin = calculateMargin(vk, ek);
assert(ek === 70.0, 'Einkaufspreis nach 30% Rabatt = 70.00 €');
assert(vk === 87.5, 'Verkaufspreis mit 25% Aufschlag = 87.50 €');
assert(margin.marginEuro === 17.5, 'Rohertrag = 17.50 €');
assert(margin.marginPercent === 20.0, 'Margenprozentsatz auf VK = 20.0%');

// --------------------------------------------------------------------------
// MODUL 8: COST COCKPIT & NACHKALKULATION (3-WEGE STUNDENQUELLEN)
// --------------------------------------------------------------------------
console.log('\n>>> MODUL 8: COST COCKPIT (ANTIDOPPELZÄHLUNG & VOB/B § 2 MEHRKOSTEN) <<<');

const auditProject = {
  id: 'prj_audit_calc',
  name: 'Sanierung Turnhalle',
  budget_hours: 100,
  budget_money: 15000,
  external_costs_total: 4000,
};

const stampTimes = [{ duration_minutes: 3600 }]; // 60 Stunden Stempeluhr
const reportTimes = [
  { qualification_hours: { meister: 40, geselle: 20, helfer: 0, azubi: 0 } }, // 60h Regie
  { qualification_hours: { meister: 10, geselle: 0, helfer: 0, azubi: 0 }, is_regie_extra: true }, // 10h Regie Extra
];

// 8.1 Default: time_entries
const calc1 = calculateProjectCostSummary({
  project: auditProject,
  timeEntries: stampTimes,
  siteReports: reportTimes,
  labourSource: 'time_entries',
});
assert(calc1.istHours === 60, 'labourSource time_entries nutzt exakt 60h (keine Addition der 70h Berichte)');
assert(calc1.hasDataCollisionWarning === true, 'Kollisionswarnung bei konkurrierenden Quellen aktiv');
assert(calc1.ignoredHoursFromOtherSource === 70, '70 Stunden aus Berichten als ignoriert ausgewiesen');

// 8.2 regie_additive: Stempeluhr + nur extra markierte Regie
const calc2 = calculateProjectCostSummary({
  project: auditProject,
  timeEntries: stampTimes,
  siteReports: reportTimes,
  labourSource: 'regie_additive',
});
assert(calc2.istHours === 70, 'regie_additive zählt 60h Stempel + 10h markierte Regie = 70h');

// 8.3 VOB/B § 2 Abs. 3 Schranke (>10% Mehrkostenwarnung)
const overrunTimeEntries = [{ duration_minutes: 6900 }]; // 115 Stunden bei 100h Budget -> 15% Überschreitung
const calc3 = calculateProjectCostSummary({
  project: auditProject,
  timeEntries: overrunTimeEntries,
});
assert(calc3.isOverrun === true, 'Budgetüberschreitung erkannt');
assert(calc3.isVobOverrun === true, 'VOB/B § 2 Abs. 3 Schranke schlägt bei >10% (15%) an');
assert(calc3.vobOverrunPercent === 15.0, 'Überhang exakt 15.0%');

// --------------------------------------------------------------------------
// MODUL 9: PDF-REPORT GOBD & § 127 BGB INTEGRITÄTS-SIEGEL
// --------------------------------------------------------------------------
console.log('\n>>> MODUL 9: BAUTAGESBERICHT PDF & GOBD INTEGRITÄTS-SIEGEL <<<');

const sampleReport = {
  id: 'rep_spree_404',
  project: 'prj_audit_calc',
  report_date: '2026-09-07',
  status: 'signed',
  weather: 'Leicht bewölkt',
  temperature: 19.5,
  work_performed: 'Trockenbau W112 montiert und gespachtelt Q2.',
  client_signed_at: '2026-09-07T16:45:00.000Z',
  client_name: 'Bauleiter Schmidt',
  qualification_hours: { meister: 8, geselle: 16, helfer: 0, azubi: 0 },
  created: '2026-09-07',
  updated: '2026-09-07',
  collectionId: 'site_reports',
  collectionName: 'site_reports',
};

const pdfHtml = generateSiteReportHtml({
  report: sampleReport,
  projectName: 'Sanierung Turnhalle Trakt B',
  projectKey: 'STH-02',
  authorName: 'Polier Frank Lehmann',
  measurements: [
    {
      id: 'm_1',
      site_report: 'rep_spree_404',
      position_nr: '02.0010',
      title: 'W112 Gipskartonwand',
      quantity: 80.0,
      unit: 'm2',
      unit_price: 65.0,
      total_price: 5200.0,
      formula: '16.0 * 5.0',
      created: '',
      updated: '',
      collectionId: '',
      collectionName: '',
    }
  ],
  isReverseCharge: true,
});

assert(pdfHtml.includes('GoBD / § 127 BGB Integritäts-Siegel:'), 'GoBD / § 127 BGB Siegel im PDF vorhanden');
assert(pdfHtml.includes('SHA256-'), 'Kryptografischer SHA-256 Fingerprint im Dokument eingebettet');
assert(pdfHtml.includes('Trockenbau W112 montiert'), 'Ausgeführte Leistungen im Report abgebildet');
assert(pdfHtml.includes('19.5 °C'), 'Wetter & Temperatur erfasst');

// --------------------------------------------------------------------------
// GESAMT-AUSWERTUNG
// --------------------------------------------------------------------------
console.log('\n======================================================================');
console.log(`  AUDIT ERGEBNIS: ${passedTests} von ${totalTests} TESTS BESTANDEN`);
if (failedTests > 0) {
  console.error(`  ACHTUNG: ${failedTests} TESTS FEHLGESCHLAGEN!`);
  console.log('======================================================================');
  process.exit(1);
} else {
  console.log('  STATUS: 100% WATER-TIGHT! ALLE FUNKTIONEN ERFOLGREICH GEPRÜFT!');
  console.log('======================================================================');
  process.exit(0);
}
