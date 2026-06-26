/**
 * Config activities - read environment for workflow tuning.
 * Used for local dev (e.g. short reminder interval).
 */

const DEFAULT_REMINDER_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function getReminderThresholdMs(): Promise<number> {
  const val = process.env.EDM_REMINDER_THRESHOLD_MS;
  if (val == null || val === "") return DEFAULT_REMINDER_MS;
  const n = parseInt(val, 10);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_REMINDER_MS;
}
