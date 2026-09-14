import {
  detectGaebFormat,
  parseGaeb90Text,
  parseGaeb90Bytes,
  decodeGaeb90Bytes,
  extractG90Number,
} from '../frontend/src/lib/gaeb.ts';

let passed = 0;
let failed = 0;

function check(label, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) {
    passed += 1;
    console.log(`  PASS  ${label}`);
  } else {
    failed += 1;
    console.error(`  FAIL  ${label}\n        expected: ${JSON.stringify(expected)}\n        actual:   ${JSON.stringify(actual)}`);
  }
}

// --- Moji-Bake-Platzhalter (DOS CP850-Bytes als Windows-1252/Latin-1 falsch dekodiert) ---
const AE = '\u201E';   // 0x84 -> ä
const OE = '\u201D';   // 0x94 -> ö
const UE = '\u0081';   // 0x81 -> ü (Latin-1 Steuerzeichen)
const SS = '\u00E1';   // 0xE1 -> ß
const AE_BIG = '\u017D'; // 0x8E -> Ä
const OE_BIG = '\u2122'; // 0x99 -> Ö

console.log('\n=== TEST 1: detectGaebFormat ===');
check('empty string', detectGaebFormat(''), 'UNKNOWN');
check('whitespace + BOM only', detectGaebFormat('\uFEFF   \r\n\t '), 'UNKNOWN');
check('xml declaration', detectGaebFormat('<?xml version="1.0" encoding="UTF-8"?>\n<GAEB></GAEB>'), 'GAEB_XML');
check('gaeb root element', detectGaebFormat('\n  <GAEBInfo><Version>3.2</Version></GAEBInfo>'), 'GAEB_XML');
check('plain text', detectGaebFormat('Hallo Welt\nDies ist kein GAEB'), 'UNKNOWN');
check('d83 lines', detectGaebFormat('00Projekt\r\n10 01 Titel\r\n21 01.001 Pos\r\n25 1,00 m 5,00'), 'GAEB_90');

console.log('\n=== TEST 2: parseGaeb90Text typisches D83 (Mojibake, fehlender GP, 25 ohne 21) ===');
const d83 = [
  `00Neubau Wohnanlage S${UE}d  DP83  EUR`,
  `25 10,00 m 5,00`,
  `10 01 Baustelleneinrichtung`,
  `21 01.001 Bauzaun liefern, aufstellen und vorhalten`,
  `25 85,00 m 12,50 1.062,50`,
  `26 ${AE}tzliche Anpassung inkl. Betonf${UE}${SS}e und Verbindungsschellen`,
  `21 02.002 Baugrube ausheben, Boden lagern`,
  `25 240,00 m3 28,50`,
  `10 02 Ausbauarbeiten`,
  `10 01 Estricharbeiten`,
  `21 02.01.001 Zementestrich CT-C25-F4`,
  `25 100,00 m2 25,50`,
  `21 Position ohne Ordnungszahl`,
].join('\r\n');

check('format detected', detectGaebFormat(d83), 'GAEB_90');
const boq = parseGaeb90Text(d83);

check('dp', boq.dp, '83');
check('currency', boq.currency, 'EUR');
check('projectName (Mojibake aufgelöst)', boq.projectName, 'Neubau Wohnanlage Süd');
check('item count', boq.allItems.length, 4);
check('categories', boq.categories.map((c) => c.label), ['Baustelleneinrichtung', 'Ausbauarbeiten']);
check('subcategories', boq.categories[1]?.subcategories.map((c) => c.label) ?? [], ['Estricharbeiten']);

const item1 = boq.allItems[0];
check('item1 oz', item1.oz, '01.001');
check('item1 rNoPart', item1.rNoPart, '001');
check('item1 qty/ep/gp', [item1.qty, item1.unitPrice, item1.totalPrice], [85, 12.5, 1062.5]);
check('item1 unit', item1.qu, 'm');
check('item1 categoryPath', item1.categoryPath, ['Baustelleneinrichtung']);
check('item1 longText (Mojibake aufgelöst)', item1.longText, 'ätzliche Anpassung inkl. Betonfüße und Verbindungsschellen');

const item2 = boq.allItems[1];
check('item2 gp berechnet (fehlender GP)', item2.totalPrice, 6840);
check('item2 unit m3', item2.qu, 'm3');

const item3 = boq.allItems[2];
check('item3 oz', item3.oz, '02.01.001');
check('item3 gp', item3.totalPrice, 2550);
check('item3 categoryPath (verschachtelt)', item3.categoryPath, ['Ausbauarbeiten', 'Estricharbeiten']);

const item4 = boq.allItems[3];
check('item4 auto-oz (fehlende OZ)', item4.oz, '0001');
check('item4 shortText', item4.shortText, 'Position ohne Ordnungszahl');

check('category totals', boq.categories.map((c) => c.totalPrice), [7902.5, 2550]);
check('netTotal', boq.netTotal, 10452.5);
check('taxAmount', boq.taxAmount, 1985.98);
check('grossTotal', boq.grossTotal, 12438.48);
check('taxRate', boq.taxRate, 0.19);

console.log('\n=== TEST 3: parseGaeb90Text Randfälle (leer, DM, DP84) ===');
const emptyBoq = parseGaeb90Text('');
check('empty: no crash, empty categories', [emptyBoq.categories.length, emptyBoq.allItems.length], [0, 0]);
check('empty: zero sums', [emptyBoq.netTotal, emptyBoq.taxAmount, emptyBoq.grossTotal], [0, 0, 0]);
check('empty: defaults', [emptyBoq.dp, emptyBoq.currency, emptyBoq.projectName], ['83', 'EUR', 'Unbenanntes Bauprojekt']);

const dmBoq = parseGaeb90Text(`00Sanierung Turnhalle DP84 DM\r\n10 01 Malerarbeiten\r\n21 01.001 Wand streichen\r\n26 ${AE}lteste Farbe entfernen, 2 Anstriche\r\n25 1.250,50 m2 14,75`);
check('DM tolerated', dmBoq.currency, 'DM');
check('DP84 detected', dmBoq.dp, '84');
check('DM file netTotal', dmBoq.netTotal, 18444.88); // round2(1250.5 * 14.75) = round2(18444.875)
check('DM file projectName', dmBoq.projectName, 'Sanierung Turnhalle');

const garbage = parseGaeb90Text('kein gaeb\nirgendein text\n123456');
check('garbage: no crash', [garbage.categories.length, garbage.allItems.length, garbage.netTotal], [0, 0, 0]);

console.log('\n=== TEST 4: B8 Feldsemantische Zahlenparsung (extractG90Number) ===');
check('B8: 85.000 als quantity ist 85 (nicht 85000!)', extractG90Number('85.000', 'quantity'), 85);
check('B8: 1.500 als quantity ist 1.5', extractG90Number('1.500', 'quantity'), 1.5);
check('B8: 85,000 als quantity ist 85', extractG90Number('85,000', 'quantity'), 85);
check('B8: 1.062,50 als price ist 1062.50', extractG90Number('1.062,50', 'price'), 1062.5);
check('B8: 12,50 als price ist 12.50', extractG90Number('12,50', 'price'), 12.5);
check('B8: 12.50 als price ist 12.50', extractG90Number('12.50', 'price'), 12.5);
check('B8: 1.234.567 als price ist 1234567', extractG90Number('1.234.567', 'price'), 1234567);
check('B8: 1.250 als price ohne Komma ist 1250 (Tausender)', extractG90Number('1.250', 'price'), 1250);

console.log('\n=== TEST 5: B6 Schutz von modernem UTF-8 (keine Zerstörung typografischer Zeichen) ===');
const utf8Modern = [
  '00Wohnanlage "Am Park" EUR',
  '10 01 Fensterarbeiten',
  '21 01.001 Fenster „Holz-Alu” Premium™ mit Wärmeschutzglas',
  '25 85.000 Stk 450.00',
].join('\r\n');
const parsedUtf8 = parseGaeb90Text(utf8Modern);
check('B6: Typografische deutsche Anführungszeichen „...“ und ™ bleiben unversehrt',
  parsedUtf8.allItems[0]?.shortText.includes('„Holz-Alu” Premium™'), true);
check('B6: Menge 85.000 Stk wird exakt als 85 geparst', parsedUtf8.allItems[0]?.qty, 85);

console.log('\n=== TEST 6: B7 Byte-Decoder parseGaeb90Bytes (DOS CP437/CP850 verlustfrei) ===');
// Simuliere echte DOS-Bytes für Umlaute (0x84=ä, 0x94=ö, 0x81=ü, 0x8E=Ä, 0x99=Ö, 0x9A=Ü, 0xE1=ß)
// "21 01.001 Tür & Tor für Außenbereich" in CP437
const dosLineHeader = new TextEncoder().encode('00DOS Projekt EUR\r\n10 01 Rohbau\r\n21 01.001 ');
const dosUmlautBytes = new Uint8Array([
  0x54, 0x81, 0x72, // T, ü, r
  0x20, 0x26, 0x20, // " & "
  0x54, 0x94, 0x72, 0x65, // T, ö, r, e
  0x20, 0x66, 0x81, 0x72, // " f", ü, "r"
  0x20, 0x41, 0x8E, 0x65, 0x6E, 0x66, 0x6C, 0x84, 0x63, 0x68, 0x65, // " A", Ä, "enfl", ä, "che"
  0x20, 0x6D, 0x69, 0x74, 0x20, 0x53, 0x70, 0x61, 0x6E, 0x67, 0x65, 0x6E, 0x20,
  0x53, 0x74, 0x72, 0x61, 0xE1, 0x65, // "Stra", ß, "e"
  0x0D, 0x0A,
  0x32, 0x35, 0x20, 0x31, 0x30, 0x2E, 0x30, 0x30, 0x30, 0x20, 0x53, 0x74, 0x6B, 0x20, 0x35, 0x30, 0x2E, 0x30, 0x30, // 25 10.000 Stk 50.00
  0x0D, 0x0A
]);
const fullDosBytes = new Uint8Array(dosLineHeader.length + dosUmlautBytes.length);
fullDosBytes.set(dosLineHeader, 0);
fullDosBytes.set(dosUmlautBytes, dosLineHeader.length);

const dosBoq = parseGaeb90Bytes(fullDosBytes);
check('B7: Byte-Pfad decodiert CP437 Umlaute (ü, ö, Ä, ä, ß) verlustfrei',
  dosBoq.allItems[0]?.shortText.includes('Tür & Töre für AÄenfläche mit Spangen Straße'), true);
check('B7: Kein U+FFFD (Replacement Character) im Byte-Pfad',
  dosBoq.allItems[0]?.shortText.includes('\uFFFD'), false);

console.log('\n=== TEST 7: B9 Unbekannte/fehlende Einheit defaultet auf Stk ===');
const missingUnitD83 = [
  '00Projekt DP83 EUR',
  '10 01 Gewerk',
  '21 01.001 Leistung ohne Mengeneinheit',
  '25 25.00 10.00 250.00',
].join('\r\n');
const missingUnitBoq = parseGaeb90Text(missingUnitD83);
check('B9: Fehlende Einheit wird zu Stk (nicht leer)', missingUnitBoq.allItems[0]?.qu, 'Stk');

console.log(`\n=== ERGEBNIS: ${passed} PASS, ${failed} FAIL ===`);
if (failed > 0) {
  process.exit(1);
} else {
  console.log('✅ ALLE GAEB-90 SMOKE TESTS BESTANDEN');
}
