import {
  parseGaebXml,
  generateGaebX84Xml,
  convertGaebItemToMeasurement,
  getSampleGaebBoQ,
} from '../frontend/src/lib/gaeb.ts';

console.log('====================================================');
console.log('   VIBE CRAFT M007.2 — GAEB XML ENGINE TESTSUITE    ');
console.log('====================================================\n');

// ----------------------------------------------------
// 1. Realistic X83 Sample Tender (Angebotsaufforderung)
// ----------------------------------------------------
const sampleX83Xml = `<?xml version="1.0" encoding="UTF-8"?>
<GAEB xmlns="http://www.gaeb.de/GAEB_DA_XML/200407">
  <GAEBInfo>
    <Version>3.2</Version>
    <VersDate>2013-08</VersDate>
    <Date>2026-09-01</Date>
    <Time>10:00:00</Time>
    <ProgSys>AVA Pro 2026</ProgSys>
  </GAEBInfo>
  <PrjInfo>
    <NamePrj>Schulzentrum Süd &amp; Sporthalle</NamePrj>
    <LblPrj>Sanierung Trakt B</LblPrj>
    <Cur>EUR</Cur>
  </PrjInfo>
  <Award>
    <DP>83</DP>
    <AwardInfo>
      <Cur>EUR</Cur>
    </AwardInfo>
    <BoQ>
      <BoQInfo>
        <Name>LV 04 - Trockenbau &amp; Akustik</Name>
        <LblBoQ>Leistungsverzeichnis Trockenbau</LblBoQ>
      </BoQInfo>
      <BoQBody>
        <BoQCtgy RNoPart="01">
          <LblTx>Abbrucharbeiten &amp; Demontage</LblTx>
          <BoQBody>
            <Itemlist>
              <Item ID="p_01_0010" RNoPart="0010">
                <Qty>120.500</Qty>
                <QU>m2</QU>
                <Description>
                  <OutlineText>
                    <OutlTxt>
                      <TextOutlTxt>Vorhandene Rasterdecke rückbauen &amp; fachgerecht entsorgen</TextOutlTxt>
                    </OutlTxt>
                  </OutlineText>
                  <DetailTxt>
                    <Text>
                      <p>Inkl. Tragkonstruktion und Mineralfaserplatten. Bauschutt nach AVV 17 06 04.</p>
                    </Text>
                  </DetailTxt>
                </Description>
              </Item>
            </Itemlist>
            <TotCtgy>0.00</TotCtgy>
          </BoQBody>
        </BoQCtgy>
        <BoQCtgy RNoPart="02">
          <LblTx>Trockenbauwände &amp; Decken</LblTx>
          <BoQBody>
            <Itemlist>
              <Item ID="p_02_0010" RNoPart="0010">
                <Qty>350.000</Qty>
                <QU>m2</QU>
                <Description>
                  <OutlineText>
                    <OutlTxt>
                      <TextOutlTxt>Metallständerwand W112 F90 EI90</TextOutlTxt>
                    </OutlTxt>
                  </OutlineText>
                  <DetailTxt>
                    <Text>
                      <p>Doppelständerwerk CW 100, beidseitig 2-lagig 12,5 mm GKF, Dämmung 80 mm A1.</p>
                    </Text>
                  </DetailTxt>
                </Description>
              </Item>
              <Item ID="p_02_0020" RNoPart="0020">
                <Qty>45.000</Qty>
                <QU>Stk</QU>
                <Description>
                  <OutlineText>
                    <OutlTxt>
                      <TextOutlTxt>Revisionsklappe F90 600x600 mm flächenbündig</TextOutlTxt>
                    </OutlTxt>
                  </OutlineText>
                </Description>
              </Item>
            </Itemlist>
            <TotCtgy>0.00</TotCtgy>
          </BoQBody>
        </BoQCtgy>
      </BoQBody>
    </BoQ>
  </Award>
</GAEB>`;

console.log('--- TEST 1: PARSING GAEB X83 (Angebotsaufforderung) ---');
const parsedX83 = parseGaebXml(sampleX83Xml);

console.log(`Projekt: ${parsedX83.projectName} (${parsedX83.projectLabel})`);
console.log(`Datenphase: DP ${parsedX83.dp}`);
console.log(`Kategorien / Gewerke: ${parsedX83.categories.length}`);
console.log(`Gesamtpositionen: ${parsedX83.allItems.length}`);

if (parsedX83.dp !== '83') {
  throw new Error(`Test 1 Failed: Erwartete DP '83', erhalten '${parsedX83.dp}'`);
}
if (parsedX83.projectName !== 'Schulzentrum Süd & Sporthalle') {
  throw new Error(`Test 1 Failed: Projektname '${parsedX83.projectName}' fehlerhaft.`);
}
if (parsedX83.categories.length !== 2) {
  throw new Error(`Test 1 Failed: Erwartete 2 Kategorien, erhalten ${parsedX83.categories.length}`);
}
if (parsedX83.allItems.length !== 3) {
  throw new Error(`Test 1 Failed: Erwartete 3 Positionen, erhalten ${parsedX83.allItems.length}`);
}

// Prüfung der Positionen
const item1 = parsedX83.allItems[0];
if (item1.oz !== '01.0010' || item1.qty !== 120.5 || item1.qu !== 'm2') {
  throw new Error(`Test 1 Failed: Position 1 Attribute inkorrekt: ${JSON.stringify(item1)}`);
}
if (!item1.shortText.includes('Rasterdecke rückbauen & fachgerecht entsorgen')) {
  throw new Error(`Test 1 Failed: XML-Unescape bei Kurztext fehlgeschlagen: '${item1.shortText}'`);
}
if (!item1.longText || !item1.longText.includes('Bauschutt nach AVV 17 06 04')) {
  throw new Error(`Test 1 Failed: Langtext fehlt oder unvollständig: '${item1.longText}'`);
}

console.log('✅ TEST 1 PASSED: X83 erfolgreich geparst (OZ, Texte, Mengen, Einheiten).\n');

// ----------------------------------------------------
// 2. Preiskalkulation durch den Handwerker (Kalkulator)
// ----------------------------------------------------
console.log('--- TEST 2: KALKULATION DER EINHEITSPREISE (EP) ---');
// Handwerker bepreist die Positionen:
// Pos 01.0010: 120.5 m² * 24.50 € = 2952.25 €
// Pos 02.0010: 350.0 m² * 68.00 € = 23800.00 €
// Pos 02.0020: 45 Stk   * 185.00 € = 8325.00 €
// Gesamt Netto: 2952.25 + 23800.00 + 8325.00 = 35077.25 €
// 19% MwSt: 6664.68 €
// Gesamt Brutto: 41741.93 €

parsedX83.allItems[0].unitPrice = 24.50;
parsedX83.allItems[0].totalPrice = Math.round(120.5 * 24.50 * 100) / 100;

parsedX83.allItems[1].unitPrice = 68.00;
parsedX83.allItems[1].totalPrice = Math.round(350.0 * 68.00 * 100) / 100;

parsedX83.allItems[2].unitPrice = 185.00;
parsedX83.allItems[2].totalPrice = Math.round(45.0 * 185.00 * 100) / 100;

// Kategorie-Totals aktualisieren
parsedX83.categories[0].totalPrice = parsedX83.allItems[0].totalPrice;
parsedX83.categories[1].totalPrice = parsedX83.allItems[1].totalPrice + parsedX83.allItems[2].totalPrice;

parsedX83.dp = '84'; // Wechsel auf Angebotsabgabe
parsedX83.netTotal = Math.round((parsedX83.categories[0].totalPrice + parsedX83.categories[1].totalPrice) * 100) / 100;
parsedX83.taxAmount = Math.round(parsedX83.netTotal * parsedX83.taxRate * 100) / 100;
parsedX83.grossTotal = Math.round((parsedX83.netTotal + parsedX83.taxAmount) * 100) / 100;

console.log(`Kategorie 1 (Abbruch): ${parsedX83.categories[0].totalPrice.toFixed(2)} €`);
console.log(`Kategorie 2 (Trockenbau): ${parsedX83.categories[1].totalPrice.toFixed(2)} €`);
console.log(`Netto-Angebotssumme: ${parsedX83.netTotal.toFixed(2)} €`);
console.log(`19% MwSt: ${parsedX83.taxAmount.toFixed(2)} €`);
console.log(`Brutto-Angebotssumme: ${parsedX83.grossTotal.toFixed(2)} €`);

if (parsedX83.netTotal !== 35077.25) {
  throw new Error(`Test 2 Failed: Netto-Summe ${parsedX83.netTotal} !== 35077.25`);
}
if (parsedX83.taxAmount !== 6664.68) {
  throw new Error(`Test 2 Failed: Steuer ${parsedX83.taxAmount} !== 6664.68`);
}
if (parsedX83.grossTotal !== 41741.93) {
  throw new Error(`Test 2 Failed: Brutto-Summe ${parsedX83.grossTotal} !== 41741.93`);
}

console.log('✅ TEST 2 PASSED: Kalkulation und Rundungsregeln auf den Cent exakt.\n');

// ----------------------------------------------------
// 3. Generierung der GAEB X84 XML Angebotsdatei
// ----------------------------------------------------
console.log('--- TEST 3: GAEB X84 XML GENERATION ---');
const generatedX84Xml = generateGaebX84Xml(parsedX83);

console.log(`Generierte X84 XML-Länge: ${generatedX84Xml.length} Bytes`);

// Prüfung essenzieller GAEB DA XML 3.2 Tags
if (!generatedX84Xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')) {
  throw new Error('Test 3 Failed: Fehlende XML-Declaration');
}
if (!generatedX84Xml.includes('<DP>84</DP>')) {
  throw new Error('Test 3 Failed: Datenphase 84 fehlt im XML');
}
if (!generatedX84Xml.includes('<UP>24.50</UP>') || !generatedX84Xml.includes('<IT>2952.25</IT>')) {
  throw new Error('Test 3 Failed: UP/IT für Position 1 nicht korrekt im XML serialisiert');
}
if (!generatedX84Xml.includes('<UP>68.00</UP>') || !generatedX84Xml.includes('<IT>23800.00</IT>')) {
  throw new Error('Test 3 Failed: UP/IT für Position 2 nicht korrekt im XML serialisiert');
}
if (!generatedX84Xml.includes('<TotSub>35077.25</TotSub>')) {
  throw new Error('Test 3 Failed: TotSub im BoQSummary fehlt oder inkorrekt');
}
if (!generatedX84Xml.includes('<TotAmnt>41741.93</TotAmnt>')) {
  throw new Error('Test 3 Failed: TotAmnt im BoQSummary fehlt oder inkorrekt');
}
if (!generatedX84Xml.includes('Schulzentrum Süd &amp; Sporthalle')) {
  throw new Error('Test 3 Failed: XML-Escaping bei Sonderzeichen fehlgeschlagen');
}

console.log('✅ TEST 3 PASSED: X84 XML Struktur, Hierarchie & Summen normkonform.\n');

// ----------------------------------------------------
// 4. Round-Trip Re-Parsing der generierten X84 Datei
// ----------------------------------------------------
console.log('--- TEST 4: ROUND-TRIP TEST (Re-Parsing der X84) ---');
const roundTripBoq = parseGaebXml(generatedX84Xml);

if (roundTripBoq.dp !== '84') {
  throw new Error(`Test 4 Failed: Re-parsed DP ist '${roundTripBoq.dp}', erwartet '84'`);
}
if (roundTripBoq.allItems.length !== 3) {
  throw new Error(`Test 4 Failed: Re-parsed Item Count ${roundTripBoq.allItems.length} !== 3`);
}
if (roundTripBoq.netTotal !== 35077.25) {
  throw new Error(`Test 4 Failed: Re-parsed Net Total ${roundTripBoq.netTotal} !== 35077.25`);
}
if (roundTripBoq.grossTotal !== 41741.93) {
  throw new Error(`Test 4 Failed: Re-parsed Gross Total ${roundTripBoq.grossTotal} !== 41741.93`);
}

// Prüfung der bepreisten Items nach Re-Parse
const rtItem1 = roundTripBoq.allItems[0];
if (rtItem1.unitPrice !== 24.50 || rtItem1.totalPrice !== 2952.25) {
  throw new Error(`Test 4 Failed: Re-parsed Item 1 Preise abweichend: ${JSON.stringify(rtItem1)}`);
}

const rtItem2 = roundTripBoq.allItems[1];
if (rtItem2.unitPrice !== 68.00 || rtItem2.totalPrice !== 23800.00) {
  throw new Error(`Test 4 Failed: Re-parsed Item 2 Preise abweichend: ${JSON.stringify(rtItem2)}`);
}

console.log('✅ TEST 4 PASSED: 100% mathematische & hierarchische Identität im Round-Trip.\n');

// ----------------------------------------------------
// 5. VOB-Aufmaß Konvertierung (Brücke ins MeasurementGrid)
// ----------------------------------------------------
console.log('--- TEST 5: AUFMAẞ-BRÜCKE (GaebItem -> MeasurementRowItem) ---');
const measurement1 = convertGaebItemToMeasurement(rtItem1);
const measurement2 = convertGaebItemToMeasurement(rtItem2);
const measurement3 = convertGaebItemToMeasurement(roundTripBoq.allItems[2]);

console.log('Konvertierte Aufmaß-Zeile 1:', measurement1);
console.log('Konvertierte Aufmaß-Zeile 2:', measurement2);

if (measurement1.position_nr !== '01.0010' || measurement1.unit !== 'm2' || measurement1.unit_price !== 24.50) {
  throw new Error('Test 5 Failed: Aufmaß-Zeile 1 Konvertierungsfehler');
}
if (measurement2.position_nr !== '02.0010' || measurement2.unit !== 'm2' || measurement2.total_price !== 23800.00) {
  throw new Error('Test 5 Failed: Aufmaß-Zeile 2 Konvertierungsfehler');
}
if (measurement3.unit !== 'stk' || measurement3.quantity !== 45.0) {
  throw new Error('Test 5 Failed: Aufmaß-Zeile 3 Mengeneinheit Stück fehlerhaft');
}

console.log('✅ TEST 5 PASSED: Nahtlose Konvertierung in VOB-Aufmaßstruktur verifiziert.\n');

// ----------------------------------------------------
// 6. Muster-LV Generator
// ----------------------------------------------------
console.log('--- TEST 6: SAMPLE BOQ GENERATOR ---');
const sampleBoq = getSampleGaebBoQ();
if (sampleBoq.categories.length !== 2 || sampleBoq.allItems.length !== 4) {
  throw new Error('Test 6 Failed: Muster-LV Struktur fehlerhaft');
}
const sampleX84 = generateGaebX84Xml(sampleBoq);
const reSample = parseGaebXml(sampleX84);
if (reSample.netTotal !== sampleBoq.netTotal) {
  throw new Error(`Test 6 Failed: Muster-LV Nettoabweichung: ${reSample.netTotal} !== ${sampleBoq.netTotal}`);
}

console.log(`Muster-LV Netto: ${reSample.netTotal.toFixed(2)} € | Brutto: ${reSample.grossTotal.toFixed(2)} €`);
console.log('✅ TEST 6 PASSED: Muster-LV Generator und Re-Parse erfolgreich.\n');

console.log('====================================================');
console.log('   🎉 ALLE 6 GAEB TESTS 100% ERFOLGREICH BESTANDEN!  ');
console.log('====================================================');
