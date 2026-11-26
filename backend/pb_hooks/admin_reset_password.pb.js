/**
 * Admin Password Reset API für Vibeforce Flow OS
 *
 * POST /api/custom/admin/reset-password
 *   → Setzt das Passwort eines beliebigen Users zurück (Admin-only)
 *
 * Hinweis (2026-10-22, Block 2): Gemeinsame Helfer werden INNERHALB der Handler
 * per require geladen — PB >= 0.23 führt Route-Handler ohne Datei-Scope aus
 * (Datei-Funktionen wären sonst nicht sichtbar → generische 400-Fehler).
 */

routerAdd('POST', '/api/custom/admin/reset-password', (c) => {
    const helpers = require(__hooks + '/lib/cors_helpers.js');
    const headers = helpers.corsHeaders(c);

    const body = helpers.readJsonBody(c);
    if (body === null) {
        return c.json(400, { success: false, message: 'Ungültiges JSON.' }, headers);
    }

    if (!helpers.isAdmin(c)) {
        return c.json(403, { success: false, message: 'Nur Administratoren können Passwörter zurücksetzen.' }, headers);
    }

    const userId = body.userId;
    const password = body.password;
    const passwordConfirm = body.passwordConfirm;

    if (!userId || !password || !passwordConfirm) {
        return c.json(400, { success: false, message: 'userId, password und passwordConfirm sind erforderlich.' }, headers);
    }

    if (password.length < 8) {
        return c.json(400, { success: false, message: 'Passwort muss mindestens 8 Zeichen lang sein.' }, headers);
    }

    if (password !== passwordConfirm) {
        return c.json(400, { success: false, message: 'Passwörter stimmen nicht überein.' }, headers);
    }

    try {
        // PB >= 0.23: findAuthRecordById existiert nicht mehr → findRecordById
        const user = $app.findRecordById('users', userId);

        user.setPassword(password);
        user.set('passwordConfirm', passwordConfirm);
        $app.save(user);

        console.log('[AdminResetPassword] Passwort zurückgesetzt für:', user.get('email'));
        return c.json(200, { success: true, message: 'Passwort erfolgreich zurückgesetzt.' }, headers);
    } catch (e) {
        console.error('[AdminResetPassword] Fehler:', e.message);
        return c.json(500, { success: false, message: 'Fehler beim Zurücksetzen des Passworts: ' + e.message }, headers);
    }
}, $apis.requireAuth());

routerAdd('OPTIONS', '/api/custom/admin/reset-password', (c) => {
    const helpers = require(__hooks + '/lib/cors_helpers.js');
    return c.json(204, null, helpers.corsHeaders(c));
});
