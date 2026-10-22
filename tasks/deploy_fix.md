# Task: Vibeforce Flow OS — Vercel Deployment fixen

> Stand: 2026-06-01 03:09 UTC+2 | Prio: Hoch | Repo: vibeforce-flow-os

## Problem

Alle GitHub-Push-getriggerten Deployments auf `vibeforce-flow-os` schlagen fehl (3s Error, 0ms Build). Ursache: Die alte `vercel.json` mit `rootDirectory: "frontend"` wird von Vercels aktueller API rejected.

Die GitHub-Auto-Deployments scheitern, weil Vercel nicht weiß, dass der Build im `frontend/`-Unterverzeichnis stattfinden soll.

## Aktueller Stand

- **Repo:** `github.com/Disappointee/vibeforce-flow-os` (Branch `main`)
- **Code:** Baut lokal fehlerfrei (`npm run build` + `npx tsc --noEmit` ✅)
- **`vercel.json` (Root):** Hat jetzt KEIN `rootDirectory` mehr, sondern:
  ```json
  {
    "buildCommand": "cd frontend && npm run build",
    "outputDirectory": "frontend/.next",
    "installCommand": "cd frontend && npm install --legacy-peer-deps"
  }
  ```
- Letzter Commit: `2dd5e52` — alle 5 Teile des Plans sind committed und gepusht

## Lösung

1. **Vercel Dashboard öffnen:** https://vercel.com/robins-projects-34c3aad5/vibeforce-flow-os/settings
2. **Root Directory setzen:** Unter **Build & Development Settings** → **Root Directory** auf `frontend` einstellen
3. **Redeploy triggern:** Entweder über Dashboard (Redeploy-Button) oder einen leeren Commit pushen
4. **Custom Domain prüfen:** Sicherstellen, dass `vibeforce-flow-os.vercel.app` auf die neue Deployment-URL gealiased wird
5. **Build-Logs checken:** Deployment sollte diesmal die vollen ~60s brauchen und erfolgreich sein

## Zugangsdaten für Login

- Admin: `***REMOVED***` / `***REDACTED***`
- Demo-User: `demo001@vibeforce.de` bis `demo004@vibeforce.de` / Passwörter in `kunden/vibeforce/access/`

## Verzeichnisse

- Workspace Root: `C:\Users\kasan\Desktop\AlphaExplorer\K.I. Takeover\Neu\Vibeforce One\vibeforce-flow-os`
- Frontend: `frontend/src/app/(dashboard)/docs/page.tsx` (Handbuch)
- Access Docs: `kunden/vibeforce/access/` (5 MD + 5 PDF)
