/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    const findCollection = (nameOrId) => {
        try {
            return app.findCollectionByNameOrId(nameOrId);
        } catch (e) {
            return null;
        }
    };

    // 1. Extend 'projects' with geofence fields
    try {
        const projectsCollection = findCollection("projects");
        if (projectsCollection) {
            let changed = false;
            if (!projectsCollection.fields.getByName("geofence_type")) {
                projectsCollection.fields.add(new TextField({
                    name: "geofence_type",
                    required: false,
                    max: 20
                }));
                changed = true;
            }
            if (!projectsCollection.fields.getByName("geofence_data")) {
                projectsCollection.fields.add(new JSONField({
                    name: "geofence_data",
                    required: false,
                    maxSize: 2000000
                }));
                changed = true;
            }
            if (!projectsCollection.fields.getByName("geofence_auto_prompt")) {
                projectsCollection.fields.add(new BoolField({
                    name: "geofence_auto_prompt",
                    required: false
                }));
                changed = true;
            }
            if (changed) {
                app.save(projectsCollection);
            }
        }
    } catch (e) {
        console.warn("Migration warning for projects geofence fields:", e);
    }

    // 2. Create 'site_reports' collection
    let siteReports = findCollection("site_reports");
    try {
        if (!siteReports) {
            const projectsCollection = findCollection("projects");
            const usersCollection = findCollection("users") || findCollection("_pb_users_auth_");
            if (projectsCollection && usersCollection) {
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
                        {
                            "name": "project",
                            "type": "relation",
                            "required": true,
                            "collectionId": projectsCollection.id,
                            "cascadeDelete": false,
                            "maxSelect": 1
                        },
                        {
                            "name": "author",
                            "type": "relation",
                            "required": true,
                            "collectionId": usersCollection.id,
                            "cascadeDelete": false,
                            "maxSelect": 1
                        },
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
                        { "name": "contractor_signed_at", "type": "text", "required": false }
                    ],
                    "indexes": [
                        "CREATE INDEX `idx_site_reports_project` ON `site_reports` (`project`)",
                        "CREATE INDEX `idx_site_reports_date` ON `site_reports` (`report_date`)"
                    ]
                });
                app.save(siteReports);
                console.log("[Migration 1781200000] site_reports angelegt:", siteReports.id);
            }
        }
    } catch (e) {
        console.warn("Migration warning for site_reports collection:", e);
    }

    // 3. Create 'measurements' collection
    try {
        siteReports = siteReports || findCollection("site_reports");
        if (siteReports && !findCollection("measurements")) {
            const measurements = new Collection({
                "name": "measurements",
                "type": "base",
                "system": false,
                "listRule": "@request.auth.id != ''",
                "viewRule": "@request.auth.id != ''",
                "createRule": "@request.auth.id != ''",
                "updateRule": "@request.auth.id != ''",
                "deleteRule": "@request.auth.id != ''",
                "fields": [
                    {
                        "name": "site_report",
                        "type": "relation",
                        "required": true,
                        "collectionId": siteReports.id,
                        "cascadeDelete": true,
                        "maxSelect": 1
                    },
                    { "name": "position_nr", "type": "text", "required": false },
                    { "name": "title", "type": "text", "required": true },
                    { "name": "formula", "type": "text", "required": false },
                    { "name": "quantity", "type": "number", "required": false },
                    { "name": "unit", "type": "text", "required": false },
                    { "name": "unit_price", "type": "number", "required": false },
                    { "name": "total_price", "type": "number", "required": false },
                    { "name": "notes", "type": "text", "required": false }
                ],
                "indexes": [
                    "CREATE INDEX `idx_measurements_report` ON `measurements` (`site_report`)"
                ]
            });
            app.save(measurements);
            console.log("[Migration 1781200000] measurements angelegt:", measurements.id);
        }
    } catch (e) {
        console.warn("Migration warning for measurements collection:", e);
    }

    // 4. Create 'evidence_items' collection
    try {
        siteReports = siteReports || findCollection("site_reports");
        if (siteReports && !findCollection("evidence_items")) {
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
                    {
                        "name": "site_report",
                        "type": "relation",
                        "required": true,
                        "collectionId": siteReports.id,
                        "cascadeDelete": true,
                        "maxSelect": 1
                    },
                    {
                        "name": "image",
                        "type": "file",
                        "required": false,
                        "maxSelect": 1,
                        "maxSize": 10485760,
                        "mimeTypes": ["image/jpeg", "image/png", "image/webp"]
                    },
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
            console.log("[Migration 1781200000] evidence_items angelegt:", evidence.id);
        }
    } catch (e) {
        console.warn("Migration warning for evidence_items collection:", e);
    }

    // 5. Create 'invoices_zugferd' collection
    try {
        siteReports = siteReports || findCollection("site_reports");
        const projectsCollection = findCollection("projects");
        if (siteReports && projectsCollection && !findCollection("invoices_zugferd")) {
            const invoices = new Collection({
                "name": "invoices_zugferd",
                "type": "base",
                "system": false,
                "listRule": "@request.auth.id != ''",
                "viewRule": "@request.auth.id != ''",
                "createRule": "@request.auth.id != ''",
                "updateRule": "@request.auth.id != ''",
                "deleteRule": "@request.auth.id != ''",
                "fields": [
                    {
                        "name": "site_report",
                        "type": "relation",
                        "required": false,
                        "collectionId": siteReports.id,
                        "cascadeDelete": false,
                        "maxSelect": 1
                    },
                    {
                        "name": "project",
                        "type": "relation",
                        "required": true,
                        "collectionId": projectsCollection.id,
                        "cascadeDelete": false,
                        "maxSelect": 1
                    },
                    { "name": "invoice_number", "type": "text", "required": true },
                    { "name": "invoice_type", "type": "text", "required": false },
                    { "name": "net_total", "type": "number", "required": false },
                    { "name": "tax_rate", "type": "number", "required": false },
                    { "name": "tax_total", "type": "number", "required": false },
                    { "name": "gross_total", "type": "number", "required": false },
                    { "name": "prepaid_amount", "type": "number", "required": false },
                    { "name": "zugferd_xml", "type": "text", "required": false },
                    {
                        "name": "pdf_file",
                        "type": "file",
                        "required": false,
                        "maxSelect": 1,
                        "maxSize": 20971520,
                        "mimeTypes": ["application/pdf"]
                    },
                    { "name": "datev_exported", "type": "bool", "required": false },
                    { "name": "datev_export_date", "type": "text", "required": false }
                ],
                "indexes": [
                    "CREATE INDEX `idx_invoices_project` ON `invoices_zugferd` (`project`)",
                    "CREATE INDEX `idx_invoices_number` ON `invoices_zugferd` (`invoice_number`)"
                ]
            });
            app.save(invoices);
            console.log("[Migration 1781200000] invoices_zugferd angelegt:", invoices.id);
        }
    } catch (e) {
        console.warn("Migration warning for invoices_zugferd collection:", e);
    }
}, (app) => {
    // Revert
    try {
        const invoices = app.findCollectionByNameOrId("invoices_zugferd");
        if (invoices) app.delete(invoices);
        const evidence = app.findCollectionByNameOrId("evidence_items");
        if (evidence) app.delete(evidence);
        const measurements = app.findCollectionByNameOrId("measurements");
        if (measurements) app.delete(measurements);
        const reports = app.findCollectionByNameOrId("site_reports");
        if (reports) app.delete(reports);
    } catch (e) {
        console.warn("Revert warning for craft collections:", e);
    }
});
