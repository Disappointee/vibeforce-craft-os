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
