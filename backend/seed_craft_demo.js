/**
 * Vibeforce One — Seed Craft Demo Data (Craft OS Stack)
 * 
 * Populates authentic German construction & craft (Handwerk / Baustelle) data:
 * - Superuser & Meister Account (***REMOVED*** / ***)
 * - Handwerker-Team (Meister, Vorarbeiter, Gesellen, Azubi)
 * - Handwerker-Stundensätze (Meister 82,50€, Geselle 64,00€, Azubi 38,00€)
 * - Bauherren & Auftraggeber mit § 13b UStG & § 48b EStG Status:
 *   1. Familie Huber (Privater Bauherr, kein § 48b, Regelbesteuerung)
 *   2. Gewerbebau Schmidt GmbH (Bauträger, § 13b Reverse Charge, § 48b Freistellung)
 *   3. Wohnbau Südost eG (Generalunternehmer GU)
 * - Baustellen (projects mit type: 'craft', Geofencing GPS, Adresse)
 * - Bautagebuch (site_reports mit Wetter, Monteuren, VOB/B § 6 Behinderungsanzeige)
 * - DIN 18299 VOB-Aufmaß (measurements mit Formeln und Mengen)
 * - GAEB Leistungsverzeichnis (gaeb_positions)
 * - Mängel & Montage-Aufgaben (tasks nach VOB/B § 13)
 * 
 * Target: Craft OS Backend (default: http://127.0.0.1:8091)
 */

const baseUrl = process.argv[2] || process.env.POCKETBASE_URL || "http://127.0.0.1:8091";
const ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL || "***REMOVED***";
const ADMIN_PASSWORD = process.env.PB_ADMIN_PASSWORD || process.env.PB_ADMIN_PASSWORD;

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
  console.log("🔨 Vibeforce Craft OS — Handwerk & Baustellen Demo Seeder");
  console.log(`Target: ${baseUrl}`);
  console.log("=============================================================================\n");

  // 1. Authenticate Superuser
  console.log("[1/8] Authenticating Superuser...");
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

  // 2. Ensure Robin Lehnebach (Meister / Bauleiter) in 'users'
  console.log("\n[2/8] Ensuring Meister user account exists in 'users'...");
  let meisterUserId = null;
  try {
    const users = await api("GET", `/api/collections/users/records?filter=(email='${ADMIN_EMAIL}')`, null, adminToken);
    if (users.items && users.items.length > 0) {
      meisterUserId = users.items[0].id;
      console.log(`  ℹ️ Meister account already exists: ${meisterUserId}`);
    } else {
      const created = await api("POST", "/api/collections/users/records", {
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        passwordConfirm: ADMIN_PASSWORD,
        name: "Robin Lehnebach (Zimmermeister)",
        role: "admin",
        verified: true,
      }, adminToken);
      meisterUserId = created.id;
      console.log(`  ✅ Created Meister account: ${meisterUserId}`);
    }
  } catch (e) {
    console.warn(`  ⚠️ User check warning: ${e.message}`);
  }

  // Craft Workers (Monteure, Gesellen, Azubi)
  const craftTeam = [
    { name: "Thomas Huber (Vorarbeiter)", email: "t.huber@craft-bau.de", role: "manager" },
    { name: "Michael Bauer (Geselle Holzbau)", email: "m.bauer@craft-bau.de", role: "employee" },
    { name: "Florian Weber (Trockenbaumonteur)", email: "f.weber@craft-bau.de", role: "employee" },
    { name: "Jonas Schmidt (Azubi 2. Lehrjahr)", email: "j.schmidt@craft-bau.de", role: "employee" },
  ];

  for (const member of craftTeam) {
    try {
      const existing = await api("GET", `/api/collections/users/records?filter=(email='${member.email}')`, null, adminToken);
      if (!existing.items || existing.items.length === 0) {
        await api("POST", "/api/collections/users/records", {
          email: member.email,
          password: process.env.SEED_CRAFT_DEMO_PASSWORD,
          passwordConfirm: process.env.SEED_CRAFT_DEMO_PASSWORD,
          name: member.name,
          role: member.role,
          verified: true,
        }, adminToken);
        console.log(`  ✅ Added craft worker: ${member.name}`);
      }
    } catch {
      // Continue
    }
  }

  // 3. Craft Hourly Rates (craft_hourly_rates)
  console.log("\n[3/8] Seeding Craft Hourly Rates...");
  const rates = [
    { role_name: "Meister / Bauleiter", internal_cost: 45.0, billing_rate: 82.50, description: "Bauleitung, VOB-Aufmaß, Behördenabnahmen" },
    { role_name: "Vorarbeiter / Polier", internal_cost: 38.0, billing_rate: 74.00, description: "Baustellenleitung vor Ort" },
    { role_name: "Facharbeiter / Geselle", internal_cost: 32.0, billing_rate: 64.00, description: "Fachmontage, Holzbau, Trockenbau" },
    { role_name: "Monteur / Bauhelfer", internal_cost: 26.0, billing_rate: 52.00, description: "Materialtransport, Zuarbeit" },
    { role_name: "Auszubildender (Azubi)", internal_cost: 16.0, billing_rate: 38.00, description: "Ausbildungsstundensatz" },
  ];

  for (const r of rates) {
    await safePost("craft_hourly_rates", r, adminToken);
  }
  console.log(`  ✅ Configured ${rates.length} craft hourly rates.`);

  // 4. Bauherren & Auftraggeber mit § 13b / § 48b Status
  console.log("\n[4/8] Seeding Bauherren & Auftraggeber (§ 13b & § 48b)...");
  const craftClients = [
    {
      name: "Familie Markus Huber",
      company: "Bauvorhaben Huber Riemerling",
      contact_person: "Herr Markus Huber (Bauherr)",
      client_type: "privat",
      email: "markus.huber@t-online.de",
      phone: "+49 89 12345678",
      address: "Sonnenweg 14, 85521 Riemerling",
      has_48b_certificate: false,
      vat_id: "",
      auftragsvolumen: 148500,
      kundenstatus: "aktiv",
      notes: "Neubau KfW-40 Plus Einfamilienhaus in Holzständerbauweise. Privater Bauherr (Regelbesteuerung 19%, kein § 13b Reverse Charge).",
    },
    {
      name: "Gewerbebau Schmidt GmbH & Co. KG",
      company: "Gewerbebau Schmidt GmbH & Co. KG",
      contact_person: "Dipl.-Ing. Ralf Schmidt (Oberbauleitung)",
      client_type: "bautraeger",
      email: "bauleitung@schmidt-gewerbebau.de",
      phone: "+49 89 98765432",
      address: "Industriestraße 88, 80935 München",
      has_48b_certificate: true,
      vat_id: "DE318920441",
      auftragsvolumen: 340000,
      kundenstatus: "aktiv",
      notes: "Gültige Freistellungsbescheinigung nach § 48b EStG liegt vor bis 31.12.2027. Zwingend Netto-Rechnungen mit Vermerk 'Steuerschuldnerschaft des Leistungsempfängers gem. § 13b UStG' ausstellen!",
    },
    {
      name: "Wohnbau Südost eG",
      company: "Wohnbau Südost eG",
      contact_person: "Frau Sabine Wächter (Projektsteuerung)",
      client_type: "gu",
      email: "projekte@wohnbau-suedost.de",
      phone: "+49 89 44556677",
      address: "Rosenheimer Str. 45, 81667 München",
      has_48b_certificate: true,
      vat_id: "DE298114002",
      auftragsvolumen: 215000,
      kundenstatus: "aktiv",
      notes: "Generalunternehmer Sanierung 24 Wohneinheiten. Freistellung § 48b gültig.",
    }
  ];

  const createdClients = [];
  for (const c of craftClients) {
    try {
      const existing = await api("GET", `/api/collections/clients/records?filter=(name='${c.name}')`, null, adminToken);
      if (existing.items && existing.items.length > 0) {
        createdClients.push(existing.items[0]);
      } else {
        const rec = await safePost("clients", c, adminToken);
        if (rec) {
          createdClients.push(rec);
          console.log(`  ✅ Bauherr created: ${rec.name} (${c.client_type})`);
        }
      }
    } catch {
      // Continue
    }
  }

  // 5. Baustellen & Bauvorhaben (projects mit type: 'craft' & GPS)
  console.log("\n[5/8] Seeding Baustellen & Geofencing GPS...");
  const huberClientId = createdClients[0]?.id;
  const schmidtClientId = createdClients[1]?.id;

  const craftProjects = [
    {
      name: "Neubau EFH Familie Huber (Dachstuhl & Holzbau)",
      key: "HUB-01",
      type: "craft",
      craft_category: "Zimmerei & Holzbau",
      status: "in_progress",
      client: huberClientId,
      site_address: "Sonnenweg 14, 85521 Riemerling",
      geofence_lat: 48.0645,
      geofence_lng: 11.6821,
      geofence_radius: 120,
      budget: 148500,
      start_date: "2026-03-01",
      end_date: "2026-07-31",
      description: "Errichtung eines zweigeschossigen Holzständerbaus, Abbund und Aufrichten des Satteldachs mit Aufsparrendämmung.",
    },
    {
      name: "Sanierung Gewerbehalle Schmidt (Brandschutz F90 & Trockenbau)",
      key: "SCH-02",
      type: "craft",
      craft_category: "Trockenbau & Brandschutz",
      status: "in_progress",
      client: schmidtClientId,
      site_address: "Industriestraße 88, 80935 München",
      geofence_lat: 48.1950,
      geofence_lng: 11.5540,
      geofence_radius: 150,
      budget: 340000,
      start_date: "2026-02-15",
      end_date: "2026-09-30",
      description: "Brandschutztechnische Ertüchtigung Decken und Träger F90-A nach DIN 4102. Trockenbauwände F90 in Hallenabschnitt 1-3 gem. VOB/C.",
    }
  ];

  const createdProjects = [];
  for (const p of craftProjects) {
    try {
      const existing = await api("GET", `/api/collections/projects/records?filter=(key='${p.key}')`, null, adminToken);
      if (existing.items && existing.items.length > 0) {
        createdProjects.push(existing.items[0]);
      } else {
        const rec = await safePost("projects", p, adminToken);
        if (rec) {
          createdProjects.push(rec);
          console.log(`  ✅ Baustelle created: ${rec.name} (${rec.key})`);
        }
      }
    } catch {
      // Continue
    }
  }

  const p1 = createdProjects[0]?.id;
  const p2 = createdProjects[1]?.id;

  // 6. Bautagebuch & VOB/B § 6 Behinderungsanzeigen
  console.log("\n[6/8] Seeding Bautagebuch & VOB/B § 6 Berichte...");
  const siteReports = [
    {
      project: p1,
      report_date: new Date().toISOString().split('T')[0],
      weather: "Sonnig, trocken",
      temperature: 19,
      workers_count: 4,
      performed_work: "Aufrichten Dachstuhl Achse 1 bis 5 abgeschlossen. Richten der Pfetten und Einbau der Firstlaschen gem. Ausführungsstatik. Kerven nachgearbeitet.",
      special_events: "Baustellenbegehung durch Statiker Herrn Dr. Krause um 14:00 Uhr. Freigabe der Dachkonstruktion zur Eindeckung erteilt.",
      has_obstruction: false,
    },
    {
      project: p2,
      report_date: new Date().toISOString().split('T')[0],
      weather: "Leichter Regen",
      temperature: 15,
      workers_count: 5,
      performed_work: "Montage Unterkonstruktion Deckenbekleidung F90 in Hallenabschnitt 2 Achse 4-6.",
      special_events: "Vorunternehmer Lüftungsmontage vor Ort angetroffen.",
      has_obstruction: true,
      obstruction_text: "VOB/B § 6 Behinderungsanzeige: Vorunternehmer TGA hat Leitungsverlegung in Achse 7 nicht wie vereinbart fertiggestellt. Montage Deckenbekleidung in Achse 7-9 unterbrochen. Behinderung angezeigt an Bauleitung Schmidt per E-Mail um 11:30 Uhr.",
    }
  ];

  for (const rep of siteReports) {
    if (rep.project) {
      await safePost("site_reports", rep, adminToken);
    }
  }
  console.log(`  ✅ Created ${siteReports.length} Bautagesberichte with VOB/B § 6 obstruction notification.`);

  // 7. DIN 18299 VOB-Aufmaßzeilen (measurements)
  console.log("\n[7/8] Seeding DIN 18299 VOB-Aufmaßzeilen & GAEB...");
  const measurements = [
    { project: p1, title: "Sparrenlage Achse 1-4 (DIN 18299)", formula: "14 * 6.20 * 0.16", result: 13.888, unit: "m³" },
    { project: p1, title: "Firstpfette BSH 20/36", formula: "18.50 * 0.20 * 0.36", result: 1.332, unit: "m³" },
    { project: p1, title: "Unterdeckplatten Agepan DWD 16mm", formula: "2 * (14.20 * 6.50)", result: 184.60, unit: "m²" },
    { project: p2, title: "F90 Brandschutzbekleidung Stahlträger HEA 300", formula: "24.00 * 1.35", result: 32.40, unit: "m²" },
    { project: p2, title: "F90 Deckenbekleidung Promat 2-lagig", formula: "38.50 * 12.00", result: 462.00, unit: "m²" },
  ];

  for (const m of measurements) {
    if (m.project) {
      await safePost("measurements", m, adminToken);
    }
  }

  // GAEB Positionen
  const gaebPositions = [
    { project: p1, pos_number: "01.01.0010", short_text: "Richten Dachstuhl Nadelholz C24 nach Statik", qty: 26.5, unit: "m³", unit_price: 980.00 },
    { project: p1, pos_number: "01.01.0020", short_text: "Unterspannbahn diffusionsresistent liefern u. verlegen", qty: 220.0, unit: "m²", unit_price: 16.50 },
    { project: p2, pos_number: "02.01.0010", short_text: "F90-A Brandschutzbekleidung Stahlträger", qty: 140.0, unit: "m²", unit_price: 72.00 },
    { project: p2, pos_number: "02.01.0020", short_text: "Trockenbauwand F90 125mm beidseitig 2-lagig", qty: 310.0, unit: "m²", unit_price: 68.50 },
  ];

  for (const g of gaebPositions) {
    if (g.project) {
      await safePost("gaeb_positions", g, adminToken);
    }
  }
  console.log(`  ✅ Created ${measurements.length} DIN 18299 Aufmaßzeilen & ${gaebPositions.length} GAEB Positionen.`);

  // 8. Mängel & Montage-Aufgaben (VOB/B § 13)
  console.log("\n[8/8] Seeding Baustellen-Aufgaben & VOB/B § 13 Mängel...");
  const craftTasks = [
    { title: "VOB/B § 13 Mangel: Dampfbremse Durchdringung Kamin nachkleben", project: p1, status: "todo", priority: "acute", estimated_hours: 3 },
    { title: "Gerüstfreigabe Gerüstbau Müller kontrollieren", project: p1, status: "done", priority: "high", estimated_hours: 2 },
    { title: "Lieferung Schalungsholz Giebelwand prüfen", project: p1, status: "in_progress", priority: "medium", estimated_hours: 4 },
    { title: "VOB-Schlussaufmaß Deckenbekleidung mit Bauleiter Schmidt terminieren", project: p2, status: "todo", priority: "high", estimated_hours: 4 },
    { title: "Brandschutzkitt F90 an Kabeldurchführungen nachbessern", project: p2, status: "in_progress", priority: "acute", estimated_hours: 6 },
  ];

  for (const t of craftTasks) {
    if (t.project) {
      await safePost("tasks", t, adminToken);
    }
  }
  console.log(`  ✅ Added ${craftTasks.length} craft tasks and VOB/B § 13 defects.`);

  console.log("\n=============================================================================");
  console.log("🎉 Craft OS Demo Data Seed successfully completed!");
  console.log("=============================================================================\n");
}

main().catch(err => {
  console.error("Craft seed error:", err);
  process.exit(1);
});
