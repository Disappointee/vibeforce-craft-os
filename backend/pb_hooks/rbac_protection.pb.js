/**
 * 🛡️ RBAC Protection Hook für Vibeforce Flow OS (PocketBase >= 0.23)
 *
 * Verhindert Privilege Escalation auf Datenbank-Ebene:
 * - Nur Superuser und Benutzer mit Rolle 'admin' dürfen die Felder 'role',
 *   'supervisor' oder 'verified' anpassen oder mit diesen Privilegien erstellen.
 * - Nicht-Admins dürfen sich selbst aktualisieren (z.B. Name, Avatar, Präferenzen),
 *   aber Versuche, 'role', 'supervisor' oder 'verified' zu ändern, werden mit
 *   ForbiddenError abgewiesen.
 *
 * WICHTIG (Befund 2026-10-22, PB 0.37): Record-Events (onRecordCreate/Update)
 * haben KEINEN HTTP-Kontext (e.httpContext existiert nicht mehr) — der frühere
 * Guard `if (!e.httpContext) return;` hat die Prüfung auf PB >= 0.23 komplett
 * deaktiviert. Auth-Infos kommen jetzt aus e.requestInfo() der Request-Events
 * (onRecordCreateRequest/onRecordUpdateRequest). Interne Systemaufrufe (Boot/CLI)
 * lösen Request-Events nicht aus und sind damit wie bisher ausgenommen.
 * Request-Hooks müssen e.next() aufrufen, um den Create/Update fortzusetzen.
 */

// ─── CREATE PROTECTION ──────────────────────────────────────
onRecordCreateRequest((e) => {
    try {
        const info = e.requestInfo();
        const isSuperuser = info.hasSuperuserAuth();
        const authRecord = info.auth;
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
onRecordUpdateRequest((e) => {
    try {
        const info = e.requestInfo();
        const authRecord = info.auth;

        // Unauthentifizierte Updates den Collection-Rules überlassen
        if (!authRecord) {
            e.next();
            return;
        }

        const isSuperuser = info.hasSuperuserAuth();
        const userRole = authRecord.get("role");

        if (!isSuperuser && userRole !== "admin") {
            const originalRecord = (typeof e.record.original === "function") ? e.record.original() : null;

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
