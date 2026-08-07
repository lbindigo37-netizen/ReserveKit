/** Parse "HH:MM" into minutes since midnight. */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/** Format minutes since midnight as "HH:MM". */
export function minutesToTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

/** Weekday index (0 = Sunday .. 6 = Saturday) for a 'YYYY-MM-DD' date string, interpreted as a plain calendar date (no timezone shifting). */
export function weekdayOf(dateStr: string): number {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

/** Whether `date` (YYYY-MM-DD) falls within [start, end] inclusive, all as plain date strings. */
export function isDateWithinRange(date: string, start: string, end: string): boolean {
  return date >= start && date <= end;
}

export function isValidDateString(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(Date.parse(date));
}

export function isValidTimeString(time: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(time);
}
