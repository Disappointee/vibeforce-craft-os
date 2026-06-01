/**
 * Task-Ereignis-Trigger für Benachrichtigungen
 *
 * Erstellt automatisch Notifications bei Task-Ereignissen:
 * - task_assigned: wenn eine neue Aufgabe erstellt wird (an assignees)
 * - status_change: wenn sich der Status einer Aufgabe ändert
 * - task_due: wenn das Fälligkeitsdatum innerhalb von 3 Tagen liegt
 */

// Module-level cache for tracking pre-update state (cleared per-request)
var preUpdateCache = {};

// ─── onRecordUpdate (tasks) ─────────────────────────────────────
// Capture old status before the update for status-change detection

onRecordUpdate(function (e) {
    var taskId = e.record.get('id');
    var oldStatus = e.record.get('status');
    if (taskId && oldStatus) {
        preUpdateCache[taskId] = oldStatus;
    }
}, 'tasks');

// ─── onRecordAfterCreateSuccess (tasks) ──────────────────────────────────────

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

    var task = e.record;
    var assignees = task.getStringSlice('assignees') || [];

    for (var i = 0; i < assignees.length; i++) {
        var userId = assignees[i];
        createNotification(
            userId,
            'task_assigned',
            'Neue Aufgabe: ' + (task.get('title') || 'Unbenannt'),
            'Dir wurde die Aufgabe "' + (task.get('title') || 'Unbenannt') + '" zugewiesen.',
            '/tasks?search=' + encodeURIComponent(task.get('title') || '')
        );
    }
}, 'tasks');

// ─── onRecordAfterUpdateSuccess (tasks) ──────────────────────────────────────

onRecordAfterUpdateSuccess(function (e) {
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

    var task = e.record;
    var assignees = task.getStringSlice('assignees') || [];
    var title = task.get('title') || 'Unbenannt';
    var taskId = task.get('id');

    // 1. Status-Änderung erkennen via pre-update cache
    var oldStatus = preUpdateCache[taskId];
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
            var userId = assignees[i];
            createNotification(
                userId,
                'status_change',
                'Status geändert: ' + title,
                'Der Status der Aufgabe "' + title + '" wurde von "' + oldLabel + '" auf "' + newLabel + '" geändert.',
                '/tasks?search=' + encodeURIComponent(title)
            );
        }
    }

    // Clean up cache
    delete preUpdateCache[taskId];

    // 2. Fälligkeits-Prüfung (task_due)
    var dueDateRaw = task.get('due_date');
    if (dueDateRaw) {
        var dueDate = new Date(dueDateRaw);
        var now = new Date();
        var threeDays = 3 * 24 * 60 * 60 * 1000;
        if (dueDate > now && dueDate.getTime() - now.getTime() <= threeDays) {
            for (var j = 0; j < assignees.length; j++) {
                var uid = assignees[j];
                createNotification(
                    uid,
                    'task_due',
                    'Aufgabe bald fällig: ' + title,
                    'Die Aufgabe "' + title + '" ist in weniger als 3 Tagen fällig.',
                    '/tasks?search=' + encodeURIComponent(title)
                );
            }
        }
    }
}, 'tasks');
