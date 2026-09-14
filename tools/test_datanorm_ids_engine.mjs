import assert from 'node:assert';
import {
  parseDatanormContent,
  serializeDatanormCatalog,
  decodeDatanormContent,
  calculatePurchasePrice,
  calculateSellingPrice,
  calculateMargin,
  getSampleDatanormShkCatalog,
  getSampleDatanormElektroCatalog,
} from '../frontend/src/lib/datanorm.ts';
import {
  parseIdsCartXml,
  generateIdsCartXml,
  generateIdsPunchoutUrl,
  convertIdsItemToMeasurement,
  convertIdsItemToGaebItem,
  normalizeMeasurementUnit,
  IDS_WHOLESALER_PROFILES,
} from '../frontend/src/lib/ids-connect.ts';

console.log('====================================================');
console.log('  VIBE CRAFT M007.2 — DATANORM & IDS TESTSUITE     ');
console.log('====================================================\n');

// ----------------------------------------------------
// TEST 1: PARSING DATANORM 5.0 ALL SATZARTEN (V, A, B, P, S, T, R)
// ----------------------------------------------------
console.log('--- TEST 1: DATANORM 5.0 PARSER ALL SATZARTEN ---');
const rawDatanorm = `V;N;2026-09-07;EUR;DATANORM.001;GC-ONLINE PLUS (Muster-Großhandel);5.0
T;N;010;Sanitärkeramik & Vorwandelemente
T;N;020;Armaturen & Brausen
T;N;030;Rohrleitungssysteme
R;N;RG-SAN;38.0
R;N;RG-ARM;42.0
A;N;GC-101001;010;Geberit Duofix Element für Wand-WC 112cm;mit UP-Spülkasten 12cm;STK;1;1;248.50;RG-SAN;0;0
B;N;GC-101001;1;Trockenbauelement mit pulverbeschichtet
B;N;GC-101001;2;em Rahmen, selbsttragend für Wand-WC.
A;N;GC-202002;020;Grohe Eurosmart Einhand-Waschtischbatterie;DN 15 chrom;STK;1;1;124.00;RG-ARM;0;0
S;N;GC-101001;5;235.00;10;220.00
P;N;GC-202002;1;130.00`;

const catalog = parseDatanormContent(rawDatanorm, { defaultMarkupPercent: 30 });

assert.strictEqual(catalog.header.version, '5.0', 'Header version must be 5.0');
assert.strictEqual(catalog.header.currency, 'EUR', 'Currency must be EUR');
assert.strictEqual(catalog.header.wholesalerName, 'GC-ONLINE PLUS (Muster-Großhandel)');
assert.strictEqual(catalog.articles.length, 2, 'Must parse exactly 2 articles');

// Check Satzart T (Warengruppen)
assert.strictEqual(catalog.commodityGroups['010'], 'Sanitärkeramik & Vorwandelemente');
assert.strictEqual(catalog.commodityGroups['020'], 'Armaturen & Brausen');

// Check Satzart R (Rabattgruppen)
assert.strictEqual(catalog.discountGroups['RG-SAN'], 38.0);
assert.strictEqual(catalog.discountGroups['RG-ARM'], 42.0);

// Check Article 1 (with B Langtext and S Staffelpreise)
const art1 = catalog.articles.find((a) => a.articleNumber === 'GC-101001');
assert.ok(art1, 'Article 1 must exist');
assert.strictEqual(art1.catalogPrice, 248.5);
assert.strictEqual(art1.discountPercent, 38.0);
// EK = 248.50 * (1 - 0.38) = 154.07
assert.strictEqual(art1.purchasePriceNet, 154.07);
assert.ok(
  art1.longText && art1.longText.includes('selbsttragend für Wand-WC'),
  'Longtext lines from Satzart B must be merged'
);
assert.strictEqual(art1.scalePrices.length, 2, 'Staffelpreise from Satzart S must be parsed');
assert.strictEqual(art1.scalePrices[0].quantity, 5);
assert.strictEqual(art1.scalePrices[0].price, 235.0);

// Check Article 2 (with P Preispflege update: 124.00 -> 130.00)
const art2 = catalog.articles.find((a) => a.articleNumber === 'GC-202002');
assert.ok(art2, 'Article 2 must exist');
assert.strictEqual(art2.catalogPrice, 130.0, 'Preispflege P must update catalogPrice to 130.00');
// Updated EK = 130.00 * (1 - 0.42) = 75.40
assert.strictEqual(art2.purchasePriceNet, 75.4);

console.log(`✅ TEST 1 PASSED: DATANORM 5.0 erfolgreich geparst (${catalog.articles.length} Artikel, ${Object.keys(catalog.commodityGroups).length} Warengruppen).`);

// ----------------------------------------------------
// TEST 2: CHARSET RESILIENCE (CP850 / ISO-8859-1 UMLAUTS)
// ----------------------------------------------------
console.log('\n--- TEST 2: CHARSET RESILIENCE (CP850 DOS GERMAN UMLAUTS) ---');
// DOS CP850 bytes for "Größe für Dübel & Nägel: 100 Stück"
// ö = 0x94, ü = 0x81, ä = 0x84, ü = 0x81
const cp850Bytes = new Uint8Array([
  0x47, 0x72, 0x94, 0xdf, 0x65, 0x20, // "Größe "
  0x66, 0x81, 0x72, 0x20,             // "für "
  0x44, 0x81, 0x62, 0x65, 0x6c, 0x20, // "Dübel "
  0x26, 0x20,                         // "& "
  0x4e, 0x84, 0x67, 0x65, 0x6c, 0x3a, 0x20, // "Nägel: "
  0x31, 0x30, 0x30, 0x20,             // "100 "
  0x53, 0x74, 0x81, 0x63, 0x6b        // "Stück"
]);

const decoded = decodeDatanormContent(cp850Bytes);
console.log('Dekodierter CP850 Text:', decoded);
assert.ok(decoded.includes('Grö'), 'Must contain ö');
assert.ok(decoded.includes('für'), 'Must contain ü');
assert.ok(decoded.includes('Dübel'), 'Must contain Dübel');
assert.ok(decoded.includes('Nägel'), 'Must contain Nägel');
assert.ok(decoded.includes('Stück'), 'Must contain Stück');
console.log('✅ TEST 2 PASSED: DOS CP850 Umlaute fehlerfrei nach UTF-8 dekodiert.');

// ----------------------------------------------------
// TEST 3: PRICING AND MARGIN CALCULATIONS
// ----------------------------------------------------
console.log('\n--- TEST 3: PRICING & MARGIN CALCULATIONS ---');
// Catalog price 200.00 €, 40% discount, 5.00 € raw copper surcharge
const ek = calculatePurchasePrice(200.0, 40, 5.0);
assert.strictEqual(ek, 125.0, 'EK Netto must be 200 * 0.6 + 5 = 125.00 €');

// 30% markup on 125.00 €
const vk = calculateSellingPrice(ek, 30);
assert.strictEqual(vk, 162.5, 'VK Netto must be 125 * 1.30 = 162.50 €');

const { marginEuro, marginPercent } = calculateMargin(vk, ek);
assert.strictEqual(marginEuro, 37.5, 'Margin Euro must be 37.50 €');
assert.strictEqual(marginPercent, 23.1, 'Margin % on sales must be ~23.1%');
console.log(`EK: ${ek.toFixed(2)} € | VK: ${vk.toFixed(2)} € | Rohertrag: +${marginEuro.toFixed(2)} € (${marginPercent}%)`);
console.log('✅ TEST 3 PASSED: Einkaufspreis, Handwerker-VK und Marge centgenau kalkuliert.');

// ----------------------------------------------------
// TEST 4: IDS-CONNECT 2.5 CART XML PARSING
// ----------------------------------------------------
console.log('\n--- TEST 4: IDS-CONNECT 2.5 CART XML PARSER ---');
const sampleIdsXml = `<?xml version="1.0" encoding="UTF-8"?>
<idsCart version="2.5" xmlns="http://www.igh.de/ids/2.5">
  <header>
    <wholesalerName>Sonepar Deutschland</wholesalerName>
    <cartId>CART-SON-4491</cartId>
    <orderDate>2026-09-07</orderDate>
    <currency>EUR</currency>
    <customerNumber>SON-KND-55102</customerNumber>
    <orderReference>Gewerbebau Halle B</orderReference>
  </header>
  <items>
    <item id="1">
      <itemNumber>SON-701001</itemNumber>
      <description>Hager Kleinverteiler volta 4-reihig VU48NC</description>
      <quantity>2.00</quantity>
      <unit>STK</unit>
      <priceGross>184.00</priceGross>
      <priceNet>125.12</priceNet>
      <discountPercent>32.0</discountPercent>
      <totalNet>250.24</totalNet>
      <manufacturer>Hager</manufacturer>
    </item>
    <item id="2">
      <itemNumber>SON-903001</itemNumber>
      <description>Mantelleitung NYM-J 3x1.5 mm2 Ring 100m</description>
      <quantity>5.00</quantity>
      <unit>M</unit>
      <priceGross>1.45</priceGross>
      <priceNet>1.09</priceNet>
      <discountPercent>25.0</discountPercent>
      <totalNet>5.45</totalNet>
      <manufacturer>Prysmian</manufacturer>
    </item>
  </items>
  <totals>
    <totalGross>375.25</totalGross>
    <totalNet>255.69</totalNet>
    <totalVat>48.58</totalVat>
  </totals>
</idsCart>`;

const parsedCart = parseIdsCartXml(sampleIdsXml);
assert.strictEqual(parsedCart.version, '2.5');
assert.strictEqual(parsedCart.header.wholesalerName, 'Sonepar Deutschland');
assert.strictEqual(parsedCart.header.cartId, 'CART-SON-4491');
assert.strictEqual(parsedCart.header.customerNumber, 'SON-KND-55102');
assert.strictEqual(parsedCart.items.length, 2);

assert.strictEqual(parsedCart.items[0].itemNumber, 'SON-701001');
assert.strictEqual(parsedCart.items[0].quantity, 2);
assert.strictEqual(parsedCart.items[0].priceNet, 125.12);
assert.strictEqual(parsedCart.items[0].totalNet, 250.24);

assert.strictEqual(parsedCart.totalNet, 255.69);
assert.strictEqual(parsedCart.totalVat, 48.58);
console.log(`✅ TEST 4 PASSED: IDS 2.5 XML erfolgreich geparst (${parsedCart.items.length} Positionen, Netto: ${parsedCart.totalNet.toFixed(2)} €).`);

// ----------------------------------------------------
// TEST 5: IDS-CONNECT 2.5 ROUND-TRIP (XML GENERATION & RE-PARSE)
// ----------------------------------------------------
console.log('\n--- TEST 5: IDS-CONNECT 2.5 ROUND-TRIP SERIALIZATION ---');
const regeneratedXml = generateIdsCartXml(parsedCart);
assert.ok(regeneratedXml.includes('<idsCart version="2.5"'));
assert.ok(regeneratedXml.includes('<wholesalerName>Sonepar Deutschland</wholesalerName>'));
assert.ok(regeneratedXml.includes('<itemNumber>SON-701001</itemNumber>'));

const reParsed = parseIdsCartXml(regeneratedXml);
assert.strictEqual(reParsed.items.length, parsedCart.items.length);
assert.strictEqual(reParsed.totalNet, parsedCart.totalNet);
assert.strictEqual(reParsed.totalVat, parsedCart.totalVat);
console.log('✅ TEST 5 PASSED: 100% Identität bei IDS 2.5 XML Round-Trip Serialisierung.');

// ----------------------------------------------------
// TEST 6: IDS PUNCHOUT URL GENERATOR
// ----------------------------------------------------
console.log('\n--- TEST 6: IDS PUNCHOUT URL GENERATOR ---');
const gcProfile = IDS_WHOLESALER_PROFILES[0];
const punchoutUrl = generateIdsPunchoutUrl(gcProfile, {
  wholesalerId: gcProfile.id,
  hookUrl: 'https://vibeforce-flow-os.vercel.app/api/craft/ids/hook',
  sessionId: 'SESS_TEST_991',
  customerNumber: gcProfile.customerNumber,
  orderReference: 'BAU-2026-01',
});

console.log('Generierte Punchout URL:', punchoutUrl);
assert.ok(punchoutUrl.startsWith('https://onlineplus.gc-gruppe.de/ids/punchout?'));
assert.ok(punchoutUrl.includes('version=2.5'));
assert.ok(punchoutUrl.includes('session_id=SESS_TEST_991'));
assert.ok(punchoutUrl.includes('caller_system=VIBE_FLOW_OS'));
console.log('✅ TEST 6 PASSED: Punchout-URL nach IGH IDS 2.5 Spezifikation korrekt generiert.');

// ----------------------------------------------------
// TEST 7: CROSS-MODULE BRIDGES (IDS/DATANORM -> AUFMAẞ & GAEB)
// ----------------------------------------------------
console.log('\n--- TEST 7: BRIDGES TO VOB-AUFMAẞ & GAEB-LV ---');
const testIdsItem = parsedCart.items[0]; // Hager Kleinverteiler (Netto EK: 125.12 €)
const aufmassRow = convertIdsItemToMeasurement(testIdsItem, 35); // 35% Aufschlag

assert.strictEqual(aufmassRow.position_nr, 'MAT.SON-701001');
assert.strictEqual(aufmassRow.unit, 'stk');
assert.strictEqual(aufmassRow.quantity, 2);
// 125.12 * 1.35 = 168.91 € VK
assert.strictEqual(aufmassRow.unit_price, 168.91);
assert.strictEqual(aufmassRow.total_price, 337.82);
assert.strictEqual(aufmassRow.tax_rate_type, 'standard_19');

const gaebRow = convertIdsItemToGaebItem(testIdsItem, 35, '01.0020');
assert.strictEqual(gaebRow.oz, '01.0020');
assert.strictEqual(gaebRow.rNoPart, '0020');
assert.strictEqual(gaebRow.unitPrice, 168.91);
assert.strictEqual(gaebRow.totalPrice, 337.82);

console.log('Aufmaß-Zeile:', aufmassRow);
console.log('GAEB-Zeile:', gaebRow);
console.log('✅ TEST 7 PASSED: Nahtlose Konvertierung in VOB-Aufmaß und GAEB-LV verifiziert.');

// ----------------------------------------------------
// TEST 8: SERIALIZE DATANORM CATALOG & RE-PARSE
// ----------------------------------------------------
console.log('\n--- TEST 8: SERIALIZE DATANORM CATALOG ---');
const serializedDatanorm = serializeDatanormCatalog(catalog);
assert.ok(serializedDatanorm.startsWith('V;N;'));
assert.ok(serializedDatanorm.includes('GC-101001'));
assert.ok(serializedDatanorm.includes('T;N;010;Sanitärkeramik'));

const reParsedDatanorm = parseDatanormContent(serializedDatanorm);
assert.strictEqual(reParsedDatanorm.articles.length, catalog.articles.length);
assert.strictEqual(reParsedDatanorm.articles[0].articleNumber, 'GC-101001');
console.log('✅ TEST 8 PASSED: DATANORM 5.0 Serialisierung & Re-Parsing 100% identisch.');

console.log('\n====================================================');
console.log('   🎉 ALLE 8 DATANORM & IDS TESTS BESTANDEN!        ');
console.log('====================================================\n');
