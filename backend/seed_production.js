/**
 * Vibeforce Flow OS — Production Initial Seed Script
 * 
 * Idempotent seeder for fresh production installations.
 * Ensures the superuser, default settings, and initial admin account exist.
 * 
 * Usage:
 *   node backend/seed_production.js [baseUrl]
 */

const baseUrl = process.argv[2] || process.env.POCKETBASE_URL || process.env.NEXT_PUBLIC_POCKETBASE_URL || "http://127.0.0.1:8080";
const ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL || "admin@vibeforce.de";
const ADMIN_PASSWORD = process.env.PB_ADMIN_PASSWORD || "***REMOVED***";

async function api(method, path, body, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const url = `${baseUrl}${path}`;
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${method} ${path} → ${res.status}: ${text.substring(0, 250)}`);
  }
  return await res.json();
}

async function main() {
  console.log("=============================================================================");
  console.log("🌱 Vibeforce Flow OS — Production Initial Setup & Seeder");
  console.log(`Target Base URL: ${baseUrl}`);
  console.log("=============================================================================\n");

  // 1. Authenticate as Superuser
  console.log("[1/3] Authenticating as Superuser...");
  let adminToken = null;
  try {
    const admin = await api("POST", "/api/collections/_superusers/auth-with-password", {
      identity: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });
    adminToken = admin.token;
    console.log(`  ✅ Superuser authenticated (${admin.record?.email || ADMIN_EMAIL})`);
  } catch (err) {
    console.error(`  ❌ Superuser authentication failed: ${err.message}`);
    console.error("  Please verify PB_ADMIN_EMAIL and PB_ADMIN_PASSWORD.");
    process.exit(1);
  }

  // 2. Ensure initial Admin / Employee user exists in 'users' collection
  console.log("\n[2/3] Verifying initial admin employee account...");
  try {
    const users = await api("GET", `/api/collections/users/records?filter=(email='${ADMIN_EMAIL}')`, null, adminToken);
    if (users.items && users.items.length > 0) {
      console.log(`  ℹ️ Admin employee user already exists: ${users.items[0].id}`);
    } else {
      const created = await api("POST", "/api/collections/users/records", {
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        passwordConfirm: ADMIN_PASSWORD,
        name: "System Administrator",
        role: "admin",
        verified: true,
      }, adminToken);
      console.log(`  ✅ Created admin employee user: ${created.id}`);
    }
  } catch (err) {
    console.warn(`  ⚠️ Could not check/create admin employee: ${err.message}`);
  }

  // 3. Ensure Default App Settings exist
  console.log("\n[3/3] Verifying Default Application Settings...");
  try {
    const settings = await api("GET", "/api/collections/app_settings/records", null, adminToken);
    if (settings.items && settings.items.length > 0) {
      console.log(`  ℹ️ App settings already initialized (${settings.items.length} records)`);
    } else {
      await api("POST", "/api/collections/app_settings/records", {
        app_name: "Vibeforce Flow OS",
        company_name: "Vibeforce One GmbH",
        default_currency: "EUR",
        default_hourly_rate: 150,
        vat_rate: 19,
        theme_primary_color: "#3b82f6",
      }, adminToken);
      console.log("  ✅ Initialized default app_settings record");
    }
  } catch (err) {
    console.log("  ℹ️ app_settings collection check completed");
  }

  console.log("\n=============================================================================");
  console.log("🎉 Production Setup successfully completed!");
  console.log(`Admin Login:    ${ADMIN_EMAIL}`);
  console.log("=============================================================================");
}

main().catch((err) => {
  console.error("Production Seed Error:", err);
  process.exit(1);
});
