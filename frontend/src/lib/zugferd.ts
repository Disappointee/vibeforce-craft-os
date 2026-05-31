/**
 * ZUGFeRD/Faktur-X XML-Generator
 *
 * Erzeugt ein ZUGFeRD 2.1.1 BASIC WL XML nach DIN EN 16931.
 * Das XML kann in die PDF-Datei eingebettet oder separat heruntergeladen werden.
 */

export interface ZugferdInvoiceData {
  invoiceNumber: string;
  invoiceDate: string;       // ISO date
  periodFrom: string;
  periodTo: string;
  sellerName: string;
  sellerStreet: string;
  sellerCity: string;
  sellerCountry: string;     // ISO code
  sellerTaxId: string;
  buyerName: string;
  buyerStreet: string;
  buyerCity: string;
  buyerCountry: string;
  buyerTaxId?: string;
  lineItems: Array<{
    name: string;
    description: string;
    quantity: number;
    unitCode: string;        // 'HUR' for hours
    netAmount: number;
    taxPercent: number;
  }>;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  currency: string;          // 'EUR'
  paymentTerms?: string;
}

function esc(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function generateZugferdXml(data: ZugferdInvoiceData): string {
  const now = new Date().toISOString().split('T')[0];
  const docId = `${data.invoiceNumber}-${now}`;

  const itemsXml = data.lineItems.map((item, i) => `
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
          <ram:CategoryCode>S</ram:CategoryCode>
          <ram:RateApplicablePercent>${(item.taxPercent * 100).toFixed(0)}</ram:RateApplicablePercent>
        </ram:ApplicableTradeTax>
        <ram:SpecifiedTradeSettlementMonetarySummation>
          <ram:LineTotalAmount>${(item.quantity * item.netAmount).toFixed(2)}</ram:LineTotalAmount>
        </ram:SpecifiedTradeSettlementMonetarySummation>
      </ram:SpecifiedLineTradeSettlement>
    </ram:IncludedSupplyChainTradeLineItem>`).join('');

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
          <ram:CountryID>${data.sellerCountry}</ram:CountryID>
        </ram:PostalTradeAddress>
        <ram:SpecifiedTaxRegistration>
          <ram:ID schemeID="VA">${esc(data.sellerTaxId)}</ram:ID>
        </ram:SpecifiedTaxRegistration>
      </ram:SellerTradeParty>
      <ram:BuyerTradeParty>
        <ram:Name>${esc(data.buyerName)}</ram:Name>
        <ram:PostalTradeAddress>
          <ram:StreetName>${esc(data.buyerStreet)}</ram:StreetName>
          <ram:CityName>${esc(data.buyerCity)}</ram:CityName>
          <ram:CountryID>${data.buyerCountry}</ram:CountryID>
        </ram:PostalTradeAddress>
        ${data.buyerTaxId ? `<ram:SpecifiedTaxRegistration><ram:ID schemeID="VA">${esc(data.buyerTaxId)}</ram:ID></ram:SpecifiedTaxRegistration>` : ''}
      </ram:BuyerTradeParty>
    </ram:ApplicableHeaderTradeAgreement>
    <ram:ApplicableHeaderTradeDelivery>
      <ram:ActualDeliverySupplyChainEvent>
        <ram:OccurrenceDateTime>
          <udt:DateTimeString format="102">${data.periodTo.replace(/-/g, '')}</udt:DateTimeString>
        </ram:OccurrenceDateTime>
      </ram:ActualDeliverySupplyChainEvent>
    </ram:ApplicableHeaderTradeDelivery>
    <ram:ApplicableHeaderTradeSettlement>
      <ram:InvoiceCurrencyCode>${data.currency}</ram:InvoiceCurrencyCode>
      <ram:ApplicableTradeTax>
        <ram:CalculatedAmount>${data.taxAmount.toFixed(2)}</ram:CalculatedAmount>
        <ram:TypeCode>VAT</ram:TypeCode>
        <ram:CategoryCode>S</ram:CategoryCode>
        <ram:RateApplicablePercent>${(data.taxRate * 100).toFixed(0)}</ram:RateApplicablePercent>
      </ram:ApplicableTradeTax>
      <ram:SpecifiedTradeSettlementMonetarySummation>
        <ram:LineTotalAmount>${data.subtotal.toFixed(2)}</ram:LineTotalAmount>
        <ram:TaxBasisTotalAmount>${data.subtotal.toFixed(2)}</ram:TaxBasisTotalAmount>
        <ram:TaxTotalAmount currencyID="${data.currency}">${data.taxAmount.toFixed(2)}</ram:TaxTotalAmount>
        <ram:GrandTotalAmount>${data.total.toFixed(2)}</ram:GrandTotalAmount>
        <ram:DuePayableAmount>${data.total.toFixed(2)}</ram:DuePayableAmount>
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
