/**
 * Settings API für Vibeforce Flow OS
 *
 * Stellt benutzerdefinierte API-Endpunkte für die System-Einstellungen bereit:
 *   GET  /api/custom/settings    → Aktuelle Einstellungen abrufen
 *   POST /api/custom/settings    → Einstellungen aktualisieren
 *   POST /api/custom/settings/test-smtp → SMTP-Verbindung testen
 *
 * Hinweis (2026-10-22, Block 2): Gemeinsame Helfer werden INNERHALB der Handler
 * per require geladen — PB >= 0.23 führt Route-Handler ohne Datei-Scope aus
 * (Datei-Funktionen sind dort nicht sichtbar → generische 400-Fehler).
 * Body wird über c.requestInfo().body gelesen (c.request.body.read() ist leer).
 */

// ============================================================
// GET /api/custom/settings
// ============================================================
routerAdd('GET', '/api/custom/settings', (c) => {
    const helpers = require(__hooks + '/lib/cors_helpers.js');
    const headers = helpers.corsHeaders(c, 'GET, POST, OPTIONS');

    // OPTIONS (CORS preflight) — wird i. d. R. bereits von PB-Core beantwortet
    if (c.request.method === 'OPTIONS') {
        return c.json(200, { success: true }, headers);
    }

    if (!helpers.isAdmin(c)) {
        return c.json(403, { success: false, message: 'Nur Administratoren können Einstellungen abrufen.' }, headers);
    }

    // Aktuelle Einstellungen aus der Datenbank laden
    let settings = null;
    try {
        const records = $app.findRecordsByFilter(
            'app_settings',
            'id != ""',
            '-created',
            1,
            0
        );
        if (records.length > 0) {
            const record = records[0];
            settings = {
                id: record.id,
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
    const helpers = require(__hooks + '/lib/cors_helpers.js');
    const headers = helpers.corsHeaders(c, 'GET, POST, OPTIONS');

    if (!helpers.isAdmin(c)) {
        return c.json(403, { success: false, message: 'Nur Administratoren können Einstellungen bearbeiten.' }, headers);
    }

    const body = helpers.readJsonBody(c);
    if (body === null) {
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

        $app.save(record);

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
    const helpers = require(__hooks + '/lib/cors_helpers.js');
    const headers = helpers.corsHeaders(c, 'GET, POST, OPTIONS');

    if (!helpers.isAdmin(c)) {
        return c.json(403, { success: false, message: 'Nur Administratoren können SMTP testen.' }, headers);
    }

    const body = helpers.readJsonBody(c);
    if (body === null) {
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
        const authRecord = c.auth;
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
// OPTIONS-Handler für CORS (werden i. d. R. vom PB-Core beantwortet)
// ============================================================
routerAdd('OPTIONS', '/api/custom/settings', (c) => {
    const helpers = require(__hooks + '/lib/cors_helpers.js');
    return c.json(204, null, helpers.corsHeaders(c, 'GET, POST, OPTIONS'));
});

routerAdd('OPTIONS', '/api/custom/settings/test-smtp', (c) => {
    const helpers = require(__hooks + '/lib/cors_helpers.js');
    return c.json(204, null, helpers.corsHeaders(c, 'GET, POST, OPTIONS'));
});

console.log('[SettingsAPI] ✅ Settings API geladen (GET/POST /api/custom/settings, POST /api/custom/settings/test-smtp)');
