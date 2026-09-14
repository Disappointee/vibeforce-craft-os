# Vibeforce Craft OS — Arbeitsauftrag für die Craft-Session

> **Workspace:** `c:\Users\kasan\Desktop\AlphaExplorer\K.I. Takeover\Neu\Vibeforce One\vibeforce-craft-os`  
> **Status:** Eigenständiges Repository (`main`, Commit `c26856f`), isolierte Konfiguration (`NEXT_PUBLIC_APP_MODE=craft`).  
> **Backend:** `https://pb-vibeforce.46-225-178-235.sslip.io`  
> **Ziel-Domain:** `https://craft-vibeforce.vercel.app`

---

## 🎯 Unmittelbare Aufgaben in dieser Session (Schritt für Schritt)

### Schritt 1: Craft Hub Ergonomie & Zero-Scroll Navigation
* **Problem:** Auf Standard-Laptops & Tablets (< 1.450px) zwingt der Craft Hub (`/craft`) zu horizontalem Scrollen:
  * Die 8 Modul-Tabs liegen in einer einzelnen horizontalen Endloszeile; beim Scrollen nach rechts verschwindet `Bautagesberichte` links.
  * Header-Aktionsbuttons schneiden rechts `+ Baustelle anlegen` ab (`Baustelle anleg...`).
  * Globaler Breiten-Überhang erzeugt einen horizontalen Scrollbalken am Fensterrand.
* **Ziel:** 
  * Responsive Navigation nach Option A (2-Cluster Arbeitsbereich: *Baustelle & Doku* vs. *Kaufmännisch & Abrechnung*) oder adaptive Pill-Bar mit Kurzformen.
  * `flex-wrap` im Header, damit kein Button abgeschnitten wird.
  * 0px horizontaler Überhang (`scrollWidth === innerWidth`).

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
