/**
 * Task-Ereignis-Trigger für Benachrichtigungen (PocketBase >= 0.23)
 *
 * Erstellt automatisch Notifications bei Task-Ereignissen:
 * - task_assigned: wenn eine neue Aufgabe erstellt wird (an assignees)
 * - status_change: wenn sich der Status einer Aufgabe ändert
 * - task_due: wenn das Fälligkeitsdatum innerhalb von 3 Tagen liegt
 *
 * WICHTIG (Befund 2026-10-22, PB 0.37): Handler laufen isoliert und sehen KEINE
 * Datei-Scope-Variablen (ReferenceError). Der frühere preUpdateCache-Ansatz war
 * damit auf PB >= 0.23 wirkungslos. Der alte Status kommt jetzt aus
 * e.record.original(). After-Event-Ketten brauchen e.next() in jedem Pfad.
 */

onRecordAfterCreateSuccess((e) => {
    try {
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

        var task = e.record;
        var assignees = task.getStringSlice('assignees') || [];
        var title = task.get('title') || 'Unbenannt';

        for (var i = 0; i < assignees.length; i++) {
            createNotification(
                assignees[i],
                'task_assigned',
                'Neue Aufgabe: ' + title,
                'Dir wurde die Aufgabe "' + title + '" zugewiesen.',
                '/tasks?search=' + encodeURIComponent(title)
            );
        }
    } catch (err) {
        console.error('[notifications_task afterCreate] Error:', err);
    }
    e.next();
}, 'tasks');

// ─── onRecordAfterUpdateSuccess (tasks) ──────────────────────────────────────

onRecordAfterUpdateSuccess((e) => {
    try {
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

        var task = e.record;
        var assignees = task.getStringSlice('assignees') || [];
        var title = task.get('title') || 'Unbenannt';

        // 1. Status-Änderung erkennen über original() (Stand vor dem Update)
        var original = (typeof task.original === 'function') ? task.original() : null;
        var oldStatus = original ? original.get('status') : null;
        var newStatus = task.get('status');

        if (oldStatus && newStatus && oldStatus !== newStatus) {
            var statusLabels = {
                todo: 'Offen',
                in_progress: 'In Arbeit',
                review: 'Prüfung',
                done: 'Erledigt',
            };
            var oldLabel = statusLabels[oldStatus] || oldStatus;
            var newLabel = statusLabels[newStatus] || newStatus;

            for (var i = 0; i < assignees.length; i++) {
                createNotification(
                    assignees[i],
                    'status_change',
                    'Status geändert: ' + title,
                    'Der Status der Aufgabe "' + title + '" wurde von "' + oldLabel + '" auf "' + newLabel + '" geändert.',
                    '/tasks?search=' + encodeURIComponent(title)
                );
            }
        }

        // 2. Fälligkeits-Prüfung (task_due)
        // PB-Datumsfelder liefern DateTime-Objekte; leere Felder sind truthy (Jahr 0001)
        // → erst über String() parsen und auf Gültigkeit prüfen.
        var dueDateRaw = task.get('due_date');
        if (dueDateRaw) {
            var dueDate = new Date(String(dueDateRaw));
            if (!isNaN(dueDate.getTime())) {
                var now = new Date();
                var threeDays = 3 * 24 * 60 * 60 * 1000;
                if (dueDate > now && dueDate.getTime() - now.getTime() <= threeDays) {
                    for (var j = 0; j < assignees.length; j++) {
                        createNotification(
                            assignees[j],
                            'task_due',
                            'Aufgabe bald fällig: ' + title,
                            'Die Aufgabe "' + title + '" ist in weniger als 3 Tagen fällig.',
                            '/tasks?search=' + encodeURIComponent(title)
                        );
                    }
                }
            }
        }
    } catch (err) {
        console.error('[notifications_task afterUpdate] Error:', err);
    }
    e.next();
}, 'tasks');
