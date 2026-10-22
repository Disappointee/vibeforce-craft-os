/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    // 1. Ensure site_reports has is_regie_extra
    try {
        const siteReports = app.findCollectionByNameOrId("site_reports");
        if (siteReports && !siteReports.fields.getByName("is_regie_extra")) {
            siteReports.fields.add(new BoolField({
                name: "is_regie_extra",
                required: false
            }));
            app.save(siteReports);
        }
    } catch (e) {
        // collection might not exist yet locally
    }

    // 2. Ensure ids_carts exists
    try {
        app.findCollectionByNameOrId("ids_carts");
    } catch (e) {
        // Not found, create collection
        try {
            const projects = app.findCollectionByNameOrId("projects");
            const idsCarts = new Collection({
                "name": "ids_carts",
                "type": "base",
                "system": false,
                "listRule": "@request.auth.id != ''",
                "viewRule": "@request.auth.id != ''",
                "createRule": "@request.auth.id != ''",
                "updateRule": "@request.auth.id != ''",
                "deleteRule": "@request.auth.role = 'admin'",
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
                        "name": "cart_id",
                        "type": "text",
                        "required": true
                    },
                    {
                        "name": "project",
                        "type": "relation",
                        "required": false,
                        "collectionId": projects.id,
                        "cascadeDelete": false,
                        "maxSelect": 1
                    },
                    {
                        "name": "payload_json",
                        "type": "json",
                        "required": false
                    },
                    {
                        "name": "wholesaler",
                        "type": "text",
                        "required": false
                    },
                    {
                        "name": "item_count",
                        "type": "number",
                        "required": false
                    },
                    {
                        "name": "source",
                        "type": "select",
                        "required": false,
                        "maxSelect": 1,
                        "values": ["form_post", "ajax"]
                    }
                ]
            });
            app.save(idsCarts);
        } catch (err) {
            console.warn("Migration warning for ids_carts:", err);
        }
    }
}, (app) => {
    try {
        const idsCarts = app.findCollectionByNameOrId("ids_carts");
        if (idsCarts) app.delete(idsCarts);
    } catch (e) {}
});
