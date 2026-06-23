import { Machine, MODELS, ROLES, PRODUCT_LINES, Model, Role, ProductLine, OUT } from "./types";

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

export interface LineTotalsRow {
  line: ProductLine;
  role: Role;
  New: number;
  Used: number;
  Broken: number;
  total: number;
}
export interface LineTotals {
  rows: LineTotalsRow[];
  grand: Omit<LineTotalsRow, "line" | "role">;
  byModel: Record<Model, number>;
}

// Primary breakdown: product line x role x status. Plus a by-model count. On-hand only.
export function computeLineTotals(machines: Machine[]): LineTotals {
  const onHand = machines.filter((x) => x.location !== OUT);
  const rows: LineTotalsRow[] = [];
  for (const line of PRODUCT_LINES) {
    for (const role of ROLES) {
      const subset = onHand.filter((x) => x.productLine === line && x.role === role);
      rows.push({
        line,
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
  const byModel = MODELS.reduce((acc, model) => {
    acc[model] = onHand.filter((x) => x.model === model).length;
    return acc;
  }, {} as Record<Model, number>);
  return { rows, grand, byModel };
}
