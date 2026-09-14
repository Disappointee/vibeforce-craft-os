/**
 * E-Mail-Benachrichtigungen für Vibeforce Flow OS
 * 
 * Dieses PocketBase Hook sendet automatisch E-Mails, wenn eine neue
 * Benachrichtigung erstellt wird (sofern der Benutzer die entsprechende
 * Einstellung aktiviert hat).
 * 
 * Voraussetzung: SMTP muss in PocketBase Admin UI konfiguriert sein:
 *   Settings → Mail Settings → SMTP konfigurieren
 * 
 * PocketBase v0.37+ pb_hooks API:
 *   - onRecordAfterCreate        → nachdem ein Record erstellt wurde
 *   - $app.newMailClient()        → E-Mail versenden
 *   - $app.dao().findRecordById() → Record abfragen
 */

// Mapping von Benachrichtigungstyp zu User-Setting
const NOTIFICATION_TYPE_TO_SETTING = {
    task_assigned: 'notify_on_assignment',
    task_due: 'notify_on_due',
    task_comment: 'notify_on_mention',
    task_mention: 'notify_on_mention',
    status_change: 'notify_on_assignment',
    project_update: 'notify_on_assignment',
};

// Mapping von Benachrichtigungstyp zu deutschem Betreff
const NOTIFICATION_SUBJECTS = {
    task_assigned: 'Neue Aufgabe zugewiesen',
    task_due: 'Aufgabe bald fällig',
    task_comment: 'Neuer Kommentar zu einer Aufgabe',
    task_mention: 'Du wurdest erwähnt',
    status_change: 'Statusänderung bei einer Aufgabe',
    project_update: 'Projekt-Update',
};

// App URL aus Umgebungsvariable oder Standard
const APP_URL = $os.getenv('APP_URL') || 'http://localhost:3000';

/**
 * HTML-E-Mail-Template erstellen
 */
function buildEmailHtml(title, message, link) {
    const fullLink = link ? APP_URL + link : APP_URL;
    return `
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
        .title { font-size: 18px; font-weight: 600; color: #fafafa; margin-bottom: 8px; }
        .message { font-size: 14px; color: #a1a1aa; line-height: 1.6; margin-bottom: 24px; }
        .button { display: inline-block; padding: 12px 24px; background: #2563EB; color: #09090b; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; }
        .footer { text-align: center; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.1); font-size: 12px; color: #52525b; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">Vibeforce Flow OS</div>
        </div>
        <div class="content">
            <div class="title">${$security.htmlEncode(title)}</div>
            <div class="message">${$security.htmlEncode(message)}</div>
            <a href="${fullLink}" class="button">Zur Benachrichtigung</a>
        </div>
        <div class="footer">
            <p>Du erhälst diese E-Mail, weil du Benachrichtigungen in Vibeforce Flow OS aktiviert hast.</p>
            <p>Du kannst deine Einstellungen in deinem <a href="${APP_URL}/profile" style="color: #2563EB;">Profil</a> anpassen.</p>
        </div>
    </div>
</body>
</html>`.trim();
}

/**
 * Hook: Nachdem eine Benachrichtigung gespeichert wurde
 */
function handleNotificationSave(e) {
    if (e.record.collection().name !== "notifications") {
        return;
    }
    try {
        const record = e.record;
        const notification = record;
        const userId = notification.get('user');
        const notifType = notification.get('type');
        const title = notification.get('title') || '';
        const message = notification.get('message') || '';
        const link = notification.get('link') || '';

        // Guard: Bereits gesendete Benachrichtigungen überspringen
        if (notification.get('email_sent')) {
            return;
        }

        // Prüfen, ob SMTP konfiguriert ist
        const settings = $app.settings();
        const smtpSettings = settings.smtp;
        if (!smtpSettings || !smtpSettings.enabled) {
            console.log('[EmailHook] SMTP nicht konfiguriert – überspringe E-Mail-Versand');
            console.log('[EmailHook] Bitte SMTP in PocketBase Admin UI konfigurieren: Settings → Mail Settings');
            return;
        }

        // Benutzer abrufen
        let user;
        try {
            user = $app.findRecordById('users', userId);
        } catch (err) {
            console.error('[EmailHook] Benutzer nicht gefunden:', userId);
            return;
        }

        if (!user) return;

        const userEmail = user.get('email');
        if (!userEmail) {
            console.log('[EmailHook] Benutzer hat keine E-Mail-Adresse:', userId);
            return;
        }

        // Prüfen, ob der Benutzer E-Mail-Benachrichtigungen für diesen Typ aktiviert hat
        const settingKey = NOTIFICATION_TYPE_TO_SETTING[notifType] || 'notify_on_assignment';
        const userSetting = user.get(settingKey);

        if (userSetting === false) {
            console.log(`[EmailHook] Überspringe: Benutzer ${userEmail} hat ${settingKey} deaktiviert`);
            return;
        }

        // E-Mail-Betreff
        const subject = NOTIFICATION_SUBJECTS[notifType] || 'Benachrichtigung von Vibeforce Flow OS';
        const html = buildEmailHtml(title, message, link);

        // E-Mail versenden
        const mailClient = $app.newMailClient();
        const mailMessage = new MailerMessage({
            from: {
                address: settings.mailSettings.fromAddress || 'noreply@vibeforce.de',
                name: settings.mailSettings.fromName || 'Vibeforce Flow OS',
            },
            to: [{ address: userEmail }],
            subject: subject,
            html: html,
        });

        mailClient.send(mailMessage)
            .then(() => {
                console.log(`[EmailHook] ✅ E-Mail gesendet an ${userEmail}: "${subject}"`);

                // email_sent auf true setzen (Direkt via SQL um Endlosschleife zu vermeiden)
                try {
                    $app.db().newQuery("UPDATE notifications SET email_sent = 1 WHERE id = {:id}")
                        .bind({ "id": record.getId() })
                        .execute();
                } catch (err) {
                    console.error('[EmailHook] Fehler beim Setzen von email_sent:', err.message);
                }
            })
            .catch((err) => {
                console.error(`[EmailHook] ❌ Fehler beim Senden an ${userEmail}:`, err.message);
            });

    } catch (err) {
        console.error('[EmailHook] Allgemeiner Fehler:', err.message);
    }
}

onRecordAfterCreateSuccess(handleNotificationSave, 'notifications');
onRecordAfterUpdateSuccess(handleNotificationSave, 'notifications');
