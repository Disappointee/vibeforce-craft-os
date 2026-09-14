/**
 * Railway First-Run Seed Script
 * 
 * Läuft nur beim allerersten Start (wenn kein Admin existiert).
 * Erstellt Superuser, Demo-User, Projekte, Tasks und Time-Entries.
 * 
 * Aufruf: node seed_first_run.js <baseUrl>
 */

const baseUrl = process.argv[2] || "http://127.0.0.1:8080";
const ADMIN_EMAIL = "***REMOVED***";
const ADMIN_PASSWORD = "***REMOVED***";

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick(...items) {
    return items[Math.floor(Math.random() * items.length)];
}

async function api(method, path, body, token) {
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const url = `${baseUrl}${path}`;
    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(url, opts);
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`${method} ${path} → ${res.status}: ${text.substring(0, 200)}`);
    }
    return await res.json();
}

async function main() {
    console.log("=== Seed First Run ===");
    console.log(`  Base URL: ${baseUrl}`);

    // ── 1. Authenticate as superuser ──
    console.log("\n[1] Authenticating as superuser...");
    const admin = await api("POST", "/api/collections/_superusers/auth-with-password", {
        identity: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
    });
    const adminToken = admin.token;
    console.log(`  Superuser authenticated: ${admin.record?.id || "ok"}`);

    // ── 2. Create demo users ──
    console.log("\n[2] Creating demo users...");
    const userDefs = [
        { email: "sarah.meier@agentur.de", password: "***REMOVED***", name: "Sarah Meier", role: "employee" },
        { email: "lukas.wagner@agentur.de", password: "***REMOVED***", name: "Lukas Wagner", role: "employee" },
        { email: "anna.schneider@agentur.de", password: "***REMOVED***", name: "Anna Schneider", role: "employee" },
        { email: "carl@vibeforce.de", password: "***REMOVED***", name: "Demo User", role: "employee" },
        { email: "max@kunde.de", password: "***REMOVED***", name: "Max Mustermann", role: "client" },
    ];

    const userIds = {};
    for (const u of userDefs) {
        const rec = await api("POST", "/api/collections/users/records", {
            ...u,
            passwordConfirm: u.password,
        }, adminToken);
        userIds[u.email] = rec.id;
        console.log(`  User: ${u.name} (${rec.id})`);
    }

    // ── 3. Create clients (8 — verdoppelt + neu) ──
    console.log("\n[3] Creating demo clients...");
    const clientDefs = [
        { name: "DigitalPulse GmbH", stundenhonorar: 150, status: "active", is_billable_default: true },
        { name: "Musterfirma AG", stundenhonorar: 175, status: "active", is_billable_default: true },
        { name: "Technik Solutions", stundenhonorar: 200, status: "active", is_billable_default: true },
        { name: "Beta Group e.K.", stundenhonorar: 130, status: "active", is_billable_default: true },
        { name: "NovaTech Systems", stundenhonorar: 185, status: "active", is_billable_default: true },
        { name: "GreenShift GmbH", stundenhonorar: 160, status: "active", is_billable_default: true },
        { name: "CloudBase AG", stundenhonorar: 220, status: "active", is_billable_default: true },
        { name: "MediaHaus GmbH", stundenhonorar: 145, status: "active", is_billable_default: true },
    ];

    const clientIds = {};
    for (const c of clientDefs) {
        const rec = await api("POST", "/api/collections/clients/records", c, adminToken);
        clientIds[c.name] = rec.id;
        console.log(`  Client: ${c.name}`);
    }

    // ── 4. Create projects (10 — verdoppelt + neu) ──
    console.log("\n[4] Creating demo projects...");
    const projectDefs = [
        { name: "Webseite Relaunch", key: "WEB", client: clientIds["Musterfirma AG"], status: "active", description: "Kompletter Relaunch der Firmenwebseite mit neuem CMS." },
        { name: "SEO-Optimierung", key: "SEO", client: clientIds["Technik Solutions"], status: "active", description: "Laufende SEO-Maßnahmen und Content-Optimierung." },
        { name: "Social Media Kampagne", key: "SMC", client: clientIds["Musterfirma AG"], status: "active", description: "Quartalsweise Social-Media-Kampagne für Produkteinführung." },
        { name: "Tracking-Integration", key: "TRK", client: clientIds["Beta Group e.K."], status: "active", description: "Implementierung von Tracking-Pixeln und Analytics." },
        { name: "Vibeforce Flow OS Core", key: "VFOS", client: clientIds["DigitalPulse GmbH"], status: "active", description: "Self-Tracking-Projekt für die Weiterentwicklung.", project_type: "development", is_billable: false },
        { name: "Cloud-Migration Phase 2", key: "CLM2", client: clientIds["CloudBase AG"], status: "active", description: "Migration der On-Premise-Infrastruktur zu Cloud-Native." },
        { name: "E-Commerce Plattform", key: "ECOM", client: clientIds["NovaTech Systems"], status: "active", description: "Entwicklung einer skalierbaren E-Commerce-Plattform." },
        { name: "Brand-Kampagne Q3", key: "BRQ3", client: clientIds["MediaHaus GmbH"], status: "active", description: "Medienübergreifende Brand-Awareness-Kampagne." },
        { name: "Nachhaltigkeits-Report", key: "NREP", client: clientIds["GreenShift GmbH"], status: "active", description: "Digitaler ESG-Nachhaltigkeitsbericht inkl. Daten-Dashboard." },
        { name: "Mobile App Redesign", key: "MAR", client: clientIds["Technik Solutions"], status: "active", description: "UX-Redesign der bestehenden Mobile App." },
    ];

    const projectIds = {};
    for (const p of projectDefs) {
        const rec = await api("POST", "/api/collections/projects/records", {
            ...p,
            members: [userIds["sarah.meier@agentur.de"], userIds["lukas.wagner@agentur.de"], userIds["carl@vibeforce.de"]].filter(Boolean),
        }, adminToken);
        projectIds[p.key] = rec.id;
        console.log(`  Project: ${p.name} (${p.key})`);
    }

    // ── 5. Create tasks (70 — verdoppelt + neu) ──
    console.log("\n[5] Creating demo tasks...");
    const today = new Date();

    function d(n) { const d = new Date(today); d.setDate(d.getDate() + n); return d.toISOString(); }

    const taskDefs = [
        // Webseite Relaunch (WEB)
        { project: "WEB", title: "Design-Konzept erstellen", status: "done", priority: "high", assignee: "anna.schneider@agentur.de", estimated_hours: 16 },
        { project: "WEB", title: "Startseite umsetzen", status: "in_progress", priority: "high", assignee: "sarah.meier@agentur.de", estimated_hours: 24 },
        { project: "WEB", title: "Unterseiten-Templates", status: "todo", priority: "medium", assignee: "lukas.wagner@agentur.de", estimated_hours: 12 },
        { project: "WEB", title: "CMS-Integration", status: "todo", priority: "high", assignee: "lukas.wagner@agentur.de", estimated_hours: 20 },
        { project: "WEB", title: "Mobile Optimierung", status: "review", priority: "medium", assignee: "sarah.meier@agentur.de", estimated_hours: 8 },
        { project: "WEB", title: "Responsive Tests", status: "todo", priority: "medium", assignee: "sarah.meier@agentur.de", estimated_hours: 10 },
        { project: "WEB", title: "Barrierefreiheit-Check", status: "todo", priority: "low", assignee: "anna.schneider@agentur.de", estimated_hours: 6 },
        { project: "WEB", title: "Performance-Audit", status: "todo", priority: "high", assignee: "lukas.wagner@agentur.de", estimated_hours: 8 },
        // SEO-Optimierung (SEO)
        { project: "SEO", title: "Keyword-Recherche Q2", status: "done", priority: "high", assignee: "lukas.wagner@agentur.de", estimated_hours: 10 },
        { project: "SEO", title: "On-Page Optimierung", status: "in_progress", priority: "acute", assignee: "lukas.wagner@agentur.de", estimated_hours: 20 },
        { project: "SEO", title: "Backlink-Aufbau", status: "in_progress", priority: "medium", assignee: "carl@vibeforce.de", estimated_hours: 15 },
        { project: "SEO", title: "Monatsreport Mai", status: "todo", priority: "high", assignee: "lukas.wagner@agentur.de", estimated_hours: 4 },
        { project: "SEO", title: "Local SEO Optimierung", status: "todo", priority: "medium", assignee: "lukas.wagner@agentur.de", estimated_hours: 8 },
        { project: "SEO", title: "Google My Business Setup", status: "done", priority: "medium", assignee: "carl@vibeforce.de", estimated_hours: 4 },
        { project: "SEO", title: "Structured Data Integration", status: "in_progress", priority: "high", assignee: "lukas.wagner@agentur.de", estimated_hours: 12 },
        // Social Media Kampagne (SMC)
        { project: "SMC", title: "Kampagnen-Strategie Q3", status: "in_progress", priority: "high", assignee: "sarah.meier@agentur.de", estimated_hours: 12 },
        { project: "SMC", title: "Ad-Creatives erstellen", status: "todo", priority: "medium", assignee: "anna.schneider@agentur.de", estimated_hours: 16 },
        { project: "SMC", title: "Targeting aufsetzen", status: "todo", priority: "medium", assignee: "sarah.meier@agentur.de", estimated_hours: 8 },
        { project: "SMC", title: "Instagram Story Templates", status: "todo", priority: "low", assignee: "anna.schneider@agentur.de", estimated_hours: 6 },
        { project: "SMC", title: "Facebook Ads Budgetplanung", status: "in_progress", priority: "high", assignee: "sarah.meier@agentur.de", estimated_hours: 8 },
        { project: "SMC", title: "LinkedIn Thought-Leadership", status: "todo", priority: "medium", assignee: "sarah.meier@agentur.de", estimated_hours: 10 },
        { project: "SMC", title: "Influencer Outreach", status: "todo", priority: "medium", assignee: "anna.schneider@agentur.de", estimated_hours: 12 },
        // Tracking-Integration (TRK)
        { project: "TRK", title: "Google Analytics Setup", status: "done", priority: "high", assignee: "carl@vibeforce.de", estimated_hours: 6 },
        { project: "TRK", title: "Conversion-Tracking", status: "in_progress", priority: "high", assignee: "carl@vibeforce.de", estimated_hours: 10 },
        { project: "TRK", title: "Dashboard-Einrichtung", status: "todo", priority: "medium", assignee: "carl@vibeforce.de", estimated_hours: 8 },
        { project: "TRK", title: "Hotjar Heatmap Setup", status: "todo", priority: "medium", assignee: "carl@vibeforce.de", estimated_hours: 4 },
        { project: "TRK", title: "UTM-Parameter Standards", status: "done", priority: "medium", assignee: "carl@vibeforce.de", estimated_hours: 3 },
        { project: "TRK", title: "Custom Events Tracking", status: "in_progress", priority: "high", assignee: "carl@vibeforce.de", estimated_hours: 10 },
        { project: "TRK", title: "Monthly Analytics Report", status: "review", priority: "medium", assignee: "carl@vibeforce.de", estimated_hours: 4 },
        // Awork Remastered (AWR)
        { project: "AWR", title: "Darkmode & Theme-System Refactoring", status: "done", priority: "high", assignee: "sarah.meier@agentur.de", estimated_hours: 12 },
        { project: "AWR", title: "Gantt Timeline UI Upgrade", status: "in_progress", priority: "high", assignee: "lukas.wagner@agentur.de", estimated_hours: 20 },
        { project: "AWR", title: "Utilization-Rate-Report", status: "review", priority: "medium", assignee: "carl@vibeforce.de", estimated_hours: 8 },
        { project: "AWR", title: "Task Quick-Options Kontextmenü", status: "in_progress", priority: "high", assignee: "lukas.wagner@agentur.de", estimated_hours: 12 },
        { project: "AWR", title: "PDF Reportexport-Stundenreport", status: "done", priority: "high", assignee: "sarah.meier@agentur.de", estimated_hours: 10 },
        { project: "AWR", title: "Mobile Responsive Optimierung", status: "todo", priority: "medium", assignee: "anna.schneider@agentur.de", estimated_hours: 14 },
        { project: "AWR", title: "Notification System Upgrade", status: "in_progress", priority: "medium", assignee: "carl@vibeforce.de", estimated_hours: 8 },
        { project: "AWR", title: "Datenexport-Modul (CSV/PDF)", status: "todo", priority: "high", assignee: "lukas.wagner@agentur.de", estimated_hours: 16 },
        // Cloud-Migration Phase 2 (CLM2) — NEU
        { project: "CLM2", title: "Container-Orchestrierung", status: "done", priority: "acute", assignee: "lukas.wagner@agentur.de", estimated_hours: 18 },
        { project: "CLM2", title: "Kubernetes Cluster Setup", status: "in_progress", priority: "high", assignee: "lukas.wagner@agentur.de", estimated_hours: 24 },
        { project: "CLM2", title: "CI/CD Pipeline Migration", status: "in_progress", priority: "high", assignee: "carl@vibeforce.de", estimated_hours: 16 },
        { project: "CLM2", title: "Datenbank-Replikation", status: "todo", priority: "acute", assignee: "lukas.wagner@agentur.de", estimated_hours: 14 },
        { project: "CLM2", title: "Load-Balancing konfigurieren", status: "todo", priority: "medium", assignee: "carl@vibeforce.de", estimated_hours: 10 },
        { project: "CLM2", title: "Monitoring & Alerting", status: "review", priority: "medium", assignee: "lukas.wagner@agentur.de", estimated_hours: 8 },
        // E-Commerce Plattform (ECOM) — NEU
        { project: "ECOM", title: "Zahlungs-API integrieren", status: "done", priority: "acute", assignee: "carl@vibeforce.de", estimated_hours: 20 },
        { project: "ECOM", title: "Warenkorb-System", status: "in_progress", priority: "high", assignee: "lukas.wagner@agentur.de", estimated_hours: 18 },
        { project: "ECOM", title: "Bestandsverwaltung", status: "in_progress", priority: "high", assignee: "carl@vibeforce.de", estimated_hours: 14 },
        { project: "ECOM", title: "Kundenkonto & SSO", status: "todo", priority: "medium", assignee: "sarah.meier@agentur.de", estimated_hours: 12 },
        { project: "ECOM", title: "Bestell-Workflow", status: "todo", priority: "high", assignee: "lukas.wagner@agentur.de", estimated_hours: 10 },
        // Brand-Kampagne Q3 (BRQ3) — NEU
        { project: "BRQ3", title: "Zielgruppen-Analyse", status: "done", priority: "high", assignee: "sarah.meier@agentur.de", estimated_hours: 14 },
        { project: "BRQ3", title: "Mediabudget-Planung", status: "in_progress", priority: "high", assignee: "sarah.meier@agentur.de", estimated_hours: 10 },
        { project: "BRQ3", title: "Kreativ-Briefing extern", status: "todo", priority: "medium", assignee: "anna.schneider@agentur.de", estimated_hours: 8 },
        { project: "BRQ3", title: "TV-Spot Produktion", status: "todo", priority: "high", assignee: "anna.schneider@agentur.de", estimated_hours: 20 },
        { project: "BRQ3", title: "OOH-Plakatierung", status: "todo", priority: "medium", assignee: "sarah.meier@agentur.de", estimated_hours: 6 },
        // Nachhaltigkeits-Report (NREP) — NEU
        { project: "NREP", title: "ESG-Kennzahlen erfassen", status: "done", priority: "high", assignee: "sarah.meier@agentur.de", estimated_hours: 12 },
        { project: "NREP", title: "CO2-Fußabdruck berechnen", status: "in_progress", priority: "high", assignee: "carl@vibeforce.de", estimated_hours: 16 },
        { project: "NREP", title: "Dashboard-Entwicklung", status: "in_progress", priority: "high", assignee: "lukas.wagner@agentur.de", estimated_hours: 14 },
        { project: "NREP", title: "Report-Layout und Design", status: "todo", priority: "medium", assignee: "anna.schneider@agentur.de", estimated_hours: 10 },
        // Mobile App Redesign (MAR) — NEU
        { project: "MAR", title: "User Flow Analyse", status: "done", priority: "high", assignee: "anna.schneider@agentur.de", estimated_hours: 12 },
        { project: "MAR", title: "Wireframing & Prototyping", status: "in_progress", priority: "high", assignee: "anna.schneider@agentur.de", estimated_hours: 18 },
        { project: "MAR", title: "Component Library aufbauen", status: "in_progress", priority: "medium", assignee: "lukas.wagner@agentur.de", estimated_hours: 14 },
        { project: "MAR", title: "Animation & Micro-Interactions", status: "todo", priority: "low", assignee: "anna.schneider@agentur.de", estimated_hours: 8 },
    ];

    const taskIds = [];
    for (const t of taskDefs) {
        const rec = await api("POST", "/api/collections/tasks/records", {
            project: projectIds[t.project],
            title: t.title,
            status: t.status,
            priority: t.priority,
            assignees: t.assignee ? [userIds[t.assignee]] : [],
            estimated_hours: t.estimated_hours,
            due_date: d(14),
            start_date: d(-7),
        }, adminToken);
        taskIds.push(rec.id);
        console.log(`  Task: ${t.title.substring(0, 50)}`);
    }

    // ── 5b. Create task links ──
    console.log("\n[5b] Creating task links...");
    let linkCount = 0;
    const linkDefs = [
        ["WEB", 0, 1, "depends_on"], ["WEB", 1, 2, "depends_on"], ["WEB", 2, 3, "depends_on"],
        ["SEO", 0, 1, "depends_on"], ["SEO", 1, 2, "relates_to"],
        ["SMC", 0, 1, "depends_on"], ["SMC", 1, 2, "depends_on"],
        ["TRK", 0, 1, "depends_on"], ["TRK", 1, 2, "depends_on"],
        ["CLM2", 0, 1, "depends_on"], ["CLM2", 1, 2, "depends_on"], ["CLM2", 2, 3, "depends_on"],
        ["ECOM", 0, 1, "depends_on"], ["ECOM", 1, 2, "depends_on"], ["ECOM", 2, 3, "depends_on"],
        ["BRQ3", 0, 1, "depends_on"], ["BRQ3", 1, 2, "depends_on"],
        ["NREP", 0, 1, "depends_on"], ["NREP", 1, 2, "depends_on"],
        ["MAR", 0, 1, "depends_on"], ["MAR", 1, 2, "depends_on"],
    ];
    for (const [projKey, srcIdx, tgtIdx, linkType] of linkDefs) {
        const projTasks = taskDefs.filter(t => t.project === projKey);
        if (projTasks.length > Math.max(srcIdx, tgtIdx)) {
            const srcTaskIdx = taskDefs.indexOf(projTasks[srcIdx]);
            const tgtTaskIdx = taskDefs.indexOf(projTasks[tgtIdx]);
            try {
                await api("POST", "/api/collections/task_links/records", {
                    source_task: taskIds[srcTaskIdx],
                    target_task: taskIds[tgtTaskIdx],
                    link_type: linkType,
                }, adminToken);
                linkCount++;
            } catch {}
        }
    }
    console.log(`  Created ${linkCount} task links`);

    // ── 5c. Create checklist items ──
    console.log("\n[5c] Creating checklist items...");
    let checklistCount = 0;
    const checklistDefs = [
        { offset: 1, items: ["Responsive optimieren", "Ladezeiten reduzieren", "SEO-Meta prüfen"] },
        { offset: 8, items: ["Keyword-Dichte checken", "Alt-Tags ergänzen", "Broken Links fixen"] },
        { offset: 37, items: ["Kubernetes Nodes provisionieren", "Helm Charts erstellen", "Ingress konfigurieren"] },
        { offset: 45, items: ["Design-Review", "Barrierefreiheit-Check", "Dark Mode Test"] },
        { offset: 60, items: ["ESG-Daten validieren", "Diagramme optimieren", "PDF-Export testen"] },
    ];
    for (const cd of checklistDefs) {
        if (taskIds[cd.offset]) {
            for (let i = 0; i < cd.items.length; i++) {
                try {
                    await api("POST", "/api/collections/checklist_items/records", {
                        task: taskIds[cd.offset],
                        title: cd.items[i],
                        completed: i < 1,
                        sort_order: i,
                    }, adminToken);
                    checklistCount++;
                } catch {}
            }
        }
    }
    console.log(`  Created ${checklistCount} checklist items`);

    // ── 5d. Create task comments ──
    console.log("\n[5d] Creating task comments...");
    let commentCount = 0;
    const commentDefs = [
        { offset: 1, content: "<p>Mobile Version sieht super aus!</p>" },
        { offset: 8, content: "<p>Keywords sind recherchiert. Starte jetzt mit On-Page.</p>" },
        { offset: 37, content: "<p>Kubernetes Cluster läuft. Monitoring fehlt noch.</p>" },
        { offset: 45, content: "<p>Wireframes liegen zur Abnahme bereit.</p>" },
    ];
    for (const cm of commentDefs) {
        if (taskIds[cm.offset]) {
            try {
                await api("POST", "/api/collections/task_comments/records", {
                    task: taskIds[cm.offset],
                    author: Object.values(userIds)[0],
                    content: cm.content,
                }, adminToken);
                commentCount++;
            } catch {}
        }
    }
    console.log(`  Created ${commentCount} task comments`);

    // ── 6. Create time entries (160 — verdoppelt + neu) ──
    console.log("\n[6] Creating demo time entries...");
    const usersList = Object.values(userIds).filter(Boolean);
    const taskSample = taskIds;

    for (let i = 0; i < 160; i++) {
        const taskId = taskSample[Math.floor(Math.random() * taskSample.length)];
        const userId = usersList[Math.floor(Math.random() * usersList.length)];
        const dayOffset = -Math.floor(Math.random() * 21);
        const day = new Date(today);
        day.setDate(day.getDate() + dayOffset);
        day.setHours(8 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 60));

        const duration = 15 + Math.floor(Math.random() * 240);
        const endDay = new Date(day);
        endDay.setMinutes(endDay.getMinutes() + duration);

        try {
            await api("POST", "/api/collections/time_entries/records", {
                task: taskId,
                user: userId,
                start_time: day.toISOString(),
                end_time: endDay.toISOString(),
                duration_minutes: duration,
                is_billable: Math.random() > 0.2,
                date: day.toISOString().split("T")[0],
            }, adminToken);
        } catch { /* best-effort */ }
    }
    console.log(`  Created ~160 time entries`);

    // ── 7. Create notifications ──
    console.log("\n[7] Creating notifications...");
    let notifCount = 0;
    const notifTypes = ["task_assigned", "task_due", "task_comment", "task_mention", "status_change", "project_update"];
    for (const uid of usersList) {
        for (let i = 0; i < 3; i++) {
            try {
                await api("POST", "/api/collections/notifications/records", {
                    user: uid,
                    type: pick(...notifTypes),
                    title: "Neue Benachrichtigung",
                    message: `Demo-Nachricht ${i + 1}`,
                    read: Math.random() > 0.5,
                    link: "/tasks",
                }, adminToken);
                notifCount++;
            } catch {}
        }
    }
    console.log(`  Created ${notifCount} notifications`);

    // ── 8. Create external expenses ──
    console.log("\n[8] Creating external expenses...");
    let expenseCount = 0;
    for (const key of Object.keys(projectIds)) {
        const count = randomInt(2, 3);
        for (let i = 0; i < count; i++) {
            try {
                await api("POST", "/api/collections/external_expenses/records", {
                    project: projectIds[key],
                    amount: randomInt(50, 2000),
                    description: pick("Monatliche Hosting-Gebühr", "Software-Lizenz", "Tool-Abonnement", "Drittanbieter-Service", "Server-Kosten"),
                    category: pick("Hosting", "Lizenzen", "Tools", "Drittanbieter", "Werbekosten"),
                }, adminToken);
                expenseCount++;
            } catch {}
        }
    }
    console.log(`  Created ${expenseCount} external expenses`);

    console.log("\n=== Seed complete! ===");
    console.log(`  Admin: ${ADMIN_EMAIL}`);
    console.log(`  Demo users password: ***REMOVED***`);
}

main().catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
});
