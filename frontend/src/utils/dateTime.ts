/** Read API timestamps as UTC, including those returned without an offset by SQLite. */
export const NEPAL_TIME_ZONE = "Asia/Kathmandu";

export function parseApiDate(value: string): Date {
  const iso = value.replace(" ", "T");
  const hasTime = iso.includes("T");
  const hasZone = /(?:Z|[+-]\d{2}:\d{2})$/i.test(iso);

  return new Date(hasTime && !hasZone ? `${iso}Z` : iso);
}
