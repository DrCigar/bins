import { describe, it, expect } from "vitest";
import { computeLineTotals, computeStatusBreakdown } from "@/lib/domain/totals";
import type { Machine } from "@/lib/domain/types";

const m = (over: Partial<Machine>): Machine => ({
  id: 1, serial: "S36250423001", model: "Matsuda", role: "Primary",
  status: "New", productLine: "360 Pro", assembledBy: null,
  notes: null, location: "A", slot: 1, destination: null,
  checkedOutAt: null, createdAt: new Date(), updatedAt: new Date(), ...over,
});

describe("computeStatusBreakdown", () => {
  it("splits each status by model and role, excluding Out", () => {
    const list = [
      m({ status: "New", model: "Matsuda", role: "Primary" }),
      m({ status: "New", model: "Matsuda", role: "Secondary" }),
      m({ status: "Used", model: "Hanasis", role: "Primary" }),
      m({ status: "Review", model: "Yunos", role: "Primary" }),
      m({ status: "New", model: "Matsuda", role: "Primary", location: "Out" }), // excluded
    ];
    const b = computeStatusBreakdown(list);
    expect(b.New.byModel.Matsuda).toMatchObject({ primary: 1, secondary: 1, total: 2 });
    expect(b.New.total).toBe(2);
    expect(b.Used.byModel.Hanasis).toMatchObject({ primary: 1, secondary: 0, total: 1 });
    expect(b.Review.byModel.Yunos.total).toBe(1);
    expect(b.Breakdown.total).toBe(0);
  });
});

describe("computeLineTotals", () => {
  it("breaks down by product line x role x status, excluding Out, plus by-model", () => {
    const list = [
      m({ productLine: "360 Pro", role: "Primary", status: "New", model: "Matsuda" }),
      m({ productLine: "360 Smoke", role: "Secondary", status: "Breakdown", model: "Yunos" }),
      m({ productLine: "360 Pro", role: "Secondary", status: "Review", model: "Hanasis" }),
      m({ productLine: "360 Pro", role: "Primary", status: "New", model: "Matsuda", location: "Out" }),
    ];
    const t = computeLineTotals(list);
    const proP = t.rows.find((r) => r.line === "360 Pro" && r.role === "Primary")!;
    expect(proP.byStatus.New).toBe(1);
    expect(proP.total).toBe(1);
    // total counts only New + Used: a Breakdown-only row totals 0...
    const smokeS = t.rows.find((r) => r.line === "360 Smoke" && r.role === "Secondary")!;
    expect(smokeS.byStatus.Breakdown).toBe(1);
    expect(smokeS.total).toBe(0);
    // ...and a Review-only row also totals 0 (Review excluded from totals)
    const proS = t.rows.find((r) => r.line === "360 Pro" && r.role === "Secondary")!;
    expect(proS.byStatus.Review).toBe(1);
    expect(proS.total).toBe(0);
    expect(t.grand.total).toBe(1); // only the New Matsuda counts
    expect(t.grand.byStatus.Review).toBe(1);
    expect(t.grand.byStatus.Breakdown).toBe(1);
    expect(t.byModel.Matsuda).toBe(1); // Out excluded
    expect(t.byModel.Yunos).toBe(1);
    expect(t.rows).toHaveLength(4);
  });
});
