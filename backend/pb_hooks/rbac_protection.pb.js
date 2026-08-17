/**
 * RBAC Protection Hook für Vibeforce Flow OS
 *
 * Verhindert Privilege Escalation auf Datenbank-Ebene:
 * - Nur Superuser und Benutzer mit Rolle 'admin' dürfen das Feld 'role', 'supervisor' oder 'verified' anpassen.
 * - Nicht-Admins dürfen sich selbst aktualisieren (z.B. Name, Avatar, Präferenzen),
 *   aber Versuche, 'role', 'supervisor' oder 'verified' zu ändern, werden mit ForbiddenError abgewiesen.
 */

onRecordUpdate((e) => {
    try {
        const authRecord = e.httpContext?.get("authRecord");
        
        // Superuser oder interne Systemaufrufe
        if (!authRecord) {
            e.next();
            return;
        }

        const isSuperuser = e.httpContext?.get("admin") != null;
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
        console.error("[rbac_protection] Error:", err);
    }

    e.next();
}, "users");
