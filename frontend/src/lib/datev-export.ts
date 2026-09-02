/**
 * DATEV Buchungsstapel Export Engine (EXTF 700 Konform)
 * Generiert standardkonforme DATEV-Format-Dateien (EXTF / Format-Version 700)
 * für den direkten fehlerfreien Import durch den Steuerberater im DATEV Rechnungswesen.
 *
 * Konform zu:
 * - DATEV-Format Version 7.0 / 510
 * - UStG § 14 Pflichtangaben & § 13b Bauleistungen (Erlöskonto 8337 SKR03 / 4337 SKR04)
 * - CRLF Zeilenumbrüche, ANSI/Windows-1252 bzw. UTF-8 Semikolon-CSV
 */

export interface DatevHeaderConfig {
  beraterNummer?: number;
  mandantenNummer?: number;
  wirtschaftsjahrBeginn?: string; // YYYYMMDD
  datumVon?: string;              // YYYYMMDD
  datumBis?: string;              // YYYYMMDD
  bezeichnung?: string;
  skr?: 'SKR03' | 'SKR04';
}

export interface DatevBookingItem {
  bookingId: string;
  date: string; // YYYY-MM-DD
  amount: number; // Bruttobetrag (bei §13b netto = brutto)
  invoiceNumber: string;
  accountNumber?: string; // Erlöskonto (z.B. 8400/8337 im SKR03 oder 4400/4337 im SKR04)
  contraAccount?: string; // Debitor / Kunde (z.B. 10000)
  costCenter?: string; // Baustellen-ID / Projekt-Key
  bookingText: string;
  taxRate?: number; // 0.19 oder 0.00
  isReverseCharge?: boolean; // § 13b UStG
  buKey?: string; // z.B. "68" für §13b oder leer bei Automatikkonten
}

export function generateDatevCsv(
  bookings: DatevBookingItem[],
  config: DatevHeaderConfig = {}
): string {
  const now = new Date();
  const yearStr = now.getFullYear().toString();
  const createdDate = now.toISOString().replace(/[-:T]/g, '').substring(0, 14); // YYYYMMDDHHMMSS

  const beraterNr = (config.beraterNummer || 10001).toString();
  const mandantNr = (config.mandantenNummer || 90001).toString();
  const wjBeginn = config.wirtschaftsjahrBeginn || `${yearStr}0101`;
  const datumVon = config.datumVon || `${yearStr}0101`;
  const datumBis = config.datumBis || `${yearStr}1231`;
  const bezeichnung = config.bezeichnung || 'VIBE Craft Erlöse';
  const skr = config.skr || 'SKR03';

  // DATEV EXTF Satz 1: Vollständiger DATEV-Header Version 700
  const headerLine1 = `"EXTF";700;21;"Buchungsstapel";1;${createdDate};"";"";"";"";"${beraterNr}";"${mandantNr}";${wjBeginn};4;${datumVon};${datumBis};"${bezeichnung}";"";1;0;0;"EUR";"";"";"";"";"";"";"";"";""`;

  // DATEV EXTF Satz 2: Standard-Feldbezeichnungen
  const headerLine2 = `"Umsatz (ohne Soll/Haben-Kz)";"Soll/Haben-Kennzeichen";"WKZ";"Kurs";"Basis-Umsatz";"WKZ Basis-Umsatz";"Konto";"Gegenkonto (ohne BU-Schlüssel)";"BU-Schlüssel";"Belegdatum";"Belegfeld 1";"Belegfeld 2";"Skonto";"Buchungstext";"Postensperre";"Diverse Adressnummer";"Geschäftspartnerbank";"Sachverhalt";"Zinssperre";"Beleglink";"Kost1 - Kostenstelle";"Kost2 - Kostenstelle"`;

  const rows = bookings.map((b) => {
    // 1. Betrag im deutschen Format (z.B. 1190,00)
    const amountStr = Math.abs(b.amount).toFixed(2).replace('.', ',');

    // 2. Erlöskonto-Bestimmung nach SKR03 / SKR04 und § 13b
    let revenueAccount = b.accountNumber;
    if (!revenueAccount) {
      if (b.isReverseCharge || b.taxRate === 0) {
        revenueAccount = skr === 'SKR04' ? '4337' : '8337'; // Erlöse nach § 13b UStG
      } else {
        revenueAccount = skr === 'SKR04' ? '4400' : '8400'; // Erlöse 19% USt
      }
    }

    // Debitor (Kunde) z.B. 10000
    const debtorAccount = b.contraAccount || '10000';

    // 3. Belegdatum als MMDD (z.B. 0902)
    const cleanDate = b.date ? b.date.replace(/-/g, '') : '';
    const formattedDate = cleanDate.length >= 8 ? cleanDate.substring(4, 8) : '0101';

    // 4. Feldlängenbegrenzungen nach DATEV Spezifikation
    const invoiceNum = (b.invoiceNumber || '').substring(0, 36);
    const costCenter = (b.costCenter || '').substring(0, 36);
    
    // Buchungstext max 60 Zeichen mit Hinweispflicht bei §13b
    let rawText = b.bookingText || `Rechnung ${invoiceNum}`;
    if (b.isReverseCharge && !rawText.includes('§13b')) {
      rawText = `§13b ${rawText}`;
    }
    const text = rawText.replace(/"/g, '""').substring(0, 60);

    // Buchungslogik Ausgangsrechnung:
    // Debitor (Soll) an Erlöskonto (Haben). 
    // In DATEV: Wenn Konto = Erlöse gebucht wird, ist das Soll/Haben-Kz = "H".
    const sollHaben = 'H';
    const buSchluessel = b.buKey || (b.isReverseCharge ? '68' : '');

    return `"${amountStr}";"${sollHaben}";"EUR";"";"";"";"${revenueAccount}";"${debtorAccount}";"${buSchluessel}";"${formattedDate}";"${invoiceNum}";"";"";"${text}";"";"";"";"";"";"";"${costCenter}";""`;
  });

  return [headerLine1, headerLine2, ...rows].join('\r\n');
}

