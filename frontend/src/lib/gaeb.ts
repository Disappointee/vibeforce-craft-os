/**
 * GAEB DA XML 3.2 / 3.3 Engine (X83 Import & X84 Angebotsabgabe)
 *
 * Normkonforme Implementierung des gemeinsamen Ausschusses Elektronik im Bauwesen.
 * Unterstützt:
 * - X83 / D83: Angebotsaufforderung (Import von Ausschreibungs-LVs)
 * - X84: Angebotsabgabe (Export mit Einheitspreisen und Gesamtpreisen)
 * - VOB/A konforme Gliederungshierarchie (Bereiche, Gewerke, Abschnitte, Positionen)
 */

export interface GaebItem {
  id: string;
  rNoPart: string;           // z.B. "0010"
  oz: string;                // Vollständige Ordnungszahl, z.B. "01.01.0010"
  shortText: string;         // Kurztext / Leistungsbeschreibung
  longText?: string;         // Langtext / Ausführungshinweise
  qty: number;               // Menge
  qu: string;                // Mengeneinheit (m, m2, m3, h, Stk, kg, psch)
  unitPrice: number;         // Einheitspreis (EP) netto in EUR
  totalPrice: number;        // Gesamtpreis (GP) netto in EUR = qty * unitPrice
  itemType?: 'normal' | 'base' | 'optional' | 'contingency';
  categoryPath?: string[];   // Pfad der Gewerke/Titel
}

export interface GaebCategory {
  id: string;
  rNoPart: string;           // z.B. "01" oder "01.01"
  label: string;             // z.B. "Rohbauarbeiten" oder "Estricharbeiten"
  subcategories: GaebCategory[];
  items: GaebItem[];
  totalPrice: number;        // Aggregierte Summe aller enthaltenen Positionen
}

export interface GaebBoQ {
  dp: '83' | '84';           // Datenphase 83 (Aufforderung) oder 84 (Abgabe)
  projectName: string;
  projectLabel?: string;
  currency: string;          // ISO 4217, meist 'EUR'
  categories: GaebCategory[];
  allItems: GaebItem[];
  netTotal: number;
  taxRate: number;           // Standard 0.19
  taxAmount: number;
  grossTotal: number;
  date?: string;
}

// ============================================
// XML Helfer (Zero Dependency, Node & Browser)
// ============================================

interface SimpleXmlNode {
  tag: string;
  attrs: Record<string, string>;
  children: SimpleXmlNode[];
  text: string;
}

function unescapeXml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)));
}

function escapeXml(str?: string | null): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Parst XML-String in einen einfachen Knotenbaum.
 * Funktioniert deterministisch in Browser, Node.js und Edge Runtimes ohne externe Libs.
 */
function parseXmlToTree(xml: string): SimpleXmlNode | null {
  // Strip XML declaration, doctype, and comments
  let cleanXml = xml.replace(/<!--[\s\S]*?-->/g, '');
  cleanXml = cleanXml.replace(/<\?[\s\S]*?\?>/g, '');
  cleanXml = cleanXml.replace(/<!DOCTYPE[\s\S]*?>/gi, '');
  cleanXml = cleanXml.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, (_, cdata) => escapeXml(cdata));

  const tagRegex = /<\/([a-zA-Z0-9_:-]+)\s*>|<([a-zA-Z0-9_:-]+)([^>]*?)(\/?)>|([^<]+)/g;
  const root: SimpleXmlNode = { tag: 'ROOT', attrs: {}, children: [], text: '' };
  const stack: SimpleXmlNode[] = [root];

  let match: RegExpExecArray | null;

  while ((match = tagRegex.exec(cleanXml)) !== null) {
    const [, closingTag, openingTag, attrString, selfClosing, textContent] = match;

    if (textContent) {
      const text = textContent.trim();
      if (text && stack.length > 0) {
        stack[stack.length - 1].text += (stack[stack.length - 1].text ? ' ' : '') + unescapeXml(text);
      }
      continue;
    }

    // Schließender Tag
    if (closingTag) {
      const cleanClosing = closingTag.split(':').pop() || closingTag;
      for (let i = stack.length - 1; i > 0; i--) {
        const stackTag = stack[i].tag.split(':').pop() || stack[i].tag;
        if (stackTag.toLowerCase() === cleanClosing.toLowerCase()) {
          stack.length = i;
          break;
        }
      }
      continue;
    }

    // Öffnender Tag
    if (openingTag) {
      const attrs: Record<string, string> = {};
      if (attrString) {
        const attrRegex = /([a-zA-Z0-9_:-]+)=["']([^"']*)["']/g;
        let attrMatch: RegExpExecArray | null;
        while ((attrMatch = attrRegex.exec(attrString)) !== null) {
          attrs[attrMatch[1]] = unescapeXml(attrMatch[2]);
        }
      }

      const node: SimpleXmlNode = {
        tag: openingTag,
        attrs,
        children: [],
        text: '',
      };

      if (stack.length > 0) {
        stack[stack.length - 1].children.push(node);
      }

      if (!selfClosing) {
        stack.push(node);
      }
    }
  }

  return root.children[0] || null;
}

function findChildByTag(node: SimpleXmlNode | null, tag: string): SimpleXmlNode | null {
  if (!node) return null;
  const cleanTag = tag.toLowerCase();
  return (
    node.children.find((c) => {
      const cTag = (c.tag.split(':').pop() || c.tag).toLowerCase();
      return cTag === cleanTag;
    }) || null
  );
}

function findChildrenByTag(node: SimpleXmlNode | null, tag: string): SimpleXmlNode[] {
  if (!node) return [];
  const cleanTag = tag.toLowerCase();
  return node.children.filter((c) => {
    const cTag = (c.tag.split(':').pop() || c.tag).toLowerCase();
    return cTag === cleanTag;
  });
}

function getTextContent(node: SimpleXmlNode | null, tag?: string): string {
  if (!node) return '';
  if (tag) {
    const child = findChildByTag(node, tag);
    return child ? getTextContent(child) : '';
  }
  let result = node.text || '';
  for (const child of node.children) {
    result += ' ' + getTextContent(child);
  }
  return result.trim();
}

// ============================================
// GAEB DA XML Parser
// ============================================

export function parseGaebXml(xmlContent: string): GaebBoQ {
  const rootNode = parseXmlToTree(xmlContent);
  if (!rootNode) {
    throw new Error('Ungültiges XML: Wurzelknoten konnte nicht gelesen werden.');
  }

  // GAEB Wurzel prüfen
  const gaebTag = (rootNode.tag.split(':').pop() || '').toUpperCase();
  if (gaebTag !== 'GAEB') {
    throw new Error(`Keine gültige GAEB-Datei. Gefundener Wurzelknoten: <${rootNode.tag}>`);
  }

  // Projekt-Metadaten
  const prjInfoNode = findChildByTag(rootNode, 'PrjInfo');
  const awardNode = findChildByTag(rootNode, 'Award');
  const awardInfoNode = awardNode ? findChildByTag(awardNode, 'AwardInfo') : null;
  const boqNode = awardNode ? findChildByTag(awardNode, 'BoQ') : findChildByTag(rootNode, 'BoQ');
  const boqInfoNode = boqNode ? findChildByTag(boqNode, 'BoQInfo') : null;

  const projectName =
    getTextContent(prjInfoNode, 'NamePrj') ||
    getTextContent(prjInfoNode, 'LblPrj') ||
    getTextContent(boqInfoNode, 'Name') ||
    'Unbenanntes Bauprojekt';

  const projectLabel = getTextContent(prjInfoNode, 'LblPrj') || getTextContent(boqInfoNode, 'LblBoQ');
  const currency = getTextContent(awardInfoNode, 'Cur') || 'EUR';

  // Datenphase ermitteln (83 = Aufforderung, 84 = Abgabe)
  const dpRaw = getTextContent(awardNode, 'DP') || '83';
  const dp: '83' | '84' = dpRaw === '84' ? '84' : '83';

  // Leistungsverzeichnis Hierarchie traversieren
  const boqBody = boqNode ? findChildByTag(boqNode, 'BoQBody') : null;

  const allItems: GaebItem[] = [];

  function parseCategory(catNode: SimpleXmlNode, parentOzPrefix: string, path: string[]): GaebCategory {
    const rNoPart = catNode.attrs['RNoPart'] || getTextContent(catNode, 'RNoPart') || '01';
    const currentOz = parentOzPrefix ? `${parentOzPrefix}.${rNoPart}` : rNoPart;
    const label = getTextContent(catNode, 'LblTx') || `Abschnitt ${currentOz}`;
    const currentPath = [...path, label];

    const innerBody = findChildByTag(catNode, 'BoQBody') || catNode;
    const subCatNodes = findChildrenByTag(innerBody, 'BoQCtgy');
    const subcategories: GaebCategory[] = [];

    for (const subNode of subCatNodes) {
      subcategories.push(parseCategory(subNode, currentOz, currentPath));
    }

    // Positionen (Items)
    const items: GaebItem[] = [];
    const itemlistNode = findChildByTag(innerBody, 'Itemlist');
    const itemNodes = itemlistNode ? findChildrenByTag(itemlistNode, 'Item') : findChildrenByTag(innerBody, 'Item');

    for (const itNode of itemNodes) {
      const itRNoPart = itNode.attrs['RNoPart'] || getTextContent(itNode, 'RNoPart') || '0010';
      const fullOz = `${currentOz}.${itRNoPart}`;
      const id = itNode.attrs['ID'] || `gaeb_${fullOz.replace(/[^a-zA-Z0-9]/g, '_')}`;

      // Menge
      const qtyStr = getTextContent(itNode, 'Qty').replace(',', '.');
      const qty = parseFloat(qtyStr) || 0;

      // Einheit
      const qu = getTextContent(itNode, 'QU') || 'Stk';

      // Preise (falls bereits vorhanden, z.B. bei X84)
      const upStr = getTextContent(itNode, 'UP').replace(',', '.');
      const itStr = getTextContent(itNode, 'IT').replace(',', '.');
      const unitPrice = parseFloat(upStr) || 0;
      const totalPrice = itStr ? parseFloat(itStr) : Math.round(qty * unitPrice * 100) / 100;

      // Kurztext
      let shortText = '';
      const descNode = findChildByTag(itNode, 'Description');
      if (descNode) {
        const outlineNode = findChildByTag(descNode, 'OutlineText');
        if (outlineNode) {
          shortText = getTextContent(outlineNode);
        }
      }
      if (!shortText) {
        shortText = getTextContent(itNode, 'ShortText') || getTextContent(itNode, 'OutlTxt') || `Position ${fullOz}`;
      }

      // Langtext
      let longText = '';
      if (descNode) {
        const detailNode = findChildByTag(descNode, 'DetailTxt');
        if (detailNode) {
          longText = getTextContent(detailNode);
        }
      }

      const itemObj: GaebItem = {
        id,
        rNoPart: itRNoPart,
        oz: fullOz,
        shortText,
        longText: longText || undefined,
        qty,
        qu,
        unitPrice,
        totalPrice,
        categoryPath: currentPath,
      };

      items.push(itemObj);
      allItems.push(itemObj);
    }

    // Kategoriensumme berechnen
    const itemsTotal = items.reduce((sum, it) => sum + it.totalPrice, 0);
    const subCatsTotal = subcategories.reduce((sum, sc) => sum + sc.totalPrice, 0);
    const catTotal = Math.round((itemsTotal + subCatsTotal) * 100) / 100;

    return {
      id: `cat_${currentOz.replace(/[^a-zA-Z0-9]/g, '_')}`,
      rNoPart,
      label,
      subcategories,
      items,
      totalPrice: catTotal,
    };
  }

  const categories: GaebCategory[] = [];
  if (boqBody) {
    const topCatNodes = findChildrenByTag(boqBody, 'BoQCtgy');
    for (const cNode of topCatNodes) {
      categories.push(parseCategory(cNode, '', []));
    }
  }

  // Gesamtbeträge
  const netTotal = Math.round(allItems.reduce((sum, it) => sum + it.totalPrice, 0) * 100) / 100;
  const taxRate = 0.19;
  const taxAmount = Math.round(netTotal * taxRate * 100) / 100;
  const grossTotal = Math.round((netTotal + taxAmount) * 100) / 100;

  return {
    dp,
    projectName,
    projectLabel,
    currency,
    categories,
    allItems,
    netTotal,
    taxRate,
    taxAmount,
    grossTotal,
    date: new Date().toISOString().split('T')[0],
  };
}

// ============================================
// GAEB DA XML X84 Generator
// ============================================

export function generateGaebX84Xml(boq: GaebBoQ): string {
  const dateStr = new Date().toISOString().split('T')[0];
  const timeStr = new Date().toTimeString().split(' ')[0];

  function renderCategoryXml(cat: GaebCategory): string {
    let xml = `      <BoQCtgy RNoPart="${escapeXml(cat.rNoPart)}">\n`;
    xml += `        <LblTx>${escapeXml(cat.label)}</LblTx>\n`;
    xml += `        <BoQBody>\n`;

    // Unterkategorien
    for (const sub of cat.subcategories) {
      xml += renderCategoryXml(sub);
    }

    // Positionen
    if (cat.items.length > 0) {
      xml += `          <Itemlist>\n`;
      for (const item of cat.items) {
        const unitPriceFormatted = item.unitPrice.toFixed(2);
        const totalPriceFormatted = item.totalPrice.toFixed(2);

        xml += `            <Item ID="${escapeXml(item.id)}" RNoPart="${escapeXml(item.rNoPart)}">\n`;
        xml += `              <Qty>${item.qty.toFixed(3)}</Qty>\n`;
        xml += `              <QU>${escapeXml(item.qu)}</QU>\n`;
        xml += `              <UP>${unitPriceFormatted}</UP>\n`;
        xml += `              <IT>${totalPriceFormatted}</IT>\n`;
        xml += `              <Description>\n`;
        xml += `                <OutlineText>\n`;
        xml += `                  <OutlTxt>\n`;
        xml += `                    <TextOutlTxt>${escapeXml(item.shortText)}</TextOutlTxt>\n`;
        xml += `                  </OutlTxt>\n`;
        xml += `                </OutlineText>\n`;
        if (item.longText) {
          xml += `                <DetailTxt>\n`;
          xml += `                  <Text>\n`;
          xml += `                    <p>${escapeXml(item.longText)}</p>\n`;
          xml += `                  </Text>\n`;
          xml += `                </DetailTxt>\n`;
        }
        xml += `              </Description>\n`;
        xml += `            </Item>\n`;
      }
      xml += `          </Itemlist>\n`;
    }

    // Kategorie-Summe
    xml += `          <TotCtgy>${cat.totalPrice.toFixed(2)}</TotCtgy>\n`;
    xml += `        </BoQBody>\n`;
    xml += `      </BoQCtgy>\n`;
    return xml;
  }

  let bodyCategoriesXml = '';
  for (const cat of boq.categories) {
    bodyCategoriesXml += renderCategoryXml(cat);
  }

  const netFormatted = boq.netTotal.toFixed(2);
  const taxFormatted = boq.taxAmount.toFixed(2);
  const grossFormatted = boq.grossTotal.toFixed(2);

  return `<?xml version="1.0" encoding="UTF-8"?>
<GAEB xmlns="http://www.gaeb.de/GAEB_DA_XML/200407">
  <GAEBInfo>
    <Version>3.2</Version>
    <VersDate>2013-08</VersDate>
    <Date>${dateStr}</Date>
    <Time>${timeStr}</Time>
    <ProgSys>Vibeforce Flow OS VIBE Craft</ProgSys>
  </GAEBInfo>
  <PrjInfo>
    <NamePrj>${escapeXml(boq.projectName)}</NamePrj>
    <LblPrj>${escapeXml(boq.projectLabel || boq.projectName)}</LblPrj>
    <Cur>${escapeXml(boq.currency || 'EUR')}</Cur>
  </PrjInfo>
  <Award>
    <DP>84</DP>
    <AwardInfo>
      <Cur>${escapeXml(boq.currency || 'EUR')}</Cur>
    </AwardInfo>
    <BoQ>
      <BoQInfo>
        <Name>Angebotsabgabe X84</Name>
        <LblBoQ>${escapeXml(boq.projectName)} - Angebotsabgabe</LblBoQ>
      </BoQInfo>
      <BoQBody>
${bodyCategoriesXml}      </BoQBody>
      <BoQSummary>
        <TotSub>${netFormatted}</TotSub>
        <TotAmnt>${grossFormatted}</TotAmnt>
        <VATRate>${(boq.taxRate * 100).toFixed(0)}</VATRate>
        <VATAmnt>${taxFormatted}</VATAmnt>
      </BoQSummary>
    </BoQ>
  </Award>
</GAEB>
`;
}

// ============================================
// Brücke: GAEB Item -> VOB Aufmaß Item
// ============================================

export function convertGaebItemToMeasurement(item: GaebItem): {
  id: string;
  position_nr: string;
  title: string;
  formula: string;
  quantity: number;
  unit: 'm' | 'm2' | 'm3' | 'h' | 'stk' | 'kg' | 'psch';
  unit_price: number;
  total_price: number;
  notes: string;
} {
  // Mengeneinheit normalisieren
  const rawUnit = item.qu.toLowerCase().replace('²', '2').replace('³', '3');
  let unit: 'm' | 'm2' | 'm3' | 'h' | 'stk' | 'kg' | 'psch' = 'stk';

  if (rawUnit.includes('m3') || rawUnit.includes('cbm')) unit = 'm3';
  else if (rawUnit.includes('m2') || rawUnit.includes('qm')) unit = 'm2';
  else if (rawUnit === 'm' || rawUnit.includes('lfm') || rawUnit.includes('meter')) unit = 'm';
  else if (rawUnit.includes('std') || rawUnit === 'h' || rawUnit.includes('stunde')) unit = 'h';
  else if (rawUnit.includes('kg')) unit = 'kg';
  else if (rawUnit.includes('psch') || rawUnit.includes('pausch')) unit = 'psch';

  return {
    id: `m_${item.id}`,
    position_nr: item.oz,
    title: item.shortText,
    formula: item.qty.toString(),
    quantity: item.qty,
    unit,
    unit_price: item.unitPrice,
    total_price: item.totalPrice,
    notes: item.categoryPath && item.categoryPath.length > 0 ? item.categoryPath.join(' > ') : 'GAEB Import',
  };
}

// ============================================
// Muster-LV Generator für Demos & Tests
// ============================================

export function getSampleGaebBoQ(): GaebBoQ {
  const item1: GaebItem = {
    id: 'pos_01_01_0010',
    rNoPart: '0010',
    oz: '01.01.0010',
    shortText: 'Bauzaun liefern, aufstellen und vorhalten',
    longText: 'Mobilzaun aus verzinktem Drahtgitter, Elementhöhe min. 2.00 m, inkl. Betonfüßen und Verbindungsschellen.',
    qty: 85.0,
    qu: 'm',
    unitPrice: 12.5,
    totalPrice: 1062.5,
    categoryPath: ['01 Baustelleneinrichtung', '01.01 Sicherungsmaßnahmen'],
  };

  const item2: GaebItem = {
    id: 'pos_01_02_0010',
    rNoPart: '0010',
    oz: '01.02.0010',
    shortText: 'Baugrube ausheben und Boden seitlich lagern',
    longText: 'Bodenklasse 3 bis 5 nach DIN 18300, Aushubtiefe bis 2.50 m.',
    qty: 240.0,
    qu: 'm3',
    unitPrice: 28.0,
    totalPrice: 6720.0,
    categoryPath: ['01 Baustelleneinrichtung', '01.02 Erdarbeiten'],
  };

  const item3: GaebItem = {
    id: 'pos_02_01_0010',
    rNoPart: '0010',
    oz: '02.01.0010',
    shortText: 'Zementestrich CT-C25-F4 auf Dämmschicht',
    longText: 'DIN 18560 Teil 2, Nenndicke 65 mm, güteüberwacht, inkl. Randdämmstreifen 10 mm.',
    qty: 180.5,
    qu: 'm2',
    unitPrice: 36.5,
    totalPrice: 6588.25,
    categoryPath: ['02 Ausbauarbeiten', '02.01 Estrich'],
  };

  const item4: GaebItem = {
    id: 'pos_02_02_0010',
    rNoPart: '0010',
    oz: '02.02.0010',
    shortText: 'Gipskartonständerwand F90 beidseitig beplankt',
    longText: 'Metall-Einfachständerwerk CW 75, beidseitig 2x12.5 mm Feuerschutzplatten, Mineralwolledämmung 60 mm.',
    qty: 145.0,
    qu: 'm2',
    unitPrice: 62.0,
    totalPrice: 8990.0,
    categoryPath: ['02 Ausbauarbeiten', '02.02 Trockenbau'],
  };

  const cat1_1: GaebCategory = {
    id: 'cat_01_01',
    rNoPart: '01',
    label: 'Sicherungsmaßnahmen',
    subcategories: [],
    items: [item1],
    totalPrice: 1062.5,
  };

  const cat1_2: GaebCategory = {
    id: 'cat_01_02',
    rNoPart: '02',
    label: 'Erdarbeiten',
    subcategories: [],
    items: [item2],
    totalPrice: 6720.0,
  };

  const cat1: GaebCategory = {
    id: 'cat_01',
    rNoPart: '01',
    label: 'Baustelleneinrichtung & Rohbau',
    subcategories: [cat1_1, cat1_2],
    items: [],
    totalPrice: 7782.5,
  };

  const cat2_1: GaebCategory = {
    id: 'cat_02_01',
    rNoPart: '01',
    label: 'Estricharbeiten',
    subcategories: [],
    items: [item3],
    totalPrice: 6588.25,
  };

  const cat2_2: GaebCategory = {
    id: 'cat_02_02',
    rNoPart: '02',
    label: 'Trockenbauarbeiten',
    subcategories: [],
    items: [item4],
    totalPrice: 8990.0,
  };

  const cat2: GaebCategory = {
    id: 'cat_02',
    rNoPart: '02',
    label: 'Ausbauarbeiten',
    subcategories: [cat2_1, cat2_2],
    items: [],
    totalPrice: 15578.25,
  };

  const allItems = [item1, item2, item3, item4];
  const netTotal = 7782.5 + 15578.25; // 23360.75
  const taxRate = 0.19;
  const taxAmount = Math.round(netTotal * taxRate * 100) / 100; // 4438.54
  const grossTotal = Math.round((netTotal + taxAmount) * 100) / 100; // 27799.29

  return {
    dp: '84',
    projectName: 'Neubau Gewerbehalle Nord',
    projectLabel: 'Ausschreibung Los 03 - Ausbau & Rohbau',
    currency: 'EUR',
    categories: [cat1, cat2],
    allItems,
    netTotal,
    taxRate,
    taxAmount,
    grossTotal,
    date: new Date().toISOString().split('T')[0],
  };
}

// ============================================
// GAEB 90 (.D83) Lightweight Spaltenparser (Audit M007, Aufgabe 4)
// Zeilenbasiertes DOS-Format: Satzarten 00/01/03/10/20-26 in Spalte 1-2.
// ============================================

/**
 * Moji-Bake-Mappings: CP437/CP850-Bytes, die beim Einlesen fälschlich als
 * Latin-1-Steuerzeichen (U+0080-U+009F) interpretiert wurden.
 */
const GAEB90_MOJIBAKE_MAP: Readonly<Record<string, string>> = {
  '\u0081': 'ü', '\u0084': 'ä', '\u0085': 'à', '\u0086': 'å', '\u0087': 'ç',
  '\u008A': 'è', '\u008E': 'Ä', '\u0090': 'É', '\u0091': 'æ', '\u0092': 'Æ',
  '\u0093': 'ô', '\u0094': 'ö', '\u0095': 'ò', '\u0096': 'û', '\u0097': 'ù',
  '\u0098': 'ÿ', '\u0099': 'Ö', '\u009A': 'Ü',
};

/** Mappings für Windows-1252 Fehlinterpretationen von DOS-Bytes. */
const GAEB90_WIN1252_MISREAD_MAP: Readonly<Record<string, string>> = {
  '\u20AC': 'Ç', '\u201A': 'é', '\u0192': 'â', '\u201E': 'ä', '\u2026': 'à',
  '\u2020': 'å', '\u2021': 'ç', '\u02C6': 'ê', '\u2030': 'ë', '\u0160': 'è',
  '\u2039': 'ï', '\u0152': 'î', '\u017D': 'Ä', '\u2018': 'æ', '\u2019': 'Æ',
  '\u201C': 'ô', '\u201D': 'ö', '\u2022': 'ò', '\u2013': 'û', '\u2014': 'ù',
  '\u02DC': 'ÿ', '\u2122': 'Ö', '\u0161': 'Ü', '\u00E1': 'ß', '\u2139': 'ò',
};

/** CP437 Standard-Byte-Tabelle für den oberen Bereich 0x80 bis 0xFF. */
const CP437_BYTE_MAP: string[] = [
  /* 0x80 */ 'Ç', 'ü', 'é', 'â', 'ä', 'à', 'å', 'ç', 'ê', 'ë', 'è', 'ï', 'î', 'ì', 'Ä', 'Å',
  /* 0x90 */ 'É', 'æ', 'Æ', 'ô', 'ö', 'ò', 'û', 'ù', 'ÿ', 'Ö', 'Ü', '¢', '£', '¥', '₧', 'ƒ',
  /* 0xA0 */ 'á', 'í', 'ó', 'ú', 'ñ', 'Ñ', 'ª', 'º', '¿', '⌐', '¬', '½', '¼', '¡', '«', '»',
  /* 0xB0 */ '░', '▒', '▓', '│', '┤', '╡', '╢', '╖', '╕', '╣', '║', '╗', '╝', '╜', '╛', '┐',
  /* 0xC0 */ '└', '┴', '┬', '├', '─', '┼', '╞', '╟', '╚', '╔', '╩', '╦', '╠', '═', '╬', '╧',
  /* 0xD0 */ '╨', '╤', '╥', '╙', '╘', '╒', '╓', '╫', '╪', '┘', '┌', '█', '▄', '▌', '▐', '▀',
  /* 0xE0 */ 'α', 'ß', 'Γ', 'π', 'Σ', 'σ', 'µ', 'τ', 'Φ', 'Θ', 'Ω', 'δ', '∞', 'φ', 'ε', '∩',
  /* 0xF0 */ '≡', '±', '≥', '≤', '⌠', '⌡', '÷', '≈', '°', '∙', '·', '√', 'ⁿ', '²', '■', ' ',
];

/** Dekodiert ein einzelnes DOS-Byte (CP437/CP850-Toleranz). */
function decodeCp437Byte(byte: number): string {
  if (byte < 0x80) return String.fromCharCode(byte);
  if (byte === 0xDF) return 'ß'; // CP850 Eszett
  if (byte === 0xFD) return '²'; // CP850 Quadrat
  if (byte === 0xFC) return '³'; // CP850 Kubik
  const char = CP437_BYTE_MAP[byte - 0x80];
  return char !== undefined ? char : String.fromCharCode(byte);
}

/**
 * Dekodiert Roh-Bytes einer GAEB-90-Datei verlustfrei nach UTF-8.
 * Prüft auf natives UTF-8, Windows-1252 und CP437/CP850 via Frequenzanalyse.
 */
export function decodeGaeb90Bytes(data: Uint8Array): string {
  if (!data || data.length === 0) return '';

  // 1. Prüfen auf valides UTF-8 ohne C1-Steuerzeichen
  try {
    const utf8Decoder = new TextDecoder('utf-8', { fatal: true });
    const utf8Str = utf8Decoder.decode(data);
    if (!/[\u0080-\u009F]/.test(utf8Str)) {
      return utf8Str.replace(/^\uFEFF/, '');
    }
  } catch {
    // Keine gültige UTF-8-Sequenz => Legacy-Encoding
  }

  // 2. Frequenzanalyse zwischen CP437 und Windows-1252
  let cp437Hits = 0;
  let win1252Hits = 0;
  for (let i = 0; i < data.length; i++) {
    const b = data[i];
    if (b === 0x84 || b === 0x94 || b === 0x81 || b === 0x8E || b === 0x99 || b === 0x9A || b === 0xE1) {
      cp437Hits++;
    }
    if (b === 0xE4 || b === 0xF6 || b === 0xFC || b === 0xC4 || b === 0xD6 || b === 0xDC || b === 0xDF) {
      win1252Hits++;
    }
  }

  if (win1252Hits > cp437Hits) {
    try {
      return new TextDecoder('windows-1252').decode(data).replace(/^\uFEFF/, '');
    } catch {
      // Fallback auf CP437
    }
  }

  // 3. CP437/CP850-Dekodierung
  let out = '';
  for (let i = 0; i < data.length; i++) {
    out += decodeCp437Byte(data[i]);
  }
  return out.replace(/^\uFEFF/, '');
}

/** Bekannte Mengeneinheiten des GAEB-90-Formats (normalisiert auf Kanonikalia). */
const GAEB90_UNIT_MAP: Readonly<Record<string, string>> = {
  m: 'm',
  m2: 'm2',
  'm²': 'm2',
  m3: 'm3',
  'm³': 'm3',
  std: 'h',
  h: 'h',
  stk: 'stk',
  kg: 'kg',
  psch: 'psch',
  t: 't',
  lfm: 'lfm',
};

/** Zeilenbeginn einer gültigen GAEB-90-Satzart (Spalte 1-2). */
const GAEB90_RECORD_TYPE_PATTERN = /^(?:00|01|03|10|2[0-6])(?:\s|$)/;

/**
 * Überführt versehentlich als Latin-1 gelesene C1-Steuerzeichen in saubere Umlaute.
 * B6-Schutz: Typografische Zeichen (wie „...“ oder ™) werden NIEMALS blind überschrieben.
 */
export function normalizeGaeb90Encoding(rawContent: string): string {
  if (!rawContent) return '';
  let out = rawContent.replace(/^\uFEFF/, '');

  // 1. C1-Steuerzeichen (U+0080 bis U+009F), die bei Latin-1-Misreads entstehen (z.B. \u0081 -> ü)
  if (/[\u0081\u0084\u0085\u0086\u0087\u008A\u008E\u0090\u0091\u0092\u0093\u0094\u0095\u0096\u0097\u0098\u0099\u009A]/.test(out)) {
    out = out.replace(
      /[\u0081\u0084\u0085\u0086\u0087\u008A\u008E\u0090\u0091\u0092\u0093\u0094\u0095\u0096\u0097\u0098\u0099\u009A]/g,
      (char) => GAEB90_MOJIBAKE_MAP[char] ?? char,
    );
  }

  // 2. Kontextsensitiver Schutz für typografische Zeichen:
  // Echte Anführungszeichenpaare „...“ und „...” temporär schützen
  const quoteTokens: string[] = [];
  out = out.replace(/„[^”„\r\n]{1,100}[”"]/g, (match) => {
    quoteTokens.push(match);
    return `___GENUINE_QUOTE_${quoteTokens.length - 1}___`;
  });

  // Jetzt können isolierte \u201E (ä) und \u201D (ö) an Wortgrenzen repariert werden:
  out = out.replace(/„(?=[a-zäöüß])/gi, 'ä');
  out = out.replace(/(?<=[a-zäöüß])”/gi, 'ö');
  // Trademark ™ nur ersetzen, wenn von Kleinbuchstaben gefolgt (z.B. ™l -> Öl), nicht bei Produkt™
  out = out.replace(/™(?=[a-zäöüß])/gi, 'Ö');
  // \u00E1 (á) in deutschen Wortmustern (z.B. Betonfüáe, Straáe, groá) zu ß
  out = out.replace(/([a-zäöü])á([a-zäöü])/gi, '$1ß$2');

  // Zitate unberührt wieder einsetzen
  out = out.replace(/___GENUINE_QUOTE_(\d+)___/g, (_, idx) => quoteTokens[Number(idx)] || '');

  // Nicht-druckbare Steuerzeichen entfernen (außer \r, \n, \t)
  out = out.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\u00AD]/g, '');
  return out;
}

/**
 * Formaterkennung: GAEB DA XML (BOM/XML-Deklaration/GAEB-Wurzelelement),
 * zeilenbasiertes GAEB 90 (Satzarten in Spalte 1-2) oder unbekannt.
 */
export function detectGaebFormat(content: string): 'GAEB_XML' | 'GAEB_90' | 'UNKNOWN' {
  if (!content) return 'UNKNOWN';
  const withoutBom = content.replace(/^\uFEFF/, '');
  const trimmed = withoutBom.trim();
  if (!trimmed) return 'UNKNOWN';

  if (
    /^<\?xml/i.test(trimmed) ||
    /^<[a-zA-Z]/.test(trimmed) ||
    /<\s*(?:[a-zA-Z0-9_.-]+:)?GAEB(?:Info)?[\s/>]/i.test(withoutBom)
  ) {
    return 'GAEB_XML';
  }

  const lines = trimmed.split(/\r\n|\r|\n/);
  let recordHits = 0;
  let nonEmptyLines = 0;
  for (const line of lines) {
    const currentLine = line.trim();
    if (!currentLine || currentLine.includes('<')) continue;
    nonEmptyLines += 1;
    if (GAEB90_RECORD_TYPE_PATTERN.test(currentLine)) recordHits += 1;
  }
  if (recordHits >= 2 && recordHits * 2 >= nonEmptyLines) return 'GAEB_90';
  return 'UNKNOWN';
}

/**
 * Feldsemantische Zahlenparsung für GAEB 90 (B8-Härtung).
 * Verhindert, dass 3-Nachkommastellen-Mengen ('85.000') durch Tausender-Heuristik
 * fälschlich zu 85000 werden (Faktor-1000-Fehler).
 */
export function extractG90Number(token: string, context: 'quantity' | 'price'): number | null {
  const cleaned = token.replace(/[^\d.,]/g, '');
  if (!cleaned || !/\d/.test(cleaned)) return null;

  const hasDot = cleaned.includes('.');
  const hasComma = cleaned.includes(',');

  // Fall 1: Sowohl Punkt als auch Komma vorhanden (z. B. '1.062,50' oder '1,234.56')
  if (hasDot && hasComma) {
    const lastDot = cleaned.lastIndexOf('.');
    const lastComma = cleaned.lastIndexOf(',');
    let thousands = '.';
    let decimal = ',';
    if (lastDot > lastComma) {
      thousands = ',';
      decimal = '.';
    }
    const normalized = cleaned.split(thousands).join('').replace(decimal, '.');
    const val = Number.parseFloat(normalized);
    return Number.isFinite(val) ? val : null;
  }

  // Fall 2: Nur EIN Trennzeichen (entweder Punkt oder Komma)
  const sep = hasDot ? '.' : (hasComma ? ',' : '');
  if (!sep) {
    const val = Number.parseFloat(cleaned);
    return Number.isFinite(val) ? val : null;
  }

  const parts = cleaned.split(sep);
  // Mehr als 2 Segmente (z. B. '1.234.567' oder '1,000,000') => eindeutige Tausenderblöcke
  if (parts.length > 2) {
    const normalized = parts.join('');
    const val = Number.parseFloat(normalized);
    return Number.isFinite(val) ? val : null;
  }

  // Genau 2 Segmente (z. B. '85.000', '1.500', '12.50', '1.062')
  const decimalPart = parts[1] ?? '';

  if (context === 'quantity') {
    // Im GAEB (DIN 1333 Satzart 25) werden Mengen mit 3 Nachkommastellen geführt ('85.000' Stk = 85).
    // Ein einzelner Trenner ist bei Mengenangaben IMMER Dezimaltrenner!
    const normalized = `${parts[0]}.${decimalPart}`;
    const val = Number.parseFloat(normalized);
    return Number.isFinite(val) ? val : null;
  }

  // context === 'price':
  // Wenn 2 Dezimalstellen ('12.50', '12,50') oder Komma ('85,000') => Dezimal.
  if (decimalPart.length === 2 || hasComma) {
    const normalized = `${parts[0]}.${decimalPart}`;
    const val = Number.parseFloat(normalized);
    return Number.isFinite(val) ? val : null;
  }

  // Preis mit Punkt und genau 3 Ziffern ohne Komma ('1.250') => Tausenderblock (1250 €)
  if (hasDot && decimalPart.length === 3) {
    const normalized = parts.join('');
    const val = Number.parseFloat(normalized);
    return Number.isFinite(val) ? val : null;
  }

  const normalized = `${parts[0]}.${decimalPart}`;
  const val = Number.parseFloat(normalized);
  return Number.isFinite(val) ? val : null;
}

/** Erkennt eine bekannte Mengeneinheit in einem Token (case-insensitive). */
function normalizeGaeb90UnitToken(token: string): string | null {
  const cleaned = token.toLowerCase().replace(/[.,;:]$/, '');
  const mapped = GAEB90_UNIT_MAP[cleaned];
  if (mapped !== undefined) return mapped;
  // Alphabetische Einheiten erhalten (z. B. 'ktn', 'rolle', 'pauschal')
  if (/^[a-zäöüß²³/]+$/i.test(cleaned) && !/\d/.test(cleaned)) {
    return cleaned;
  }
  return null;
}

/** Aggregiert Kategorie-Summen bottom-up (Positionen + Unterkategorien). */
function computeGaeb90CategoryTotal(category: GaebCategory): number {
  const itemsTotal = category.items.reduce((sum, item) => sum + item.totalPrice, 0);
  const subTotal = category.subcategories.reduce((sum, sub) => sum + computeGaeb90CategoryTotal(sub), 0);
  category.totalPrice = Math.round((itemsTotal + subTotal) * 100) / 100;
  return category.totalPrice;
}

/**
 * Parst zeilenbasierte GAEB-90-Dateien (.D83) in ein typisiertes GaebBoQ.
 * Robust gegen leere/inkonsistente Eingaben: Es wird niemals geworfen,
 * unvollständige Positionen werden fortlaufend nummeriert.
 */
function parseGaeb90FromText(content: string): GaebBoQ {
  const lines = (content || '').split(/\r\n|\r|\n/);

  const categories: GaebCategory[] = [];
  const allItems: GaebItem[] = [];
  const categoryStack: GaebCategory[] = [];
  const pathStack: string[][] = [];
  const ozStack: string[] = [];

  let dp: '83' | '84' = '83';
  let projectName = '';
  let currency = '';
  let currentItem: GaebItem | null = null;
  let currentLongText = '';
  let previousRecordType = '';
  let categoryCounter = 0;
  let autoOzCounter = 0;
  let defaultCategory: GaebCategory | null = null;

  const round2 = (value: number): number => Math.round(value * 100) / 100;

  const flushLongText = (): void => {
    if (currentItem) {
      const joined = currentLongText.trim();
      if (joined) currentItem.longText = joined;
    }
  };

  const getTargetCategory = (): { category: GaebCategory; path: string[] } => {
    if (categoryStack.length > 0 && pathStack.length > 0) {
      return {
        category: categoryStack[categoryStack.length - 1],
        path: pathStack[pathStack.length - 1],
      };
    }
    if (!defaultCategory) {
      defaultCategory = {
        id: 'cat_gaeb90_general',
        rNoPart: '00',
        label: 'Allgemeine Positionen',
        subcategories: [],
        items: [],
        totalPrice: 0,
      };
      categories.push(defaultCategory);
    }
    return {
      category: defaultCategory,
      path: [defaultCategory.label],
    };
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (!line) continue;
    if (line.startsWith('#') || line.startsWith(';')) continue;

    const recordType = line.slice(0, 2);
    const rest = line.slice(2).trim();

    if (recordType === '00') {
      // Datenkopf: Projektname, DP 83/84, Währung
      if (/\bDP\s*-?\s*84\b/i.test(rest) || /\bDA\s*-?\s*84\b/i.test(rest)) {
        dp = '84';
      }
      if (/\b(EUR|EURO|DM)\b/i.test(rest)) {
        const curMatch = rest.match(/\b(EUR|EURO|DM)\b/i);
        if (curMatch) {
          currency = curMatch[1].toUpperCase() === 'EURO' ? 'EUR' : curMatch[1].toUpperCase();
        }
      }
      const cleanedHeader = rest
        .replace(/\b(?:DP|DA)\s*-?\s*(?:83|84)\b/gi, '')
        .replace(/\b(?:EUR|EURO|DM)\b/gi, '')
        .replace(/^[0-9\s.,;:-]+/, '')
        .trim();
      if (cleanedHeader && !projectName) {
        projectName = cleanedHeader;
      }
    } else if (recordType === '10') {
      // Hierarchie-/Titelzeile: Gewerk, Abschnitt, Titel (aufeinanderfolgende 10-Zeilen verschachteln)
      flushLongText();
      currentItem = null;

      categoryCounter += 1;
      const seqNo = String(categoryCounter).padStart(2, '0');
      const labelMatch = rest.match(/^(\d+(?:\.\d+)*)[.)\-\s]+(.*)$/);
      const rNoPart = labelMatch ? labelMatch[1] : seqNo;
      const label = (labelMatch ? labelMatch[2] : rest).trim() || `Abschnitt ${seqNo}`;
      const depth = previousRecordType === '10' ? categoryStack.length : 0;
      categoryStack.length = depth;
      pathStack.length = depth;
      ozStack.length = depth;
      const parentOz = depth > 0 ? ozStack[depth - 1] : '';
      const currentOz = parentOz ? `${parentOz}.${rNoPart}` : rNoPart;
      const parentCategory = depth > 0 ? categoryStack[depth - 1] : null;
      const parentPath = depth > 0 ? pathStack[depth - 1] : [];
      const category: GaebCategory = {
        id: `cat_${currentOz.replace(/[^a-zA-Z0-9]/g, '_')}`,
        rNoPart,
        label,
        subcategories: [],
        items: [],
        totalPrice: 0,
      };
      if (parentCategory) {
        parentCategory.subcategories.push(category);
      } else {
        categories.push(category);
      }
      categoryStack.push(category);
      ozStack.push(currentOz);
      pathStack.push([...parentPath, label]);
    } else if (recordType === '21') {
      // Positionszeile: Ordnungszahl + Kurztext
      flushLongText();
      let oz = '';
      let shortText = rest;
      const ozWithText = rest.match(/^(\d+(?:\.\d+)*)[.\s]\s*(.+)$/);
      const ozOnly = ozWithText ? null : rest.match(/^(\d+(?:\.\d+)*)\.?\s*$/);
      if (ozWithText) {
        oz = ozWithText[1];
        shortText = ozWithText[2].trim();
      } else if (ozOnly) {
        oz = ozOnly[1];
        shortText = '';
      }
      if (!oz) {
        autoOzCounter += 1;
        oz = String(autoOzCounter).padStart(4, '0');
      }
      const rNoPart = oz.lastIndexOf('.') >= 0 ? oz.slice(oz.lastIndexOf('.') + 1) : oz;
      const target = getTargetCategory();
      const item: GaebItem = {
        id: `gaeb90_${oz.replace(/[^a-zA-Z0-9]/g, '_')}_${allItems.length + 1}`,
        rNoPart,
        oz,
        shortText: shortText || `Position ${oz}`,
        qty: 0,
        qu: '',
        unitPrice: 0,
        totalPrice: 0,
        categoryPath: [...target.path],
      };
      target.category.items.push(item);
      allItems.push(item);
      currentItem = item;
      currentLongText = '';
    } else if (recordType === '25') {
      // Mengen-/Einheitszeile: Menge, Einheit, EP, GP der letzten 21-Position
      if (!currentItem || !rest) continue;
      const tokens = rest.split(/\s+/).filter(Boolean);
      let qty: number | null = null;
      let unitPrice: number | null = null;
      let givenTotal: number | null = null;
      let unit: string | null = null;

      for (const token of tokens) {
        const unitCandidate = normalizeGaeb90UnitToken(token);
        if (unitCandidate) {
          if (unit === null) unit = unitCandidate;
          continue;
        }
        if (qty === null) {
          const q = extractG90Number(token, 'quantity');
          if (q !== null) {
            qty = q;
            continue;
          }
        }
        if (unitPrice === null) {
          const ep = extractG90Number(token, 'price');
          if (ep !== null) {
            unitPrice = ep;
            continue;
          }
        }
        if (givenTotal === null) {
          const gp = extractG90Number(token, 'price');
          if (gp !== null) {
            givenTotal = gp;
            continue;
          }
        }
      }
      currentItem.qty = qty ?? 0;
      // B9: Default auf 'Stk' wenn keine Einheit erkannt/vorhanden ist (Align mit XML-Parser)
      currentItem.qu = unit || 'Stk';
      currentItem.unitPrice = unitPrice ?? 0;
      currentItem.totalPrice = givenTotal !== null ? round2(givenTotal) : round2((qty ?? 0) * (unitPrice ?? 0));
    } else if (recordType === '26') {
      // Langtextzeile: an aktuelle Position anhängen
      if (currentItem && rest) {
        currentLongText = currentLongText ? `${currentLongText} ${rest}` : rest;
      }
    }

    previousRecordType = recordType;
  }

  flushLongText();

  for (const category of categories) {
    computeGaeb90CategoryTotal(category);
  }

  const netTotal = round2(allItems.reduce((sum, item) => sum + item.totalPrice, 0));
  const taxRate = 0.19;
  const taxAmount = round2(netTotal * taxRate);
  const grossTotal = round2(netTotal + taxAmount);

  return {
    dp,
    projectName: projectName || 'Unbenanntes Bauprojekt',
    currency: currency || 'EUR',
    categories,
    allItems,
    netTotal,
    taxRate,
    taxAmount,
    grossTotal,
    date: new Date().toISOString().split('T')[0],
  };
}

/**
 * Parst zeilenbasierte GAEB-90-Dateien (.D83) aus einem Text-String.
 * Abwärtskompatible Schnittstelle mit Mehrdeutigkeitsschutz.
 */
export function parseGaeb90Text(rawContent: string): GaebBoQ {
  const content = normalizeGaeb90Encoding(rawContent ?? '');
  return parseGaeb90FromText(content);
}

/**
 * Parst Roh-Bytes einer GAEB-90-Datei (.D83) über den verlustfreien Byte-Decoder (B6/B7-Härtung).
 * Primäre Schnittstelle für Browser-Uploads via readAsArrayBuffer.
 */
export function parseGaeb90Bytes(data: Uint8Array): GaebBoQ {
  if (!data || data.length === 0) {
    return parseGaeb90FromText('');
  }
  const decoded = decodeGaeb90Bytes(data);
  return parseGaeb90FromText(decoded);
}
