/**
 * Impersonation API für Vibeforce Flow OS
 *
 * Erlaubt Admins, sich als ein anderer Benutzer einzuloggen:
 *   POST /api/custom/impersonate
 *
 * PocketBase v0.37+ pb_hooks API:
 *   - $app.newRecordAuthToken()    → JWT generieren
 *   - routerAdd()            → Custom Route
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

// ============================================================
// POST /api/custom/impersonate
// ============================================================
routerAdd('POST', '/api/custom/impersonate', (c) => {
    const headers = corsHeaders();

    if (c.request.method === 'OPTIONS') {
        return c.json(200, { success: true }, headers);
    }

    if (!isAdmin(c.request)) {
        return c.json(403, { success: false, message: 'Nur Administratoren können die Impersonation nutzen.' }, headers);
    }

    let body;
    try {
        body = JSON.parse(c.request.body?.read() || '{}');
    } catch (e) {
        return c.json(400, { success: false, message: 'Ungültiges JSON.' }, headers);
    }

    const targetUserId = body.targetUserId;
    if (!targetUserId) {
        return c.json(400, { success: false, message: 'targetUserId ist erforderlich.' }, headers);
    }

    try {
        const targetUser = $app.findRecordById('users', targetUserId);
        const collection = $app.findCollectionByNameOrId('users');

        const token = $app.newRecordAuthToken(collection, targetUserId, {});

        return c.json(200, {
            success: true,
            token: token,
            record: {
                id: targetUser.get('id'),
                email: targetUser.get('email'),
                first_name: targetUser.get('first_name') || '',
                last_name: targetUser.get('last_name') || '',
            },
        }, headers);
    } catch (e) {
        console.error('[ImpersonateAPI] Fehler:', e.message);
        return c.json(500, { success: false, message: 'Fehler bei der Impersonation: ' + e.message }, headers);
    }
});

// ============================================================
// OPTIONS-Handler für CORS
// ============================================================
routerAdd('OPTIONS', '/api/custom/impersonate', (c) => {
    return c.json(204, null, corsHeaders());
});

console.log('[ImpersonateAPI] ✅ Impersonation API geladen (POST /api/custom/impersonate)');
