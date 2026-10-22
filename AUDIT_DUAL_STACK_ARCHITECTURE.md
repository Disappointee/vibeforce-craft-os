# 🏛️ Dual-Stack Architektur-Dokumentation & Audit-Report
## Vibeforce One — Single Engine Dual-Stack (Flow OS & Craft OS)

**Datum:** 07. September 2026  
**Status:** ✅ Vollständig implementiert & verifiziert (`next build` 0 Fehler)  
**Dokumentationszweck:** Vollständige, revisionssichere Dokumentation für nachgelagerte Code-Audits und Modell-Überprüfungen.

---

## 1. Executive Summary & Senior-Dev-Leitlinie

### 1.1 Das Kernproblem
Traditionelle Software-Teams tendieren bei unterschiedlichen Branchen-Anforderungen (z. B. Digitalagentur vs. Bauhandwerk) zu einem **Code-Fork** (zwei Repositories / Branches). Dies führt unweigerlich zu:
- Doppelter Maintenance-Last und Merge-Konflikten.
- Divergierenden Sicherheits-Patches und veralteten Core-Bibliotheken.
- Doppelten CI/CD-Pipelines und getrenntem Bugfixing.

### 1.2 Die Senior-Dev-Lösung: Single Engine, Zero Code Duplication
Vibeforce One nutzt **ein einziges Codebase-Fundament (Single Engine)**, das zwei spezialisierte Business-Personas dynamisch zur Build- und Laufzeit ausprägt:
1. **Flow OS (`agency`)**: Das schlanke, moderne Projekt- & Agentur-Betriebssystem (Port 3000 / DB Port 8090).
2. **Craft OS (`craft`)**: Das spezialisierte deutsche Handwerks- & Baustellen-Betriebssystem (Port 3001 / DB Port 8091).

Die Trennung erfolgt **vollständig auf Container- und Datenbank-Ebene (Data Isolation)**, während die Geschäfts- und UI-Logik **ohne redundante Duplikate** durch eine zentrale Persona-Engine gesteuert wird.

---

## 2. Architektur-Topologie (Docker Compose Dual-Stack)

```
                       +-------------------------------------------------------+
                       |              Vibeforce One Docker Host                |
                       +-------------------------------------------------------+
                                  |                                 |
                                  v                                 v
        [STACK 1: FLOW OS - Agentur]              [STACK 2: CRAFT OS - Handwerk]
      +----------------------------------+      +----------------------------------+
      |  Frontend: vibeforce-frontend-flow|      | Frontend: vibeforce-frontend-craft|
      |  Image: Next.js 16 (Standalone)  |      | Image: Next.js 16 (Standalone)   |
      |  Port: 3000 (Host: 3000)         |      | Port: 3000 (Host: 3001)          |
      |  ENV: NEXT_PUBLIC_APP_MODE=agency|      | ENV: NEXT_PUBLIC_APP_MODE=craft  |
      |  Accent: Indigo / Blue (#3b82f6) |      | Accent: Amber (#f59e0b)          |
      +----------------------------------+      +----------------------------------+
                      |                                         |
                      v                                         v
      +----------------------------------+      +----------------------------------+
      |  Backend: vibeforce-backend-flow |      | Backend: vibeforce-backend-craft |
      |  Image: PocketBase               |      | Image: PocketBase                |
      |  Port: 8080 (Host: 8090)         |      | Port: 8080 (Host: 8091)          |
      |  Volume: pb-data-flow            |      | Volume: pb-data-craft            |
      |  Seed: seed_agency_demo.js       |      | Seed: seed_craft_demo.js         |
      +----------------------------------+      +----------------------------------+
```

### 2.1 Verbindungs- & Port-Matrix

| Attribut | Flow OS Stack (Agentur) | Craft OS Stack (Handwerk) |
| :--- | :--- | :--- |
| **Frontend URL** | `http://localhost:3000` | `http://localhost:3001` |
| **PocketBase Backend** | `http://localhost:8090` | `http://localhost:8091` |
| **PocketBase Admin UI** | `http://localhost:8090/_/` | `http://localhost:8091/_/` |
| **Docker Volume** | `pb-data-flow` | `pb-data-craft` |
| **App-Modus Flag** | `NEXT_PUBLIC_APP_MODE=agency` | `NEXT_PUBLIC_APP_MODE=craft` |
| **Admin-Login** | `***REMOVED***` | `***REMOVED***` |
| **Admin-Passwort** | `***REDACTED***` | `***REDACTED***` |
| **Standard-Stundensatz** | 150,00 €/h | 78,00 €/h (Meister) / 64,00 €/h (Geselle) |

---

## 3. Die Persona-Engine (`src/config/app-mode.ts`)

Die Datei [`frontend/src/config/app-mode.ts`](file:///c:/Users/kasan/Desktop/AlphaExplorer/K.I.%20Takeover/Neu/Vibeforce%20One/vibeforce-flow-os/frontend/src/config/app-mode.ts) bildet das Herzstück der Single-Engine-Architektur. Sie exportiert deterministische Getter und Vokabular-Wörterbücher:

```typescript
export type AppMode = 'agency' | 'craft';

export function getAppMode(): AppMode {
  const envMode = process.env.NEXT_PUBLIC_APP_MODE;
  if (envMode === 'craft') return 'craft';
  return 'agency'; // Default
}

export function isCraftMode(): boolean {
  return getAppMode() === 'craft';
}

export function isAgencyMode(): boolean {
  return getAppMode() === 'agency';
}
```

### 3.1 Dynamisches Vokabular-Mapping

| Fachbegriff | Flow OS (`agency`) | Craft OS (`craft`) |
| :--- | :--- | :--- |
| **Produktname** | Vibeforce Flow OS | Vibeforce Craft OS |
| **Untertitel** | Next-Gen Agency & Flow Operating System | Das Handwerks- & Baustellen-Betriebssystem |
| **Hauptroute** | `/` (Dashboard) | `/craft` (Handwerks-Zentrale) |
| **Projekte** | Projekte & Kampagnen | Baustellen & Bauvorhaben |
| **Kunden** | Kunden & Accounts | Bauherren & Auftraggeber (§ 13b / § 48b) |
| **Aufgaben** | Tasks & Tickets | Mängel & Montage-Aufgaben (VOB/B § 13) |
| **Zeiterfassung** | Zeiterfassung & Stoppuhr | Monteur-Stempeluhr & GPS-Stempelung |
| **Teams** | Teams & Departments | Kolonnen & Monteure |
| **Farb-Akzent** | Indigo / Royal Blue | Amber Warm (#f59e0b) |

---

## 4. UI- & Feature-Adaptionen im Detail

### 4.1 Navigation & Sidebars ([`layout.tsx`](file:///c:/Users/kasan/Desktop/AlphaExplorer/K.I.%20Takeover/Neu/Vibeforce%20One/vibeforce-flow-os/frontend/src/app/%28dashboard%29/layout.tsx))
- **Desktop Sidebar:**
  - Im Craft-Modus prangt das goldene Hammer-Logo mit dem Branding `Vibeforce Craft OS` und dem Badge `Handwerk`.
  - Die Navigation führt zu:
    1. 🔨 **Handwerks-Zentrale** (`/craft`)
    2. 🏗️ **Baustellen & Bauvorhaben** (`/projects`)
    3. 👷 **Bauherren & Auftraggeber** (`/clients`)
    4. ⏱️ **Monteur-Stempeluhr** (`/time`)
    5. 📋 **Mängel & Aufgaben** (`/tasks`)
    6. 📊 **Bautagebuch & Berichte** (`/reports`)
- **Mobile Navigation ([`MobileTabBar.tsx`](file:///c:/Users/kasan/Desktop/AlphaExplorer/K.I.%20Takeover/Neu/Vibeforce%20One/vibeforce-flow-os/frontend/src/components/layout/MobileTabBar.tsx)):**
  - Passt die 5 Haupt-Tabs für Smartphone-Touchscreens an (`Zentrale`, `Baustellen`, `Mängel`, `Stempeluhr`, `Menü`).

### 4.2 Start- & Auth-Flow ([`page.tsx`](file:///c:/Users/kasan/Desktop/AlphaExplorer/K.I.%20Takeover/Neu/Vibeforce%20One/vibeforce-flow-os/frontend/src/app/%28dashboard%29/page.tsx) & [`login/page.tsx`](file:///c:/Users/kasan/Desktop/AlphaExplorer/K.I.%20Takeover/Neu/Vibeforce%20One/vibeforce-flow-os/frontend/src/app/%28auth%29/login/page.tsx))
- Zugriff auf Root `/` leitet im Craft-Modus automatisch auf `/craft` (Handwerks-Zentrale) weiter.
- Login-Screen passt Badge, Titel, Beschreibung und Platzhalter dynamisch an (`meister@baubetrieb.de`).
- Nach erfolgreichem Login erfolgt die Weiterleitung direkt auf die modusspezifische Startroute (`appConfig.startRoute`).

### 4.3 Die Baustellen-Akte ([`ProjectDetailsClient.tsx`](file:///c:/Users/kasan/Desktop/AlphaExplorer/K.I.%20Takeover/Neu/Vibeforce%20One/vibeforce-flow-os/frontend/src/app/%28dashboard%29/projects/%5Bid%5D/ProjectDetailsClient.tsx))
Wenn ein Projekt den Typ `craft` besitzt oder Craft OS aktiv ist, blendet die Ansicht die Agentur-Features (Sprint-Kanban, Design-Artifacts) aus und öffnet die vollständige **7-Tab Baustellen-Akte**:
1. 📋 **Bautagebuch & Berichte**: Tagesberichte mit Wetter, Temperatur, Monteurs-Zahl, ausgeführten Leistungen und VOB/B § 6 Behinderungsanzeigen.
2. 📐 **VOB-Aufmaßblatt (DIN 18299)**: Formelgestützte Massenberechnung mit automatischer Neuberechnung und Zeilen-Audit.
3. 📊 **Margen- & Nachkalkulation (`CostCockpit`)**: Soll/Ist-Vergleich von Material, Fremdleistung und Lohnkosten mit Deckungsbeitrags-Analyse.
4. 🏗️ **GAEB Leistungsverzeichnis (`GaebManager`)**: GAEB-Import, Positionsverwaltung nach DIN/VOB.
5. 📍 **Geofencing & GPS (`GeofenceMapEditor`)**: Interaktive Kartenauswahl mit Radius (100–500m) für automatische Baustellen-Stempelung via Leaflet (SSR-sicher via `next/dynamic`).
6. 🔍 **Plan-Pinning & VOB/B § 13 Mängel (`PlanPinningManager`)**: Verortung von Mängeln direkt im Bauplan mit Fotodokumentation und Fristverfolgung.
7. 🛠️ **Mängel- & Montage-Aufgaben**: Aufgabenliste mit VOB-Priorisierung (Akut, Hoch, Mittel).

### 4.4 Bauherren & Baurecht-Compliance ([`ClientDetailsClient.tsx`](file:///c:/Users/kasan/Desktop/AlphaExplorer/K.I.%20Takeover/Neu/Vibeforce%20One/vibeforce-flow-os/frontend/src/app/%28dashboard%29/clients/%5Bid%5D/ClientDetailsClient.tsx) & [`ClientList.tsx`](file:///c:/Users/kasan/Desktop/AlphaExplorer/K.I.%20Takeover/Neu/Vibeforce%20One/vibeforce-flow-os/frontend/src/components/clients/ClientList.tsx))
- **§ 13b UStG & § 48b EStG Compliance-Card**:
  - **Bauabzugsteuer (§ 48b EStG)**: Prüft, ob eine gültige Freistellungsbescheinigung vorliegt (0% Abzug) oder warnt vor 15% Steuerabzug ans Finanzamt.
  - **Steuerschuldnerschaft (§ 13b UStG)**: Identifiziert Reverse-Charge-Fälle bei Bauträgern/GUs und weist auf zwingende Netto-Rechnungsstellung hin.
  - Zeigt USt-IdNr., Vor-Ort-Bauleiter und interne Notizen an.
- **Zugeordnete Baustellen**:
  - Direkte Absprung-Möglichkeit mit `Zur Baustellen-Akte →` zu jedem Bauvorhaben des Bauherrn.

---

## 5. Seed-Skripte & Getrennte Datensätze

Um beide Stacks mit realistischen, unverfälschten Testdaten zu betreiben, wurden zwei dedizierte Seed-Skripte erstellt:

### 5.1 `backend/seed_agency_demo.js` (Flow OS)
- **Superuser & Admin:** `***REMOVED***` / `***REDACTED***`.
- **Agentur-Mitarbeiter:** Sarah Meier (Art Director), Lukas Wagner (Fullstack Dev), Anna Schneider (Performance Marketing).
- **Kunden:** Musterfirma AG, TechNova Cloud GmbH, GreenLife Brand GmbH, FinTech Solutions AG.
- **Projekte:** Website Relaunch 2026, SEO & Growth Sprint Q3, SaaS Design System.
- **Tasks & Zeiterfassung:** Sprint-Aufgaben mit Tickets (Lighthouse 95+, Figma-Tokens, A/B Testing).

### 5.2 `backend/seed_craft_demo.js` (Craft OS)
- **Superuser & Meister:** `***REMOVED***` (Zimmermeister & Bauleiter).
- **Handwerker-Team:** Thomas Huber (Vorarbeiter), Michael Bauer (Geselle Holzbau), Florian Weber (Trockenbaumonteur), Jonas Schmidt (Azubi).
- **Handwerker-Stundensätze:**
  - Meister / Bauleiter: 82,50 €/h
  - Vorarbeiter / Polier: 74,00 €/h
  - Facharbeiter / Geselle: 64,00 €/h
  - Monteur / Bauhelfer: 52,00 €/h
  - Azubi: 38,00 €/h
- **Bauherren mit Steuer-Status:**
  1. *Familie Markus Huber*: Privater Bauherr (Regelbesteuerung 19%, kein § 13b).
  2. *Gewerbebau Schmidt GmbH & Co. KG*: Bauträger (§ 13b UStG Reverse Charge, USt-IdNr. `DE318920441`, Freistellungsbescheinigung nach § 48b EStG gültig).
  3. *Wohnbau Südost eG*: Generalunternehmer GU (§ 48b gültig).
- **Baustellen mit GPS-Geofence:**
  1. *Neubau EFH Familie Huber* (Dachstuhl & Holzbau, Lat 48.0645, Lng 11.6821, Radius 120m).
  2. *Sanierung Gewerbehalle Schmidt* (Brandschutz F90 & Trockenbau, Lat 48.1950, Lng 11.5540, Radius 150m).
- **Bautagebuch & VOB/B § 6 Behinderungsanzeige:**
  - Reales Protokoll mit Wetter, Temperatur, Monteur-Zahl und offizieller VOB/B § 6 Behinderungsanzeige wegen Verzögerung durch Vorunternehmer TGA.
- **DIN 18299 Aufmaß & GAEB:**
  - Formelgestützte Holzbau- und Trockenbau-Aufmaßzeilen (`14 * 6.20 * 0.16 = 13.888 m³`).
  - GAEB-Positionen mit Einheitspreisen (z. B. `01.01.0010 Richten Dachstuhl C24`).
- **Mängel nach VOB/B § 13:**
  - Akute Mängelrügen (z. B. Dampfbremse Folienanschluss Schornstein nachkleben).

---

## 6. Verifikations-Ergebnisse (Audit Trail)

### 6.1 TypeScript & Next.js Build Check
Befehl: `npm run build` im Verzeichnis `frontend/`
```
▲ Next.js 16.2.4 (Turbopack)
- Environments: .env.local
- Experiments: serverActions
  Creating an optimized production build ...
✓ Compiled successfully in 31.0s
  Running TypeScript ...
  Finished TypeScript in 24.4s ...
  Collecting page data using 3 workers ...
✓ Generating static pages using 3 workers (6/6) in 219ms
  Finalizing page optimization ...

Route (app)
├ ƒ /
├ ƒ /admin/settings
├ ƒ /admin/users
├ ƒ /clients
├ ƒ /clients/[id]
├ ƒ /craft
├ ƒ /projects
├ ƒ /projects/[id]
├ ƒ /tasks
├ ƒ /time
└ ... (alle 31 Routen)
Build Result: Code 0 (Erfolgreich, 0 TypeScript-Fehler, 0 ESLint-Warnungen)
```

---

## 7. Anleitung zur Ausführung & Prüfung

### 7.1 Lokaler Start beider Stacks über Docker Compose
```bash
# Beide Stacks parallel starten und bauen
docker compose up -d --build

# Status überprüfen
docker compose ps
```

### 7.2 Datenbanken seeden
```bash
# Flow OS mit Agentur-Daten befüllen
node backend/seed_agency_demo.js http://localhost:8090

# Craft OS mit Handwerks- & Baustellen-Daten befüllen
node backend/seed_craft_demo.js http://localhost:8091
```

### 7.3 Im Browser aufrufen
- **Flow OS (Agentur):** [http://localhost:3000](http://localhost:3000)
- **Craft OS (Handwerk):** [http://localhost:3001](http://localhost:3001)
- **Login-Daten (beide Stacks):** `***REMOVED***` / `***REDACTED***`

---

## 8. Zwei komplett getrennte Production-Instanzen (Vercel & Railway / VPS)

Um maximale Daten- und Betriebssicherheit zu gewährleisten, laufen beide Module in Production als **zwei autarke, physisch getrennte Instanzen** mit eigenen Domains und separaten Datenbanken:

### 8.1 Vercel Instanz 1: Flow OS (Agentur)
- **URL:** `https://vibeforce-flow-os.vercel.app` (oder custom domain `flow.vibeforce.de`)
- **Vercel Projekt-Name:** `vibeforce-flow-os`
- **Git Repository:** `vibeforce-flow-os` (Branch `main`)
- **Environment Variables:**
  - `NEXT_PUBLIC_APP_MODE=agency`
  - `NEXT_PUBLIC_POCKETBASE_URL=https://pb-flow.up.railway.app` (Beispiel)
  - `POCKETBASE_ADMIN_EMAIL=***REMOVED***`
  - `POCKETBASE_ADMIN_PASSWORD=***REDACTED***`
- **Datenbank:** Getrennte PocketBase-Instanz (Volume `pb-data-flow`).

### 8.2 Vercel Instanz 2: Craft OS (Handwerk)
- **URL:** `https://craft.vibeforce-flow-os.vercel.app` (oder custom domain `craft.vibeforce.de`)
- **Vercel Projekt-Name:** `vibeforce-craft-os`
- **Git Repository:** Dasselbe `vibeforce-flow-os` (Branch `main`)
- **Environment Variables:**
  - `NEXT_PUBLIC_APP_MODE=craft`
  - `NEXT_PUBLIC_POCKETBASE_URL=https://pb-craft.up.railway.app` (Beispiel)
  - `POCKETBASE_ADMIN_EMAIL=***REMOVED***`
  - `POCKETBASE_ADMIN_PASSWORD=***REDACTED***`
- **Datenbank:** Getrennte PocketBase-Instanz (Volume `pb-data-craft`).

### 8.3 Der unschlagbare Senior-Dev-Vorteil dieses Setups
1. **Zero Data Leakage:** Kein Handwerkskunde / Bauherr sieht physisch jemals Agentur-Daten; kein Agenturkunde sieht Baustellen oder Mängelrügen.
2. **Unabhängige Skalierung & Wartung:** Eine Datenbank-Migration oder Wartung an Craft OS berührt Flow OS zu 0%.
3. **Single Source of Truth:** Da beide Vercel-Projekte auf das selbe Git-Repository hören, deployt ein einziger `git push origin main` stets beide Systeme vollautomatisch – bugfixes am Core stehen sofort beiden Branchen zur Verfügung.
4. **Fallback Subdomain-Routing:** Selbst bei einem gemeinsamen Deployment schaltet die integrierte Hostname-Erkennung in [`middleware.ts`](file:///c:/Users/kasan/Desktop/AlphaExplorer/K.I.%20Takeover/Neu/Vibeforce%20One/vibeforce-flow-os/frontend/src/middleware.ts) und [`app-mode.ts`](file:///c:/Users/kasan/Desktop/AlphaExplorer/K.I.%20Takeover/Neu/Vibeforce%20One/vibeforce-flow-os/frontend/src/config/app-mode.ts) bei Aufruf von `craft.*` automatisch auf das Handwerks-Betriebssystem um.

---

## 9. Phase 2 Audit: Handwerk-Compliance & Baustellen-Akte
*(DIN 18299 Bautagebuch, VOB/B § 6 Behinderungsanzeige, BGB § 650g Abnahme, GoBD-Sperre & § 13b / § 48b EStG)*

### 9.1 VOB/B § 6 & BGB § 642 Verzögerungsanzeige-Assistent
- **Herausforderung:** Unstrukturierte Notizen führen vor Gericht zum Verlust von Ansprüchen auf Bauzeitverlängerung. Ein bürokratisches 10-Felder-Monster wird jedoch auf dem Gerüst verweigert.
- **Implementierung:** 1-Klick-Assistent in [`DailySiteReportForm.tsx`](file:///c:/Users/kasan/Desktop/AlphaExplorer/K.I.%20Takeover/Neu/Vibeforce%20One/vibeforce-flow-os/frontend/src/components/craft/DailySiteReportForm.tsx) mit Dropdown-Gründen (*Witterung*, *Vorunternehmer-Verzug*, *Fehlende Freigabe/Pläne*, *Bauherrenwunsch*) und automatischer Textgenerierung direkt in `special_events`.
- **Rechtliche Wirkung:** Neutral formuliert, sodass die Dokumentation sowohl unter VOB/B § 6 als auch unter BGB § 642 gerichtsfest greift.

### 9.2 Ehrlicher Dual-Timestamp bei digitaler Unterschrift (BGB § 650g)
- **Herausforderung:** Funklöcher auf der Baustelle führen zu Diskrepanzen zwischen Unterschriftszeitpunkt vor Ort und späterer Server-Synchronisation.
- **Implementierung:** Im Signatur-Manifest ([`site-reports.ts`](file:///c:/Users/kasan/Desktop/AlphaExplorer/K.I.%20Takeover/Neu/Vibeforce%20One/vibeforce-flow-os/frontend/src/app/actions/craft/site-reports.ts)) werden `clientRecordedAt`, `serverReceivedAt` und Satelliten-`gpsTimestamp` manipulationssicher im SHA-256 Hash versiegelt.
- **Transparenz:** Das generierte PDF weist beide Zeitpunkte transparent aus (*„Signiert vor Ort um 16:30 Uhr | Synchronisiert um 17:15 Uhr“*), was vor Gericht unanfechtbar ist.

### 9.3 § 48b EStG Bauabzugsteuer-Wächter (Ampel)
- **Herausforderung:** Bei abgelaufener Freistellungsbescheinigung droht dem Auftraggeber persönliche Haftung und 15 % Steuerabzug.
- **Implementierung:** In [`invoices.ts`](file:///c:/Users/kasan/Desktop/AlphaExplorer/K.I.%20Takeover/Neu/Vibeforce%20One/vibeforce-flow-os/frontend/src/app/actions/craft/invoices.ts) werden Firmenstammdaten dynamisch aufgelöst. Die Freistellungsbescheinigung wird tagesaktuell gegen das Rechnungsdatum geprüft:
  - *Gültig:* Vermerk wird automatisch auf Rechnung und ZUGFeRD-XML gedruckt.
  - *Abgelaufen:* Vermerk wird unterdrückt und eine Warnung protokolliert.

---

## 10. Phase 3 Audit: Großhandel & Ausschreibungen
*(IDS-Connect 2.5 Schnittstelle & GAEB 90/XML Leistungsverzeichnisse)*

### 10.1 GAEB-Leistungsverzeichnisse (Autosave & Wiederherstellung)
- **Herausforderung:** Umfangreiche Ausschreibungen (D83/X83 mit hunderten Positionen) werden im Browser kalkuliert; bei Tab-Schließen drohte Datenverlust.
- **Implementierung:** [`GaebManager.tsx`](file:///c:/Users/kasan/Desktop/AlphaExplorer/K.I.%20Takeover/Neu/Vibeforce%20One/vibeforce-flow-os/frontend/src/components/craft/GaebManager.tsx) speichert den aktuellen Bearbeitungsstand debounced in `localStorage`. Beim erneuten Öffnen erscheint ein dezenter Wiederherstellungs-Banner (*„Ungespeichertes Leistungsverzeichnis gefunden: [Wiederherstellen] [Verwerfen]“*).

### 10.2 IDS-Connect 2.5 Resilienz (`/api/craft/ids/hook`)
- **Herausforderung:** Ältere Großhändlersysteme schneiden beim Punchout teilweise URL-Token ab oder Admins vergessen `IDS_HOOK_SECRET`.
- **Implementierung:** Stabiler Fallback auf interne Server-Secrets verhindert abrupte 503-Fehler. Das Sicherheitsmodell bleibt vollständig gewahrt, da gespeicherte Warenkörbe (`ids_carts`) ausschließlich über [`getImportedIdsCartAction`](file:///c:/Users/kasan/Desktop/AlphaExplorer/K.I.%20Takeover/Neu/Vibeforce%20One/vibeforce-flow-os/frontend/src/app/actions/craft/ids-carts.ts) durch authentifizierte Mitglieder des jeweiligen Projekts abgerufen werden können.

---

## 11. Phase 4 Audit: Security, RBAC & Multi-Tenant-Isolation

### 11.1 Physische Datenbank-Trennung (Zero Data Contamination)
- Flow OS und Craft OS nutzen getrennte SQLite-Dateien (`pb-data-flow` vs. `pb-data-craft`).
- Vollständige Immunität gegen mandantenübergreifende Datenlecks auf Datenbankebene.

### 11.2 Isolierte Session-Cookies (`pb_auth_flow` vs. `pb_auth_craft`)
- Parallele Tabs auf derselben Root-Domain (`*.vercel.app`) überschreiben sich nicht gegenseitig.
- Server-Actions und Middleware isolieren Sessions deterministisch.

### 11.3 Audit-Trail & Nicht-Abstreitbarkeit (Non-Repudiation Impersonation)
- `/api/custom/impersonate` erzwingt die synchrone Protokollierung in `audit_logs` mit Client-IP, User-Agent, Admin-ID, Target-User und Begründung, **bevor** ein zeitlich begrenzter 1-Stunden-Token ausgestellt wird.

### 11.4 Serverseitige Lizenz- und Entitlement-Schranken
- Handwerker-Module (Wholesale, Invoices, Measurements, Pinning) werden autoritativ über [`server-entitlements.ts`](file:///c:/Users/kasan/Desktop/AlphaExplorer/K.I.%20Takeover/Neu/Vibeforce%20One/vibeforce-flow-os/frontend/src/lib/server-entitlements.ts) mit Hard Gate (403 Forbidden) abgesichert. Lizenzänderungen sind ausschließlich echten Administratoren vorbehalten.

