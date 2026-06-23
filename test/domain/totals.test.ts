import { describe, it, expect } from "vitest";
import { computeTotals, computeLineTotals } from "@/lib/domain/totals";
import type { Machine } from "@/lib/domain/types";

const m = (over: Partial<Machine>): Machine => ({
  id: 1, serial: "S36250423001", model: "Matsuda", role: "Primary",
  status: "New", productLine: "360 Pro", assembledBy: null,
  notes: null, location: "A", slot: 1, destination: null,
  checkedOutAt: null, createdAt: new Date(), updatedAt: new Date(), ...over,
});

describe("computeTotals", () => {
  it("counts by model+role+status and excludes Out machines", () => {
    const list = [
      m({ id: 1, model: "Matsuda", role: "Primary", status: "New" }),
      m({ id: 2, model: "Matsuda", role: "Primary", status: "Broken" }),
      m({ id: 3, model: "Matsuda", role: "Primary", status: "New", location: "Out" }),
      m({ id: 4, model: "Hanasis", role: "Secondary", status: "Used", location: "Pre-Deployment", slot: null }),
    ];
    const t = computeTotals(list);
    const matsudaP = t.rows.find((r) => r.model === "Matsuda" && r.role === "Primary")!;
    expect(matsudaP).toMatchObject({ New: 1, Used: 0, Broken: 1, total: 2 });
    const hanasisS = t.rows.find((r) => r.model === "Hanasis" && r.role === "Secondary")!;
    expect(hanasisS).toMatchObject({ Used: 1, total: 1 });
    expect(t.grand).toMatchObject({ New: 1, Used: 1, Broken: 1, total: 3 });
  });

  it("returns all 6 model x role rows even when empty", () => {
    const t = computeTotals([]);
    expect(t.rows).toHaveLength(6);
    expect(t.grand.total).toBe(0);
  });
});

describe("computeLineTotals", () => {
  it("breaks down by product line x role x status, excluding Out, plus by-model", () => {
    const list = [
      m({ productLine: "360 Pro", role: "Primary", status: "New", model: "Matsuda" }),
      m({ productLine: "360 Smoke", role: "Secondary", status: "Broken", model: "Yunos" }),
      m({ productLine: "360 Pro", role: "Primary", status: "New", model: "Matsuda", location: "Out" }),
    ];
    const t = computeLineTotals(list);
    expect(t.rows.find((r) => r.line === "360 Pro" && r.role === "Primary")).toMatchObject({ New: 1, total: 1 });
    expect(t.rows.find((r) => r.line === "360 Smoke" && r.role === "Secondary")).toMatchObject({ Broken: 1, total: 1 });
    expect(t.byModel.Matsuda).toBe(1); // Out excluded
    expect(t.byModel.Yunos).toBe(1);
    expect(t.rows).toHaveLength(4);
  });
});
