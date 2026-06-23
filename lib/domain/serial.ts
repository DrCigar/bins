// Serial format: <prefix> + YYMMDD + 3-digit sequence (e.g. SMKP250423001 -> 2025-04-23).
// Prefix is 4 chars (S36P/S36S/SMKP/SMKS); the legacy 3-char S36... still parses.
import { ProductLine, Role, SERIAL_PREFIX } from "./types";

export const prefixFor = (line: ProductLine, role: Role): string => SERIAL_PREFIX[line][role];

const pad3 = (n: number): string => String(n).padStart(3, "0");

export function buildSerial(prefix: string, date: Date, seq: number): string {
  const yy = String(date.getUTCFullYear()).slice(2);
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  return `${prefix}${yy}${mm}${dd}${pad3(seq)}`;
}

export function parseSerialDate(serial: string | null | undefined): Date | null {
  // Date is the 6 digits immediately before the 3-digit sequence — prefix-length independent.
  if (typeof serial !== "string" || serial.length < 9) return null;
  const digits = serial.slice(-9, -3);
  if (!/^\d{6}$/.test(digits)) return null;
  const yy = Number(digits.slice(0, 2));
  const mm = Number(digits.slice(2, 4));
  const dd = Number(digits.slice(4, 6));
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return null;
  const date = new Date(Date.UTC(2000 + yy, mm - 1, dd));
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
