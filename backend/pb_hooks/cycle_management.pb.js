/**
 * Cycle Management für Vibeforce Flow OS
 *
 * Dieses PocketBase Hook behandelt den automatischen Rollover von Tasks
 * am Ende eines Projekt-Cycles:
 *   - Tasks mit Status 'done' bleiben abgeschlossen
 *   - Tasks mit Status 'todo', 'in_progress', 'review' werden in den
 *     nächsten Cycle übernommen (due_date wird angepasst)
 *   - Der cycle_number des Projekts wird inkrementiert
 *   - Eine Benachrichtigung wird für alle Projekt-Mitglieder erstellt
 *
 * PocketBase v0.37+ pb_hooks API:
 *   - onModelAfterSave / onModelAfterUpdate
 *   - $app.dao().findRecordsByFilter()
 *   - $app.dao().saveRecord()
 */

/**
 * Prüft, ob ein Cycle abgelaufen ist und führt ggf. den Rollover durch.
 * Wird aufgerufen, wenn ein Projekt aktualisiert wird (cycle_end_date geändert).
 */
onRecordAfterUpdateSuccess((e) => {
    if (e.record.collection().name !== "projects") {
        return;
    }

    try {
        const project = e.record;
        const cycleEndDate = project.get("cycle_end_date");
        const cycleStartDate = project.get("cycle_start_date");

        // Nur ausführen, wenn cycle_end_date gesetzt ist
        if (!cycleEndDate) {
            return;
        }

        const now = new Date();
        const endDate = new Date(cycleEndDate);

        // Nur ausführen, wenn das Cycle-Ende in der Vergangenheit liegt
        // UND ein cycle_start_date gesetzt ist (d.h. der Cycle wurde aktiv gestartet)
        if (endDate > now || !cycleStartDate) {
            return;
        }

        const projectId = project.getId();
        console.log(`[CycleMgmt] 🔄 Cycle-Rollover für Projekt ${projectId} gestartet`);

        // Alle offenen Tasks für dieses Projekt abrufen
        const openTasks = $app.findRecordsByFilter(
            "tasks",
            "project = {:projectId} && status != {:doneStatus}",
            "-created",
            0,
            0,
            { projectId: projectId, doneStatus: "done" }
        );

        print(`[CycleMgmt]   ${openTasks.length} offene Tasks gefunden`);

        // Neues Cycle-Ende berechnen (gleiche Dauer wie vorheriger Cycle)
        const oldStart = new Date(cycleStartDate);
        const oldEnd = new Date(cycleEndDate);
        const cycleDuration = oldEnd.getTime() - oldStart.getTime();

        const newStart = new Date(oldEnd);
        const newEnd = new Date(newStart.getTime() + cycleDuration);

        // Offene Tasks in den nächsten Cycle verschieben
        for (const task of openTasks) {
            const oldDueDate = task.get("due_date");

            // due_date um die Cycle-Dauer verschieben
            if (oldDueDate) {
                const oldDue = new Date(oldDueDate);
                const newDue = new Date(oldDue.getTime() + cycleDuration);
                task.set("due_date", newDue.toISOString());
            }

            // start_date um die Cycle-Dauer verschieben
            const oldStartDate = task.get("start_date");
            if (oldStartDate) {
                const oldStartTask = new Date(oldStartDate);
                const newStartTask = new Date(oldStartTask.getTime() + cycleDuration);
                task.set("start_date", newStartTask.toISOString());
            }

            try {
                $app.save(task);
            } catch (err) {
                console.error(`[CycleMgmt]   ❌ Fehler beim Speichern von Task ${task.getId()}:`, err.message);
            }
        }

        // Projekt-Cycle-Daten aktualisieren
        project.set("cycle_start_date", newStart.toISOString());
        project.set("cycle_end_date", newEnd.toISOString());
        project.set("cycle_number", (project.get("cycle_number") || 0) + 1);

        try {
            $app.save(project);
            console.log(`[CycleMgmt] ✅ Cycle-Rollover abgeschlossen: Cycle #${project.get("cycle_number")}`);
        } catch (err) {
            console.error(`[CycleMgmt] ❌ Fehler beim Speichern des Projekts:`, err.message);
        }

        // Benachrichtigungen für alle Projekt-Mitglieder erstellen
        const members = project.get("members");
        if (members && members.length > 0) {
            const projectName = project.get("name") || "Unbekanntes Projekt";
            const newCycleNumber = project.get("cycle_number");

            for (const userId of members) {
                try {
                    let notification;
                    try {
                        notification = $app.findFirstRecordByFilter(
                            "notifications",
                            "user = {:userId} && type = {:notifType} && created >= {:cutoff}",
                            { userId: userId, notifType: "cycle_rollover", cutoff: new Date(Date.now() - 60000).toISOString() }
                        );
                    } catch (_) {
                        notification = null;
                    }

                    // Nur erstellen, wenn nicht bereits eine für diesen User in den letzten 60s existiert
                    if (!notification) {
                        const collection = $app.findCollectionByNameOrId("notifications");
                        const newNotif = new Record(collection, {
                            user: userId,
                            type: "cycle_rollover",
                            title: `Cycle-Rollover: ${projectName}`,
                            message: `Der Cycle für ${projectName} wurde automatisch verlängert. ${openTasks.length} offene Tasks wurden in Cycle #${newCycleNumber} übernommen.`,
                            link: `/projects/${projectId}`,
                            is_read: false,
                        });
                        $app.save(newNotif);
                    }
                } catch (err) {
                    console.error(`[CycleMgmt]   ⚠️ Fehler beim Erstellen der Benachrichtigung für ${userId}:`, err.message);
                }
            }
            console.log(`[CycleMgmt]   ${members.length} Benachrichtigungen erstellt`);
        }

    } catch (err) {
        console.error('[CycleMgmt] Allgemeiner Fehler:', err.message);
    }
}, 'projects');
