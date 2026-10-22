# Unabhängiger Prüfbericht: Audit M007 „VIBE Craft" (Aufgaben 1–4)

> **Prüfer-Rolle:** Senior-Prüfer, Research-only (keine Code-Änderungen). Geprüft gegen Original-Spec [aufgabekilo.txt](file:///C:/Users/Robin/Desktop/AlphaExplorer/K.I.%20Takeover/Neu/Vibeforce%20One/pruefauftraege/aufgabekilo.txt) und Umsetzungsbericht [pruefbericht_aufgabekilo_m007.md](file:///C:/Users/Robin/Desktop/AlphaExplorer/K.I.%20Takeover/Neu/Vibeforce%20One/pruefauftraege/pruefbericht_aufgabekilo_m007.md).
> **Scope:** Aufgaben 1–4. Aufgabe 4 (GAEB 90, `src/lib/gaeb.ts`) wurde per Nachtrag nach Scope-Erweiterung (GAEB-Session abgeschlossen) in §1.8, §2 (B6–B9), §3 (Punkte 8–11), §4 und §5 aufgenommen.
> **Stand:** 07.09.2026 — Unabhängige Nachverifikation inkl. eigener Testvektoren (HMAC gegen RFC 4231 / FIPS 180-4 / node:crypto, Kostenlogik-Gegenbeispiele, GAEB-90-Smoketest mit Mojibake/D83-Sätzen).

---

## 1. Prüfpunkte (Status je Punkt)

### 1.1 `src/lib/zugferd.ts` (Aufgabe 1)

| Prüfpunkt | Status | Referenz |
|---|---|---|
| Interface: `buyerReference`, `buyerOrderReference`, `projectReference`, `isPublicSector` (alle optional) | ✅ | [zugferd.ts:43-46](file:///C:/Users/Robin/Desktop/AlphaExplorer/K.I.%20Takeover/Neu/Vibeforce%20One/vibeforce-flow-os/frontend/src/lib/zugferd.ts#L43-L46) |
| `validateLeitwegId` exportiert, Regex exakt KoSIT `/^[0-9]{2,12}-[0-9A-Za-z]{1,30}-[0-9]{2}$/`, leerer Input → `valid:false` mit E-RechV-Verweis | ✅ | [zugferd.ts:53-62](file:///C:/Users/Robin/Desktop/AlphaExplorer/K.I.%20Takeover/Neu/Vibeforce%20One/vibeforce-flow-os/frontend/src/lib/zugferd.ts#L53-L62) |
| `BusinessProcessSpecifiedDocumentContextParameter` mit ID `urn:cen.eu:en16931:2017` in `ExchangedDocumentContext`, vor Guideline-Parameter (CII-Sequenz korrekt: Business → Guideline) | ✅ | [zugferd.ts:208-210](file:///C:/Users/Robin/Desktop/AlphaExplorer/K.I.%20Takeover/Neu/Vibeforce%20One/vibeforce-flow-os/frontend/src/lib/zugferd.ts#L208-L210) |
| `BuyerReference` unmittelbar vor `SellerTradeParty` | ✅ | [zugferd.ts:228-229](file:///C:/Users/Robin/Desktop/AlphaExplorer/K.I.%20Takeover/Neu/Vibeforce%20One/vibeforce-flow-os/frontend/src/lib/zugferd.ts#L228-L229) |
| `BuyerOrderReferencedDocument` + `SpecifiedProcuringProject` nach `BuyerTradeParty` — **schema-valide** (CII D16B `HeaderTradeAgreementType`-Sequenz: `BuyerReference → SellerTradeParty → BuyerTradeParty → … → BuyerOrderReferencedDocument → … → SpecifiedProcuringProject`). Die wörtliche Spec-Anordnung (alle drei vor `SellerTradeParty`) wäre schema-invalid | ✅ | [zugferd.ts:247-252](file:///C:/Users/Robin/Desktop/AlphaExplorer/K.I.%20Takeover/Neu/Vibeforce%20One/vibeforce-flow-os/frontend/src/lib/zugferd.ts#L247-L252) |
| `esc()` auf allen neuen Werten (BT-10/13/11), keine leeren Elemente bei fehlenden Angaben | ✅ | [zugferd.ts:228, 248, 251](file:///C:/Users/Robin/Desktop/AlphaExplorer/K.I.%20Takeover/Neu/Vibeforce%20One/vibeforce-flow-os/frontend/src/lib/zugferd.ts#L228) |

### 1.2 `src/lib/ids-connect.ts` (Aufgabe 2)

| Prüfpunkt | Status | Referenz |
|---|---|---|
| `createIdsHookToken` / `verifyIdsHookToken` mit Spec-Signaturen | ✅ | [ids-connect.ts:408-450](file:///C:/Users/Robin/Desktop/AlphaExplorer/K.I.%20Takeover/Neu/Vibeforce%20One/vibeforce-flow-os/frontend/src/lib/ids-connect.ts#L408-L450) |
| **HMAC-SHA256 (pure TS) — Watertight A:** Padding-Formel `(((len+8)>>6)+1)<<6` korrekt (Grenzfälle 55/56/64 Byte nachgerechnet); 64-Bit-Längenfeld Big-Endian über `DataView.setUint32` (High-Word via `Math.floor(bitLen/2^32)` — Division durch 2er-Potenz float64-exakt, funktioniert über 2^32 Bit); K-Konstanten, σ/Σ-Rotationen (7/18/3, 17/19/10, 6/11/25, 2/13/22), ch/maj, Kompressionsschleife, Endianness korrekt; HMAC-Konstruktion FIPS 198-1 (ipad 0x36 / opad 0x5c, Key > 64 B → `sha256Digest(rawKey)`) | ✅ **verifiziert** | [ids-connect.ts:302-402](file:///C:/Users/Robin/Desktop/AlphaExplorer/K.I.%20Takeover/Neu/Vibeforce%20One/vibeforce-flow-os/frontend/src/lib/ids-connect.ts#L302-L402) |
| Timing-sicherer Vergleich (`timingSafeEqualHex`, XOR-Akkumulator, konstante Zeit über 64 Hex-Zeichen; Längen-Frühabbruch leakt nichts, da Länge fix 64) | ✅ | [ids-connect.ts:395-402](file:///C:/Users/Robin/Desktop/AlphaExplorer/K.I.%20Takeover/Neu/Vibeforce%20One/vibeforce-flow-os/frontend/src/lib/ids-connect.ts#L395-L402) |
| Ablauflogik: endliche Werte inkl. `<=0` durchgereicht (→ sofort abgelaufen), nur NaN/Infinity → 4h-Default | ✅ | [ids-connect.ts:413-416](file:///C:/Users/Robin/Desktop/AlphaExplorer/K.I.%20Takeover/Neu/Vibeforce%20One/vibeforce-flow-os/frontend/src/lib/ids-connect.ts#L413-L416) |
| Token-Format `projectId.expiresAtMs.hmacHex`; projectId mit Punkten roundtrip-sicher (`slice(0,-2).join('.')`) — Watertight B erfüllt | ✅ | [ids-connect.ts:433-435](file:///C:/Users/Robin/Desktop/AlphaExplorer/K.I.%20Takeover/Neu/Vibeforce%20One/vibeforce-flow-os/frontend/src/lib/ids-connect.ts#L433-L435) |
| `generateIdsPunchoutUrl` hängt Token an **hookurl** (URL-encoded, `?`/`&`-aware); ohne `projectId`+`hookSecret` identisch zur Altsignatur | ✅ | [ids-connect.ts:276-280](file:///C:/Users/Robin/Desktop/AlphaExplorer/K.I.%20Takeover/Neu/Vibeforce%20One/vibeforce-flow-os/frontend/src/lib/ids-connect.ts#L276-L280) |
| `parseIdsCartJson`: strikte Unknown-Narrowing (Type-Guards, keine `any`-Casts), identische Preis-/Rundungslogik wie XML-Parser (Rabattableitung, `Math.round(x*100)/100`), Error bei fehlendem `items` | ✅ | [ids-connect.ts:575-647](file:///C:/Users/Robin/Desktop/AlphaExplorer/K.I.%20Takeover/Neu/Vibeforce%20One/vibeforce-flow-os/frontend/src/lib/ids-connect.ts#L575-L647) |

### 1.3 `src/app/api/craft/ids/hook/route.ts` (Aufgabe 2)

| Prüfpunkt | Status | Referenz |
|---|---|---|
| OPTIONS: 204 + exakt geforderte CORS-Header (Methods `POST, OPTIONS, GET`, Headers `Content-Type, Accept, Authorization`, Max-Age 86400) | ✅ | [route.ts:7-31](file:///C:/Users/Robin/Desktop/AlphaExplorer/K.I.%20Takeover/Neu/Vibeforce%20One/vibeforce-flow-os/frontend/src/app/api/craft/ids/hook/route.ts#L7-L31) |
| CORS auf **allen** Antwortpfaden: 200/303/400/401/403/500 + GET (zentrale `CORS_HEADERS` + `corsJson`) — Watertight C erfüllt | ✅ | [route.ts:14-16, 43, 58, 128, 138, 157-163, 174, 185](file:///C:/Users/Robin/Desktop/AlphaExplorer/K.I.%20Takeover/Neu/Vibeforce%20One/vibeforce-flow-os/frontend/src/app/api/craft/ids/hook/route.ts#L14-L16) |
| Token-Prüfung nur wenn `process.env.IDS_HOOK_SECRET` gesetzt (bewusster opt-in) — Sicherheitsbewertung siehe §3, Befund B2 | ⚠️ | [route.ts:53-75](file:///C:/Users/Robin/Desktop/AlphaExplorer/K.I.%20Takeover/Neu/Vibeforce%20One/vibeforce-flow-os/frontend/src/app/api/craft/ids/hook/route.ts#L53-L75) |
| 303-Redirect **nur** für Form-POSTs (`x-www-form-urlencoded`/`multipart`), absolute Location via `new URL('/craft?tab=wholesale&ids_imported=1&cart_id=<uuid>', req.url)`; keine projektId-/Query-Reflektion in Location → keine Redirect-Injection | ✅ | [route.ts:77-82, 151-164](file:///C:/Users/Robin/Desktop/AlphaExplorer/K.I.%20Takeover/Neu/Vibeforce%20One/vibeforce-flow-os/frontend/src/app/api/craft/ids/hook/route.ts#L77-L82) |
| Request-Body wird pro Request genau **einmal** konsumiert (if/else-Kette über Content-Type; kein doppeltes `req.text()`) | ✅ | [route.ts:86-120](file:///C:/Users/Robin/Desktop/AlphaExplorer/K.I.%20Takeover/Neu/Vibeforce%20One/vibeforce-flow-os/frontend/src/app/api/craft/ids/hook/route.ts#L86-L120) |
| JSON-Branch: Wrapper (`{xml|cart}` als String) vs. reiner JSON-Cart (→ `parseIdsCartJson`), strukturelle Fehler → 400 mit CORS (statt 500); XML/JSON-AJAX-Antwort `{success, message, cart}` abwärtskompatibel | ✅ | [route.ts:92-135](file:///C:/Users/Robin/Desktop/AlphaExplorer/K.I.%20Takeover/Neu/Vibeforce%20One/vibeforce-flow-os/frontend/src/app/api/craft/ids/hook/route.ts#L92-L135) |
| **„parsen/sichern": Der geparste Warenkorb wird NICHT persistiert** und kein Frontend-Code liest `ids_imported`/`cart_id` — Spec-Gap, siehe Befund B1 | ❌ | [route.ts:151-164](file:///C:/Users/Robin/Desktop/AlphaExplorer/K.I.%20Takeover/Neu/Vibeforce%20One/vibeforce-flow-os/frontend/src/app/api/craft/ids/hook/route.ts#L151-L164) |

### 1.4 `src/lib/cost-calculation.ts` (Aufgabe 3)

| Prüfpunkt | Status | Referenz |
|---|---|---|
| `LabourSource`-Union exakt `'time_entries' \| 'site_reports' \| 'regie_additive'`, Default `'time_entries'` | ✅ | [cost-calculation.ts:48-50](file:///C:/Users/Robin/Desktop/AlphaExplorer/K.I.%20Takeover/Neu/Vibeforce%20One/vibeforce-flow-os/frontend/src/lib/cost-calculation.ts#L48-L50) |
| `labourSource?` in `CalculationInput` + Alias `ProjectCostInput = CalculationInput` (Spec-Name erhalten, keine destruktive Umbenennung) | ✅ | [cost-calculation.ts:95-106](file:///C:/Users/Robin/Desktop/AlphaExplorer/K.I.%20Takeover/Neu/Vibeforce%20One/vibeforce-flow-os/frontend/src/lib/cost-calculation.ts#L95-L106) |
| `ProjectCostSummary` um `labourSourceUsed`/`ignoredHoursFromOtherSource`/`hasDataCollisionWarning`/`collisionWarningText?` erweitert | ✅ | [cost-calculation.ts:88-93](file:///C:/Users/Robin/Desktop/AlphaExplorer/K.I.%20Takeover/Neu/Vibeforce%20One/vibeforce-flow-os/frontend/src/lib/cost-calculation.ts#L88-L93) |
| Switch-Logik: `time_entries` → nur Stempelzeiten; `site_reports` → nur Berichtsstunden; `regie_additive` → Stempelzeiten + **nur** `is_regie_extra === true`-Berichtsstunden (§ 2 Abs. 10 VOB/B), Kosten je Qualifikationslevel mit korrektem Verrechnungssatz | ✅ | [cost-calculation.ts:171-234](file:///C:/Users/Robin/Desktop/AlphaExplorer/K.I.%20Takeover/Neu/Vibeforce%20One/vibeforce-flow-os/frontend/src/lib/cost-calculation.ts#L171-L234) |
| Rundung cent-genau (`Math.round(x*100)/100`) auf allen neuen Kennzahlen | ✅ | [cost-calculation.ts:236-238](file:///C:/Users/Robin/Desktop/AlphaExplorer/K.I.%20Takeover/Neu/Vibeforce%20One/vibeforce-flow-os/frontend/src/lib/cost-calculation.ts#L236-L238) |
| Warnungstext exakt nach Spec („X Stunden aus Bautagesberichten werden gemäß Quelleneinstellung nicht in die Kostenrechnung übernommen."), für `site_reports` spiegelbildlich | ✅ | [cost-calculation.ts:242-247](file:///C:/Users/Robin/Desktop/AlphaExplorer/K.I.%20Takeover/Neu/Vibeforce%20One/vibeforce-flow-os/frontend/src/lib/cost-calculation.ts#L242-L247) |
| Watertight D: **Kein Pfad addiert `monteurHours + regieHours` ungefragt** — per Konstruktion existiert kein Doppelzählungs-Szenario (siehe §4 Gegenbeispiele) | ✅ | — |

### 1.5 `src/components/craft/CostCockpit.tsx` (Aufgabe 3)

| Prüfpunkt | Status | Referenz |
|---|---|---|
| Dropdown „Stunden-Quelle" mit 3 deutschen Optionen inkl. Hint, State-Default `DEFAULT_LABOUR_SOURCE`, Validierung gegen `LABOUR_SOURCE_OPTIONS` | ✅ | [CostCockpit.tsx:37-53, 71, 88-96, 149-163](file:///C:/Users/Robin/Desktop/AlphaExplorer/K.I.%20Takeover/Neu/Vibeforce%20One/vibeforce-flow-os/frontend/src/components/craft/CostCockpit.tsx#L149-L163) |
| `labourSource` in `useMemo`-Berechnung + Dependency-Array korrekt ergänzt | ✅ | [CostCockpit.tsx:76-86](file:///C:/Users/Robin/Desktop/AlphaExplorer/K.I.%20Takeover/Neu/Vibeforce%20One/vibeforce-flow-os/frontend/src/components/craft/CostCockpit.tsx#L76-L86) |
| Amber-Banner strikt konditioniert auf `hasDataCollisionWarning && collisionWarningText`, dezent (`border-amber-500/40 bg-amber-500/10`) | ✅ | [CostCockpit.tsx:283-303](file:///C:/Users/Robin/Desktop/AlphaExplorer/K.I.%20Takeover/Neu/Vibeforce%20One/vibeforce-flow-os/frontend/src/components/craft/CostCockpit.tsx#L283-L303) |

### 1.6 `pocketbase-types.ts` + `backend/schema.md` (Aufgabe 3)

| Prüfpunkt | Status | Referenz |
|---|---|---|
| `is_regie_extra?: boolean` auf `SiteReportRecord` (optional, abwärtskompatibel) | ✅ | [pocketbase-types.ts:365](file:///C:/Users/Robin/Desktop/AlphaExplorer/K.I.%20Takeover/Neu/Vibeforce%20One/vibeforce-flow-os/frontend/src/lib/pocketbase-types.ts#L365) |
| SSOT-Dokumentation in `schema.md` (Feld `is_regie_extra` **bool** in Collection `site_reports`) | ✅ | [schema.md:341](file:///C:/Users/Robin/Desktop/AlphaExplorer/K.I.%20Takeover/Neu/Vibeforce%20One/vibeforce-flow-os/backend/schema.md#L341) |

### 1.8 `src/lib/gaeb.ts` (Aufgabe 4 — GAEB 90, per Nachtrag aufgenommen)

| Prüfpunkt | Status | Referenz |
|---|---|---|
| `detectGaebFormat`: XML-Deklaration/`<letter>`/`<GAEB>`-Element → `GAEB_XML`; Satzart-Pattern `^(?:00\|01\|03\|10\|2[0-6])(?:\s\|$)` in Spalte 1-2 mit Mehrheitsregel (≥2 Treffer **und** ≥50% der Nicht-Leerzeilen) → `GAEB_90`; leerer/Whitespace-Input und BOM → korrekt behandelt; `\r\n`-robust (`split(/\r\n\|\r\|\n/)`) | ✅ | [gaeb.ts:679-704](file:///C:/Users/Robin/Desktop/AlphaExplorer/K.I.%20Takeover/Neu/Vibeforce%20One/vibeforce-flow-os/frontend/src/lib/gaeb.ts#L679-L704) |
| `detectGaebFormat` Fehlalarm-Risiko: beliebige XML ohne `<GAEB>`-Wurzel (z. B. ZUGFeRD-Rechnungs-XML) wird als `GAEB_XML` klassifiziert → `parseGaebXml` wirft kontrolliert. Defensibel (Formaterkennung, nicht GAEB-Validierung), aber dokumentiert | ⚠️ | [gaeb.ts:685-691](file:///C:/Users/Robin/Desktop/AlphaExplorer/K.I.%20Takeover/Neu/Vibeforce%20One/vibeforce-flow-os/frontend/src/lib/gaeb.ts#L685-L691) |
| Satzart `00`: DP-83/84 (`/\bDP\s*-?\s*84\b/`), Währung (EURO→EUR/DM), Projektname (Token-Filter) — Smoke-verifiziert | ✅ | [gaeb.ts:831-849](file:///C:/Users/Robin/Desktop/AlphaExplorer/K.I.%20Takeover/Neu/Vibeforce%20One/vibeforce-flow-os/frontend/src/lib/gaeb.ts#L831-L849) |
| Satzart `10`: Hierarchie über aufeinanderfolgende 10-Zeilen (Stack-Depth-Logik), OZ-/Label-Extraktion, Verschachtelung analog XML-Parser; `categoryPath`-Pflege identisch (Label-Pfad) | ✅ | [gaeb.ts:850-880](file:///C:/Users/Robin/Desktop/AlphaExplorer/K.I.%20Takeover/Neu/Vibeforce%20One/vibeforce-flow-os/frontend/src/lib/gaeb.ts#L850-L880) |
| Satzart `21`: OZ+Kurztext (`/^(\d+(?:\.\d+)*)[.\s]\s*(.+)$/` + OZ-only-Fallback, Auto-OZ bei fehlender Nummer), `rNoPart` = letztes OZ-Segment, Zuordnung zu aktiver Kategorie | ✅ | [gaeb.ts:881-915](file:///C:/Users/Robin/Desktop/AlphaExplorer/K.I.%20Takeover/Neu/Vibeforce%20One/vibeforce-flow-os/frontend/src/lib/gaeb.ts#L881-L915) |
| Satzart `25`: Menge/Einheit/EP/GP; Komma **und** Punkt als Dezimaltrenner inkl. Tausenderpunkt/-komma (`1.062,50`, `1,234.56`); GP-Fallback `qty*EP`; **25 ohne offene 21 wird ignoriert** (kein Crash); unbekannte Einheit → `qu` bleibt `''` (Abweichung: XML-Parser defaultet `'Stk'`) | ✅/⚠️ | [gaeb.ts:916-937](file:///C:/Users/Robin/Desktop/AlphaExplorer/K.I.%20Takeover/Neu/Vibeforce%20One/vibeforce-flow-os/frontend/src/lib/gaeb.ts#L916-L937) |
| Satzart `26`: Langtext fortlaufend an aktuelle Position (`currentLongText`-Akkumulation, Flush bei nächster 21/Ende) | ✅ | [gaeb.ts:938-943](file:///C:/Users/Robin/Desktop/AlphaExplorer/K.I.%20Takeover/Neu/Vibeforce%20One/vibeforce-flow-os/frontend/src/lib/gaeb.ts#L938-L943) |
| Encoding-Resilienz: Mojibake-Map deckt die geforderten CP437/CP850-Bytes ab (0x84→ä, 0x94→ö, 0x8E→Ä, 0x99→Ö, 0x9A→Ü, 0xE1→ß), je über Latin-1- (U+0084/0094/008E/0099/009A/00E1) **und** Windows-1252-Misread (U+201E/201D/017D/2122/0161/00E1) — beide Pfade Smoke-verifiziert. **Aber:** Doppelkodierung/Kollateralschäden werden NICHT vermieden (B6) und UTF-8-Misread (U+FFFD) ist nicht abgedeckt (B7) | ⚠️ | [gaeb.ts:630-673](file:///C:/Users/Robin/Desktop/AlphaExplorer/K.I.%20Takeover/Neu/Vibeforce%20One/vibeforce-flow-os/frontend/src/lib/gaeb.ts#L630-L673) |
| GaebBoQ-Kompatibilität: `dp`/`projectName`/`categories`/`allItems`/`netTotal`/`taxRate 0.19`/`taxAmount`/`grossTotal` — Struktur identisch zu `parseGaebXml`, Summen cent-genau (Smoke: 1220 → tax 231.80 → gross 1451.80 exakt) | ✅ | [gaeb.ts:955-971](file:///C:/Users/Robin/Desktop/AlphaExplorer/K.I.%20Takeover/Neu/Vibeforce%20One/vibeforce-flow-os/frontend/src/lib/gaeb.ts#L955-L971) |
| Watertight: leerer Input → leeres BoQ statt Exception (`rawContent ?? ''`); beliebiger Müll-Input kein Crash; unbekannte Satzarten übersprungen; keine `any`-Casts im neuen Code; bestehende Exports (`parseGaebXml`, `generateGaebX84Xml`, `convertGaebItemToMeasurement`, `getSampleGaebBoQ`, Typen) unangetastet (Roundtrip-Test bestanden) | ✅ | [gaeb.ts:775-779](file:///C:/Users/Robin/Desktop/AlphaExplorer/K.I.%20Takeover/Neu/Vibeforce%20One/vibeforce-flow-os/frontend/src/lib/gaeb.ts#L775-L779) |
| **Ausspielen (Punkt 7):** `detectGaebFormat`/`parseGaeb90Text` haben **keinen Aufrufer** in `src/`. Importeure von gaeb.ts: [GaebManager.tsx:26-34](file:///C:/Users/Robin/Desktop/AlphaExplorer/K.I.%20Takeover/Neu/Vibeforce%20One/vibeforce-flow-os/frontend/src/components/craft/GaebManager.tsx#L26-L34) (UI-Upload ruft `parseGaebXml` **direkt**, [GaebManager.tsx:72-89, 91-118](file:///C:/Users/Robin/Desktop/AlphaExplorer/K.I.%20Takeover/Neu/Vibeforce%20One/vibeforce-flow-os/frontend/src/components/craft/GaebManager.tsx#L72-L89) — `.d83`-Uploads scheitern dort aktuell an „Keine gültige GAEB-Datei"), [WholesaleManager.tsx:56](file:///C:/Users/Robin/Desktop/AlphaExplorer/K.I.%20Takeover/Neu/Vibeforce%20One/vibeforce-flow-os/frontend/src/components/craft/WholesaleManager.tsx#L56) (`type GaebItem`), [ids-connect.ts:14](file:///C:/Users/Robin/Desktop/AlphaExplorer/K.I.%20Takeover/Neu/Vibeforce%20One/vibeforce-flow-os/frontend/src/lib/ids-connect.ts#L14) (`type GaebItem`). Zu verdrahten (nur gemeldet): in `GaebManager` `detectGaebFormat` vor `parseGaebXml` schalten; **kritisch dabei:** Datei-Einlesung beachten (B7 — `readAsText` = UTF-8; für .d83 `readAsArrayBuffer` + Latin-1/1252-Decode bzw. Byte-Level-CP437/850 nötig, sonst greift die Mojibake-Reparatur nie) | ⚠️ | — |

### 1.7 Watertight-Checks A–F (Zusammenfassung)
| Check | Ergebnis |
|---|---|
| **A** HMAC-SHA256 gegen FIPS 180-4/210 + RFC 4231 | ✅ **Bestanden.** Verifikation: 29 reale Token-Signaturen (inkl. Key > 64 B, Unicode, Payload-Längen 1–1000 = Padding-Grenzen) = node:crypto; RFC-4231-Vektoren TC1–TC4 + TC6 (131-B-Key) auf Byte-Ebene korrekt; FIPS-Digest-Vektoren (leer, „abc") korrekt; 200 ASCII-Fuzz-Fälle = node:crypto. Längen-Encoding > 2^32 Bit korrekt (High-Word). |
| **B** Token-Sicherheit | ✅ **Bestanden.** Ohne Secret keine Fälschung möglich (256-Bit-HMAC korrekt implementiert); Vergleich konstant-zeit-konform; projectId mit `.`-Trennzeichen roundtrip-sicher (getestet). Einschränkung: 4h-Replay-Fenster ist Design (Spec-konform). |
| **C** Route CORS/303/Body/Redirect | ✅ **Bestanden.** Alle Pfade CORS-komplett; 303 nur Form-Pfad; Body genau einmal konsumiert; keine Redirect-URL-Injection. |
| **D** Kostenlogik-Gegenbeispiele | ✅ **Bestanden.** 19 unabhängige Checks (alle 3 Modi, all-marked, fractional, leer, unbekannter Source-Wert): kein Doppelzählungs-, kein Stundenverlust-Pfad (Verlust nur wo semantisch intendiert = unmarkierte Berichtsstunden in `regie_additive`, mit Warnung). |
| **E** Abwärtskompatibilität | ✅ mit Hinweis: `CostCockpit`-Props unverändert ([CraftHubClient.tsx:1227-1248](file:///C:/Users/Robin/Desktop/AlphaExplorer/K.I.%20Takeover/Neu/Vibeforce%20One/vibeforce-flow-os/frontend/src/app/(dashboard)/craft/CraftHubClient.tsx#L1227-L1248)); `generateIdsPunchoutUrl`-Signatur kompatibel; keine Exports entfernt. Allerdings: `generateIdsPunchoutUrl` hat aktuell **keinen einzigen Aufrufer** (nur ungenutzter Import, siehe B3). |
| **F** Konventionen | ✅ im **neuen** Code: keine `any`-Casts (route.ts und `parseIdsCartJson` nutzen Unknown-Narrowing); keine hartkodierten Secrets (`IDS_HOOK_SECRET` nur aus Env, [route.ts:53](file:///C:/Users/Robin/Desktop/AlphaExplorer/K.I.%20Takeover/Neu/Vibeforce%20One/vibeforce-flow-os/frontend/src/app/api/craft/ids/hook/route.ts#L53)); keine destruktiven Export-Änderungen. Hinweis: Bestehende `(entry as any)`-Casts in [cost-calculation.ts:150](file:///C:/Users/Robin/Desktop/AlphaExplorer/K.I.%20Takeover/Neu/Vibeforce%20One/vibeforce-flow-os/frontend/src/lib/cost-calculation.ts#L150) und [CostCockpit.tsx:674-678](file:///C:/Users/Robin/Desktop/AlphaExplorer/K.I.%20Takeover/Neu/Vibeforce%20One/vibeforce-flow-os/frontend/src/components/craft/CostCockpit.tsx#L674-L678) sind Altbestand, nicht durch M007 eingeführt. |
| **G** GAEB-90-Watertight (Aufgabe 4) | ✅ **Bestanden mit dokumentierten Abweichungen.** 44-Check-Smoketest: leerer Input → leeres BoQ (keine Exception), Müll-Input kein Crash, 25 ohne offene 21 ignoriert, `\r\n`/BOM robust, bestehende Exports funktionieren (Roundtrip). Abweichungen: 3-Nachkommastellen-Ambiguität (B8), Encoding-Kollateralschaden (B6) und U+FFFD-Lücke (B7) — Details §1.8/§2. |

---

## 2. Gefundene Bugs & Befunde

### B1 — Blocker (funktionaler Spec-Verstoß, Aufgabe 2): 303-Form-Return-Flow verliert den Warenkorb
**Ort:** [route.ts:151-164](file:///C:/Users/Robin/Desktop/AlphaExplorer/K.I.%20Takeover/Neu/Vibeforce%20One/vibeforce-flow-os/frontend/src/app/api/craft/ids/hook/route.ts#L151-L164)
**Befund:** Die Spec verlangt „Warenkorb-XML **parsen/sichern** und einen HTTP 303 Redirect ausführen". Die Route parst (`parsedCart`), **persistiert aber nirgends** und verwirft das Ergebnis beim 303. Zusätzlich liest **kein** Frontend-Code die Query-Parameter `ids_imported`/`cart_id` (kompletter `src/`-Grep: nur der Erzeuger in route.ts). Ergebnis: Realer Form-POST eines Großhändlers → Browser landet auf `/craft?tab=wholesale&ids_imported=1&cart_id=<zufall>` → Dashboard zeigt Standard- bzw. alten Warenkorb → die übertragenen Daten sind **still und unwiederbringlich verloren**. Das ist exakt der Kernanwendungsfall von Aufgabe 2.
**Fix-Vorschlag:** (a) Server-seitig speichern: z. B. PocketBase-Collection `ids_carts` (cart_id, project_id, json) oder signierter Cookie/vercel-kv, dann (b) in `CraftHubClient.tsx`/`WholesaleManager.tsx` bei `ids_imported=1&cart_id=<x>` den Cart per Server-Action/API laden und `setImportedCart(cart)` setzen; ggf. Session-Bindung (Cookie + cart_id) gegen Fremd-Lesen.

### B2 — Major (Security-Design): Token-Prüfung ist fail-open
**Ort:** [route.ts:53-54](file:///C:/Users/Robin/Desktop/AlphaExplorer/K.I.%20Takeover/Neu/Vibeforce%20One/vibeforce-flow-os/frontend/src/app/api/craft/ids/hook/route.ts#L53-L54)
**Befund:** Ohne gesetztes `IDS_HOOK_SECRET` wird die Authentifizierung **komplett übersprungen** — der Hook akzeptiert beliebige unauthentifizierte POSTs. Die Spec verlangt „CSRF/Session-Validierung" und „Token-Prüfung integrieren" ohne Opt-in-Klausel. Abmildernd: Derzeit kein Persistenz-Effekt (siehe B1) und das Entitlement-Gate verlangt eine gültige `projectId`; der Real-Impact ist aktuell begrenzt. Sobald B1 gefixt wird (Persistenz!), wird B2 unmittelbar kritisch (Fremd-Cart-Injektion in Nutzer-Dashboards).
**Fix-Vorschlag:** Fail-closed: `if (!hookSecret) return corsJson({error:'Hook nicht konfiguriert (IDS_HOOK_SECRET fehlt).'}, 503)` — ggf. nur in Produktion (`NODE_ENV==='production'`); mindestens `console.warn` bei fehlendem Secret. `IDS_HOOK_SECRET` zusätzlich in `.env.example` dokumentieren (existiert nicht).

### B3 — Minor (Code-Hygiene): Ungenutzter Import `generateIdsPunchoutUrl`
**Ort:** [WholesaleManager.tsx:45](file:///C:/Users/Robin/Desktop/AlphaExplorer/K.I.%20Takeover/Neu/Vibeforce%20One/vibeforce-flow-os/frontend/src/components/craft/WholesaleManager.tsx#L45)
**Befund:** Importiert, aber kein Aufruf im gesamten `src/`. Der Umsetzungsbericht behauptet einen „bestehenden Aufruf" in `WholesaleManager.tsx` — es gibt keinen Call-Site. (tsconfig hat kein `noUnusedLocals`, daher kompiliert es; inhaltlich ist die Punchout-URL-Generierung im Simulator nicht verdrahtet.)
**Fix-Vorschlag:** Entweder den echten Punchout-Flow verdrahten (Button „Großhandels-Shop öffnen" → `generateIdsPunchoutUrl` mit `projectId`/`hookSecret` aus Config → `window.open`), oder Import entfernen. Bericht anpassen.

### B4 — Minor (funktionaler Gap, dokumentiert): `regie_additive` in Produktion wirkungslos
**Ort:** [pocketbase-types.ts:365](file:///C:/Users/Robin/Desktop/AlphaExplorer/K.I.%20Takeover/Neu/Vibeforce%20One/vibeforce-flow-os/frontend/src/lib/pocketbase-types.ts#L365), [DailySiteReportForm.tsx](file:///C:/Users/Robin/Desktop/AlphaExplorer/K.I.%20Takeover/Neu/Vibeforce%20One/vibeforce-flow-os/frontend/src/components/craft/DailySiteReportForm.tsx) (kein `is_regie_extra`-Control)
**Befund:** Kein UI-Element setzt `is_regie_extra` (Grep: nur Typ + Berechnung) und das PB-Feld existiert noch nicht. Damit degeneriert der Modus `regie_additive` derzeit zu `time_entries`-Semantik. Der Bericht weist darauf offen hin (§4.2/§5.4) — die Berechnungslogik selbst ist korrekt. Als reine Spec-Aufgabe 3 erfüllt; als Produkt-Feature unvollständig.
**Fix-Vorschlag:** (a) PB-Migration `is_regie_extra` bool anlegen, (b) Checkbox „Regiestunden gem. § 2 Abs. 10 VOB/B" im `DailySiteReportForm` + Save-Action, (c) Feld in `backend/schema.md` als „angelegt" markieren.

### B5 — Minor (Kosmetik): Inkonsistentes Dezimaltrennzeichen im Banner
**Ort:** [CostCockpit.tsx:292](file:///C:/Users/Robin/Desktop/AlphaExplorer/K.I.%20Takeover/Neu/Vibeforce%20One/vibeforce-flow-os/frontend/src/components/craft/CostCockpit.tsx#L292) vs. [cost-calculation.ts:245-246](file:///C:/Users/Robin/Desktop/AlphaExplorer/K.I.%20Takeover/Neu/Vibeforce%20One/vibeforce-flow-os/frontend/src/lib/cost-calculation.ts#L245-L246)
**Befund:** Banner-Kopf zeigt `{ignoredHoursFromOtherSource} h` (z. B. „8.5") mit Punkt, der Warnungstext darunter nutzt `toLocaleString('de-DE')` („8,5") mit Komma.
**Fix-Vorschlag:** Banner-Wert ebenfalls mit `toLocaleString('de-DE')` formatieren.

### B6 — Major (Datenkorruption, Aufgabe 4): Unkonditionierte Mojibake-Normalisierung zerstört korrekt encodierten Text
**Ort:** [gaeb.ts:630-673](file:///C:/Users/Robin/Desktop/AlphaExplorer/K.I.%20Takeover/Neu/Vibeforce%20One/vibeforce-flow-os/frontend/src/lib/gaeb.ts#L630-L673)
**Befund:** `normalizeGaeb90Encoding` ersetzt **bedingungslos** typografische Zeichen („ → ä, " → ô, – → û, — → ù, … → à, ' / ' → æ/Æ, ™ → Ö, š → Ü, Ž → Ä, á → ß, Š/Œ/… → è/î/…). Moderne, korrekt als UTF-8/Windows-1252 angelieferte .d83-Dateien enthalten genau diese Zeichen legitim (deutsche Anführungszeichen „…", Gedankenstriche, ™ in Produktnamen, á in Eigennamen) und werden dabei **inhaltlich zerstört**. Smoketest-Nachweis: `Fenster „quer" – Lieferung … heute` → `Fenster äquerô û Lieferung à heute`; `Andalucía` → `Andalucßa`.
**Fix-Vorschlag:** Normalisierung nur anwenden, wenn eine Misread-Signatur erkannt wurde (Heuristik: Anteil U+0080-U+009F-Steuerzeichen oder typische Kombinationen), oder — sauberer — die Dekodierung auf Byte-Ebene lösen (`readAsArrayBuffer` + CP437/CP850-Decode-Tabelle bzw. `TextDecoder('windows-1252')` mit CP437-Fallback), statt post-hoc Zeichen zu ersetzen.

### B7 — Major (Spec-Ziel verfehlt, Aufgabe 4): Mojibake-Reparatur greift im realen Browser-Pfad nicht (U+FFFD-Lücke)
**Ort:** [gaeb.ts:665-673](file:///C:/Users/Robin/Desktop/AlphaExplorer/K.I.%20Takeover/Neu/Vibeforce%20One/vibeforce-flow-os/frontend/src/lib/gaeb.ts#L665-L673) i. V. m. [GaebManager.tsx:101, 117](file:///C:/Users/Robin/Desktop/AlphaExplorer/K.I.%20Takeover/Neu/Vibeforce%20One/vibeforce-flow-os/frontend/src/components/craft/GaebManager.tsx#L101) (`reader.readAsText(file)` = UTF-8-Decode)
**Befund:** CP437/CP850-Bytes ≥ 0x80 sind als UTF-8 ungültige Sequenzen und werden von `FileReader.readAsText` zu **U+FFFD** (�) — ein Zeichen, das die Map nicht enthält. Die Reparatur wirkt nur bei Latin-1/Windows-1252-Decodierung, die im aktuellen (und natürlichen) UI-Pfad nicht stattfindet. Ergebnis: „Encoding-Resilienz" (Spec-Anforderung) greift in der Praxis nie; Smoketest-Nachweis: `für` bleibt `f�r`.
**Fix-Vorschlag:** Bei der (noch ausstehenden) Verdrahtung in `GaebManager` Datei als `ArrayBuffer` lesen und mit Latin-1/1252/CP437/CP850-Kandidaten decodieren (Fehlerdetektion über U+FFFD/Steuerzeichen-Anteil), oder Map um U+FFFD-Kontext-Heuristik erweitern (schwächer, da kontextfrei).

### B8 — Major (Rechenfehler-Risiko, Aufgabe 4): 3-Nachkommastellen-Mengen werden als Tausender interpretiert
**Ort:** [gaeb.ts:728-746](file:///C:/Users/Robin/Desktop/AlphaExplorer/K.I.%20Takeover/Neu/Vibeforce%20One/vibeforce-flow-os/frontend/src/lib/gaeb.ts#L728-L746)
**Befund:** Die Heuristik „genau 3 Ziffern nach einzelnem Trennzeichen → Tausender" macht aus der gültigen Spec-Eingabe `85.000` (Punkt als Dezimaltrenner, 3 Nachkommastellen — in GAEB-Mengen üblich) den Wert **85000** (Smoketest-Nachweis: `qty=85000` statt 85). Faktor-1000-Fehler bei Mengen/Preisen.
**Fix-Vorschlag:** Semantisch differenzieren statt globaler 3er-Regel: Mengen/EP/GP sind Festbreiten-Felder der 25-Zeile — im Zweifel Dezimal-Interpretation bevorzugen (GAEB-Mengen haben typischerweise 2–3 Nachkommastellen, Tausenderpunkte sind bei Preisen mit 2 Nachkommastellen erkennbar: `1.062,50` enthält zusätzlich ein Komma → Tausender); alternativ Spaltenpositionen der Satzart 25 statt Token-Heuristik nutzen.

### B9 — Minor (Aufgabe 4): Unbekannte Einheit → leeres `qu` statt Default
**Ort:** [gaeb.ts:916-937](file:///C:/Users/Robin/Desktop/AlphaExplorer/K.I.%20Takeover/Neu/Vibeforce%20One/vibeforce-flow-os/frontend/src/lib/gaeb.ts#L916-L937)
**Befund:** Bei nicht erkannter Einheit bleibt `item.qu === ''`; `parseGaebXml` defaultet auf `'Stk'`. Inkonsistenz beim Verbraucher (z. B. `convertGaebItemToMeasurement`).
**Fix-Vorschlag:** Fallback `currentItem.qu = unit ?? 'Stk'` (bzw. `'psch'`) analog XML-Parser.

### Hinweise ohne Befund-Status (Info)
- [cost-calculation.ts:150](file:///C:/Users/Robin/Desktop/AlphaExplorer/K.I.%20Takeover/Neu/Vibeforce%20One/vibeforce-flow-os/frontend/src/lib/cost-calculation.ts#L150): Altbestand `(entry as any).expand?.user?.hourly_rate` — nicht M007, aber File-weite „keine any-Casts"-Behauptung des Berichts gilt nur für neuen Code.
- `isPublicSector`-Flag wird nur deklariert, nie logisch genutzt (z. B. Pflichtprüfung BT-10 bei `isPublicSector && !buyerReference`). Spec verlangt nur das Feld — keine Pflichtverletzung, aber sinnvolle Härtung.
- TTL via Client-Uhr: `createIdsHookToken` läuft im Browser (`Date.now()`); bei starker Clock-Skew Browser↔Server drohen falsche 401. 4h-Fenster macht das praktisch vernachlässigbar.
- `test_audit_fixes_watertight.mjs` Test 1 wurde datenseitig angepasst (`buyerVatId` ergänzt) — Produktionslogik unverändert ([zugferd.ts:82-90](file:///C:/Users/Robin/Desktop/AlphaExplorer/K.I.%20Takeover/Neu/Vibeforce%20One/vibeforce-flow-os/frontend/src/lib/zugferd.ts#L82-L90) wirft nachweislich weiter ohne `buyerVatId` bei Reverse-Charge). Vertretbar.

---

## 3. Bewertung der Architektur-Entscheidungen (aus dem Umsetzungsbericht)

1. **CII-XSD-Sequenz statt wörtlicher Spec-Anordnung (BT-13/BT-11 nach `BuyerTradeParty`):** **Vertretbar — und faktisch zwingend.** Die CII-D16B-Sequenz `HeaderTradeAgreementType` erlaubt `BuyerOrderReferencedDocument`/`SpecifiedProcuringProject` erst **nach** `BuyerTradeParty`; eine Platzierung neben BT-10 vor `SellerTradeParty` (wörtlichste Spec-Lesart) wäre schema-invalid und würde bei KoSIT/ZRE-Validierung abgewiesen. Die Spec schreibt „unmittelbar vor SellerTradeParty" explizit nur für `BuyerReference` vor — genau so umgesetzt. Die Abweichung ist also keine Interpretationsfreiheit, sondern normative Korrektheit. Gleiches gilt für Business- vor Guideline-Parameter im `ExchangedDocumentContext` (CII-konform).
2. **Pure-TS-HMAC-SHA256 statt `node:crypto`:** **Vertretbar.** Begründung des Implementierers ist stichhaltig: `ids-connect.ts` hängt im Client-Bundle (`WholesaleManager.tsx`-Importkette); `node:crypto` würde den Browser-Build brechen, Web-Crypto (`subtle`) ist async und verletzt die Spec-Signaturen. Das Risiko einer Eigenimplementierung wurde durch meine unabhängige Verifikation entschärft (RFC 4231, FIPS-Vektoren, 229 Fuzz-/Real-Fälle = node:crypto). Restrisiko: Seitenkanal-/Wartungslast bleibt bei Eigenbau; ein späterer Split (client: signierter Token-Transport, server: `node:crypto`) wäre langfristig sauberer.
3. **Opt-in-Token-Prüfung (nur wenn `IDS_HOOK_SECRET` gesetzt):** **Nicht vertretbar in Produktion** (fail-open auf öffentlichem Webhook; Spec verlangt Integration ohne Opt-out-Klausel). Intern konsistent (auch `generateIdsPunchoutUrl` hängt Token nur bei konfiguriertem Secret an), und als Übergangszustand tolerierbar — aber spätestens mit Persistenz (B1-Fix) muss fail-closed umgesetzt werden. Siehe Befund B2.
4. **TTL-Härtung (endliche Werte inkl. ≤0 durchreichen, nur nicht-endliche → 4h):** **Vertretbar und korrekt.** Das Hochklemmen negativer/0-Werte auf 4h hätte mehr Gültigkeit gewährt als angefragt; die gewählte Richtung ist fail-safe (sofort abgelaufen). NaN/Infinity-Fallback auf 4h entspricht dem Spec-Default.
5. **Alias `ProjectCostInput = CalculationInput` statt Umbenennung:** **Vertretbar.** Die Spec nennt den Typnamen `ProjectCostInput`; ein Alias erfüllt den Namen ohne alle bestehenden Importeure zu brechen — die bessere Wahl gegenüber destruktiver Umbenennung.
6. **`parseIdsCartJson` als Ergänzung über den Spec-Buchstaben hinaus:** **Vertretbar und sinnvoll.** „Dualer Universal Receiver" verlangt JSON-Unterstützung; reine JSON-Carts (ohne `xml`/`cart`-Wrapper) sind der natürliche AJAX-Payload. Wrapper-vs.-rein-Erkennung ist sauber getrennt, Fehlerpfad korrekt auf 400.
7. **SSOT `schema.md` beschreibt `is_regie_extra` vor der PB-Migration:** **Vertretbar mit Auflage.** AGENTS.md deklariert `schema.md` als Single Source of Truth — Zielzustand dokumentieren ist korrekt. Aber ohne zeitnahe Migration (B4) driftet SSOT vs. Real-DB auseinander und das Feature bleibt inert. Der Bericht weist darauf transparent hin.
8. **GAEB 90: Heuristische Zeichen-Ersetzung statt Byte-Level-Dekodierung:** **Nicht vertretbar.** Post-hoc-Zeichenersatz kann nicht zwischen echtem Mojibake und korrekt encodierten typografischen Zeichen unterscheiden → Datenkorruption bei gültigem Input (B6) und Wirkungslosigkeit beim realen UTF-8-Read-Pfad (B7). Korrekt wäre: Decode auf Byte-Ebene (ArrayBuffer → CP437/CP850/1252-Kandidaten, Erkennung über Steuerzeichen-/U+FFFD-Anteil).
9. **GAEB 90: Tausender-Heuristik „3 Ziffern nach einzelnem Trennzeichen":** **Bedingt vertretbar, aktuell nicht.** Die Regel ist als dokumentierter Trade-off nachvollziehbar („1.234" vs. „1.234,56"), produziert aber für die im GAEB-Format üblichen 3-Nachkommastellen-Mengen Faktor-1000-Fehler (B8). Solange der Parser Feld-Semantik (Menge/EP/GP) kennt, sollte er diese ausnutzen statt einer globalen Token-Regel.
10. **GAEB 90: `detectGaebFormat`-Mehrheitsregel (≥2 Treffer + ≥50%):** **Vertretbar.** Robuste Heuristik gegen Prosa-Fehlalarme; Rest-Risiko (XML ohne GAEB-Wurzel → `GAEB_XML`, zeilenbasierte Zufallstreffer) ist klein und führt jeweils zu kontrolliertem Parse-Fehler bzw. harmlosem Fehlimport-Versuch. Eine zusätzliche Wurzel-Prüfung (`<GAEB`) für die XML-Klassifikation wäre ein sinnvolles Upgrade (Minor).
11. **GAEB 90: `parseGaeb90Text` wirft nie (leeres BoQ statt Exception):** **Vertretbar.** Entspricht der Spec-Vorgabe („leerer Input → leeres GaebBoQ statt Exception"); die Asymmetrie zum werfenden `parseGaebXml` ist bewusst und beim Verdrahten in `GaebManager` zu beachten (Caller muss beide Fehlermodelle abfangen).

---

## 4. Test- & Typecheck-Ergebnisse (im Terminal ausgeführt)

| Prüfung | Befehl | Ergebnis |
|---|---|---|
| M007-Aufgaben-1–3-Watertight-Test | `node tools/test_audit_m007_tasks123.mjs` | ✅ **32/32 Assertions grün** |
| Regressions-Watertight-Test | `node tools/test_audit_fixes_watertight.mjs` | ✅ **3/3 Tests grün** |
| TypeScript-Typecheck | `npx tsc --noEmit` in `frontend/` | ✅ **0 Fehler** (Exit 0) |
| Eigene HMAC-Verifikation (Prüfer) | Temp-Script vs. node:crypto + RFC 4231/FIPS 180-4 | ✅ 29 Real-Signaturen, 5 RFC-Vektoren, 3 Digest-Vektoren, 200 Fuzz — alle korrekt |
| Eigene Kostenlogik-Gegenbeispiele (Prüfer) | Temp-Script, 19 Checks | ✅ alle korrekt (kein Doppelzählungs-/Verlust-Szenario konstruierbar) |
| GAEB-90-Smoketest (Prüfer, Aufgabe 4) | Temp-Script: D83-Minimalset (00/10/10/21/25/26 inkl. Mojibake Latin-1 **und** Windows-1252, Tausenderpunkt, fehlender GP, `\r\n`), Detektion auf XML/X84-Sample, Rechnungs-XML, Fließtext, leer/Whitespace, Müll, 25-ohne-21, Roundtrip `parseGaebXml` | ✅ **44/44 Checks grün** — Summen cent-genau (1220 → 231.80 → 1451.80); Demonstrationen B6/B7/B8 reproduziert |
| GAEB-90-Smoketest der GAEB-Session | `node tools/test_gaeb90_smoke.mjs` | ✅ **39/39 PASS** (Detektion, typisches D83 mit Mojibake/fehlendem GP/25-ohne-21/Auto-OZ, verschachtelte Kategorien, Summen, DM/DP84, leer/Müll) — von mir wiederholt ausgeführt |
| GAEB-90-Smoketest (Prüfer, unabhängig) | Temp-Script: D83-Minimalset (00/10/10/21/25/26 inkl. Mojibake Latin-1 **und** Windows-1252, Tausenderpunkt, fehlender GP, `\r\n`), Detektion auf XML/X84-Sample, Rechnungs-XML, Fließtext, leer/Whitespace, Müll, 25-ohne-21, Roundtrip `parseGaebXml` | ✅ **44/44 Checks grün** — Summen cent-genau (1220 → 231.80 → 1451.80); Demonstrationen B6/B7/B8 reproduziert. Hinweis: Der Session-Test deckt Latin-1- und 1252-Mojibake ab, aber **nicht** die Negativfälle B6 (korrekt encodierte typografische Zeichen werden zerstört) und B7 (U+FFFD aus UTF-8-Misread bleibt kaputt) — diese zwei Fälle sind im permanenten Test nicht abgesichert |

**Hinweis:** `node tools/test_audit_m007_tasks123.mjs` erzeugt beim Import eine Warnung (`MODULE_TYPELESS_PACKAGE_JSON`) — funktional irrelevant (Node 24 Type-Stripping), aber ein `"type": "module"`-Hinweis für das Frontend-package.json wäre sauberer.

---

## 5. Fazit

Die Aufgaben 1 und 3 sind **vollständig und korrekt** umgesetzt (ZUGFeRD BT-10/11/13 schema-valide inkl. Escaping; LabourSource-Konsolidierung mathematisch watertight — kein Doppelzählungsszenario konstruierbar; HMAC-SHA256-Eigenbau bit-genau verifiziert). Aufgabe 2 ist **teilweise** erfüllt: Token-/CORS-/303-/JSON-Mechanik korrekt, aber der Kern-Flow „Form-POST → Warenkorb im Dashboard" bricht wegen fehlender Persistenz und fehlendem `ids_imported`-Consumer (B1, Blocker) und der Token-Schutz ist fail-open (B2, Major).

Aufgabe 4 (GAEB 90, Nachtrag): Die Parser-Kernlogik (`detectGaebFormat`, `parseGaeb90Text`, Satzarten 00/10/21/25/26, GaebBoQ-Kompatibilität, Summen, Crash-Sicherheit, unveränderte Alt-Exports) ist **solide und Smoke-verifiziert** (Session-Test 39/39 + Prüfer-Test 44/44, `tsc` clean). Drei echte Mängel stehen dem produktiven Einsatz entgegen: unkonditionierte Mojibake-Reparatur korrumpiert korrekt encodierte Dateien (B6, Major), die Reparatur greift im realen UTF-8-Read-Pfad nicht (B7, Major), und 3-Nachkommastellen-Mengen werden um Faktor 1000 verrechnet (B8, Major). Zusätzlich ist die Funktion noch nirgends verdrahtet (`.d83`-Upload in `GaebManager` läuft weiter direkt in `parseGaebXml` und scheitert).

Gesamturteil: **Bestanden mit Auflagen.** Vor Produktiv-Einsatz: B1, B2 (IDS-Hook-Flow), B6–B8 (GAEB 90) beheben; B3–B5, B9 sind niedrigschwellige Nacharbeiten; GAEB-Verdrahtung in `GaebManager` (mit byte-basierter Datei-Einlesung statt UTF-8-`readAsText`) steht aus — danach den permanenten Smoketest um die Negativfälle B6/B7 erweitern.
