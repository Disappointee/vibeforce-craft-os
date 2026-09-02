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
  const isRevCharge = Boolean(data.isReverseCharge || data.taxRate === 0);
  const taxCategory = isRevCharge ? 'AE' : 'S';
  const appliedRate = isRevCharge ? 0 : Math.round(data.taxRate * 100);
  const calculatedTax = isRevCharge ? 0 : data.taxAmount;
  const grandTotal = isRevCharge ? data.subtotal : (data.subtotal + calculatedTax);
  const exemptReason = data.exemptionReason || 'Steuerschuldnerschaft des Leistungsempfängers gemäß § 13b UStG (Reverse Charge)';

  const itemsXml = data.lineItems.map((item, i) => {
    const itemTotal = Math.round(item.quantity * item.netAmount * 100) / 100;
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
          <ram:ChargeAmount>${item.netAmount.toFixed(2)}</ram:ChargeAmount>
          <ram:BasisQuantity unitCode="${item.unitCode}">1</ram:BasisQuantity>
        </ram:NetPriceProductTradePrice>
      </ram:SpecifiedLineTradeAgreement>
      <ram:SpecifiedLineTradeDelivery>
        <ram:BilledQuantity unitCode="${item.unitCode}">${item.quantity.toFixed(2)}</ram:BilledQuantity>
      </ram:SpecifiedLineTradeDelivery>
      <ram:SpecifiedLineTradeSettlement>
        <ram:ApplicableTradeTax>
          <ram:TypeCode>VAT</ram:TypeCode>
          <ram:CategoryCode>${taxCategory}</ram:CategoryCode>
          <ram:RateApplicablePercent>${appliedRate.toFixed(2)}</ram:RateApplicablePercent>
          ${isRevCharge ? `<ram:ExemptionReason>${esc(exemptReason)}</ram:ExemptionReason>` : ''}
        </ram:ApplicableTradeTax>
        <ram:SpecifiedTradeSettlementMonetarySummation>
          <ram:LineTotalAmount>${itemTotal.toFixed(2)}</ram:LineTotalAmount>
        </ram:SpecifiedTradeSettlementMonetarySummation>
      </ram:SpecifiedLineTradeSettlement>
    </ram:IncludedSupplyChainTradeLineItem>`;
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryDocument invoiceTypeCode="380" xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"
  xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100"
  xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">
  <rsm:SpecifiedExchangedDocumentContext>
    <ram:TestIndicator>false</ram:TestIndicator>
    <ram:GuidelineSpecifiedDocumentContextParameter>
      <ram:ID>urn:cen.eu:en16931:2017#compliant#urn:factur-x.eu:1p0:basic</ram:ID>
    </ram:GuidelineSpecifiedDocumentContextParameter>
  </rsm:SpecifiedExchangedDocumentContext>
  <rsm:HeaderExchangedDocument>
    <ram:ID>${esc(data.invoiceNumber)}</ram:ID>
    <ram:Name>INVOICE</ram:Name>
    <ram:TypeCode>380</ram:TypeCode>
    <ram:IssueDateTime>
      <udt:DateTimeString format="102">${data.invoiceDate.replace(/-/g, '')}</udt:DateTimeString>
    </ram:IssueDateTime>
    ${isRevCharge ? `<ram:IncludedNote>
      <ram:Content>Steuerschuldnerschaft des Leistungsempfängers (Reverse Charge) gemäß § 13b Abs. 2 Nr. 4 UStG bei Bauleistungen.</ram:Content>
      <ram:SubjectCode>AAI</ram:SubjectCode>
    </ram:IncludedNote>` : ''}
  </rsm:HeaderExchangedDocument>
  <rsm:SpecifiedSupplyChainTradeTransaction>
    <ram:IncludedSupplyChainTradeLineItem>${itemsXml}
    </ram:IncludedSupplyChainTradeLineItem>
    <ram:ApplicableHeaderTradeAgreement>
      <ram:SellerTradeParty>
        <ram:Name>${esc(data.sellerName)}</ram:Name>
        <ram:PostalTradeAddress>
          <ram:StreetName>${esc(data.sellerStreet)}</ram:StreetName>
          <ram:CityName>${esc(data.sellerCity)}</ram:CityName>
          <ram:CountryID>${data.sellerCountry || 'DE'}</ram:CountryID>
        </ram:PostalTradeAddress>
        ${data.sellerVatId ? `<ram:SpecifiedTaxRegistration><ram:ID schemeID="VA">${esc(data.sellerVatId)}</ram:ID></ram:SpecifiedTaxRegistration>` : `<ram:SpecifiedTaxRegistration><ram:ID schemeID="FC">${esc(data.sellerTaxId)}</ram:ID></ram:SpecifiedTaxRegistration>`}
      </ram:SellerTradeParty>
      <ram:BuyerTradeParty>
        <ram:Name>${esc(data.buyerName)}</ram:Name>
        <ram:PostalTradeAddress>
          <ram:StreetName>${esc(data.buyerStreet)}</ram:StreetName>
          <ram:CityName>${esc(data.buyerCity)}</ram:CityName>
          <ram:CountryID>${data.buyerCountry || 'DE'}</ram:CountryID>
        </ram:PostalTradeAddress>
        ${data.buyerVatId ? `<ram:SpecifiedTaxRegistration><ram:ID schemeID="VA">${esc(data.buyerVatId)}</ram:ID></ram:SpecifiedTaxRegistration>` : (data.buyerTaxId ? `<ram:SpecifiedTaxRegistration><ram:ID schemeID="FC">${esc(data.buyerTaxId)}</ram:ID></ram:SpecifiedTaxRegistration>` : '')}
      </ram:BuyerTradeParty>
    </ram:ApplicableHeaderTradeAgreement>
    <ram:ApplicableHeaderTradeDelivery>
      <ram:ActualDeliverySupplyChainEvent>
        <ram:OccurrenceDateTime>
          <udt:DateTimeString format="102">${(data.periodTo || data.invoiceDate).replace(/-/g, '')}</udt:DateTimeString>
        </ram:OccurrenceDateTime>
      </ram:ActualDeliverySupplyChainEvent>
    </ram:ApplicableHeaderTradeDelivery>
    <ram:ApplicableHeaderTradeSettlement>
      <ram:InvoiceCurrencyCode>${data.currency || 'EUR'}</ram:InvoiceCurrencyCode>
      <ram:ApplicableTradeTax>
        <ram:CalculatedAmount>${calculatedTax.toFixed(2)}</ram:CalculatedAmount>
        <ram:TypeCode>VAT</ram:TypeCode>
        <ram:CategoryCode>${taxCategory}</ram:CategoryCode>
        <ram:RateApplicablePercent>${appliedRate.toFixed(2)}</ram:RateApplicablePercent>
        ${isRevCharge ? `<ram:ExemptionReason>${esc(exemptReason)}</ram:ExemptionReason>` : ''}
      </ram:ApplicableTradeTax>
      <ram:SpecifiedTradeSettlementMonetarySummation>
        <ram:LineTotalAmount>${data.subtotal.toFixed(2)}</ram:LineTotalAmount>
        <ram:TaxBasisTotalAmount>${data.subtotal.toFixed(2)}</ram:TaxBasisTotalAmount>
        <ram:TaxTotalAmount currencyID="${data.currency || 'EUR'}">${calculatedTax.toFixed(2)}</ram:TaxTotalAmount>
        <ram:GrandTotalAmount>${grandTotal.toFixed(2)}</ram:GrandTotalAmount>
        <ram:DuePayableAmount>${grandTotal.toFixed(2)}</ram:DuePayableAmount>
      </ram:SpecifiedTradeSettlementMonetarySummation>
    </ram:ApplicableHeaderTradeSettlement>
  </rsm:SpecifiedSupplyChainTradeTransaction>
</rsm:CrossIndustryDocument>`;
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
