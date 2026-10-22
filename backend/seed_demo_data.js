/**
 * Vibeforce Flow OS — Demo Data Seed Script
 * 
 * Creates demo users, clients, projects, tasks, and time entries via PocketBase REST API.
 * Uses superadmin authentication.
 * 
 * Usage: node seed_demo_data.js [baseUrl]
 *   node seed_demo_data.js http://127.0.0.1:8090
 *   node seed_demo_data.js https://vibeforce-flow-os.up.railway.app
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const baseUrl = process.argv[2] || "http://127.0.0.1:8090";
const ADMIN_EMAIL = "admin@vibeforce-flow.de";
const ADMIN_PASSWORD = process.env.PB_ADMIN_PASSWORD;

const genPassword = () => crypto.randomBytes(10).toString('hex');

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

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick(...items) {
    return items[Math.floor(Math.random() * items.length)];
}

async function main() {
    console.log("=== Vibeforce Flow OS — Demo Seed ===");
    console.log(`  Base URL: ${baseUrl}\n`);

    // ── 1. Authenticate as superuser ──
    console.log("[1] Authenticating as superuser...");
    const admin = await api("POST", "/api/collections/_superusers/auth-with-password", {
        identity: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
    });
    const adminToken = admin.token;
    console.log(`  Superuser authenticated: ${admin.record?.id || "ok"}\n`);

    // ── 2. Create demo users ──
    console.log("[2] Creating demo users...");
    const userDefs = [
        { email: "demo001@vibeforce.de", password: genPassword(), name: "Monika Mustermann", role: "manager" },
        { email: "demo002@vibeforce.de", password: genPassword(), name: "Ben Beispiel", role: "employee" },
        { email: "demo003@vibeforce.de", password: genPassword(), name: "Laura Design", role: "employee" },
        { email: "demo004@vibeforce.de", password: genPassword(), name: "Tom Entwickler", role: "employee" },
        { email: "demo005@vibeforce.de", password: genPassword(), name: "Sandra Seidel", role: "manager" },
        { email: "demo006@vibeforce.de", password: genPassword(), name: "Alex Vogel", role: "employee" },
        { email: "demo007@vibeforce.de", password: genPassword(), name: "Elena Becker", role: "employee" },
        { email: "demo008@vibeforce.de", password: genPassword(), name: "Julian Sommer", role: "employee" },
        { email: "demo009@vibeforce.de", password: genPassword(), name: "Miriam Frank", role: "employee" },
        { email: "demo010@vibeforce.de", password: genPassword(), name: "Sarah Meier", role: "manager" },
    ];
    
    const createdUsers = [];
    const userIds = {};
    for (const u of userDefs) {
        try {
            const rec = await api("POST", "/api/collections/users/records", {
                ...u,
                passwordConfirm: u.password,
            }, adminToken);
            userIds[u.email] = rec.id;
            createdUsers.push({ email: u.email, password: u.password, name: u.name, role: u.role });
            console.log(`  ${u.name} (${u.email}) — Passwort: ${u.password}`);
        } catch (e) {
            console.warn(`  Skipping ${u.email}: ${e.message}`);
        }
    }
    console.log();

    // ── 3. Create clients (12 — verdoppelt) ──
    console.log("[3] Creating demo clients...");
    const clientDefs = [
        { name: "TechNova GmbH", company: "TechNova GmbH", email: "kontakt@technova.de", branch: "IT", stundenhonorar: 150, status: "aktiv", is_billable_default: true },
        { name: "GreenLife AG", company: "GreenLife AG", email: "info@greenlife.de", branch: "Nachhaltigkeit", stundenhonorar: 175, status: "aktiv", is_billable_default: true },
        { name: "Urban Architects", company: "Urban Architects", email: "office@urban-architects.de", branch: "Architektur", stundenhonorar: 200, status: "aktiv", is_billable_default: true },
        { name: "MediaFlow GmbH", company: "MediaFlow GmbH", email: "hallo@mediaflow.de", branch: "Marketing", stundenhonorar: 165, status: "aktiv", is_billable_default: true },
        { name: "SmartData AG", company: "SmartData AG", email: "info@smartdata.de", branch: "Datenanalyse", stundenhonorar: 190, status: "aktiv", is_billable_default: true },
        { name: "BuildCorp GmbH", company: "BuildCorp GmbH", email: "kontakt@buildcorp.de", branch: "Bauwirtschaft", stundenhonorar: 180, status: "aktiv", is_billable_default: true },
        { name: "FinTech Solutions", company: "FinTech Solutions GmbH", email: "info@fintech-solutions.de", branch: "FinTech", stundenhonorar: 210, status: "aktiv", is_billable_default: true },
        { name: "HealthPlus AG", company: "HealthPlus AG", email: "hallo@healthplus.de", branch: "Gesundheit", stundenhonorar: 185, status: "aktiv", is_billable_default: true },
        { name: "EduVision GmbH", company: "EduVision GmbH", email: "kontakt@eduvision.de", branch: "Bildung", stundenhonorar: 160, status: "aktiv", is_billable_default: true },
        { name: "RetailNow GmbH", company: "RetailNow GmbH", email: "info@retailnow.de", branch: "Einzelhandel", stundenhonorar: 170, status: "aktiv", is_billable_default: true },
        { name: "LogiTrans AG", company: "LogiTrans AG", email: "office@logitrans.de", branch: "Logistik", stundenhonorar: 195, status: "aktiv", is_billable_default: true },
        { name: "CreativeLab GmbH", company: "CreativeLab GmbH", email: "hallo@creativelab.de", branch: "Kreativagentur", stundenhonorar: 155, status: "aktiv", is_billable_default: true },
    ];

    const clientIds = {};
    for (const c of clientDefs) {
        try {
            const rec = await api("POST", "/api/collections/clients/records", c, adminToken);
            clientIds[c.name] = rec.id;
            console.log(`  ${c.name} (${c.branch})`);
        } catch (e) {
            console.warn(`  Skipping ${c.name}: ${e.message}`);
        }
    }
    console.log();

    // ── 4. Create projects (12 — verdoppelt) ──
    console.log("[4] Creating demo projects...");
    const allUserIds = Object.values(userIds);
    const projectDefs = [
        { name: "Projekt Alpha", key: "PA", client: clientIds["TechNova GmbH"], status: "active", description: "Full-Service Digitalstrategie mit Schwerpunkt SEO und Content-Marketing.", budget_hours: 120 },
        { name: "Digital Campaign 2026", key: "DC", client: clientIds["GreenLife AG"], status: "active", description: "Ganzjahres-Kampagne für nachhaltige Produkte mit Social-Media-Fokus.", budget_hours: 80 },
        { name: "Website Relaunch", key: "WR", client: clientIds["Urban Architects"], status: "active", description: "Kompletter Relaunch inkl. neuem CMS, Portfolio-Showcase und 3D-Visualisierungen.", budget_hours: 200 },
        { name: "Content Marketing 2026", key: "CM", client: clientIds["MediaFlow GmbH"], status: "active", description: "Content-Marketing-Kampagne mit Blog, Social Media und Newsletter.", budget_hours: 60 },
        { name: "Datenanalyse Dashboard", key: "DD", client: clientIds["SmartData AG"], status: "active", description: "Entwicklung eines interaktiven Datenanalyse-Dashboards.", budget_hours: 150 },
        { name: "Neubau Marketing", key: "NM", client: clientIds["BuildCorp GmbH"], status: "active", description: "Marketingkampagne für Neubau-Projekte.", budget_hours: 90 },
        { name: "Crypto Payment Gateway", key: "CPG", client: clientIds["FinTech Solutions"], status: "active", description: "Integration eines Krypto-Payment-Gateways für E-Commerce.", budget_hours: 180 },
        { name: "Patientenportal App", key: "PPA", client: clientIds["HealthPlus AG"], status: "active", description: "Entwicklung einer Patientenportal-App mit Terminbuchung.", budget_hours: 140 },
        { name: "E-Learning Plattform", key: "ELP", client: clientIds["EduVision GmbH"], status: "active", description: "Aufbau einer E-Learning-Plattform mit Kursverwaltung.", budget_hours: 160 },
        { name: "Retail Analytics Suite", key: "RAS", client: clientIds["RetailNow GmbH"], status: "active", description: "Analytics-Tool für Bestands- und Verkaufsoptimierung.", budget_hours: 110 },
        { name: "Fleet Tracking System", key: "FTS", client: clientIds["LogiTrans AG"], status: "active", description: "Echtzeit-Flotten-Tracking und Routenoptimierung.", budget_hours: 170 },
        { name: "Brand Identity 2026", key: "BIG", client: clientIds["CreativeLab GmbH"], status: "active", description: "Kompletter Brand-Relaunch für Premium-Marke.", budget_hours: 100 },
    ];

    const projectIds = {};
    for (const p of projectDefs) {
        try {
            const rec = await api("POST", "/api/collections/projects/records", {
                ...p,
                members: allUserIds.length > 0 ? allUserIds : undefined,
            }, adminToken);
            projectIds[p.key] = rec.id;
            console.log(`  ${p.name} (${p.key}) — Budget: ${p.budget_hours}h`);
        } catch (e) {
            console.warn(`  Skipping ${p.name}: ${e.message}`);
        }
    }
    console.log();

    // ── 5. Create tasks (60 — verdoppelt) ──
    console.log("[5] Creating demo tasks...");
    const today = new Date();
    function d(n) { const d = new Date(today); d.setDate(d.getDate() + n); return d.toISOString(); }

    const tasks = [
        // Projekt Alpha (PA)
        { project: "PA", title: "SEO Keyword Analyse", status: "done", priority: "high", estimated_hours: 8 },
        { project: "PA", title: "Content-Strategie entwickeln", status: "in_progress", priority: "high", estimated_hours: 16 },
        { project: "PA", title: "Landingpage-Optimierung", status: "in_progress", priority: "medium", estimated_hours: 12 },
        { project: "PA", title: "Monatsreport erstellen", status: "todo", priority: "high", estimated_hours: 4 },
        { project: "PA", title: "Wettbewerbsanalyse Q3", status: "review", priority: "medium", estimated_hours: 10 },
        // Digital Campaign (DC)
        { project: "DC", title: "Kampagnen-Konzept Q3", status: "done", priority: "high", estimated_hours: 12 },
        { project: "DC", title: "Ad-Creatives designen", status: "in_progress", priority: "high", estimated_hours: 20 },
        { project: "DC", title: "Social Media Content Plan", status: "todo", priority: "medium", estimated_hours: 8 },
        { project: "DC", title: "A/B-Testing Setup", status: "todo", priority: "medium", estimated_hours: 6 },
        { project: "DC", title: "Performance Report Mai", status: "review", priority: "high", estimated_hours: 4 },
        // Website Relaunch (WR)
        { project: "WR", title: "UI/UX Design Mockups", status: "done", priority: "acute", estimated_hours: 24 },
        { project: "WR", title: "Frontend Entwicklung", status: "in_progress", priority: "acute", estimated_hours: 40 },
        { project: "WR", title: "CMS-Integration", status: "in_progress", priority: "high", estimated_hours: 20 },
        { project: "WR", title: "QA Testing", status: "todo", priority: "high", estimated_hours: 16 },
        { project: "WR", title: "Performance-Optimierung", status: "todo", priority: "medium", estimated_hours: 12 },
        // Content Marketing (CM)
        { project: "CM", title: "Blog-Redaktionsplan Q3", status: "done", priority: "high", estimated_hours: 8 },
        { project: "CM", title: "Social Media Content erstellen", status: "in_progress", priority: "medium", estimated_hours: 12 },
        { project: "CM", title: "Newsletter-Kampagne aufsetzen", status: "todo", priority: "high", estimated_hours: 6 },
        { project: "CM", title: "SEO-optimierte Landingpages", status: "todo", priority: "medium", estimated_hours: 10 },
        { project: "CM", title: "Performance-Analyse Juni", status: "review", priority: "medium", estimated_hours: 4 },
        // Datenanalyse Dashboard (DD)
        { project: "DD", title: "Datenbank-Modellierung", status: "done", priority: "high", estimated_hours: 16 },
        { project: "DD", title: "Chart-Komponenten entwickeln", status: "in_progress", priority: "high", estimated_hours: 24 },
        { project: "DD", title: "Export-Funktion (CSV/PDF)", status: "in_progress", priority: "medium", estimated_hours: 10 },
        { project: "DD", title: "Benutzerverwaltung", status: "todo", priority: "high", estimated_hours: 14 },
        { project: "DD", title: "Systemtest & QA", status: "todo", priority: "medium", estimated_hours: 8 },
        // Neubau Marketing (NM)
        { project: "NM", title: "Broschüren-Design", status: "done", priority: "high", estimated_hours: 12 },
        { project: "NM", title: "Online-Anzeigen schalten", status: "in_progress", priority: "medium", estimated_hours: 8 },
        { project: "NM", title: "Virtuelle 360°-Tour", status: "todo", priority: "high", estimated_hours: 20 },
        { project: "NM", title: "Pressearbeit & PR", status: "todo", priority: "medium", estimated_hours: 6 },
        { project: "NM", title: "Verkaufsstart-Kampagne", status: "review", priority: "high", estimated_hours: 10 },
        // Crypto Payment Gateway (CPG)
        { project: "CPG", title: "API-Architektur entwerfen", status: "done", priority: "high", estimated_hours: 20 },
        { project: "CPG", title: "Wallet-Integration", status: "in_progress", priority: "acute", estimated_hours: 24 },
        { project: "CPG", title: "KYC-Verifikation", status: "in_progress", priority: "high", estimated_hours: 16 },
        { project: "CPG", title: "Security Audit", status: "todo", priority: "acute", estimated_hours: 20 },
        { project: "CPG", title: "Merchant Dashboard", status: "todo", priority: "medium", estimated_hours: 12 },
        // Patientenportal App (PPA)
        { project: "PPA", title: "UX-Forschung", status: "done", priority: "high", estimated_hours: 16 },
        { project: "PPA", title: "Terminbuchungssystem", status: "in_progress", priority: "high", estimated_hours: 20 },
        { project: "PPA", title: "Patientenakte-Digitalisierung", status: "todo", priority: "acute", estimated_hours: 18 },
        { project: "PPA", title: "Push-Benachrichtigungen", status: "todo", priority: "medium", estimated_hours: 10 },
        { project: "PPA", title: "HIPA-DSGVO-Compliance", status: "review", priority: "high", estimated_hours: 8 },
        // E-Learning Plattform (ELP)
        { project: "ELP", title: "Kurs-Struktur entwerfen", status: "done", priority: "high", estimated_hours: 14 },
        { project: "ELP", title: "Video-Streaming-Integration", status: "in_progress", priority: "high", estimated_hours: 18 },
        { project: "ELP", title: "Quiz-Engine entwickeln", status: "in_progress", priority: "medium", estimated_hours: 12 },
        { project: "ELP", title: "Zertifikatsgenerierung", status: "todo", priority: "medium", estimated_hours: 8 },
        { project: "ELP", title: "SCORM-Kompatibilität", status: "todo", priority: "low", estimated_hours: 14 },
        // Retail Analytics Suite (RAS)
        { project: "RAS", title: "Verkaufsdaten-Modellierung", status: "done", priority: "high", estimated_hours: 12 },
        { project: "RAS", title: "Bestandsprognose-Algorithmus", status: "in_progress", priority: "acute", estimated_hours: 20 },
        { project: "RAS", title: "Dashboard-Visualisierung", status: "todo", priority: "high", estimated_hours: 16 },
        { project: "RAS", title: "POS-Integration", status: "todo", priority: "medium", estimated_hours: 10 },
        { project: "RAS", title: "Excel-Export-Modul", status: "in_progress", priority: "low", estimated_hours: 6 },
        // Fleet Tracking System (FTS)
        { project: "FTS", title: "GPS-Tracking-Modul", status: "done", priority: "acute", estimated_hours: 22 },
        { project: "FTS", title: "Routenoptimierung KI-basiert", status: "in_progress", priority: "high", estimated_hours: 18 },
        { project: "FTS", title: "Fahrer-App Entwicklung", status: "in_progress", priority: "high", estimated_hours: 20 },
        { project: "FTS", title: "Wartungsplanung", status: "todo", priority: "medium", estimated_hours: 8 },
        { project: "FTS", title: "Geofencing-Alerts", status: "todo", priority: "medium", estimated_hours: 6 },
        // Brand Identity 2026 (BIG)
        { project: "BIG", title: "Markenanalyse", status: "done", priority: "high", estimated_hours: 10 },
        { project: "BIG", title: "Logo-Redesign", status: "in_progress", priority: "high", estimated_hours: 16 },
        { project: "BIG", title: "CI/CD-Handbuch", status: "todo", priority: "medium", estimated_hours: 12 },
        { project: "BIG", title: "Social Media Templates", status: "todo", priority: "low", estimated_hours: 8 },
        { project: "BIG", title: "Präsentationsvorlagen", status: "review", priority: "medium", estimated_hours: 6 },
    ];

    const taskIds = [];
    const assigneeEmails = Object.keys(userIds);
    for (const t of tasks) {
        try {
            const assigneeEmail = assigneeEmails[Math.floor(Math.random() * assigneeEmails.length)];
            const rec = await api("POST", "/api/collections/tasks/records", {
                project: projectIds[t.project],
                title: t.title,
                status: t.status,
                priority: t.priority,
                assignees: assigneeEmail ? [userIds[assigneeEmail]] : [],
                estimated_hours: t.estimated_hours,
                due_date: d(14 + Math.floor(Math.random() * 21)),
                start_date: d(-7 - Math.floor(Math.random() * 14)),
            }, adminToken);
            taskIds.push(rec.id);
            console.log(`  ${t.title} [${t.status}]`);
        } catch (e) {
            console.warn(`  Skipping ${t.title}: ${e.message}`);
        }
    }
    console.log();

    // ── 5b. Create task links ──
    console.log("[5b] Creating task links...");
    let linkCount = 0;
    const linkDefs = [
        ["PA", 0, 1, "depends_on"], ["PA", 1, 2, "depends_on"], ["PA", 2, 3, "depends_on"],
        ["DC", 0, 1, "depends_on"], ["DC", 1, 2, "relates_to"],
        ["WR", 0, 1, "depends_on"], ["WR", 1, 2, "depends_on"], ["WR", 2, 3, "depends_on"],
        ["CM", 0, 1, "depends_on"], ["DD", 0, 1, "depends_on"], ["DD", 1, 2, "depends_on"],
        ["CPG", 0, 1, "depends_on"], ["CPG", 1, 2, "depends_on"], ["CPG", 2, 3, "depends_on"],
        ["PPA", 0, 1, "depends_on"], ["PPA", 1, 2, "depends_on"],
        ["ELP", 0, 1, "depends_on"], ["ELP", 1, 2, "depends_on"],
        ["RAS", 0, 1, "depends_on"], ["RAS", 1, 2, "depends_on"],
        ["FTS", 0, 1, "depends_on"], ["FTS", 1, 2, "depends_on"],
        ["BIG", 0, 1, "depends_on"], ["BIG", 1, 2, "depends_on"],
    ];
    for (const [projKey, srcIdx, tgtIdx, linkType] of linkDefs) {
        const projTasks = tasks.filter(t => t.project === projKey);
        if (projTasks.length > Math.max(srcIdx, tgtIdx)) {
            try {
                await api("POST", "/api/collections/task_links/records", {
                    source_task: taskIds[tasks.indexOf(projTasks[srcIdx])],
                    target_task: taskIds[tasks.indexOf(projTasks[tgtIdx])],
                    link_type: linkType,
                }, adminToken);
                linkCount++;
            } catch {}
        }
    }
    console.log(`  Created ${linkCount} task links\n`);

    // ── 5c. Create checklists ──
    console.log("[5c] Creating checklist items...");
    let checklistCount = 0;
    const checklistDefs = [
        { projIdx: 2, items: ["Responsive Design für Mobile", "Ladezeiten optimieren", "Barrierefreiheit (WCAG) prüfen", "Cross-Browser-Tests"] },
        { projIdx: 11, items: ["API-Dokumentation schreiben", "Rate Limiting definieren", "Fehlerbehandlung einbauen"] },
        { projIdx: 21, items: ["Test-Cases definieren", "Testumgebung aufsetzen", "CI/CD-Pipeline integrieren"] },
        { projIdx: 31, items: ["Mockups reviewen", "Responsive Design prüfen", "Barrierefreiheit testen"] },
        { projIdx: 41, items: ["Dashboard-Konzept", "KPIs definieren", "Widgets entwickeln"] },
        { projIdx: 51, items: ["Prototyp erstellen", "User-Testing durchführen", "Iterieren & verbessern"] },
    ];
    for (const cd of checklistDefs) {
        if (taskIds[cd.projIdx]) {
            for (let i = 0; i < cd.items.length; i++) {
                try {
                    await api("POST", "/api/collections/checklist_items/records", {
                        task: taskIds[cd.projIdx],
                        title: cd.items[i],
                        completed: i < 2,
                        sort_order: i,
                    }, adminToken);
                    checklistCount++;
                } catch {}
            }
        }
    }
    console.log(`  Created ${checklistCount} checklist items\n`);

    // ── 5d. Create task comments ──
    console.log("[5d] Creating task comments...");
    let commentCount = 0;
    const commentDefs = [
        { projIdx: 2, content: "<p>Mobile ist fertig. Desktop folgt morgen.</p>" },
        { projIdx: 2, content: "<p>Super, bitte um Review.</p>" },
        { projIdx: 11, content: "<p>API-Doku im Swagger verfügbar.</p>" },
        { projIdx: 11, content: "<p>Bitte Error-Handling-Middleware ergänzen.</p>" },
        { projIdx: 31, content: "<p>Quiz-Engine ist fertig. Tests nächste Woche.</p>" },
        { projIdx: 41, content: "<p>Algorithmus zeigt 94% Genauigkeit in Tests.</p>" },
    ];
    for (const cm of commentDefs) {
        if (taskIds[cm.projIdx] && allUserIds.length > 0) {
            try {
                await api("POST", "/api/collections/task_comments/records", {
                    task: taskIds[cm.projIdx],
                    author: allUserIds[Math.floor(Math.random() * allUserIds.length)],
                    content: cm.content,
                }, adminToken);
                commentCount++;
            } catch {}
        }
    }
    console.log(`  Created ${commentCount} task comments\n`);

    // ── 6. Create time entries (120 — verdoppelt) ──
    console.log("[6] Creating demo time entries...");
    let entryCount = 0;
    for (let i = 0; i < 120; i++) {
        const taskId = taskIds[Math.floor(Math.random() * taskIds.length)];
        const userId = allUserIds[Math.floor(Math.random() * allUserIds.length)];
        const dayOffset = -Math.floor(Math.random() * 14);
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
            entryCount++;
        } catch { /* best-effort */ }
    }
    console.log(`  Created ${entryCount} time entries\n`);

    // ── 7. Create notifications ──
    console.log("[7] Creating notifications...");
    let notifCount = 0;
    const notifTypes = ["task_assigned", "task_due", "task_comment", "task_mention", "status_change", "project_update"];
    for (const uid of allUserIds) {
        for (let i = 0; i < 4; i++) {
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
    console.log(`  Created ${notifCount} notifications\n`);

    // ── 8. Create external expenses ──
    console.log("[8] Creating external expenses...");
    let expenseCount = 0;
    const keys = Object.keys(projectIds);
    for (const key of keys) {
        const count = randomInt(2, 3);
        for (let i = 0; i < count; i++) {
            try {
                await api("POST", "/api/collections/external_expenses/records", {
                    project: projectIds[key],
                    amount: randomInt(50, 2000),
                    description: pick("Monatliche Hosting-Gebühr", "Software-Lizenz", "Tool-Abonnement", "Drittanbieter-Service", "Server-Kosten", "Domain-Gebühr"),
                    category: pick("Hosting", "Lizenzen", "Tools", "Drittanbieter", "Werbekosten"),
                }, adminToken);
                expenseCount++;
            } catch {}
        }
    }
    console.log(`  Created ${expenseCount} external expenses\n`);

    // ── 9. Output credentials ──
    console.log("=== Seed Complete ===\n");
    console.log("── Admin ──");
    console.log(`  ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}\n`);
    console.log("── Demo Users ──");
    for (const u of createdUsers) {
        console.log(`  ${u.name} (${u.role}): ${u.email} / ${u.password}`);
    }

    // Write credentials to JSON for PDF generation
    const credsPath = path.join(__dirname, 'demo_credentials.json');
    fs.writeFileSync(credsPath, JSON.stringify({ admin: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD }, users: createdUsers }, null, 2));
    console.log(`\nCredentials saved to: ${credsPath}`);
}

main().catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
});
