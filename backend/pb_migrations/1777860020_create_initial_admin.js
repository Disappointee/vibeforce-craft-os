/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    try {
        const email = "***REMOVED***";
        const password = "***REMOVED***";

        // Check if user already exists
        try {
            app.findAuthRecordByEmail("users", email);
            console.log("User already exists, skipping creation.");
            return;
        } catch (e) {
            // User not found, proceed to create
        }

        const collection = app.findCollectionByNameOrId("users");

        const record = new Record(collection, {
            "email": email,
            "password": password,
            "passwordConfirm": password,
            "name": "Robin Lehnebach",
            "emailVisibility": true,
            "role": "admin",
            "expertise": ["sea", "tracking", "development"]
        });

        app.save(record);
        console.log("Successfully created initial admin user: " + email);
    } catch (err) {
        console.error("Error creating initial admin user:", err);
    }
}, (app) => {
    // Optional: remove the user on rollback
    try {
        const record = app.findAuthRecordByEmail("users", "***REMOVED***");
        app.delete(record);
    } catch (e) {}
})
