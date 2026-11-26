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

/**
 * Measurement row item for VOB/Aufmass bridge.
 * Kein externes Craft-Dependency mehr; Typ ist hier definiert.
 */
export type MeasurementRowItem = {
  id: string;
  position_nr: string;
  title: string;
  formula: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
  tax_rate_type: string;
  notes?: string;
};
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
  projectId?: string;   // Für hookToken-Signatur (CSRF/Session-Validierung)
  hookSecret?: string;  // Gemeinsames HMAC-Geheimnis mit dem Webhook-Receiver
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
 * Das hookToken (HMAC-SHA256, max. 4h gültig) wird als Query-Parameter an die
 * hookurl angehängt, damit der Webhook-Receiver die Rückgabe authentifizieren kann.
 */
export function generateIdsPunchoutUrl(
  profile: IdsWholesalerProfile,
  config: IdsPunchoutConfig
): string {
  const base = profile.shopUrl.replace(/\/$/, '') + profile.punchoutEndpoint;

  const hookUrlWithToken = config.hookSecret && config.projectId
    ? `${config.hookUrl}${config.hookUrl.includes('?') ? '&' : '?'}token=${encodeURIComponent(
        createIdsHookToken(config.projectId, config.hookSecret)
      )}`
    : config.hookUrl;

  const params = new URLSearchParams({
    version: '2.5',
    hookurl: hookUrlWithToken,
    session_id: config.sessionId,
    customercode: config.customerNumber,
    caller_system: 'VIBE_FLOW_OS',
  });

  if (config.orderReference) {
    params.set('order_ref', config.orderReference);
  }

  return `${base}?${params.toString()}`;
}

// ============================================
// HMAC-SHA256 hookToken (CSRF/Session-Validierung)
// Pure TypeScript (Browser, Node & Edge kompatibel, ohne node:crypto)
// ============================================

const SHA256_K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

function sha256Rotr(x: number, n: number): number {
  return ((x >>> n) | (x << (32 - n))) >>> 0;
}

function sha256Digest(data: Uint8Array): Uint8Array {
  const h = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ];
  const bitLen = data.length * 8;
  const paddedLength = (((data.length + 8) >> 6) + 1) << 6;
  const padded = new Uint8Array(paddedLength);
  padded.set(data);
  padded[data.length] = 0x80;
  const view = new DataView(padded.buffer);
  view.setUint32(paddedLength - 8, Math.floor(bitLen / 0x100000000));
  view.setUint32(paddedLength - 4, bitLen >>> 0);

  const w = new Uint32Array(64);
  for (let offset = 0; offset < paddedLength; offset += 64) {
    for (let i = 0; i < 16; i++) {
      w[i] = view.getUint32(offset + i * 4);
    }
    for (let i = 16; i < 64; i++) {
      const s0 = sha256Rotr(w[i - 15], 7) ^ sha256Rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = sha256Rotr(w[i - 2], 17) ^ sha256Rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }
    let a = h[0], b = h[1], c = h[2], d = h[3], e = h[4], f = h[5], g = h[6], hh = h[7];
    for (let i = 0; i < 64; i++) {
      const S1 = sha256Rotr(e, 6) ^ sha256Rotr(e, 11) ^ sha256Rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const t1 = (hh + S1 + ch + SHA256_K[i] + w[i]) >>> 0;
      const S0 = sha256Rotr(a, 2) ^ sha256Rotr(a, 13) ^ sha256Rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + maj) >>> 0;
      hh = g; g = f; f = e; e = (d + t1) >>> 0;
      d = c; c = b; b = a; a = (t1 + t2) >>> 0;
    }
    h[0] = (h[0] + a) >>> 0; h[1] = (h[1] + b) >>> 0;
    h[2] = (h[2] + c) >>> 0; h[3] = (h[3] + d) >>> 0;
    h[4] = (h[4] + e) >>> 0; h[5] = (h[5] + f) >>> 0;
    h[6] = (h[6] + g) >>> 0; h[7] = (h[7] + hh) >>> 0;
  }

  const out = new Uint8Array(32);
  const outView = new DataView(out.buffer);
  for (let i = 0; i < 8; i++) {
    outView.setUint32(i * 4, h[i]);
  }
  return out;
}

function hmacSha256Hex(secret: string, message: string): string {
  const encoder = new TextEncoder();
  const rawKey = encoder.encode(secret);
  const keyPadded = new Uint8Array(64);
  keyPadded.set(rawKey.length > 64 ? sha256Digest(rawKey) : rawKey);

  const inner = new Uint8Array(64);
  const outer = new Uint8Array(64);
  for (let i = 0; i < 64; i++) {
    inner[i] = keyPadded[i] ^ 0x36;
    outer[i] = keyPadded[i] ^ 0x5c;
  }

  const msgBytes = encoder.encode(message);
  const innerData = new Uint8Array(64 + msgBytes.length);
  innerData.set(inner);
  innerData.set(msgBytes, 64);
  const innerHash = sha256Digest(innerData);

  const outerData = new Uint8Array(64 + 32);
  outerData.set(outer);
  outerData.set(innerHash, 64);
  const mac = sha256Digest(outerData);

  return Array.from(mac)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Erzeugt ein HMAC-SHA256-signiertes hookToken über projectId + Ablaufzeitpunkt.
 * Standard-Gültigkeit: 4 Stunden (IDS-Connect Webhook-Sicherheit).
 */
export function createIdsHookToken(
  projectId: string,
  secret: string,
  expiresInHours: number = 4
): string {
  // Endliche Werte (auch <= 0 → sofort abgelaufen) durchreichen: sicherer als Hochklemmen.
  // Nur nicht-endliche Eingaben fallen auf den 4h-Standard zurück.
  const safeHours = Number.isFinite(expiresInHours) ? expiresInHours : 4;
  const expiresAtMs = Date.now() + Math.floor(safeHours * 3600 * 1000);
  const payload = `${projectId}.${expiresAtMs}`;
  const signature = hmacSha256Hex(secret, payload);
  return `${payload}.${signature}`;
}

/**
 * Prüft ein hookToken (Signatur via HMAC-SHA256, konstante Zeit, Ablaufzeit max. 4h konfigurierbar).
 */
export function verifyIdsHookToken(
  token: string,
  secret: string
): { valid: boolean; projectId?: string; error?: string } {
  const parts = (token || '').split('.');
  if (parts.length < 3) {
    return { valid: false, error: 'Ungültiges hookToken-Format.' };
  }
  const signature = parts[parts.length - 1];
  const expiresAtMs = Number(parts[parts.length - 2]);
  const projectId = parts.slice(0, -2).join('.');

  if (!Number.isFinite(expiresAtMs) || !projectId) {
    return { valid: false, error: 'Ungültige hookToken-Payload.' };
  }

  const payload = `${projectId}.${expiresAtMs}`;
  const expectedSignature = hmacSha256Hex(secret, payload);
  if (!timingSafeEqualHex(signature, expectedSignature)) {
    return { valid: false, error: 'hookToken-Signatur ungültig (CSRF-Verdacht).' };
  }
  if (Date.now() > expiresAtMs) {
    return { valid: false, projectId, error: 'hookToken abgelaufen (max. 4h Gültigkeit überschritten).' };
  }
  return { valid: true, projectId };
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
 * Parses norm-compliant IDS-Connect 2.5 Cart JSON (AJAX-Payload ohne XML-Wrapper).
 * Strikt typsichere Unknown-Narrowing, keine any-Casts; wirft Error bei fehlendem items-Array.
 */
export function parseIdsCartJson(payload: unknown): IdsCart {
  const isRecord = (v: unknown): v is Record<string, unknown> =>
    typeof v === 'object' && v !== null && !Array.isArray(v);

  const root = isRecord(payload) ? payload : null;
  if (!root) {
    throw new Error('Ungültiges IDS-Connect 2.5 JSON: Erwartet wird ein Cart-Objekt.');
  }

  const headerRaw = isRecord(root['header']) ? root['header'] : {};
  const asTrimmedString = (v: unknown): string | undefined =>
    typeof v === 'string' && v.trim().length > 0 ? v.trim() : undefined;
  const asFiniteNumber = (v: unknown, fallback: number): number =>
    typeof v === 'number' && Number.isFinite(v) ? v : fallback;

  const itemsRaw = root['items'];
  if (!Array.isArray(itemsRaw)) {
    throw new Error('Ungültiges IDS-Connect 2.5 JSON: items-Array fehlt.');
  }

  const items: IdsCartItem[] = itemsRaw.map((entry, idx) => {
    const it = isRecord(entry) ? entry : {};
    const quantity = asFiniteNumber(it['quantity'], 1);
    const priceGross = asFiniteNumber(it['priceGross'], 0);
    let priceNet = asFiniteNumber(it['priceNet'], 0);
    const discountPercent = asFiniteNumber(it['discountPercent'], 0);
    if (priceNet === 0 && priceGross > 0) {
      priceNet = Math.round(priceGross * (1 - discountPercent / 100) * 100) / 100;
    }
    const totalNet = Math.round(priceNet * quantity * 100) / 100;

    return {
      id: asTrimmedString(it['id']) || `ids_item_${idx + 1}`,
      itemNumber: asTrimmedString(it['itemNumber']) || asTrimmedString(it['artNr']) || `ART-${idx + 1}`,
      description: asTrimmedString(it['description']) || asTrimmedString(it['title']) || 'Großhandels-Artikel',
      longDescription: asTrimmedString(it['longDescription']),
      quantity,
      unit: asTrimmedString(it['unit']) || 'STK',
      priceGross,
      priceNet,
      discountPercent,
      totalNet,
      deliveryTimeDays: asFiniteNumber(it['deliveryTimeDays'], 1),
      manufacturer: asTrimmedString(it['manufacturer']),
      commodityGroup: asTrimmedString(it['commodityGroup']),
      ean: asTrimmedString(it['ean']),
    };
  });

  const totalNet =
    Math.round(items.reduce((sum, it) => sum + it.totalNet, 0) * 100) / 100;
  const totalGross =
    Math.round(items.reduce((sum, it) => sum + it.priceGross * it.quantity, 0) * 100) / 100;
  const totalVat = Math.round(totalNet * 0.19 * 100) / 100;

  const header: IdsCartHeader = {
    wholesalerName: asTrimmedString(headerRaw['wholesalerName']) || asTrimmedString(root['wholesaler']) || 'Großhandel',
    cartId: asTrimmedString(headerRaw['cartId']) || asTrimmedString(root['cartId']) || `CART-${Date.now()}`,
    orderDate: asTrimmedString(headerRaw['orderDate']) || new Date().toISOString().slice(0, 10),
    currency: asTrimmedString(headerRaw['currency']) || 'EUR',
    customerNumber: asTrimmedString(headerRaw['customerNumber']),
    orderReference: asTrimmedString(headerRaw['orderReference']),
  };

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
