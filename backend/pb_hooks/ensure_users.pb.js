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
        const adminEmail = ($os.getenv("POCKETBASE_ADMIN_EMAIL") || $os.getenv("PB_ADMIN_EMAIL") || "").trim();
        const adminPassword = ($os.getenv("POCKETBASE_ADMIN_PASSWORD") || $os.getenv("PB_ADMIN_PASSWORD") || "").trim();

        if (!adminEmail || !adminPassword) {
            console.log("[ensure_users] Skipped: admin credentials not configured via ENV.");
            return;
        }

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

