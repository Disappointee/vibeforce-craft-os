/// <reference path="../pb_data/types.d.ts" />
/**
 * Atomic Transactional Time Entry Overlap Hook für Vibeforce Flow OS (PB >= 0.23)
 * Ensures zero overlapping time intervals exist for a given user using atomic transaction isolation.
 *
 * WICHTIG (Befund 2026-10-22, PB 0.37): Request-Hooks müssen e.next() aufrufen,
 * sonst wird der eigentliche Create/Update nie ausgeführt (Request endet leer).
 * Vorher fehlte e.next() in allen Pfaden → Time-Entries wurden gar nicht gespeichert.
 */

onRecordCreateRequest((e) => {
  try {
    const userId = e.record.get("user");
    const startTime = e.record.get("start_time");
    const endTime = e.record.get("end_time");

    if (userId && startTime) {
      $app.runInTransaction((txApp) => {
        const filter = endTime
          ? 'user = {:user} && id != {:id} && start_time < {:end_time} && (end_time = "" || end_time > {:start_time})'
          : 'user = {:user} && id != {:id} && (end_time = "" || end_time > {:start_time})';
        const params = endTime
          ? { user: userId, id: e.record.id || "", start_time: startTime, end_time: endTime }
          : { user: userId, id: e.record.id || "", start_time: startTime };

        const overlapping = txApp.findRecordsByFilter(
          "time_entries",
          filter,
          "-created",
          1,
          0,
          params
        );

        if (overlapping && overlapping.length > 0) {
          throw new BadRequestError("Time entry overlaps with an existing entry.");
        }

        e.next();
      });
    } else {
      e.next();
    }
  } catch (err) {
    if (err instanceof BadRequestError) {
      throw err;
    }
    console.error("[time_entries_overlap:create] Error:", err);
    throw new BadRequestError("Überlappungsprüfung fehlgeschlagen.");
  }
}, "time_entries");

onRecordUpdateRequest((e) => {
  try {
    const userId = e.record.get("user");
    const startTime = e.record.get("start_time");
    const endTime = e.record.get("end_time");

    if (userId && startTime) {
      $app.runInTransaction((txApp) => {
        const filter = endTime
          ? 'user = {:user} && id != {:id} && start_time < {:end_time} && (end_time = "" || end_time > {:start_time})'
          : 'user = {:user} && id != {:id} && (end_time = "" || end_time > {:start_time})';
        const params = endTime
          ? { user: userId, id: e.record.id, start_time: startTime, end_time: endTime }
          : { user: userId, id: e.record.id, start_time: startTime };

        const overlapping = txApp.findRecordsByFilter(
          "time_entries",
          filter,
          "-created",
          1,
          0,
          params
        );

        if (overlapping && overlapping.length > 0) {
          throw new BadRequestError("Time entry overlaps with an existing entry.");
        }

        e.next();
      });
    } else {
      e.next();
    }
  } catch (err) {
    if (err instanceof BadRequestError) {
      throw err;
    }
    console.error("[time_entries_overlap:update] Error:", err);
    throw new BadRequestError("Überlappungsprüfung fehlgeschlagen.");
  }
}, "time_entries");
