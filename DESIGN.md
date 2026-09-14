# Vibeforce Flow OS — Brand & Interface Design System (DESIGN.md)

> **Version:** 2.0 (September 2026)  
> **Status:** Production / Master Reference  
> **Scope:** Web, Tablet & Mobile Field Apps (Vibeforce Flow, Craft Hub, Bautagesbericht, Aufmaß-Grid, ZUGFeRD)

---

## 1. Vision & Visual Philosophy

Vibeforce Flow ist das Betriebssystem für modernes, hochpräzises Handwerk und Bau-Projektmanagement. Es kombiniert **industrielle Verlässlichkeit** für den harten Baustellen-Alltag (Touch-optimiert, Offline-First, sonnenlichttauglich) mit der **Raffinesse einer State-of-the-Art Software** (schnelle Mikro-Interaktionen, typografische Disziplin, Null Überflüssiges).

### Kern-Leitsätze:
1. **Field-First & Glove-Ready:** Touch-Targets mindestens 44×44px, klare Kontraste (WCAG AAA für kritische Baustellen-Eingaben), kein fummeliges Micro-UI.
2. **Datendichte mit Ruhe:** Aufmaße, Regieberichte und Bautagebücher transportieren viele Zahlen. Tabellen und Grids nutzen monospace-Ziffern (`tabular-nums`) und strikt semantische Rhythmen.
3. **Anti-AI-Slop Disziplin:** Keine generischen violett-pinken Verläufe, keine übertriebenen `backdrop-blur-xl`-Effekte auf Formularen, maximal 2 bewusste Akzente pro Screen.

---

## 2. Farb-Architektur & Semantische Tokens

Alle Farben sind im zukunftssicheren **OKLCH-Farbraum** definiert und besitzen standardisierte Fallbacks für CSS & Tailwind v4.

### 2.1 Primäre Markenfarben
* **Vibeforce Electric Blue (Primary Brand):**  
  `oklch(0.578 0.203 263.676)` / `#2563EB`  
  *Einsatz:* Primäre Handlungsaufrufe (CTA), Bauzeitenplan-Aktive-Phasen, primäre Navigation.
* **Klicklaut Teal (Corporate Accent):**  
  `oklch(0.601 0.147 178.618)` / `#00A699`  
  *Einsatz:* Qualitätssiegel, Verifizierungs-Badges, erfolgreiche Freigaben, Klicklaut-Verknüpfungen.

### 2.2 Semantische Funktions-Tokens
| Token | OKLCH / Hex | Zweck |
| :--- | :--- | :--- |
| **`--success`** | `oklch(0.627 0.194 149.214)` / `#16A34A` | Abgenommene Gewerke, signierte Berichte, ZUGFeRD valide |
| **`--warning`** | `oklch(0.795 0.184 86.047)` / `#D97706` | Baubehinderung, Witterungswarnung, Sync ausstehend |
| **`--destructive`** | `oklch(0.577 0.245 27.325)` / `#DC2626` | Mängelrüge, Prüffehler, Sicherheitsstopp |
| **`--info`** | `oklch(0.623 0.214 259.815)` / `#3B82F6` | Geofence-Hinweis, Notizen, allgemeine Gewerke-Metadaten |

### 2.3 Surface & Contrast Matrizen

#### Dark Theme (OLED / Baustellen-Modus — Standard)
* **Background:** `#121212` (Tiefes, blendfreies Dunkelgrau)
* **Card / Layer 1:** `#18181A` (Erhöhte Arbeitsfläche)
* **Popover / Layer 2:** `#1C1C1E` (Modale Dialoge, Dropdowns)
* **Border:** `rgba(255, 255, 255, 0.08)` (Feine, nicht-dominante Konturen)
* **Foreground:** `oklch(0.985 0 0)` / `#F8FAFC`
* **Muted Foreground:** `oklch(0.708 0 0)` / `#94A3B8`

#### Light Theme (Büro & Reporting)
* **Background:** `oklch(0.985 0.001 247.839)` / `#F8FAFC`
* **Card / Surface:** `#FFFFFF`
* **Border:** `oklch(0.922 0 0)` / `#E2E8F0`
* **Foreground:** `oklch(0.145 0.02 272.091)` / `#0F172A`
* **Muted Foreground:** `oklch(0.523 0.026 267.968)` / `#64748B`

---

## 3. Typografie & Zahlenhierarchie

* **Body & UI Font:** `Inter`, ui-sans-serif, system-ui (Neutral, ultra-leserlich)
* **Heading Font:** `Inter` (Medium/SemiBold — keine lauten Display-Schriften für Arbeitswerkzeuge)
* **Technical / Numbers Font:** `Geist Mono` oder `JetBrains Mono`  
  *Pflicht für:* Aufmaß-Werte, DIN-Messungen, Uhrzeiten, ZUGFeRD-Beträge, GPS-Koordinaten.
* **Typografische Skala:**
  * `xs`: 12px (Labels, Status-Badges, Zeitstempel)
  * `sm`: 14px (Tabellenzellen, Hilfetexte, sekundäre Werte)
  * `base`: 16px (Standard-Fließtext, Formular-Inputs — Mindestgröße gegen iOS-Auto-Zoom)
  * `lg`: 18px (Sektions-Titel, Kardinalwerte)
  * `xl`: 20px (Modal-Header, Karten-Überschriften)
  * `2xl`: 24px (Dashboard KPIs, Tagesbericht-Datum)
  * `3xl`: 30px (Haupttitel, Begrüßung)

---

## 4. Spacing, Raster & Radien

* **8pt Baseline Grid:** Abstände strikt in Vielfachen von 4px / 8px (`p-2`, `p-4`, `p-6`, `gap-3`, `gap-4`).
* **Radius-Tokens:**
  * Inputs, Badges, Tabs: `rounded-lg` (8px – 10px / `0.625rem`)
  * Cards, Bautagesbericht-Container: `rounded-xl` (12px – 14px)
  * Modals, Bottom-Sheets: `rounded-2xl` (16px – 18px)
* **Touch-Zonen:** Interaktive Elemente (Buttons, Checkboxen, Signature-Felder) haben eine minimale Hitbox von **44×44px**.

---

## 5. Drei alternative Design-Entwürfe (Optik-Varianten)

Für die visuelle Ausrichtung von Vibeforce Flow stehen drei kuratierte Richtungen zur Verfügung:

### Variante A: „Industrial Titanium & Electric Blue“ (Standard & Empfohlen)
* **Charakter:** Hightech-Präzision, Ingenieurs-Ästhetik, klar strukturiert.
* **Farb-Stanzung:** Tiefschwarzer Grund (`#121212`), feine Zink-Kanten (`border-white/10`), Akzentuiertes *Electric Blue* (`#2563EB`) für Interaktionen und KPIs.
* **Zielgruppe:** Generalunternehmer, Bauleiter, Ingenieurbüros, die maximale Klarheit und Tempo wollen.

### Variante B: „Nordic Minimal & Klicklaut Teal“ (Studio & Architektur)
* **Charakter:** Ruhig, warm-organisch abgetönt, hochwertige Studio-Atmosphäre.
* **Farb-Stanzung:** Obsidian-Grau (`#0F1117`), warme Muted-Töne, punktuelles *Klicklaut Teal* (`#00A699`) als edler Akzent.
* **Zielgruppe:** Architekten, anspruchsvolle Innenausbauer, Tischler & Premium-Handwerksbetriebe.

### Variante C: „Rugged Tactical & High-Vis Safety Amber“ (Field-First Baustelle)
* **Charakter:** Baustellentauglich, ultra-robust, hohe Signalwirkung bei direkter Sonneneinstrahlung.
* **Farb-Stanzung:** Asphalt Slate (`#090D16`), Signal-Amber (`#F59E0B`) und Safety-Green (`#10B981`), massive Borders (1.5px), pillenförmige Status-Kapseln.
* **Zielgruppe:** Tiefbau, Rohbau, Außendienst-Monteure auf Tablets bei Regen und Sonnenlicht.

---

## 6. Komponenten-Spezifikationen

### 6.1 Bautagesbericht-Karte & Digitales Signatur-Feld (Daily Site Report)
* **Header:** Baustellen-Name, Datum, Witterung (Icon + Temp), Geofence-Status (Pille).
* **Body:** Arbeitskräfte-Grid (Stunden / Gewerk), Fotodokumentation mit Thumbnail-Raster, Mängel-Checkliste.
* **Footer:** Digitales Signatur-Feld mit **Auto-Expand-Funktion**:
  * **Kompakter Initialzustand:** Platzsparende 120px-Vorschau mit deutlicher Aufforderung (*„✍️ Tippen zum Unterschreiben“*).
  * **Expandiertes Großflächen-Studio (Maximized Signing Canvas):** Bei Berührung/Klick expandiert das Canvas sofort in ein bildschirmfüllendes Signatur-Studio (auf Smartphones 92vh Full-Screen Drawer, auf Tablets/Desktop großformatiges 900px High-Contrast Studio).
  * **Führungslinie:** Gestrichelte VOB-Basislinie (`✕ -----------------------`) für saubere Ausrichtung.
  * **Glove-Ready Buttons:** Mindestens 44px Hitboxen für *Löschen*, *Abbrechen* und *✓ Unterschrift übernehmen*.
  * **Zustands-Rückführung:** Nach Bestätigung wird die Signatur vektorgetreu in den Bericht eingebettet, der Status wechselt auf `✓ Signiert` und der Bericht wird für die VOB/ZUGFeRD-Freigabe gesperrt.

### 6.2 Aufmaß-Grid (Measurement Grid)
* **Tabellenlayout:** Monospace-Zahlen (`tabular-nums`), sofortige Summen-Neuberechnung.
* **Formel-Support:** Länge × Breite × Höhe mit automatischer Einheitenumrechnung ($m^2$, $m^3$, $lfdm$).

### 6.3 Offline- & Sync-Indikator
* **Online:** Dezent inaktiv (`text-muted-foreground`)
* **Syncing:** Animierter Puls in *Klicklaut Teal* (150ms Zyklus)
* **Offline:** Klares Warning-Badge in *Safety Amber* mit lokaler Cache-Zählung (z.B. *„3 Berichte lokal gepuffert“*).

---

## 7. Anti-AI-Slop & Qualitäts-Garantie

* 🚫 **Keine kitschigen Farbverläufe** (z.B. Pink-Violett).
* 🚫 **Keine künstlichen 3D-Icons** oder Glas-Effekte, die die Lesbarkeit beeinträchtigen.
* 🚫 **Keine unlesbaren zarten Schriften** auf der Baustelle.
* ✅ **Geprüft nach:** `00_core_governance.md` und `design-system-ci`.
