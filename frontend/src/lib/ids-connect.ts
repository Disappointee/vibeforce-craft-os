/**
 * IDS-Connect 2.5 Engine for German Crafts & Wholesalers
 * Specification: IDS-Connect Version 2.5 (IGH - Interessengemeinschaft Handwerk / BVBS)
 * 
 * Supports:
 * - IDS Punchout URL generator with session tracking, hookurl & customer authorization
 * - Norm-compliant IDS 2.5 XML Cart Parser (<idsCart>, <header>, <items>, <item>)
 * - Norm-compliant IDS 2.5 XML Cart Generator for testing & round-trips
 * - Pre-configured Wholesaler Profiles (GC-ONLINE PLUS, Sonepar, Richter+Frenzel, Rexel, Würth)
 * - Seamless Bridge to VOB-Aufmaß (MeasurementRowItem) and GAEB-LV (GaebItem)
 */

import type { MeasurementRowItem } from '@/components/craft/MeasurementGrid';
import type { GaebItem } from '@/lib/gaeb';
import type { MeasurementUnit } from '@/lib/pocketbase-types';

export interface IdsCartHeader {
  wholesalerName: string;
  cartId: string;
  orderDate: string;
  currency: string;
  customerNumber?: string;
  orderReference?: string;
}

export interface IdsCartItem {
  id: string;
  itemNumber: string; // Großhandels-Artikelnummer
  description: string;
  longDescription?: string;
  quantity: number;
  unit: string;
  priceGross: number; // Listenpreis
  priceNet: number; // Handwerker-Einkaufspreis (EK)
  discountPercent?: number; // Großhandels-Rabatt
  totalNet: number;
  deliveryTimeDays?: number;
  manufacturer?: string;
  commodityGroup?: string;
  ean?: string;
}

export interface IdsCart {
  version: '2.5';
  header: IdsCartHeader;
  items: IdsCartItem[];
  totalGross: number;
  totalNet: number;
  totalVat: number;
}

export interface IdsWholesalerProfile {
  id: string;
  name: string;
  trade: 'SHK' | 'Elektro' | 'Bedachung' | 'Universal';
  brandColor: string;
  accentColor: string;
  shopUrl: string;
  punchoutEndpoint: string;
  customerNumber: string;
  description: string;
  mockArticles: Array<{
    itemNumber: string;
    description: string;
    unit: string;
    priceGross: number;
    discountPercent: number;
    manufacturer: string;
  }>;
}

export interface IdsPunchoutConfig {
  wholesalerId: string;
  hookUrl: string;
  sessionId: string;
  customerNumber: string;
  orderReference?: string;
}

/**
 * Built-in profiles for major German craft wholesalers.
 */
export const IDS_WHOLESALER_PROFILES: IdsWholesalerProfile[] = [
  {
    id: 'gc-gruppe',
    name: 'GC-ONLINE PLUS (GC-Gruppe)',
    trade: 'SHK',
    brandColor: '#004B87',
    accentColor: '#009FE3',
    shopUrl: 'https://onlineplus.gc-gruppe.de',
    punchoutEndpoint: '/ids/punchout',
    customerNumber: 'GC-KND-98421',
    description: 'Führender Fachgroßhandel für Haustechnik (Sanitär, Heizung, Klima, Rohrleitung).',
    mockArticles: [
      {
        itemNumber: 'GC-101001',
        description: 'Geberit Duofix Element für Wand-WC 112cm mit Sigma UP-Spülkasten 12cm',
        unit: 'STK',
        priceGross: 248.5,
        discountPercent: 38,
        manufacturer: 'Geberit',
      },
      {
        itemNumber: 'GC-202002',
        description: 'Grohe Eurosmart Einhand-Waschtischbatterie DN 15 chrom',
        unit: 'STK',
        priceGross: 124.0,
        discountPercent: 42,
        manufacturer: 'Grohe',
      },
      {
        itemNumber: 'GC-303003',
        description: 'Viega Sanpress Inox Rohr 1.4401 d=22mm Stange à 6m Edelstahl',
        unit: 'M',
        priceGross: 18.8,
        discountPercent: 45,
        manufacturer: 'Viega',
      },
      {
        itemNumber: 'GC-404004',
        description: 'Kermi therm-x2 Profil-Kompaktheizkörper Typ 22, BH 600 mm, BL 1000 mm',
        unit: 'STK',
        priceGross: 312.0,
        discountPercent: 35,
        manufacturer: 'Kermi',
      },
    ],
  },
  {
    id: 'sonepar',
    name: 'Sonepar Deutschland',
    trade: 'Elektro',
    brandColor: '#E2001A',
    accentColor: '#FF4D4D',
    shopUrl: 'https://www.sonepar.de',
    punchoutEndpoint: '/ids/punchout',
    customerNumber: 'SON-KND-55102',
    description: 'Führender Elektrogroßhandel für Installationsmaterial, Verteilerbau und Licht.',
    mockArticles: [
      {
        itemNumber: 'SON-701001',
        description: 'Hager Kleinverteiler volta 4-reihig VU48NC Unterputz mit Tür',
        unit: 'STK',
        priceGross: 184.0,
        discountPercent: 32,
        manufacturer: 'Hager',
      },
      {
        itemNumber: 'SON-701002',
        description: 'ABB Sicherungsautomat S201-B16 1-polig B-Charakteristik 16A',
        unit: 'STK',
        priceGross: 8.9,
        discountPercent: 32,
        manufacturer: 'ABB',
      },
      {
        itemNumber: 'SON-802001',
        description: 'Gira E2 Steckdose Reinweiß seidenmatt 018803 mit Kinderschutz',
        unit: 'STK',
        priceGross: 9.8,
        discountPercent: 40,
        manufacturer: 'Gira',
      },
      {
        itemNumber: 'SON-903001',
        description: 'Mantelleitung NYM-J 3x1.5 mm2 Ring 100m Kupferbasis 150',
        unit: 'M',
        priceGross: 1.45,
        discountPercent: 25,
        manufacturer: 'Prysmian',
      },
    ],
  },
  {
    id: 'richter-frenzel',
    name: 'Richter+Frenzel (R+F)',
    trade: 'SHK',
    brandColor: '#E30613',
    accentColor: '#FF6600',
    shopUrl: 'https://www.richter-frenzel.de',
    punchoutEndpoint: '/ids/punchout',
    customerNumber: 'RF-KND-33419',
    description: 'Fachgroßhandel für Sanitär-, Heizungs- und Umwelttechnik in Deutschland.',
    mockArticles: [
      {
        itemNumber: 'RF-55120',
        description: 'Buderus Logatrend Flachheizkörper Ventil-Kompakt Typ 22 600x1200',
        unit: 'STK',
        priceGross: 345.0,
        discountPercent: 36,
        manufacturer: 'Buderus',
      },
      {
        itemNumber: 'RF-66230',
        description: 'Wilo Hocheffizienzpumpe Stratos PICO plus 25/1-6',
        unit: 'STK',
        priceGross: 420.0,
        discountPercent: 40,
        manufacturer: 'Wilo',
      },
    ],
  },
  {
    id: 'rexel',
    name: 'Rexel Germany',
    trade: 'Elektro',
    brandColor: '#002F6C',
    accentColor: '#00A3E0',
    shopUrl: 'https://www.rexel.de',
    punchoutEndpoint: '/ids/punchout',
    customerNumber: 'REX-KND-11094',
    description: 'Globaler Elektrogroßhändler für industrielle Automation und Gebäudeinstallation.',
    mockArticles: [
      {
        itemNumber: 'REX-44100',
        description: 'Busch-Jaeger Balance SI Wipptaster 1-polig Schließer',
        unit: 'STK',
        priceGross: 12.5,
        discountPercent: 38,
        manufacturer: 'Busch-Jaeger',
      },
      {
        itemNumber: 'REX-88220',
        description: 'Phoenix Contact Reihenklemme PT 2.5 Durchgangsgraue Ausführung',
        unit: 'STK',
        priceGross: 1.15,
        discountPercent: 35,
        manufacturer: 'Phoenix Contact',
      },
    ],
  },
  {
    id: 'wuerth',
    name: 'Adolf Würth B2B',
    trade: 'Universal',
    brandColor: '#CC0000',
    accentColor: '#1A1A1A',
    shopUrl: 'https://eshop.wuerth.de',
    punchoutEndpoint: '/ids/punchout',
    customerNumber: 'WUE-KND-77890',
    description: 'Montage- und Befestigungsmaterial, Dübeltechnik, Schrauben und Werkzeuge.',
    mockArticles: [
      {
        itemNumber: 'WUE-090401',
        description: 'Würth Universalschraube ASSY 4 CSMP Vollgewinde 5x60mm (200 Stk)',
        unit: 'PAK',
        priceGross: 44.5,
        discountPercent: 30,
        manufacturer: 'Würth',
      },
      {
        itemNumber: 'WUE-090402',
        description: 'Würth Allzweckdübel SHARK Pro 8x40mm (100 Stk)',
        unit: 'PAK',
        priceGross: 18.2,
        discountPercent: 35,
        manufacturer: 'Würth',
      },
    ],
  },
];

/**
 * Builds the standard IDS 2.5 Punchout redirect URL.
 */
export function generateIdsPunchoutUrl(
  profile: IdsWholesalerProfile,
  config: IdsPunchoutConfig
): string {
  const base = profile.shopUrl.replace(/\/$/, '') + profile.punchoutEndpoint;
  const params = new URLSearchParams({
    version: '2.5',
    hookurl: config.hookUrl,
    session_id: config.sessionId,
    customercode: config.customerNumber,
    caller_system: 'VIBE_FLOW_OS',
  });

  if (config.orderReference) {
    params.set('order_ref', config.orderReference);
  }

  return `${base}?${params.toString()}`;
}

/**
 * Helper to extract tag content from simple XML.
 */
function extractXmlTag(xml: string, tagName: string): string | null {
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1].trim() : null;
}

/**
 * Parses norm-compliant IDS-Connect 2.5 Cart XML.
 */
export function parseIdsCartXml(xmlString: string): IdsCart {
  const headerXml = extractXmlTag(xmlString, 'header') || '';
  const wholesalerName =
    extractXmlTag(headerXml, 'wholesalerName') ||
    extractXmlTag(xmlString, 'wholesaler') ||
    'Großhandel';
  const cartId =
    extractXmlTag(headerXml, 'cartId') ||
    extractXmlTag(xmlString, 'cartId') ||
    `CART-${Date.now()}`;
  const orderDate =
    extractXmlTag(headerXml, 'orderDate') ||
    new Date().toISOString().slice(0, 10);
  const currency = extractXmlTag(headerXml, 'currency') || 'EUR';
  const customerNumber =
    extractXmlTag(headerXml, 'customerNumber') || undefined;
  const orderReference =
    extractXmlTag(headerXml, 'orderReference') || undefined;

  const header: IdsCartHeader = {
    wholesalerName,
    cartId,
    orderDate,
    currency,
    customerNumber,
    orderReference,
  };

  const items: IdsCartItem[] = [];
  const itemMatches = xmlString.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi);

  let idx = 1;
  for (const match of itemMatches) {
    const itemXml = match[1];
    const itemNumber =
      extractXmlTag(itemXml, 'itemNumber') ||
      extractXmlTag(itemXml, 'artNr') ||
      `ART-${idx}`;
    const description =
      extractXmlTag(itemXml, 'description') ||
      extractXmlTag(itemXml, 'title') ||
      'Großhandels-Artikel';
    const longDescription = extractXmlTag(itemXml, 'longDescription') || undefined;
    const quantity = parseFloat(
      (extractXmlTag(itemXml, 'quantity') || '1').replace(',', '.')
    ) || 1;
    const unit = extractXmlTag(itemXml, 'unit') || 'STK';

    const priceGross = parseFloat(
      (extractXmlTag(itemXml, 'priceGross') || '0').replace(',', '.')
    ) || 0;
    let priceNet = parseFloat(
      (extractXmlTag(itemXml, 'priceNet') || '0').replace(',', '.')
    ) || 0;
    const discountPercent = parseFloat(
      (extractXmlTag(itemXml, 'discountPercent') || '0').replace(',', '.')
    ) || 0;

    if (priceNet === 0 && priceGross > 0) {
      priceNet =
        Math.round(priceGross * (1 - discountPercent / 100) * 100) / 100;
    }

    const totalNet = Math.round(priceNet * quantity * 100) / 100;
    const deliveryTimeDays = parseInt(
      extractXmlTag(itemXml, 'deliveryTimeDays') || '1',
      10
    );
    const manufacturer = extractXmlTag(itemXml, 'manufacturer') || undefined;
    const commodityGroup = extractXmlTag(itemXml, 'commodityGroup') || undefined;
    const ean = extractXmlTag(itemXml, 'ean') || undefined;

    items.push({
      id: `ids_item_${idx}`,
      itemNumber,
      description,
      longDescription,
      quantity,
      unit,
      priceGross,
      priceNet,
      discountPercent,
      totalNet,
      deliveryTimeDays,
      manufacturer,
      commodityGroup,
      ean,
    });
    idx++;
  }

  const totalNet =
    Math.round(items.reduce((sum, it) => sum + it.totalNet, 0) * 100) / 100;
  const totalGross =
    Math.round(items.reduce((sum, it) => sum + it.priceGross * it.quantity, 0) * 100) / 100;
  const totalVat = Math.round(totalNet * 0.19 * 100) / 100;

  return {
    version: '2.5',
    header,
    items,
    totalGross,
    totalNet,
    totalVat,
  };
}

/**
 * Generates norm-compliant IDS 2.5 Cart XML.
 */
export function generateIdsCartXml(cart: IdsCart): string {
  const itemsXml = cart.items
    .map(
      (it, idx) => `    <item id="${idx + 1}">
      <itemNumber>${escapeXml(it.itemNumber)}</itemNumber>
      <description>${escapeXml(it.description)}</description>
      ${it.longDescription ? `<longDescription>${escapeXml(it.longDescription)}</longDescription>` : ''}
      <quantity>${it.quantity.toFixed(2)}</quantity>
      <unit>${escapeXml(it.unit)}</unit>
      <priceGross>${it.priceGross.toFixed(2)}</priceGross>
      <priceNet>${it.priceNet.toFixed(2)}</priceNet>
      ${it.discountPercent !== undefined ? `<discountPercent>${it.discountPercent.toFixed(1)}</discountPercent>` : ''}
      <totalNet>${it.totalNet.toFixed(2)}</totalNet>
      ${it.deliveryTimeDays ? `<deliveryTimeDays>${it.deliveryTimeDays}</deliveryTimeDays>` : ''}
      ${it.manufacturer ? `<manufacturer>${escapeXml(it.manufacturer)}</manufacturer>` : ''}
      ${it.commodityGroup ? `<commodityGroup>${escapeXml(it.commodityGroup)}</commodityGroup>` : ''}
    </item>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<idsCart version="2.5" xmlns="http://www.igh.de/ids/2.5">
  <header>
    <wholesalerName>${escapeXml(cart.header.wholesalerName)}</wholesalerName>
    <cartId>${escapeXml(cart.header.cartId)}</cartId>
    <orderDate>${cart.header.orderDate}</orderDate>
    <currency>${cart.header.currency}</currency>
    ${cart.header.customerNumber ? `<customerNumber>${escapeXml(cart.header.customerNumber)}</customerNumber>` : ''}
    ${cart.header.orderReference ? `<orderReference>${escapeXml(cart.header.orderReference)}</orderReference>` : ''}
  </header>
  <items>
${itemsXml}
  </items>
  <totals>
    <totalGross>${cart.totalGross.toFixed(2)}</totalGross>
    <totalNet>${cart.totalNet.toFixed(2)}</totalNet>
    <totalVat>${cart.totalVat.toFixed(2)}</totalVat>
  </totals>
</idsCart>`;
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Normalizes any wholesale unit string into a valid MeasurementUnit.
 */
export function normalizeMeasurementUnit(rawUnit?: string): MeasurementUnit {
  if (!rawUnit) return 'stk';
  const u = rawUnit.toLowerCase().trim();
  if (u === 'stk' || u === 'stück' || u === 'st' || u === 'pak' || u === 'set') return 'stk';
  if (u === 'm' || u === 'lfm' || u === 'mtr') return 'm';
  if (u === 'm2' || u === 'qm') return 'm2';
  if (u === 'm3' || u === 'cbm') return 'm3';
  if (u === 'h' || u === 'std') return 'h';
  if (u === 'kg') return 'kg';
  return 'psch';
}

/**
 * Bridge: Converts an IDS wholesale item directly into a MeasurementRowItem for VOB-Aufmaß.
 */
export function convertIdsItemToMeasurement(
  item: IdsCartItem,
  markupPercent: number = 30,
  positionNrPrefix: string = 'MAT'
): MeasurementRowItem {
  const salesUnitPrice = Math.round(item.priceNet * (1 + markupPercent / 100) * 100) / 100;
  const totalPrice = Math.round(salesUnitPrice * item.quantity * 100) / 100;

  return {
    id: `m_ids_${item.itemNumber}_${Date.now()}`,
    position_nr: `${positionNrPrefix}.${item.itemNumber}`,
    title: item.description,
    formula: `${item.quantity}`,
    quantity: item.quantity,
    unit: normalizeMeasurementUnit(item.unit),
    unit_price: salesUnitPrice,
    total_price: totalPrice,
    tax_rate_type: 'standard_19',
    notes: `Großhandel: ${item.priceNet.toFixed(2)} € EK/Stk (${item.discountPercent || 0}% Rabatt)`,
  };
}

/**
 * Bridge: Converts an IDS wholesale item into a GaebItem for GAEB-LV.
 */
export function convertIdsItemToGaebItem(
  item: IdsCartItem,
  markupPercent: number = 30,
  oz: string = '01.0010'
): GaebItem {
  const salesUnitPrice = Math.round(item.priceNet * (1 + markupPercent / 100) * 100) / 100;
  const totalPrice = Math.round(salesUnitPrice * item.quantity * 100) / 100;

  return {
    id: `gaeb_ids_${item.itemNumber}_${Date.now()}`,
    oz,
    rNoPart: oz.split('.').pop() || '0010',
    shortText: item.description,
    longText: item.longDescription || `Lieferung und Montage: ${item.description} (Art.-Nr. ${item.itemNumber}).`,
    qty: item.quantity,
    qu: item.unit,
    unitPrice: salesUnitPrice,
    totalPrice: totalPrice,
  };
}
