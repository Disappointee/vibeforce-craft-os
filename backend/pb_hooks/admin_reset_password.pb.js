/**
 * Admin Password Reset API für Vibeforce Flow OS
 *
 * POST /api/custom/admin/reset-password
 *   → Setzt das Passwort eines beliebigen Users zurück (Admin-only)
 */

function corsHeaders() {
    const allowedOrigin = process.env.CORS_ORIGIN || $os.getenv('CORS_ORIGIN') || '*';
    return {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
}

function isAdmin(request) {
    try {
        const authRecord = request.auth;
        if (!authRecord) return false;
        return authRecord.get('role') === 'admin';
    } catch (e) {
        return false;
    }
}

routerAdd('POST', '/api/custom/admin/reset-password', (c) => {
    const headers = corsHeaders();

    let body;
    try {
        body = JSON.parse(c.request.body?.read() || '{}');
    } catch (e) {
        return c.json(400, { success: false, message: 'Ungültiges JSON.' }, headers);
    }

    const requestInfo = $apis.requestInfo(c);

    if (!isAdmin(requestInfo)) {
        return c.json(403, { success: false, message: 'Nur Administratoren können Passwörter zurücksetzen.' }, headers);
    }

    const { userId, password, passwordConfirm } = body;

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
        const user = $app.findAuthRecordById('users', userId);

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
    return c.json(204, null, corsHeaders());
});
