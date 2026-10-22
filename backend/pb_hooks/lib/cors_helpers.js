/**
 * Gemeinsame pb_hooks-Helfer (PocketBase >= 0.23)
 *
 * WICHTIG (Befund 2026-10-22, PB 0.37): Route-Handler sehen KEINE
 * Datei-Scope-Funktionen der einbindenden Hook-Datei (ReferenceError →
 * generische 400-Antwort). Helfer müssen daher als Modul per
 * `require(__hooks + '/lib/cors_helpers.js')` INNERHALB des Handlers geladen werden.
 */

module.exports = {
    /**
     * CORS-Header: nur konkrete Origins aus CORS_ORIGIN (Komma-getrennt),
     * kein '*'-Fallback. Reflektiert die Request-Origin, wenn sie erlaubt ist.
     * Setzt die Header direkt am Response (PB >= 0.23 ignoriert das
     * 3. c.json()-Argument) und gibt sie zusätzlich zurück (Alt-PB-Kompatibilität).
     */
    corsHeaders: function (c, methods) {
        var raw = process.env.CORS_ORIGIN || $os.getenv('CORS_ORIGIN') || 'http://localhost:3000,http://localhost:3001';
        var allowed = raw.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
        var origin = allowed.length ? allowed[0] : 'http://localhost:3000';
        try {
            var reqOrigin = c.request.header.get('Origin') || '';
            if (reqOrigin && allowed.indexOf(reqOrigin) !== -1) {
                origin = reqOrigin;
            }
        } catch (e) {
            // kein Request-Kontext → erste erlaubte Origin
        }
        var headers = {
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Methods': methods || 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Vary': 'Origin',
        };
        try {
            var rh = c.response.header();
            for (var key in headers) { rh.set(key, headers[key]); }
        } catch (e) {
            // ältere PB-Versionen: Header kommen über die Rückgabe in c.json()
        }
        return headers;
    },

    /**
     * Admin-Check über c.auth (PB >= 0.23; ersetzt $apis.requestInfo + request.auth).
     */
    isAdmin: function (c) {
        try {
            var authRecord = c.auth;
            if (!authRecord) return false;
            return authRecord.get('role') === 'admin';
        } catch (e) {
            return false;
        }
    },

    /**
     * JSON-Body lesen. PB >= 0.23: c.request.body.read() liefert leer →
     * stattdessen c.requestInfo().body (bereits geparst).
     * Rückgabe: Objekt oder null (ungültiges JSON / kein Body).
     */
    readJsonBody: function (c) {
        try {
            var ri = c.requestInfo();
            if (ri && ri.body && typeof ri.body === 'object') return ri.body;
            return {};
        } catch (e) {
            return null;
        }
    },
};
