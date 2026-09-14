/**
 * Settings API für Vibeforce Flow OS
 *
 * Stellt benutzerdefinierte API-Endpunkte für die System-Einstellungen bereit:
 *   GET  /api/custom/settings    → Aktuelle Einstellungen abrufen
 *   POST /api/custom/settings    → Einstellungen aktualisieren
 *   POST /api/custom/settings/test-smtp → SMTP-Verbindung testen
 *
 * PocketBase v0.37+ pb_hooks API:
 *   - $app.dao()              → Datenbankzugriff
 *   - routerAdd(method, path, handler) → Custom Route
 *   - $app.newMailClient()    → E-Mail-Client
 *   - $app.settings()         → PocketBase Settings lesen
 */

// CORS-Helfer
function corsHeaders() {
    // PRE-LAUNCH: CORS auf Produktionsdomain einschränken
    // Ersetze '*' durch die tatsächliche Domain (z.B. 'https://app.vibeforce.de')
    // Siehe: tasks/PRE_LAUNCH_CHECKLIST.md Abschnitt 3.4
    const allowedOrigin = process.env.CORS_ORIGIN || $os.getenv('CORS_ORIGIN') || '*';
    return {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
}

// Admin-Check: Ist der Benutzer ein Admin?
function isAdmin(request) {
    try {
        const authRecord = request.auth;
        if (!authRecord) return false;
        return authRecord.get('role') === 'admin';
    } catch (e) {
        return false;
    }
}

// Aktuelle Einstellungen aus der Datenbank laden
function getSettings(app) {
    try {
        const records = app.findRecordsByFilter(
            'app_settings',
            'id != ""',
            '-created',
            1,
            0
        );
        if (records.length > 0) {
            const record = records[0];
            return {
                id: record.getId(),
                app_name: record.get('app_name') || 'Vibeforce Flow OS',
                app_logo_url: record.get('app_logo_url') || '',
                smtp_host: record.get('smtp_host') || '',
                smtp_port: record.get('smtp_port') || 587,
                smtp_username: record.get('smtp_username') || '',
                smtp_password: record.get('smtp_password') || '',
                smtp_from_address: record.get('smtp_from_address') || '',
                smtp_from_name: record.get('smtp_from_name') || '',
                smtp_tls: record.get('smtp_tls') || false,
                updated: record.get('updated') || '',
            };
        }
    } catch (e) {
        console.log('[SettingsAPI] Fehler beim Laden:', e.message);
    }
    return null;
}

// ============================================================
// GET /api/custom/settings
// ============================================================
routerAdd('GET', '/api/custom/settings', (c) => {
    const headers = corsHeaders();

    // OPTIONS (CORS preflight)
    if (c.request.method === 'OPTIONS') {
        return c.json(200, { success: true }, headers);
    }

    if (!isAdmin(c.request)) {
        return c.json(403, { success: false, message: 'Nur Administratoren können Einstellungen abrufen.' }, headers);
    }

    const settings = getSettings($app);
    if (!settings) {
        // Keine Einstellungen vorhanden → Standardwerte zurückgeben
        return c.json(200, {
            success: true,
            data: {
                app_name: 'Vibeforce Flow OS',
                app_logo_url: '',
                smtp_host: '',
                smtp_port: 587,
                smtp_username: '',
                smtp_password: '',
                smtp_from_address: '',
                smtp_from_name: '',
                smtp_tls: false,
            }
        }, headers);
    }

    // Passwort nie im Klartext zurückgeben (außer Platzhalter)
    if (settings.smtp_password) {
        settings.smtp_password = '********';
    }

    return c.json(200, { success: true, data: settings }, headers);
});

// ============================================================
// POST /api/custom/settings
// ============================================================
routerAdd('POST', '/api/custom/settings', (c) => {
    const headers = corsHeaders();

    if (!isAdmin(c.request)) {
        return c.json(403, { success: false, message: 'Nur Administratoren können Einstellungen bearbeiten.' }, headers);
    }

    let body;
    try {
        body = JSON.parse(c.request.body?.read() || '{}');
    } catch (e) {
        return c.json(400, { success: false, message: 'Ungültiges JSON.' }, headers);
    }

    try {
        const records = $app.findRecordsByFilter(
            'app_settings',
            'id != ""',
            '-created',
            1,
            0
        );

        let record;
        const isNew = records.length === 0;

        if (isNew) {
            record = new Record($app.findCollectionByNameOrId('app_settings'));
        } else {
            record = records[0];
        }

        // Felder aktualisieren
        const fields = ['app_name', 'app_logo_url', 'smtp_host', 'smtp_port', 'smtp_username',
            'smtp_password', 'smtp_from_address', 'smtp_from_name', 'smtp_tls'];

        fields.forEach((field) => {
            if (body[field] !== undefined) {
                // Passwort nicht überschreiben, wenn Platzhalter gesendet wird
                if (field === 'smtp_password' && body[field] === '********') return;
                record.set(field, body[field]);
            }
        });

        // Standard-App-Namen setzen falls leer
        if (!record.get('app_name')) {
            record.set('app_name', 'Vibeforce Flow OS');
        }

        if (isNew) {
            $app.save(record);
        } else {
            $app.save(record);
        }

        // Versuche, SMTP in PocketBase-internen Settings zu setzen
        try {
            const pbSettings = $app.settings();
            if (body.smtp_host) {
                pbSettings.smtp.enabled = true;
                pbSettings.smtp.host = body.smtp_host;
                pbSettings.smtp.port = parseInt(body.smtp_port) || 587;
                pbSettings.smtp.username = body.smtp_username || '';
                if (body.smtp_password && body.smtp_password !== '********') {
                    pbSettings.smtp.password = body.smtp_password;
                }
                pbSettings.mailSettings.fromAddress = body.smtp_from_address || 'noreply@vibeforce.de';
                pbSettings.mailSettings.fromName = body.smtp_from_name || 'Vibeforce Flow OS';
                $app.saveSettings(pbSettings);
                console.log('[SettingsAPI] ✅ SMTP in PocketBase-Settings aktualisiert');
            }
        } catch (e) {
            console.log('[SettingsAPI] Konnte PB-interne SMTP-Settings nicht setzen:', e.message);
        }

        console.log('[SettingsAPI] ✅ Einstellungen gespeichert');

        return c.json(200, {
            success: true,
            message: 'Einstellungen erfolgreich gespeichert.'
        }, headers);

    } catch (e) {
        console.error('[SettingsAPI] Fehler:', e.message);
        return c.json(500, { success: false, message: 'Fehler beim Speichern: ' + e.message }, headers);
    }
});

// ============================================================
// POST /api/custom/settings/test-smtp
// ============================================================
routerAdd('POST', '/api/custom/settings/test-smtp', (c) => {
    const headers = corsHeaders();

    if (!isAdmin(c.request)) {
        return c.json(403, { success: false, message: 'Nur Administratoren können SMTP testen.' }, headers);
    }

    let body;
    try {
        body = JSON.parse(c.request.body?.read() || '{}');
    } catch (e) {
        return c.json(400, { success: false, message: 'Ungültiges JSON.' }, headers);
    }

    try {
        // Temporären MailClient erstellen und Verbindung testen
        const mailClient = $app.newMailClient({
            host: body.smtp_host || '',
            port: parseInt(body.smtp_port) || 587,
            username: body.smtp_username || '',
            password: body.smtp_password || '',
            tls: body.smtp_tls !== false,
        });

        // Wir versuchen, eine Test-E-Mail an den Admin selbst zu senden
        const authRecord = c.request.auth;
        const adminEmail = authRecord.get('email');

        const testMessage = new MailerMessage({
            from: {
                address: body.smtp_from_address || 'noreply@vibeforce.de',
                name: body.smtp_from_name || 'Vibeforce Flow OS',
            },
            to: [{ address: adminEmail }],
            subject: 'SMTP-Test von Vibeforce Flow OS',
            html: '<h2>SMTP-Test erfolgreich</h2><p>Deine SMTP-Konfiguration funktioniert korrekt.</p>',
        });

        mailClient.send(testMessage)
            .then(() => {
                console.log('[SettingsAPI] ✅ SMTP-Test-E-Mail gesendet an:', adminEmail);
            })
            .catch((err) => {
                console.error('[SettingsAPI] ❌ SMTP-Test fehlgeschlagen:', err.message);
            });

        return c.json(200, {
            success: true,
            message: 'Test-E-Mail wird an ' + adminEmail + ' gesendet. Bitte Posteingang prüfen.'
        }, headers);

    } catch (e) {
        console.error('[SettingsAPI] SMTP-Test-Fehler:', e.message);
        return c.json(500, {
            success: false,
            message: 'SMTP-Test fehlgeschlagen: ' + e.message
        }, headers);
    }
});

// ============================================================
// OPTIONS-Handler für CORS
// ============================================================
routerAdd('OPTIONS', '/api/custom/settings', (c) => {
    return c.json(204, null, corsHeaders());
});

routerAdd('OPTIONS', '/api/custom/settings/test-smtp', (c) => {
    return c.json(204, null, corsHeaders());
});

console.log('[SettingsAPI] ✅ Settings API geladen (GET/POST /api/custom/settings, POST /api/custom/settings/test-smtp)');
