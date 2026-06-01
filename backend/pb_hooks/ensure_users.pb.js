/**
 * Ensure Users Boot Hook für Vibeforce Flow OS
 *
 * Garantiert, dass die beiden Master-Logins bei jedem Serverstart
 * existieren und die korrekten Passwörter haben:
 *   - admin@vibeforce-flow.de  (Admin, VOLLZUGRIFF)
 *   - demo@vibeforce-flow.de   (Mitarbeiter, TEST)
 *
 * PocketBase v0.37+ pb_hooks API:
 *   - onBootstrap()                    → Wird bei Serverstart ausgeführt
 *   - $app.findAuthRecordByEmail()     → Auth-Record per E-Mail finden
 *   - $app.findCollectionByNameOrId()  → Collection-Metadaten abrufen
 *   - $app.save()                      → Record speichern/aktualisieren
 *
 * ⚠️ VOR DEM LIVE-GANG: Dieser Hook MUSS gelöscht oder deaktiviert werden,
 *    da er Passwörter bei jedem Deployment hart zurücksetzt!
 *    Siehe tasks/PRE_LAUNCH_CHECKLIST.md
 */

// ═══════════════════════════════════════════════════════════════
// ⚠️ PRE-LAUNCH DEACTIVATION — Ensure Users Hook
// ═══════════════════════════════════════════════════════════════
// Dieser Hook wurde für den Live-Gang deaktiviert, da er bei
// jedem Deployment die Passwörter hart zurücksetzt.
// Siehe: tasks/PRE_LAUNCH_CHECKLIST.md Abschnitt 1.1
//
// Zum Reaktivieren das `return;` entfernen.
// ═══════════════════════════════════════════════════════════════

onBootstrap((e) => {
    // 1. Let the system bootstrap first so that DB and collection cache are fully ready
    e.next();

    // 2. Run our logic
    try {
        // ─── ADMIN (VOLLZUGRIFF) ───────────────────────────────────
        const adminEmail = "***REMOVED***";
        const adminPassword = "***REMOVED***";

        try {
            const existing = $app.findAuthRecordByEmail("users", adminEmail);
            // User exists → reset password to guaranteed value
            existing.setPassword(adminPassword);
            existing.set("role", "admin");
            $app.save(existing);
            console.log("[ensure_users] Admin password synced: " + adminEmail);
        } catch (_) {
            // User does not exist → create
            const collection = $app.findCollectionByNameOrId("users");
            const record = new Record(collection);
            record.set("email", adminEmail);
            record.set("password", adminPassword);
            record.set("passwordConfirm", adminPassword);
            record.set("name", "Admin User");
            record.set("role", "admin");
            record.set("emailVisibility", true);
            $app.save(record);
            console.log("[ensure_users] Admin created: " + adminEmail);
        }

        // ─── MITARBEITER (TEST) ────────────────────────────────────
        const testEmail = "demo@vibeforce.de";
        const testPassword = "***REMOVED***";

        try {
            const existing = $app.findAuthRecordByEmail("users", testEmail);
            existing.setPassword(testPassword);
            existing.set("role", "employee");
            $app.save(existing);
            console.log("[ensure_users] Test user password synced: " + testEmail);
        } catch (_) {
            const collection = $app.findCollectionByNameOrId("users");
            const record = new Record(collection);
            record.set("email", testEmail);
            record.set("password", testPassword);
            record.set("passwordConfirm", testPassword);
            record.set("name", "Demo User");
            record.set("role", "employee");
            record.set("emailVisibility", true);
            $app.save(record);
            console.log("[ensure_users] Test user created: " + testEmail);
        }

        // ─── VIBEFORCE DEMO USERS ──────────────────────────────────
        const vibeforceUsers = [
            { email: "demo001@vibeforce.de", password: "Xk7mP2vL9nQ4", name: "Monika Mustermann", role: "admin" },
            { email: "demo002@vibeforce.de", password: "Rt3sD8kL1pM6", name: "Ben Beispiel", role: "employee" },
            { email: "demo003@vibeforce.de", password: "Mn9bV4cX7zL2", name: "Laura Design", role: "employee" },
            { email: "demo004@vibeforce.de", password: "Kw8pR5nJ3tF7", name: "Tom Entwickler", role: "employee" }
        ];

        for (let i = 0; i < vibeforceUsers.length; i++) {
            const u = vibeforceUsers[i];
            try {
                const existing = $app.findAuthRecordByEmail("users", u.email);
                existing.setPassword(u.password);
                existing.set("role", u.role);
                existing.set("name", u.name);
                $app.save(existing);
                console.log("[ensure_users] Vibeforce user synced: " + u.email);
            } catch (_) {
                const collection = $app.findCollectionByNameOrId("users");
                const record = new Record(collection);
                record.set("email", u.email);
                record.set("password", u.password);
                record.set("passwordConfirm", u.password);
                record.set("name", u.name);
                record.set("role", u.role);
                record.set("emailVisibility", true);
                $app.save(record);
                console.log("[ensure_users] Vibeforce user created: " + u.email);
            }
        }

        console.log("[ensure_users] Boot check complete.");
    } catch (err) {
        console.error("[ensure_users] Error:", err);
    }
});
