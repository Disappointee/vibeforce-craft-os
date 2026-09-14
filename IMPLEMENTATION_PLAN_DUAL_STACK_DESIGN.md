# IMPLEMENTATION PLAN — Vibeforce One Dual-Stack Design-Systeme & Wiederaufnahme

> **Task-ID:** `TASK-DUALSTACK-PLAN-01`
> **Erstellt von:** Kilo Code (GLM 5.3 Flash) am 07.09.2026
> **Basis:** [`auftrag_vibeforce_dual_stack_design.md`](file:///c:/Users/kasan/.gemini/antigravity/brain/9d1aaf3f-b89a-4ecb-802b-2cb0af98736a/auftrag_vibeforce_dual_stack_design.md)
> **Zweck:** Vorgehensplan für die Wiederaufnahme des gestoppten Dual-Stack-Auftrags. Zur Validierung durch Antigravity (Gemini) eingereicht.

---

## 1. Ausgangslage

| Stufe | Status |
| :--- | :--- |
| Stufe 1 — Backend- & Query-Härtung | ✅ Abgeschlossen & verifiziert |
| Parallel — Flow OS Isolation Audit | ✅ Abgeschlossen (8 Craft-Lecks eliminiert) |
| Stufe 2 — Hostname & Subdomain Routing | ✅ Abgeschlossen (10/10 Tests OK) |
| Stufe 3 — Live-Seeder für Handwerk | ✅ Abgeschlossen (EFH Huber + Gewerbehalle Schmidt) |
| Stufe 4 — 1-Klick Meister-Login & UI | ⏸️ Vorbereitet, `tsc --noEmit` = 0 Fehler, **gestoppt auf Nutzeranweisung** |

**Offene Hauptarbeiten laut Auftrag Abschnitt 4:** Abschluss Stufe 4 → OpenDesign/Stitch Design-Systeme → Stufe 5 Deployment & E2E.

---

## 2. Zielbild

1. Beide Design-Systeme („Vibeforce Flow OS" & „Vibeforce Craft OS") als vollständige Design-File-Spezifikationen (DESIGN.md) in OpenDesign/Stitch registriert und synchronisiert.
2. Stufe 4 (1-Klick Login) abgenommen und gesichert.
3. Stufe 5: Live-Deployment auf Vercel mit erfolgreicher E2E-Suite und Übergabezertifikat.

---

## 3. Phasenplan

### Phase A — Abschluss & Abnahme Stufe 4 (1-Klick Login)

| # | Schritt | Deliverable / Verifikation |
| :--- | :--- | :--- |
| A1 | Frontend Dev-Server starten, Login-Seite (`/login`) unter beiden Host-Kontexten (Flow + Craft) prüfen | 1-Klick Demo-Login-Box sichtbar & funktional |
| A2 | `node tools/test_demo_login_playwright.mjs` ausführen | Playwright-Test grün (Login via Host-Header Cookie-Injection) |
| A3 | Screenshots beider Varianten (Craft Amber / Flow Petrol) in Brain-Ordner sichern | 2 Screenshot-Dateien mit Zeitstempel |
| A4 | Nutzer-Freigabe (Grill-Me) einholen | Explizites OK des Nutzers |
| A5 | **Quality Gate:** `validate_with_gemini` (taskId `TASK-DUALSTACK-STUFE4-01`) | Gemini-Freigabe vor Phase B |

### Phase B — OpenDesign / Stitch Anbindung (Design-Systeme)

| # | Schritt | Deliverable / Verifikation |
| :--- | :--- | :--- |
| B1 | Daemon-Verbindung prüfen (`http://127.0.0.1:43298`, PID 23436), ggf. neu etablieren | Health-Check OK |
| B2 | Design-File „Vibeforce Flow OS — Agency Operating System" anlegen: Primary Petrol `#0d9488`, Obsidian Canvas `#0a0a0c`, Typo Plus Jakarta Sans/Geist + Inter + JetBrains Mono, Komponenten (Kanban-Cards, Live-Timer-Bar, Finance-Charts, Collapsed-Sidebar 64px) | `DESIGN.md` Flow OS registriert |
| B3 | Design-File „Vibeforce Craft OS — Construction & Craft Operating System" anlegen: Primary Bernstein `#f59e0b`, Industrial Slate `#0f172a`/`#1e293b`, Signatur-Farben Safety Orange `#ea580c` / Signal Red `#dc2626` / Safety Green `#16a34a`, Typo Hanken Grotesk/Chivo + Inter SemiBold, Komponenten (Baustellen-Akte GPS+Wetter, Touch-Canvas-Signatur, DIN 18299 Aufmaß-Grid, IDS 2.5 Punchout, ZUGFeRD 2.2 Vorschau, 48px Touch-TabBar) | `DESIGN.md` Craft OS registriert |
| B4 | Sync-Verifikation: beide Files in OpenDesign/Stitch-UI sichtbar & versioniert | Screenshots der Design-Systeme |
| B5 | **Quality Gate:** `validate_with_gemini` (taskId `TASK-DUALSTACK-DESIGN-01`) | Gemini-Freigabe vor Phase C |

### Phase C — Stufe 5: Deployment & E2E-Live-Abnahme

| # | Schritt | Deliverable / Verifikation |
| :--- | :--- | :--- |
| C1 | `git status`/`git diff` review, nur intended files stagen | Sauberer Staging-Bereich |
| C2 | Commit: `feat(craft-os): single-engine live showcase with dual-stack design systems` | Commit-Hash |
| C3 | Push auf `main` → Vercel Auto-Build abwarten | Vercel Build ✅ |
| C4 | Playwright E2E-Suite gegen Live-URL (Flow + Craft Kontexte, incl. Routing-Tests Stufe 2) | Alle E2E-Tests grün |
| C5 | Übergabezertifikat + Screenshot-Katalog im Brain-Ordner erstellen | Zertifikat + Katalog-Dateien |
| C6 | **Quality Gate:** `validate_with_gemini` (taskId `TASK-DUALSTACK-STUFE5-01`) | Finale Gemini-Abnahme |

---

## 4. Qualitäts- & Sicherheitsprinzipien während der Ausführung

* **Zero Truncation / Zero Placebo:** Design-Specs vollständig, alle interaktiven Elemente funktional verdrahtet.
* **Verify Before Done:** Jede Phase nur mit grünem Nachweis (Test/Screenshot) abschließen.
* **Fail Fast:** Bei wiederholtem Fehlschlag (z. B. Daemon tot) → stoppen, Ursache analysieren, Neu-Planung statt Endlos-Retry.
* **Keine Secrets im Repo:** Credentials (Abschnitt 5 des Auftrags) bleiben lokal (Brain-Ordner / gitignored Dateien), niemals in Commits.
* **Stop-Punkte:** Nach jedem Quality Gate auf Gemini-Freigabe warten, bevor die nächste Phase startet.

## 5. Risiken & Annahmen

| Risiko | Maßnahme |
| :--- | :--- |
| OpenDesign-Daemon (Port 43298) nicht erreichbar | PID/Prozess prüfen, Neustart des Daemons vor B2; andernfalls Fallback: DESIGN.md lokal im Repo (`docs/design/`) anlegen und Sync nachholen |
| Playwright-Login-Test schlägt fehl (Cookie-Injection) | Diagnose via `test_stufe2_routing.mjs` Regressionen, Root-Cause-Analyse statt Patch-Übersteuern |
| Vercel-Build schlägt fehl | `npm run build` lokal vor Push erzwingen (Gate C2-Vorlauf) |
| PocketBase Live-Backend antwortet nicht | Health-Check vor A2/C4; Abbruch + Nutzerinfo statt Fehlermaskierung |

---

## 6. Validierungsanfrage an Antigravity (Gemini)

**Bitte prüfe diesen Plan auf:**
1. Vollständigkeit bezogen auf Auftrag Abschnitt 3 (beide Design-Systeme) und Abschnitt 4 (Wiederaufnahme-Reihenfolge).
2. Sinnhaftigkeit der Quality-Gate-Positionen (A5/B5/C6).
3. Risikobewertung: Fallback-Strategie bei Daemon-Ausfall.
4. Freigabe (`READY_FOR_KILO`) oder Korrekturanweisung in `CURRENT_TASK.md`.
