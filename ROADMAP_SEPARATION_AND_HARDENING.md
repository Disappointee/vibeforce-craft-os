# Master-Roadmap: Vibeforce Flow OS & Craft OS — Bereinigung, Hardening & Trennung

> **Status:** Teil 1 (`[x]`) abgeschlossen am 2026-11-26 (strikt read-only Audit, Graphify, Vercel/Infra-Inventar, Sequential-Thinking-Plan). Teil 2 & Meilenstein 2 (`[ ]`) bereit zur Umsetzung.
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

## Teil 2 — Vercel-URL-Bereinigung (`vibeforce-craft-os.vercel.app` ohne `-five`), Portfolio & Docker (`[ ]`)

> **Wichtig:** Exakte Reihenfolge einhalten (Zero-Downtime-Invariante). Vor Schritt 2B **müssen** Env-Vars und ein frisches `frontend/`-Deployment auf Craft OS stehen.

### Phase A — Pre-Flight auf `vibeforce-craft-os` (`prj_Cc11aeY3yiVjgS94QFyUHJRUjhFx`)
- [ ] **A1.** Fehlende Env-Vars in `vibeforce-craft-os` (`production` & `preview`) setzen (Werte analog `vibeforce-flow-os` `prj_XjDOTJDHjChlCn255y2EO4MGCi7G`):
  - `POCKETBASE_URL`, `POCKETBASE_ADMIN_EMAIL`, `POCKETBASE_ADMIN_PASSWORD`, `DEMO_GUEST_A_EMAIL`, `DEMO_GUEST_A_PASSWORD`, `DEMO_GUEST_B_EMAIL`, `DEMO_GUEST_B_PASSWORD` (dabei `NEXT_PUBLIC_APP_MODE=craft` & `NEXT_PUBLIC_POCKETBASE_URL` behalten).
- [ ] **A2.** Doppeltes `C:\Users\Robin\AlphaExplorer\01_Coding\vibeforce-craft-os\.vercel\` entfernen (nur `frontend\.vercel\` behalten); im Vercel-Projekt `vibeforce-craft-os` Root Directory = `frontend` und Framework = `Next.js` setzen.
- [ ] **A3.** In `vibeforce-craft-os/frontend/src/app/layout.tsx:16,20` `https://vibeforce-craft-os-five.vercel.app` -> `https://vibeforce-craft-os.vercel.app` ändern.
- [ ] **A4.** Frisches Production-Deployment aus `vibeforce-craft-os/frontend/` ausrollen: `npx vercel --prod` -> `<NEW_CRAFT_DPL_URL>` / `<NEW_CRAFT_DPL_ID>` notieren und `/api/health`, `/login`, `/craft/time`, `/api/auth/demo?slot=slot_a` auf `200`/`302` ohne `getAdminPB()`-500 prüfen.

### Phase B — Zero-Downtime Alias-Umzug
- [ ] **B1.** Sicherheits-Alias `-five` auf neues Deployment zeigen lassen: `npx vercel alias set <NEW_CRAFT_DPL_URL> vibeforce-craft-os-five.vercel.app`.
- [ ] **B2.** Fehlgebundene Domains von `vibeforce-flow-os` (`prj_XjDOTJDHjChlCn255y2EO4MGCi7G`) lösen (**NICHT** `vibeforce-flow-os.vercel.app` antasten):
  - `npx vercel alias rm vibeforce-craft-os.vercel.app` & `npx vercel alias rm craft-vibeforce.vercel.app` (falls Project-Domains im Dashboard/API gebunden sind: `DELETE /v9/projects/prj_XjDOTJDHjChlCn255y2EO4MGCi7G/domains/<domain>?teamId=team_MtfMNBzxg0YY0BQDG0WBnnTU`).
- [ ] **B3.** Sofort an `vibeforce-craft-os` hängen:
  - `npx vercel alias set <NEW_CRAFT_DPL_URL> vibeforce-craft-os.vercel.app`
  - `npx vercel alias set <NEW_CRAFT_DPL_URL> craft-vibeforce.vercel.app`
- [ ] **B4.** Live-Gate: `vibeforce-craft-os.vercel.app/craft/time` -> `200` (Title `Vibeforce Craft OS`), `craft-vibeforce.vercel.app/craft/time` -> `200`, `vibeforce-flow-os.vercel.app/login` -> `200` (Title `Vibeforce Flow OS`).

### Phase C — Portfolio, `docker-compose.prod.yml` & Deployment-Cleanup
- [ ] **C1.** `robin-portfolio/demo/index.html:399,547` (und `HANDOVER_CLAUDE_RL_SHOWCASE.md:63`) auf `https://vibeforce-craft-os.vercel.app` aktualisieren; aus `robin-portfolio/` `npx vercel --prod` deployen und `https://rl-showcase.vercel.app/demo/` verifizieren. Danach optional `-five` entfernen (`npx vercel alias rm vibeforce-craft-os-five.vercel.app`).
- [ ] **C2.** `backend/pb_hooks/lib/cors_helpers.js:18` fixen (`process.env` stürzt in PocketBase Goja mit `ReferenceError` ab -> `typeof process !== 'undefined' && process.env && process.env.CORS_ORIGIN`).
- [ ] **C3.** `docker-compose.prod.yml:66,68` & `.env.production.example:26-27` in beiden Repos um `https://vibeforce-craft-os.vercel.app`, `https://craft-vibeforce.vercel.app`, `https://rl-showcase.vercel.app` ergänzen. (**Warnung:** `1781300000` `demo_sessions` Admin-Only erst aktivieren, wenn `robin-portfolio/demo/index.html:555-648` über Server-Proxy läuft!)
- [ ] **C4.** Sicheres Vercel-Cleanup (zuvor `npx vercel alias ls` gegenprüfen; **niemals** `dpl_8ZgrWLH4s3pugb2NaMw69SygzwEH`, `<NEW_CRAFT_DPL_ID>` oder `dpl_B38D9XPMMmh4sq5naWKQi1eXR9sp` löschen):
  - Verwaistes Flow-Alias: `npx vercel alias rm vibeforce-flow-os-lehnebachrobin-7794-robins-projects-34c3aad5.vercel.app`
  - Craft Alt-/Root-Deploys: `dpl_6ELnCEzumG5AjoKtwGnBM9czf39e`, `dpl_F4cUw9H4QVtJMiGPwBJJssLszL69`, `dpl_9zEktGaYSeYmyEdFspNvHVp6w4QW`, `dpl_4CwVFfUQgtNvDQUCZ2yF4nbHMj8C` (und `dpl_9RxTwhdcwHxcAAgwUCQqe1yVgTGk` erst nach erfolgreichem Umzug auf `<NEW_CRAFT_DPL_ID>`) mit `--safe --confirm-name`.
  - Flow Alt-/Error-/Preview-Deploys: `dpl_AduWRLereYstGQCRZ3UxVdFvphn6`, `dpl_8BpPZknQJ28aUUv64njLqrkWk6s9`, `dpl_4hDwVacuZpZdmGawdbRLjR4EFY8u`, `dpl_GzNtBQpwkohqGKdxMLbhSpKC66fR`, `dpl_He23Wdu54r9BNhzacdAC93hX4VaA` sowie die 27 `BLOCKED` Deploys (`npx vercel ls vibeforce-flow-os --status BLOCKED`).
  - Ignored Build Step auf `vibeforce-flow-os` setzen: `[ "$VERCEL_GIT_COMMIT_REF" = "main" ]`.

---

## Teil 3 (Meilenstein 2) — Security-Hardening, `pb-flow`/`pb-craft` & Repo-Trennung (`[ ]`)

### Phase D — P0/P1 Security- & Hook-Hardening (vor DB-Split!)
- [ ] **D1. Auth/Session-Bypass schließen (Flow & Craft):**
  - `frontend/src/lib/pocketbase-server.ts:179-209`: Fallback auf ungeprüftes `userRecord` bei fehlgeschlagenem `authRefresh()` entfernen (fail-closed -> `null`); `getAuthenticatedOrAdminPB()` (`:262-272`) und `guest_slot_a`-Admin-Fallback (`:89-110`) entfernen.
  - `frontend/src/middleware.ts:32,45-67`: Cookie-Signatur/Session validieren statt `JSON.parse(authCookie.value)` blind zu vertrauen; `loginRateLimiter` auf `/api/auth/login` anwenden; `meister` konsistent behandeln.
  - `frontend/src/app/api/auth/demo/route.ts:6-24,132-143`: Klartext-Passwörter entfernen, `redirect`-Parameter strikt auf relative Pfade whitelisten (XSS/Open-Redirect fixen), Demo-Gäste von realen Admin-Operationen (`admin-users.ts`, `impersonate/route.ts`, `entitlements/route.ts`) serverseitig trennen.
- [ ] **D2. SSR-Leaks & Server-Action-BOLA schließen (Flow & Craft):**
  - `verifyUserSession()` / `requireAuth()` in allen betroffenen Server-Pages (`craft/page.tsx:7-68`, `tasks/page.tsx:8-25`, `projects/page.tsx:7-17`, `projects/[id]/page.tsx:20-85`, `clients/[id]/page.tsx:19-100`, Craft `craft/defects/page.tsx:7-30`, `craft/time/page.tsx:7-31`) und `actions/craft/projects.ts:71-85` (`getBaustellenAction`) erzwingen; User-scoped PB statt `getAdminPB()` verwenden bzw. explizite Ownership-/Rollen-Checks in allen 19 Actions ergänzen.
  - `actions/profile.ts:57-67`: `updateNotificationSettingsAction` auf erlaubte Notification-Keys whitelisten (Mass-Assignment-Fix).
  - `actions/tasks.ts:21,73` & `actions/clients.ts:39,49,63`: `.passthrough()` entfernen.
- [ ] **D3. API-Routen, Filter-Injection & PDF-SSRF (Flow & Craft):**
  - `api/craft/ids/hook/route.ts:55-85,164-174`: Tokenlose Requests ablehnen (kein `else`-Skip), Fallback-Secret entfernen, CORS-Wildcard `*` einschränken.
  - `lib/server-entitlements.ts:41,120` & `actions/craft/cost-calculation.ts:42`: `pb.filter()` mit Parametern verwenden.
  - `api/craft/geocoding/route.ts:4-16` & `api/craft/tiles/[z]/[x]/[y]/route.ts:32-103`: `verifyUserSession()` erzwingen.
  - `api/reports/stundenreport-export/route.ts:17` & `lib/stundenreport.ts:112-113`: `pdfService` mit `try/finally` + `reportsRateLimiter` nutzen, `meta.logoUrl` via `ssrf-guard.ts` prüfen, `craft-pdf-templates.ts:46` HTML-escapen.
- [ ] **D4. PocketBase-Hooks & DB-Rules fixen:**
  - `notification_email.js:146-161`, `contact_admin.pb.js:175-181`, `settings_api.pb.js:151-152,191,213-219`: `.then()` auf sync `mailClient.send()` durch `try/catch` ersetzen & PB `0.37.5` `meta`-API nutzen.
  - `cycle_management.pb.js:39-123`: Rekursions-Guard & `cycle_rollover`-Typangleich.
  - `time_entries_overlap.pb.js:21,58,82`: Laufende Timer (`end_time = ""`) einbeziehen und `e.next()` innerhalb der Transaktion prüfen.
  - `rbac_protection.pb.js:70-89` & `1781300000_harden_collection_rules.js`: `hourly_rate` schützen, `site_reports` bei `signed`/`invoiced` auf DB-Ebene sperren (GoBD), `users` `authRule` gegen `deactivated`, `notifications`/`audit_logs` `createRule` härten, `meister`-Konflikt lösen.
- [ ] **D5. Craft-Integrationen & Compliance nachziehen (`vibeforce-craft-os`):**
  - **VOB:** `PlanPinningManager` / `NewDefectDialog` / `DefectsPageClient` von `localStorage` auf PB `defect_pins` umstellen; `DailySiteReportForm.tsx:159-263` erst nach Measurements/Evidence signieren; `images.unsplash.com` entfernen.
  - **ZUGFeRD / DATEV:** Dummy-Werte (`DE888888888`, `Musterstraße 42`, `RE-2026-0042`) entfernen, `project.client` expandieren, `tax_rate_type` & Doppelrechnungs-Sperre & `assertCraftFeatureEntitlement` einbauen, DATEV aus `invoices_zugferd` (CP1252) speisen.
  - **Geofence / IDS:** `MonteurTimeClock.tsx` (`localStorage`, `< 2000 m`, `verified: true` bei Fehler) & `geofencing.ts:141-146` (`pos.speed === null`) korrigieren; `WholesaleManager.tsx:800,808` auf echte Craft-URL & `generateIdsPunchoutUrl()` umstellen.
  - **Portfolio-Proxy & DSGVO:** `/api/demo/slot` Server-Proxy einführen, `robin-portfolio/demo/index.html:555-648` darauf umstellen; `ClientList.tsx:190` `🔨`-Emoji entfernen; `datenschutz/page.tsx` um GPS/BetrVG/kommerziellen Betrieb aktualisieren.

### Phase E — Trennung `pb-flow` / `pb-craft` & zwei GitHub-Repos
- [ ] **E1.** `docker-compose.prod.yml` + Traefik in zwei PocketBase-Services aufteilen: `pb-flow` (`pb-flow-data`) und `pb-craft` (`pb-craft-data`), jeweils mit eigenen `ALLOWED_ORIGINS`, eigenen `PB_ADMIN_*` und rotierten `DEMO_GUEST_*` Secrets.
- [ ] **E2.** Aktuelle `pb_data` snapshotten -> in beide Volumes einspielen -> Craft-Altlasten aus `pb-flow` und Agency-Altlasten aus `pb-craft` bereinigen -> `POCKETBASE_URL` / `NEXT_PUBLIC_POCKETBASE_URL` in Vercel umstellen -> Hardcoded-Fallbacks (`pocketbase.ts:12`, `pocketbase-server.ts:25`) & `data-isolation.ts`-Heuristiken entfernen -> gehärtete PB-Rules aktivieren.
- [ ] **E3.** Neues GitHub-Repo `Disappointee/vibeforce-craft-os` anlegen, Branch `vibeforce-craft-os` als `main` pushen, `origin` in `vibeforce-craft-os` umhängen, Vercel-Projekt `vibeforce-craft-os` per Git (`Root Directory: frontend`) verknüpfen und in `vibeforce-flow-os` (`main`) die Craft-spezifischen Routen/Actions/Components/Migrations abbauen (`api/health/route.ts:10` & `WholesaleManager.tsx:800` in Craft anpassen).
