# Vibeforce Craft OS — Projekt-Log & Fortschritts-Chronik

> **Projekt:** Vibeforce Craft OS (Handwerk, Baustelle & VOB-Abrechnung)  
> **Workspace:** `c:\Users\kasan\Desktop\AlphaExplorer\K.I. Takeover\Neu\Vibeforce One\vibeforce-craft-os`  
> **Live-Produktionsumgebung:** [https://craft-vibeforce.vercel.app](https://craft-vibeforce.vercel.app) & [https://vibeforce-craft-os.vercel.app](https://vibeforce-craft-os.vercel.app)  
> **PocketBase Backend:** `https://pb-vibeforce.46-225-178-235.sslip.io`  
> **Letzte Aktualisierung:** 16. September 2026, 05:40 Uhr  

---

## 📌 Aktuelle To-Dos / Offene Aufgaben (Nächste Meilensteine)

### 🔴 Prio 1: VOB/B § 16 Kummulierte Abschlags-Engine & § 17 Sicherheitseinbehalt
* **Kontext:** Aus dem großen Stakeholder-Hearing resultierend verlangt der VOB-Bau (GUs und Architekten) die kumulierte Abrechnung über den Baufortschritt.
* **Ziel:**
  1. `generateCraftInvoiceAction` ([`invoices.ts`](file:///c:/Users/kasan/Desktop/AlphaExplorer/K.I.%20Takeover/Neu/Vibeforce%20One/vibeforce-craft-os/frontend/src/app/actions/craft/invoices.ts)) so erweitern, dass bereits gestellte Abschlagsrechnungen des Projekts (`invoices_zugferd`) automatisch saldiert und netto abgezogen werden.
  2. Optionaler Schalter für 5 % Gewährleistungseinbehalt nach VOB/B § 17 mit Ausweis in der ZUGFeRD 2.1.1 XML (`prepaidAmount` / `DuePayableAmount`).

### 🟡 Prio 2: Progressive Offline-Stempel-Queue (IndexedDB) für Funklöcher
* **Kontext:** Monteure stempeln in Kellern, Tiefgaragen und Neubauten ohne Empfang.
* **Ziel:**
  1. Service-Worker / IndexedDB-Stempel-Queue in [`MonteurTimeClock.tsx`](file:///c:/Users/kasan/Desktop/AlphaExplorer/K.I.%20Takeover/Neu/Vibeforce%20One/vibeforce-craft-os/frontend/src/components/craft/MonteurTimeClock.tsx).
  2. Sofortiges visuelles Feedback ("Offline gesichert") mit geräuschloser Synchronisation zu PocketBase beim Wiederverbinden.

---

## 🏆 Chronik der abgeschlossenen Meilensteine

### 22. Oktober 2026: Vercel Deployment-Fix, Live-Release & Root-Härtung
* **Ursachen-Audit Build-Fehler:** E-Mail-Fehlermeldung `NEXT_NO_VERSION` und `Failed deployment from ***REMOVED***` analysiert. Vercel Framework-Konfiguration auf `frontend`-Unterverzeichnis ausgerichtet und lokale Build-Prüfung (`next build` in Turbopack) erfolgreich verifiziert.
* **Production-Deployment (`dpl_BujqGWK4zo8fTaC2UKpTsAxxUrkZ`):** Sauberes Release via Vercel CLI durchgeführt.
* **Status:** `READY` mit aktiven Aliases [https://vibeforce-craft-os-five.vercel.app](https://vibeforce-craft-os-five.vercel.app) und [https://vibeforce-craft-os-robins-projects-34c3aad5.vercel.app](https://vibeforce-craft-os-robins-projects-34c3aad5.vercel.app).
* **Live-Funktionsprobe:** `/login`, `/api/health` und 1-Click Guest Demo-Endpunkt `/api/auth/demo?slot=slot_a` mit Status 200 OK bestätigt.
* **Dauerhafte Root-Härtung:** `package.json` und `vercel.json` im Repo-Root gehärtet (Next.js 16/React 19 devDependencies und harmonisierter Build-Befehl `npm install --legacy-peer-deps`), um `NEXT_NO_VERSION` und Pfad-Kollisionen bei künftigen Root-Builds oder CI/CD-Läufen dauerhaft auszuschließen. Lokaler Root-Build erfolgreich verifiziert.

### 16. September 2026: Großes Stakeholder-Hearing & E-Rechnungs-Inspektor
* **Großes Multi-Stakeholder Hearing ([`grill_me_craft_os_master_hearing.md`](file:///C:/Users/kasan/.gemini/antigravity/brain/8dfa86da-3754-4dd8-be46-e221ecc6ea5b/grill_me_craft_os_master_hearing.md)):**
  - Vollständiger 5-Parteien-Abgleich zwischen Senior Dev Lead, Monteur Kalle (Handschuhe/Funkloch), Bauleiter Janek (VOB-Fristen), Meister Kaupa (Liquidität/Haftung) und Steuerberaterin Dr. Weber (GoBD, § 13b, § 35a).
* **Interaktive Rechnungsvorschau ([`InvoicePreviewDialog.tsx`](file:///c:/Users/kasan/Desktop/AlphaExplorer/K.I.%20Takeover/Neu/Vibeforce%20One/vibeforce-craft-os/frontend/src/components/craft/InvoicePreviewDialog.tsx)):**
  - Rechnungszeilen in der Handwerks-Zentrale ([`CraftHubClient.tsx`](file:///c:/Users/kasan/Desktop/AlphaExplorer/K.I.%20Takeover/Neu/Vibeforce%20One/vibeforce-craft-os/frontend/src/app/%28dashboard%29/craft/CraftHubClient.tsx)) sind interaktiv mit Hover-Effekt und `Eye`-Icon klickbar.
  - Tab 1: DIN 5008 visuelle Handwerker-Rechnung mit Briefkopf, Baustelle, Aufmaßpositionen, § 13b UStG Hinweis, § 48b Bauabzugsteuer-Vermerk und Bankverbindung.
  - Tab 2: ZUGFeRD 2.1.1 EN 16931 XML-Inspektor mit Ein-Klick-Kopieren und Download.
  - Tab 3: DATEV EXTF 700 SKR03 Buchungsstapel (Konto 8337 / 8400, Gegenkonto 10000, BU-Schlüssel 68).
  - Aktionen: Browser-Druck (`window.print()`), XML-Download, DATEV-Download.
* **EU-VIES USt-IdNr. Live-Validierung & B2B/B2C Weiche ([`NewClientDialog.tsx`](file:///c:/Users/kasan/Desktop/AlphaExplorer/K.I.%20Takeover/Neu/Vibeforce%20One/vibeforce-craft-os/frontend/src/components/clients/NewClientDialog.tsx)):**
  - Neuer Auftraggeber-Typ Umschalter: Gewerbe/B2B (§ 13b) vs. Privatkunde/B2C (§ 35a Handwerkerbonus).
  - Offizielle behördliche EU VIES REST-Abfrage mit mathematischer ISO 7064 Vorab-Prüfung (`validateVatAction`).
  - Checkbox für vorliegende Freistellungsbescheinigung nach § 48b EStG.
* **Rechnungsvorschau in der Baustellen-Akte ([`ProjectDetailsClient.tsx`](file:///c:/Users/kasan/Desktop/AlphaExplorer/K.I.%20Takeover/Neu/Vibeforce%20One/vibeforce-craft-os/frontend/src/app/%28dashboard%29/projects/%5Bid%5D/ProjectDetailsClient.tsx)):**
  - Schnelleinsicht im Tab *„Aufmaß & Abrechnung“* für Bauleiter und Meister direkt aus der Baustelle heraus.
  - VOB Abschlags-Zusammenfassungs-Banner mit Live-Brutto- und Steueranzeige.
* **Build & TypeScript:** 100 % fehlerfrei verifiziert (`next build` in 21s).
* **PocketBase Schema-Migration:**
  - `clients`: Spalten `client_type`, `contact_person`, `vat_id`, `tax_number`, `has_48b_certificate` angelegt.
  - `projects`: Spalten `project_type`, `trade`, `site_address`, `site_manager`, `vob_compliant`, `reverse_charge_13b`, `geofence_lat`, `geofence_lng`, `geofence_radius`, `construction_plans`, `site_notes`, `site_images`, `external_site_manager` angelegt.
  - `defect_pins`: Eigene Collection (`pbc_1965201870`) für 2D-Plan-Pinning und VOB/B § 13 Mängelrügen mit 14 Feldern und Server-Persistenz eingerichtet.
* **GoBD-Deadlock (F-06) gelöst:**
  - In `DailySiteReportForm.tsx` wird der Bericht erst nach dem Speichern aller Aufmaße und Fotos per `signSiteReportAction` versiegelt.
* **Steuerrecht § 13b UStG (F-10) gehärtet:**
  - Fake-USt-IdNr. (`'DE888888888'`) und Dummy-Adresse entfernt; Rechnungs-Action fordert zwingend echte Daten.
* **Baustellen-Pinnwand & dauerhafte Pläne:**
  - `SiteNoticeBoard.tsx` integriert; Pläne werden dauerhaft auf dem PocketBase-Server gespeichert.
  - Dropdown im `PlanPinningManager` zum Umschalten zwischen Geschossplänen.
  - Wichtige Baustellen-Hinweise (`site_notes`) und Ansprechpartner werden als auffälliges Banner in der Baustellen-Akte und direkt in der Monteur-Stempeluhr angezeigt.
* **React Error #31 (`object with keys {city, country, street, zip}`) & Clean-Site Hotfix:**
  - In `ProjectList.tsx` wurde `site_address` als rohes JSON-Objekt gerendert, was auf `/projects` zum Fehler führte. Durch `formatSiteAddress()` wird die Anschrift nun sauber formatiert (`Straße, PLZ, Ort`).
  - `DefectsPageClient.tsx` & `PlanPinningManager.tsx`: Neu angelegte Baustellen starten nun 100 % clean (0 Mängel, keine Demodaten). Ohne hochgeladenen Plan wird kein Fake-Grundriss mehr gerendert, sondern eine saubere Upload-Dropzone mit optionaler Test-Möglichkeit.
* **Vercel-Deployment & Bereinigung:**
  - 11 alte Deployments gelöscht; 1 sauberes Production-Deployment aktiv ([https://craft-vibeforce.vercel.app](https://craft-vibeforce.vercel.app)).
  - Automatisierter Playwright Live-E2E-Test mit 100 % grün bestätigt.

### 07. September 2026: Mobile Ergonomie & VOB Mängelmanagement
* SignaturePad Touch-Studio (92vh) mit Vektor-Strokes nach VOB/B § 15.
* Adaptive Aufmaß-Matrix mit Zero-Horizontal-Scroll auf Mobile.
* Vor-Ort Mängelmanagement (`/craft/defects`) mit Sofort-Foto, SHA-256 GoBD-Hash und VOB/B § 13 Abs. 5 Fristsetzung.
* Monteur-Stempeluhr (`/craft/time`) mit Handschuh-Buttons $\ge 80$px und GPS-Geofence.

---

## 🛠️ Wichtige Systemreferenzen & Konfiguration

| Ressource | URL / Pfad |
|---|---|
| **Live Web-App** | [https://craft-vibeforce.vercel.app](https://craft-vibeforce.vercel.app) |
| **PocketBase Backend** | `https://pb-vibeforce.46-225-178-235.sslip.io` |
| **Handover-Prompt (Prio 1)** | [`handover_invoice_preview.md`](file:///C:/Users/kasan/.gemini/antigravity/brain/1ef6a109-7f4d-4c6e-a957-fa0e30fea786/handover_invoice_preview.md) |
| **Audit Walkthrough** | [`walkthrough.md`](file:///C:/Users/kasan/.gemini/antigravity/brain/1ef6a109-7f4d-4c6e-a957-fa0e30fea786/walkthrough.md) |
