/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    // 1. Users: Add supervisor relation field
    try {
        const usersCollection = app.findCollectionByNameOrId("users");
        if (usersCollection && !usersCollection.fields.getByName("supervisor")) {
            usersCollection.fields.add(new RelationField({
                name: "supervisor",
                required: false,
                collectionId: usersCollection.id,
                cascadeDelete: false,
                maxSelect: 1
            }));
            app.save(usersCollection);
        }
    } catch (e) {
        console.warn("Migration warning for users.supervisor:", e);
    }

    // 2. Clients: Add billing_rounding and rounding_mode
    try {
        let clientsCollection = null;
        try {
            clientsCollection = app.findCollectionByNameOrId("clients");
        } catch (e) {
            clientsCollection = null;
        }
        if (clientsCollection) {
            let changed = false;
            if (!clientsCollection.fields.getByName("billing_rounding")) {
                clientsCollection.fields.add(new NumberField({
                    name: "billing_rounding",
                    required: false,
                    min: 0,
                    max: 60,
                    onlyInt: true
                }));
                changed = true;
            }
            if (!clientsCollection.fields.getByName("rounding_mode")) {
                clientsCollection.fields.add(new TextField({
                    name: "rounding_mode",
                    required: false,
                    max: 20
                }));
                changed = true;
            }
            if (changed) {
                app.save(clientsCollection);
            }
        }
    } catch (e) {
        console.warn("Migration warning for clients billing fields:", e);
    }

    // 3. Projects: Add billing_rounding and rounding_mode
    try {
        let projectsCollection = null;
        try {
            projectsCollection = app.findCollectionByNameOrId("projects");
        } catch (e) {
            projectsCollection = null;
        }
        if (projectsCollection) {
            let changed = false;
            if (!projectsCollection.fields.getByName("billing_rounding")) {
                projectsCollection.fields.add(new NumberField({
                    name: "billing_rounding",
                    required: false,
                    min: 0,
                    max: 60,
                    onlyInt: true
                }));
                changed = true;
            }
            if (!projectsCollection.fields.getByName("rounding_mode")) {
                projectsCollection.fields.add(new TextField({
                    name: "rounding_mode",
                    required: false,
                    max: 20
                }));
                changed = true;
            }
            if (changed) {
                app.save(projectsCollection);
            }
        }
    } catch (e) {
        console.warn("Migration warning for projects billing fields:", e);
    }

    // 4. Time Entries: Add billable_minutes
    try {
        let timeEntriesCollection = null;
        try {
            timeEntriesCollection = app.findCollectionByNameOrId("time_entries");
        } catch (e) {
            timeEntriesCollection = null;
        }
        if (timeEntriesCollection && !timeEntriesCollection.fields.getByName("billable_minutes")) {
            timeEntriesCollection.fields.add(new NumberField({
                name: "billable_minutes",
                required: false,
                min: 0,
                onlyInt: true
            }));
            app.save(timeEntriesCollection);
        }
    } catch (e) {
        console.warn("Migration warning for time_entries.billable_minutes:", e);
    }
}, (app) => {
    // Down migration
});
