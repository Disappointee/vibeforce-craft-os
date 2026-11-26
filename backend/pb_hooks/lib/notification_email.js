/**
 * E-Mail-Versand-Helfer für notifications_email.pb.js (PocketBase >= 0.23)
 *
 * WICHTIG (Befund 2026-10-22, PB 0.37): Hook-Handler laufen isoliert und sehen
 * KEINEN Datei-Scope der einbindenden Hook-Datei. Diese Logik wird deshalb
 * INNERHALB des Handlers per require(__hooks + '/lib/notification_email.js')
 * geladen; alle PB-Globals ($app, MailerMessage, APP_URL) kommen als ctx herein.
 */

var NOTIFICATION_TYPE_TO_SETTING = {
    task_assigned: 'notify_on_assignment',
    task_due: 'notify_on_due',
    task_comment: 'notify_on_mention',
    task_mention: 'notify_on_mention',
    status_change: 'notify_on_assignment',
    project_update: 'notify_on_assignment',
};

var NOTIFICATION_SUBJECTS = {
    task_assigned: 'Neue Aufgabe zugewiesen',
    task_due: 'Aufgabe bald fällig',
    task_comment: 'Neuer Kommentar zu einer Aufgabe',
    task_mention: 'Du wurdest erwähnt',
    status_change: 'Statusänderung bei einer Aufgabe',
    project_update: 'Projekt-Update',
};

function escapeHtml(value) {
    return String(value === undefined || value === null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function buildEmailHtml(appUrl, title, message, link) {
    var fullLink = link ? appUrl + link : appUrl;
    return [
        '<!DOCTYPE html>',
        '<html>',
        '<head>',
        '    <meta charset="utf-8">',
        '    <style>',
        "        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #09090b; color: #fafafa; margin: 0; padding: 0; }",
        '        .container { max-width: 600px; margin: 0 auto; padding: 32px 24px; }',
        '        .header { text-align: center; padding-bottom: 24px; border-bottom: 1px solid rgba(255,255,255,0.1); }',
        '        .logo { font-size: 24px; font-weight: bold; color: #2563EB; }',
        '        .content { padding: 24px 0; }',
        '        .title { font-size: 18px; font-weight: 600; color: #fafafa; margin-bottom: 8px; }',
        '        .message { font-size: 14px; color: #a1a1aa; line-height: 1.6; margin-bottom: 24px; }',
        '        .button { display: inline-block; padding: 12px 24px; background: #2563EB; color: #09090b; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; }',
        '        .footer { text-align: center; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.1); font-size: 12px; color: #52525b; }',
        '    </style>',
        '</head>',
        '<body>',
        '    <div class="container">',
        '        <div class="header">',
        '            <div class="logo">Vibeforce Flow OS</div>',
        '        </div>',
        '        <div class="content">',
        '            <div class="title">' + escapeHtml(title) + '</div>',
        '            <div class="message">' + escapeHtml(message) + '</div>',
        '            <a href="' + fullLink + '" class="button">Zur Benachrichtigung</a>',
        '        </div>',
        '        <div class="footer">',
        '            <p>Du erhälst diese E-Mail, weil du Benachrichtigungen in Vibeforce Flow OS aktiviert hast.</p>',
        '            <p>Du kannst deine Einstellungen in deinem <a href="' + appUrl + '/profile" style="color: #2563EB;">Profil</a> anpassen.</p>',
        '        </div>',
        '    </div>',
        '</body>',
        '</html>',
    ].join('\n');
}

/**
 * Sendet (falls aktiviert) eine E-Mail für eine neu gespeicherte Notification.
 * ctx: { app, MailerMessage, appUrl }
 */
function handleNotificationSave(e, ctx) {
    var app = ctx.app;
    var MailerMessage = ctx.MailerMessage;
    var appUrl = ctx.appUrl;
    try {
        var record = e.record;
        if (record.collection().name !== 'notifications') {
            return;
        }

        // Guard: Bereits gesendete Benachrichtigungen überspringen
        if (record.get('email_sent')) {
            return;
        }

        // Prüfen, ob SMTP konfiguriert ist
        var settings = app.settings();
        var smtp = settings.smtp;
        if (!smtp || !smtp.enabled) {
            console.log('[EmailHook] SMTP nicht konfiguriert – überspringe E-Mail-Versand');
            return;
        }

        // Benutzer abrufen
        var userId = record.get('user');
        var user;
        try {
            user = app.findRecordById('users', userId);
        } catch (err) {
            console.error('[EmailHook] Benutzer nicht gefunden:', userId);
            return;
        }

        var userEmail = user.get('email');
        if (!userEmail) {
            console.log('[EmailHook] Benutzer hat keine E-Mail-Adresse:', userId);
            return;
        }

        // Prüfen, ob der Benutzer E-Mail-Benachrichtigungen für diesen Typ aktiviert hat
        var notifType = record.get('type');
        var settingKey = NOTIFICATION_TYPE_TO_SETTING[notifType] || 'notify_on_assignment';
        if (user.get(settingKey) === false) {
            console.log('[EmailHook] Überspringe: Benutzer ' + userEmail + ' hat ' + settingKey + ' deaktiviert');
            return;
        }

        var subject = NOTIFICATION_SUBJECTS[notifType] || 'Benachrichtigung von Vibeforce Flow OS';
        var html = buildEmailHtml(appUrl, record.get('title') || '', record.get('message') || '', record.get('link') || '');

        if (!MailerMessage) {
            console.error('[EmailHook] MailerMessage-Konstruktor nicht verfügbar – E-Mail übersprungen');
            return;
        }

        var mailClient = app.newMailClient();
        var mailMessage = new MailerMessage({
            from: {
                address: (settings.meta && settings.meta.senderAddress) || 'noreply@vibeforce.de',
                name: (settings.meta && settings.meta.senderName) || 'Vibeforce Flow OS',
            },
            to: [{ address: userEmail }],
            subject: subject,
            html: html,
        });

        try {
            mailClient.send(mailMessage);
            console.log('[EmailHook] E-Mail gesendet an ' + userEmail + ': "' + subject + '"');

            // email_sent auf true setzen (Direkt via SQL um Endlosschleife zu vermeiden)
            try {
                app.db().newQuery('UPDATE notifications SET email_sent = 1 WHERE id = {:id}')
                    .bind({ id: record.id })
                    .execute();
            } catch (err) {
                console.error('[EmailHook] Fehler beim Setzen von email_sent:', err && err.message ? err.message : err);
            }
        } catch (err) {
            console.error('[EmailHook] Fehler beim Senden an ' + userEmail + ':', err && err.message ? err.message : err);
        }
    } catch (err) {
        console.error('[EmailHook] Allgemeiner Fehler:', err && err.message);
    }
}

module.exports = {
    handleNotificationSave: handleNotificationSave,
};
