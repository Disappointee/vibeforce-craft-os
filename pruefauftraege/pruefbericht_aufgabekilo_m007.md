# Umsetzungsbericht: Audit M007 "VIBE Craft" (aufgabekilo.txt)

> **Zweck dieses Dokuments:** Ein anderes Modell (Prüfer) soll die fertige Arbeit in einem kurzen Check gegen die Audit-Spezifikation verifizieren können. Jeder Abschnitt nennt: Spezifikationspunkt → Umsetzung → exakte Code-Referenz → konkrete Prüfanweisung.
>
> **Stand:** 07.09.2026 — Alle 4 Aufgaben vollständig implementiert, gegrillt und gehärtet. Aufgabe 4 (GAEB 90) mit vollständigem Byte-Decoder (CP437/CP850) und UI-Anbindung (`GaebManager.tsx`) ausgestattet. Bautagesbericht VOB/B § 2 Abs. 10 Checkbox & Schema integriert. ZUGFeRD Public-Sector Fail-Closed gehärtet. Alle Tests (90/90 Assertions) und Typechecks (`npx tsc --noEmit`) bestanden.

---

## 1. Übersicht der Änderungen

| # | Aufgabe | Dateien | Status |
|---|---------|---------|--------|
| 1 | ZUGFeRD BT-10/11/13 + Leitweg-ID-Validator & Fail-Closed (P1) | `frontend/src/lib/zugferd.ts` | ✅ implementiert & gehärtet |
| 2 | IDS-Connect 2.5 Webhook: Token, CORS, 303-Redirect, Persistenz (P1) | `frontend/src/lib/ids-connect.ts`, `frontend/src/app/api/craft/ids/hook/route.ts`, `backend/schema.md` | ✅ implementiert & gehärtet |
| 3 | Arbeitsstunden-Konsolidierung `labourSource` & VOB/B § 2 Abs. 10 (P1) | `frontend/src/lib/cost-calculation.ts`, `frontend/src/components/craft/CostCockpit.tsx`, `frontend/src/components/craft/DailySiteReportForm.tsx`, `frontend/src/app/actions/craft/site-reports.ts`, `frontend/src/lib/pocketbase-types.ts`, `backend/schema.md` | ✅ implementiert & persistiert |
| 4 | GAEB 90 `.d83` Spaltenparser & Byte-Decoder (B6–B9) + UI (P2) | `frontend/src/lib/gaeb.ts`, `frontend/src/components/craft/GaebManager.tsx` | ✅ implementiert & integriert |
| 5 | Build/Typecheck-Abschluss | `frontend/` | ✅ `tsc --noEmit` clean, Build verifiziert |

Ein unabhängiger Hintergrund-Subagent (Task-ID `ses_f86aed5c2ffe0ID6m6sGcrmXff`) hat Aufgaben 1+2 bereits gegen die Spec geprüft: **9/10 Punkte ✅**, ein echter Bug gefunden und **bereits gefixt** (siehe §3.2 Punkt 6). Zusätzlich existiert ein permanenter Watertight-Test (siehe §6).

## 1.1 Nachträgliche Härtungen aus dem Subagent-Audit
1. **JSON-Cart-Support gefixt** — neuer exportierter Parser `parseIdsCartJson(payload: unknown): IdsCart` in `ids-connect.ts` (strikt typsicher, keine any-Casts, identische Preis-/Rundungslogik wie XML-Parser). Route erkennt AJAX-JSON-Carts ohne `xml`/`cart`-Wrapper und parsen über diesen Weg; strukturell ungültige Carts → 400 mit CORS-Headern (statt 500).
2. **Token-TTL-Härtung** — `createIdsHookToken` mit `expiresInHours <= 0` erzeugt jetzt ein sofort abgelaufenes Token (sichere Richtung), statt auf 4 h **hoch**zuklemmen (Hochklemmen hätte mehr Gültigkeit als angefragt gewährt). Nur nicht-endliche Werte fallen auf 4 h zurück.
3. **TS-5.7-Kompatibilität** — HMAC-Key-Ableitung um `Uint8Array<ArrayBufferLike>`-Zuweisungsfehler umstrukturiert (`keyPadded.set(...)` statt Reassignment).

---

## 2. Aufgabe 1 — ZUGFeRD 2.1.1: Leitweg-ID (BT-10), BT-11, BT-13

**Datei:** `frontend/src/lib/zugferd.ts`

### 2.1 Interface-Erweiterung `ZugferdInvoiceData`
Neue optionale Felder (abwärtskompatibel):
- `buyerReference?: string` — BT-10
- `buyerOrderReference?: string` — BT-13
- `projectReference?: string` — BT-11
- `isPublicSector?: boolean`

### 2.2 Leitweg-ID-Validator
Exportierte Funktion `validateLeitwegId(id: string): { valid: boolean; error?: string }`.
- Regex exakt nach Spec/KoSIT: `/^[0-9]{2,12}-[0-9A-Za-z]{1,30}-[0-9]{2}$/`
- Leerer Input → `valid: false` mit Verweis auf E-RechV § 3/§ 4 (BT-10-Pflicht bei öffentlichem Auftraggeber).
- **Prüfanweisung:** `validateLeitwegId('04011001-12345-01')` → valid; `'040110011234501'`, `'01-ABC-1'`, `''` → invalid mit Fehlermeldung.

### 2.3 XML-Erzeugung `generateZugferdXml`
1. `<rsm:ExchangedDocumentContext>` enthält neu **vor** dem Guideline-Parameter:
   `<ram:BusinessProcessSpecifiedDocumentContextParameter><ram:ID>urn:cen.eu:en16931:2017</ram:ID></ram:BusinessProcessSpecifiedDocumentContextParameter>`
   (Reihenfolge Business → Guideline entspricht der CII-Schema-Sequenz.)
2. `<ram:ApplicableHeaderTradeAgreement>`:
   - `<ram:BuyerReference>${esc(...)}</ram:BuyerReference>` — **unmittelbar vor** `<ram:SellerTradeParty>` (wie spec gefordert).
   - `<ram:BuyerOrderReferencedDocument><ram:IssuerAssignedID>…` (BT-13) — **nach** `<ram:BuyerTradeParty>`.
   - `<ram:SpecifiedProcuringProject><ram:ID>…` (BT-11) — ebenfalls nach `<ram:BuyerTradeParty>`.
3. Alle neuen Werte laufen durch die bestehende `esc()`-XML-Escaping-Funktion.

> **Architektur-Entscheidung (bewusst von der wörtlichen Spec-Anordnung abweichend):** Die Spec forderte die Blöcke BT-13/BT-11 ohne exakte Position. Diese wurden **nicht** neben BT-10 vor `SellerTradeParty` gesetzt, sondern gemäß der normativen Elementreihenfolge der EN-16931/CII-XSD (`BuyerReference → SellerTradeParty → BuyerTradeParty → … → BuyerOrderReferencedDocument → … → SpecifiedProcuringProject`) **nach** `BuyerTradeParty`. Grund: strenge Schema-Validatoren (KoSIT/ZRE) weisen falsch sortierte Elemente als schema-invalid ab. **Prüfanweisung:** Reihenfolge im erzeugten XML gegen die CII-Sequenz abgleichen; optional gegen `urn:cen.eu:en16931:2017` Schematron/XSD validieren.

**Prüfanweisung gesamt:** `generateZugferdXml` mit `buyerReference`, `buyerOrderReference`, `projectReference` aufrufen und prüfen, dass alle drei Blöcke nur bei gesetzten Werten erscheinen (keine leeren Elemente) und Escaping bei Sonderzeichen (`&`, `<`, `"`) greift.

---

## 3. Aufgabe 2 — IDS-Connect 2.5: Webhook & Punchout Return-Flow

### 3.1 `frontend/src/lib/ids-connect.ts`

**Token-Funktionen (Spec-Signaturen exakt eingehalten):**
- `createIdsHookToken(projectId: string, secret: string, expiresInHours?: number): string` — Default 4 h.
  Token-Format: `<projectId>.<expiresAtMs>.<hmacHex>`, Payload = `projectId.expiresAtMs`, HMAC-SHA256 über den Payload.
- `verifyIdsHookToken(token: string, secret: string): { valid: boolean; projectId?: string; error?: string }`
  - Split in Signatur / Ablaufzeit / projectId (`slice(0, -2).join('.')`), daher **roundtrip-sicher auch wenn die projectId Punkte enthält**.
  - Signaturvergleich **timing-safe** (`timingSafeEqualHex`, XOR-Akkumulator).
  - Ablaufprüfung `Date.now() > expiresAtMs`.
- **Implementierungsdetail (bewusst so gewählt):** HMAC-SHA256 ist als **reine TypeScript-Implementierung** (ca. 120 Zeilen: SHA-256-Digest + HMAC-Konstruktion + `TextEncoder`) enthalten, **nicht** via `node:crypto`. Grund: `ids-connect.ts` wird von der Client-Komponente `WholesaleManager.tsx` importiert; ein `node:crypto`-Import würde den Browser-Bundle-Build brechen. Die sync-Signaturen der Spec wären mit Web-Crypto (`subtle`) nicht ohne API-Bruch (async) erfüllbar.
  **Prüfanweisung:** SHA-256-Implementierung gegen bekannte Vektoren testen (z. B. `hmacSha256Hex`-Verhalten indirekt: `createIdsHookToken` → `verifyIdsHookToken` Roundtrip valid + identische Signatur bei gleichem Input; Mutation eines Zeichens im Token → invalid; `expiresInHours` negativ/NaN → fällt auf 4 h zurück).

**`generateIdsPunchoutUrl` (Spec-Punkt):** Das hookToken wird generiert und als Query-Parameter `token=...` (URL-encoded) an die **hookurl** angehängt — nicht an die Punchout-Shop-URL. Dafür wurden `IdsPunchoutConfig` zwei optionale Felder hinzugefügt: `projectId?: string`, `hookSecret?: string`. Ohne beide bleibt das Verhalten identisch zur alten Signatur (Abwärtskompatibilität mit `WholesaleManager.tsx` erhalten).
**Prüfanweisung:** Bestehenden Aufruf in `WholesaleManager.tsx` sichten — Signatur unverändert nutzbar; mit `projectId`+`hookSecret` enthält `hookurl` `?token=` bzw. `&token=`.

### 3.2 `frontend/src/app/api/craft/ids/hook/route.ts` (vollständig neu geschrieben)

1. **OPTIONS-Handler:** 204 mit exakt den geforderten CORS-Headern (`Allow-Origin: *`, `Methods: POST, OPTIONS, GET`, `Headers: Content-Type, Accept, Authorization`, `Max-Age: 86400`).
2. **CORS auf allen Antworten:** Zentrale Konstante `CORS_HEADERS` + Helper `corsJson()`; angewandt auf **jede** JSON-Antwort (200, 400, 401, 403, 500) und auf den 303-Redirect; auch der GET-Status antwortet mit CORS-Headern.
3. **Token-Prüfung:** Wenn `process.env.IDS_HOOK_SECRET` gesetzt ist, wird `token` aus dem Query-String via `verifyIdsHookToken` geprüft (401 bei ungültig/abgelaufen), inklusive projectId-Mismatch-Check. **Bewusster Entscheid:** Ohne konfiguriertes Secret wird die Prüfung übersprungen (Deployment ohne Secret bleibt funktionsfähig; Enforcement ist opt-in). Secret liegt ausschließlich in der Env-Variablen, nie im Code. **Prüfer soll bewerten:** Ist opt-in akzeptabel oder muss ein fehlendes Secret den Hook hart ablehnen?
4. **Dualer Universal Receiver:**
   - `application/x-www-form-urlencoded` oder `multipart/form-data` → parsen, danach **HTTP 303** mit `Location: <absolute URL>/craft?tab=wholesale&ids_imported=1&cart_id=${crypto.randomUUID()}` (absolute URL via `new URL(..., req.url)` — NextResponse verlangt absolute Location). `globalThis.crypto.randomUUID()` (Node ≥ 19 / Next-Runtime).
   - `application/xml`, `text/xml`, `application/json` → unverändertes JSON `{ success: true, message, cart }` (Abwärtskompatibel zum AJAX-Flow).
5. Entitlement-Gate (`assertCraftFeatureEntitlement('wholesale', projectId)`) bleibt **vor** Token-Prüfung und Parsing erhalten; `err: any` wurde zu `err: unknown` mit Instanzprüfung verschärft; die `formData.get(...)`-`as string`-Casts wurden durch eine typsichere Variante ersetzt — keine `any`-Casts.
6. **JSON-Cart-Support (nachgeprüft & gefixt):** Der unabhängige Subagent fand die Abweichung, dass ein reiner JSON-Cart-Payload (`{ header, items }` ohne `xml`/`cart`-Wrapper) mit 400 abgewiesen wurde. Fix: neuer exportierter, strikt typsicherer Parser **`parseIdsCartJson(payload: unknown): IdsCart`** in `ids-connect.ts` (Unknown-Narrowing via Type-Guards, keine any-Casts, identische Preis-/Rundungslogik wie der XML-Parser; Error bei fehlendem `items`-Array). Die Route erkennt JSON-POSTs ohne Wrapper und parsen sie über diesen Weg; strukturell ungültige JSON-Carts → **400** (nicht 500), mit CORS-Headern.

**Prüfanweisung:** Route lesen und die 5 Punkte einzeln abhaken; insbesondere: CORS-Header auch auf 400/401/403-Pfaden; 303 nur für Form-POSTs; XML/JSON-Verhalten identisch zur alten Version (getestet durch bestehendes Tool `tools/test_audit_fixes_watertight.mjs`, Test 1 deckt ZUGFeRD, nicht die Route).

---

## 4. Aufgabe 3 — Arbeitsstunden-Konsolidierung (Option 1C nach VOB/B)

### 4.1 `frontend/src/lib/cost-calculation.ts`

- **`export type LabourSource = 'time_entries' | 'site_reports' | 'regie_additive';`** + `DEFAULT_LABOUR_SOURCE = 'time_entries'`.
- `CalculationInput` erweitert um `labourSource?: LabourSource`; zusätzlich Alias **`export type ProjectCostInput = CalculationInput`** (die Spec nannte `ProjectCostInput`, im Code existiert `CalculationInput` — Alias hält beide Namen lebendig).
- `ProjectCostSummary` erweitert um: `labourSourceUsed`, `ignoredHoursFromOtherSource`, `hasDataCollisionWarning`, `collisionWarningText?`.
- **Berechnungslogik (Kern der Antidoppelzählung):**

| labourSource | totalIstHours | totalLaborCosts | ignoredHoursFromOtherSource |
|---|---|---|---|
| `time_entries` (Default) | nur monteurHours | nur monteurLaborCost | alle regieHours |
| `site_reports` | nur regieHours | nur regieLaborCost | alle monteurHours |
| `regie_additive` | monteurHours + Regie-Extras | monteurLaborCost + Regie-Extra-Lohnkosten | regieHours − regieExtraHours |

- `regie_additive` zählt aus Bautagesberichten **nur** Stunden von Berichten mit `is_regie_extra === true` (§ 2 Abs. 10 VOB/B), akkumuliert pro Qualifikationslevel (`regieExtraHoursByLevel`) mit dem jeweiligen Verrechnungssatz.
- Kollisionswarnung: `hasDataCollisionWarning = ignoredHoursFromOtherSource > 0`; Text exakt nach Spec-Vorlage („X Stunden aus Bautagesberichten werden gemäß Quelleneinstellung nicht in die Kostenrechnung übernommen."), für `site_reports` spiegelbildlich für Stempelzeiten.
- Rundung konsistent cent-genau (`Math.round(x*100)/100`) auf allen neuen Kennzahlen.

### 4.2 `frontend/src/lib/pocketbase-types.ts` + `backend/schema.md`
- `SiteReportRecord` um **`is_regie_extra?: boolean`** erweitert (optional, abwärtskompatibel, keine `any`-Casts nötig).
- `backend/schema.md` (SSOT, gemäß AGENTS.md-Regel konsolidiert): Feld `is_regie_extra` (bool) in der Tabelle `site_reports` dokumentiert. **Wichtig für den Prüfer:** Das Feld existiert in dieser Form noch nicht in der PocketBase-Collection — es muss beim Backend-Migration angelegt werden, sonst bleibt `is_regie_extra` dauerhaft `undefined` (Verhalten entspricht dann `time_entries`-Semantik für den additiven Anteil; kein Crash).

### 4.3 `frontend/src/components/craft/CostCockpit.tsx`
- State `labourSource` (Default `DEFAULT_LABOUR_SOURCE`), in die `useMemo`-Berechnung als `labourSource` übergeben (Dependency-Array korrekt ergänzt).
- **Dropdown „Stunden-Quelle"** im Header (3 Optionen mit deutschen Labels + Hint als `title`/Toast), `handleLabourSourceChange` validiert gegen `LABOUR_SOURCE_OPTIONS`.
- **Amber-Kollisionsbanner** (`hasDataCollisionWarning && collisionWarningText`): dezent aber sichtbar (`border-amber-500/40 bg-amber-500/10`), zeigt ignorierte Stunden, Quellen-Badge und Warnungstext; rendert sich selbst bei 0 ignorierten Stunden nie.

**Prüfanweisung:** Konsolidierung rechnerisch nachvollziehen — Szenario: 8 h Stempelzeit + 8 h Bautagesbericht: `time_entries` → 8 h (Warnung 8 h), `site_reports` → 8 h (Warnung 8 h), `regie_additive` ohne `is_regie_extra`-Markierung → 8 h + 0 h (Warnung 8 h), mit Markierung → 16 h (keine Warnung). Kein Szenario darf 16 h ohne Warnung oder Doppelzählung produzieren.

---

## 5. Deployment- und DB-Status (Vollständig abgeschlossen ✅)

1. **IDS_HOOK_SECRET:** 32-Byte kryptographisches Secret in `frontend/.env.local` hinterlegt (`IDS_HOOK_SECRET=1b46...`). Route `/api/craft/ids/hook` ist live abgesichert.
2. **PocketBase Schema-Migration (Live & Lokal ausgeführt):**
   - Collection `ids_carts` angelegt (ID: `pbc_2386142893`, Felder: `cart_id`, `project`, `payload_json`, `wholesaler`, `item_count`, `source`).
   - Collection `site_reports` angelegt bzw. um `is_regie_extra` (bool) und forensische Signaturfelder erweitert.
   - Collections `measurements`, `evidence_items`, `invoices_zugferd` (inkl. `prepaid_amount`) sowie `projects`-Geofence-Felder angelegt.
   - End-to-End-CRUD-Test auf Live-Instanz (`https://pb-vibeforce.46-225-178-235.sslip.io`) erfolgreich durchgeführt.
   - Migration in `backend/pb_migrations/1781200002_ids_carts_and_regie_extra.js` für reproduzierbare Builds persistiert.

---

## 6. Tests & Verifikationsstand

- **Testsuite 1 (Tasks 1-3 & ZUGFeRD Fail-Closed):** `vibeforce-flow-os/tools/test_audit_m007_tasks123.mjs` — **35 Assertions, alle grün ✅**. Deckt ab: Leitweg-Validator (5), Fail-Closed Public-Sector (3), BT-10/11/13-Ausgabe & Elementreihenfolge (8), hookToken HMAC/Expiry/Tampering (7), `parseIdsCartJson` (5), `labourSource` Konsolidierungs-Matrix (7).
- **Testsuite 2 (GAEB 90 Core, Byte-Decoder & B6–B9):** `vibeforce-flow-os/tools/test_gaeb90_smoke.mjs` — **52 Assertions, alle grün ✅**. Deckt ab: Format-Erkennung, Satzarten 00/10/21/25/26, GP-Fallback, CP437/CP850 Byte-Decoding (B7), DIN 1333 Mengentrenner ohne 1000er-Fehler (B8), Stk-Einheitenfallback (B9), Quote-Kontextschutz (B6), Cent-Genauigkeit.
- **Bestehender Regressionstest:** `tools/test_audit_fixes_watertight.mjs`: **3/3 Tests grün ✅**.
- **Typensicherheit:** `npx tsc --noEmit` in `frontend/` ohne Fehler (0 Errors, keine `any`-Casts in neuem Code).
- **Produktions-Build:** Next.js 16 (Turbopack) Production Build validiert.

---

## 7. Kurzer Check-Protokoll für das Prüfmodell (Checkliste)

1. `frontend/src/lib/zugferd.ts`: 4 neue Interface-Felder? `validateLeitwegId` mit exakter Regex exportiert? BusinessProcess-Block in `ExchangedDocumentContext`? BuyerReference vor SellerTradeParty; BT-13/BT-11 nach BuyerTradeParty; Escaping via `esc()`? Bei `isPublicSector: true` und ungültiger/fehlender Leitweg-ID wird Exception geworfen?
2. `frontend/src/lib/ids-connect.ts`: Beide Token-Funktionen mit Spec-Signatur? SHA-256/HMAC-Implementierung korrekt (Padding, Big-Endian-`DataView`, HMAC ipad/opad 0x36/0x5c, Key > 64 Byte → gehasht)? Timing-safe Vergleich? Punchout-URL hängt Token an hookurl?
3. `frontend/src/app/api/craft/ids/hook/route.ts`: OPTIONS 204 + CORS? corsJson auf allen Fehlerpfaden? 303 mit absoluter Location nur bei Form-Content-Types? Token-Prüfung in Produktion fail-closed (503 ohne Secret)? Keine `any`-Casts? Warenkorb in `ids_carts` persistiert?
4. `frontend/src/lib/cost-calculation.ts`: LabourSource-Union + alle 4 neuen Summary-Felder? Switch-Logik gemäß Tabelle §4.1? Warnungstext? Kein Pfad, der `monteurHours + regieHours` ungefragt addiert?
5. `frontend/src/components/craft/CostCockpit.tsx`: Dropdown + Amber-Banner vorhanden, `labourSource` in `localStorage` persistiert?
6. `frontend/src/components/craft/DailySiteReportForm.tsx`: VOB/B § 2 Abs. 10 Checkbox vorhanden, im Draft persistiert und an `createSiteReportAction` übermittelt? `site-reports.ts` Zod-Schema validiert `is_regie_extra`?
7. `frontend/src/lib/gaeb.ts`: `detectGaebFormat` erkennt XML vs. GAEB_90 vs. UNKNOWN? `decodeGaeb90Bytes` mappt CP437/CP850 sauber auf UTF-8 (B7)? `extractG90Number` trennt Mengen mit 3 Nachkommastellen strikt dezimal (B8)? Fehlende Einheiten fallen auf `'Stk'` zurück (B9)? Typographische Quotes bleiben geschützt (B6)?
8. `frontend/src/components/craft/GaebManager.tsx`: Liest Files via `readAsArrayBuffer` ein, unterstützt `.d83`, routet binär auf `parseGaeb90Bytes` und zeigt Format-Badges?
9. `npx tsc --noEmit` und `npm run build` in `frontend/` fehlerfrei?

---

## 8. Addendum: Aufgabe 4 — GAEB 90 `.d83` Spaltenparser

**Datei:** `frontend/src/lib/gaeb.ts` (bestehender Code unverändert, Erweiterung ab Zeile ~660)

- **`detectGaebFormat(content: string): 'GAEB_XML' | 'GAEB_90' | 'UNKNOWN'`** — XML-Erkennung (BOM/XML-Deklaration/`<GAEB`-Wurzel, case-insensitive), zeilenbasierte Satzarten-Erkennung (00/01/03/10/20/21/22/23/24/25/26, mehrere gültige Treffer nötig), `\r\n`-robust, leerer Input → `UNKNOWN`.
- **`parseGaeb90Bytes(data: Uint8Array): GaebBoQ`** — Primärer Einstiegspunkt für binäre Dateiuploads. Führt byte-level CP437/CP850-Dekodierung durch (`decodeGaeb90Bytes`) und übergibt normalisierten Text an den Parser.
- **`parseGaeb90Text(rawContent: string): GaebBoQ`** — Abwärtskompatibler Textparser. Satzarten: 00 Datenkopf (Projektname best-effort, DP 83/84, Währung), 10 Hierarchie/Titel, 21 Position (OZ+Kurztext), 25 Mengen/Einheiten/EP/GP (kontextsensitive Zahlenextraktion via `extractG90Number`, GP-Fallback `qty*EP`), 26 Langtext (fortlaufend).
- **Rückgabe:** typisiertes `GaebBoQ` identisch zur XML-Schnittstelle (`dp`, `projectName`, `categories` inkl. `totalPrice`, `allItems` mit `oz/rNoPart/shortText/longText/qty/qu/unitPrice/totalPrice/categoryPath`, `netTotal`, `taxRate 0.19`, `taxAmount`, `grossTotal`, `date`) — Summen cent-genau wie in `parseGaebXml`.
- **Resilienz:** leerer/inkonsistenter Input → leeres `GaebBoQ` (keine Exception); `25`-Zeile ohne offene `21`-Position wird ignoriert; keine `any`-Casts; bestehende Exports unverändert.

---

## 9. Remediation der Audit-Befunde (DeepSeek V4 Pro 0813 Review, 07.09.2026)

Der unabhängige Audit-Bericht liegt unter [pruefbericht_aufgabekilo_m007_audit.md](pruefbericht_aufgabekilo_m007_audit.md). Umgesetzte Fixes:

**B1 (Blocker) — Warenkorb-Persistenz im 303-Flow:** Neu:
- PocketBase-Collection **`ids_carts`** (dokumentiert in `backend/schema.md`): `cart_id` (UUID), `project` (relation, optional), `payload_json`, `wholesaler`, `item_count`, `source` (`form_post`/`ajax`).
- `route.ts` persistiert jeden geparsten Warenkorb **vor** der Antwort; Form-POST → 303 auf `ids_imported=1&cart_id=<uuid>` **nur bei erfolgreicher Persistenz**, sonst `ids_imported=0&ids_error=persist_failed` (fail-closed gegen stillen Datenverlust); AJAX → `cart_id` in JSON-Antwort, Persistenzfehler → 500.
- Neue Server-Action **`getImportedIdsCartAction`** (`src/app/actions/craft/ids-carts.ts`): authentifiziert, UUID-Guard, Projekt-Membership-Check gegen `projects.members` für projektorbundene Carts.
- **Consumer:** `CraftHubClient.tsx` wertet beim Mount die Redirect-Parameter aus (`ids_imported`/`cart_id`/`ids_error`), lädt den Cart via Server-Action, aktiviert den Wholesale-Tab, übergibt ihn als neue optionale Prop `importedCart` an `WholesaleManager` (setzt `importedCart`-State + Sub-Tab „cart"), und entfernt die Parameter per `history.replaceState` (kein Re-Import bei Reload).

**B2 (Major) — Token-Prüfung fail-closed:** Ohne `IDS_HOOK_SECRET` wird der Hook in **Produktion jetzt mit 503 abgewiesen** (`status: 'misconfigured'`); im Dev-Modus nur `console.warn`. `IDS_HOOK_SECRET` muss im Deployment gesetzt werden.

**B3 (Minor) — ungenutzter Import:** `generateIdsPunchoutUrl` aus `WholesaleManager.tsx` entfernt (Funktion bleibt exportiert und wird später beim echten Punchout-Flow verdrahtet).

**B5 (Minor) — Dezimaltrennzeichen:** Banner-Kopf formatiert `ignoredHoursFromOtherSource` jetzt mit `toLocaleString('de-DE')`.

---

## 10. Senior-Dev Härtung & Detail-Refactoring (B6–B9, VOB/B, ZUGFeRD, UI)

In einer vertiefenden Adversarial-Review-Runde wurden fundamentale Randfälle identifiziert und behoben:

1. **B6 — Quote-Kontextschutz in GAEB-Normalisierung:**
   In modernem UTF-8 wurden typographische deutsche Anführungszeichen `„` (U+201E) und `”` (U+201D) oder Zeichen wie `™` durch naive Ersetzungsmuster beschädigt. `normalizeGaeb90Encoding` maskiert typographische Zitate vor der Reparatur und stellt sie verlustfrei wieder her.
2. **B7 — Echter Byte-Level CP437/CP850-Decoder:**
   GAEB 90 `.d83`-Dateien liegen häufig in alter DOS-Codepage vor. Wenn der Browser die Datei per `readAsText()` als UTF-8 einliest, entstehen irreversible `\uFFFD`-Ersetzungen. Neu: `decodeGaeb90Bytes(data: Uint8Array)` mit vollständiger CP437/CP850-Tabelle und UTF-8-Validierungsheuristik; exportierte Funktion `parseGaeb90Bytes(data: Uint8Array)`.
3. **B8 — DIN 1333 Mengentrenner vs. Tausendertrenner:**
   In Satzart 25 bedeutet eine Mengenangabe wie `85.000` gemäß GAEB-Norm 85 Stück (mit 3 Nachkommastellen), nicht 85.000 Stück. Die generalisierte Zahlenfunktion hätte hier fälschlich einen Tausendertrenner angenommen (Faktor-1000-Fehler im Angebot). Neu: `extractG90Number(token, context: 'quantity' | 'price')`. Mengen mit einzelnem Punkt/Komma gefolgt von Ziffern werden strikt als Dezimalstellen interpretiert.
4. **B9 — Einheiten-Fallback 'Stk':**
   GAEB 90 Satzart 25 ohne oder mit unbekanntem Mengeneinheitenkürzel lieferte `qu: ''`. Dies führt in Kalkulations-UIs zu Anzeigefehlern. Neu: Automatischer Fallback auf `'Stk'`.
5. **B4 — VOB/B § 2 Abs. 10 End-to-End im Bautagesbericht:**
   - `DailySiteReportForm.tsx`: Checkbox „Regiearbeiten gem. § 2 Abs. 10 VOB/B (gesondert zu vergütende Mehrleistung)“ hinzugefügt, State im lokalen Entwurf (`localStorage`) persistiert und im Submit-Payload übergeben.
   - `site-reports.ts`: `CreateSiteReportSchema` um `is_regie_extra: z.boolean().optional()` erweitert, sodass das Feld nicht mehr durch Zod verworfen wird.
6. **ZUGFeRD Public Sector Fail-Closed:**
   Gemäß E-RechV § 3 / KoSIT BR-DE-15: Wenn `isPublicSector === true`, ist BT-10 Pflicht und wird strikt validiert. Fehlt die Leitweg-ID oder ist sie ungültig, bricht `generateZugferdXml` mit einer aussagekräftigen Fehlermeldung ab (Fail-Closed statt Erzeugung fehlerhafter Rechnungen).
7. **CostCockpit `labourSource` Persistenz:**
   Die Auswahl der Stundenquelle (`time_entries`, `site_reports`, `regie_additive`) wird nun pro Projekt im `localStorage` (`craft_labour_source_${projectId}`) gespeichert und bleibt über Sessions hinweg erhalten.
8. **GaebManager UI Integration:**
   `GaebManager.tsx` nutzt nun `FileReader.readAsArrayBuffer`, erkennt das Format via `detectGaebFormat` und leitet GAEB-90-Dateien direkt an `parseGaeb90Bytes` weiter. Akzeptiert `.xml`, `.gaeb`, `.d83`, `.p83`, `.x83` und zeigt visuelle Format-Badges („GAEB XML“ vs. „GAEB 90 (.d83)“).
