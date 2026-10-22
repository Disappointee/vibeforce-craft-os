/// <reference path="../pb_data/types.d.ts" />
/**
 * 1781500000_reconcile_craft_schema.js — Block-5-Abnahme, Befund P3 (Audit).
 *
 * Zweck:
 *   (a) Fehlendes Feld ergaenzen: measurements.tax_rate_type (TextField, required:false).
 *   (b) "Fenster-Schaden" reparieren: In DB-Zustaenden, in denen die Migrationen
 *       1781200000/1781200001/1781200002/1781200003 in _migrations als angewendet
 *       stehen, ihre Wirkung aber fehlt (alte SchemaField-Migrationen schlugen in
 *       PB 0.37 still fehl und wurden trotzdem protokolliert), werden die
 *       Craft-Collections, Craft-Projektfelder und Geofence-Felder idempotent
 *       nachgelegt. 1781200000 bleibt in _migrations unangetastet.
 *
 * Eigenschaften:
 *   - idempotent: jede Aktion ist per Existenz-Check (getByName / findCollection) abgesichert
 *   - keine destruktiven Operationen: nur add/create; kein delete, kein Daten-Update
 *   - jede Aktion mit try/catch + Log
 *   - Down bewusst No-op: die Strukturen existieren in Live-DBs unabhaengig von dieser Migration
 *
 * Felddefinitionen = 1781200000_created_craft_collections.js plus Folgefelder aus
 * 1781200001/1781200002/1781200003 (Endzustand einer frischen Instanz).
 * Rules der 4 Craft-Collections werden auf den gehaerteten Stand aus
 * 1781300000_harden_collection_rules.js nachgezogen (nur bei Abweichung).
 */
migrate((app) => {
    const findCollection = (nameOrId) => {
        try {
            return app.findCollectionByNameOrId(nameOrId);
        } catch (e) {
            return null;
        }
    };

    const projects = findCollection("projects");
    const users = findCollection("users") || findCollection("_pb_users_auth_");

    // ------------------------------------------------------------------
    // 1. projects: Geofence-Felder (Befund P3.3) + restliche Craft-Felder
    //    (aus 1781200000/1781200003; im Fenster-Schaden ebenfalls verloren)
    // ------------------------------------------------------------------
    try {
        if (projects) {
            let changed = false;
            const ensureField = (name, factory) => {
                if (!projects.fields.getByName(name)) {
                    projects.fields.add(factory());
                    changed = true;
                }
            };
            ensureField("geofence_type", () => new TextField({ name: "geofence_type", required: false, max: 20 }));
            ensureField("geofence_data", () => new JSONField({ name: "geofence_data", required: false, maxSize: 2000000 }));
            ensureField("geofence_auto_prompt", () => new BoolField({ name: "geofence_auto_prompt", required: false }));
            ensureField("project_type", () => new TextField({ name: "project_type", required: false }));
            ensureField("trade", () => new TextField({ name: "trade", required: false }));
            ensureField("site_address", () => new JSONField({ name: "site_address", required: false }));
            ensureField("vob_compliant", () => new BoolField({ name: "vob_compliant", required: false }));
            ensureField("reverse_charge_13b", () => new BoolField({ name: "reverse_charge_13b", required: false }));
            ensureField("geofence_lat", () => new NumberField({ name: "geofence_lat", required: false }));
            ensureField("geofence_lng", () => new NumberField({ name: "geofence_lng", required: false }));
            ensureField("geofence_radius", () => new NumberField({ name: "geofence_radius", required: false }));
            if (!projects.fields.getByName("site_manager") && users) {
                projects.fields.add(new RelationField({
                    name: "site_manager",
                    required: false,
                    collectionId: users.id,
                    cascadeDelete: false,
                    maxSelect: 1
                }));
                changed = true;
            }
            if (changed) {
                app.save(projects);
                console.log("[Migration 1781500000] projects: Craft-/Geofence-Felder ergaenzt");
            } else {
                console.log("[Migration 1781500000] projects: alle Craft-/Geofence-Felder vorhanden");
            }
        }
    } catch (e) {
        console.warn("[Migration 1781500000] projects:", e);
    }

    // ------------------------------------------------------------------
    // 2. site_reports: anlegen falls fehlend (P3.2); sonst Folgefelder
    //    aus 1781200001/1781200002 nachruecken
    // ------------------------------------------------------------------
    let siteReports = findCollection("site_reports");
    try {
        if (!siteReports && projects && users) {
            siteReports = new Collection({
                "name": "site_reports",
                "type": "base",
                "system": false,
                "listRule": "@request.auth.id != ''",
                "viewRule": "@request.auth.id != ''",
                "createRule": "@request.auth.id != ''",
                "updateRule": "@request.auth.id != ''",
                "deleteRule": "@request.auth.id != ''",
                "fields": [
                    { "name": "project", "type": "relation", "required": true, "collectionId": projects.id, "cascadeDelete": false, "maxSelect": 1 },
                    { "name": "author", "type": "relation", "required": true, "collectionId": users.id, "cascadeDelete": false, "maxSelect": 1 },
                    { "name": "report_date", "type": "text", "required": true },
                    { "name": "status", "type": "text", "required": false },
                    { "name": "weather", "type": "text", "required": false },
                    { "name": "temperature", "type": "number", "required": false },
                    { "name": "work_performed", "type": "text", "required": false },
                    { "name": "special_events", "type": "text", "required": false },
                    { "name": "qualification_hours", "type": "json", "required": false },
                    { "name": "client_signature", "type": "text", "required": false },
                    { "name": "client_name", "type": "text", "required": false },
                    { "name": "client_signed_at", "type": "text", "required": false },
                    { "name": "contractor_signature", "type": "text", "required": false },
                    { "name": "contractor_signed_at", "type": "text", "required": false },
                    { "name": "signature_manifest", "type": "text", "required": false },
                    { "name": "signature_strokes", "type": "json", "required": false },
                    { "name": "gps_lat", "type": "number", "required": false },
                    { "name": "gps_lon", "type": "number", "required": false },
                    { "name": "gps_accuracy", "type": "number", "required": false },
                    { "name": "is_regie_extra", "type": "bool", "required": false }
                ],
                "indexes": [
                    "CREATE INDEX `idx_site_reports_project` ON `site_reports` (`project`)",
                    "CREATE INDEX `idx_site_reports_date` ON `site_reports` (`report_date`)"
                ]
            });
            app.save(siteReports);
            console.log("[Migration 1781500000] site_reports angelegt:", siteReports.id);
        }
        if (siteReports) {
            let changed = false;
            const ensureField = (name, factory) => {
                if (!siteReports.fields.getByName(name)) {
                    siteReports.fields.add(factory());
                    changed = true;
                }
            };
            ensureField("signature_manifest", () => new TextField({ name: "signature_manifest", required: false }));
            ensureField("signature_strokes", () => new JSONField({ name: "signature_strokes", required: false }));
            ensureField("gps_lat", () => new NumberField({ name: "gps_lat", required: false }));
            ensureField("gps_lon", () => new NumberField({ name: "gps_lon", required: false }));
            ensureField("gps_accuracy", () => new NumberField({ name: "gps_accuracy", required: false }));
            ensureField("is_regie_extra", () => new BoolField({ name: "is_regie_extra", required: false }));
            if (changed) {
                app.save(siteReports);
                console.log("[Migration 1781500000] site_reports: Forensik-/Regie-Felder ergaenzt");
            }
        }
    } catch (e) {
        console.warn("[Migration 1781500000] site_reports:", e);
    }

    // ------------------------------------------------------------------
    // 3. measurements: anlegen falls fehlend (inkl. tax_rate_type);
    //    tax_rate_type nachruecken falls Collection bereits existiert (P3.1)
    // ------------------------------------------------------------------
    let measurements = findCollection("measurements");
    try {
        siteReports = siteReports || findCollection("site_reports");
        if (!measurements && siteReports) {
            measurements = new Collection({
                "name": "measurements",
                "type": "base",
                "system": false,
                "listRule": "@request.auth.id != ''",
                "viewRule": "@request.auth.id != ''",
                "createRule": "@request.auth.id != ''",
                "updateRule": "@request.auth.id != ''",
                "deleteRule": "@request.auth.id != ''",
                "fields": [
                    { "name": "site_report", "type": "relation", "required": true, "collectionId": siteReports.id, "cascadeDelete": true, "maxSelect": 1 },
                    { "name": "position_nr", "type": "text", "required": false },
                    { "name": "title", "type": "text", "required": true },
                    { "name": "formula", "type": "text", "required": false },
                    { "name": "quantity", "type": "number", "required": false },
                    { "name": "unit", "type": "text", "required": false },
                    { "name": "unit_price", "type": "number", "required": false },
                    { "name": "total_price", "type": "number", "required": false },
                    { "name": "tax_rate_type", "type": "text", "required": false },
                    { "name": "notes", "type": "text", "required": false }
                ],
                "indexes": [
                    "CREATE INDEX `idx_measurements_report` ON `measurements` (`site_report`)"
                ]
            });
            app.save(measurements);
            console.log("[Migration 1781500000] measurements angelegt:", measurements.id);
        }
        if (measurements && !measurements.fields.getByName("tax_rate_type")) {
            measurements.fields.add(new TextField({ name: "tax_rate_type", required: false }));
            app.save(measurements);
            console.log("[Migration 1781500000] measurements.tax_rate_type ergaenzt");
        }
    } catch (e) {
        console.warn("[Migration 1781500000] measurements:", e);
    }

    // ------------------------------------------------------------------
    // 4. evidence_items: anlegen falls fehlend (P3.2)
    // ------------------------------------------------------------------
    try {
        siteReports = siteReports || findCollection("site_reports");
        if (!findCollection("evidence_items") && siteReports) {
            const evidence = new Collection({
                "name": "evidence_items",
                "type": "base",
                "system": false,
                "listRule": "@request.auth.id != ''",
                "viewRule": "@request.auth.id != ''",
                "createRule": "@request.auth.id != ''",
                "updateRule": "@request.auth.id != ''",
                "deleteRule": "@request.auth.id != ''",
                "fields": [
                    { "name": "site_report", "type": "relation", "required": true, "collectionId": siteReports.id, "cascadeDelete": true, "maxSelect": 1 },
                    { "name": "image", "type": "file", "required": false, "maxSelect": 1, "maxSize": 10485760, "mimeTypes": ["image/jpeg", "image/png", "image/webp"] },
                    { "name": "caption", "type": "text", "required": false },
                    { "name": "sha256_hash", "type": "text", "required": false },
                    { "name": "taken_at", "type": "text", "required": false },
                    { "name": "gps_lat", "type": "number", "required": false },
                    { "name": "gps_lon", "type": "number", "required": false }
                ],
                "indexes": [
                    "CREATE INDEX `idx_evidence_report` ON `evidence_items` (`site_report`)"
                ]
            });
            app.save(evidence);
            console.log("[Migration 1781500000] evidence_items angelegt:", evidence.id);
        }
    } catch (e) {
        console.warn("[Migration 1781500000] evidence_items:", e);
    }

    // ------------------------------------------------------------------
    // 5. invoices_zugferd: anlegen falls fehlend (inkl. prepaid_amount);
    //    prepaid_amount nachruecken falls Collection bereits existiert
    // ------------------------------------------------------------------
    let invoices = findCollection("invoices_zugferd");
    try {
        siteReports = siteReports || findCollection("site_reports");
        if (!invoices && siteReports && projects) {
            invoices = new Collection({
                "name": "invoices_zugferd",
                "type": "base",
                "system": false,
                "listRule": "@request.auth.id != ''",
                "viewRule": "@request.auth.id != ''",
                "createRule": "@request.auth.id != ''",
                "updateRule": "@request.auth.id != ''",
                "deleteRule": "@request.auth.id != ''",
                "fields": [
                    { "name": "site_report", "type": "relation", "required": false, "collectionId": siteReports.id, "cascadeDelete": false, "maxSelect": 1 },
                    { "name": "project", "type": "relation", "required": true, "collectionId": projects.id, "cascadeDelete": false, "maxSelect": 1 },
                    { "name": "invoice_number", "type": "text", "required": true },
                    { "name": "invoice_type", "type": "text", "required": false },
                    { "name": "net_total", "type": "number", "required": false },
                    { "name": "tax_rate", "type": "number", "required": false },
                    { "name": "tax_total", "type": "number", "required": false },
                    { "name": "gross_total", "type": "number", "required": false },
                    { "name": "prepaid_amount", "type": "number", "required": false },
                    { "name": "zugferd_xml", "type": "text", "required": false },
                    { "name": "pdf_file", "type": "file", "required": false, "maxSelect": 1, "maxSize": 20971520, "mimeTypes": ["application/pdf"] },
                    { "name": "datev_exported", "type": "bool", "required": false },
                    { "name": "datev_export_date", "type": "text", "required": false }
                ],
                "indexes": [
                    "CREATE INDEX `idx_invoices_project` ON `invoices_zugferd` (`project`)",
                    "CREATE INDEX `idx_invoices_number` ON `invoices_zugferd` (`invoice_number`)"
                ]
            });
            app.save(invoices);
            console.log("[Migration 1781500000] invoices_zugferd angelegt:", invoices.id);
        }
        if (invoices && !invoices.fields.getByName("prepaid_amount")) {
            invoices.fields.add(new NumberField({ name: "prepaid_amount", required: false }));
            app.save(invoices);
            console.log("[Migration 1781500000] invoices_zugferd.prepaid_amount ergaenzt");
        }
    } catch (e) {
        console.warn("[Migration 1781500000] invoices_zugferd:", e);
    }

    // ------------------------------------------------------------------
    // 6. Betriebs-Collections aus 1781400000 nachlegen, falls im Fenster
    //    verloren (craft_licenses, defect_pins, demo_sessions)
    // ------------------------------------------------------------------
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
            console.log("[Migration 1781500000] craft_licenses angelegt:", licenses.id);
        }
    } catch (e) {
        console.warn("[Migration 1781500000] craft_licenses:", e);
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
            console.log("[Migration 1781500000] defect_pins angelegt:", pins.id);
        }
    } catch (e) {
        console.warn("[Migration 1781500000] defect_pins:", e);
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
            console.log("[Migration 1781500000] demo_sessions angelegt:", sessions.id);
        }
    } catch (e) {
        console.warn("[Migration 1781500000] demo_sessions:", e);
    }

    // ------------------------------------------------------------------
    // 7. Rules der 4 Craft-Collections auf gehaerteten Stand (1781300000)
    //    nachziehen — nur bei Abweichung; macht Fenster-Reparaturen
    //    deckungsgleich mit frischen Instanzen.
    // ------------------------------------------------------------------
    const ADMIN = "@request.auth.role = 'admin'";
    const AUTH = "@request.auth.id != ''";
    const HARDENED = {
        site_reports: {
            listRule: AUTH,
            viewRule: AUTH,
            createRule: AUTH + " && author = @request.auth.id",
            updateRule: ADMIN + " || author = @request.auth.id",
            deleteRule: ADMIN + " || author = @request.auth.id"
        },
        measurements: {
            listRule: AUTH,
            viewRule: AUTH,
            createRule: AUTH,
            updateRule: ADMIN,
            deleteRule: ADMIN
        },
        evidence_items: {
            listRule: AUTH,
            viewRule: AUTH,
            createRule: AUTH,
            updateRule: ADMIN,
            deleteRule: ADMIN
        },
        invoices_zugferd: {
            listRule: AUTH,
            viewRule: AUTH,
            createRule: ADMIN,
            updateRule: ADMIN,
            deleteRule: ADMIN
        }
    };
    for (const name in HARDENED) {
        try {
            const collection = findCollection(name);
            if (!collection) continue;
            const rules = HARDENED[name];
            // Hinweis: collection.listRule ist im JSVM ein String-Objekt, daher
            // Vergleich per String()-Koerzierung statt strikter Identitaet.
            const sameRule = (current, expected) => (current === null || current === undefined) ? false : (String(current) === expected);
            let changed = false;
            if (!sameRule(collection.listRule, rules.listRule)) { collection.listRule = rules.listRule; changed = true; }
            if (!sameRule(collection.viewRule, rules.viewRule)) { collection.viewRule = rules.viewRule; changed = true; }
            if (!sameRule(collection.createRule, rules.createRule)) { collection.createRule = rules.createRule; changed = true; }
            if (!sameRule(collection.updateRule, rules.updateRule)) { collection.updateRule = rules.updateRule; changed = true; }
            if (!sameRule(collection.deleteRule, rules.deleteRule)) { collection.deleteRule = rules.deleteRule; changed = true; }
            if (changed) {
                app.save(collection);
                console.log("[Migration 1781500000] Rules gehaertet:", name);
            }
        } catch (e) {
            console.warn("[Migration 1781500000] Rules-Haertung:", name, e);
        }
    }

    console.log("[Migration 1781500000] Reconcile abgeschlossen.");
}, (app) => {
    // Kein Down: reine Reconcile-Migration. Die Collections/Felder existieren in
    // Live-DBs unabhaengig von dieser Migration; ein Revert wuerde Daten gefaehrden.
});
