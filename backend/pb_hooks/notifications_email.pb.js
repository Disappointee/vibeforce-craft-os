/**
 * E-Mail-Benachrichtigungen für Vibeforce Flow OS (PocketBase >= 0.23)
 *
 * Sendet automatisch E-Mails, wenn eine neue Benachrichtigung erstellt wird
 * (sofern der Benutzer die entsprechende Einstellung aktiviert hat).
 *
 * Voraussetzung: SMTP in den PocketBase-Settings konfiguriert
 * (Settings → Mail Settings; Absender aus settings.meta.senderAddress/senderName).
 *
 * WICHTIG (Befund 2026-10-22, PB 0.37): Handler laufen isoliert und sehen KEINE
 * Datei-Scope-Variablen/-Funktionen (ReferenceError). Die Logik liegt deshalb in
 * lib/notification_email.js und wird INNERHALB des Handlers per require geladen.
 * After-Event-Ketten brauchen e.next() in jedem Pfad.
 */

onRecordAfterCreateSuccess((e) => {
    try {
        const helper = require(__hooks + '/lib/notification_email.js');
        helper.handleNotificationSave(e, {
            app: $app,
            MailerMessage: (typeof MailerMessage !== 'undefined') ? MailerMessage : null,
            appUrl: $os.getenv('APP_URL') || 'http://localhost:3000',
        });
    } catch (err) {
        console.error('[EmailHook] Wrapper-Fehler (create):', err && err.message);
    }
    e.next();
}, 'notifications');

onRecordAfterUpdateSuccess((e) => {
    try {
        const helper = require(__hooks + '/lib/notification_email.js');
        helper.handleNotificationSave(e, {
            app: $app,
            MailerMessage: (typeof MailerMessage !== 'undefined') ? MailerMessage : null,
            appUrl: $os.getenv('APP_URL') || 'http://localhost:3000',
        });
    } catch (err) {
        console.error('[EmailHook] Wrapper-Fehler (update):', err && err.message);
    }
    e.next();
}, 'notifications');
