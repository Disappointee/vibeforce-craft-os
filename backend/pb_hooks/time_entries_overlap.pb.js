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

    if (userId && startTime && endTime) {
      $app.runInTransaction((txApp) => {
        const overlapping = txApp.findRecordsByFilter(
          "time_entries",
          "user = {:user} && id != {:id} && start_time < {:end_time} && end_time > {:start_time}",
          "-created",
          1,
          0,
          {
            user: userId,
            id: e.record.id || "",
            start_time: startTime,
            end_time: endTime,
          }
        );

        if (overlapping && overlapping.length > 0) {
          throw new BadRequestError("Time entry overlaps with an existing entry.");
        }
      });
    }
  } catch (err) {
    if (err instanceof BadRequestError) {
      throw err;
    }
    console.error("[time_entries_overlap:create] Error:", err);
    throw new BadRequestError("Überlappungsprüfung fehlgeschlagen.");
  }
  e.next();
}, "time_entries");

onRecordUpdateRequest((e) => {
  try {
    const userId = e.record.get("user");
    const startTime = e.record.get("start_time");
    const endTime = e.record.get("end_time");

    if (userId && startTime && endTime) {
      $app.runInTransaction((txApp) => {
        const overlapping = txApp.findRecordsByFilter(
          "time_entries",
          "user = {:user} && id != {:id} && start_time < {:end_time} && end_time > {:start_time}",
          "-created",
          1,
          0,
          {
            user: userId,
            id: e.record.id,
            start_time: startTime,
            end_time: endTime,
          }
        );

        if (overlapping && overlapping.length > 0) {
          throw new BadRequestError("Time entry overlaps with an existing entry.");
        }
      });
    }
  } catch (err) {
    if (err instanceof BadRequestError) {
      throw err;
    }
    console.error("[time_entries_overlap:update] Error:", err);
    throw new BadRequestError("Überlappungsprüfung fehlgeschlagen.");
  }
  e.next();
}, "time_entries");
