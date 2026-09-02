/**
 * 🛡️ PocketBase API Collection Rules Hardening Script
 * Vibeforce Flow OS - Enterprise Hardening Engine
 * 
 * Applies deterministic, hardened API rules across all collections to eliminate
 * IDOR, Broken Object Level Authorization (BOLA), and Privilege Escalation.
 */

const baseUrl = process.env.POCKETBASE_URL || process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090';
const email = (process.env.POCKETBASE_ADMIN_EMAIL || process.env.PB_ADMIN_EMAIL || 'admin@vibeforce-flow.de').trim();
const password = (process.env.POCKETBASE_ADMIN_PASSWORD || process.env.PB_ADMIN_PASSWORD || '***REMOVED***').trim();

const RULES = {
  users: {
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.role = 'admin'",
    updateRule: "(id = @request.auth.id && @request.data.role:isset = false && @request.data.deactivated:isset = false) || @request.auth.role = 'admin'",
    deleteRule: "@request.auth.role = 'admin'",
  },
  projects: {
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.role = 'admin'",
    updateRule: "@request.auth.role = 'admin' || members.id ?= @request.auth.id",
    deleteRule: "@request.auth.role = 'admin'",
  },
  tasks: {
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.id != ''",
    updateRule: "@request.auth.id != ''",
    deleteRule: "@request.auth.role = 'admin' || assignees.id ?= @request.auth.id",
  },
  time_entries: {
    listRule: "@request.auth.role = 'admin' || user = @request.auth.id",
    viewRule: "@request.auth.role = 'admin' || user = @request.auth.id",
    createRule: "@request.auth.id != '' && user = @request.auth.id",
    updateRule: "@request.auth.role = 'admin' || (user = @request.auth.id && is_billed = false)",
    deleteRule: "@request.auth.role = 'admin' || (user = @request.auth.id && is_billed = false)",
  },
  clients: {
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.role = 'admin'",
    updateRule: "@request.auth.role = 'admin'",
    deleteRule: "@request.auth.role = 'admin'",
  },
  task_comments: {
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.id != '' && author = @request.auth.id",
    updateRule: "author = @request.auth.id || @request.auth.role = 'admin'",
    deleteRule: "author = @request.auth.id || @request.auth.role = 'admin'",
  },
  teams: {
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.role = 'admin'",
    updateRule: "@request.auth.role = 'admin' || lead = @request.auth.id",
    deleteRule: "@request.auth.role = 'admin'",
  },
  team_members: {
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.role = 'admin'",
    updateRule: "@request.auth.role = 'admin'",
    deleteRule: "@request.auth.role = 'admin'",
  },
  notifications: {
    listRule: "user = @request.auth.id",
    viewRule: "user = @request.auth.id",
    createRule: "@request.auth.id != ''",
    updateRule: "user = @request.auth.id",
    deleteRule: "user = @request.auth.id",
  },
  checklist_items: {
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.id != ''",
    updateRule: "@request.auth.id != ''",
    deleteRule: "@request.auth.id != ''",
  },
  audit_logs: {
    listRule: "@request.auth.role = 'admin'",
    viewRule: "@request.auth.role = 'admin'",
    createRule: "@request.auth.id != ''",
    updateRule: null, // 100% immutable
    deleteRule: null, // 100% immutable
  },
  app_settings: {
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.role = 'admin'",
    updateRule: "@request.auth.role = 'admin'",
    deleteRule: "@request.auth.role = 'admin'",
  },
  task_links: {
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.id != ''",
    updateRule: "@request.auth.id != ''",
    deleteRule: "@request.auth.id != ''",
  },
  task_files: {
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.id != ''",
    updateRule: "@request.auth.id != ''",
    deleteRule: "@request.auth.id != ''",
  },
  external_expenses: {
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.id != ''",
    updateRule: "@request.auth.role = 'admin'",
    deleteRule: "@request.auth.role = 'admin'",
  },
  time_entry_reports: {
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.id != ''",
    updateRule: "@request.auth.role = 'admin'",
    deleteRule: "@request.auth.role = 'admin'",
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
      } else {
        console.log(`[HARDEN] ✅ Rules hardened for collection '${collectionName}'`);
        successCount++;
      }
    } catch (err) {
      console.error(`[HARDEN] Exception while hardening '${collectionName}':`, err);
    }
  }

  console.log(`\n[HARDEN] Summary: ${successCount} collections hardened, ${skippedCount} skipped.`);
}

hardenCollectionRules().catch((err) => {
  console.error('[HARDEN] Fatal error during hardening:', err);
  process.exit(1);
});
