import { Machine, MODELS, ROLES, Model, Role, OUT } from "./types";

export interface TotalsRow {
  model: Model;
  role: Role;
  New: number;
  Used: number;
  Broken: number;
  total: number;
}
export interface Totals {
  rows: TotalsRow[];
  grand: Omit<TotalsRow, "model" | "role">;
}

// On-hand only: machines checked Out are excluded.
export function computeTotals(machines: Machine[]): Totals {
  const onHand = machines.filter((x) => x.location !== OUT);
  const rows: TotalsRow[] = [];
  for (const model of MODELS) {
    for (const role of ROLES) {
      const subset = onHand.filter((x) => x.model === model && x.role === role);
      rows.push({
        model,
        role,
        New: subset.filter((x) => x.status === "New").length,
        Used: subset.filter((x) => x.status === "Used").length,
        Broken: subset.filter((x) => x.status === "Broken").length,
        total: subset.length,
      });
    }
  }
  const grand = {
    New: rows.reduce((s, r) => s + r.New, 0),
    Used: rows.reduce((s, r) => s + r.Used, 0),
    Broken: rows.reduce((s, r) => s + r.Broken, 0),
    total: rows.reduce((s, r) => s + r.total, 0),
  };
  return { rows, grand };
}
