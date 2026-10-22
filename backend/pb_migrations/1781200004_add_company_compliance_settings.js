/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    try {
        const appSettings = app.findCollectionByNameOrId("app_settings");
        if (appSettings) {
            let updated = false;

            const fieldsToAdd = [
                // 1. Betriebliche Stammdaten
                { name: "company_name", type: "text" },
                { name: "company_legal_form", type: "text" },
                { name: "company_owner", type: "text" },
                { name: "company_street", type: "text" },
                { name: "company_zip", type: "text" },
                { name: "company_city", type: "text" },
                { name: "company_country", type: "text" },
                { name: "company_phone", type: "text" },
                { name: "company_emergency_phone", type: "text" },
                { name: "company_email", type: "text" },
                { name: "company_website", type: "text" },
                
                // 2. Bankverbindung
                { name: "bank_name", type: "text" },
                { name: "bank_iban", type: "text" },
                { name: "bank_bic", type: "text" },
                { name: "creditor_id", type: "text" },

                // 3. Handwerkskammer (HWK)
                { name: "hwk_name", type: "text" },
                { name: "hwk_number", type: "text" },
                { name: "hwk_trade", type: "text" },
                { name: "hwk_registered", type: "bool" },
                { name: "master_qualification", type: "text" },

                // 4. Steuern & Bau-Compliance (§ 48b / § 13b / VOB)
                { name: "tax_id", type: "text" },
                { name: "vat_id", type: "text" },
                { name: "freistellung_status", type: "bool" },
                { name: "freistellung_aktenzeichen", type: "text" },
                { name: "freistellung_gueltig_bis", type: "text" },
                { name: "freistellung_issuer", type: "text" },
                { name: "reverse_charge_active", type: "bool" },
                { name: "vob_din18299_active", type: "bool" },
                { name: "vob_payment_term_days", type: "number" }
            ];

            const createField = (f) => {
                switch (f.type) {
                    case "bool":
                        return new BoolField({ name: f.name, required: false });
                    case "number":
                        return new NumberField({ name: f.name, required: false });
                    default:
                        return new TextField({ name: f.name, required: false });
                }
            };

            for (const f of fieldsToAdd) {
                if (!appSettings.fields.getByName(f.name)) {
                    appSettings.fields.add(createField(f));
                    updated = true;
                }
            }

            if (updated) {
                app.save(appSettings);
                console.log("[Migration 1781200004] ✅ app_settings erfolgreich um Handwerks-Betriebsdaten erweitert.");
            }
        }
    } catch (e) {
        console.warn("[Migration 1781200004] Warnung:", e);
    }
}, (app) => {
    try {
        const appSettings = app.findCollectionByNameOrId("app_settings");
        if (appSettings) {
            const fieldNames = [
                "company_name", "company_legal_form", "company_owner",
                "company_street", "company_zip", "company_city", "company_country",
                "company_phone", "company_emergency_phone", "company_email", "company_website",
                "bank_name", "bank_iban", "bank_bic", "creditor_id",
                "hwk_name", "hwk_number", "hwk_trade", "hwk_registered", "master_qualification",
                "tax_id", "vat_id", "freistellung_status", "freistellung_aktenzeichen",
                "freistellung_gueltig_bis", "freistellung_issuer", "reverse_charge_active",
                "vob_din18299_active", "vob_payment_term_days"
            ];
            for (const name of fieldNames) {
                const existing = appSettings.fields.find((f) => f.name === name);
                if (existing) {
                    appSettings.fields.remove(existing.id);
                }
            }
            app.save(appSettings);
        }
    } catch (e) {
        console.warn("[Migration 1781200004 Revert] Warnung:", e);
    }
});
