/// <reference path="../pb_data/types.d.ts" />
// Ergänzt Collections, die bisher nur in der Live-DB existierten.
// Ohne diese Migration fehlen frischen Instanzen craft_licenses/defect_pins/
// demo_sessions; Entitlements, Mängel-Pins und Demo-Sessions liefen ins Leere.
migrate((app) => {
    const findCollection = (nameOrId) => {
        try {
            return app.findCollectionByNameOrId(nameOrId);
        } catch (e) {
            return null;
        }
    };

    try {
        if (!findCollection("craft_licenses")) {
            const licenses = new Collection({
                "name": "craft_licenses",
                "type": "base",
                "system": false,
                "listRule": "@request.auth.id != ''",
                "viewRule": "@request.auth.id != ''",
                "createRule": "@request.auth.role = 'admin'",
                "updateRule": "@request.auth.role = 'admin'",
                "deleteRule": "@request.auth.role = 'admin'",
                "fields": [
                    { "name": "scope", "type": "text", "required": false },
                    { "name": "tier", "type": "text", "required": false },
                    { "name": "enabled_features", "type": "json", "required": false },
                    { "name": "notes", "type": "text", "required": false }
                ]
            });
            app.save(licenses);
            console.log("[Migration 1781400000] craft_licenses angelegt:", licenses.id);
        }
    } catch (e) {
        console.warn("[Migration 1781400000] craft_licenses:", e);
    }

    try {
        if (!findCollection("defect_pins")) {
            const pins = new Collection({
                "name": "defect_pins",
                "type": "base",
                "system": false,
                "listRule": "@request.auth.id != ''",
                "viewRule": "@request.auth.id != ''",
                "createRule": "@request.auth.id != ''",
                "updateRule": "@request.auth.role = 'admin'",
                "deleteRule": "@request.auth.role = 'admin'",
                "fields": [
                    { "name": "project", "type": "text", "required": false },
                    { "name": "title", "type": "text", "required": false },
                    { "name": "description", "type": "text", "required": false },
                    { "name": "trade", "type": "text", "required": false },
                    { "name": "location_note", "type": "text", "required": false },
                    { "name": "pin_x", "type": "number", "required": false },
                    { "name": "pin_y", "type": "number", "required": false },
                    { "name": "severity", "type": "text", "required": false },
                    { "name": "status", "type": "text", "required": false },
                    { "name": "due_date", "type": "text", "required": false },
                    { "name": "contractor_name", "type": "text", "required": false },
                    { "name": "evidence_photo_url", "type": "text", "required": false },
                    { "name": "evidence_sha256", "type": "text", "required": false },
                    { "name": "notice_text", "type": "text", "required": false },
                    { "name": "resolved_at", "type": "text", "required": false },
                    { "name": "accepted_at", "type": "text", "required": false }
                ]
            });
            app.save(pins);
            console.log("[Migration 1781400000] defect_pins angelegt:", pins.id);
        }
    } catch (e) {
        console.warn("[Migration 1781400000] defect_pins:", e);
    }

    try {
        if (!findCollection("demo_sessions")) {
            const sessions = new Collection({
                "name": "demo_sessions",
                "type": "base",
                "system": false,
                "listRule": "@request.auth.role = 'admin'",
                "viewRule": "@request.auth.role = 'admin'",
                "createRule": "@request.auth.role = 'admin'",
                "updateRule": "@request.auth.role = 'admin'",
                "deleteRule": "@request.auth.role = 'admin'",
                "fields": [
                    { "name": "ref_id", "type": "text", "required": false },
                    { "name": "company_name", "type": "text", "required": false },
                    { "name": "contact_person", "type": "text", "required": false },
                    { "name": "first_access", "type": "date", "required": false },
                    { "name": "last_heartbeat", "type": "date", "required": false },
                    { "name": "is_active", "type": "bool", "required": false },
                    { "name": "assigned_slot", "type": "text", "required": false },
                    { "name": "session_token", "type": "text", "required": false },
                    { "name": "access_count", "type": "number", "required": false },
                    { "name": "expires_at", "type": "date", "required": false },
                    { "name": "metadata", "type": "json", "required": false }
                ],
                "indexes": [
                    "CREATE INDEX `idx_demo_sessions_ref` ON `demo_sessions` (`ref_id`)"
                ]
            });
            app.save(sessions);
            console.log("[Migration 1781400000] demo_sessions angelegt:", sessions.id);
        }
    } catch (e) {
        console.warn("[Migration 1781400000] demo_sessions:", e);
    }
}, (app) => {
    // Kein Down: die Collections existieren in der Live-DB unabhängig von dieser Migration.
});
