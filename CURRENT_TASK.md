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

### Schritt 2: Mängelmanagement vor Ort (`/craft/defects`)
* **Problem:** Sidebar-Menüpunkt „Mängel & Baustellen-Aufgaben“ führt bisher auf die generische Aufgabenverwaltung `/tasks` („Meine Aufgaben“).
* **Ziel:** Dedizierte Handwerks-Zentrale unter `/craft/defects`:
  * Schnellerfassungs-Dialog für Mängel vor Ort (`NewDefectDialog`) mit Kamera-/Fotoupload, SHA-256 Integritätsprüfung, Gewerk und VOB/B § 13 Fristsetzung.
  * Umschaltbar zwischen Mängelliste und 2D-Bauplan (`PlanPinningManager`).
  * Generierung formaler VOB/B § 13 Abs. 5 Mängelrügen an Nachunternehmer.

### Schritt 3: Monteur-Stempeluhr (`/craft/time`)
* **Problem:** Menüpunkt „Monteur-Stempeluhr“ führt auf die generische Agentur-Zeiterfassung `/time`.
* **Ziel:** Großflächiges, glove-ready Baustellen-Terminal (`MonteurTimeClock`):
  * Große Touch-Buttons (>= 64px) für Kommen, Gehen und Pause.
  * Schnellauswahl: Baustelle, Einsatztyp (Baustelle, Fahrtzeit/Rüstzeit, Werkstatt, Regiestunden gem. § 2 Abs. 10 VOB/B).
  * GPS-Geofencing Verifikation vor Ort.
  * Tagesstundenzettel mit Schichtabschluss.

### Schritt 4: Eigenes Vercel-Projekt für Craft OS
* Verknüpfung eines eigenständigen Vercel-Projekts `vibeforce-craft-os` und Zuweisung der Domain `craft-vibeforce.vercel.app`.
