/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    const findCollection = (nameOrId) => {
        try {
            return app.findCollectionByNameOrId(nameOrId);
        } catch (e) {
            return null;
        }
    };

    // 1. Ensure site_reports forensic fields exist
    try {
        const siteReports = findCollection("site_reports");
        if (siteReports) {
            let updated = false;

            if (!siteReports.fields.getByName("signature_manifest")) {
                siteReports.fields.add(new TextField({ name: "signature_manifest", required: false }));
                updated = true;
            }

            if (!siteReports.fields.getByName("signature_strokes")) {
                siteReports.fields.add(new JSONField({ name: "signature_strokes", required: false }));
                updated = true;
            }

            if (!siteReports.fields.getByName("gps_lat")) {
                siteReports.fields.add(new NumberField({ name: "gps_lat", required: false }));
                updated = true;
            }

            if (!siteReports.fields.getByName("gps_lon")) {
                siteReports.fields.add(new NumberField({ name: "gps_lon", required: false }));
                updated = true;
            }

            if (!siteReports.fields.getByName("gps_accuracy")) {
                siteReports.fields.add(new NumberField({ name: "gps_accuracy", required: false }));
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
        const invoices = findCollection("invoices_zugferd");
        if (invoices && !invoices.fields.getByName("prepaid_amount")) {
            invoices.fields.add(new NumberField({ name: "prepaid_amount", required: false }));
            app.save(invoices);
        }
    } catch (e) {
        console.warn("Migration warning for invoices_zugferd prepaid_amount:", e);
    }
}, (app) => {
    // Down migration
});
