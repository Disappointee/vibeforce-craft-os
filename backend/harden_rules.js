/**
 * 🛡️ PocketBase API Collection Rules Hardening Script
 * Vibeforce Flow OS - Enterprise Hardening Engine
 *
 * Applies deterministic, hardened API rules across all collections to eliminate
 * IDOR, Broken Object Level Authorization (BOLA), and Privilege Escalation.
 *
 * Block 2 (2026-10-22): Extended to cover ALL live collections, incl. the
 * previously public ones (commands, command_results, demo_sessions) and the
 * Craft collections (site_reports, measurements, evidence_items, invoices_zugferd,
 * ids_carts, craft_licenses, defect_pins). app_settings stays admin-only (do not loosen).
 *
 * Usage:
 *   POCKETBASE_ADMIN_EMAIL=... POCKETBASE_ADMIN_PASSWORD=... node backend/harden_rules.js
 *   POCKETBASE_URL=https://pb-... node backend/harden_rules.js
 */

const baseUrl = process.env.POCKETBASE_URL || process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090';
const email = (process.env.POCKETBASE_ADMIN_EMAIL || process.env.PB_ADMIN_EMAIL || '').trim();
const password = (process.env.POCKETBASE_ADMIN_PASSWORD || process.env.PB_ADMIN_PASSWORD || '').trim();

if (!email || !password) {
  console.error('[HARDEN] Missing superuser credentials. Set POCKETBASE_ADMIN_EMAIL/PB_ADMIN_EMAIL and POCKETBASE_ADMIN_PASSWORD/PB_ADMIN_PASSWORD.');
  process.exit(1);
}

const ADMIN = "@request.auth.role = 'admin'";
const AUTH = "@request.auth.id != ''";

const RULES = {
  // ---------------------------------------------------------------------------
  // Flow OS
  // ---------------------------------------------------------------------------
  users: {
    listRule: AUTH,
    viewRule: AUTH,
    createRule: ADMIN,
    updateRule: `(id = @request.auth.id && @request.body.role:isset = false && @request.body.deactivated:isset = false) || ${ADMIN}`,
    deleteRule: ADMIN,
  },
  projects: {
    listRule: AUTH,
    viewRule: AUTH,
    createRule: ADMIN,
    updateRule: `${ADMIN} || members.id ?= @request.auth.id`,
    deleteRule: ADMIN,
  },
  tasks: {
    listRule: AUTH,
    viewRule: AUTH,
    createRule: AUTH,
    updateRule: AUTH,
    deleteRule: `${ADMIN} || assignees.id ?= @request.auth.id`,
  },
  time_entries: {
    listRule: `${ADMIN} || user = @request.auth.id`,
    viewRule: `${ADMIN} || user = @request.auth.id`,
    createRule: `${AUTH} && user = @request.auth.id`,
    updateRule: `${ADMIN} || (user = @request.auth.id && is_billed = false)`,
    deleteRule: `${ADMIN} || (user = @request.auth.id && is_billed = false)`,
  },
  clients: {
    listRule: AUTH,
    viewRule: AUTH,
    createRule: ADMIN,
    updateRule: ADMIN,
    deleteRule: ADMIN,
  },
  task_comments: {
    listRule: AUTH,
    viewRule: AUTH,
    createRule: `${AUTH} && author = @request.auth.id`,
    updateRule: `author = @request.auth.id || ${ADMIN}`,
    deleteRule: `author = @request.auth.id || ${ADMIN}`,
  },
  teams: {
    listRule: AUTH,
    viewRule: AUTH,
    createRule: ADMIN,
    updateRule: `${ADMIN} || lead = @request.auth.id`,
    deleteRule: ADMIN,
  },
  team_members: {
    listRule: AUTH,
    viewRule: AUTH,
    createRule: `${ADMIN} || team.lead = @request.auth.id`,
    updateRule: `${ADMIN} || team.lead = @request.auth.id`,
    deleteRule: `${ADMIN} || team.lead = @request.auth.id`,
  },
  notifications: {
    listRule: 'user = @request.auth.id',
    viewRule: 'user = @request.auth.id',
    createRule: AUTH,
    updateRule: 'user = @request.auth.id',
    deleteRule: 'user = @request.auth.id',
  },
  checklist_items: {
    listRule: AUTH,
    viewRule: AUTH,
    createRule: AUTH,
    updateRule: AUTH,
    deleteRule: AUTH,
  },
  audit_logs: {
    listRule: ADMIN,
    viewRule: ADMIN,
    createRule: AUTH,
    updateRule: null, // 100% immutable
    deleteRule: null, // 100% immutable
  },
  app_settings: {
    // Admin-only on purpose (server actions read via admin PB) — do NOT loosen.
    listRule: ADMIN,
    viewRule: ADMIN,
    createRule: ADMIN,
    updateRule: ADMIN,
    deleteRule: ADMIN,
  },
  task_links: {
    listRule: AUTH,
    viewRule: AUTH,
    createRule: AUTH,
    updateRule: AUTH,
    deleteRule: AUTH,
  },
  task_files: {
    listRule: AUTH,
    viewRule: AUTH,
    createRule: AUTH,
    updateRule: AUTH,
    deleteRule: AUTH,
  },
  external_expenses: {
    listRule: AUTH,
    viewRule: AUTH,
    createRule: AUTH,
    updateRule: ADMIN,
    deleteRule: ADMIN,
  },
  time_entry_reports: {
    listRule: AUTH,
    viewRule: AUTH,
    createRule: AUTH,
    updateRule: ADMIN,
    deleteRule: ADMIN,
  },
  report_templates: {
    listRule: `@request.auth.id = user.id || ${ADMIN}`,
    viewRule: `@request.auth.id = user.id || ${ADMIN}`,
    createRule: AUTH,
    updateRule: `@request.auth.id = user.id || ${ADMIN}`,
    deleteRule: `@request.auth.id = user.id || ${ADMIN}`,
  },
  commands: {
    // Was fully public ("" rules) — admin only.
    listRule: ADMIN,
    viewRule: ADMIN,
    createRule: ADMIN,
    updateRule: ADMIN,
    deleteRule: ADMIN,
  },
  command_results: {
    // Was fully public ("" rules) — admin only.
    listRule: ADMIN,
    viewRule: ADMIN,
    createRule: ADMIN,
    updateRule: ADMIN,
    deleteRule: ADMIN,
  },
  demo_sessions: {
    // Was fully public ("" rules) — admin only (demo hub runs server-side).
    listRule: ADMIN,
    viewRule: ADMIN,
    createRule: ADMIN,
    updateRule: ADMIN,
    deleteRule: ADMIN,
  },
  // ---------------------------------------------------------------------------
  // Craft OS (same live DB)
  // ---------------------------------------------------------------------------
  craft_licenses: {
    listRule: AUTH,
    viewRule: AUTH,
    createRule: ADMIN,
    updateRule: ADMIN,
    deleteRule: ADMIN,
  },
  site_reports: {
    listRule: AUTH,
    viewRule: AUTH,
    createRule: `${AUTH} && author = @request.auth.id`,
    updateRule: `${ADMIN} || author = @request.auth.id`,
    deleteRule: `${ADMIN} || author = @request.auth.id`,
  },
  measurements: {
    listRule: AUTH,
    viewRule: AUTH,
    createRule: AUTH,
    updateRule: ADMIN,
    deleteRule: ADMIN,
  },
  evidence_items: {
    listRule: AUTH,
    viewRule: AUTH,
    createRule: AUTH,
    updateRule: ADMIN,
    deleteRule: ADMIN,
  },
  invoices_zugferd: {
    listRule: AUTH,
    viewRule: AUTH,
    createRule: ADMIN,
    updateRule: ADMIN,
    deleteRule: ADMIN,
  },
  ids_carts: {
    listRule: AUTH,
    viewRule: AUTH,
    createRule: ADMIN,
    updateRule: ADMIN,
    deleteRule: ADMIN,
  },
  defect_pins: {
    listRule: AUTH,
    viewRule: AUTH,
    createRule: AUTH,
    updateRule: ADMIN,
    deleteRule: ADMIN,
  },
};

async function hardenCollectionRules() {
  console.log(`[HARDEN] Connecting to PocketBase at: ${baseUrl}`);
  console.log(`[HARDEN] Authenticating as superuser: ${email}`);

  const authRes = await fetch(`${baseUrl}/api/collections/_superusers/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: email, password }),
  });

  if (!authRes.ok) {
    const errText = await authRes.text();
    throw new Error(`Superuser authentication failed (${authRes.status}): ${errText}`);
  }

  const authData = await authRes.json();
  const token = authData.token;
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  console.log(`[HARDEN] Superuser authenticated. Applying hardened rules...`);

  let successCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  for (const [collectionName, ruleSet] of Object.entries(RULES)) {
    try {
      const getRes = await fetch(`${baseUrl}/api/collections/${collectionName}`, { headers });
      if (!getRes.ok) {
        if (getRes.status === 404) {
          console.warn(`[HARDEN] Collection '${collectionName}' not found. Skipping.`);
          skippedCount++;
          continue;
        }
        const errText = await getRes.text();
        console.error(`[HARDEN] Failed to fetch '${collectionName}' (${getRes.status}): ${errText}`);
        failedCount++;
        continue;
      }

      const collection = await getRes.json();
      const updatedCollection = {
        ...collection,
        listRule: ruleSet.listRule !== undefined ? ruleSet.listRule : collection.listRule,
        viewRule: ruleSet.viewRule !== undefined ? ruleSet.viewRule : collection.viewRule,
        createRule: ruleSet.createRule !== undefined ? ruleSet.createRule : collection.createRule,
        updateRule: ruleSet.updateRule !== undefined ? ruleSet.updateRule : collection.updateRule,
        deleteRule: ruleSet.deleteRule !== undefined ? ruleSet.deleteRule : collection.deleteRule,
      };

      const patchRes = await fetch(`${baseUrl}/api/collections/${collectionName}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(updatedCollection),
      });

      if (!patchRes.ok) {
        const patchErr = await patchRes.text();
        console.error(`[HARDEN] Failed to update rules for '${collectionName}' (${patchRes.status}): ${patchErr}`);
        failedCount++;
      } else {
        console.log(`[HARDEN] ✅ Rules hardened for collection '${collectionName}'`);
        successCount++;
      }
    } catch (err) {
      console.error(`[HARDEN] Exception while hardening '${collectionName}':`, err);
      failedCount++;
    }
  }

  console.log(`\n[HARDEN] Summary: ${successCount} collections hardened, ${skippedCount} skipped (not found), ${failedCount} failed.`);
  if (failedCount > 0) process.exitCode = 2;
}

hardenCollectionRules().catch((err) => {
  console.error('[HARDEN] Fatal error during hardening:', err);
  process.exit(1);
});
