# 🌐 Vibeforce Flow OS — Multi-Market & Compliance Architecture

Dieses Dokument beschreibt die modulare, rechtskonforme und mehrsprachige Architektur für den internationalen Einsatz von **Vibeforce Flow OS** über verschiedene Märkte, Währungen und Rechtsräume hinweg.

---

## 1. Strategische Grundpfeiler

```
┌────────────────────────────────────────────────────────────────────────┐
│                       VIBEFORCE FLOW OS CORE                           │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │                                │
        ┌───────────▼───────────┐        ┌───────────▼───────────┐
        │   1. UI & SPRACHE     │        │ 2. COMPLIANCE & RECHT │
        │  (i18n & Lokalisierung)│        │   (Fiscal Engine)     │
        └───────────────────────┘        └───────────────────────┘
```

---

## 2. Säule 1: Internationalisierung (i18n) & Lokalisierung

### A. Typisierte Wörterbücher (`frontend/src/lib/i18n/`)
Die Benutzeroberfläche wird über statisch typisierte Sprach-Module gesteuert:
- `de-DE`: Deutsch (Standard für DACH)
- `en-US` / `en-GB`: Englisch (International)
- `fr-FR`: Französisch (Frankreich / Romandie)
- `es-ES`: Spanisch (Europa / LATAM)

### B. Dynamische Zahlen-, Währungs- und Datumsformatierung
Formatierung erfolgt vollautomatisch über die nativen ECMAScript `Intl`-APIs:
```typescript
export function formatCurrency(amount: number, locale = 'de-DE', currency = 'EUR'): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
}

export function formatDate(date: string | Date, locale = 'de-DE'): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(date));
}
```

---

## 3. Säule 2: Rechtsräume & Buchhalterische Compliance

Über die Einstellungen (`/admin/settings`) wird der **Gesetzes- und Buchhaltungsrahmen** der Agentur festgelegt:

| Markt / Rechtsraum | Buchhalterischer Standard | E-Rechnungs- & Rechnungs-Standard | Besonderheiten |
| :--- | :--- | :--- | :--- |
| 🇩🇪 **Deutschland (DACH)** | GoBD & HGB | **ZUGFeRD 2.2 / XRechnung (EN 16931)** | DATEV (SKR03/SKR04 Export), §19 UStG Kleinunternehmer, §13b Reverse-Charge |
| 🇦🇹 **Österreich** | UGB & BAO | **ebInterface / ZUGFeRD** | BMD/RZL Export, 20% / 10% / 13% MwSt. |
| 🇨🇭 **Schweiz** | OR (Obligationenrecht) | **Swiss QR-Rechnung (QR-Bill)** | MWSTG konform, 0.05 CHF Rappen-Rundung, Schweizer Kreuz-QR |
| 🇫🇷 **Frankreich** | PCG (Plan Comptable) | **Factur-X (Basic/EN16931)** | Chorus Pro / PPF Portal Integration |
| 🇪🇺 **EU & Global** | IFRS / EU-Norm | **Peppol BIS Billing 3.0 / UBL 2.1** | OSS (One-Stop-Shop) MwSt.-System, Intrakommunikäre Lieferungen |
| 🇺🇸 🇬🇧 **US / UK** | US-GAAP / UK-GAAP | **PDF + Generic XML / Peppol** | US State Sales Tax, HMRC Making Tax Digital (MTD) |

---

## 4. Modulare E-Invoicing Engines

```typescript
export interface FiscalEngine {
  generateInvoice(summary: BillingSummary, options: FiscalOptions): Promise<Blob | string>;
  validateCompliance(summary: BillingSummary): { valid: boolean; errors: string[] };
}
```

1. **`ZUGFeRD 2.2 / Factur-X Engine` (`src/lib/zugferd.ts`):**
   - Erzeugt hybride PDF/A-3 Rechnungen mit eingebetteter XML nach EU-Norm EN 16931.
   - Pflichtstandard für B2B in Deutschland ab 2025/2026.
2. **`Swiss QR-Bill Engine`:**
   - Generiert Schweizer Zahlteile mit offiziellem QR-Code (Swisspay-Standard) und IBAN/QR-IBAN.
3. **`Peppol BIS 3.0 UBL Engine`:**
   - Generiert strukturierte UBL 2.1 XML-Dateien für den europäischen Behörden- und B2B-Austausch.

---

## 5. Audit-Trail & GoBD-Konformität

- **Unveränderbarkeit:** Erfasste Zeiteinträge und finalisierte Rechnungen erhalten unveränderliche Snapshots.
- **Rundungs- & Stundensatz-Verrechnung:** Globale Rundung (z.B. 15-Minuten-Taktung) und projektspezifische Stundensätze werden revisionssicher protokolliert.
- **DATEV & FIBU-Export:** Bereitstellung strukturierter CSV/ASCII-Dateien für Steuerberater und Buchhaltungssysteme.
