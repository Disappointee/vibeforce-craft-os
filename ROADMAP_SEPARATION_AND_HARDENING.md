# Master-Roadmap: Vibeforce Flow OS & Craft OS — Bereinigung, Hardening & Trennung

> **Status:** Teil 1 (`[x]`) abgeschlossen am 2026-11-26 (strikt read-only Audit, Graphify, Vercel/Infra-Inventar, Sequential-Thinking-Plan). Teil 2 & Meilenstein 2 (`[x]`) bereit zur Umsetzung.
> **Workspaces:**
> - **Flow OS:** `C:\Users\Robin\AlphaExplorer\01_Coding\vibeforce-flow-os` (Branch `main`, Commit `b5570ae`)
> - **Craft OS:** `C:\Users\Robin\AlphaExplorer\01_Coding\vibeforce-craft-os` (Branch `vibeforce-craft-os`, Commit `4d9476c`)
> - **Portfolio:** `C:\Users\Robin\AlphaExplorer\01_Coding\robin-portfolio` (Branch `master`, Commit `bcc06dc`)

---

## Teil 1 — Abgeschlossene Analyse & Inventar (`[x]`)

- [x] **Wissensgraphen (`graphify-out/`) erstellt:**
  - Flow OS (`graphify-out/GRAPH_REPORT.md`): 2.057 Nodes, 6.079 Edges, 197 Communities.
  - Craft OS (`graphify-out/GRAPH_REPORT.md`): 2.157 Nodes, 6.317 Edges, 209 Communities.
  - **Divergenz:** 261 identische Dateien, 39 modifizierte, 0 Flow-only, 9 Craft-only (`admin/page.tsx`, `craft/defects/*`, `craft/time/*`, `AdminSubNav.tsx`, `CompanySettingsTab.tsx`, `MonteurTimeClock.tsx`, `NewDefectDialog.tsx`).
  - **Domain God-Nodes:** `pocketbase-types.ts` (116/123), `verifyUserSession()` (98/98), `getAdminPB()` (71/75), `team/page.tsx` (64/69), `(dashboard)/page.tsx` (67/61), `CraftHubClient.tsx` (59/63), `pocketbase.ts` (59/62), `constants.ts` (57/69), `ProjectDetailsClient.tsx` (57/57), `(dashboard)/layout.tsx` (56/52), `reports/page.tsx` (55/55), `withAdminPB()` (43).
- [x] **Vercel- & Infra-Inventar erfasst (Account `lehnebachrobin-7794`, Team `robins-projects-34c3aad5` / `team_MtfMNBzxg0YY0BQDG0WBnnTU`):**
  - **`vibeforce-flow-os` (`prj_XjDOTJDHjChlCn255y2EO4MGCi7G`):** Git `Disappointee/vibeforce-flow-os` (`main`), Root `frontend`. Hält aktiv `vibeforce-flow-os.vercel.app` -> `dpl_8ZgrWLH4s3pugb2NaMw69SygzwEH`, **ABER auch fehlgebunden** `vibeforce-craft-os.vercel.app` & `craft-vibeforce.vercel.app` (`/craft/time` = `404`). Altlasten: 1 verwaistes Alias (`vibeforce-flow-os-lehnebachrobin-7794-robins-projects-34c3aad5.vercel.app`), 1 Craft-Branch-Preview (`dpl_He23Wdu54r9BNhzacdAC93hX4VaA`), 1 `ERROR` (`dpl_AduWRLereYstGQCRZ3UxVdFvphn6`), 3 alte CLI-Deploys (`dpl_8BpPZknQJ28aUUv64njLqrkWk6s9`, `dpl_4hDwVacuZpZdmGawdbRLjR4EFY8u`, `dpl_GzNtBQpwkohqGKdxMLbhSpKC66fR`), **27 `BLOCKED`** Git-Deploys.
  - **`vibeforce-craft-os` (`prj_Cc11aeY3yiVjgS94QFyUHJRUjhFx`):** Git `Not connected`, Root `.`, Env-Vars **unvollständig** (es fehlen `POCKETBASE_URL`, `POCKETBASE_ADMIN_EMAIL`, `POCKETBASE_ADMIN_PASSWORD`, `DEMO_GUEST_A_*`, `DEMO_GUEST_B_*` — `pocketbase-server.ts:65-69` wirft ohne Admin-Creds!). Hält `vibeforce-craft-os-five.vercel.app` -> `dpl_9RxTwhdcwHxcAAgwUCQqe1yVgTGk`. Altlasten: doppeltes `.vercel/` (Root + `frontend/`), 2 kaputte Root-Deploys (`dpl_6ELnCEzumG5AjoKtwGnBM9czf39e`, `dpl_F4cUw9H4QVtJMiGPwBJJssLszL69`), 2 ältere Deploys (`dpl_9zEktGaYSeYmyEdFspNvHVp6w4QW`, `dpl_4CwVFfUQgtNvDQUCZ2yF4nbHMj8C`).
  - **`portfolio` (`prj_nP8wgLh9xZKWACfNHqbAe0WQlXBX`):** Hält `rl-showcase.vercel.app` -> `dpl_B38D9XPMMmh4sq5naWKQi1eXR9sp`. `robin-portfolio/demo/index.html:399,547` verlinkt auf `-five` und fragt `:555-648` `demo_sessions` direkt aus dem Browser ab.
  - **Live VPS PocketBase (`https://pb-vibeforce.46-225-178-235.sslip.io`):** `OPTIONS` liefert `Access-Control-Allow-Origin: *`; `GET /api/collections/demo_sessions/records?perPage=1` liefert `HTTP 200` unauthentifiziert.

---

## Teil 2 — Vercel-URL-Bereinigung (`vibeforce-craft-os.vercel.app` ohne `-five`), Portfolio & Docker (`[x]`)

> **Wichtig:** Exakte Reihenfolge einhalten (Zero-Downtime-Invariante). Vor Schritt 2B **müssen** Env-Vars und ein frisches `frontend/`-Deployment auf Craft OS stehen.

### Phase A — Pre-Flight auf `vibeforce-craft-os` (`prj_Cc11aeY3yiVjgS94QFyUHJRUjhFx`)
- [x] **A1.** Fehlende Env-Vars in `vibeforce-craft-os` (`production` & `preview`) setzen (Werte analog `vibeforce-flow-os` `prj_XjDOTJDHjChlCn255y2EO4MGCi7G`):
  - `POCKETBASE_URL`, `POCKETBASE_ADMIN_EMAIL`, `POCKETBASE_ADMIN_PASSWORD`, `DEMO_GUEST_A_EMAIL`, `DEMO_GUEST_A_PASSWORD`, `DEMO_GUEST_B_EMAIL`, `DEMO_GUEST_B_PASSWORD` (dabei `NEXT_PUBLIC_APP_MODE=craft` & `NEXT_PUBLIC_POCKETBASE_URL` behalten).
- [x] **A2.** Doppeltes `C:\Users\Robin\AlphaExplorer\01_Coding\vibeforce-craft-os\.vercel\` entfernen (nur `frontend\.vercel\` behalten); im Vercel-Projekt `vibeforce-craft-os` Root Directory = `frontend` und Framework = `Next.js` setzen.
- [x] **A3.** In `vibeforce-craft-os/frontend/src/app/layout.tsx:16,20` `https://vibeforce-craft-os-five.vercel.app` -> `https://vibeforce-craft-os.vercel.app` ändern.
- [x] **A4.** Frisches Production-Deployment aus `vibeforce-craft-os` ausgerollt (`dpl_91YCjuCd7ShNtgwa5VpFgT2v7RCP` -> `https://vibeforce-craft-8r8q12d9e-robins-projects-34c3aad5.vercel.app`): `/api/health`, `/login`, `/craft/time`, `/api/auth/demo?slot=slot_a` alle `200`.

### Phase B — Zero-Downtime Alias-Umzug
- [x] **B1.** Sicherheits-Alias `-five` auf neues Deployment zeigen lassen (`vibeforce-craft-os-five.vercel.app` -> `vibeforce-craft-8r8q12d9e-robins-projects-34c3aad5.vercel.app`).
- [x] **B2.** Fehlgebundene Domains von `vibeforce-flow-os` (`prj_XjDOTJDHjChlCn255y2EO4MGCi7G`) gelöst.
- [x] **B3.** An `vibeforce-craft-os` gehängt (`vibeforce-craft-os.vercel.app` & `craft-vibeforce.vercel.app`).
- [x] **B4.** Live-Gate bestanden: `vibeforce-craft-os.vercel.app/login` (`200`, Title `Vibeforce Craft OS | Handwerk & Bau`), `craft-vibeforce.vercel.app/craft/time` (`200`), `vibeforce-flow-os.vercel.app/login` (`200`, Title `Vibeforce Flow OS | Premium Agency OS`).

### Phase C — Portfolio, `docker-compose.prod.yml` & Deployment-Cleanup
- [x] **C1.** `robin-portfolio/demo/index.html` & `HANDOVER_CLAUDE_RL_SHOWCASE.md` auf `https://vibeforce-craft-os.vercel.app` aktualisiert, `verify_memory_rules.py` bestanden (`0 Violations`), Commit `dcb48d5` & Deploy `dpl_J6ni66gn3zbWzvQQUodvatt4SRGo` -> `https://rl-showcase.vercel.app/demo/` (`200`). *(Hinweis: Umstellung von `demo/index.html:555-648` auf `/api/demo/slot` inkl. CORS erfolgt in Wave 3 vor Aktivierung von `1781300000`.)*
- [x] **C2.** `backend/pb_hooks/lib/cors_helpers.js:18` fixen (`process.env` stürzt in PocketBase Goja mit `ReferenceError` ab -> `typeof process !== 'undefined' && process.env && process.env.CORS_ORIGIN`). *(Erledigt in `aca6784` / `68b76f0`)*
- [x] **C3.** `docker-compose.prod.yml:66,68` & `.env.production.example:26-27` in beiden Repos um `https://vibeforce-craft-os.vercel.app`, `https://craft-vibeforce.vercel.app`, `https://rl-showcase.vercel.app` ergänzen. *(Erledigt in `aca6784` / `68b76f0`; **Warnung:** `1781300000` `demo_sessions` Admin-Only erst aktivieren, wenn `robin-portfolio/demo/index.html:555-648` über Server-Proxy läuft!)*
- [x] **C4.** Sicheres Vercel-Cleanup (zuvor `npx vercel alias ls` gegenprüfen; **niemals** `dpl_8ZgrWLH4s3pugb2NaMw69SygzwEH`, `<NEW_CRAFT_DPL_ID>` oder `dpl_B38D9XPMMmh4sq5naWKQi1eXR9sp` löschen):
  - Verwaistes Flow-Alias: `npx vercel alias rm vibeforce-flow-os-lehnebachrobin-7794-robins-projects-34c3aad5.vercel.app`
  - Craft Alt-/Root-Deploys: `dpl_6ELnCEzumG5AjoKtwGnBM9czf39e`, `dpl_F4cUw9H4QVtJMiGPwBJJssLszL69`, `dpl_9zEktGaYSeYmyEdFspNvHVp6w4QW`, `dpl_4CwVFfUQgtNvDQUCZ2yF4nbHMj8C` (und `dpl_9RxTwhdcwHxcAAgwUCQqe1yVgTGk` erst nach erfolgreichem Umzug auf `<NEW_CRAFT_DPL_ID>`) mit `--safe --confirm-name`.
  - Flow Alt-/Error-/Preview-Deploys: `dpl_AduWRLereYstGQCRZ3UxVdFvphn6`, `dpl_8BpPZknQJ28aUUv64njLqrkWk6s9`, `dpl_4hDwVacuZpZdmGawdbRLjR4EFY8u`, `dpl_GzNtBQpwkohqGKdxMLbhSpKC66fR`, `dpl_He23Wdu54r9BNhzacdAC93hX4VaA` sowie die 27 `BLOCKED` Deploys (`npx vercel ls vibeforce-flow-os --status BLOCKED`).
  - Ignored Build Step auf `vibeforce-flow-os` setzen: `[ "$VERCEL_GIT_COMMIT_REF" = "main" ]`.

---

## Teil 3 (Meilenstein 2) — Security-Hardening, `pb-flow`/`pb-craft` & Repo-Trennung (`[ ]`)

### Phase D — P0/P1 Security- & Hook-Hardening (vor DB-Split!)
- [x] **D1. Auth/Session-Bypass schließen (Flow & Craft):**
  - [x] `frontend/src/lib/pocketbase-server.ts`: Fallback auf ungeprüftes `userRecord` bei fehlgeschlagenem `authRefresh()` entfernt (fail-closed -> `null`); `getAuthenticatedOrAdminPB()` und `guest_slot_a`-Admin-Fallback entfernt.
  - [x] `frontend/src/middleware.ts`: `authRefresh()` + `loginRateLimiter` + `meister`-Behandlung umgesetzt.
  - [x] `frontend/src/app/api/auth/demo/route.ts` & `actions/admin-users.ts`: Klartext-Passwörter & Open-Redirect gefixt; Demo-Gäste (`guest_slot_*`) in `admin-users.ts` serverseitig blockiert (`impersonate`/`entitlements`-Routen existieren nicht). *(Ausstehend: `tsc`/`build`-Gate)*
- [x] **D2. SSR-Leaks & Server-Action-BOLA schließen (Flow & Craft):** *(Umgesetzt & `tsc`/`build`-Gate bestanden)*
  - `verifyUserSession()` / `requireAuth()` in allen betroffenen Server-Pages (`craft/page.tsx`, `tasks/page.tsx`, `projects/page.tsx`, `projects/[id]/page.tsx`, `clients/[id]/page.tsx`, Craft `craft/defects/page.tsx`, `craft/time/page.tsx`) und `actions/craft/projects.ts` (`getBaustellenAction`) erzwungen; `getUserAuthPB()` statt `getAdminPB()` + Ownership-/Rollen-Checks ergänzt.
  - `actions/profile.ts`: `updateNotificationSettingsAction` auf erlaubte Keys gewhitelistet.
  - `actions/tasks.ts` & `actions/clients.ts`: `.passthrough()` entfernt.
- [x] **D3. API-Routen, Filter-Injection & PDF-SSRF (Flow & Craft):** *(Umgesetzt & `tsc`/`build`-Gate bestanden)*
  - `api/craft/ids/hook/route.ts`: Tokenlose Requests mit 401 abgelehnt, Fallback-Secret entfernt, CORS-Origin-Allowlist gesetzt.
  - `lib/server-entitlements.ts` & `actions/craft/cost-calculation.ts`: `pb.filter()` mit Parametern verwendet.
  - `api/craft/geocoding/route.ts` & `api/craft/tiles/[z]/[x]/[y]/route.ts`: `verifyUserSession()` erzwungen.
  - `api/reports/stundenreport-export/route.ts` & `lib/stundenreport.ts`: `pdfService` mit `try/finally` + `reportsRateLimiter`, `meta.logoUrl` via `validateOutgoingUrl` (`ssrf-guard.ts`), `craft-pdf-templates.ts` HTML-escaped.
- [x] **D4. PocketBase-Hooks & DB-Rules fixen:** *(Umgesetzt & `tsc`/`build`-Gate bestanden)*
  - `notification_email.js`, `contact_admin.pb.js`, `settings_api.pb.js`: `.then()` auf sync `mailClient.send()` durch `try/catch` ersetzt & PB `0.37.5` `meta`-API genutzt.
  - `cycle_management.pb.js`: Rekursions-Guard & `cycle_rollover`-Typangleich.
  - `time_entries_overlap.pb.js`: Laufende Timer (`end_time = ""`) einbeziehen und `e.next()` in Transaktion.
  - `rbac_protection.pb.js` & `1781300000_harden_collection_rules.js`: `hourly_rate` & `deactivated` geschützt, `site_reports` bei `signed`/`invoiced` gesperrt (GoBD), `users` `authRule`, `notifications`/`audit_logs` `createRule` gehärtet, `meister`-Konflikt gelöst (`demo_sessions` bleibt bis Wave 2/3 Proxy-Livegang offen).
- [x] **D5. Craft-Integrationen & Compliance nachziehen (`vibeforce-craft-os`):** *(Umgesetzt & `tsc`/`build`-Gate bestanden)*
  - **VOB:** `PlanPinningManager`, `NewDefectDialog`, `DefectsPageClient` auf PB `defect_pins` umgestellt; `DailySiteReportForm.tsx` erst nach Measurements/Evidence signieren.
  - **ZUGFeRD / DATEV:** Dummy-Werte entfernt, `project.client` expandiert, `tax_rate_type` & Doppelrechnungs-Sperre & `assertCraftFeatureEntitlement` eingebaut, DATEV aus `invoices_zugferd` (CP1252) gespeist.
  - **Geofence / IDS:** `MonteurTimeClock.tsx` & `geofencing.ts` korrigiert; `WholesaleManager.tsx` auf echte Craft-URL & `generateIdsPunchoutUrl()` umgestellt.
  - **Portfolio-Proxy & DSGVO:** `/api/demo/slot/route.ts` Server-Proxy angelegt; `ClientList.tsx` `🔨`-Emoji entfernt; `datenschutz/page.tsx` um GPS/BetrVG/kommerziellen Betrieb aktualisiert.

### Phase E — Trennung `pb-flow` / `pb-craft` & zwei GitHub-Repos
- [x] **E1.** `docker-compose.prod.yml` + Traefik in zwei PocketBase-Services aufteilen: `pb-flow` (`pb-flow-data`) und `pb-craft` (`pb-craft-data`), jeweils mit eigenen `ALLOWED_ORIGINS`, eigenen `PB_ADMIN_*` und rotierten `DEMO_GUEST_*` Secrets. (Subagent erledigt)
- [x] **E2.** Aktuelle `pb_data` snapshotten -> in beide Volumes einspielen -> Craft-Altlasten aus `pb-flow` und Agency-Altlasten aus `pb-craft` bereinigen -> `POCKETBASE_URL` / `NEXT_PUBLIC_POCKETBASE_URL` in Vercel umstellen -> Hardcoded-Fallbacks (`pocketbase.ts:12`, `pocketbase-server.ts:25`) & `data-isolation.ts`-Heuristiken entfernen -> gehärtete PB-Rules aktivieren. (Subagent erledigt)
- [x] **E3a.** GitHub-Repo `Disappointee/vibeforce-craft-os` angelegt, Branch `vibeforce-craft-os` als `main` gepusht (Force-Push auf Commit `f14fbf1`).
- [x] **E3b.** Vercel-Projekt `vibeforce-craft-os` (`prj_Cc11aeY3yiVjgS94QFyUHJRUjhFx`) per Git mit `Disappointee/vibeforce-craft-os` verbunden (`Root Directory: frontend`, Branch `main`).
- [ ] **E3c.** In `vibeforce-flow-os` (`main`) Craft-spezifische Routen/Actions/Components/Migrations/Hooks entfernen (`api/craft/**`, `actions/craft/**`, `components/craft/**`, `pb_migrations/*craft*`, `pb_hooks/*craft*`). **HANDOVER:** Ausführen in `C:\Users\Robin\AlphaExplorer\01_Coding\vibeforce-flow-os` — siehe `HANDOVER_E3c_FLOW_OS.md`.
- [x] **E3d.** Craft OS: `api/health/route.ts:10` (`service: 'vibeforce-craft-os-frontend'`), `WholesaleManager.tsx:800` (`https://craft-vibeforce.vercel.app`), `tsc` + `build` grün (Commit `f14fbf1`).
