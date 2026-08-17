/// <reference path="../pb_data/types.d.ts" />
/**
 * Atomic Time Entry Overlap Check Hook für Vibeforce Flow OS
 * Ensures no overlapping time entries exist for a given user.
 */

onRecordCreateRequest((e) => {
  const userId = e.record.get("user");
  const startTime = e.record.get("start_time");
  const endTime = e.record.get("end_time");

  if (!userId || !startTime || !endTime) return;

  const overlapping = $app.findRecordsByFilter(
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
}, "time_entries");

onRecordUpdateRequest((e) => {
  const userId = e.record.get("user");
  const startTime = e.record.get("start_time");
  const endTime = e.record.get("end_time");

  if (!userId || !startTime || !endTime) return;

  const overlapping = $app.findRecordsByFilter(
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
}, "time_entries");
