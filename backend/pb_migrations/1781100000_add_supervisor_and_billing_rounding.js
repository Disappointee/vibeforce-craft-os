/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    // 1. Users: Add supervisor relation field
    try {
        const usersCollection = app.findCollectionByNameOrId("users");
        if (usersCollection) {
            const hasSupervisor = usersCollection.fields.some((f) => f.name === "supervisor");
            if (!hasSupervisor) {
                usersCollection.fields.push(new SchemaField({
                    "hidden": false,
                    "id": "rel_supervisor_17811",
                    "name": "supervisor",
                    "presentable": false,
                    "required": false,
                    "system": false,
                    "type": "relation",
                    "options": {
                        "collectionId": usersCollection.id,
                        "cascadeDelete": false,
                        "minSelect": null,
                        "maxSelect": 1,
                        "displayFields": null
                    }
                }));
                app.save(usersCollection);
            }
        }
    } catch (e) {
        console.warn("Migration warning for users.supervisor:", e);
    }

    // 2. Clients: Add billing_rounding and rounding_mode
    try {
        const clientsCollection = app.findCollectionByNameOrId("clients");
        if (clientsCollection) {
            const hasRounding = clientsCollection.fields.some((f) => f.name === "billing_rounding");
            if (!hasRounding) {
                clientsCollection.fields.push(new SchemaField({
                    "hidden": false,
                    "id": "num_billing_rounding_17811",
                    "name": "billing_rounding",
                    "presentable": false,
                    "required": false,
                    "system": false,
                    "type": "number",
                    "options": {
                        "min": 0,
                        "max": 60,
                        "noDecimal": true
                    }
                }));
            }
            const hasMode = clientsCollection.fields.some((f) => f.name === "rounding_mode");
            if (!hasMode) {
                clientsCollection.fields.push(new SchemaField({
                    "hidden": false,
                    "id": "txt_rounding_mode_17811",
                    "name": "rounding_mode",
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
            app.save(clientsCollection);
        }
    } catch (e) {
        console.warn("Migration warning for clients billing fields:", e);
    }

    // 3. Projects: Add billing_rounding and rounding_mode
    try {
        const projectsCollection = app.findCollectionByNameOrId("projects");
        if (projectsCollection) {
            const hasRounding = projectsCollection.fields.some((f) => f.name === "billing_rounding");
            if (!hasRounding) {
                projectsCollection.fields.push(new SchemaField({
                    "hidden": false,
                    "id": "num_p_billing_rounding_17811",
                    "name": "billing_rounding",
                    "presentable": false,
                    "required": false,
                    "system": false,
                    "type": "number",
                    "options": {
                        "min": 0,
                        "max": 60,
                        "noDecimal": true
                    }
                }));
            }
            const hasMode = projectsCollection.fields.some((f) => f.name === "rounding_mode");
            if (!hasMode) {
                projectsCollection.fields.push(new SchemaField({
                    "hidden": false,
                    "id": "txt_p_rounding_mode_17811",
                    "name": "rounding_mode",
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
            app.save(projectsCollection);
        }
    } catch (e) {
        console.warn("Migration warning for projects billing fields:", e);
    }

    // 4. Time Entries: Add billable_minutes
    try {
        const timeEntriesCollection = app.findCollectionByNameOrId("time_entries");
        if (timeEntriesCollection) {
            const hasBillableMinutes = timeEntriesCollection.fields.some((f) => f.name === "billable_minutes");
            if (!hasBillableMinutes) {
                timeEntriesCollection.fields.push(new SchemaField({
                    "hidden": false,
                    "id": "num_billable_minutes_17811",
                    "name": "billable_minutes",
                    "presentable": false,
                    "required": false,
                    "system": false,
                    "type": "number",
                    "options": {
                        "min": 0,
                        "max": null,
                        "noDecimal": true
                    }
                }));
                app.save(timeEntriesCollection);
            }
        }
    } catch (e) {
        console.warn("Migration warning for time_entries.billable_minutes:", e);
    }
}, (app) => {
    // Down migration
});
