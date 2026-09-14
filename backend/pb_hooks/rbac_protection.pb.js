/**
 * 🛡️ RBAC Protection Hook für Vibeforce Flow OS
 *
 * Verhindert Privilege Escalation auf Datenbank-Ebene:
 * - Nur Superuser und Benutzer mit Rolle 'admin' dürfen das Feld 'role', 'supervisor' oder 'verified' anpassen oder mit diesen Privilegien erstellen.
 * - Nicht-Admins dürfen sich selbst aktualisieren (z.B. Name, Avatar, Präferenzen),
 *   aber Versuche, 'role', 'supervisor' oder 'verified' zu ändern, werden mit ForbiddenError abgewiesen.
 */

// ─── CREATE PROTECTION ──────────────────────────────────────
onRecordCreate((e) => {
    // Interne Systemaufrufe ohne HTTP-Context zulassen (z.B. Boot / CLI)
    if (!e.httpContext) {
        e.next();
        return;
    }

    try {
        const authRecord = e.httpContext.get("authRecord");
        const isSuperuser = e.httpContext.get("admin") != null;
        const userRole = authRecord ? authRecord.get("role") : null;

        // Wenn nicht Superuser und nicht Admin
        if (!isSuperuser && userRole !== "admin") {
            const requestedRole = e.record.get("role");
            if (requestedRole && requestedRole !== "employee") {
                throw new ForbiddenError("Zugriff verweigert: Nur Administratoren dürfen Benutzer mit erweiterten Rollen anlegen.");
            }
            if (e.record.get("supervisor")) {
                throw new ForbiddenError("Zugriff verweigert: Nur Administratoren dürfen Vorgesetzte zuweisen.");
            }
            if (e.record.get("verified") === true) {
                // Nicht-Admins können sich nicht selbst vorab verifizieren
                e.record.set("verified", false);
            }
        }
    } catch (err) {
        if (err instanceof ForbiddenError) {
            throw err;
        }
        console.error("[rbac_protection:create] Error:", err);
        throw new BadRequestError("Sicherheitsvalidierung bei der Benutzererstellung fehlgeschlagen.");
    }

    e.next();
}, "users");

// ─── UPDATE PROTECTION ──────────────────────────────────────
onRecordUpdate((e) => {
    // Interne Systemaufrufe ohne HTTP-Context zulassen
    if (!e.httpContext) {
        e.next();
        return;
    }

    try {
        const authRecord = e.httpContext.get("authRecord");
        
        // Unauthentifizierte Updates blockieren
        if (!authRecord) {
            e.next();
            return;
        }

        const isSuperuser = e.httpContext.get("admin") != null;
        const userRole = authRecord.get("role");

        if (!isSuperuser && userRole !== "admin") {
            const originalRecord = e.record.originalCopy();
            
            // 1. Role Check
            const originalRole = originalRecord ? originalRecord.get("role") : e.record.get("role");
            const newRole = e.record.get("role");
            if (newRole !== originalRole) {
                throw new ForbiddenError("Zugriff verweigert: Nur Administratoren dürfen Benutzer-Rollen anpassen.");
            }

            // 2. Supervisor Check
            const originalSupervisor = originalRecord ? originalRecord.get("supervisor") : e.record.get("supervisor");
            const newSupervisor = e.record.get("supervisor");
            if (newSupervisor !== originalSupervisor) {
                throw new ForbiddenError("Zugriff verweigert: Nur Administratoren dürfen Vorgesetzte zuweisen.");
            }

            // 3. Verified State Check (Deaktivieren/Aktivieren)
            const originalVerified = originalRecord ? originalRecord.get("verified") : e.record.get("verified");
            const newVerified = e.record.get("verified");
            if (newVerified !== originalVerified) {
                throw new ForbiddenError("Zugriff verweigert: Nur Administratoren dürfen Benutzer aktivieren oder deaktivieren.");
            }
        }
    } catch (err) {
        if (err instanceof ForbiddenError) {
            throw err;
        }
        console.error("[rbac_protection:update] Error:", err);
        throw new BadRequestError("Sicherheitsvalidierung bei der Benutzeraktualisierung fehlgeschlagen.");
    }

    e.next();
}, "users");

