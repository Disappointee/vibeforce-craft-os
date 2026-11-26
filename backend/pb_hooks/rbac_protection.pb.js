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
        const isPrivileged = isSuperuser || userRole === "admin" || userRole === "meister";

        // Wenn nicht Superuser, Admin oder Meister
        if (!isPrivileged) {
            const requestedRole = e.record.get("role");
            if (requestedRole && requestedRole !== "employee") {
                throw new ForbiddenError("Zugriff verweigert: Nur Administratoren dürfen Benutzer mit erweiterten Rollen anlegen.");
            }
            if (e.record.get("supervisor")) {
                throw new ForbiddenError("Zugriff verweigert: Nur Administratoren dürfen Vorgesetzte zuweisen.");
            }
            if (e.record.get("hourly_rate")) {
                throw new ForbiddenError("Zugriff verweigert: Nur Administratoren dürfen den Stundensatz festlegen.");
            }
            if (e.record.get("deactivated") === true) {
                throw new ForbiddenError("Zugriff verweigert: Nur Administratoren dürfen Deaktivierungsflags setzen.");
            }
            if (e.record.get("verified") === true) {
                // Nicht-Admins können sich nicht selbst vorab verifizieren
                e.record.set("verified", false);
            }
        } else if (!isSuperuser && userRole === "meister" && e.record.get("role") === "admin") {
            throw new ForbiddenError("Zugriff verweigert: Meister dürfen keine Admin-Rolle vergeben.");
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
        const isPrivileged = isSuperuser || userRole === "admin" || userRole === "meister";
        const originalRecord = (typeof e.record.original === "function") ? e.record.original() : null;

        if (!isPrivileged) {
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

            // 4. Hourly Rate Check
            const originalHourlyRate = originalRecord ? originalRecord.get("hourly_rate") : e.record.get("hourly_rate");
            const newHourlyRate = e.record.get("hourly_rate");
            if (newHourlyRate !== originalHourlyRate) {
                throw new ForbiddenError("Zugriff verweigert: Nur Administratoren dürfen den Stundensatz anpassen.");
            }

            // 5. Deactivated State Check
            const originalDeactivated = originalRecord ? originalRecord.get("deactivated") : e.record.get("deactivated");
            const newDeactivated = e.record.get("deactivated");
            if (newDeactivated !== originalDeactivated) {
                throw new ForbiddenError("Zugriff verweigert: Nur Administratoren dürfen Benutzer deaktivieren oder reaktivieren.");
            }
        } else if (!isSuperuser && userRole === "meister") {
            const originalRole = originalRecord ? originalRecord.get("role") : e.record.get("role");
            const newRole = e.record.get("role");
            if (newRole !== originalRole && (newRole === "admin" || originalRole === "admin")) {
                throw new ForbiddenError("Zugriff verweigert: Meister dürfen keine Admin-Rollen vergeben oder entziehen.");
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

// ─── GOBD PROTECTION: SITE REPORTS ──────────────────────────
onRecordUpdateRequest((e) => {
    try {
        const info = e.requestInfo();
        if (!info.hasSuperuserAuth()) {
            const originalRecord = (typeof e.record.original === "function") ? e.record.original() : null;
            const originalStatus = originalRecord ? originalRecord.get("status") : e.record.get("status");
            if (originalStatus === "signed" || originalStatus === "invoiced") {
                throw new ForbiddenError("GoBD-Sperre: Signierte oder abgerechnete Bautagesberichte sind unveränderlich.");
            }
        }
    } catch (err) {
        if (err instanceof ForbiddenError) {
            throw err;
        }
        console.error("[rbac_protection:site_reports:update] Error:", err);
        throw new BadRequestError("GoBD-Validierung fehlgeschlagen.");
    }
    e.next();
}, "site_reports");

onRecordDeleteRequest((e) => {
    try {
        const info = e.requestInfo();
        if (!info.hasSuperuserAuth()) {
            const status = e.record.get("status");
            if (status === "signed" || status === "invoiced") {
                throw new ForbiddenError("GoBD-Sperre: Signierte oder abgerechnete Bautagesberichte dürfen nicht gelöscht werden.");
            }
        }
    } catch (err) {
        if (err instanceof ForbiddenError) {
            throw err;
        }
        console.error("[rbac_protection:site_reports:delete] Error:", err);
        throw new BadRequestError("GoBD-Validierung fehlgeschlagen.");
    }
    e.next();
}, "site_reports");
