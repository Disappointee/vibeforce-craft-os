# ⚡ VIBEFORCE FLOW OS — SYSTEM-HANDOUT & RELEASE-ÜBERSICHT

```
========================================================================================
  V I B E F O R C E   O N E   |   F L O W   O S   —   A L L - I N - O N E   A G E N C Y   O S
========================================================================================
```

> **Projekt:** Vibeforce Flow OS  
> **Version:** 1.0.0 Production Release  
> **Status:** Betriebsbereit & Getestet (100 % E2E Validierung)  
> **Technologie:** Next.js 16 Standalone · React 19 · PocketBase v0.37+ · Traefik v3 · Docker  

---

## 1. 🌟 System-Kurzbeschreibung

**Vibeforce Flow OS** ist ein maßgeschneidertes, hochperformantes All-in-One Agentur- und Projektmanagement-Betriebssystem. Es vereint agile Aufgabenverwaltung, sekundengenaue Zeiterfassung, Team-Workload-Planung und rechtskonforme Rechnungsstellung in einer nahtlosen, modernen Benutzeroberfläche.

### Kern-Highlights auf einen Blick:
- 📊 **Multi-View Aufgabenverwaltung:** Wechsel in Echtzeit zwischen **Kanban-Board**, interaktiver **Gantt-Timeline**, strukturierter **Listenansicht** und Detailansichten.
- ⏱️ **Echtzeit-Zeiterfassung & Stoppuhr:** Globale Stoppuhr im Header, manuelle Buchungen, automatische Stundensatz-Verrechnung und Budget-Überwachung.
- 👥 **Team- & Workload-Management:** Visuelle Kapazitätsplanung, Urlaubsverwaltung, Überstunden-Tracking und Mitarbeiter-Auslastungsanalyse.
- 📄 **ZUGFeRD 2.2 / Factur-X Rechnungs-Export:** Automatische Erstellung rechtskonformer E-Rechnungen (PDF/A-3 mit eingebettetem XML) nach europäischem EN16931-Standard.
- 🔔 **Live Event Streaming (SSE):** Sofortige Synchronisation aller Änderungen im Team ohne Neuladen der Seite.
- 🔒 **Enterprise RBAC & Impersonation:** Rollenbasierte Berechtigungen (Admin, Projektleiter, Mitarbeiter, Kunde) und integrierter Admin-Support-Modus.

---

## 2. 🚀 Zukünftige Erweiterungs- & Zusatzmodule (Roadmap)

Das modulare Fundament von Vibeforce Flow OS ermöglicht die nahtlose Integration weiterer High-End-Funktionen:

| Modul | Beschreibung | Mehrwert |
| :--- | :--- | :--- |
| **1. DATEV & FIBU-Export** | Automatischer CSV/XML-Export aller Buchungen und Rechnungsdaten für Steuerberater (DATEV-Format). | Keine manuellen Buchhaltungsüberträge mehr. |
| **2. KI-Workforce Engine** | DeepSeek/Gemini-Integration für automatisierte Zeitschätzungen, Ticket-Kategorisierung und Kunden-Statusberichte. | 40 % Zeitersparnis bei Projektplanung & Administration. |
| **3. Mobile App & PWA** | Native Offline-Zeiterfassung für iOS & Android mit GPS-Stempeluhr und Push-Mitteilungen. | Maximale Flexibilität für Außeneinsätze und Unterwegs. |
| **4. Webhook & Automation Hub** | Direkte Schnittstellen zu Zapier, Make, n8n und Slack für automatisierte Kunden-Workflows. | Nahtlose Anbindung an bestehende Toolchains. |
| **5. Mandanten-Kundenportal** | Exklusiver Kundenbereich zur Freigabe von Entwürfen, Ticket-Erstellung und Einsicht in Projektstände. | Höchste Transparenz und professioneller Kundenauftritt. |

---

## 3. 🔑 Zugangsdaten & System-Endpunkte

### Vorschau- & Produktiv-URLs
- **Web-Applikation (Frontend):** `http://localhost:3000` *(bzw. deine Produktionsdomain)*
- **Backend & REST API:** `http://127.0.0.1:8090` *(bzw. `https://pb.deine-domain.de`)*
- **PocketBase Admin-Dashboard:** `http://127.0.0.1:8090/_/`

---

### Bereitgestellte Benutzerkonten

#### 👑 System-Administrator / Superuser
- **E-Mail:** `admin@vibeforce-flow.de`
- **Passwort:** `***REMOVED***`
- **Rolle:** Vollzugriff (Systemeinstellungen, Benutzerverwaltung, Rollen, Datenbank, Audit-Logs)

#### 👥 Demo-Mitarbeiter (Team Accounts)
| Name | E-Mail | Passwort | Rolle |
| :--- | :--- | :--- | :--- |
| **Sarah Meier** | `sarah.meier@agentur.de` | `***REMOVED***` | Mitarbeiter (Employee) |
| **Lukas Wagner** | `lukas.wagner@agentur.de` | `***REMOVED***` | Mitarbeiter (Employee) |
| **Carl Vibeforce** | `carl@vibeforce.de` | `***REMOVED***` | Projektleiter / Employee |
| **Max Mustermann** | `max@kunde.de` | `***REMOVED***` | Mandant / Kunde (Client View) |

---

## 4. 🛠️ Wichtige Befehle

```bash
# 1. System mit Docker starten
docker compose up -d --build

# 2. Status & Healthchecks prüfen
docker compose ps

# 3. Automatisierte End-to-End Tests ausführen
node tools/e2e-smoke-test.mjs
```

---

<br />

```
========================================================================================
Mit besten Grüßen und maximalem Erfolg bei der Nutzung,

Dein Vibeforce Engineering Team
⚡ VIBEFORCE ONE — NEXT LEVEL AGENCY OPERATIONS
========================================================================================
```
