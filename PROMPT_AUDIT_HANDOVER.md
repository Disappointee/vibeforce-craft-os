# 📋 HANDOVER & SYSTEM AUDIT SPECIFICATION: VIBEFORCE FLOW OS

> **Zweck dieses Dokuments:**  
> Dieses Dokument dient als vollständiger, lückenloser Übergabe-Prompt für eine neue Agenten-Session oder ein alternatives KI-Modell, um das System Vibeforce Flow OS im aktuellen Zustand zu auditieren, die verbleibende Browser-Authentifizierungslücke (Brave Shields/CORS) zu schließen und das Projekt 100% produktionsreif zu übergeben.

---

## 1. 🎯 Projekt-Übersicht & Kernziel

- **Projekt:** Vibeforce Flow OS (All-in-One Agency Management System)
- **Repository:** `https://github.com/Disappointee/vibeforce-flow-os.git` (Branch: `main`)
- **Lokaler Workspace:** `c:\Users\kasan\Desktop\AlphaExplorer\K.I. Takeover\Neu\Vibeforce One\vibeforce-flow-os`
- **Frontend-Hosting:** Vercel (`https://vibeforce-flow-os.vercel.app`)
- **Backend-Hosting:** Hetzner VPS (`46.225.178.235`, SSH Port `2222`)
- **Dedizierte Backend-URL:** `https://pb-vibeforce.46-225-178-235.sslip.io`

---

## 2. 🏗️ Aktuelle Infrastruktur & Hosting-Topologie

### A. VPS Server (Hetzner Cloud)
- **IP:** `46.225.178.235`
- **SSH-Zugang:** `ssh -p 2222 -i C:\Users\kasan\.ssh\id_ed25519_hetzner root@46.225.178.235`
- **Container `vibeforce-backend`:**
  - Image: `ghcr.io/muchobien/pocketbase:latest`
  - Netzwerk: `klicklaut_web` (Docker Bridge)
  - Port intern: `8080` (via Traefik geroutet)
  - Persistentes Datenverzeichnis: `/opt/vibeforce/pb_data/data.db` *(100% getrennt von `klicklaut-backend`)*
- **Traefik Reverse Proxy:**
  - Dynamische Konfiguration: `/opt/klicklaut/traefik/dynamic/vibeforce.yml`
  - Domain: `pb-vibeforce.46-225-178-235.sslip.io`
  - TLS: Automatisches Let's Encrypt SSL (`websecure`)

### B. Frontend (Next.js 16 Standalone / App Router)
- **Technologie:** Next.js 16.2.4 (Turbopack), React 19, Tailwind CSS, PocketBase SDK v0.27
- **Build-Integrität:** `npm run build` kompiliert fehlerfrei (20/20 statische/dynamische Routen).
- **Backend-Anbindung:**
  - Client-Helper: `frontend/src/lib/pocketbase.ts` (`export const POCKETBASE_URL = 'https://pb-vibeforce.46-225-178-235.sslip.io';`)
  - Server-Helper: `frontend/src/lib/pocketbase-server.ts` (Next.js `cookies()` Session Management)

---

## 3. 🔑 Verifizierte Benutzer- und Admin-Konten

In der Datenbank `/opt/vibeforce/pb_data/data.db` sind folgende Accounts angelegt und aktiv:

| Rolle | E-Mail | Passwort | Verified | Zweck |
| :--- | :--- | :--- | :---: | :--- |
| **👑 Superuser (DB UI)** | `***REMOVED***` | `***REMOVED***` | — | PocketBase Dashboard `/_/` |
| **👑 Robin (Admin)** | `***REMOVED***` | `***REMOVED***` | `true` | App Admin-Vollzugriff |
| **👑 Daniel (Admin)** | `Daniel@vibeforcetest.de` | `***REMOVED***` | `true` | Kunden-Admin Vollzugriff |
| **👥 Demo-User** | `sarah.meier@agentur.de` | `***REMOVED***` | `true` | Mitarbeiter (Employee) |

---

## 4. 🔍 Fehleranalyse: Warum scheitert der Login im Desktop-Browser?

### Was funktioniert:
- Node.js Scripts und Playwright Headless Browser können sich erfolgreich per POST gegen `https://pb-vibeforce.46-225-178-235.sslip.io/api/collections/users/auth-with-password` einloggen (Status 200).

### Was im realen Desktop-Browser (z. B. Brave Browser) fehlschlägt:
- Beim Klick auf „Anmelden“ im Brave-Browser erscheint der Toast: *„Anmeldung fehlgeschlagen. Bitte prüfe deine Daten.“*.
- **Root Cause:**
  1. **Cross-Origin Resource Sharing (CORS) & Browser Shield Blocking:**  
     Die Web-App läuft auf `https://vibeforce-flow-os.vercel.app`. Der Client-Code im Browser versucht direkt einen Cross-Origin-Request auf eine Third-Party-Subdomain (`https://pb-vibeforce.46-225-178-235.sslip.io`) zu senden. Brave Shields und strenge Browser-Sicherheitsrichtlinien blockieren solche Cross-Origin XHR/Fetch-Requests oder markieren dynamische DNS-Dienste (`.sslip.io`) als unzuverlässig.
  2. **Fehlende Same-Origin Next.js API-Route:**  
     Aktuell sendet der Client den Request direkt an PocketBase, statt über eine interne Next.js Server Action / Route Handler (`/api/auth/login`) zu gehen.

---

## 5. 🛠️ Konkrete Handlungsanweisung für das Nachfolge-Modell

Führe folgende Schritte in exakter Reihenfolge durch:

### Schritt 1: Same-Origin Auth Proxy in Next.js einrichten (100% CORS- & Blocker-sicher)
Erstelle eine Next.js Route `frontend/src/app/api/auth/login/route.ts`:
- Nimmt `email` und `password` per POST entgegen.
- Führt den Login serverseitig via `pocketbase-server.ts` gegen `https://pb-vibeforce.46-225-178-235.sslip.io` aus.
- Setzt das Auth-Cookie (`pb_auth`) direkt als HTTP-Response-Header (`Set-Cookie`) mit `SameSite=Lax; Path=/; HttpOnly=false; Secure`.
- Gibt `{ success: true, record, token }` zurück.
- **Ergebnis:** Der Browser sendet Requests nur noch an `https://vibeforce-flow-os.vercel.app/api/auth/login` (Same-Origin). **Kein Browser-Blocker oder CORS kann diesen Request jemals blockieren.**

### Schritt 2: Login-Page auf den Same-Origin Proxy umstellen
In `frontend/src/app/(auth)/login/page.tsx`:
- `handleLogin` ruft `fetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })` auf.
- Bei Erfolg: `window.location.href = '/'`.

### Schritt 3: Traefik CORS-Header auf dem VPS absichern
In `/opt/klicklaut/traefik/dynamic/vibeforce.yml`:
- Stelle sicher, dass `Access-Control-Allow-Origin: *` und `Access-Control-Allow-Credentials: true` für die API deklariert sind.

### Schritt 4: Vollständige E2E-Validierung mit Playwright
Führe `node tools/final_live_verify.mjs` aus und stelle sicher, dass sowohl Robin als auch Daniel erfolgreich authentifiziert und zur Hauptseite weitergeleitet werden.

---

## 6. 📂 Relevante Dateien im Workspace

- [`frontend/src/lib/pocketbase.ts`](file:///c:/Users/kasan/Desktop/AlphaExplorer/K.I.%20Takeover/Neu/Vibeforce%20One/vibeforce-flow-os/frontend/src/lib/pocketbase.ts)
- [`frontend/src/lib/pocketbase-server.ts`](file:///c:/Users/kasan/Desktop/AlphaExplorer/K.I.%20Takeover/Neu/Vibeforce%20One/vibeforce-flow-os/frontend/src/lib/pocketbase-server.ts)
- [`frontend/src/app/(auth)/login/page.tsx`](file:///c:/Users/kasan/Desktop/AlphaExplorer/K.I.%20Takeover/Neu/Vibeforce%20One/vibeforce-flow-os/frontend/src/app/(auth)/login/page.tsx)
- [`frontend/src/middleware.ts`](file:///c:/Users/kasan/Desktop/AlphaExplorer/K.I.%20Takeover/Neu/Vibeforce%20One/vibeforce-flow-os/frontend/src/middleware.ts)
- [`tools/seed_new_backend.mjs`](file:///c:/Users/kasan/Desktop/AlphaExplorer/K.I.%20Takeover/Neu/Vibeforce%20One/vibeforce-flow-os/tools/seed_new_backend.mjs)
- [`tools/final_live_verify.mjs`](file:///c:/Users/kasan/Desktop/AlphaExplorer/K.I.%20Takeover/Neu/Vibeforce%20One/vibeforce-flow-os/tools/final_live_verify.mjs)
