# VIBE Craft M007 — Implementation Plan (5 Pakete)

> **Baseline:** Bestandsanalyse abgeschlossen. Alle Kern-Dateien (`geofencing.ts`, `pocketbase-types.ts`, `constants.ts`, `i18n.ts`, `zugferd.ts`, `pdf-service.ts`, `craft-image-compressor.ts`, `offline-sync.ts`, `site-reports.ts`, `measurements.ts`, Migration `1781200000`, `db_healthcheck.js`) gelesen und verstanden.
> **Branch:** `feat/vibe-craft-m007`
> **Qualität:** `tsc --noEmit = 0 Fehler` nach jedem Paket Pflicht.

---

## PAKET 1: Geofencing Engine, Datenmodell & SQLite WAL Concurrency
**Creator:** `cohere/north-mini-code:free` | **Validator:** `nvidia/nemotron-3-super-120b-a12b:free`

### 1a. `frontend/src/lib/geofencing.ts` härten
- [ ] **Epsilon-Perturbation**: `+1e-9` auf Koordinaten vor Distanzberechnung
- [ ] **Boundary Pre-Check**: `d <= 1.0 m` → sofort `inside` (GPS-Jitter-Schutz)
- [ ] **DwellTimeTracker** erweitern:
  - Asymmetrische Hysterese: `T_in = 120s`, `T_out = 900s` (Transporter-Materialgänge)
  - Speed-Gate Override: `v > 25 km/h (6.94 m/s)` → `60s` Dwell
  - Dead-Reckoning Freeze bei GPS-Abriss (Keller): letzte Position `freeze` bis neue Fix
- [ ] Export: `DwellTimeTracker`, `isInsideGeofence`, `GeoPosition`, `GeofenceConfig`

### 1b. `frontend/src/lib/pocketbase-types.ts` erweitern (nur ERWEITERN!)
- [ ] `SiteReportRecord`: `signature_manifest?: string`, `signature_strokes?: number[][][]`, `gps_lat?: number`, `gps_lon?: number`, `gps_accuracy?: number` hinzufügen
- [ ] `InvoiceZugferdRecord`: `prepaid_amount?: number` (kumulierte VOB-Abschläge, BT-113)
- [ ] Types strikt bleiben (keine `any`)

### 1c. `frontend/src/lib/constants.ts` & `i18n.ts` befüllen
**constants.ts:**
- [ ] `QUALIFICATION_LEVELS`, `QUALIFICATION_LEVEL_LABEL_MAP` (meister/geselle/helfer/azubi)
- [ ] `MEASUREMENT_UNIT_LABEL_MAP` (m/m2/m3/h/stk/kg/psch)
- [ ] `SITE_REPORT_STATUS_LABEL_MAP` (draft/signed/invoiced)
- [ ] `GEOFENCE_TYPE_LABEL_MAP` (none/circle/polygon)

**i18n.ts (Namespace `craft.*`):**
- [ ] DE: Alle Labels aus Master-Spec § 6 VOB/B, DIN 18299, § 13b UStG
- [ ] EN: 100% Key Parity
- [ ] Keine hardcoded Strings in Komponenten

### 1d. Backend Migration & SQLite PRAGMAs verifizieren
**`backend/pb_migrations/1781200000_created_craft_collections.js`:**
- [ ] `site_reports`: Forensische Sig-Felder (`signature_manifest`, `signature_strokes`, `gps_*`)
- [ ] `invoices_zugferd`: Feld `prepaid_amount` (number)
- [ ] `evidence_items`: `sha256_hash`, `gps_lat`, `gps_lon`, `taken_at` Pflicht
- [ ] Indizes: `idx_site_reports_project`, `idx_measurements_report`, `idx_evidence_report`

**`backend/db_healthcheck.js`:**
- [ ] PRAGMA `journal_mode = WAL`, `busy_timeout = 10000`, `synchronous = NORMAL`, `cache_size = -64000`, `wal_autocheckpoint = 1000`
- [ ] WAL-Truncate bei >50 MB
- [ ] Auto-Recovery via `.dump` bei Korruption

### 1e. Server Actions härten (`site-reports.ts`, `measurements.ts`)
- [ ] **Hard-Lock**: `status === 'signed' || 'invoiced'` → Mutation verboten (GoBD)
- [ ] **Append-Only Addendum**: Update auf signiertem → neuer `draft`-Record mit Verweis
- [ ] `createReportRevisionAction(reportId, reason)` für GoBD-Revision
- [ ] `measurements.ts`: Sub-Ressourcen-Prüfung (`site_report` existiert, nicht signiert/invoiced)

### Validierung PAKET 1
- [ ] `npx tsc --noEmit` → 0 Fehler
- [ ] STAMP: VERIFIED vom Validator-Modell
- [ ] Commit: `feat(craft): Paket 1 - Geofencing Engine & Datenmodell`

---

## PAKET 2: Baustellen-Map, DSGVO Tile-Proxy & Mobile UX
**Dependencies:** `npm install leaflet react-leaflet @types/leaflet` (bereits installiert ✓)
**Creator:** `google/gemma-4-31b-it:free` | **Validator:** `nvidia/nemotron-3-super-120b-a12b:free`

### 2a. Next.js Tile-Proxy (`/api/craft/tiles/[z]/[x]/[y]/route.ts`)
- [ ] Server-seitiger Kachelabruf von OSM (keine Client-IP-Leakage)
- [ ] `Cache-Control: public, max-age=2592000, immutable`
- [ ] Rate-Limit / Referrer-Policy strikt
- [ ] Fallback auf lokale Offline-Kacheln bei Netzwerkausfall

### 2b. `GeofenceMapEditor.tsx` härten
- [ ] Einbindung lokaler Tile-Proxy URL `/api/craft/tiles/{z}/{x}/{y}`
- [ ] Touch-Targets ≥ 56px (WCAG 2.5.5)
- [ ] Outdoor High-Contrast Mode (CSS `filter: contrast(1.5)` Toggle)
- [ ] Polygon-Editor: Snap-to-vertex, Undo/Redo

### 2c. `GeofenceCheckinPrompt.tsx` erstellen
- [ ] Push-Vorschlag mit Haptik: `navigator.vibrate([100, 50, 100])`
- [ ] Web Audio Synthesizer Earcons (0ms Latenz, offline-fähig)
- [ ] Accessibility: `role="alertdialog"`, Fokus-Trap, ESC zum Schließen

### 2d. `useGeofenceWatch.ts` härten
- [ ] Integration asymmetrische Hysterese aus `DwellTimeTracker`
- [ ] Dead-Reckoning Freeze: bei `accuracy > 50m` oder `speed === null` → Position hold
- [ ] Battery-friendly: `maximumAge: 30000`, `timeout: 10000`, `enableHighAccuracy: true` nur im Foreground

### Validierung PAKET 2
- [ ] `npx tsc --noEmit` → 0 Fehler
- [ ] STAMP: VERIFIED
- [ ] Commit: `feat(craft): Paket 2 - Baustellen-Map & Tile-Proxy`

---

## PAKET 3: VOB-Aufmaß & Digitaler Regiebericht
**Dependencies:** Keine neuen
**Creator:** `cohere/north-mini-code:free` | **Validator:** `inclusionai/ling-3.0-flash-fin:free`

### 3a. `MeasurementGrid.tsx` härten
- [ ] VOB Teil C / DIN 18299 L×B×H Formelevaluation (bereits Shunting-Yard ✓)
- [ ] Server-Side Preiskalkulation (bereits in `updateRow` ✓)
- [ ] GoBD Mutation-Lock: Parent-Report `signed`/`invoiced` → Grid `readOnly`
- [ ] Übermessungsregel DIN 18299 § 4: Aussparungen < 2,5 m² voll übermessen
- [ ] Tax-Rate-Split pro Position: `reverse_charge_13b` (0%) vs `standard_19`

### 3b. `DailySiteReportForm.tsx` härten
- [ ] Wetter-Erfassung (bereits ✓)
- [ ] Stunden nach Qualifikation (meister/geselle/helfer/azubi) → Summenbildung
- [ ] Lokales Auto-Drafting:
  - Autosave debounced 300ms (localStorage/IndexedDB)
  - `beforeunload` → Draft persistieren
  - Crash-Recovery: Draft beim nächsten Öffnen anbieten

### 3c. Foto-Upload mit `craft-image-compressor.ts`
- [ ] Client-Side Canvas WebP Kompression: max 1920×1080, ~200 KB, q=0.82
- [ ] SHA-256 GoBD-Fingerprint (bereits in `computeSha256` ✓)
- [ ] EXIF-Stripping (GPS nur wenn User zustimmt)
- [ ] Upload nach Kompression, Progress-Indikator

### 3d. Routen verifizieren
- [ ] `/craft` → `CraftHubClient` (bereits ✓)
- [ ] `/projects/[id]/site-reports` (Liste, bereits ✓)
- [ ] `/projects/[id]/site-reports/new` (Form, bereits ✓)

### Validierung PAKET 3
- [ ] `npx tsc --noEmit` → 0 Fehler
- [ ] STAMP: VERIFIED
- [ ] Commit: `feat(craft): Paket 3 - VOB-Aufmaß & Regiebericht`

---

## PAKET 4: Gerichtsfeste Signatur & 400ms ZUGFeRD 2.1.1 E-Rechnung
**Dependencies:** `npm install signature_pad` (bereits installiert ✓)
**Creator:** `poolside/laguna-s-2.1:free` | **Validator:** `inclusionai/ling-3.0-flash-fin:free` & `nvidia/nemotron-3-super-120b-a12b:free`

### 4a. `SignaturePad.tsx` härten
- [ ] Biometrische Vektordaten extrahieren: `pad.toData()` → Array `{x, y, time, pressure?}`
- [ ] Speichern in `signature_strokes` (JSON) für Schriftsachverständige (§ 439 ZPO)
- [ ] Rechtssichere Klausel über Canvas: "Hiermit bestätige ich die Richtigkeit..." (VOB § 15 Abs. 3)
- [ ] Tamper-Evident: Hash der Strokes in `signature_manifest` (SHA-256)

### 4b. `zugferd.ts` härten (EN 16931 & § 13b UStG)
- [ ] Header Tax Category `AE` (Reverse Charge Bauleistungen)
- [ ] **Kein** `ExemptionReason` auf Line-Ebene (nur Header)
- [ ] B2B-USt-IdNr Schranke: `buyerVatId` Pflicht bei § 13b (§ 14a Abs. 5 UStG)
- [ ] Kumulierter VOB-Abschlag: `TotalPrepaidAmount` (BT-113)
- [ ] TypeCode: `386` (Abschlag) / `380` (Standard) / `381` (Gutschrift)
- [ ] `paymentTerms`: VOB/B § 16 Abs. 1 (14 Tage)

### 4c. `craft-pdf-templates.ts` härten
- [ ] Tamper-Proof Document Fingerprint: kanonischer Payload-Hash (SHA-256)
- [ ] QR-Code zur Verifikation (Deep-Link: `/verify/{fingerprint}`)
- [ ] GoBD/§ 127 BGB Siegel im Footer sichtbar
- [ ] PDF/A-1b Konformität (Fonts embedded, Metadata)

### 4d. `pdf-service.ts` Playwright Pool verifizieren
- [ ] 2-Tier Priority Queue: max 2 Slots Batch, Slot 3 reserviert für interaktiv
- [ ] AbortSignal Support für Abbruch
- [ ] Self-Healing: Recycle nach 50 Jobs oder Heap-Spike
- [ ] Timeout: 30s default, 120s für komplexe Rechnungen

### 4e. `invoices.ts` Server Action
- [ ] Revisionssichere E-Rechnungs-Erstellung
- [ ] ZUGFeRD XML + PDF in einer Transaktion
- [ ] `prepaid_amount` aus Vorrechnungen kumulieren
- [ ] DATEV-Export-Flag setzen nach erfolgreicher Erstellung

### Validierung PAKET 4
- [ ] `npx tsc --noEmit` → 0 Fehler
- [ ] STAMP: VERIFIED (doppelt: FinTech + Adversarial)
- [ ] Commit: `feat(craft): Paket 4 - Signatur & ZUGFeRD 2.1.1`

---

## PAKET 5: DATEV Export & 3-Store Offline-Puffer
**Dependencies:** `npm install idb` (bereits installiert ✓)
**Creator:** `cohere/north-mini-code:free` | **Validator:** `minimax/minimax-m3:free`

### 5a. `datev-export.ts` erstellen/härten
- [ ] DATEV Buchungsstapel EXTF 700 (bereits Implementierung vorhanden ✓)
- [ ] Konto 8400 (SKR03) / 4400 (SKR04) für 19% Erlöse
- [ ] Konto 8337 (SKR03) / 4337 (SKR04) für § 13b Reverse Charge
- [ ] Kostenstelle = Baustellen-ID (Projekt-Key)
- [ ] Split-Buchung bei gemischten Rechnungen (13b + 19%)
- [ ] CRLF Zeilenenden, UTF-8, Semikolon-Trennzeichen

### 5b. `offline-sync.ts` 3-Store Architektur härten
**Store 1: `report_drafts`**
- [ ] Autosave bei jedem Tastenanschlag (debounced 300ms)
- [ ] 100% Crash-Recovery: `beforeunload` + `visibilitychange`
- [ ] Schema: `id`, `projectId`, `draftData`, `updatedAt`, `version`

**Store 2: `media_blobs`**
- [ ] Fotos als Binär-Blobs (umgeht Storage-Quota)
- [ ] Index: `sha256_hash` für Deduplikation
- [ ] Max 50 MB pro Baustelle, LRU-Eviction

**Store 3: `sync_outbox` (Quarantäne statt Löschung!)**
- [ ] Exponential Backoff mit Jitter: `min(1000 * 2^retry + random(0-500), 300000)`
- [ ] Max 5 Retries → Quarantäne-Flag `quarantined: true`
- [ ] **NIEMALS löschen** — Warnbanner im UI für Handwerker
- [ ] Manuelle Retry-Aktion im UI

### 5c. `useOfflineSync.ts` härten
- [ ] Auto-Replay bei `online` Event
- [ ] Quarantäne-Warnbanner: "X Einträge konnten nicht synchronisiert werden — manuelle Prüfung erforderlich"
- [ ] Konfliktlösung: Server-Wins mit lokaler Vorschau (Diff)
- [ ] Progress-Indikator: "Synchronisiere 3/12..."

### Validierung PAKET 5
- [ ] `npx tsc --noEmit` → 0 Fehler
- [ ] STAMP: VERIFIED
- [ ] Commit: `feat(craft): Paket 5 - DATEV & Offline-Sync`

---

## LOGGING PROTOKOLL (nach jedem Paket)

Erstellen in: `C:\Users\kasan\Desktop\AlphaExplorer\K.I. Takeover\Neu\Vibeforce One\vibeforce-flow-os\execution_log\PAKET_<N>_<YYYY-MM-DD_HHmm>.md`

```markdown
# Paket <N>: <Titel>
> Abgeschlossen: <ISO-Timestamp> | Creator: <modell-id> | Validator: <modell-id>

## Erstellte / Geänderte Dateien
| Datei | Aktion | LOC | Beschreibung |
|---|---|---|---|
| frontend/src/lib/geofencing.ts | ERWEITERT | +45 | Epsilon, Boundary-Check, Hysterese |

## Validierung
- tsc --noEmit: ✅ 0 Fehler
- STAMP: VERIFIED von <modell-id>
- Commit: <git-hash> auf feat/vibe-craft-m007

## Offene Punkte / Risiken
- Keine

## Validator-Feedback
- <1-2 Sätze Kernaussage>
```

---

## ABHÄNGIGKEITS-GRAPH (Parallelisierung)

```
PAKET 1 ──────┬──→ PAKET 2 (Tile-Proxy nutzt geofencing.ts Types)
              ├──→ PAKET 3 (MeasurementGrid nutzt constants/i18n)
              ├──→ PAKET 4 (zugferd.ts nutzt pocketbase-types InvoiceZugferdRecord)
              └──→ PAKET 5 (offline-sync nutzt pocketbase-types SiteReportRecord)

PAKET 2, 3, 4, 5 können NACH Paket 1 parallel laufen (verschiedene Dateien)
```

---

## RISIKO-MATRIX

| Risiko | Eintritt | Impact | Mitigation |
|---|---|---|---|
| SQLite WAL Locks unter Last | Hoch | Hoch | `busy_timeout=10000`, Retry-Logic in `withAdminPB` |
| ZUGFeRD Validierung scheitert | Mittel | Hoch | Schematron-Test vor Commit, dualer Validator |
| Offline-Sync Datenverlust | Niedrig | Kritisch | 3-Store, Quarantäne, niemals löschen |
| TypeScript Strict Mode Fehler | Mittel | Mittel | Inkrementell kompilieren nach jeder Datei |
| Mobile Touch-Targets < 56px | Niedrig | Mittel | Automatische Tests mit Playwright |

---

## NÄCHSTE SCHRITTE

1. **Branch erstellen**: `git checkout -b feat/vibe-craft-m007`
2. **PAKET 1 starten** — erste Datei: `frontend/src/lib/geofencing.ts` (1a)
3. Nach jeder Datei: `npx tsc --noEmit` prüfen
4. Nach Paket-Abschluss: Validator-Agent prompten, Log schreiben, Committen