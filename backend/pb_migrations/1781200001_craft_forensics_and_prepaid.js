/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    // 1. Ensure site_reports forensic fields exist
    try {
        const siteReports = app.findCollectionByNameOrId("site_reports");
        if (siteReports) {
            let updated = false;

            if (!siteReports.fields.some((f) => f.name === "signature_manifest")) {
                siteReports.fields.push(new SchemaField({
                    "name": "signature_manifest",
                    "type": "text",
                    "required": false
                }));
                updated = true;
            }

            if (!siteReports.fields.some((f) => f.name === "signature_strokes")) {
                siteReports.fields.push(new SchemaField({
                    "name": "signature_strokes",
                    "type": "json",
                    "required": false
                }));
                updated = true;
            }

            if (!siteReports.fields.some((f) => f.name === "gps_lat")) {
                siteReports.fields.push(new SchemaField({
                    "name": "gps_lat",
                    "type": "number",
                    "required": false
                }));
                updated = true;
            }

            if (!siteReports.fields.some((f) => f.name === "gps_lon")) {
                siteReports.fields.push(new SchemaField({
                    "name": "gps_lon",
                    "type": "number",
                    "required": false
                }));
                updated = true;
            }

            if (!siteReports.fields.some((f) => f.name === "gps_accuracy")) {
                siteReports.fields.push(new SchemaField({
                    "name": "gps_accuracy",
                    "type": "number",
                    "required": false
                }));
                updated = true;
            }

            if (updated) {
                app.save(siteReports);
            }
        }
    } catch (e) {
        console.warn("Migration warning for site_reports forensic fields:", e);
    }

    // 2. Ensure invoices_zugferd has prepaid_amount
    try {
        const invoices = app.findCollectionByNameOrId("invoices_zugferd");
        if (invoices) {
            if (!invoices.fields.some((f) => f.name === "prepaid_amount")) {
                invoices.fields.push(new SchemaField({
                    "name": "prepaid_amount",
                    "type": "number",
                    "required": false
                }));
                app.save(invoices);
            }
        }
    } catch (e) {
        console.warn("Migration warning for invoices_zugferd prepaid_amount:", e);
    }
}, (app) => {
    // Down migration
});
