# ⚡ Vibeforce Flow OS

> **Das All-in-One Agency & Work OS:** Intelligente Projektsteuerung, Multi-View Aufgabenverwaltung, präzise Zeiterfassung, Team-Workload-Planung und automatisierte **ZUGFeRD 2.2 / Factur-X** Rechnungsstellung.

[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-61dafb?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![PocketBase](https://img.shields.io/badge/PocketBase-v0.37-b827fc?style=flat&logo=pocketbase)](https://pocketbase.io/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8?style=flat&logo=tailwindcss)](https://tailwindcss.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ed?style=flat&logo=docker)](https://www.docker.com/)

---

## 🌟 Kernfunktionen

- 📊 **Multi-View Aufgabenverwaltung:** Nahtloser Wechsel zwischen Kanban-Board, Gantt-Timeline, tabellarischer Listenansicht und Projekt-Details.
- ⏱️ **Echtzeit-Zeiterfassung & Stoppuhr:** Globale Stoppuhr, manuelle Buchungen, Projektzuweisung und automatische Stundensatz-Kalkulation.
- 👥 **Team & Workload Management:** Visualisierung von Auslastung, Kapazitäten, Urlaubszeiten, Überstunden und Team-Zuweisungen.
- 📄 **ZUGFeRD 2.2 / Factur-X Rechnungs-Export:** Automatische Generierung von rechtskonformen hybriden PDF/A-3-Rechnungen mit eingebettetem XML für Behörden und B2B.
- 🔔 **Echtzeit-Benachrichtigungscenter:** Live-Push-Updates über PocketBase Server-Sent Events (SSE) für Aufgaben, Zuweisungen, Deadlines und Kommentare.
- 🔒 **Enterprise RBAC & Impersonation:** Rollenbasierte Zugriffskontrolle (Admin, Projektleiter, Mitarbeiter, Kunde) und nahtloser Admin-Benutzerwechsel für Support-Zwecke.
- 🌐 **Zweisprachig (DE / EN):** Vollständig lokalisierte Oberfläche mit dynamischem Sprachwechsel.

---

## 🏗️ Technologie-Stack

| Schicht | Technologie | Zweck |
| :--- | :--- | :--- |
| **Frontend** | Next.js 16 (Turbopack) | Server Actions, Standalone Output, RSC |
| **UI & Styling** | React 19, Tailwind CSS v4, Framer Motion | Modernes Design-System mit Dark Mode |
| **State Management** | Zustand v5 | Lokaler und persistierter App-State |
| **Backend / DB** | PocketBase v0.37+ (SQLite WAL) | Auth, Real-Time SSE, JS Hooks, Cascade Deletes |
| **Invoicing** | ZUGFeRD 2.2 / Factur-X & React-PDF | PDF/A-3 Generierung mit validem XML |
| **Orchestrierung** | Docker Compose & Traefik v3 | Multi-Stage Build, SSL/Let's Encrypt |

---

## 🚀 Schnellstart

### 1. Voraussetzungen
- Node.js 20+ und npm
- Git
- Docker & Docker Compose (für Container-Deployment)

### 2. Lokale Entwicklung
```bash
# 1. Repository klonen
git clone <repository-url> vibeforce-flow-os
cd vibeforce-flow-os

# 2. Frontend Abhängigkeiten installieren
cd frontend
npm install

# 3. Lokale Umgebungsvariablen setzen
cp ../.env.example .env.local

# 4. Entwicklungsserver starten
npm run dev
```
Das Frontend ist nun unter `http://localhost:3000` erreichbar.

---

## 🐳 Docker Deployment

### Standard Deployment (Lokal & Testing)
```bash
# Startet PocketBase und Next.js mit einem Befehl
docker compose up -d --build

# Status & Logs anzeigen
docker compose ps
docker compose logs -f
```

### Produktions-Deployment (mit Traefik v3 & automatischem SSL)
```bash
# 1. Produktions-Konfiguration anlegen
cp .env.production.example .env
# Passe DOMAIN, ACME_EMAIL, PB_ADMIN_PASSWORD in .env an!

# 2. Produktions-Stack starten
docker compose -f docker-compose.prod.yml up -d --build
```
Detaillierte Anweisungen zu Backup, Restore und Zero-Downtime-Updates findest du im [DEPLOYMENT.md](DEPLOYMENT.md).

---

## 🧪 Tests & Qualitätssicherung

```bash
# TypeScript Typecheck (0 Fehler)
cd frontend && npx tsc --noEmit

# Next.js Production Build Test
cd frontend && npm run build

# End-to-End Smoke Test Suite (Auth, CRUD, Timer, Billing, ZUGFeRD)
node tools/e2e-smoke-test.mjs
```

---

## 📁 Projektstruktur

```
vibeforce-flow-os/
├── backend/                  # PocketBase Backend
│   ├── pb_hooks/             # Server-Side JavaScript Hooks & Event-Handler
│   ├── pb_migrations/        # Transaktionale Schema-Migrationen
│   ├── Dockerfile            # PocketBase Alpine Dockerfile
│   └── seed_production.js    # Idempotenter Produktions-Seeder
├── frontend/                 # Next.js 16 Web-App
│   ├── src/
│   │   ├── app/              # Next.js App Router (Pages & API Routes)
│   │   ├── components/       # UI Components & Feature Views
│   │   ├── hooks/            # Custom React Hooks (Realtime, Auth, Timer)
│   │   ├── lib/              # Core Libraries (PocketBase, ZUGFeRD, Store, i18n)
│   │   └── types/            # TypeScript Interface- & Type-Definitionen
│   └── Dockerfile            # Multi-Stage Standalone Next.js Dockerfile
├── traefik/                  # Traefik v3 Reverse Proxy Konfiguration
│   ├── dynamic/              # Dynamische TLS/SSL & Router-Regeln
│   └── traefik.yml           # Statische Traefik-Konfiguration
├── tools/                    # Automatisierungs- & E2E-Testskripte
│   └── e2e-smoke-test.mjs    # Vollständige E2E-Validierungssuite
├── docker-compose.yml        # Lokaler Compose-Stack
├── docker-compose.prod.yml   # Produktions-Compose-Stack mit SSL
├── DEPLOYMENT.md             # Ausführliches Betriebshandbuch
└── README.md                 # Diese Projektdokumentation
```

---

## 📄 Lizenz & Urheberrecht

© 2026 Vibeforce One GmbH. Alle Rechte vorbehalten.
Entwickelt für High-End Agentur- und Projekt-Workflows.
