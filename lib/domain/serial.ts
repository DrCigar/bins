// Serial format: S36 + YYMMDD + sequence (e.g. S36250423001 -> 2025-04-23)
const DATE_START = 3; // after "S36"

export function parseSerialDate(serial: string | null | undefined): Date | null {
  if (typeof serial !== "string" || serial.length < DATE_START + 6) return null;
  const digits = serial.slice(DATE_START, DATE_START + 6);
  if (!/^\d{6}$/.test(digits)) return null;
  const yy = Number(digits.slice(0, 2));
  const mm = Number(digits.slice(2, 4));
  const dd = Number(digits.slice(4, 6));
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return null;
  const year = 2000 + yy;
  const date = new Date(Date.UTC(year, mm - 1, dd));
  // reject overflow (e.g. Feb 30 -> Mar 2)
  if (date.getUTCMonth() !== mm - 1 || date.getUTCDate() !== dd) return null;
  return date;
}

// Older first. Unparseable / missing serials sort last.
export function compareByAge(a: string | null, b: string | null): number {
  const da = parseSerialDate(a);
  const db = parseSerialDate(b);
  if (da && db) return da.getTime() - db.getTime();
  if (da && !db) return -1;
  if (!da && db) return 1;
  return (a ?? "").localeCompare(b ?? "");
}
