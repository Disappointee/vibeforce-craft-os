/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    try {
        const projects = app.findCollectionByNameOrId("projects");
        if (projects) {
            let updated = false;

            const fieldsToAdd = [
                { name: "project_type", type: "text", required: false },
                { name: "trade", type: "text", required: false },
                { name: "site_address", type: "json", required: false },
                { name: "vob_compliant", type: "bool", required: false },
                { name: "reverse_charge_13b", type: "bool", required: false },
                { name: "geofence_lat", type: "number", required: false },
                { name: "geofence_lng", type: "number", required: false },
                { name: "geofence_radius", type: "number", required: false }
            ];

            for (const f of fieldsToAdd) {
                if (!projects.fields.some((existing) => existing.name === f.name)) {
                    projects.fields.push(new SchemaField({
                        name: f.name,
                        type: f.type,
                        required: f.required
                    }));
                    updated = true;
                }
            }

            // Relation to site_manager (_pb_users_auth_)
            if (!projects.fields.some((existing) => existing.name === "site_manager")) {
                const usersCollection = app.findCollectionByNameOrId("_pb_users_auth_") || app.findCollectionByNameOrId("users");
                if (usersCollection) {
                    projects.fields.push(new SchemaField({
                        name: "site_manager",
                        type: "relation",
                        required: false,
                        options: {
                            collectionId: usersCollection.id,
                            cascadeDelete: false,
                            maxSelect: 1
                        }
                    }));
                    updated = true;
                }
            }

            if (updated) {
                app.save(projects);
            }
        }
    } catch (e) {
        console.warn("Migration warning for projects craft fields:", e);
    }
}, (app) => {
    // Revert
});
