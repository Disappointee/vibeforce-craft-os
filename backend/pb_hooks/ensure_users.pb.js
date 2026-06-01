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
        const adminEmail = "admin@vibeforce-flow.de";
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
            const record = new Record(collection, {
                email: adminEmail,
                password: adminPassword,
                passwordConfirm: adminPassword,
                name: "Admin User",
                role: "admin",
                emailVisibility: true,
            });
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
            const record = new Record(collection, {
                email: testEmail,
                password: testPassword,
                passwordConfirm: testPassword,
                name: "Demo User",
                role: "employee",
                emailVisibility: true,
            });
            $app.save(record);
            console.log("[ensure_users] Test user created: " + testEmail);
        }

        console.log("[ensure_users] Boot check complete.");
    } catch (err) {
        console.error("[ensure_users] Error:", err);
    }
});
