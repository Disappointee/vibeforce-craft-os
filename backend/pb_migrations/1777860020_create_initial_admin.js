/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    try {
        const email = ($os.getenv("POCKETBASE_ADMIN_EMAIL") || $os.getenv("PB_ADMIN_EMAIL") || "").trim();
        const password = ($os.getenv("POCKETBASE_ADMIN_PASSWORD") || $os.getenv("PB_ADMIN_PASSWORD") || "").trim();

        if (!email || !password) {
            console.log("Skipping initial admin creation: admin credentials not configured via ENV.");
            return;
        }

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
        const email = ($os.getenv("POCKETBASE_ADMIN_EMAIL") || $os.getenv("PB_ADMIN_EMAIL") || "").trim();
        if (!email) return;
        const record = app.findAuthRecordByEmail("users", email);
        app.delete(record);
    } catch (e) {}
})
