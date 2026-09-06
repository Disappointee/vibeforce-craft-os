/**
 * DATANORM 5.0 & 4.0 Core Engine for German Crafts & Wholesale
 * Standards: DIN 8580 / DIN 18299 / DATANORM Version 5.0 & 4.0 Specification
 * 
 * Supports:
 * - Satzart V: Vorlaufsatz / Header (Metadaten, Währung, Ersteller)
 * - Satzart A: Artikel-Hauptsatz (Artikelnr, Kurztexte, ME, Preisbasis, Katalogpreis, RG)
 * - Satzart B: Artikel-Langtext (Mehrzeilige Leistungsbeschreibungen)
 * - Satzart P: Preispflegesatz (Preisanpassungen, Neupreise)
 * - Satzart S: Staffelpreise (Mengenstaffeln)
 * - Satzart T: Warengruppensatz (Kategorien)
 * - Satzart R: Rabattgruppensatz (Handwerker-Konditionen)
 * - Charset-Resilienz für historische DOS CP850 / ISO-8859-1 / UTF-8 Dateien
 * - Preis- und Margenkalkulation (Listenpreis -> Rabatt% -> EK-Netto -> Aufschlag% -> VK-Netto)
 */

export interface DatanormHeader {
  version: '5.0' | '4.0';
  creationDate: string; // YYYY-MM-DD or DDMMYYYY
  currency: 'EUR' | 'DEM';
  wholesalerName: string;
  fileName?: string;
  description?: string;
}

export interface DatanormArticle {
  articleNumber: string;
  commodityGroup: string; // Warengruppe (z.B. 010, SHK)
  shortText1: string;
  shortText2?: string;
  longText?: string;
  unit: string; // Mengeneinheit (z.B. STK, M, M2)
  priceBase: number; // 1, 10, 100, 1000
  priceTag: 'gross' | 'net'; // 1 = Bruttopreis/Listenpreis, 2 = Nettopreis
  catalogPrice: number; // Listenpreis in Euro
  discountGroup: string; // Rabattgruppe (z.B. RG-SAN, 01)
  discountPercent?: number; // Angewandter Rabattsatz
  copperSurcharge?: number; // Teuerungs-/Rohstoffzuschlag
  purchasePriceNet: number; // Handwerker-Einkaufspreis (EK)
  suggestedRetailPrice?: number; // Empfohlener VK
  calculatedSalesPrice?: number; // Kalkulierter Angebotspreis (VK)
  processingFlag: 'new' | 'update' | 'delete'; // N, A, L
  matchcode?: string;
  scalePrices?: Array<{ quantity: number; price: number }>;
}

export interface DatanormCommodityGroup {
  code: string;
  name: string;
}

export interface DatanormDiscountGroup {
  code: string;
  discountPercent: number;
  description?: string;
}

export interface DatanormCatalog {
  header: DatanormHeader;
  articles: DatanormArticle[];
  commodityGroups: Record<string, string>; // code -> name
  discountGroups: Record<string, number>; // code -> discount%
}

export interface DatanormPricingConfig {
  defaultMarkupPercent: number; // e.g. 30% standard craft markup on EK
  customDiscountGroups?: Record<string, number>; // override RG percentages
  vatRatePercent: number; // 19% or 0% (§ 13b)
}

/**
 * Robust CP850 / Latin-1 byte to UTF-8 character conversion table for legacy DATANORM files.
 */
const CP850_TABLE: Record<number, string> = {
  0x81: 'ü',
  0x84: 'ä',
  0x8e: 'Ä',
  0x94: 'ö',
  0x99: 'Ö',
  0x9a: 'Ü',
  0xe1: 'ß',
  0x82: 'é',
  0x85: 'à',
  0x8a: 'è',
  0xa0: 'á',
  0xa1: 'í',
  0xa2: 'ó',
  0xa3: 'ú',
  0xa4: 'ñ',
  0xf5: '§',
  0xf1: '±',
  0xfd: '²',
  0xfc: '³',
};

/**
 * Decodes raw buffer or byte array into sanitized UTF-8 string,
 * automatically handling DOS CP850, ISO-8859-1 and modern UTF-8.
 */
export function decodeDatanormContent(input: Uint8Array | string): string {
  if (typeof input === 'string') {
    return input;
  }

  // Probe if input is valid UTF-8
  try {
    const utf8Decoder = new TextDecoder('utf-8', { fatal: true });
    return utf8Decoder.decode(input);
  } catch {
    // Fallback: CP850 / ISO-8859-1 conversion
    let output = '';
    for (let i = 0; i < input.length; i++) {
      const byte = input[i];
      if (byte < 0x80) {
        output += String.fromCharCode(byte);
      } else if (CP850_TABLE[byte]) {
        output += CP850_TABLE[byte];
      } else {
        output += String.fromCharCode(byte);
      }
    }
    return output;
  }
}

/**
 * Parses numeric price string from DATANORM line.
 * Handles both decimal formats ("145.50", "145,50") and integer cent notation ("14550").
 */
export function parseDatanormPrice(rawPrice: string, priceBase: number = 1): number {
  if (!rawPrice || rawPrice.trim() === '') return 0;
  const cleaned = rawPrice.trim().replace(/\s+/g, '');

  let price = 0;
  if (cleaned.includes('.') || cleaned.includes(',')) {
    price = parseFloat(cleaned.replace(',', '.'));
  } else {
    // Standard DATANORM: Prices without decimal points are integer cents (e.g. 14550 = 145.50 EUR)
    const intVal = parseInt(cleaned, 10);
    if (!isNaN(intVal)) {
      price = intVal / 100;
    }
  }

  if (isNaN(price)) return 0;
  const divisor = priceBase > 0 ? priceBase : 1;
  return Math.round((price / divisor) * 100) / 100;
}

/**
 * Calculates net wholesale purchase price (Handwerker-EK) based on catalog gross price and discount.
 */
export function calculatePurchasePrice(
  catalogPrice: number,
  discountPercent: number = 0,
  surcharge: number = 0
): number {
  const discountFactor = Math.max(0, 1 - discountPercent / 100);
  const net = catalogPrice * discountFactor + surcharge;
  return Math.round(net * 100) / 100;
}

/**
 * Calculates net sales price (Handwerker-Angebotspreis VK) based on EK and markup percentage.
 */
export function calculateSellingPrice(
  purchasePriceNet: number,
  markupPercent: number = 30
): number {
  const markupFactor = 1 + markupPercent / 100;
  const vk = purchasePriceNet * markupFactor;
  return Math.round(vk * 100) / 100;
}

/**
 * Calculates trade margin (Deckungsbeitrag I / Rohertrag) in Euros and percentage.
 */
export function calculateMargin(
  sellingPriceNet: number,
  purchasePriceNet: number
): { marginEuro: number; marginPercent: number } {
  const marginEuro = Math.round((sellingPriceNet - purchasePriceNet) * 100) / 100;
  const marginPercent =
    sellingPriceNet > 0 ? Math.round((marginEuro / sellingPriceNet) * 1000) / 10 : 0;
  return { marginEuro, marginPercent };
}

/**
 * Parses full DATANORM 5.0 or 4.0 file content.
 */
export function parseDatanormContent(
  rawContent: string,
  config?: Partial<DatanormPricingConfig>
): DatanormCatalog {
  const lines = rawContent.split(/\r?\n/);

  const header: DatanormHeader = {
    version: '5.0',
    creationDate: new Date().toISOString().slice(0, 10),
    currency: 'EUR',
    wholesalerName: 'Großhandels-Katalog',
  };

  const commodityGroups: Record<string, string> = {};
  const discountGroups: Record<string, number> = {
    ...(config?.customDiscountGroups || {}),
  };

  const articleMap = new Map<string, DatanormArticle>();
  const longtextMap = new Map<string, Map<number, string>>(); // artNr -> lineNr -> text

  const defaultMarkup = config?.defaultMarkupPercent ?? 30;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // DATANORM 5.0 uses semicolon separation
    const fields = trimmed.split(';').map((f) => f.trim());
    const satzart = fields[0]?.toUpperCase();

    switch (satzart) {
      case 'V': {
        // Vorlaufsatz
        // V;KZ;Datum;Währung;Dateiname;Ersteller;Version
        header.wholesalerName = fields[5] || fields[4] || header.wholesalerName;
        header.currency = fields[3]?.toUpperCase() === 'DEM' ? 'DEM' : 'EUR';
        if (fields[2]) header.creationDate = fields[2];
        if (fields[6] && fields[6].includes('4')) {
          header.version = '4.0';
        } else {
          header.version = '5.0';
        }
        if (fields[4]) header.fileName = fields[4];
        break;
      }

      case 'T': {
        // Warengruppensatz
        // T;KZ;Warengruppe;Bezeichnung
        const code = fields[2] || '';
        const name = fields[3] || `Warengruppe ${code}`;
        if (code) {
          commodityGroups[code] = name;
        }
        break;
      }

      case 'R': {
        // Rabattgruppensatz
        // R;KZ;Rabattgruppe;Rabatt%
        const rgCode = fields[2] || '';
        const discountVal = parseFloat((fields[3] || '0').replace(',', '.'));
        if (rgCode && !isNaN(discountVal)) {
          discountGroups[rgCode] = discountVal;
        }
        break;
      }

      case 'A': {
        // Artikel-Hauptsatz
        // A;KZ;Artikelnr;Warengruppe;Kurztext1;Kurztext2;ME;Preisbasis;Preiskennzeichen;Katalogpreis;Rabattgruppe;KupferKZ;Kupfergewicht
        const flagChar = (fields[1] || 'N').toUpperCase();
        const procFlag: 'new' | 'update' | 'delete' =
          flagChar === 'L' ? 'delete' : flagChar === 'A' ? 'update' : 'new';

        const articleNumber = fields[2] || '';
        if (!articleNumber) continue;

        if (procFlag === 'delete') {
          articleMap.delete(articleNumber);
          continue;
        }

        const commodityGroup = fields[3] || '000';
        const shortText1 = fields[4] || 'Artikel ohne Kurztext';
        const shortText2 = fields[5] || undefined;
        const unit = fields[6] || 'STK';
        const priceBase = parseInt(fields[7] || '1', 10) || 1;
        const priceTag: 'gross' | 'net' = fields[8] === '2' ? 'net' : 'gross';
        const rawCatalogPrice = fields[9] || '0';
        const catalogPrice = parseDatanormPrice(rawCatalogPrice, priceBase);
        const discountGroup = fields[10] || 'RG1';

        const discountPercent = discountGroups[discountGroup] ?? 0;
        const copperSurcharge = parseDatanormPrice(fields[12] || '0', 1);

        const purchasePriceNet = calculatePurchasePrice(
          catalogPrice,
          discountPercent,
          copperSurcharge
        );
        const calculatedSalesPrice = calculateSellingPrice(
          purchasePriceNet,
          defaultMarkup
        );

        const article: DatanormArticle = {
          articleNumber,
          commodityGroup,
          shortText1,
          shortText2,
          unit,
          priceBase,
          priceTag,
          catalogPrice,
          discountGroup,
          discountPercent,
          copperSurcharge,
          purchasePriceNet,
          suggestedRetailPrice: catalogPrice,
          calculatedSalesPrice,
          processingFlag: procFlag,
          scalePrices: [],
        };

        articleMap.set(articleNumber, article);
        break;
      }

      case 'B': {
        // Artikel-Langtext
        // B;KZ;Artikelnr;Zeilennr;Langtext
        const artNr = fields[2] || '';
        const lineNr = parseInt(fields[3] || '1', 10) || 1;
        const textChunk = fields[4] || '';

        if (artNr && textChunk) {
          if (!longtextMap.has(artNr)) {
            longtextMap.set(artNr, new Map());
          }
          longtextMap.get(artNr)!.set(lineNr, textChunk);
        }
        break;
      }

      case 'P': {
        // Preispflegesatz
        // P;KZ;Artikelnr;Preiskennzeichen;NeuerPreis
        const artNr = fields[2] || '';
        const article = articleMap.get(artNr);
        if (article) {
          const rawNewPrice = fields[4] || '0';
          const newPrice = parseDatanormPrice(rawNewPrice, article.priceBase);
          article.catalogPrice = newPrice;
          article.purchasePriceNet = calculatePurchasePrice(
            newPrice,
            article.discountPercent ?? 0,
            article.copperSurcharge ?? 0
          );
          article.calculatedSalesPrice = calculateSellingPrice(
            article.purchasePriceNet,
            defaultMarkup
          );
        }
        break;
      }

      case 'S': {
        // Staffelpreise
        // S;KZ;Artikelnr;Staffelmenge1;Staffelpreis1;Staffelmenge2;Staffelpreis2
        const artNr = fields[2] || '';
        const article = articleMap.get(artNr);
        if (article && fields.length >= 5) {
          const scalePrices: Array<{ quantity: number; price: number }> = [];
          for (let i = 3; i < fields.length; i += 2) {
            const qty = parseFloat((fields[i] || '0').replace(',', '.'));
            const pr = parseDatanormPrice(fields[i + 1] || '0', article.priceBase);
            if (qty > 0 && pr > 0) {
              scalePrices.push({ quantity: qty, price: pr });
            }
          }
          article.scalePrices = scalePrices;
        }
        break;
      }

      default:
        break;
    }
  }

  // Merge longtexts into articles
  for (const [artNr, lineMap] of longtextMap.entries()) {
    const article = articleMap.get(artNr);
    if (article) {
      const sortedLines = Array.from(lineMap.entries())
        .sort(([a], [b]) => a - b)
        .map(([, txt]) => txt);
      article.longText = sortedLines.join(' ');
    }
  }

  return {
    header,
    articles: Array.from(articleMap.values()),
    commodityGroups,
    discountGroups,
  };
}

/**
 * Serializes catalog to standard DATANORM 5.0 semicolon-separated format.
 */
export function serializeDatanormCatalog(catalog: DatanormCatalog): string {
  const lines: string[] = [];

  // Satzart V
  const h = catalog.header;
  lines.push(
    `V;N;${h.creationDate};${h.currency};${h.fileName || 'DATANORM.001'};${h.wholesalerName};5.0`
  );

  // Satzart T (Warengruppen)
  for (const [code, name] of Object.entries(catalog.commodityGroups)) {
    lines.push(`T;N;${code};${name}`);
  }

  // Satzart R (Rabattgruppen)
  for (const [rg, pct] of Object.entries(catalog.discountGroups)) {
    lines.push(`R;N;${rg};${pct.toFixed(1)}`);
  }

  // Satzart A & B
  for (const art of catalog.articles) {
    const flag = art.processingFlag === 'delete' ? 'L' : art.processingFlag === 'update' ? 'A' : 'N';
    const tag = art.priceTag === 'net' ? '2' : '1';
    const catPriceStr = art.catalogPrice.toFixed(2);
    lines.push(
      `A;${flag};${art.articleNumber};${art.commodityGroup};${art.shortText1};${art.shortText2 || ''};${art.unit};${art.priceBase};${tag};${catPriceStr};${art.discountGroup};0;${art.copperSurcharge || 0}`
    );

    if (art.longText) {
      const chunks = art.longText.match(/.{1,40}/g) || [art.longText];
      chunks.forEach((chk, idx) => {
        lines.push(`B;N;${art.articleNumber};${idx + 1};${chk}`);
      });
    }

    if (art.scalePrices && art.scalePrices.length > 0) {
      const scaleFields = art.scalePrices.map((s) => `${s.quantity};${s.price.toFixed(2)}`).join(';');
      lines.push(`S;N;${art.articleNumber};${scaleFields}`);
    }
  }

  return lines.join('\r\n') + '\r\n';
}

/**
 * Generates realistic SHK (Sanitär, Heizung, Klima) sample DATANORM 5.0 dataset.
 */
export function getSampleDatanormShkCatalog(): DatanormCatalog {
  const content = `V;N;2026-09-07;EUR;DATANORM.001;GC-ONLINE PLUS (Muster-Großhandel);5.0
T;N;010;Sanitärkeramik & Vorwandelemente
T;N;020;Armaturen & Brausen
T;N;030;Rohrleitungssysteme & Fittings
T;N;040;Heizkörper & Regelung
T;N;050;Dämmung & Brandschutz
R;N;RG-SAN;38.0
R;N;RG-ARM;42.0
R;N;RG-ROHR;45.0
R;N;RG-HK;35.0
R;N;RG-ISO;30.0
A;N;GC-101001;010;Geberit Duofix Element für Wand-WC 112cm;mit Sigma UP-Spülkasten 12cm;STK;1;1;248.50;RG-SAN;0;0
B;N;GC-101001;1;Trockenbauelement mit pulverbeschichtet
B;N;GC-101001;2;em Rahmen, selbsttragend, für Wand-WC m
B;N;GC-101001;3;it Anschlussbogen DN 90/110.
A;N;GC-202002;020;Grohe Eurosmart Einhand-Waschtischbatterie;DN 15, mit Ablaufgarnitur chrom;STK;1;1;124.00;RG-ARM;0;0
B;N;GC-202002;1;Grohe SilkMove 35 mm Keramikkartusche
B;N;GC-202002;2;mit Temperaturbegrenzer und StarLight.
A;N;GC-303003;030;Viega Sanpress Inox Rohr 1.4401 d=22mm;Stange à 6m, Edelstahl DVGW;M;1;1;18.80;RG-ROHR;0;0
A;N;GC-404004;040;Kermi therm-x2 Profil-Kompaktheizkörper;Typ 22, BH 600 mm, BL 1000 mm;STK;1;1;312.00;RG-HK;0;0
A;N;GC-505005;050;Armacell Armaflex XG Rohrisolierung 22x13;Schlauch 2m, hochflexibel schwarz;M;1;1;6.20;RG-ISO;0;0
S;N;GC-303003;60;16.50;120;14.80`;

  return parseDatanormContent(content);
}

/**
 * Generates realistic Elektro installation sample DATANORM 5.0 dataset.
 */
export function getSampleDatanormElektroCatalog(): DatanormCatalog {
  const content = `V;N;2026-09-07;EUR;DATANORM.001;Sonepar Deutschland (Muster-Großhandel);5.0
T;N;110;Verteiler & Reiheneinbaugeräte
T;N;120;Schalterprogramme & Steckdosen
T;N;130;Kabel & Mantelleitungen
T;N;140;Verbindungstechnik & Klemmen
R;N;RG-VER;32.0
R;N;RG-INST;40.0
R;N;RG-KAB;25.0
R;N;RG-KLEM;35.0
A;N;SON-701001;110;Hager Kleinverteiler volta 4-reihig;VU48NC Unterputz mit Tür;STK;1;1;184.00;RG-VER;0;0
B;N;SON-701001;1;Installationskleinverteiler nach DIN EN
B;N;SON-701001;2; 60670-24, mit PE/N-QuickConnect Klemmen
A;N;SON-701002;110;ABB Sicherungsautomat S201-B16;1-polig, B-Charakteristik, 16A;STK;1;1;8.90;RG-VER;0;0
A;N;SON-802001;120;Gira E2 Steckdose Reinweiß seidenmatt;018803 mit Kinderschutz;STK;1;1;9.80;RG-INST;0;0
A;N;SON-903001;130;Mantelleitung NYM-J 3x1.5 mm2;Ring 100 Meter, Kupferbasis 150;M;1;1;1.45;RG-KAB;0;0.45
A;N;SON-904001;140;Wago Verbindungsklemme 3-Leiter 221-413;Packung mit 50 Stück mit Hebel;STK;1;1;0.48;RG-KLEM;0;0
S;N;SON-903001;500;1.28;1000;1.15`;

  return parseDatanormContent(content);
}
