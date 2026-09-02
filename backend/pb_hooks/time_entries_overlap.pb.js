/// <reference path="../pb_data/types.d.ts" />
/**
 * 🛡️ Atomic Transactional Time Entry Overlap Hook für Vibeforce Flow OS
 * Ensures zero overlapping time intervals exist for a given user using atomic transaction isolation.
 */

onRecordCreateRequest((e) => {
  const userId = e.record.get("user");
  const startTime = e.record.get("start_time");
  const endTime = e.record.get("end_time");

  if (!userId || !startTime || !endTime) return;

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
}, "time_entries");

onRecordUpdateRequest((e) => {
  const userId = e.record.get("user");
  const startTime = e.record.get("start_time");
  const endTime = e.record.get("end_time");

  if (!userId || !startTime || !endTime) return;

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
}, "time_entries");

