/**
 * Comprehensive Demo Data Population Script
 * Creates plausible sample datasets across ALL collections so that
 * every feature of the Awork Remaster system can be demonstrated.
 * 
 * Run: node backend/populate_demo_data.js
 * Target: Production Railway instance
 */

const email = "admin@vibeforce-flow.de";
const password = "***REMOVED***";
const baseUrl = "https://aworkremaster-production.up.railway.app";

function daysAgo(n) { const d = new Date(); d.setDate(d.getDate() - n); return d; }
function daysFromNow(n) { const d = new Date(); d.setDate(d.getDate() + n); return d; }
function toISO(d) { return d.toISOString(); }

async function apiPost(headers, collection, body) {
    const res = await fetch(`${baseUrl}/api/collections/${collection}/records`, {
        method: "POST", headers, body: JSON.stringify(body)
    });
    if (!res.ok) {
        const text = await res.text();
        console.error(`  FAILED [${res.status}] POST ${collection}: ${text.substring(0, 200)}`);
        return null;
    }
    return await res.json();
}

async function apiGetAll(headers, collection, filter = "") {
    let url = `${baseUrl}/api/collections/${collection}/records?perPage=200`;
    if (filter) url += `&filter=${encodeURIComponent(filter)}`;
    const res = await fetch(url, { headers });
    if (!res.ok) return [];
    const data = await res.json();
    return data.items || [];
}

async function populateData() {
    console.log("=== COMPREHENSIVE DEMO DATA POPULATION ===\n");

    // AUTH
    console.log("[1/8] Authenticating...");
    const authRes = await fetch(`${baseUrl}/api/collections/users/auth-with-password`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identity: email, password: password })
    });
    if (!authRes.ok) { console.error("Auth failed."); return; }
    const authData = await authRes.json();
    const token = authData.token;
    const mainUserId = authData.record.id;
    const headers = { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" };
    console.log(`  Authenticated as ${email} (${mainUserId})\n`);

    // CHECK EXISTING DATA
    console.log("[*] Checking existing data...");
    const existingClients = await apiGetAll(headers, "clients");
    const existingProjects = await apiGetAll(headers, "projects");
    const existingTasks = await apiGetAll(headers, "tasks");
    console.log(`  Existing: ${existingClients.length} clients, ${existingProjects.length} projects, ${existingTasks.length} tasks\n`);

    const dataExists = existingClients.length >= 3 && existingProjects.length >= 4 && existingTasks.length >= 15;

    // USERS - always check/create users regardless of existing data
    console.log("[2/8] Creating additional users...");
    const userIds = [mainUserId];
    const existingUsers = await apiGetAll(headers, "users");

    async function createUser(name, emailAddr, role, expertise) {
        // PocketBase may hide emails in list responses; try to find by name as fallback
        const existing = existingUsers.find(u => u.email === emailAddr || u.name === name);
        if (existing) {
            console.log(`  User ${name} (${emailAddr}) already exists (${existing.id})`);
            if (!userIds.includes(existing.id)) userIds.push(existing.id);
            return existing.id;
        }
        const res = await fetch(`${baseUrl}/api/collections/users/records`, {
            method: "POST", headers,
            body: JSON.stringify({
                email: emailAddr, password: "***REMOVED***", passwordConfirm: "***REMOVED***",
                name, role, expertise, language: "de",
                notify_on_assignment: true, notify_on_mention: true, notify_on_due: true, weekly_report: true
            })
        });
        if (!res.ok) { const t = await res.text(); console.error(`  FAILED user ${emailAddr}: ${t.substring(0, 200)}`); return null; }
        const data = await res.json();
        console.log(`  Created user: ${name} (${data.id})`);
        userIds.push(data.id);
        return data.id;
    }

    const sarahId = await createUser("Sarah Meier", "sarah.meier@agentur.de", "employee", ["sea", "social_ads", "content"]);
    const lukasId = await createUser("Lukas Wagner", "lukas.wagner@agentur.de", "employee", ["development", "seo", "tracking"]);
    const annaId = await createUser("Anna Schneider", "anna.schneider@agentur.de", "employee", ["design", "content", "consulting"]);
    const carlId = await createUser("Carl Schmidt", "carl@vibeforce.de", "employee", ["development", "consulting"]);

    // ═══════════════════════════════════════════════════════════
    // [2.5/8] "Awork Remastered" — Self-Tracking Project
    // Immer ausführen, überspringt wenn Projekt schon existiert
    // ═══════════════════════════════════════════════════════════
    const existingAwork = existingProjects.find(p => p.key === "AWR" || p.name === "Awork Remastered");

    if (!existingAwork) {
        console.log("\n  >>> Creating 'Awork Remastered' self-tracking project...");

        // Projekt anlegen
        const digitalPulseClient = existingClients.find(c => c.name === "DigitalPulse GmbH") || c1;
        const awrProject = await apiPost(headers, "projects", {
            name: "Awork Remastered",
            key: "AWR",
            client: digitalPulseClient?.id || null,
            status: "active",
            description: "Self-Tracking-Projekt für die Weiterentwicklung des Flow OS Tools. Enthält alle Tasks rund um Dark Mode, Gantt-Upgrades, Bugfixes und Reporting.",
            project_type: "development",
            project_lead: mainUserId,
            members: [mainUserId, carlId].filter(Boolean),
            deadline: toISO(daysFromNow(30)),
            start_date: toISO(daysAgo(14)),
            planned_hours: 40,
            is_billable: false
        });

        if (awrProject) {
            console.log(`    Project created: ${awrProject.id}`);

            // Abgeschlossene Tasks (Robin, letzte 2 Wochen)
            const doneTasks = [
                { title: "Darkmode & Theme-System Refactoring", status: "done", priority: "high", type: "development", assignee: mainUserId, description: "CSS-Variablen-Restrukturierung, .dark-Klassen-Audit, Frappe-Gantt Dark Mode Integration" },
                { title: "Night Shift System (Blaulichtfilter) implementieren", status: "done", priority: "high", type: "development", assignee: mainUserId, description: "mix-blend-mode Implementierung, Blaulichtfilter-UI, LocalStorage-Persistenz" },
                { title: "Kritische Bugfixes: Gantt Chart & Auth Sync", status: "done", priority: "acute", type: "development", assignee: mainUserId, description: "container_height:auto Fix, Dependency-Validierung, ensure_users.pb.js Deaktivierung" },
            ];

            const inProgressTasks = [
                { title: "Gantt Timeline UI Upgrade (Original Awork Look)", status: "in_progress", priority: "high", type: "development", assignee: mainUserId, description: "Linke Tabelle + rechter Chart synced, 38px Balken, Drag-Handles, CSS-Variablen" },
                { title: "Task Quick-Options (3-Punkte Kontextmenü)", status: "in_progress", priority: "high", type: "development", assignee: mainUserId, description: "more_vert Icon an jeder Task-Zeile, Submenü für Statusänderung, Quick-Actions (Zeit erfassen, Zuständigkeit)" },
                { title: "PDF Reportexport im Stundenreport-Layout anpassen", status: "in_progress", priority: "high", type: "development", assignee: mainUserId, description: "Leistungsnachweis-Layout: Datum|Mitarbeiter|Tätigkeit|Dauer, Summenzeile, Briefkopf mit Logo/Kundendaten" },
            ];

            const reviewTasks = [
                { title: "Code- & UI-Review Meilenstein 1", status: "todo", priority: "high", type: "consulting", assignee: carlId, description: "Review aller abgeschlossenen Tasks, Dark Mode QA, Gantt UX-Check, Report-Validierung gegen Kupona-Vorlage" },
            ];

            const allAworkTasks = [...doneTasks, ...inProgressTasks, ...reviewTasks];

            const createdTaskIds = {};
            for (const taskDef of allAworkTasks) {
                const task = await apiPost(headers, "tasks", {
                    title: taskDef.title,
                    status: taskDef.status,
                    priority: taskDef.priority,
                    type: taskDef.type,
                    assignee: taskDef.assignee,
                    project: awrProject.id,
                    description: taskDef.description,
                    planned_hours: randomInt(4, 12),
                    created_by: mainUserId
                });
                if (task) {
                    createdTaskIds[taskDef.title] = task.id;
                    console.log(`    Task: ${taskDef.title} [${taskDef.status}]`);
                }
            }

            // ═══════════════════════════════════════════════════════════
            // Time Entries für abgeschlossene Tasks (~15-20h total)
            // ═══════════════════════════════════════════════════════════
            console.log("    Creating time entries for completed tasks...");
            const timeEntries = [
                { task: "Darkmode & Theme-System Refactoring", daysBack: 12, hours: 3.5, desc: "CSS-Variablen Audit & .dark-Klassen-Mapping" },
                { task: "Darkmode & Theme-System Refactoring", daysBack: 10, hours: 4.0, desc: "Frappe-Gantt Dark Mode CSS Overrides implementiert" },
                { task: "Darkmode & Theme-System Refactoring", daysBack: 8, hours: 2.5, desc: "Cross-Browser Testing Dark Mode (Chrome/Firefox/Safari)" },
                { task: "Night Shift System (Blaulichtfilter) implementieren", daysBack: 9, hours: 2.0, desc: "mix-blend-mode Konzept & Prototyp" },
                { task: "Night Shift System (Blaulichtfilter) implementieren", daysBack: 7, hours: 3.0, desc: "UI-Komponente & LocalStorage-Persistenz" },
                { task: "Night Shift System (Blaulichtfilter) implementieren", daysBack: 5, hours: 1.5, desc: "Edge Cases: Toggle-Animation, System-Präferenz-Sync" },
                { task: "Kritische Bugfixes: Gantt Chart & Auth Sync", daysBack: 6, hours: 2.0, desc: "Gantt container_height:auto Fix & Dependency-Validierung" },
                { task: "Kritische Bugfixes: Gantt Chart & Auth Sync", daysBack: 4, hours: 1.5, desc: "ensure_users.pb.js deaktiviert, CORS-Header gefixt" },
                { task: "Kritische Bugfixes: Gantt Chart & Auth Sync", daysBack: 2, hours: 2.0, desc: "Base UI Error #31 Fix (NotificationBell), Status-Labels Deutsch" },
            ];

            let totalHours = 0;
            for (const te of timeEntries) {
                const taskId = createdTaskIds[te.task];
                if (!taskId) continue;
                const date = daysAgo(te.daysBack);
                date.setHours(9, 0, 0, 0); // 09:00
                const endDate = new Date(date.getTime() + te.hours * 3600000);
                await apiPost(headers, "time_entries", {
                    user: mainUserId,
                    task: taskId,
                    project: awrProject.id,
                    start_time: toISO(date),
                    end_time: toISO(endDate),
                    duration_minutes: Math.round(te.hours * 60),
                    description: te.desc,
                    is_billable: false
                });
                totalHours += te.hours;
            }
            console.log(`    Time entries created: ${timeEntries.length} entries, ${totalHours.toFixed(1)}h total`);
        }
    } else {
        console.log("\n  >>> 'Awork Remastered' project already exists. Skipping.");
    }

    // If sufficient data already exists, skip remaining creation
    if (dataExists) {
        console.log("\n  Sufficient demo data already exists. Skipping remaining creation.\n");
        console.log("  To force re-creation, delete existing records first via PocketBase Admin UI.\n");
        // Still show summary with existing data counts
        const validUserIds = userIds.filter(Boolean);
        console.log("\n============================================");
        console.log("  DEMO DATA CHECK COMPLETE!");
        console.log("============================================");
        console.log(`  Users: ${validUserIds.length}`);
        console.log(`  Clients: ${existingClients.length}`);
        console.log(`  Projects: ${existingProjects.length}`);
        console.log(`  Tasks: ${existingTasks.length}`);
        console.log(`  Login at: https://aworkremaster-production.up.railway.app`);
        console.log(`  Email: ${email}`);
        console.log(`  Additional users: sarah.meier@agentur.de, lukas.wagner@agentur.de, anna.schneider@agentur.de`);
        console.log(`  Password for all: ***REMOVED***`);
        console.log("============================================\n");
        return;
    }

    // CLIENTS
    console.log("\n[3/8] Creating clients...");
    let c1 = existingClients.find(c => c.name === "DigitalPulse GmbH");
    if (!c1) {
        c1 = await apiPost(headers, "clients", {
            name: "DigitalPulse GmbH", company: "DigitalPulse GmbH", email: "info@digitalpulse.de",
            phone: "+49 30 12345678", address: "Musterstraße 42, 10115 Berlin",
            status: "active", auftragsvolumen: 85000, stundenhonorar: 120,
            stundenzahl_monatlich: 80, stundenzahl_gesamt: 700,
            laufzeit_start: toISO(daysAgo(180)), laufzeit_ende: toISO(daysFromNow(185)),
            abrechenbar: true, kundenstatus: "aktiv",
            betreuer: [mainUserId], beobachter: [sarahId].filter(Boolean),
            notes: "<p>Stammkunde seit 2023. Regelm&auml;&szlig;ige Projekte im Bereich SEA und Social Ads.</p>"
        });
        console.log(`  Created client: DigitalPulse GmbH (${c1?.id})`);
    } else console.log(`  Client exists: DigitalPulse GmbH (${c1.id})`);

    let c2 = existingClients.find(c => c.name === "GreenLeaf Media");
    if (!c2) {
        c2 = await apiPost(headers, "clients", {
            name: "GreenLeaf Media", company: "GreenLeaf Media GmbH", email: "kontakt@greenleaf-media.de",
            phone: "+49 40 98765432", address: "Grüne Allee 15, 22765 Hamburg",
            status: "active", auftragsvolumen: 42000, stundenhonorar: 95,
            stundenzahl_monatlich: 40, stundenzahl_gesamt: 440,
            laufzeit_start: toISO(daysAgo(90)), laufzeit_ende: toISO(daysFromNow(275)),
            abrechenbar: true, kundenstatus: "aktiv",
            betreuer: [sarahId].filter(Boolean), beobachter: [mainUserId].filter(Boolean),
            notes: "<p>Nachhaltigkeitsagentur. Retainer-Modell mit monatlicher Pauschale.</p>"
        });
        console.log(`  Created client: GreenLeaf Media (${c2?.id})`);
    } else console.log(`  Client exists: GreenLeaf Media (${c2.id})`);

    let c3 = existingClients.find(c => c.name === "TechVentures AG");
    if (!c3) {
        c3 = await apiPost(headers, "clients", {
            name: "TechVentures AG", company: "TechVentures AG", email: "hello@techventures.ch",
            phone: "+41 44 5556677", address: "Bahnhofstrasse 88, 8001 Zürich",
            status: "active", auftragsvolumen: 96000, stundenhonorar: 150,
            stundenzahl_monatlich: 60, stundenzahl_gesamt: 640,
            laufzeit_start: toISO(daysAgo(60)), laufzeit_ende: toISO(daysFromNow(300)),
            abrechenbar: true, kundenstatus: "aktiv",
            betreuer: [lukasId].filter(Boolean), beobachter: [mainUserId, sarahId].filter(Boolean),
            notes: "<p>Z&uuml;rcher Tech-Startup. Fokus auf Webentwicklung und Tracking.</p>"
        });
        console.log(`  Created client: TechVentures AG (${c3?.id})`);
    } else console.log(`  Client exists: TechVentures AG (${c3.id})`);

    let c4 = existingClients.find(c => c.name === "MediaWorks GmbH");
    if (!c4) {
        c4 = await apiPost(headers, "clients", {
            name: "MediaWorks GmbH", company: "MediaWorks GmbH", email: "info@mediaworks.de",
            phone: "+49 69 1112233", address: "Mainzer Landstraße 50, 60327 Frankfurt",
            status: "active", auftragsvolumen: 55000, stundenhonorar: 135,
            stundenzahl_monatlich: 50, stundenzahl_gesamt: 400,
            laufzeit_start: toISO(daysAgo(45)), laufzeit_ende: toISO(daysFromNow(320)),
            abrechenbar: true, kundenstatus: "aktiv",
            betreuer: [annaId].filter(Boolean), beobachter: [mainUserId].filter(Boolean),
            notes: "<p>Medienagentur aus Frankfurt. Fokus auf Content-Erstellung und Videoproduktion.</p>"
        });
        console.log(`  Created client: MediaWorks GmbH (${c4?.id})`);
    } else console.log(`  Client exists: MediaWorks GmbH (${c4.id})`);

    let c5 = existingClients.find(c => c.name === "NordBau GmbH");
    if (!c5) {
        c5 = await apiPost(headers, "clients", {
            name: "NordBau GmbH", company: "NordBau GmbH", email: "info@nordbau.de",
            phone: "+49 421 998877", address: "Uberseering 10, 28209 Bremen",
            status: "active", auftragsvolumen: 72000, stundenhonorar: 110,
            stundenzahl_monatlich: 70, stundenzahl_gesamt: 650,
            laufzeit_start: toISO(daysAgo(30)), laufzeit_ende: toISO(daysFromNow(335)),
            abrechenbar: true, kundenstatus: "aktiv",
            betreuer: [lukasId].filter(Boolean), beobachter: [mainUserId, annaId].filter(Boolean),
            notes: "<p>Bauunternehmen aus Bremen. Digitale Transformation und Prozessoptimierung.</p>"
        });
        console.log(`  Created client: NordBau GmbH (${c5?.id})`);
    } else console.log(`  Client exists: NordBau GmbH (${c5.id})`);

    const clients = [c1, c2, c3, c4, c5].filter(Boolean);

    // PROJECTS
    console.log("\n[4/8] Creating projects...");
    // Check existing project keys to avoid unique constraint violations
    const existingProjectKeys = existingProjects.map(p => p.key);
    function uniqueKey(base) {
        if (!existingProjectKeys.includes(base)) return base;
        let i = 2;
        while (existingProjectKeys.includes(base + i)) i++;
        return base + i;
    }

    let p1 = existingProjects.find(p => p.name === "Flow OS Platform Launch");
    if (!p1) {
        p1 = await apiPost(headers, "projects", {
            name: "Flow OS Platform Launch", key: uniqueKey("KLOS"), status: "active",
            client: c1?.id, members: [mainUserId, sarahId, lukasId, annaId].filter(Boolean),
            start_date: toISO(daysAgo(14)), end_date: toISO(daysFromNow(28)),
            description: "Finalisierung und Rollout des neuen Flow OS Platform",
            budget_hours: 350, budget_money: 45000, budget_fixed: 45000, budget_type: "fixed",
            external_costs_total: 3200,
            cycle_start_date: toISO(daysAgo(14)), cycle_end_date: toISO(daysFromNow(14)), cycle_number: 2
        });
        console.log(`  Created project: Flow OS Platform Launch (${p1?.id})`);
    } else console.log(`  Project exists: Flow OS Platform Launch (${p1.id})`);

    let p2 = existingProjects.find(p => p.name === "GreenLeaf SEO Campaign");
    if (!p2) {
        p2 = await apiPost(headers, "projects", {
            name: "GreenLeaf SEO Campaign", key: "GLSEO", status: "active",
            client: c2?.id, members: [mainUserId, sarahId, lukasId].filter(Boolean),
            start_date: toISO(daysAgo(30)), end_date: toISO(daysFromNow(60)),
            description: "Ganzheitliche SEO-Strategie und Content-Optimierung",
            budget_hours: 120, budget_money: 3500, budget_fixed: 3500, budget_type: "retainer",
            external_costs_total: 850,
            cycle_start_date: toISO(daysAgo(30)), cycle_end_date: toISO(daysFromNow(0)), cycle_number: 1
        });
        console.log(`  Created project: GreenLeaf SEO Campaign (${p2?.id})`);
    } else console.log(`  Project exists: GreenLeaf SEO Campaign (${p2.id})`);

    let p3 = existingProjects.find(p => p.name === "TechVentures App Development");
    if (!p3) {
        p3 = await apiPost(headers, "projects", {
            name: "TechVentures App Development", key: "TVAPP", status: "active",
            client: c3?.id, members: [mainUserId, lukasId, annaId].filter(Boolean),
            start_date: toISO(daysAgo(21)), end_date: toISO(daysFromNow(70)),
            description: "Entwicklung der TechVentures Partner-App mit Dashboard",
            budget_hours: 200, budget_money: 30000, budget_type: "hourly",
            external_costs_total: 1500,
            cycle_start_date: toISO(daysAgo(21)), cycle_end_date: toISO(daysFromNow(7)), cycle_number: 1
        });
        console.log(`  Created project: TechVentures App Development (${p3?.id})`);
    } else console.log(`  Project exists: TechVentures App Development (${p3.id})`);

    let p4 = existingProjects.find(p => p.name === "Social Ads Q2");
    if (!p4) {
        p4 = await apiPost(headers, "projects", {
            name: "Social Ads Q2", key: "KLSAQ2", status: "active",
            client: c1?.id, members: [sarahId, mainUserId].filter(Boolean),
            start_date: toISO(daysAgo(7)), end_date: toISO(daysFromNow(84)),
            description: "Social Media Advertising Kampagne f&uuml;r Q2 2026",
            budget_hours: 100, budget_money: 12000, budget_fixed: 12000, budget_type: "fixed",
            external_costs_total: 4500,
            cycle_start_date: toISO(daysAgo(7)), cycle_end_date: toISO(daysFromNow(21)), cycle_number: 1
        });
        console.log(`  Created project: Social Ads Q2 (${p4?.id})`);
    } else console.log(`  Project exists: Social Ads Q2 (${p4.id})`);

    let p5 = existingProjects.find(p => p.name === "Internal Website Redesign");
    if (!p5) {
        p5 = await apiPost(headers, "projects", {
            name: "Internal Website Redesign", key: "IWR", status: "active",
            members: [annaId, mainUserId, lukasId].filter(Boolean),
            start_date: toISO(daysAgo(5)), end_date: toISO(daysFromNow(40)),
            description: "Relaunch der internen Agentur-Website mit neuem CMS",
            budget_hours: 80, budget_money: 8000, budget_fixed: 8000, budget_type: "fixed",
            external_costs_total: 0,
            cycle_start_date: toISO(daysAgo(5)), cycle_end_date: toISO(daysFromNow(23)), cycle_number: 1
        });
        console.log(`  Created project: Internal Website Redesign (${p5?.id})`);
    } else console.log(`  Project exists: Internal Website Redesign (${p5.id})`);

    let p6 = existingProjects.find(p => p.name === "GreenLeaf Brand Refresh");
    if (!p6) {
        p6 = await apiPost(headers, "projects", {
            name: "GreenLeaf Brand Refresh", key: "GLBR", status: "completed",
            client: c2?.id, members: [annaId, sarahId, mainUserId].filter(Boolean),
            start_date: toISO(daysAgo(120)), end_date: toISO(daysAgo(30)),
            description: "Kompletter Brand Refresh inkl. Logo, CI/CD und Markenauftritt",
            budget_hours: 150, budget_money: 18000, budget_fixed: 18000, budget_type: "fixed",
            external_costs_total: 2200, cycle_number: 3
        });
        console.log(`  Created project: GreenLeaf Brand Refresh (${p6?.id})`);
    } else console.log(`  Project exists: GreenLeaf Brand Refresh (${p6.id})`);

    let p7 = existingProjects.find(p => p.name === "MediaWorks Content Hub");
    if (!p7) {
        p7 = await apiPost(headers, "projects", {
            name: "MediaWorks Content Hub", key: "MWCH", status: "active",
            client: c4?.id, members: [annaId, sarahId].filter(Boolean),
            start_date: toISO(daysAgo(10)), end_date: toISO(daysFromNow(60)),
            description: "Aufbau eines zentralen Content-Hubs für Blog, Video und Podcast.",
            budget_hours: 100, budget_money: 12000, budget_fixed: 12000, budget_type: "fixed",
            external_costs_total: 2800,
            cycle_start_date: toISO(daysAgo(10)), cycle_end_date: toISO(daysFromNow(20)), cycle_number: 1
        });
        console.log(`  Created project: MediaWorks Content Hub (${p7?.id})`);
    } else console.log(`  Project exists: MediaWorks Content Hub (${p7.id})`);

    let p8 = existingProjects.find(p => p.name === "NordBau Digitalisierung");
    if (!p8) {
        p8 = await apiPost(headers, "projects", {
            name: "NordBau Digitalisierung", key: "NBDIG", status: "active",
            client: c5?.id, members: [lukasId, mainUserId].filter(Boolean),
            start_date: toISO(daysAgo(3)), end_date: toISO(daysFromNow(90)),
            description: "Digitalisierung der Baustellenprozesse und Reporting-Tools.",
            budget_hours: 160, budget_money: 24000, budget_type: "hourly",
            external_costs_total: 1200,
            cycle_start_date: toISO(daysAgo(3)), cycle_end_date: toISO(daysFromNow(27)), cycle_number: 1
        });
        console.log(`  Created project: NordBau Digitalisierung (${p8?.id})`);
    } else console.log(`  Project exists: NordBau Digitalisierung (${p8.id})`);

    const projects = [p1, p2, p3, p4, p5, p6, p7, p8].filter(Boolean);

    // TASKS
    console.log("\n[5/8] Creating tasks...");
    const allTaskIds = [];

    async function createTask(title, project, status, priority, assignees, startDate, dueDate, type, desc, recurring, interval) {
        const body = { title, project: project.id, status, priority, assignees: assignees.filter(Boolean), type: type || "other" };
        if (startDate) body.start_date = toISO(startDate);
        if (dueDate) body.due_date = toISO(dueDate);
        if (desc) body.description = desc;
        if (recurring) { body.is_recurring = true; body.recurring_interval = interval || "weekly"; body.recurring_next_date = toISO(dueDate || daysFromNow(7)); }
        const result = await apiPost(headers, "tasks", body);
        if (result) allTaskIds.push(result.id);
        return result;
    }

    // Project 1: Flow OS Platform Launch
    if (p1) {
        const t1 = await createTask("Konzept & Branding", p1, "done", "high", [mainUserId, annaId], daysAgo(14), daysAgo(10), "design");
        const t2 = await createTask("Backend Migration", p1, "done", "acute", [lukasId, mainUserId], daysAgo(12), daysAgo(5), "development");
        const t3 = await createTask("Frontend Refinement", p1, "in_progress", "high", [annaId, lukasId], daysAgo(3), daysFromNow(7), "development");
        const t4 = await createTask("Beta Testing", p1, "todo", "high", [mainUserId, sarahId], daysFromNow(5), daysFromNow(14), "consulting");
        const t5 = await createTask("Deployment & Launch", p1, "todo", "acute", [mainUserId, lukasId], daysFromNow(12), daysFromNow(18), "development");
        const t6 = await createTask("Dokumentation", p1, "review", "medium", [lukasId], daysAgo(2), daysFromNow(3), "other");
        const t7 = await createTask("Wöchentliches Reporting", p1, "in_progress", "medium", [mainUserId, sarahId], daysAgo(7), daysFromNow(7), "consulting", null, true, "weekly");

        if (t1 && t2) await apiPost(headers, "task_links", { source_task: t2.id, target_task: t1.id, link_type: "depends_on" });
        if (t2 && t3) await apiPost(headers, "task_links", { source_task: t3.id, target_task: t2.id, link_type: "depends_on" });
        if (t3 && t4) await apiPost(headers, "task_links", { source_task: t4.id, target_task: t3.id, link_type: "depends_on" });
        if (t4 && t5) await apiPost(headers, "task_links", { source_task: t5.id, target_task: t4.id, link_type: "depends_on" });
        if (t3 && t6) await apiPost(headers, "task_links", { source_task: t6.id, target_task: t3.id, link_type: "relates_to" });

        if (t3) {
            await apiPost(headers, "checklist_items", { task: t3.id, title: "Responsive Design f&uuml;r Mobile", completed: true, sort_order: 0 });
            await apiPost(headers, "checklist_items", { task: t3.id, title: "Ladezeiten optimieren", completed: true, sort_order: 1 });
            await apiPost(headers, "checklist_items", { task: t3.id, title: "Barrierefreiheit (WCAG) pr&uuml;fen", completed: false, sort_order: 2 });
            await apiPost(headers, "checklist_items", { task: t3.id, title: "Cross-Browser-Tests durchf&uuml;hren", completed: false, sort_order: 3 });
        }
        if (t4) {
            await apiPost(headers, "checklist_items", { task: t4.id, title: "Testplan erstellen", completed: false, sort_order: 0 });
            await apiPost(headers, "checklist_items", { task: t4.id, title: "Tester einladen", completed: false, sort_order: 1 });
        }
        if (t3 && mainUserId) {
            await apiPost(headers, "task_comments", { task: t3.id, author: mainUserId, content: "<p>Mobile-Ansicht ist fertig. Bitte um Review.</p>", mentions: [annaId].filter(Boolean) });
            if (annaId) await apiPost(headers, "task_comments", { task: t3.id, author: annaId, content: "<p>Sieht gut aus! Habe noch Kleinigkeiten im Footer angepasst.</p>" });
        }
        if (t6 && lukasId) {
            await apiPost(headers, "task_comments", { task: t6.id, author: lukasId, content: "<p>Doku fertig zum Review. Bitte @Sarah Meier gegenlesen.</p>", mentions: [sarahId].filter(Boolean) });
        }
        console.log(`  Created 7 tasks for Flow OS Platform Launch`);
    }

    // Project 2: GreenLeaf SEO Campaign
    if (p2) {
        const t1 = await createTask("SEO Keyword Analyse", p2, "done", "high", [lukasId, mainUserId], daysAgo(30), daysAgo(23), "seo");
        const t2 = await createTask("On-Page Optimierung", p2, "in_progress", "acute", [lukasId], daysAgo(20), daysFromNow(5), "seo");
        const t3 = await createTask("Content-Strategie", p2, "in_progress", "high", [sarahId, mainUserId], daysAgo(15), daysFromNow(10), "content");
        const t4 = await createTask("Technical SEO Audit", p2, "todo", "medium", [lukasId], daysFromNow(3), daysFromNow(17), "tracking");
        const t5 = await createTask("Monatlicher SEO-Report", p2, "in_progress", "medium", [lukasId, sarahId], daysAgo(7), daysFromNow(23), "seo", null, true, "monthly");

        if (t1 && t2) await apiPost(headers, "task_links", { source_task: t2.id, target_task: t1.id, link_type: "depends_on" });
        if (t2 && t4) await apiPost(headers, "task_links", { source_task: t4.id, target_task: t2.id, link_type: "depends_on" });
        if (t2 && t3) await apiPost(headers, "task_links", { source_task: t3.id, target_task: t2.id, link_type: "relates_to" });

        if (t2) {
            await apiPost(headers, "checklist_items", { task: t2.id, title: "Meta-Titles optimieren", completed: true, sort_order: 0 });
            await apiPost(headers, "checklist_items", { task: t2.id, title: "Meta-Descriptions anpassen", completed: true, sort_order: 1 });
            await apiPost(headers, "checklist_items", { task: t2.id, title: "Heading-Struktur pr&uuml;fen", completed: false, sort_order: 2 });
            await apiPost(headers, "checklist_items", { task: t2.id, title: "Alt-Tags f&uuml;r Bilder erg&auml;nzen", completed: false, sort_order: 3 });
        }
        if (t3 && sarahId) {
            await apiPost(headers, "task_comments", { task: t3.id, author: sarahId, content: "<p>Content-Strategie fertig. Fokus auf 'Green Tech' und Nachhaltigkeit.</p>" });
            if (mainUserId) await apiPost(headers, "task_comments", { task: t3.id, author: mainUserId, content: "<p>Super! K&ouml;nnen wir n&auml;chste Woche die ersten 3 Artikel produzieren?</p>" });
        }
        console.log(`  Created 5 tasks for GreenLeaf SEO Campaign`);
    }

    // Project 3: TechVentures App Development
    if (p3) {
        const t1 = await createTask("UI/UX Design", p3, "done", "high", [annaId, mainUserId], daysAgo(21), daysAgo(14), "design");
        const t2 = await createTask("API-Entwicklung", p3, "in_progress", "acute", [lukasId, mainUserId], daysAgo(14), daysFromNow(7), "development");
        const t3 = await createTask("Dashboard-Komponenten", p3, "in_progress", "high", [annaId, lukasId], daysAgo(7), daysFromNow(14), "development");
        const t4 = await createTask("Tracking-Integration", p3, "todo", "high", [lukasId], daysFromNow(5), daysFromNow(21), "tracking");
        const t5 = await createTask("Testing & QA", p3, "todo", "medium", [mainUserId, lukasId], daysFromNow(14), daysFromNow(28), "consulting");
        const t6 = await createTask("App Store Deployment", p3, "todo", "medium", [mainUserId], daysFromNow(28), daysFromNow(42), "development");

        if (t1 && t2) await apiPost(headers, "task_links", { source_task: t2.id, target_task: t1.id, link_type: "depends_on" });
        if (t2 && t3) await apiPost(headers, "task_links", { source_task: t3.id, target_task: t2.id, link_type: "depends_on" });
        if (t3 && t4) await apiPost(headers, "task_links", { source_task: t4.id, target_task: t3.id, link_type: "depends_on" });
        if (t4 && t5) await apiPost(headers, "task_links", { source_task: t5.id, target_task: t4.id, link_type: "depends_on" });
        if (t5 && t6) await apiPost(headers, "task_links", { source_task: t6.id, target_task: t5.id, link_type: "depends_on" });

        if (t2) {
            await apiPost(headers, "checklist_items", { task: t2.id, title: "Endpunkte definieren", completed: true, sort_order: 0 });
            await apiPost(headers, "checklist_items", { task: t2.id, title: "Auth-Middleware implementieren", completed: true, sort_order: 1 });
            await apiPost(headers, "checklist_items", { task: t2.id, title: "Rate Limiting einbauen", completed: false, sort_order: 2 });
        }
        if (t2 && lukasId) {
            await apiPost(headers, "task_comments", { task: t2.id, author: lukasId, content: "<p>API ist soweit fertig. Doku im Swagger verf&uuml;gbar.</p>" });
            if (mainUserId) await apiPost(headers, "task_comments", { task: t2.id, author: mainUserId, content: "<p>Bitte noch Error-Handling-Middleware erg&auml;nzen?</p>", mentions: [lukasId].filter(Boolean) });
        }
        console.log(`  Created 6 tasks for TechVentures App Development`);
    }

    // Project 4: Social Ads Q2
    if (p4) {
        const t1 = await createTask("Kampagnen-Strategie", p4, "done", "high", [sarahId, mainUserId], daysAgo(7), daysAgo(3), "social_ads");
        const t2 = await createTask("Ad Creatives erstellen", p4, "in_progress", "acute", [sarahId, annaId], daysAgo(3), daysFromNow(4), "social_ads");
        const t3 = await createTask("Targeting & Audience Setup", p4, "todo", "high", [sarahId], daysFromNow(2), daysFromNow(9), "sea");
        const t4 = await createTask("Launch & Monitoring", p4, "todo", "medium", [sarahId, mainUserId], daysFromNow(7), daysFromNow(21), "social_ads");

        if (t1 && t2) await apiPost(headers, "task_links", { source_task: t2.id, target_task: t1.id, link_type: "depends_on" });
        if (t2 && t3) await apiPost(headers, "task_links", { source_task: t3.id, target_task: t2.id, link_type: "depends_on" });
        if (t3 && t4) await apiPost(headers, "task_links", { source_task: t4.id, target_task: t3.id, link_type: "depends_on" });

        if (t2) {
            await apiPost(headers, "checklist_items", { task: t2.id, title: "Meta Ads Creatives", completed: true, sort_order: 0 });
            await apiPost(headers, "checklist_items", { task: t2.id, title: "LinkedIn Ads Creatives", completed: false, sort_order: 1 });
            await apiPost(headers, "checklist_items", { task: t2.id, title: "TikTok Creatives", completed: false, sort_order: 2 });
        }
        console.log(`  Created 4 tasks for Social Ads Q2`);
    }

    // Project 5: Internal Website Redesign
    if (p5) {
        const t1 = await createTask("Design-Konzept", p5, "done", "high", [annaId], daysAgo(5), daysAgo(1), "design");
        const t2 = await createTask("CMS-Auswahl & Setup", p5, "in_progress", "high", [lukasId, mainUserId], daysAgo(3), daysFromNow(5), "development");
        const t3 = await createTask("Template-Entwicklung", p5, "todo", "medium", [annaId, lukasId], daysFromNow(3), daysFromNow(18), "development");
        const t4 = await createTask("Content-Migration", p5, "todo", "low", [mainUserId], daysFromNow(15), daysFromNow(30), "content");

        if (t1 && t2) await apiPost(headers, "task_links", { source_task: t2.id, target_task: t1.id, link_type: "depends_on" });
        if (t2 && t3) await apiPost(headers, "task_links", { source_task: t3.id, target_task: t2.id, link_type: "depends_on" });
        if (t3 && t4) await apiPost(headers, "task_links", { source_task: t4.id, target_task: t3.id, link_type: "depends_on" });

        if (t2) {
            await apiPost(headers, "checklist_items", { task: t2.id, title: "CMS-Anbieter vergleichen", completed: true, sort_order: 0 });
            await apiPost(headers, "checklist_items", { task: t2.id, title: "Hosting einrichten", completed: false, sort_order: 1 });
        }
        console.log(`  Created 4 tasks for Internal Website Redesign`);
    }

    // Project 6: GreenLeaf Brand Refresh (completed)
    if (p6) {
        await createTask("Logo-Entwicklung", p6, "done", "high", [annaId], daysAgo(120), daysAgo(100), "design");
        await createTask("CI/CD Richtlinien", p6, "done", "high", [annaId, sarahId], daysAgo(105), daysAgo(80), "design");
        await createTask("Briefpapier & Vorlagen", p6, "done", "medium", [annaId], daysAgo(85), daysAgo(60), "design");
        await createTask("Markenauftritt Web", p6, "done", "high", [annaId, mainUserId], daysAgo(65), daysAgo(35), "design");
        await createTask("Präsentationsvorlagen", p6, "done", "low", [annaId], daysAgo(40), daysAgo(30), "design");
        console.log(`  Created 5 tasks for GreenLeaf Brand Refresh`);
    }

    // Project 7: MediaWorks Content Hub
    if (p7) {
        await createTask("Content-Strategie", p7, "done", "high", [annaId, sarahId], daysAgo(10), daysAgo(5), "content");
        await createTask("Blog-Redaktionsplan", p7, "in_progress", "high", [sarahId], daysAgo(3), daysFromNow(14), "content");
        await createTask("Video-Studio Setup", p7, "todo", "medium", [annaId], daysFromNow(3), daysFromNow(21), "development");
        await createTask("Podcast-Ausrüstung", p7, "todo", "low", [annaId], daysFromNow(7), daysFromNow(14), "other");
        console.log(`  Created 4 tasks for MediaWorks Content Hub`);
    }

    // Project 8: NordBau Digitalisierung
    if (p8) {
        await createTask("Prozessanalyse", p8, "done", "acute", [lukasId], daysAgo(3), daysAgo(1), "consulting");
        await createTask("Datenmodellierung", p8, "in_progress", "high", [lukasId, mainUserId], daysAgo(1), daysFromNow(10), "development");
        await createTask("Reporting-Tool Entwicklung", p8, "todo", "high", [mainUserId], daysFromNow(5), daysFromNow(25), "development");
        await createTask("Mitarbeiter-Schulung", p8, "todo", "medium", [lukasId], daysFromNow(20), daysFromNow(35), "consulting");
        await createTask("Mobile App Prototyp", p8, "todo", "medium", [mainUserId], daysFromNow(15), daysFromNow(40), "development");
        console.log(`  Created 5 tasks for NordBau Digitalisierung`);
    }

    console.log(`  Total tasks created: ${allTaskIds.length}`);

    // TIME ENTRIES
    console.log("\n[6/8] Creating time entries...");
    const allTasks = await apiGetAll(headers, "tasks");
    const taskPool = allTasks.filter(t => t.status !== "todo" || Math.random() > 0.5);

    // Get valid user IDs from the server
    const allUsers = await apiGetAll(headers, "users");
    const validUserIds = allUsers.map(u => u.id);
    console.log(`  Valid users available: ${validUserIds.length}`);

    let entryCount = 0;
    for (const task of taskPool.slice(0, 45)) {
        const numEntries = Math.random() > 0.6 ? 2 : 1;
        for (let e = 0; e < numEntries; e++) {
            const daysBack = randomInt(0, 25);
            const day = daysAgo(daysBack);
            const startHour = randomInt(8, 16);
            const duration = randomInt(15, 480);
            const startTime = new Date(day);
            startTime.setHours(startHour, randomInt(0, 59), 0, 0);
            const endTime = new Date(startTime.getTime() + duration * 60000);
            // Only use valid user IDs
            const assignee = validUserIds[randomInt(0, validUserIds.length - 1)];

            await apiPost(headers, "time_entries", {
                task: task.id,
                user: assignee,
                start_time: startTime.toISOString(),
                end_time: endTime.toISOString(),
                duration_minutes: duration,
                is_billable: Math.random() > 0.2,
                description: pick(
                    "Weiterentwicklung & Feinschliff",
                    "Code-Review & Optimierung",
                    "Abstimmung mit dem Kunden",
                    "Recherche & Konzeption",
                    "Implementierung",
                    "Testing & Qualit&auml;tssicherung",
                    "Dokumentation",
                    "Meeting & Koordination"
                )
            });
            entryCount++;
        }
    }
    console.log(`  Created ${entryCount} time entries`);

    // NOTIFICATIONS
    console.log("\n[7/8] Creating notifications...");
    const notifTypes = ["task_assigned", "task_due", "task_comment", "task_mention", "status_change", "project_update"];
    const notifTitles = {
        task_assigned: "Neue Aufgabe zugewiesen",
        task_due: "Aufgabe fällt bald fällig",
        task_comment: "Neuer Kommentar",
        task_mention: "Erwähnung in Kommentar",
        status_change: "Status geändert",
        project_update: "Projekt-Update"
    };
    const notifMessages = {
        task_assigned: "Ihnen wurde eine neue Aufgabe zugewiesen.",
        task_due: "Eine Aufgabe ist bald fällig.",
        task_comment: "Es gibt einen neuen Kommentar zu einer Aufgabe.",
        task_mention: "Sie wurden in einem Kommentar erwähnt.",
        status_change: "Der Status einer Aufgabe wurde geändert.",
        project_update: "Es gibt ein Update zu einem Projekt."
    };

    for (const userId of [mainUserId, sarahId, lukasId, annaId].filter(Boolean)) {
        const numNotifs = randomInt(2, 4);
        for (let i = 0; i < numNotifs; i++) {
            const type = pick(...notifTypes);
            await apiPost(headers, "notifications", {
                user: userId,
                type: type,
                title: notifTitles[type],
                message: notifMessages[type],
                read: Math.random() > 0.5,
                link: "/tasks"
            });
        }
    }
    console.log(`  Created notifications for all users`);

    // EXTERNAL EXPENSES
    console.log("\n[8/8] Creating external expenses...");
    const expenseCategories = ["Hosting", "Lizenzen", "Tools", "Drittanbieter", "Werbekosten", "Server"];
    for (const proj of projects) {
        const numExpenses = randomInt(1, 3);
        for (let i = 0; i < numExpenses; i++) {
            await apiPost(headers, "external_expenses", {
                project: proj.id,
                amount: randomInt(50, 2000),
                description: pick("Monatliche Hosting-Gebühr", "Software-Lizenz", "Tool-Abonnement", "Drittanbieter-Service", "Server-Kosten", "Domain-Gebühr"),
                category: pick(...expenseCategories)
            });
        }
    }
    console.log(`  Created external expenses for all projects`);

    // REPORT TEMPLATES
    console.log("\n[*] Creating report templates...");
    await apiPost(headers, "report_templates", {
        name: "Wochenbericht Standard",
        user: mainUserId,
        config: JSON.stringify({
            dateRange: "last_week",
            groupBy: "project",
            showCharts: true,
            showBillable: true,
            includeSummary: true
        })
    });
    await apiPost(headers, "report_templates", {
        name: "Monatsabrechnung Kunden",
        user: mainUserId,
        config: JSON.stringify({
            dateRange: "last_month",
            groupBy: "client",
            showCharts: true,
            showBillable: true,
            includeSummary: true,
            billingReady: true
        })
    });
    console.log(`  Created 2 report templates`);

    // SUMMARY
    console.log("\n============================================");
    console.log("  DEMO DATA POPULATION COMPLETE!");
    console.log("============================================");
    console.log(`  Users: ${validUserIds.length}`);
    console.log(`  Clients: ${clients.length}`);
    console.log(`  Projects: ${projects.length}`);
    console.log(`  Tasks: ${allTaskIds.length}`);
    console.log(`  Time entries: ${entryCount}`);
    console.log(`  External expenses: created`);
    console.log(`  Notifications: created`);
    console.log(`  Report templates: 2`);
    console.log(`  Task links: created`);
    console.log(`  Checklist items: created`);
    console.log(`  Task comments: created`);
    console.log("\n  Login at: https://aworkremaster-production.up.railway.app");
    console.log(`  Email: ${email}`);
    console.log(`  Additional users: sarah.meier@agentur.de, lukas.wagner@agentur.de, anna.schneider@agentur.de`);
    console.log(`  Password for all: ***REMOVED***`);
    console.log("============================================\n");
}

// Need randomInt and pick helpers
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick(...items) {
    return items[Math.floor(Math.random() * items.length)];
}

populateData().catch(console.error);
