import { Machine, MODELS, ROLES, STATUSES, PRODUCT_LINES, COUNTED_STATUSES, Model, Role, Status, ProductLine, OUT } from "./types";

const zeroByStatus = (): Record<Status, number> =>
  STATUSES.reduce((acc, s) => ({ ...acc, [s]: 0 }), {} as Record<Status, number>);
// On-hand total counts only the "counted" statuses (New + Used); Review/Breakdown are excluded.
const countedTotal = (byStatus: Record<Status, number>): number =>
  COUNTED_STATUSES.reduce((sum, s) => sum + byStatus[s], 0);

export interface LineTotalsRow {
  line: ProductLine;
  role: Role;
  byStatus: Record<Status, number>;
  total: number;
}
export interface LineTotals {
  rows: LineTotalsRow[];
  grand: { byStatus: Record<Status, number>; total: number };
  byModel: Record<Model, number>;
}

// Primary breakdown: product line x role x status. Plus a by-model count. On-hand only.
export function computeLineTotals(machines: Machine[]): LineTotals {
  const onHand = machines.filter((x) => x.location !== OUT);
  const rows: LineTotalsRow[] = [];
  for (const line of PRODUCT_LINES) {
    for (const role of ROLES) {
      const subset = onHand.filter((x) => x.productLine === line && x.role === role);
      const byStatus = zeroByStatus();
      for (const s of STATUSES) byStatus[s] = subset.filter((x) => x.status === s).length;
      rows.push({ line, role, byStatus, total: countedTotal(byStatus) });
    }
  }
  const grandByStatus = zeroByStatus();
  for (const s of STATUSES) grandByStatus[s] = rows.reduce((sum, r) => sum + r.byStatus[s], 0);
  const grand = { byStatus: grandByStatus, total: countedTotal(grandByStatus) };
  const byModel = MODELS.reduce((acc, model) => {
    acc[model] = onHand.filter((x) => x.model === model).length;
    return acc;
  }, {} as Record<Model, number>);
  return { rows, grand, byModel };
}

// The four product-line x role combos, in display order.
export const LINE_ROLES = PRODUCT_LINES.flatMap((line) => ROLES.map((role) => ({ line, role, label: `${line} ${role}` })));
export interface StatusComboSection { counts: number[]; total: number } // counts aligned to LINE_ROLES
export type StatusComboBreakdown = Record<Status, StatusComboSection>;

// For each status: a count for each product-line x role combo (on-hand only).
export function computeStatusCombos(machines: Machine[]): StatusComboBreakdown {
  const onHand = machines.filter((x) => x.location !== OUT);
  const out = {} as StatusComboBreakdown;
  for (const status of STATUSES) {
    const subset = onHand.filter((x) => x.status === status);
    const counts = LINE_ROLES.map(({ line, role }) => subset.filter((x) => x.productLine === line && x.role === role).length);
    out[status] = { counts, total: counts.reduce((a, b) => a + b, 0) };
  }
  return out;
}

export interface ModelCell { primary: number; secondary: number; total: number }
export interface StatusSection { byModel: Record<Model, ModelCell>; total: number }
export type StatusBreakdown = Record<Status, StatusSection>;

// For each status (New/Used/Review/Breakdown): per-model Primary/Secondary counts. On-hand only.
export function computeStatusBreakdown(machines: Machine[]): StatusBreakdown {
  const onHand = machines.filter((x) => x.location !== OUT);
  const out = {} as StatusBreakdown;
  for (const status of STATUSES) {
    const byModel = {} as Record<Model, ModelCell>;
    let total = 0;
    for (const model of MODELS) {
      const subset = onHand.filter((x) => x.status === status && x.model === model);
      const primary = subset.filter((x) => x.role === "Primary").length;
      const secondary = subset.filter((x) => x.role === "Secondary").length;
      byModel[model] = { primary, secondary, total: subset.length };
      total += subset.length;
    }
    out[status] = { byModel, total };
  }
  return out;
}
