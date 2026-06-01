/**
 * Railway First-Run Seed Script
 * 
 * Läuft nur beim allerersten Start (wenn kein Admin existiert).
 * Erstellt Superuser, Demo-User, Projekte, Tasks und Time-Entries.
 * 
 * Aufruf: node seed_first_run.js <baseUrl>
 */

const baseUrl = process.argv[2] || "http://127.0.0.1:8080";
const ADMIN_EMAIL = "admin@vibeforce-flow.de";
const ADMIN_PASSWORD = "***REMOVED***";

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

    // ── 1. Authenticate as superuser (created by entrypoint.sh CLI) ──
    // PocketBase v0.23+: admins → _superusers collection
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
        // PocketBase v0.37 requires passwordConfirm alongside password
        const rec = await api("POST", "/api/collections/users/records", {
            ...u,
            passwordConfirm: u.password,
        }, adminToken);
        userIds[u.email] = rec.id;
        console.log(`  User: ${u.name} (${rec.id})`);
    }

    // ── 3. Create clients ──
    console.log("\n[3] Creating demo clients...");
    const clientDefs = [
        { name: "DigitalPulse GmbH", stundenhonorar: 150, status: "active", is_billable_default: true },
        { name: "Musterfirma AG", stundenhonorar: 175, status: "active", is_billable_default: true },
        { name: "Technik Solutions", stundenhonorar: 200, status: "active", is_billable_default: true },
        { name: "Beta Group e.K.", stundenhonorar: 130, status: "active", is_billable_default: true },
    ];

    const clientIds = {};
    for (const c of clientDefs) {
        const rec = await api("POST", "/api/collections/clients/records", c, adminToken);
        clientIds[c.name] = rec.id;
        console.log(`  Client: ${c.name}`);
    }

    // ── 4. Create projects ──
    console.log("\n[4] Creating demo projects...");
    const projectDefs = [
        { name: "Webseite Relaunch", key: "WEB", client: clientIds["Musterfirma AG"], status: "active", description: "Kompletter Relaunch der Firmenwebseite mit neuem CMS." },
        { name: "SEO-Optimierung", key: "SEO", client: clientIds["Technik Solutions"], status: "active", description: "Laufende SEO-Maßnahmen und Content-Optimierung." },
        { name: "Social Media Kampagne", key: "SMC", client: clientIds["Musterfirma AG"], status: "active", description: "Quartalsweise Social-Media-Kampagne für Produkteinführung." },
        { name: "Tracking-Integration", key: "TRK", client: clientIds["Beta Group e.K."], status: "active", description: "Implementierung von Tracking-Pixeln und Analytics." },
        { name: "Awork Remastered", key: "AWR", client: clientIds["DigitalPulse GmbH"], status: "active", description: "Self-Tracking-Projekt für die Weiterentwicklung.", project_type: "development", is_billable: false },
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

    // ── 5. Create tasks ──
    console.log("\n[5] Creating demo tasks...");
    const today = new Date();

    function d(n) { const d = new Date(today); d.setDate(d.getDate() + n); return d.toISOString(); }

    const taskDefs = [
        // Webseite Relaunch
        { project: "WEB", title: "Design-Konzept erstellen", status: "done", priority: "high", assignee: "anna.schneider@agentur.de", estimated_hours: 16 },
        { project: "WEB", title: "Startseite umsetzen", status: "in_progress", priority: "high", assignee: "sarah.meier@agentur.de", estimated_hours: 24 },
        { project: "WEB", title: "Unterseiten-Templates", status: "todo", priority: "medium", assignee: "lukas.wagner@agentur.de", estimated_hours: 12 },
        { project: "WEB", title: "CMS-Integration", status: "todo", priority: "high", assignee: "lukas.wagner@agentur.de", estimated_hours: 20 },
        { project: "WEB", title: "Mobile Optimierung", status: "review", priority: "medium", assignee: "sarah.meier@agentur.de", estimated_hours: 8 },
        // SEO
        { project: "SEO", title: "Keyword-Recherche Q2", status: "done", priority: "high", assignee: "lukas.wagner@agentur.de", estimated_hours: 10 },
        { project: "SEO", title: "On-Page Optimierung", status: "in_progress", priority: "acute", assignee: "lukas.wagner@agentur.de", estimated_hours: 20 },
        { project: "SEO", title: "Backlink-Aufbau", status: "in_progress", priority: "medium", assignee: "carl@vibeforce.de", estimated_hours: 15 },
        { project: "SEO", title: "Monatsreport Mai", status: "todo", priority: "high", assignee: "lukas.wagner@agentur.de", estimated_hours: 4 },
        // Social Media
        { project: "SMC", title: "Kampagnen-Strategie Q3", status: "in_progress", priority: "high", assignee: "sarah.meier@agentur.de", estimated_hours: 12 },
        { project: "SMC", title: "Ad-Creatives erstellen", status: "todo", priority: "medium", assignee: "anna.schneider@agentur.de", estimated_hours: 16 },
        { project: "SMC", title: "Targeting aufsetzen", status: "todo", priority: "medium", assignee: "sarah.meier@agentur.de", estimated_hours: 8 },
        // Tracking
        { project: "TRK", title: "Google Analytics Setup", status: "done", priority: "high", assignee: "carl@vibeforce.de", estimated_hours: 6 },
        { project: "TRK", title: "Conversion-Tracking", status: "in_progress", priority: "high", assignee: "carl@vibeforce.de", estimated_hours: 10 },
        { project: "TRK", title: "Dashboard-Einrichtung", status: "todo", priority: "medium", assignee: "carl@vibeforce.de", estimated_hours: 8 },
        // Awork Remastered
        { project: "AWR", title: "Darkmode & Theme-System Refactoring", status: "done", priority: "high", assignee: "sarah.meier@agentur.de", estimated_hours: 12 },
        { project: "AWR", title: "Gantt Timeline UI Upgrade", status: "in_progress", priority: "high", assignee: "lukas.wagner@agentur.de", estimated_hours: 20 },
        { project: "AWR", title: "Utilization-Rate-Report", status: "review", priority: "medium", assignee: "carl@vibeforce.de", estimated_hours: 8 },
        // Weitere Tasks für Webseite Relaunch
        { project: "WEB", title: "Responsive Tests", status: "todo", priority: "medium", assignee: "sarah.meier@agentur.de", estimated_hours: 10 },
        { project: "WEB", title: "Barrierefreiheit-Check", status: "todo", priority: "low", assignee: "anna.schneider@agentur.de", estimated_hours: 6 },
        // Weitere Tasks für SEO
        { project: "SEO", title: "Local SEO Optimierung", status: "todo", priority: "medium", assignee: "lukas.wagner@agentur.de", estimated_hours: 8 },
        { project: "SEO", title: "Google My Business Setup", status: "done", priority: "medium", assignee: "carl@vibeforce.de", estimated_hours: 4 },
        { project: "SEO", title: "Structured Data Integration", status: "in_progress", priority: "high", assignee: "lukas.wagner@agentur.de", estimated_hours: 12 },
        // Weitere Tasks für Social Media
        { project: "SMC", title: "Instagram Story Templates", status: "todo", priority: "low", assignee: "anna.schneider@agentur.de", estimated_hours: 6 },
        { project: "SMC", title: "Facebook Ads Budgetplanung", status: "in_progress", priority: "high", assignee: "sarah.meier@agentur.de", estimated_hours: 8 },
        { project: "SMC", title: "LinkedIn Thought-Leadership", status: "todo", priority: "medium", assignee: "sarah.meier@agentur.de", estimated_hours: 10 },
        // Weitere Tasks für Tracking
        { project: "TRK", title: "Hotjar Heatmap Setup", status: "todo", priority: "medium", assignee: "carl@vibeforce.de", estimated_hours: 4 },
        { project: "TRK", title: "UTM-Parameter Standards", status: "done", priority: "medium", assignee: "carl@vibeforce.de", estimated_hours: 3 },
        { project: "TRK", title: "Custom Events Tracking", status: "in_progress", priority: "high", assignee: "carl@vibeforce.de", estimated_hours: 10 },
        { project: "TRK", title: "Monthly Analytics Report", status: "review", priority: "medium", assignee: "carl@vibeforce.de", estimated_hours: 4 },
        // Weitere Tasks für Awork Remastered
        { project: "AWR", title: "Task Quick-Options Kontextmenü", status: "in_progress", priority: "high", assignee: "lukas.wagner@agentur.de", estimated_hours: 12 },
        { project: "AWR", title: "PDF Reportexport-Stundenreport", status: "done", priority: "high", assignee: "sarah.meier@agentur.de", estimated_hours: 10 },
        { project: "AWR", title: "Mobile Responsive Optimierung", status: "todo", priority: "medium", assignee: "anna.schneider@agentur.de", estimated_hours: 14 },
        { project: "AWR", title: "Notification System Upgrade", status: "in_progress", priority: "medium", assignee: "carl@vibeforce.de", estimated_hours: 8 },
        { project: "AWR", title: "Datenexport-Modul (CSV/PDF)", status: "todo", priority: "high", assignee: "lukas.wagner@agentur.de", estimated_hours: 16 },
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
        console.log(`  Task: ${t.title.substring(0, 40)}`);
    }

    // ── 6. Create time entries ──
    console.log("\n[6] Creating demo time entries...");
    const usersList = Object.values(userIds).filter(Boolean);
    const taskSample = taskIds;

    for (let i = 0; i < 80; i++) {
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
        } catch { /* best-effort for time entries */ }
    }
    console.log(`  Created ~80 time entries`);

    console.log("\n=== Seed complete! ===");
    console.log(`  Admin: ${ADMIN_EMAIL}`);
    console.log(`  Demo users password: ***REMOVED***`);
}

main().catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
});
