/**
 * ZUGFeRD/Faktur-X XML-Generator (EN 16931:2017 & UStG §14 / §13b Konform)
 *
 * Erzeugt ein ZUGFeRD 2.1.1 BASIC WL XML nach DIN EN 16931.
 * Unterstützt Standardrechnungen (19% MwSt.) sowie Bauleistungen nach § 13b UStG (Reverse Charge).
 */

export interface ZugferdInvoiceData {
  invoiceNumber: string;
  invoiceDate: string;       // ISO date YYYY-MM-DD
  periodFrom: string;
  periodTo: string;
  sellerName: string;
  sellerStreet: string;
  sellerCity: string;
  sellerCountry: string;     // ISO code (DE)
  sellerTaxId: string;       // Steuernummer oder USt-IdNr.
  sellerVatId?: string;      // USt-IdNr. z.B. DE123456789
  buyerName: string;
  buyerStreet: string;
  buyerCity: string;
  buyerCountry: string;
  buyerTaxId?: string;
  buyerVatId?: string;       // Pflicht bei §13b B2B Reverse Charge
  lineItems: Array<{
    name: string;
    description?: string;
    quantity: number;
    unitCode: string;        // 'HUR' = hours, 'MTK' = m2, 'MTQ' = m3, 'MTR' = m, 'C62' = pcs, 'KGM' = kg
    netAmount: number;
    taxPercent: number;      // 0.19 oder 0.00
  }>;
  subtotal: number;
  taxRate: number;           // 0.19 oder 0.00
  taxAmount: number;
  total: number;
  currency: string;          // 'EUR'
  paymentTerms?: string;
  isReverseCharge?: boolean; // § 13b UStG Bauleistungen
  exemptionReason?: string;
  totalPrepaidAmount?: number;
  prepaidInvoiceReferences?: string[];
}

function esc(text?: string | null): string {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function generateZugferdXml(data: ZugferdInvoiceData): string {
  const exemptReason = data.exemptionReason || 'Steuerschuldnerschaft des Leistungsempfängers gemäß § 13b UStG (Reverse Charge)';

  const hasReverseChargeItems = Boolean(
    data.isReverseCharge === true ||
    (data.lineItems && data.lineItems.some(it => it.taxPercent === 0))
  );

  if (hasReverseChargeItems) {
    const buyerVatId = (data.buyerVatId || '').trim();
    if (!buyerVatId) {
      throw new Error('§ 14a Abs. 5 UStG: Reverse-Charge-Rechnung erfordert die USt-IdNr. (buyerVatId) des Leistungsempfängers (B2B-Schranke).');
    }
    if (!/^[A-Za-z]{2}/.test(buyerVatId) || buyerVatId.length < 8) {
      throw new Error('§ 14a Abs. 5 UStG: Reverse-Charge-Rechnung erfordert eine gültige USt-IdNr. mit Länderpräfix und mindestens 8 Zeichen (buyerVatId).');
    }
  }

  // Safe 8-digit date formatting (YYYYMMDD) even if ISO timestamp is provided
  const cleanInvoiceDate = (data.invoiceDate || new Date().toISOString())
    .slice(0, 10)
    .replace(/-/g, '');
  const cleanPeriodTo = (data.periodTo || data.invoiceDate || new Date().toISOString())
    .slice(0, 10)
    .replace(/-/g, '');

  const standardRate = typeof data.taxRate === 'number' && data.taxRate > 0 ? data.taxRate : 0.19;
  const standardRatePercent = (standardRate * 100).toFixed(2);

  const lineItems = (data.lineItems && data.lineItems.length > 0)
    ? data.lineItems
    : [{
        name: 'Bau- und Handwerksleistungen nach Aufmaß',
        description: 'Pauschale Abrechnung nach VOB/B',
        quantity: 1,
        unitCode: 'C62',
        netAmount: data.subtotal || 0,
        taxPercent: data.isReverseCharge ? 0 : standardRate,
      }];

  // Track tax buckets for EN 16931 multi-tax settlement
  let sumBasis13b = 0;
  let sumBasis19 = 0;

  const itemsXml = lineItems.map((item, i) => {
    const itemTotal = Math.round(item.quantity * item.netAmount * 100) / 100;
    const isItemRevCharge = Boolean(data.isReverseCharge || item.taxPercent === 0);
    const itemTaxCategory = isItemRevCharge ? 'AE' : 'S';
    const itemTaxRatePercent = isItemRevCharge ? 0 : Math.round((item.taxPercent || standardRate) * 100);

    if (isItemRevCharge) {
      sumBasis13b += itemTotal;
    } else {
      sumBasis19 += itemTotal;
    }

    return `
    <ram:IncludedSupplyChainTradeLineItem>
      <ram:AssociatedDocumentLineDocument>
        <ram:LineID>${i + 1}</ram:LineID>
      </ram:AssociatedDocumentLineDocument>
      <ram:SpecifiedTradeProduct>
        <ram:Name>${esc(item.name)}</ram:Name>
        ${item.description ? `<ram:Description>${esc(item.description)}</ram:Description>` : ''}
      </ram:SpecifiedTradeProduct>
      <ram:SpecifiedLineTradeAgreement>
        <ram:NetPriceProductTradePrice>
          <ram:ChargeAmount>${(Math.round(item.netAmount*100)/100).toFixed(2)}</ram:ChargeAmount>
          <ram:BasisQuantity unitCode="${item.unitCode || 'C62'}">1</ram:BasisQuantity>
        </ram:NetPriceProductTradePrice>
      </ram:SpecifiedLineTradeAgreement>
      <ram:SpecifiedLineTradeDelivery>
        <ram:BilledQuantity unitCode="${item.unitCode || 'C62'}">${item.quantity.toFixed(2)}</ram:BilledQuantity>
      </ram:SpecifiedLineTradeDelivery>
      <ram:SpecifiedLineTradeSettlement>
        <ram:ApplicableTradeTax>
          <ram:TypeCode>VAT</ram:TypeCode>
          <ram:CategoryCode>${itemTaxCategory}</ram:CategoryCode>
          <ram:RateApplicablePercent>${itemTaxRatePercent.toFixed(2)}</ram:RateApplicablePercent>
        </ram:ApplicableTradeTax>
        <ram:SpecifiedTradeSettlementMonetarySummation>
          <ram:LineTotalAmount>${itemTotal.toFixed(2)}</ram:LineTotalAmount>
        </ram:SpecifiedTradeSettlementMonetarySummation>
      </ram:SpecifiedLineTradeSettlement>
    </ram:IncludedSupplyChainTradeLineItem>`;
  }).join('');

  const taxCalculatedS = Math.round(sumBasis19 * standardRate * 100) / 100;
  const grandSubtotal = Math.round((sumBasis13b + sumBasis19) * 100) / 100;
  const grandTaxTotal = taxCalculatedS;
  const grandTotal = Math.round((grandSubtotal + grandTaxTotal) * 100) / 100;

  // Build ApplicableTradeTax header blocks
  const headerTaxesXml: string[] = [];
  if (sumBasis13b > 0 || (sumBasis13b === 0 && sumBasis19 === 0)) {
    headerTaxesXml.push(`
      <ram:ApplicableTradeTax>
        <ram:CalculatedAmount>0.00</ram:CalculatedAmount>
        <ram:TypeCode>VAT</ram:TypeCode>
        <ram:BasisAmount>${(Math.round(sumBasis13b*100)/100).toFixed(2)}</ram:BasisAmount>
        <ram:CategoryCode>AE</ram:CategoryCode>
        <ram:RateApplicablePercent>0.00</ram:RateApplicablePercent>
        <ram:ExemptionReason>${esc(exemptReason)}</ram:ExemptionReason>
      </ram:ApplicableTradeTax>`);
  }
  if (sumBasis19 > 0) {
    headerTaxesXml.push(`
      <ram:ApplicableTradeTax>
        <ram:CalculatedAmount>${taxCalculatedS.toFixed(2)}</ram:CalculatedAmount>
        <ram:TypeCode>VAT</ram:TypeCode>
        <ram:BasisAmount>${(Math.round(sumBasis19*100)/100).toFixed(2)}</ram:BasisAmount>
        <ram:CategoryCode>S</ram:CategoryCode>
        <ram:RateApplicablePercent>${standardRatePercent}</ram:RateApplicablePercent>
      </ram:ApplicableTradeTax>`);
  }

  const advancePaymentsXml = (data.prepaidInvoiceReferences && data.prepaidInvoiceReferences.length > 0)
    ? data.prepaidInvoiceReferences.map(ref => `
      <ram:SpecifiedAdvancePayment>
        <ram:ReferencedDocument>
          <ram:IssuerAssignedID>${esc(ref)}</ram:IssuerAssignedID>
          <ram:TypeCode>386</ram:TypeCode>
        </ram:ReferencedDocument>
      </ram:SpecifiedAdvancePayment>`).join('')
    : '';

  const totalPrepaid = Math.round((data.totalPrepaidAmount || 0) * 100) / 100;
  const duePayable = Math.max(0, Math.round((grandTotal - totalPrepaid) * 100) / 100);

  return `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"
  xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100"
  xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">
  <rsm:ExchangedDocumentContext>
    <ram:GuidelineSpecifiedDocumentContextParameter>
      <ram:ID>urn:cen.eu:en16931:2017#compliant#urn:factur-x.eu:1p0:basic</ram:ID>
    </ram:GuidelineSpecifiedDocumentContextParameter>
  </rsm:ExchangedDocumentContext>
  <rsm:ExchangedDocument>
    <ram:ID>${esc(data.invoiceNumber)}</ram:ID>
    <ram:TypeCode>380</ram:TypeCode>
    <ram:IssueDateTime>
      <udt:DateTimeString format="102">${cleanInvoiceDate}</udt:DateTimeString>
    </ram:IssueDateTime>
    ${sumBasis13b > 0 ? `<ram:IncludedNote>
      <ram:Content>Steuerschuldnerschaft des Leistungsempfängers (Reverse Charge) gemäß § 13b Abs. 2 Nr. 4 UStG bei Bauleistungen.</ram:Content>
      <ram:SubjectCode>AAI</ram:SubjectCode>
    </ram:IncludedNote>` : ''}
  </rsm:ExchangedDocument>
  <rsm:SupplyChainTradeTransaction>
    <ram:ApplicableHeaderTradeAgreement>
      <ram:SellerTradeParty>
        <ram:Name>${esc(data.sellerName)}</ram:Name>
        <ram:PostalTradeAddress>
          <ram:LineOne>${esc(data.sellerStreet)}</ram:LineOne>
          <ram:CityName>${esc(data.sellerCity)}</ram:CityName>
          <ram:CountryID>${data.sellerCountry || 'DE'}</ram:CountryID>
        </ram:PostalTradeAddress>
        ${data.sellerVatId ? `<ram:SpecifiedTaxRegistration><ram:ID schemeID="VA">${esc(data.sellerVatId)}</ram:ID></ram:SpecifiedTaxRegistration>` : `<ram:SpecifiedTaxRegistration><ram:ID schemeID="FC">${esc(data.sellerTaxId)}</ram:ID></ram:SpecifiedTaxRegistration>`}
      </ram:SellerTradeParty>
      <ram:BuyerTradeParty>
        <ram:Name>${esc(data.buyerName)}</ram:Name>
        <ram:PostalTradeAddress>
          <ram:LineOne>${esc(data.buyerStreet)}</ram:LineOne>
          <ram:CityName>${esc(data.buyerCity)}</ram:CityName>
          <ram:CountryID>${data.buyerCountry || 'DE'}</ram:CountryID>
        </ram:PostalTradeAddress>
        ${data.buyerVatId ? `<ram:SpecifiedTaxRegistration><ram:ID schemeID="VA">${esc(data.buyerVatId.trim())}</ram:ID></ram:SpecifiedTaxRegistration>` : (data.buyerTaxId ? `<ram:SpecifiedTaxRegistration><ram:ID schemeID="FC">${esc(data.buyerTaxId.trim())}</ram:ID></ram:SpecifiedTaxRegistration>` : '')}
      </ram:BuyerTradeParty>
    </ram:ApplicableHeaderTradeAgreement>
    <ram:ApplicableHeaderTradeDelivery>
      <ram:ActualDeliverySupplyChainEvent>
        <ram:OccurrenceDateTime>
          <udt:DateTimeString format="102">${cleanPeriodTo}</udt:DateTimeString>
        </ram:OccurrenceDateTime>
      </ram:ActualDeliverySupplyChainEvent>
    </ram:ApplicableHeaderTradeDelivery>
    <ram:ApplicableHeaderTradeSettlement>
      <ram:InvoiceCurrencyCode>${data.currency || 'EUR'}</ram:InvoiceCurrencyCode>${headerTaxesXml.join('')}
      <ram:SpecifiedTradeSettlementMonetarySummation>
        <ram:LineTotalAmount>${(Math.round(grandSubtotal*100)/100).toFixed(2)}</ram:LineTotalAmount>
        <ram:TaxBasisTotalAmount>${(Math.round(grandSubtotal*100)/100).toFixed(2)}</ram:TaxBasisTotalAmount>
        <ram:TaxTotalAmount currencyID="${data.currency || 'EUR'}">${(Math.round(grandTaxTotal*100)/100).toFixed(2)}</ram:TaxTotalAmount>
        <ram:GrandTotalAmount>${(Math.round(grandTotal*100)/100).toFixed(2)}</ram:GrandTotalAmount>
        <ram:TotalPrepaidAmount>${totalPrepaid.toFixed(2)}</ram:TotalPrepaidAmount>
        <ram:DuePayableAmount>${duePayable.toFixed(2)}</ram:DuePayableAmount>
      </ram:SpecifiedTradeSettlementMonetarySummation>${advancePaymentsXml}
    </ram:ApplicableHeaderTradeSettlement>${itemsXml}
  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>`;
}

export function downloadZugferdXml(data: ZugferdInvoiceData, filename?: string): void {
  const xml = generateZugferdXml(data);
  const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = window.document.createElement('a');
  a.href = url;
  a.download = filename || `${data.invoiceNumber}-ZUGFeRD.xml`;
  a.click();
  URL.revokeObjectURL(url);
}
