/**
 * @-Mention Parser & Notification Trigger für Kommentare (PocketBase >= 0.23)
 *
 * Wird bei jedem neu erstellten Kommentar ausgeführt:
 * 1. Nutzt bevorzugt das `mentions`-JSON-Feld (aufgelöste User-IDs aus der App)
 * 2. Fallback: parst den Kommentartext auf @-Mentions (z. B. "@Robin")
 * 3. Sendet eine task_mention-Notification an den erwähnten User
 *    (mit 60s-Dedup, damit wiederholte Trigger keine Duplikate erzeugen)
 *
 * WICHTIG (Befund 2026-10-22, PB 0.37):
 * - Handler laufen isoliert (kein Datei-Scope) → Parser liegt im Handler; e.next() in jedem Pfad.
 * - Schema-Fix: task_comments nutzt `content`/`author`/`mentions` — die alten Feldnamen
 *   `text`/`user` existieren nicht (Hook war dadurch wirkungslos).
 * - ACHTUNG Duplikat-Quelle: Die App erzeugt Mention-Notifications zusätzlich in
 *   frontend/src/app/actions/comments.ts. Bei einer späteren Aktivierung der Hooks
 *   muss eine der beiden Quellen entfallen (sonst doppelte Benachrichtigungen).
 */

onRecordAfterCreateSuccess((e) => {
    /**
     * Fallback-Parser: extrahiert alle @-Mentions aus einem Text.
     * Pattern: @(\w+(?:[.\-_]\w+)*) — z. B. @Robin, @max.mustermann, @user_name
     */
    function parseMentions(text) {
        if (!text || typeof text !== 'string') return [];
        const pattern = /@(\w+(?:[.\-_]\w+)*)/g;
        const mentions = [];
        let match;
        while ((match = pattern.exec(text)) !== null) {
            mentions.push(match[1]);
        }
        return mentions;
    }

    function createNotification(userId, type, title, message, link) {
        const collection = $app.findCollectionByNameOrId('notifications');
        const record = new Record(collection);
        record.set('user', userId);
        record.set('type', type);
        record.set('title', title);
        record.set('message', message);
        record.set('link', link || '');
        record.set('read', false);
        $app.save(record);
    }

    function hasRecentMentionNotification(userId) {
        try {
            // PB-Zeitformat (Leerzeichen statt 'T'), sonst matcht der Stringvergleich nie
            const cutoff = new Date(Date.now() - 60000).toISOString().replace('T', ' ');
            $app.findFirstRecordByFilter(
                'notifications',
                'user = {:userId} && type = {:notifType} && created >= {:cutoff}',
                { userId: userId, notifType: 'task_mention', cutoff: cutoff }
            );
            return true;
        } catch (_) {
            return false;
        }
    }

    try {
        const comment = e.record;
        const taskId = comment.get('task') || '';
        const authorId = comment.get('author') || '';

        if (taskId) {
            // 1. Bevorzugt: aufgelöste User-IDs aus dem mentions-Feld
            let targetIds = [];
            try {
                const raw = comment.get('mentions');
                if (Array.isArray(raw)) {
                    targetIds = raw.filter((x) => typeof x === 'string' && x);
                } else if (raw) {
                    const parsed = JSON.parse(raw);
                    if (Array.isArray(parsed)) {
                        targetIds = parsed.filter((x) => typeof x === 'string' && x);
                    }
                }
            } catch (_) {
                targetIds = [];
            }

            // 2. Fallback: @-Namen im Inhalt auflösen
            if (targetIds.length === 0) {
                const content = comment.get('content') || '';
                for (const username of parseMentions(content)) {
                    try {
                        const users = $app.findRecordsByFilter(
                            'users',
                            'name = {:name}',
                            '', // sort
                            1,  // limit
                            0,  // offset
                            { name: username }
                        );
                        if (users.length > 0) {
                            targetIds.push(users[0].get('id'));
                        }
                    } catch (err) {
                        console.error('[notifications_comment] Mention-Lookup:', err);
                    }
                }
            }

            for (const userId of targetIds) {
                try {
                    // Nicht an sich selbst benachrichtigen
                    if (userId === authorId) continue;

                    // Dedup: nicht mehrfach für denselben User innerhalb von 60s
                    if (hasRecentMentionNotification(userId)) continue;

                    createNotification(
                        userId,
                        'task_mention',
                        'Du wurdest in einem Kommentar erwähnt',
                        'Du wurdest von einem anderen Benutzer in einem Kommentar erwähnt.',
                        '/tasks?task=' + encodeURIComponent(taskId)
                    );
                } catch (err) {
                    console.error('[notifications_comment]', err);
                }
            }
        }
    } catch (err) {
        console.error('[notifications_comment] Handler-Fehler:', err);
    }
    e.next();
}, 'task_comments');
