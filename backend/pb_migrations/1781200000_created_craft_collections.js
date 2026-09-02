/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    // 1. Extend 'projects' with geofence fields
    try {
        const projectsCollection = app.findCollectionByNameOrId("projects");
        if (projectsCollection) {
            const hasGeofenceType = projectsCollection.fields.some((f) => f.name === "geofence_type");
            if (!hasGeofenceType) {
                projectsCollection.fields.push(new SchemaField({
                    "hidden": false,
                    "id": "txt_geofence_type_17812",
                    "name": "geofence_type",
                    "presentable": false,
                    "required": false,
                    "system": false,
                    "type": "text",
                    "options": {
                        "min": null,
                        "max": 20,
                        "pattern": ""
                    }
                }));
            }

            const hasGeofenceData = projectsCollection.fields.some((f) => f.name === "geofence_data");
            if (!hasGeofenceData) {
                projectsCollection.fields.push(new SchemaField({
                    "hidden": false,
                    "id": "json_geofence_data_17812",
                    "name": "geofence_data",
                    "presentable": false,
                    "required": false,
                    "system": false,
                    "type": "json",
                    "options": {
                        "maxSize": 2000000
                    }
                }));
            }

            const hasGeofenceAutoPrompt = projectsCollection.fields.some((f) => f.name === "geofence_auto_prompt");
            if (!hasGeofenceAutoPrompt) {
                projectsCollection.fields.push(new SchemaField({
                    "hidden": false,
                    "id": "bool_geofence_auto_prompt_17812",
                    "name": "geofence_auto_prompt",
                    "presentable": false,
                    "required": false,
                    "system": false,
                    "type": "bool"
                }));
            }

            app.save(projectsCollection);
        }
    } catch (e) {
        console.warn("Migration warning for projects geofence fields:", e);
    }

    // 2. Create 'site_reports' collection
    try {
        const existingReports = app.findCollectionByNameOrId("site_reports");
        if (!existingReports) {
            const siteReports = new Collection({
                "id": "pbc_site_reports_17812",
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
                        "autogeneratePattern": "[a-z0-9]{15}",
                        "name": "id",
                        "primaryKey": true,
                        "required": true,
                        "system": true,
                        "type": "text"
                    },
                    {
                        "name": "project",
                        "type": "relation",
                        "required": true,
                        "options": {
                            "collectionId": "projects",
                            "cascadeDelete": false,
                            "maxSelect": 1
                        }
                    },
                    {
                        "name": "author",
                        "type": "relation",
                        "required": true,
                        "options": {
                            "collectionId": "_pb_users_auth_",
                            "cascadeDelete": false,
                            "maxSelect": 1
                        }
                    },
                    {
                        "name": "report_date",
                        "type": "text",
                        "required": true
                    },
                    {
                        "name": "status",
                        "type": "text",
                        "required": false
                    },
                    {
                        "name": "weather",
                        "type": "text",
                        "required": false
                    },
                    {
                        "name": "temperature",
                        "type": "number",
                        "required": false
                    },
                    {
                        "name": "work_performed",
                        "type": "text",
                        "required": false
                    },
                    {
                        "name": "special_events",
                        "type": "text",
                        "required": false
                    },
                    {
                        "name": "qualification_hours",
                        "type": "json",
                        "required": false
                    },
                    {
                        "name": "client_signature",
                        "type": "text",
                        "required": false
                    },
                    {
                        "name": "client_name",
                        "type": "text",
                        "required": false
                    },
                    {
                        "name": "client_signed_at",
                        "type": "text",
                        "required": false
                    },
                    {
                        "name": "contractor_signature",
                        "type": "text",
                        "required": false
                    },
                    {
                        "name": "contractor_signed_at",
                        "type": "text",
                        "required": false
                    }
                ],
                "indexes": [
                    "CREATE INDEX `idx_site_reports_project` ON `site_reports` (`project`)",
                    "CREATE INDEX `idx_site_reports_date` ON `site_reports` (`report_date`)"
                ]
            });
            app.save(siteReports);
        }
    } catch (e) {
        console.warn("Migration warning for site_reports collection:", e);
    }

    // 3. Create 'measurements' collection
    try {
        const existingMeasurements = app.findCollectionByNameOrId("measurements");
        if (!existingMeasurements) {
            const measurements = new Collection({
                "id": "pbc_measurements_17812",
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
                        "autogeneratePattern": "[a-z0-9]{15}",
                        "name": "id",
                        "primaryKey": true,
                        "required": true,
                        "system": true,
                        "type": "text"
                    },
                    {
                        "name": "site_report",
                        "type": "relation",
                        "required": true,
                        "options": {
                            "collectionId": "pbc_site_reports_17812",
                            "cascadeDelete": true,
                            "maxSelect": 1
                        }
                    },
                    {
                        "name": "position_nr",
                        "type": "text",
                        "required": false
                    },
                    {
                        "name": "title",
                        "type": "text",
                        "required": true
                    },
                    {
                        "name": "formula",
                        "type": "text",
                        "required": false
                    },
                    {
                        "name": "quantity",
                        "type": "number",
                        "required": false
                    },
                    {
                        "name": "unit",
                        "type": "text",
                        "required": false
                    },
                    {
                        "name": "unit_price",
                        "type": "number",
                        "required": false
                    },
                    {
                        "name": "total_price",
                        "type": "number",
                        "required": false
                    },
                    {
                        "name": "notes",
                        "type": "text",
                        "required": false
                    }
                ],
                "indexes": [
                    "CREATE INDEX `idx_measurements_report` ON `measurements` (`site_report`)"
                ]
            });
            app.save(measurements);
        }
    } catch (e) {
        console.warn("Migration warning for measurements collection:", e);
    }

    // 4. Create 'evidence_items' collection
    try {
        const existingEvidence = app.findCollectionByNameOrId("evidence_items");
        if (!existingEvidence) {
            const evidence = new Collection({
                "id": "pbc_evidence_items_17812",
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
                        "autogeneratePattern": "[a-z0-9]{15}",
                        "name": "id",
                        "primaryKey": true,
                        "required": true,
                        "system": true,
                        "type": "text"
                    },
                    {
                        "name": "site_report",
                        "type": "relation",
                        "required": true,
                        "options": {
                            "collectionId": "pbc_site_reports_17812",
                            "cascadeDelete": true,
                            "maxSelect": 1
                        }
                    },
                    {
                        "name": "image",
                        "type": "file",
                        "required": false,
                        "options": {
                            "maxSelect": 1,
                            "maxSize": 10485760,
                            "mimeTypes": ["image/jpeg", "image/png", "image/webp"]
                        }
                    },
                    {
                        "name": "caption",
                        "type": "text",
                        "required": false
                    },
                    {
                        "name": "sha256_hash",
                        "type": "text",
                        "required": false
                    },
                    {
                        "name": "taken_at",
                        "type": "text",
                        "required": false
                    },
                    {
                        "name": "gps_lat",
                        "type": "number",
                        "required": false
                    },
                    {
                        "name": "gps_lon",
                        "type": "number",
                        "required": false
                    }
                ],
                "indexes": [
                    "CREATE INDEX `idx_evidence_report` ON `evidence_items` (`site_report`)"
                ]
            });
            app.save(evidence);
        }
    } catch (e) {
        console.warn("Migration warning for evidence_items collection:", e);
    }

    // 5. Create 'invoices_zugferd' collection
    try {
        const existingInvoices = app.findCollectionByNameOrId("invoices_zugferd");
        if (!existingInvoices) {
            const invoices = new Collection({
                "id": "pbc_invoices_zugferd_17812",
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
                        "autogeneratePattern": "[a-z0-9]{15}",
                        "name": "id",
                        "primaryKey": true,
                        "required": true,
                        "system": true,
                        "type": "text"
                    },
                    {
                        "name": "site_report",
                        "type": "relation",
                        "required": false,
                        "options": {
                            "collectionId": "pbc_site_reports_17812",
                            "cascadeDelete": false,
                            "maxSelect": 1
                        }
                    },
                    {
                        "name": "project",
                        "type": "relation",
                        "required": true,
                        "options": {
                            "collectionId": "projects",
                            "cascadeDelete": false,
                            "maxSelect": 1
                        }
                    },
                    {
                        "name": "invoice_number",
                        "type": "text",
                        "required": true
                    },
                    {
                        "name": "invoice_type",
                        "type": "text",
                        "required": false
                    },
                    {
                        "name": "net_total",
                        "type": "number",
                        "required": false
                    },
                    {
                        "name": "tax_rate",
                        "type": "number",
                        "required": false
                    },
                    {
                        "name": "tax_total",
                        "type": "number",
                        "required": false
                    },
                    {
                        "name": "gross_total",
                        "type": "number",
                        "required": false
                    },
                    {
                        "name": "zugferd_xml",
                        "type": "text",
                        "required": false
                    },
                    {
                        "name": "pdf_file",
                        "type": "file",
                        "required": false,
                        "options": {
                            "maxSelect": 1,
                            "maxSize": 20971520,
                            "mimeTypes": ["application/pdf"]
                        }
                    },
                    {
                        "name": "datev_exported",
                        "type": "bool",
                        "required": false
                    },
                    {
                        "name": "datev_export_date",
                        "type": "text",
                        "required": false
                    }
                ],
                "indexes": [
                    "CREATE INDEX `idx_invoices_project` ON `invoices_zugferd` (`project`)",
                    "CREATE INDEX `idx_invoices_number` ON `invoices_zugferd` (`invoice_number`)"
                ]
            });
            app.save(invoices);
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
