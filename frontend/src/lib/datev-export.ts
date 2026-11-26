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
    // 1. Betrag im deutschen Format (z.B. 1190,00) mit Credit Note Handling
    const rawAmount = typeof b.amount === 'number' && !isNaN(b.amount) ? b.amount : 0;
    const isCreditNote = rawAmount < 0;
    const amountStr = Math.abs(rawAmount).toFixed(2).replace('.', ',');

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

    // 3. Robustes Belegdatum als MMDD (z.B. 0902)
    let formattedDate = '0101';
    if (b.date) {
      if (b.date.includes('.')) {
        // German date DD.MM.YYYY
        const parts = b.date.trim().split('.');
        if (parts.length >= 2) {
          const dd = parts[0].padStart(2, '0');
          const mm = parts[1].padStart(2, '0');
          formattedDate = `${mm}${dd}`;
        }
      } else {
        const d = new Date(b.date);
        if (!isNaN(d.getTime())) {
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const dd = String(d.getDate()).padStart(2, '0');
          formattedDate = `${mm}${dd}`;
        } else {
          const clean = b.date.replace(/-/g, '');
          if (clean.length >= 8) {
            formattedDate = clean.substring(4, 8);
          }
        }
      }
    }

    // 4. Feldlängenbegrenzungen nach DATEV Spezifikation
    const invoiceNum = (b.invoiceNumber || '').replace(/[";]/g, '').substring(0, 36);
    const costCenter = (b.costCenter || '').replace(/[";]/g, '').substring(0, 36);
    
    // Buchungstext max 60 Zeichen mit Hinweispflicht bei §13b
    let rawText = b.bookingText || `Rechnung ${invoiceNum}`;
    if (b.isReverseCharge && !rawText.includes('§13b')) {
      rawText = `§13b ${rawText}`;
    }
    // Semicolon and double quote sanitization for CSV safety
    const text = rawText.replace(/;/g, ' ').replace(/"/g, '""').substring(0, 60);

    // Buchungslogik:
    // Ausgangsrechnung: Soll/Haben-Kz = "H"
    // Gutschrift (negativer Betrag): Soll/Haben-Kz = "S"
    const sollHaben = isCreditNote ? 'S' : 'H';
    const buSchluessel = b.buKey || (b.isReverseCharge ? '68' : '');

    return `"${amountStr}";"${sollHaben}";"EUR";"";"";"";"${revenueAccount}";"${debtorAccount}";"${buSchluessel}";"${formattedDate}";"${invoiceNum}";"";"";"${text}";"";"";"";"";"";"";"${costCenter}";""`;
  });

  return [headerLine1, headerLine2, ...rows].join('\r\n');
}

const CP1252_EXTRA: Record<number, number> = {
  0x20ac: 0x80, // €
  0x201a: 0x82, // ‚
  0x0192: 0x83, // ƒ
  0x201e: 0x84, // „
  0x2026: 0x85, // …
  0x2020: 0x86, // †
  0x2021: 0x87, // ‡
  0x02c6: 0x88, // ˆ
  0x2030: 0x89, // ‰
  0x0160: 0x8a, // Š
  0x2039: 0x8b, // ‹
  0x0152: 0x8c, // Œ
  0x017d: 0x8e, // Ž
  0x2018: 0x91, // ‘
  0x2019: 0x92, // ’
  0x201c: 0x93, // “
  0x201d: 0x94, // ”
  0x2022: 0x95, // •
  0x2013: 0x96, // –
  0x2014: 0x97, // —
  0x02dc: 0x98, // ˜
  0x2122: 0x99, // ™
  0x0161: 0x9a, // š
  0x203a: 0x9b, // ›
  0x0153: 0x9c, // œ
  0x017e: 0x9e, // ž
  0x0178: 0x9f, // Ÿ
};

/**
 * Encodes a string to Windows-1252 (ANSI CP1252) bytes as required by DATEV EXTF.
 */
export function encodeWindows1252(text: string): Uint8Array {
  const bytes = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code <= 0x7f || (code >= 0xa0 && code <= 0xff)) {
      bytes[i] = code;
    } else if (CP1252_EXTRA[code] !== undefined) {
      bytes[i] = CP1252_EXTRA[code];
    } else {
      bytes[i] = 0x3f; // '?' fallback for unmapped characters
    }
  }
  return bytes;
}

