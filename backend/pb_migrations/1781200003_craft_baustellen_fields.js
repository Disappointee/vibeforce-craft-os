/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    try {
        const projects = app.findCollectionByNameOrId("projects");
        if (projects) {
            let updated = false;

            const fieldsToAdd = [
                () => new TextField({ name: "project_type", required: false }),
                () => new TextField({ name: "trade", required: false }),
                () => new JSONField({ name: "site_address", required: false }),
                () => new BoolField({ name: "vob_compliant", required: false }),
                () => new BoolField({ name: "reverse_charge_13b", required: false }),
                () => new NumberField({ name: "geofence_lat", required: false }),
                () => new NumberField({ name: "geofence_lng", required: false }),
                () => new NumberField({ name: "geofence_radius", required: false })
            ];

            for (const createField of fieldsToAdd) {
                const field = createField();
                if (!projects.fields.getByName(field.name)) {
                    projects.fields.add(field);
                    updated = true;
                }
            }

            // Relation to site_manager (_pb_users_auth_)
            if (!projects.fields.getByName("site_manager")) {
                const usersCollection = app.findCollectionByNameOrId("users");
                if (usersCollection) {
                    projects.fields.add(new RelationField({
                        name: "site_manager",
                        required: false,
                        collectionId: usersCollection.id,
                        cascadeDelete: false,
                        maxSelect: 1
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
