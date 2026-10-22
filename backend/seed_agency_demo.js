/**
 * Vibeforce One — Seed Agency Demo Data (Flow OS Stack)
 * 
 * Populates pure digital agency & professional services data:
 * - Admin credentials verification (***REMOVED*** / ***)
 * - Agency Team members (Designers, Developers, Marketing)
 * - Corporate & Digital Clients (Musterfirma AG, TechNova, GreenLife, FinTech Solutions)
 * - Agency Projects (Website Relaunch, SEO Sprint, UI Components, Investor Branding)
 * - Sprint Tasks & Time Entries
 * 
 * Target: Flow OS Backend (default: http://127.0.0.1:8090)
 */

const baseUrl = process.argv[2] || process.env.POCKETBASE_URL || "http://127.0.0.1:8090";
const ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL || "***REMOVED***";
const ADMIN_PASSWORD = process.env.PB_ADMIN_PASSWORD;

async function api(method, path, body, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const url = `${baseUrl}${path}`;
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${method} ${path} → ${res.status}: ${text.substring(0, 300)}`);
  }
  return await res.json();
}

async function safePost(collection, body, token) {
  try {
    return await api("POST", `/api/collections/${collection}/records`, body, token);
  } catch (err) {
    console.warn(`  ⚠️ Could not insert into ${collection}: ${err.message}`);
    return null;
  }
}

async function main() {
  console.log("=============================================================================");
  console.log("🚀 Vibeforce Flow OS — Agency Demo Data Seeder");
  console.log(`Target: ${baseUrl}`);
  console.log("=============================================================================\n");

  // 1. Authenticate Superuser
  console.log("[1/5] Authenticating Superuser...");
  let adminToken = null;
  const adminCandidates = [
    { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    { email: "admin@vibeforce.de", password: ADMIN_PASSWORD },
    { email: "admin@vibeforce-flow.de", password: ADMIN_PASSWORD },
  ];

  for (const candidate of adminCandidates) {
    try {
      const res = await api("POST", "/api/collections/_superusers/auth-with-password", {
        identity: candidate.email,
        password: candidate.password,
      });
      adminToken = res.token;
      console.log(`  ✅ Authenticated as superuser: ${candidate.email}`);
      break;
    } catch {
      // try next
    }
  }

  if (!adminToken) {
    console.error("  ❌ Superuser authentication failed. Ensure PocketBase is running on " + baseUrl);
    process.exit(1);
  }

  // 2. Ensure Primary User Account exists
  console.log("\n[2/5] Ensuring Robin Lehnebach admin user exists in 'users'...");
  let mainUserId = null;
  try {
    const users = await api("GET", `/api/collections/users/records?filter=(email='${ADMIN_EMAIL}')`, null, adminToken);
    if (users.items && users.items.length > 0) {
      mainUserId = users.items[0].id;
      console.log(`  ℹ️ Admin user already exists: ${mainUserId}`);
    } else {
      const created = await api("POST", "/api/collections/users/records", {
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        passwordConfirm: ADMIN_PASSWORD,
        name: "Robin Lehnebach",
        role: "admin",
        verified: true,
      }, adminToken);
      mainUserId = created.id;
      console.log(`  ✅ Created admin user: ${mainUserId}`);
    }
  } catch (e) {
    console.warn(`  ⚠️ User check warning: ${e.message}`);
  }

  // Additional Agency Team Members
  const agencyTeam = [
    { name: "Sarah Meier", email: "s.meier@flow-agency.de", role: "manager", expertise: ["Design", "Branding", "UI/UX"] },
    { name: "Lukas Wagner", email: "l.wagner@flow-agency.de", role: "employee", expertise: ["Frontend", "Next.js", "TypeScript"] },
    { name: "Anna Schneider", email: "a.schneider@flow-agency.de", role: "employee", expertise: ["SEO", "Performance Marketing", "Content"] },
  ];

  const teamUserIds = mainUserId ? [mainUserId] : [];
  for (const member of agencyTeam) {
    try {
      const existing = await api("GET", `/api/collections/users/records?filter=(email='${member.email}')`, null, adminToken);
      if (existing.items && existing.items.length > 0) {
        teamUserIds.push(existing.items[0].id);
      } else {
        const created = await api("POST", "/api/collections/users/records", {
          email: member.email,
          password: process.env.SEED_AGENCY_DEMO_PASSWORD,
          passwordConfirm: process.env.SEED_AGENCY_DEMO_PASSWORD,
          name: member.name,
          role: member.role,
          verified: true,
        }, adminToken);
        teamUserIds.push(created.id);
        console.log(`  ✅ Added team member: ${member.name}`);
      }
    } catch {
      // Continue
    }
  }

  // 3. Create Agency Clients
  console.log("\n[3/5] Seeding Agency Clients...");
  const agencyClients = [
    {
      name: "Musterfirma AG",
      company: "Musterfirma AG",
      email: "kontakt@musterfirma-ag.de",
      phone: "+49 30 12345678",
      address: "Friedrichstraße 100, 10117 Berlin",
      stundenhonorar: 165,
      auftragsvolumen: 68000,
      kundenstatus: "aktiv",
      abrechenbar: true,
    },
    {
      name: "TechNova Cloud GmbH",
      company: "TechNova Cloud GmbH",
      email: "management@technova-cloud.io",
      phone: "+49 89 55443322",
      address: "Leopoldstraße 24, 80802 München",
      stundenhonorar: 180,
      auftragsvolumen: 92000,
      kundenstatus: "aktiv",
      abrechenbar: true,
    },
    {
      name: "GreenLife Brand GmbH",
      company: "GreenLife Brand GmbH",
      email: "marketing@greenlife-brand.com",
      phone: "+49 40 88776655",
      address: "HafenCity Speicher 12, 20457 Hamburg",
      stundenhonorar: 150,
      auftragsvolumen: 34000,
      kundenstatus: "aktiv",
      abrechenbar: true,
    },
    {
      name: "FinTech Solutions AG",
      company: "FinTech Solutions AG",
      email: "partner@fintech-solutions.ch",
      phone: "+41 44 9988776",
      address: "Paradeplatz 8, 8001 Zürich",
      stundenhonorar: 210,
      auftragsvolumen: 120000,
      kundenstatus: "aktiv",
      abrechenbar: true,
    }
  ];

  const createdClients = [];
  for (const clientDef of agencyClients) {
    try {
      const existing = await api("GET", `/api/collections/clients/records?filter=(name='${clientDef.name}')`, null, adminToken);
      if (existing.items && existing.items.length > 0) {
        createdClients.push(existing.items[0]);
      } else {
        const rec = await safePost("clients", clientDef, adminToken);
        if (rec) {
          createdClients.push(rec);
          console.log(`  ✅ Client created: ${rec.name}`);
        }
      }
    } catch {
      // Continue
    }
  }

  // 4. Create Agency Projects
  console.log("\n[4/5] Seeding Agency Projects & Sprints...");
  const c1 = createdClients[0]?.id;
  const c2 = createdClients[1]?.id;
  const c3 = createdClients[2]?.id;

  const agencyProjects = [
    {
      name: "Website Relaunch 2026 & Headless CMS",
      key: "WEB-REL",
      type: "agency",
      status: "in_progress",
      client: c1,
      budget: 48000,
      hourly_rate: 165,
      start_date: "2026-01-15",
      end_date: "2026-06-30",
      description: "Kompletter Relaunch der Unternehmensseite auf Next.js 16, Tailwind CSS und headless CMS Integration.",
    },
    {
      name: "SEO & Growth Sprint Q3",
      key: "SEO-SPRINT",
      type: "agency",
      status: "in_progress",
      client: c3,
      budget: 22000,
      hourly_rate: 150,
      start_date: "2026-03-01",
      end_date: "2026-08-31",
      description: "Content-Cluster Strategie, Core Web Vitals Optimierung und SEA Search Ads Kampagnen.",
    },
    {
      name: "SaaS Design System & Component Library",
      key: "DS-2026",
      type: "agency",
      status: "in_progress",
      client: c2,
      budget: 55000,
      hourly_rate: 180,
      start_date: "2026-02-01",
      end_date: "2026-07-31",
      description: "Figma Tokens to Code Pipeline, Radix UI & Tailwind V4 Design System für alle Cloud-Produkte.",
    },
  ];

  const createdProjects = [];
  for (const proj of agencyProjects) {
    try {
      const existing = await api("GET", `/api/collections/projects/records?filter=(key='${proj.key}')`, null, adminToken);
      if (existing.items && existing.items.length > 0) {
        createdProjects.push(existing.items[0]);
      } else {
        const rec = await safePost("projects", proj, adminToken);
        if (rec) {
          createdProjects.push(rec);
          console.log(`  ✅ Project created: ${rec.name} (${rec.key})`);
        }
      }
    } catch {
      // Continue
    }
  }

  // 5. Create Tasks & Time Entries
  console.log("\n[5/5] Seeding Agency Tasks & Timesheets...");
  const p1 = createdProjects[0]?.id;
  const p2 = createdProjects[1]?.id;

  const demoTasks = [
    { title: "Wireframes & Information Architecture Freigabe", project: p1, status: "done", priority: "high", estimated_hours: 16 },
    { title: "Next.js App Router Setup & Auth Flow", project: p1, status: "in_progress", priority: "acute", estimated_hours: 24 },
    { title: "Responsive Navigation & Dark Mode Theme", project: p1, status: "in_progress", priority: "medium", estimated_hours: 12 },
    { title: "Core Web Vitals Audit & Lighthouse 95+ Check", project: p1, status: "todo", priority: "medium", estimated_hours: 8 },
    { title: "Keyword Recherche & Content-Cluster Matrix", project: p2, status: "done", priority: "high", estimated_hours: 20 },
    { title: "Landingpages A/B Testing Setup", project: p2, status: "in_progress", priority: "medium", estimated_hours: 14 },
  ];

  for (const task of demoTasks) {
    if (!task.project) continue;
    await safePost("tasks", task, adminToken);
  }
  console.log(`  ✅ Added ${demoTasks.length} agency tasks.`);

  console.log("\n=============================================================================");
  console.log("🎉 Agency Demo Data Seed finished successfully!");
  console.log("=============================================================================\n");
}

main().catch(err => {
  console.error("Seed execution failed:", err);
  process.exit(1);
});
