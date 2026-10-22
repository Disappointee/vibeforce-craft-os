# Prüfauftrag & Architektur-Audit: M007 "VIBE Craft" (Handwerker- & Baustellenmodul)

> **Dokumenten-ID:** `PA-M007-2026-09-07`  
> **Status:** Zur Prüfung vorgelegt an Claude Opus (Lead Enterprise Architect & Baurechts-Auditor)  
> **Projekt:** Vibeforce Flow OS — Handwerker- & Baustellenmodul M007 "VIBE Craft"  
> **Repository-Pfad:** `c:\Users\Robin\Desktop\AlphaExplorer\K.I. Takeover\Neu\Vibeforce One\vibeforce-flow-os\`  
> **Live-Deployment:** `https://vibeforce-flow-os.vercel.app/craft`  
> **PocketBase Server:** `https://pb-vibeforce.46-225-178-235.sslip.io`  
> **Git-Stand:** Commit `a9f9e8c` auf `origin/main` (clean & live auf Vercel)  

---

## 1. Management Summary & Ziel des Prüfauftrags

Das Modul **M007 "VIBE Craft"** wurde in den letzten Phasen erfolgreich von einem MVP zu einer Enterprise-Lösung ausgebaut:
1. **M007.1:** GoBD-Revisionssicherheit, VOB/B § 6 Bautagesberichte, ZUGFeRD 2.1.1 E-Rechnung, IndexedDB 3-Store Offline-PWA, DSGVO-Kachel-Proxy.
2. **Phase 1:** GAEB DA XML Engine (X83 Import, Preiskalkulation, X84 Angebotsabgabe, VOB-Aufmaß-Brücke).
3. **Phase 2:** Soll/Ist-Nachkalkulation & Margen-Cockpit (DB I & DB II, VOB/B § 2 Abs. 3 Schranke, Verrechnungssatz-Editor).
4. **Phase 3:** Großhandels-Kataloge (DATANORM 5.0 mit CP850/UTF-8 Charset-Resilienz & IDS-Connect 2.5 Punchout).
5. **Entitlements:** Modulares Upsell-System mit PocketBase Server-Side Hard-Gates (`@request.auth.role = "admin"`).

Im Rahmen des internen **Grill-Me-Audits** wurden **5 kritische Fragestellungen / Praxis-Fallen** sowie eine fundamentale **Datenbank-Architekturfrage** identifiziert. 

**Ziel dieses Prüfauftrags für Claude Opus:**
Prüfe die folgenden 6 Handlungsfelder, wäge die vorgelegten Lösungsoptionen ab, identifiziere eventuelle blinde Flecken (Recht, Praxis, Skalierung) und gib eine verbindliche Architektur-Freigabe oder Korrekturanweisung.

---

## 2. Detaillierte Fragestellungen, Code-Stellen & Handlungsoptionen

---

### PRÜFPUNKT 1: Arbeitsstunden-Konsolidierung & Doppelzählungs-Gefahr im Margen-Cockpit

* **Betroffene Dateien:**
  - [`frontend/src/lib/cost-calculation.ts`](file:///c:/Users/Robin/Desktop/AlphaExplorer/K.I.%20Takeover/Neu/Vibeforce%20One/vibeforce-flow-os/frontend/src/lib/cost-calculation.ts#L163) (Zeilen 115–176)
  - [`frontend/src/components/craft/CostCockpit.tsx`](file:///c:/Users/Robin/Desktop/AlphaExplorer/K.I.%20Takeover/Neu/Vibeforce%20One/vibeforce-flow-os/frontend/src/components/craft/CostCockpit.tsx)
* **Problemstellung im Code:**
  ```typescript
  // cost-calculation.ts Zeile 163:
  const totalIstHours = Math.round((monteurHours + regieHours) * 100) / 100;
  const totalLaborCosts = Math.round((monteurLaborCost + regieLaborCost) * 100) / 100;
  ```
  `monteurHours` summiert alle Zeiteinträge der Mitarbeiter (`time_entries`).  
  `regieHours` summiert die im Bautagesbericht erfassten Qualifikationsstunden (`site_reports.qualification_hours`).
* **Die Baustellen-Realität & das Risiko:**
  - Wenn Monteur Daniel seine 8 Stunden per Smartphone-Stempel erfasst und der Polier abends im Bautagesbericht einträgt: *„Daniel: 8h Gesellenstunden Rohmontage“*, addiert das System aktuell `8 + 8 = 16 Stunden`.
  - Die Lohnkosten verdoppeln sich rechnerisch. Das Margen-Cockpit löst sofort einen falschen VOB/B § 2 Abs. 3 Mehrkosten-Alarm (>10 % Überschreitung) aus, obwohl die Baustelle voll im Budget liegt.
  - Auf deutschen Baustellen dient der Bautagesbericht primär der **Kausalitäts-Dokumentation gem. VOB/B § 6** (Nachweis der Baustellenbesetzung gegen Verzugsstrafen), nicht als sekundäre Lohnbuchhaltung.
* **Optionen zur Abwägung:**
  - **Option 1A (Zeiterfassung als Alleinquelle):** Nur `time_entries` fließen in die Kostenrechnung. Bautagesberichte sind rein informativ.  
    *Schwäche:* Betriebe, deren Arbeiter kein Smartphone besitzen und bei denen nur der Polier Berichte schreibt, haben 0 Stunden.
  - **Option 1B (Reine Summierung – Status Quo):**  
    *Schwäche:* Akute Gefahr der Doppelzählung bei hybrider Nutzung.
  - **Option 1C (Empfohlen – 3-Wege Quellenschalter & VOB-Regietrennung):**  
    Im Margen-Cockpit kann der Betrieb wählen:
    1. *„Zeiterfassung primär (Standard)“*: Stempelzeiten = Lohnkosten. Bautagesberichte = reine VOB-Dokumentation.
    2. *„Bautagesberichte primär“*: Für Betriebe ohne Mitarbeiter-Apps.
    3. *„Zusätzliche Regiestunden addieren“*: Nur Bautagesberichte, die explizit als *„Regieauftrag / Zusatzleistung gem. VOB/B § 2 Abs. 10“* deklariert sind, werden addiert.
* **Fragen an Claude Opus:**
  1. Ist Option 1C aus baurechtlicher (VOB/B) und betriebswirtschaftlicher Sicht der optimalste Weg?
  2. Sollte die Regie-Trennung pro Bautagesbericht über eine explizite Checkbox *„Stunden als zusätzliche Regie nach § 2 Abs. 10 abrechnen“* erfolgen?
  3. Gibt es steuerrechtliche oder DATEV-Lohnrelevanzen, die gegen diesen Ansatz sprechen?

---

### PRÜFPUNKT 2: IDS-Connect 2.5 Webhook, CORS & Punchout Return-Flow

* **Betroffene Dateien:**
  - [`frontend/src/app/api/craft/ids/hook/route.ts`](file:///c:/Users/Robin/Desktop/AlphaExplorer/K.I.%20Takeover/Neu/Vibeforce%20One/vibeforce-flow-os/frontend/src/app/api/craft/ids/hook/route.ts)
  - [`frontend/src/lib/ids-connect.ts`](file:///c:/Users/Robin/Desktop/AlphaExplorer/K.I.%20Takeover/Neu/Vibeforce%20One/vibeforce-flow-os/frontend/src/lib/ids-connect.ts)
* **Problemstellung im Code:**
  Aktuell besitzt `/api/craft/ids/hook/route.ts` nur einen `export async function POST(req: NextRequest)`. Es fehlen:
  1. `OPTIONS`-Methode für Browser-CORS-Preflights.
  2. Ein Return-Redirect für Browser-basierte Form-Submits von Großhändlern.
* **Die Großhandels-Praxis (IGH IDS-Connect 2.5):**
  - **80 % der Großhändler (GC-Gruppe, Richter+Frenzel):** Schicken den Nutzer per HTML `<form method="POST" action="hookurl">` im selben Browser-Tab zurück. Der Browser des Handwerkers führt den POST aus. Erhält der Browser darauf ein rohes JSON (`{"success":true}`), sieht der Handwerker eine weiße Seite mit Textcode statt des Dashboards.
  - **20 % der Großhändler (moderne SPAs, Sonepar):** Senden den Warenkorb per AJAX `fetch()`. Hier schlägt der Request ohne `OPTIONS`-Handler mit `CORS Preflight Failed / 405 Method Not Allowed` fehl.
* **Optionen zur Abwägung:**
  - **Option 2A (Reines JSON API + OPTIONS-Header):** Löst nur das AJAX-Problem, bricht aber bei Standard-Formular-Submits ab.
  - **Option 2B (Empfohlen – Dualer Universal Receiver):**
    1. `OPTIONS`-Handler mit `Access-Control-Allow-Origin: *`, `Access-Control-Allow-Methods: POST, OPTIONS`.
    2. Im `POST`-Handler Header `Accept` oder `Content-Type` prüfen:
       - Wenn Browser-Form-Submit (`multipart/form-data` oder `application/x-www-form-urlencoded`): Warenkorb in DB/Cache ablegen und sofort mit **HTTP 303 See Other** auf `/craft?tab=wholesale&ids_imported=1&cart_id=...` weiterleiten.
       - Wenn API-Call (`application/xml` oder `application/json`): JSON-Antwort zurückgeben.
* **Fragen an Claude Opus:**
  1. Ist der HTTP 303 Redirect nach IGH IDS-Connect 2.5 Standard für Browser-basierte Punchouts vollständig konform?
  2. Wie sollte die `sessionId` / `hookToken` Validierung gestaltet sein, um CSRF-Einschleusungen fremder Warenkörbe ohne Authentifizierungsverlust zu verhindern?

---

### PRÜFPUNKT 3: ZUGFeRD 2.1.1 E-Rechnung — Leitweg-ID (BT-10) für öffentliche Aufträge

* **Betroffene Dateien:**
  - [`frontend/src/lib/zugferd.ts`](file:///c:/Users/Robin/Desktop/AlphaExplorer/K.I.%20Takeover/Neu/Vibeforce%20One/vibeforce-flow-os/frontend/src/lib/zugferd.ts#L205-L224)
* **Problemstellung im Code:**
  In `generateZugferdXml` wird `<ram:BuyerTradeParty>` generiert, aber das EN 16931-Feld `ram:BuyerReference` (Business Term **BT-10**) wird aktuell nicht übergeben.
* **Gesetzliche Pflicht nach E-RechV & VOB/A:**
  - Rechnungen an Bundesbehörden, Bundeswehr, Städte und Kommunen über die zentralen Portale (ZRE / OZG-RE) müssen **zwingend** die amtliche Leitweg-ID im Feld `BT-10` enthalten (z.B. `04011000-12345-67`).
  - Fehlt `BuyerReference`, wirft der amtliche KoSIT-Validator den Fehler **`BR-DE-15`** und verweigert die Rechnungsannahme vollständig.
* **Optionen zur Abwägung:**
  - **Option 3A (Einfaches Freitextfeld ohne Validierung):** Risiko von Tippfehlern, die zur Rechnungsabweisung führen.
  - **Option 3B (Empfohlen – Typisiertes `buyerReference` mit bedingter Formatprüfung):**
    - `buyerReference?: string` im Interface `ZugferdInvoiceData`.
    - Bei B2B-Kunden optional (z.B. Bestellnummer / PO-Nummer).
    - Bei Auswahl *„Behörde / Öffentlicher Auftraggeber“*: Regex-Prüfung auf das deutsche Leitweg-ID-Format (`^[0-9]{2,12}-[0-9A-Za-z]{1,30}-[0-9]{2}$`).
    - Einbettung im XML direkt in `<ram:ApplicableHeaderTradeAgreement>`:
      ```xml
      ${data.buyerReference ? `<ram:BuyerReference>${esc(data.buyerReference)}</ram:BuyerReference>` : ''}
      ```
* **Fragen an Claude Opus:**
  1. Ist die Einbettung von `BT-10` im ZUGFeRD 2.1.1 BASIC Profile vollständig valide oder erfordert es zwingend das Profil EN 16931 (COMFORT)? (Hinweis: Aktuell deklarieren wir `urn:factur-x.eu:1p0:basic`).
  2. Sollten wir für B2B zusätzlich `BT-13` (Buyer Order Referenced Document) und `BT-11` (Project Reference) als Standardfelder etablieren?

---

### PRÜFPUNKT 4: GAEB 90 (.d83 / .d84) Kompatibilität für kommunale Bauämter

* **Betroffene Dateien:**
  - [`frontend/src/lib/gaeb.ts`](file:///c:/Users/Robin/Desktop/AlphaExplorer/K.I.%20Takeover/Neu/Vibeforce%20One/vibeforce-flow-os/frontend/src/lib/gaeb.ts#L130-L150)
* **Problemstellung im Code:**
  `parseGaebXml` wirft einen Fehler, wenn die Datei keine XML-Tags (`<GAEB>`, `<BoQ>`) enthält.
* **Branchen-Realität:**
  - Ca. 85 % aller LVs liegen als GAEB DA XML 3.2 (.x83) vor.
  - Ca. 15 % (insb. Tiefbauämter, Grünflächenämter, kleinere Gemeinden) versenden noch das 1990 definierte GAEB 90 Format (.d83, 80-Zeichen fixe Spaltenbreite).
* **Optionen zur Abwägung:**
  - **Option 4A (Reines XML beibehalten, nur erklärende Fehlermeldung):** Geringer Code-Aufwand, aber Frustration bei Kommunal-Ausschreibungen.
  - **Option 4B (Empfohlen – Integrierter GAEB 90 Fallback-Line-Parser):**
    - Da GAEB 90 streng spaltenbasiert ist (Satzart in Spalte 1–2, OZ in 3–11, Menge in 22–32), kann ein deterministischer Parser in ca. 120 Zeilen TypeScript das Format in das bestehende `GaebBoQ`-Modell einlesen.
    - Vollständige Unabhängigkeit von externen Konvertierungs-Diensten.
* **Fragen an Claude Opus:**
  1. Lohnt sich der Einbau eines internen GAEB 90 Parsers strategisch als USP gegenüber modernen Cloud-Tools, oder überwiegen die Wartungsrisiken historischer Spalten-Varianten?
  2. Welche Satzarten (z.B. `00`, `10`, `21`, `25`, `26`) sind das absolute Minimum für ein vollständiges VOB-Aufmaß?

---

### PRÜFPUNKT 5: GPS-Geofencing — Datenschutz (§ 26 BDSG) & Mitbestimmung (§ 87 BetrVG)

* **Betroffene Dateien:**
  - [`frontend/src/lib/geofence.ts`](file:///c:/Users/Robin/Desktop/AlphaExplorer/K.I.%20Takeover/Neu/Vibeforce%20One/vibeforce-flow-os/frontend/src/lib/geofence.ts)
  - [`frontend/src/app/(dashboard)/projects/[id]/geofence/GeofenceClient.tsx`](file:///c:/Users/Robin/Desktop/AlphaExplorer/K.I.%20Takeover/Neu/Vibeforce%20One/vibeforce-flow-os/frontend/src/app/%28dashboard%29/projects/%5Bid%5D/geofence/GeofenceClient.tsx)
* **Rechtslage in Deutschland:**
  - Nach § 26 BDSG und ständiger BAG-Rechtsprechung ist eine lückenlose GPS-Überwachung von Mitarbeitern (Fahrtrouten, Standorte) unzulässig.
  - Nach § 87 Abs. 1 Nr. 6 BetrVG unterliegen Systeme zur Verhaltens- oder Leistungskontrolle der zwingenden Mitbestimmung des Betriebsrats.
* **Unsere Implementierung:**
  - Speichert **keine Bewegungsprofile** auf dem Server.
  - Ray-Casting läuft lokal im Browser/Gerät des Monteurs.
  - Nur bei Betreten des Polygons wird ein Bestätigungs-Dialog (*„Auf Baustelle einstempeln?“*) getriggert.
  - Kartenkacheln laufen über den DSGVO-Server-Proxy (`/api/craft/tiles/`), sodass keine IP-Adressen an externe Server gelangen.
* **Fragen an Claude Opus:**
  1. Reicht diese technische Architektur aus, um vor deutschen Betriebsräten und Landesdatenschutzbeauftragten als unbedenklich (keine Überwachungseinrichtung) eingestuft zu werden?
  2. Sollte in den Systemeinstellungen ein explizites *„Betriebsrats-Merkblatt & Muster-Betriebsvereinbarung (BV)“* als PDF-Download für Handwerksmeister bereitgestellt werden?

---

### PRÜFPUNKT 6: Datenbank-Architektur & Skalierungs-Audit (PocketBase SQLite vs. PostgreSQL)

* **Architektur-Stand:**
  - Backend: PocketBase (Go-Binary mit eingebetteter SQLite im WAL-Modus) auf deutschem VPS (Hetzner).
  - Concurrency: `PRAGMA journal_mode=WAL`, `busy_timeout=5000`, Exponential Backoff Retry.
  - Frontend: Next.js 16 (App Router) + IndexedDB Offline-Engine.
* **Kritische Analyse:**
  - SQLite WAL schafft 15.000–35.000 Schreibzugriffe/Sekunde. Handwerksbetriebe (selbst mit 200 Monteuren) erzeugen in Stoßzeiten (07:00 Uhr Check-in) maximal 50–100 Schreibzugriffe pro Minute.
  - Grenzen entstehen erst bei:
    a) Massenkatalogen (5 DATANORM-Kataloge mit je 200.000 Zeilen = 1.000.000 Zeilen Freitext-Suche).
    b) Komplexen BI-Reportings über 6 Tabellen ohne SQL Views.
* **Fragen an Claude Opus:**
  1. Bestätigst du, dass PocketBase/SQLite für die nächsten 2–3 Jahre (bis 500 Handwerksbetriebe / Mandanten) die betriebswirtschaftlich und datenschutzrechtlich überlegene Lösung gegenüber Supabase/PostgreSQL bleibt?
  2. Welcher Skalierungspfad ist bei Überschreitung von 500 Betrieben vorzuziehen: *Database-per-Tenant* (PocketBase-Container pro Betrieb) oder Migration auf PostgreSQL?

---

## 3. Handover-Prompt für Claude Opus

Kopiere den folgenden Textblock vollständig in Claude Opus:

```markdown
Du agierst als Senior Enterprise Software-Architekt und Baurechts-Spezialist (VOB/B, GoBD, EN 16931, BDSG).
Deine Aufgabe ist das neutrale, unvoreingenommene und schonungslose Audit der Architektur- und Umsetzungsentscheidungen für das Handwerker- & Baustellenmodul M007 "VIBE Craft" in Vibeforce Flow OS.

Bitte lies das vollständige Prüfdokument unter folgendem Pfad ein:
c:\Users\Robin\Desktop\AlphaExplorer\K.I. Takeover\Neu\Vibeforce One\vibeforce-flow-os\pruefauftraege\PRUEFAUFTRAG_M007_CRAFT_ARCHITEKTUR_UND_VOB_HAERTUNG.md

Nimm zu jedem der 6 Prüfpunkte detailliert Stellung:
1. Prüfpunkt 1: Arbeitsstunden-Konsolidierung & Vermeidung von Doppelzählung im Margen-Cockpit (Option 1C vs. Alternativen).
2. Prüfpunkt 2: IDS-Connect 2.5 Webhook & Punchout Return-Flow (CORS OPTIONS, HTTP 303 Redirect vs. JSON).
3. Prüfpunkt 3: ZUGFeRD 2.1.1 E-Rechnung — Leitweg-ID (BT-10) für öffentliche Aufträge & Profil-Konformität.
4. Prüfpunkt 4: GAEB 90 (.d83) vs. GAEB DA XML (.x83) — Lohnt sich der Lightweight Parser als Markt-USP?
5. Prüfpunkt 5: GPS-Geofencing — Arbeitsrecht nach § 26 BDSG & § 87 BetrVG (Betriebsrats-Sicherheit).
6. Prüfpunkt 6: Datenbank-Architektur — PocketBase (Go/SQLite WAL) vs. PostgreSQL für Handwerker-KMU.

Gib für jeden Punkt ein klares Urteil ab: [FREIGEGEBEN] | [KORREKTUR ERFORDERLICH] | [VERWORFEN] mit fundierter Begründung.
```
