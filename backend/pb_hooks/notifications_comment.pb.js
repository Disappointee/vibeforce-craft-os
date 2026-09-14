/**
 * @-Mention Parser & Notification Trigger für Kommentare
 *
 * Wird bei jedem neu erstellten Kommentar ausgeführt:
 * 1. Parst den Kommentartext auf @-Mentions (z. B. "@Robin")
 * 2. Findet den User anhand des Namens
 * 3. Sendet eine task_mention-Notification an den erwähnten User
 */

// ─── @-Mention Parser ─────────────────────────────────────────────────

/**
 * Extrahiert alle @-Mentions aus einem Text.
 * @param {string} text - Der Kommentartext
 * @returns {string[]} - Liste der erwähnten Usernamen (ohne @)
 *
 * Pattern-Dokumentation:
 *   @(\w+(?:[.\-_]\w+)*)
 *   - @                 → Literal @
 *   - \w+               → Ein oder mehrere Wortzeichen (Buchstaben, Ziffern, _)
 *   - (?:[.\-_]\w+)*    → Optional: Punkt/Bindestrich/Unterstrich gefolgt von weiteren Wortzeichen
 *   Beispiele: @Robin, @max.mustermann, @anna-maria, @user_name
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

// ─── onRecordAfterCreateSuccess (task_comments) ──────────────────────────────

onRecordAfterCreateSuccess(function (e) {
    // Helper inside handler scope
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

    const comment = e.record;
    const commentText = comment.get('text') || '';
    const taskId = comment.get('task') || '';

    if (!commentText || !taskId) return;

    const mentions = parseMentions(commentText);
    if (mentions.length === 0) return;

    const authorId = comment.get('user') || '';

    for (const username of mentions) {
        try {
            // Suche User anhand des Namens (case-insensitive)
            const users = $app.findRecordsByFilter(
                'users',
                'name = {:name}',
                '', // sort
                1,  // limit
                0,  // offset
                { name: username }
            );

            if (users.length === 0) continue;
            const mentionedUser = users[0];

            // Nicht an sich selbst benachrichtigen
            if (mentionedUser.get('id') === authorId) continue;

            createNotification(
                mentionedUser.get('id'),
                'task_mention',
                'Du wurdest in einem Kommentar erwähnt',
                'Du wurdest von einem anderen Benutzer in einem Kommentar mit @"' + username + '" erwähnt.',
                '/tasks?search=' + encodeURIComponent(taskId)
            );
        } catch (err) {
            console.error('[notifications_comment]', err);
        }
    }
}, 'task_comments');
