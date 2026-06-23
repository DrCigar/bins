import { Machine } from "./types";

const HEADER = [
  "serial", "product_line", "role", "model", "status", "assembled_by", "notes",
  "location", "slot", "destination", "checked_out_at", "created_at", "updated_at",
] as const;

const esc = (v: unknown): string => {
  if (v === null || v === undefined) return "";
  const s = v instanceof Date ? v.toISOString() : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function toCsv(machines: Machine[]): string {
  const rows = machines.map((m) =>
    [m.serial, m.productLine, m.role, m.model, m.status, m.assembledBy, m.notes, m.location, m.slot,
     m.destination, m.checkedOutAt, m.createdAt, m.updatedAt].map(esc).join(","),
  );
  return [HEADER.join(","), ...rows].join("\n") + "\n";
}
