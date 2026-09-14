# Vibeforce Craft OS — Arbeitsauftrag für die Craft-Session

> **Workspace:** `c:\Users\kasan\Desktop\AlphaExplorer\K.I. Takeover\Neu\Vibeforce One\vibeforce-craft-os`  
> **Status:** Eigenständiges Repository (`main`, Commit `c26856f`), isolierte Konfiguration (`NEXT_PUBLIC_APP_MODE=craft`).  
> **Backend:** `https://pb-vibeforce.46-225-178-235.sslip.io`  
> **Ziel-Domain:** `https://craft-vibeforce.vercel.app`

---

## 🎯 Unmittelbare Aufgaben in dieser Session (Schritt für Schritt)

### Schritt 1: Craft Hub Ergonomie & Zero-Scroll Navigation (✅ ABGESCHLOSSEN)
* **Ergebnis:** 
  * Responsive 2-Cluster Navigation implementiert (*Baustelle & Doku* vs. *Kaufmännisch & Abrechnung*).
  * 4 touch-ergonomische Primärkarten (`lg:grid-cols-4`, adaptive Bezeichnungen) + persistente Sekundär-Schnellzugriff-Pills.
  * `flex-wrap` im Header, sodass Aktionsbuttons (`+ Baustelle anlegen`, `+ Bericht erfassen`, `Module & Lizenzen`) auf allen Bildschirmbreiten vollständig sichtbar bleiben.
  * Automatisierter Multi-Viewport Playwright-Test (`tools/test_craft_ergonomics.mjs`) über 5 Viewports (Mobile 390px, Tablet 768px, Small Laptop 1024px, Desktop 1280px, Full HD 1920px) verifiziert: **Exakt 0px horizontaler Überhang** auf allen Geräten!
  * Commit: `d06c94e`.

### Schritt 2: Mängelmanagement vor Ort (`/craft/defects`) (✅ ABGESCHLOSSEN)
* **Ergebnis:**
  * Dedizierte Handwerks-Zentrale unter `/craft/defects` (`page.tsx` & `DefectsPageClient.tsx`) mit Baustellen-Umschalter, VOB-KPI-Kacheln, Mängelsuche und Gewerk-/Schweregrad-/Status-Filtern implementiert.
  * Schnellerfassungs-Dialog für Vor-Ort-Mängel (`NewDefectDialog`) mit Direktauslöser für Handykamera / Fotoupload, kryptografischer SHA-256 Integritätsprüfung (GoBD-konform), GPS-Erfassung, VOB/C-Gewerkeliste und VOB/B § 13 Fristsetzung (+7, +14, +21 Tage Schnellwahltasten).
  * Nahtlos umschaltbar zwischen interaktiver Mängelliste und 2D-Bauplan (`PlanPinningManager`).
  * Vollautomatischer Generator für formelle Nachunternehmer-Mängelrügen gem. VOB/B § 13 Abs. 5 mit Fristsetzung, Androhung der Ersatzvornahme auf Kosten des Verursachers, 1-Klick-Kopieren & Druckfunktion.
  * Navigation in Desktop-Sidebar (`layout.tsx`) und Mobile-TabBar (`MobileTabBar.tsx`) im Craft-Modus direkt auf `/craft/defects` umgestellt.
  * Vollständig automatisiert verifiziert via Playwright E2E-Test (`tools/test_craft_defects.mjs`) über Desktop & Mobile (390px iPhone 14, 0px Überhang).
  * Commit: `6992d50`.

### Schritt 3: Monteur-Stempeluhr (`/craft/time`) (✅ ABGESCHLOSSEN)
* **Ergebnis:**
  * Großflächiges, handschuhtaugliches Baustellen-Terminal (`MonteurTimeClock`) unter `/craft/time` (`page.tsx` & `MonteurTimeClockClient.tsx`) implementiert.
  * Große Touch-Targets (KOMMEN $\ge 80\,\text{px}$, PAUSE $\ge 90\,\text{px}$, GEHEN $\ge 90\,\text{px}$) erfüllen die Anforderung $\ge 64\,\text{px}$ mit Leichtigkeit.
  * 4 VOB-Einsatztypen: *Baustelle & Montage*, *Fahrtzeit & Rüstzeit*, *Werkstatt & Vorfertigung*, *Regiestunden gem. § 2 Abs. 10 VOB/B*.
  * GPS-Geofencing mit Koordinaten-Verifikation gegen aktive Baustelle.
  * Schichtabschluss- und Tagesstundenzettel-Modal mit rechtskonformem Nachweis gem. VOB/B § 2 Abs. 10 und ArbZG sowie Druckfunktion.
  * Navigation in Desktop-Sidebar (`layout.tsx`) und Mobile-TabBar (`MobileTabBar.tsx`) im Craft-Modus auf `/craft/time` umgestellt.
  * Vollautomatisiert via Playwright E2E-Test (`tools/test_craft_time.mjs`) auf Desktop und Mobile (390px iPhone 14, 0px Überhang) erfolgreich getestet.
  * Commit: `4fd82fd`.

### Schritt 4: Eigenes Vercel-Projekt für Craft OS (✅ ABGESCHLOSSEN)
* **Ergebnis:**
  * Eigenständiges Vercel-Projekt `vibeforce-craft-os` erfolgreich eingerichtet und mit Produktions-Umgebungsvariablen (`NEXT_PUBLIC_APP_MODE=craft`, `NEXT_PUBLIC_POCKETBASE_URL=https://pb-vibeforce.46-225-178-235.sslip.io`) konfiguriert.
  * Next.js 16 Production Build in Vercel erfolgreich durchgelaufen (`Build Completed in /vercel/output`).
  * Live-Domains zugewiesen und verifiziert:
    - **Haupt-Domain:** `https://craft-vibeforce.vercel.app` (Status: HTTP 200 / `X-Vibeforce-App-Mode: craft`)
    - **Zweit-Domain:** `https://vibeforce-craft-os.vercel.app`
  * Alle Routen (`/craft`, `/craft/defects`, `/craft/time`) sind live und voll funktionsfähig.

