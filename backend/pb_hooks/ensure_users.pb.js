/**
 * 🛡️ Ensure Users Boot Hook für Vibeforce Flow OS
 *
 * Boot-Hook mit ENV-Gate (FORCE_RESET_BOOT_PASSWORDS) und Passwort-Erhalt bei bestehenden Accounts.
 * Verhindert das versehentliche Überschreiben von Passwörtern bei Re-Deployments.
 */

onBootstrap((e) => {
    e.next();
    try {
        const forceReset = $os.getenv("FORCE_RESET_BOOT_PASSWORDS") === "true";
        const adminEmail = (process.env.POCKETBASE_ADMIN_EMAIL || "admin@vibeforce-flow.de").trim();
        const adminPassword = (process.env.POCKETBASE_ADMIN_PASSWORD || "***REMOVED***").trim();

        try {
            const existing = $app.findAuthRecordByEmail("users", adminEmail);
            if (forceReset) {
                existing.setPassword(adminPassword);
                existing.set("role", "admin");
                $app.save(existing);
                console.log("[ensure_users] Admin password force-synced via ENV: " + adminEmail);
            } else {
                console.log("[ensure_users] Admin user exists (password preserved): " + adminEmail);
            }
        } catch (_) {
            const collection = $app.findCollectionByNameOrId("users");
            const record = new Record(collection, {
                email: adminEmail,
                password: adminPassword,
                passwordConfirm: adminPassword,
                name: "Admin User",
                role: "admin",
                emailVisibility: true,
            });
            $app.save(record);
            console.log("[ensure_users] Initial admin created: " + adminEmail);
        }
    } catch (err) {
        console.error("[ensure_users] Boot error:", err);
    }
});

