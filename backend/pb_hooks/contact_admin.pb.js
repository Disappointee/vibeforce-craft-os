/**
 * Contact-Admin API für Vibeforce Flow OS
 *
 * Stellt einen benutzerdefinierten API-Endpunkt für Kontaktanfragen bereit:
 *   POST /api/custom/contact-admin → Kontaktanfrage per E-Mail an Admins senden
 *
 * Features:
 *   - Honeypot-Feld (website) gegen Bots
 *   - Rate-Limiting (max. 3 pro 60s pro IP)
 *   - E-Mail an alle Admins via SMTP
 *
 * PocketBase v0.37+ pb_hooks API:
 *   - $app.findRecordsByFilter()  → Datenbankzugriff
 *   - routerAdd()                 → Custom Route
 *   - $app.newMailClient()        → E-Mail-Client
 *   - $security.htmlEncode()      → HTML-Sicherheit
 */

// CORS-Helfer
function corsHeaders() {
    const allowedOrigin = process.env.CORS_ORIGIN || $os.getenv('CORS_ORIGIN') || '*';
    return {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
}

// ============================================================
// POST /api/custom/contact-admin
// ============================================================
routerAdd('POST', '/api/custom/contact-admin', (c) => {
    const headers = corsHeaders();

    let body;
    try {
        body = JSON.parse(c.request.body?.read() || '{}');
    } catch (e) {
        return c.json(400, { success: false, message: 'Ungültiges JSON.' }, headers);
    }

    const email = (body.email || '').trim();
    const subject = (body.subject || '').trim();
    const message = (body.message || '').trim();
    const website = (body.website || '').trim();

    // Honeypot-Check: website muss leer sein (unsichtbares Bot-Feld)
    if (website.length > 0) {
        return c.json(400, { success: false, message: 'Ungültige Anfrage.' }, headers);
    }

    // Client-IP ermitteln
    const ip = c.request.header('X-Forwarded-For')?.split(',')[0]?.trim()
        || c.request.header('X-Real-IP')
        || c.request.remoteAddr
        || 'unknown';

    // Rate-Limiting: max. 3 Requests pro 60s pro IP
    try {
        const sixtySecondsAgo = new Date(Date.now() - 60000).toISOString();
        const recentEntries = $app.findRecordsByFilter(
            'rate_limits',
            'ip = {:ip} && created >= {:since}',
            '-created',
            10,
            0,
            { ip: ip, since: sixtySecondsAgo }
        );
        if (recentEntries.length >= 3) {
            return c.json(429, {
                success: false,
                message: 'Zu viele Anfragen. Bitte versuche es später erneut.'
            }, headers);
        }
    } catch (e) {
        console.log('[ContactAdmin] Rate-Limit-Fehler:', e.message);
    }

    // Input-Validierung
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return c.json(400, { success: false, message: 'Ungültige E-Mail-Adresse.' }, headers);
    }
    if (subject.length > 200) {
        return c.json(400, { success: false, message: 'Betreff darf maximal 200 Zeichen lang sein.' }, headers);
    }
    if (message.length > 2000) {
        return c.json(400, { success: false, message: 'Nachricht darf maximal 2000 Zeichen lang sein.' }, headers);
    }
    if (subject.length === 0) {
        return c.json(400, { success: false, message: 'Betreff darf nicht leer sein.' }, headers);
    }
    if (message.length === 0) {
        return c.json(400, { success: false, message: 'Nachricht darf nicht leer sein.' }, headers);
    }

    try {
        // Admin-E-Mail-Adressen abrufen
        let adminEmails = [];
        try {
            const admins = $app.findRecordsByFilter(
                'users',
                'role = {:role}',
                '-created',
                50,
                0,
                { role: 'admin' }
            );
            adminEmails = admins.map(u => u.get('email')).filter(Boolean);
        } catch (e) {
            console.log('[ContactAdmin] Admin-Suche fehlgeschlagen:', e.message);
        }

        // Fallback, wenn keine Admins gefunden
        if (adminEmails.length === 0) {
            const fallbackEmail = ($os.getenv('CONTACT_ADMIN_FALLBACK') || '').trim();
            if (fallbackEmail) {
                adminEmails = [fallbackEmail];
            } else {
                console.log('[ContactAdmin] Keine Admin-Empfänger und kein CONTACT_ADMIN_FALLBACK gesetzt.');
                return c.json(500, { success: false, message: 'Kein Empfänger konfiguriert.' }, headers);
            }
        }

        // SMTP prüfen
        const settings = $app.settings();
        const smtpSettings = settings.smtp;
        if (!smtpSettings || !smtpSettings.enabled) {
            console.log('[ContactAdmin] SMTP nicht konfiguriert');
            return c.json(500, { success: false, message: 'E-Mail-Versand nicht verfügbar.' }, headers);
        }

        // E-Mail-HTML erstellen (mit htmlEncode gegen XSS)
        const safeSubject = $security.htmlEncode(subject);
        const safeMessage = $security.htmlEncode(message);
        const safeEmail = $security.htmlEncode(email);

        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #09090b; color: #fafafa; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 32px 24px; }
        .header { text-align: center; padding-bottom: 24px; border-bottom: 1px solid rgba(255,255,255,0.1); }
        .logo { font-size: 24px; font-weight: bold; color: #2563EB; }
        .content { padding: 24px 0; }
        .label { font-size: 12px; color: #52525b; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px; }
        .value { font-size: 14px; color: #fafafa; margin-bottom: 16px; }
        .message-text { font-size: 14px; color: #a1a1aa; line-height: 1.6; margin-bottom: 24px; white-space: pre-wrap; }
        .footer { text-align: center; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.1); font-size: 12px; color: #52525b; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">Vibeforce Flow OS</div>
        </div>
        <div class="content">
            <div class="label">Absender</div>
            <div class="value">${safeEmail}</div>
            <div class="label">Betreff</div>
            <div class="value">${safeSubject}</div>
            <div class="label">Nachricht</div>
            <div class="message-text">${safeMessage}</div>
        </div>
        <div class="footer">
            <p>Kontaktanfrage von ${safeEmail} über das Kontaktformular.</p>
        </div>
    </div>
</body>
</html>`.trim();

        const mailClient = $app.newMailClient();
        const mailMessage = new MailerMessage({
            from: {
                address: settings.mailSettings.fromAddress || 'noreply@vibeforce.de',
                name: settings.mailSettings.fromName || 'Vibeforce Flow OS',
            },
            to: adminEmails.map(addr => ({ address: addr })),
            subject: 'Kontaktanfrage: ' + subject,
            html: html,
        });

        mailClient.send(mailMessage)
            .then(() => {
                console.log('[ContactAdmin] ✅ E-Mail gesendet an Admins: ' + adminEmails.join(', '));
            })
            .catch((err) => {
                console.error('[ContactAdmin] ❌ Fehler beim Senden:', err.message);
            });

        // Rate-Limit-Eintrag speichern
        try {
            const rateLimitCollection = $app.findCollectionByNameOrId('rate_limits');
            const rateRecord = new Record(rateLimitCollection);
            rateRecord.set('ip', ip);
            $app.save(rateRecord);
        } catch (e) {
            console.log('[ContactAdmin] Rate-Limit-Eintrag nicht gespeichert:', e.message);
        }

        return c.json(200, { success: true, message: 'Nachricht erfolgreich gesendet.' }, headers);

    } catch (e) {
        console.error('[ContactAdmin] Fehler:', e.message);
        return c.json(500, { success: false, message: 'Fehler beim Senden der Nachricht.' }, headers);
    }
});

// ============================================================
// OPTIONS-Handler für CORS
// ============================================================
routerAdd('OPTIONS', '/api/custom/contact-admin', (c) => {
    return c.json(204, null, corsHeaders());
});

console.log('[ContactAdmin] ✅ Contact-Admin API geladen (POST /api/custom/contact-admin)');
