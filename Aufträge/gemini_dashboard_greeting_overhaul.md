# Gemini Design-Auftrag: DashboardGreeting Widget — Visuelles Overhaul

## Ziel
Das `DashboardGreeting`-Widget auf der Dashboard-Startseite benötigt ein professionelles, grafisch ansprechendes Redesign. Die aktuelle Funktionalität (Begrüßung + Aufgaben-Zählung) muss erhalten bleiben.

## Datei
`frontend/src/components/dashboard/DashboardGreeting.tsx`

## Aktueller Stand
- Breite Card mit sanftem Gradient-Hintergrund (`from-indigo-500/10 via-primary/5 to-emerald-500/10`)
- Großer, fetter Text (`text-4xl md:text-5xl font-bold`)
- Ausgabe: `"[Begrüßung], du hast heute [X] offene Aufgaben, [Y] davon akut."`
- Skeleton-Loader während der Datenabfrage

## Vorgaben (STRICT)
1. **Keine Datenbank-Änderungen** — das PocketBase-Schema (`backend/schema.md`) bleibt unangetastet
2. **Props/API der Komponente darf sich nicht ändern** — sie wird ohne Props in `page.tsx` eingebunden: `<DashboardGreeting />`
3. **Framework**: Next.js 16 (App Router), React 19, Tailwind CSS v4, TypeScript
4. **Lucide Icons** sind als Dependency vorhanden
5. **date-fns** ^4.1.0 ist verfügbar
6. **shadcn/ui** Components sind verfügbar (Card, Badge, Skeleton, Button, etc.)
7. **Dark Mode** ist der Standard — alle Farben müssen im Dark-Theme gut aussehen
8. **Deutsche Sprache** — alle Texte auf Deutsch

## Daten (unveränderlich)
Die Komponente holt via PocketBase SDK:
- `pb.authStore.record.name` → Benutzername
- `pb.collection('tasks').getFullList({ filter: ... })` → alle offenen Aufgaben des Nutzers
- `totalOpenTasks` (number) — alle Aufgaben mit `status != 'done'`
- `acuteTasks` (number) — davon mit `priority === 'acute'`

Begrüßungstext via `getHours()`:
- 0–11: "Guten Morgen, [Name]"
- 12–17: "Guten Tag, [Name]"
- 18–23: "Guten Abend, [Name]"

## Design-Freiheit
Du hast freie Hand bei:
- Farbgebung, Gradienten, Hintergründe
- Typografie (Schriftgrößen, Gewichte, Abstände)
- Icons, visuelle Akzente
- Animationen (framer-motion ist verfügbar)
- Layout der Text-Elemente (einzeilig, mehrzeilig, mit Icon-Blöcken, etc.)
- Zusätzliche visuelle Elemente solange sie keine neuen Daten benötigen

## NICHT erlaubt
- Neue Datenbank-Felder oder -Collections
- Zusätzliche API-Calls zu externen Diensten
- Props-Änderungen an der Komponente
- Entfernen der bestehenden Funktionalität (Begrüßung + Zählung + Skeleton-Loading)

## Qualitätskriterien
- Sauberes, modernes Agency-Dashboard-Feeling
- Responsive (Mobile + Desktop)
- Performant (kein Layout-Shift, kein übermäßiges Re-Rendering)
- Barrierefrei (semantisches HTML, ausreichender Kontrast)
- TypeScript: keine `any`-Typen, saubere Typisierung
