/**
 * Comprehensive Session Reports & Time Entries Populator
 * Creates time entries for ALL development sessions since project start,
 * uploads detailed session reports for the Awork Remaster project.
 *
 * Run: node backend/populate_session_reports.js
 * Hourly rate: 20 €/h
 */

const fs = require('fs');
const path = require('path');

const email = "***REMOVED***";
const password = "***REMOVED***";
const baseUrl = "https://aworkremaster-production.up.railway.app";
const HOURLY_RATE = 20;

function daysAgo(n) { const d = new Date(); d.setDate(d.getDate() - n); return d; }
function toISO(d) { return d.toISOString(); }

async function login() {
    const res = await fetch(`${baseUrl}/api/collections/users/auth-with-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identity: email, password }),
    });
    if (!res.ok) throw new Error(`Login failed: ${res.status}`);
    const data = await res.json();
    return { Authorization: data.token };
}

async function apiPost(headers, collection, body) {
    const res = await fetch(`${baseUrl}/api/collections/${collection}/records`, {
        method: "POST", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify(body)
    });
    if (!res.ok) {
        const text = await res.text();
        console.error(`  FAILED [${res.status}] POST ${collection}: ${text.substring(0, 200)}`);
        return null;
    }
    return await res.json();
}

async function uploadReport(authToken, timeEntryId, title, filePath) {
    if (!fs.existsSync(filePath)) {
        console.error(`  File not found: ${filePath}`);
        return null;
    }
    const fileContent = fs.readFileSync(filePath);
    const filename = path.basename(filePath);
    const blob = new Blob([fileContent], { type: 'text/markdown' });

    const form = new FormData();
    form.append('time_entry', timeEntryId);
    form.append('file', blob, filename);
    form.append('title', title);
    form.append('size', String(fileContent.length));

    const res = await fetch(`${baseUrl}/api/collections/time_entry_reports/records`, {
        method: "POST",
        headers: { Authorization: authToken },
        body: form,
    });
    if (!res.ok) {
        const text = await res.text();
        console.error(`  FAILED [${res.status}] upload: ${text.substring(0, 200)}`);
        return null;
    }
    return await res.json();
}

const SESSIONS = [
    {
        title: "Session #1 — Onboarding & Projektanalyse", description: "Projektstruktur analysiert, Awork-Features recherchiert, Roadmap-Erstellung, Pflichtenheft-Analyse\n\nVersion: v0.1.0\nModel: Gemini Pro",
        daysAgo: 15, hours: 1.0
    },
    {
        title: "Session #2 — Audit & Gantt Research", description: "Datenbank-Audit, Gantt-Chart-Implementierungsrecherche, Architektur-Planung\n\nVersion: v0.2.0–v0.3.0\nModel: Gemini Pro",
        daysAgo: 14, hours: 1.5
    },
    {
        title: "Session #3 — Foundation & Core Task Engine", description: "Next.js Auth-Setup, Sidebar-Navigation, Dark Mode, Task CRUD, Datenbank-Schema (tasks, projects, time_entries), List View\n\nVersion: v0.3.0\nModel: Gemini Pro",
        daysAgo: 13, hours: 3.0
    },
    {
        title: "Session #4 — Visual Workflows & Time Tracking", description: "Kanban-Board (Drag & Drop, 4 Status-Spalten), TipTap Rich-Text-Editor, Timer-Bar (global, localStorage), Workload-Berechnungen\n\nVersion: v0.4.0\nModel: Gemini Pro / Claude",
        daysAgo: 12, hours: 2.0
    },
    {
        title: "Session #5 — Test Data & Datumslogik", description: "Testdaten-Befüllung für Gantt-Diagramm, Datumslogik für Tasks, Daten-Cleanup\n\nVersion: v0.4.0\nModel: Gemini Pro",
        daysAgo: 12, hours: 1.25
    },
    {
        title: "Session #6 — Testing & Bug-Fixes", description: "FULL_TEST_PROTOCOL durchgeführt. Assignee Mapping (Tasks/Kanban), Date Fields in Sheet, PB Date Formatting, Team Invite Toast, projectKey Passing in Planner\n\nVersion: v0.5.0\nModel: Gemini Flash",
        daysAgo: 11, hours: 3.25
    },
    {
        title: "Session #7 — Audit-Fixes #1-#7 & Gantt (DeepSeek)", description: "Sämtliche kritische Bugs aus Gemini-Audit behoben: Assignee-Anzeigefehler, Duplizierte Projekte, Filter-Logik, Workload, GanttView.tsx (requestAnimationFrame, bar-progress, status CSS), Unique-Index-Migration\n\nDateien: GanttView.tsx, useGanttData.ts, +7 Fixes",
        daysAgo: 11, hours: 1.25
    },
    {
        title: "Session #8 — Tracking-Korrekturen & Workflow", description: "Time-Tracking-Dateien (time_tracking.md, time_tracking_deepseek.md, overview.md) erstellt. Reasoner/Chat-Split, Gemini-Anweisungen, Workflow finalisiert",
        daysAgo: 11, hours: 2.75
    },
    {
        title: "Session #9 — Phase F+G: Nutzerprofile & E-Mail", description: "Profil-Seite /profile, Nutzerverwaltung /admin/users, Rollen-System (admin, manager, employee, client), expertise-Feld, Stundenübersicht. PB-Hook notifications_email.pb.js, email_sent-Feld\n\nVersion: v0.6.0",
        daysAgo: 8, hours: 0.33
    },
    {
        title: "Session #10 — Dokumentation & CHANGELOG", description: "Projekt-CHANGELOG.md (v0.1.0-v0.6.0), docs/README.md, Roadmap aktualisiert\n\nDateien: CHANGELOG.md, docs/README.md",
        daysAgo: 7, hours: 0.23
    },
    {
        title: "Session #11 — Phase 0 Bug-Fixing", description: "GanttView.tsx verifiziert. Phase 0: Unique-Index, Workload, Suche, Filter, Projekt bearbeiten, Mobile-Sidebar, Subtasks. sidebar.tsx erstellt. Dead-Import entfernt. Build: 14 Routes, 0 Errors",
        daysAgo: 7, hours: 0.12
    },
    {
        title: "Session #12 — Phase 7+8 Teil 1: Timer & Command Center", description: "TimerBar Backdating (CalendarClock-Icon), MonthView Day Detail Panel, Time-Page Client/Projekt-Filter. Command Center: Navigation+Aktionen-Gruppen\n\nVersion: v0.7.0\nDateien: TimerBar.tsx, time/page.tsx, layout.tsx",
        daysAgo: 7, hours: 0.75
    },
    {
        title: "Session #13 — Phase 8 Teil 2: Budget & External Expenses", description: "Backend: budget_fixed, budget_type (fixed/hourly/retainer), external_costs_total. external_expenses-Collection. Frontend: Financial Header 5-Spalten-Grid (Budget%, Revenue, External Costs, Profit, Margin)\n\nDateien: pb_migrations, projects/[id]/page.tsx",
        daysAgo: 7, hours: 0.75
    },
    {
        title: "Session #14 — Phase 8 Teil 3: Cycle, PDF, Billing Dashboard", description: "Cycle Management (PB-Hook, Frontend Toggle). PDF-Generator (ServiceRecord, Invoice, Timesheet). Abrechnungs-Dashboard (Summary Cards, Billing-Ready-Liste)\n\nDateien: pdf-generator.ts (+165), reports/page.tsx",
        daysAgo: 7, hours: 0.75
    },
    {
        title: "Session #15 — Git Commit & Tavily Test", description: "Commit: 25 files, 3010+ insertions. Push zu GitHub. Dokumentations-Audit. Tavily API-Key getestet",
        daysAgo: 7, hours: 0.5
    },
    {
        title: "Session #16 — Demo-Daten-Population", description: "populate_demo_data.js (620 Zeilen): 12 Collections befüllt (4 User, 5+ Clients, 8+ Projekte, 90+ Aufgaben, 98+ Zeiteinträge, Checklisten, Kommentare, Notifications)",
        daysAgo: 5, hours: 0.83
    },
    {
        title: "Session #17 — Security Audit & Performance", description: "35x SQL-Injection-Fix (pb.filter, 13 Dateien). 2x XSS-Fix. Dashboard N+1->2 Batch, TaskDetailsSheet 8->1 parallel. puppeteer -24MB. Error Boundaries. Stundensatz->Env\n\nVersion: v0.7.2\nDateien: 13+ Dateien",
        daysAgo: 3, hours: 1.0
    },
    {
        title: "Session #18 — Env, Build & Phase 8 Completion", description: "Credentials (.env), Vercel-Build-Fix. ProjectList.tsx Progress-Bar (echte Time-Entries, Farbwechsel). ExternalExpensesDialog.tsx (CRUD). K-Shortcut-Hint\n\nVersion: v0.7.3",
        daysAgo: 1, hours: 0.75
    },
    {
        title: "Session #19 — Billability & Kupona-Timesheet", description: "DB-Migration: time_entries um is_billed + billing_reference. generateTimesheetHtml() (+165 lines). TypeScript-Typen\n\nDateien: pb_migrations, pdf-generator.ts",
        daysAgo: 0, hours: 0.5
    },
    {
        title: "Session #20 — Gantt Scroll-Sync", description: "useGanttSync Hook (DOM-Listener + rAF-Throttling). GanttView.tsx (externer scrollRef, 46px Zeilenhöhe). planner/page.tsx\n\nDateien: useGanttSync.ts (+85), GanttView.tsx",
        daysAgo: 0, hours: 0.5
    },
    {
        title: "Session #21 — DE-Localization & String-Registry", description: "60+ String-Fixes in 16 Dateien. String-Registry (+230 lines, 15 Kategorien, ~150 Strings). Rollen-Mapping (ROLE_LABELS, manager)\n\nDateien: 16+ Dateien, string-registry.md",
        daysAgo: 0, hours: 1.0
    },
    {
        title: "Session #22 — Billing-Pipeline & Report-System", description: "TDZ-Bug-Fix. Gemini-Bridge (eval_002). time_entry_reports-Collection. GenerateReportButton. report-generator.ts. 5 Session-Reports. Seed-Skript\n\nDateien: reports/page.tsx, report-generator.ts, GenerateReportButton.tsx, pb_migrations",
        daysAgo: 0, hours: 1.5
    },
];

async function main() {
    console.log("=== Session Reports & Time Entries Populator ===\n");
    console.log(`Stundensatz: ${HOURLY_RATE} EUR/h\n`);

    const jsonHeaders = await login();
    const authToken = jsonHeaders.Authorization;
    console.log("OK Login\n");

    let awrClient = null;
    const clientRes = await fetch(`${baseUrl}/api/collections/clients/records?filter=(name='Awork Remaster')`, {
        headers: { ...jsonHeaders, "Content-Type": "application/json" },
    });
    const clientData = await clientRes.json();
    awrClient = clientData.items[0];

    if (!awrClient) {
        console.log("Creating AWR client...");
        awrClient = await apiPost(jsonHeaders, "clients", {
            name: "Awork Remaster",
            company: "Vibeforce One GmbH",
            status: "active",
            stundenhonorar: HOURLY_RATE,
            kundenstatus: "aktiv",
        });
        if (!awrClient) throw new Error("Failed to create client");
    }
    console.log(`Client: ${awrClient.name} (${HOURLY_RATE}EUR/h)\n`);

    let awrProject = null;
    const projRes = await fetch(`${baseUrl}/api/collections/projects/records?filter=(key='AWR')`, {
        headers: { ...jsonHeaders, "Content-Type": "application/json" },
    });
    const projData = await projRes.json();
    awrProject = projData.items[0];

    if (!awrProject) {
        console.log("Creating AWR project...");
        awrProject = await apiPost(jsonHeaders, "projects", {
            name: "Awork Remaster",
            key: "AWR",
            status: "active",
            client: awrClient.id,
            budget_hours: 200,
            description: "Neuentwicklung der Agentur-Management-Software",
        });
        if (!awrProject) throw new Error("Failed to create project");
    }
    console.log(`Project: ${awrProject.name} [${awrProject.key}]\n`);

    let devTask = null;
    const taskFilter = encodeURIComponent(`project='${awrProject.id}'&&title='Softwareentwicklung'`);
    const taskRes = await fetch(`${baseUrl}/api/collections/tasks/records?filter=${taskFilter}`, {
        headers: { ...jsonHeaders, "Content-Type": "application/json" },
    });
    const taskData = await taskRes.json();
    devTask = taskData.items[0];

    if (!devTask) {
        console.log("Creating development task...");
        devTask = await apiPost(jsonHeaders, "tasks", {
            title: "Softwareentwicklung",
            project: awrProject.id,
            status: "in_progress",
            priority: "high",
            estimated_hours: 200,
            description: "Entwicklung der Awork Remaster Plattform",
        });
        if (!devTask) throw new Error("Failed to create task");
    }
    console.log(`Task: ${devTask.title}\n`);

    const userRes = await fetch(`${baseUrl}/api/collections/users/records?perPage=1`, {
        headers: { ...jsonHeaders, "Content-Type": "application/json" },
    });
    const userData = await userRes.json();
    const user = userData.items[0];
    console.log(`User: ${user.email}\n`);
    console.log("--- Creating time entries ---\n");

    const sessionsDir = path.join(__dirname, '..', 'docs', 'session_reports');
    let totalMinutes = 0;
    let createdCount = 0;

    for (const session of SESSIONS) {
        const durationMinutes = Math.round(session.hours * 60);
        totalMinutes += durationMinutes;

        const startDate = daysAgo(session.daysAgo);
        startDate.setHours(9, 0, 0, 0);

        const amount = (session.hours * HOURLY_RATE);
        const entry = await apiPost(jsonHeaders, "time_entries", {
            task: devTask.id,
            user: user.id,
            description: session.description,
            duration_minutes: durationMinutes,
            duration: durationMinutes * 60,
            start_time: toISO(startDate),
            is_billable: true,
            is_billed: false,
        });

        if (!entry) {
            console.error(`  X ${session.title}`);
            continue;
        }
        createdCount++;
        console.log(`  OK ${session.title} (${session.hours.toFixed(1)}h = ${amount.toFixed(2)}EUR)`);

        const reportMapping = {
            "Session #7 — Audit-Fixes #1-#7 & Gantt (DeepSeek)": "00_consolidated_early_phase_v0.1.0-v0.6.0.md",
            "Session #12 — Phase 7+8 Teil 1: Timer & Command Center": "01_v0.7.0_phase7_8_and_demo_data_2026-05-07.md",
            "Session #17 — Security Audit & Performance": "02_v0.7.1_v0.7.2_security_performance_2026-05-09.md",
            "Session #18 — Env, Build & Phase 8 Completion": "03_v0.7.3_env_build_phase8_finish_2026-05-11.md",
            "Session #21 — DE-Localization & String-Registry": "04_restart_point_localization_billing_gantt_2026-05-12.md",
        };

        const reportFile = reportMapping[session.title];
        if (reportFile) {
            const reportPath = path.join(sessionsDir, reportFile);
            const report = await uploadReport(authToken, entry.id, session.title, reportPath);
            if (report) console.log(`    -> Report: ${reportFile}`);
        }
    }

    const totalHours = totalMinutes / 60;
    const totalAmount = totalHours * HOURLY_RATE;
    console.log("\n==============================");
    console.log("SUMMARY");
    console.log("==============================");
    console.log(`Sessions:    ${createdCount}`);
    console.log(`Total:       ${totalHours.toFixed(1)}h`);
    console.log(`Stundensatz: ${HOURLY_RATE}EUR/h`);
    console.log(`Rechnung:    ${totalAmount.toFixed(2)}EUR`);
    console.log(`Project key: ${awrProject.key}`);
    console.log("==============================");
    console.log("\n-> Reports: https://vibeforce-flow-os.vercel.app/reports (Tab Abrechnungs-Dashboard)");
    console.log("DONE.");
}

main().catch(console.error);
