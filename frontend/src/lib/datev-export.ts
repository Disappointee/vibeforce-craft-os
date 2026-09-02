/**
 * DATEV Buchungsstapel Export Engine
 * Generiert standardkonforme DATEV-Format-Dateien (EXTF / Kassenbuch / Erlösbuchungen)
 * für den direkten Import durch den Steuerberater.
 */

export interface DatevBookingItem {
  bookingId: string;
  date: string; // YYYY-MM-DD
  amount: number; // Bruttobetrag
  invoiceNumber: string;
  accountNumber: string; // Erlöskonto (z.B. 8400 im SKR03 oder 4400 im SKR04)
  contraAccount: string; // Debitor / Kunde (z.B. 10000)
  costCenter: string; // Baustellen-ID / Projekt-Key
  bookingText: string;
  taxRate?: number; // 19%
}

export function generateDatevCsv(bookings: DatevBookingItem[]): string {
  // DATEV EXTF Header (Format-Version 700 / 510)
  const headerLines = [
    `"EXTF";700;21;"Buchungsstapel";1;"";"";"";"";"";"";"";"";"";"";"";"";"";""`,
    `"Umsatz (ohne Soll/Haben-Kz)";"Soll/Haben-Kennzeichen";"WKZ";"Kurs";"Basis-Umsatz";"WKZ Basis-Umsatz";"Konto";"Gegenkonto (ohne BU-Schlüssel)";"BU-Schlüssel";"Belegdatum";"Belegfeld 1";"Belegfeld 2";"Skonto";"Buchungstext";"Postensperre";"Diverse Adressnummer";"Geschäftspartnerbank";"Sachverhalt";"Zinssperre";"Beleglink";"Kost1 - Kostenstelle";"Kost2 - Kostenstelle"`,
  ];

  const rows = bookings.map((b) => {
    const amountStr = b.amount.toFixed(2).replace('.', ',');
    const formattedDate = b.date ? b.date.replace(/-/g, '').substring(4) : ''; // MMDD
    const invoiceNum = b.invoiceNumber.substring(0, 36);
    const costCenter = b.costCenter.substring(0, 36);
    const text = b.bookingText.replace(/"/g, '""').substring(0, 60);

    return `"${amountStr}";"S";"EUR";"";"";"";"${b.accountNumber}";"${b.contraAccount}";"";"${formattedDate}";"${invoiceNum}";"";"";"${text}";"";"";"";"";"";"";"${costCenter}";""`;
  });

  return [...headerLines, ...rows].join('\r\n');
}
