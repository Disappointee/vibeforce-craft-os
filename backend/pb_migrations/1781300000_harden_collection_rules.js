/// <reference path="../pb_data/types.d.ts" />
/**
 * Block 2 (2026-10-22) — Harden collection API rules.
 *
 * Mirrors `backend/harden_rules.js` so that fresh instances start with the same
 * hardened rules that were applied to the live instance (audit P1-1..P1-5):
 *   - commands / command_results / demo_sessions: were public ("") → admin only
 *   - time_entry_reports: delete/update tautology → admin only
 *   - audit_logs: view/list → admin only, update/delete locked
 *   - time_entries: scoped per user (admin bypass)
 *   - tasks: delete only admin or assignee
 *   - clients: create/update/delete admin only
 *   - craft collections: author/admin scoping, CUD admin where server-side only
 *
 * Idempotent: collections that do not exist on a fresh instance are skipped.
 */
migrate((app) => {
    const ADMIN = "(@request.auth.role = 'admin' || @request.auth.role = 'meister')";
    const AUTH = "@request.auth.id != ''";

    const RULES = {
        users: {
            authRule: "deactivated != true",
            listRule: AUTH,
            viewRule: AUTH,
            createRule: ADMIN,
            updateRule: "(id = @request.auth.id && @request.body.role:isset = false && @request.body.deactivated:isset = false && @request.body.hourly_rate:isset = false && @request.body.supervisor:isset = false && @request.body.verified:isset = false) || " + ADMIN,
            deleteRule: ADMIN,
        },
        projects: {
            listRule: AUTH,
            viewRule: AUTH,
            createRule: ADMIN,
            updateRule: ADMIN + " || members.id ?= @request.auth.id",
            deleteRule: ADMIN,
        },
        tasks: {
            listRule: AUTH,
            viewRule: AUTH,
            createRule: AUTH,
            updateRule: AUTH,
            deleteRule: ADMIN + " || assignees.id ?= @request.auth.id",
        },
        time_entries: {
            listRule: ADMIN + " || user = @request.auth.id",
            viewRule: ADMIN + " || user = @request.auth.id",
            createRule: AUTH + " && user = @request.auth.id",
            updateRule: ADMIN + " || (user = @request.auth.id && is_billed = false)",
            deleteRule: ADMIN + " || (user = @request.auth.id && is_billed = false)",
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
            createRule: AUTH + " && author = @request.auth.id",
            updateRule: "author = @request.auth.id || " + ADMIN,
            deleteRule: "author = @request.auth.id || " + ADMIN,
        },
        teams: {
            listRule: AUTH,
            viewRule: AUTH,
            createRule: ADMIN,
            updateRule: ADMIN + " || lead = @request.auth.id",
            deleteRule: ADMIN,
        },
        team_members: {
            listRule: AUTH,
            viewRule: AUTH,
            createRule: ADMIN + " || team.lead = @request.auth.id",
            updateRule: ADMIN + " || team.lead = @request.auth.id",
            deleteRule: ADMIN + " || team.lead = @request.auth.id",
        },
        notifications: {
            listRule: "user = @request.auth.id",
            viewRule: "user = @request.auth.id",
            createRule: ADMIN + " || user = @request.auth.id",
            updateRule: "user = @request.auth.id",
            deleteRule: "user = @request.auth.id",
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
            createRule: ADMIN,
            updateRule: null,
            deleteRule: null,
        },
        app_settings: {
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
            listRule: "@request.auth.id = user.id || " + ADMIN,
            viewRule: "@request.auth.id = user.id || " + ADMIN,
            createRule: AUTH,
            updateRule: "@request.auth.id = user.id || " + ADMIN,
            deleteRule: "@request.auth.id = user.id || " + ADMIN,
        },
        commands: {
            listRule: ADMIN,
            viewRule: ADMIN,
            createRule: ADMIN,
            updateRule: ADMIN,
            deleteRule: ADMIN,
        },
        command_results: {
            listRule: ADMIN,
            viewRule: ADMIN,
            createRule: ADMIN,
            updateRule: ADMIN,
            deleteRule: ADMIN,
        },
        // NOTE: Keep demo_sessions public-read/non-admin-locked until Wave 2/3 server proxy (/api/demo/slot) is live.
        demo_sessions: {
            listRule: "",
            viewRule: "",
            createRule: "",
            updateRule: "",
            deleteRule: ADMIN,
        },
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
            createRule: AUTH + " && author = @request.auth.id && @request.body.status != 'signed' && @request.body.status != 'invoiced'",
            updateRule: "status = 'draft' && (" + ADMIN + " || author = @request.auth.id)",
            deleteRule: "status = 'draft' && (" + ADMIN + " || author = @request.auth.id)",
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

    for (const name in RULES) {
        try {
            const collection = app.findCollectionByNameOrId(name);
            if (!collection) continue;
            const rules = RULES[name];
            if (rules.authRule !== undefined) collection.authRule = rules.authRule;
            if (rules.listRule !== undefined) collection.listRule = rules.listRule;
            if (rules.viewRule !== undefined) collection.viewRule = rules.viewRule;
            if (rules.createRule !== undefined) collection.createRule = rules.createRule;
            if (rules.updateRule !== undefined) collection.updateRule = rules.updateRule;
            if (rules.deleteRule !== undefined) collection.deleteRule = rules.deleteRule;
            app.save(collection);
            console.log("[harden_rules] rules applied:", name);
        } catch (e) {
            console.warn("[harden_rules] skipped:", name, e);
        }
    }
}, (app) => {
    // No-op revert: restoring previous rules is only possible via the live backup
    // (03_Archive/Backups_flow-craft_2026-10-22/live_collections_backup_pre_block2.json).
});
