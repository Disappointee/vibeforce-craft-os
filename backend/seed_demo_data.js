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
const ADMIN_EMAIL = "***REMOVED***";
const ADMIN_PASSWORD = "***REMOVED***";

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
        { email: "demo001@vibeforce.de", password: genPassword(), name: "Alex Meier", role: "employee" },
        { email: "demo002@vibeforce.de", password: genPassword(), name: "Sarah Schmidt", role: "employee" },
        { email: "demo003@vibeforce.de", password: genPassword(), name: "Tom Weber", role: "manager" },
        { email: "demo004@vibeforce.de", password: genPassword(), name: "Lisa Fischer", role: "employee" },
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

    // ── 3. Create clients ──
    console.log("[3] Creating demo clients...");
    const clientDefs = [
        { name: "TechNova GmbH", company: "TechNova GmbH", email: "kontakt@technova.de", branch: "IT", stundenhonorar: 150, status: "aktiv", is_billable_default: true },
        { name: "GreenLife AG", company: "GreenLife AG", email: "info@greenlife.de", branch: "Nachhaltigkeit", stundenhonorar: 175, status: "aktiv", is_billable_default: true },
        { name: "Urban Architects", company: "Urban Architects", email: "office@urban-architects.de", branch: "Architektur", stundenhonorar: 200, status: "aktiv", is_billable_default: true },
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

    // ── 4. Create projects ──
    console.log("[4] Creating demo projects...");
    const allUserIds = Object.values(userIds);
    const projectDefs = [
        { name: "Projekt Alpha", key: "PA", client: clientIds["TechNova GmbH"], status: "active", description: "Full-Service Digitalstrategie mit Schwerpunkt SEO und Content-Marketing.", budget_hours: 120 },
        { name: "Digital Campaign 2026", key: "DC", client: clientIds["GreenLife AG"], status: "active", description: "Ganzjahres-Kampagne für nachhaltige Produkte mit Social-Media-Fokus.", budget_hours: 80 },
        { name: "Website Relaunch", key: "WR", client: clientIds["Urban Architects"], status: "active", description: "Kompletter Relaunch inkl. neuem CMS, Portfolio-Showcase und 3D-Visualisierungen.", budget_hours: 200 },
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

    // ── 5. Create tasks (15) ──
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

    // ── 6. Create time entries (30) ──
    console.log("[6] Creating demo time entries...");
    let entryCount = 0;
    for (let i = 0; i < 30; i++) {
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

    // ── 7. Output credentials ──
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
