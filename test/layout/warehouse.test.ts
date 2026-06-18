import { describe, it, expect } from "vitest";
import { RACKS, PRE_DEPLOYMENT_AREA, RACK_SLOTS, PRE_DEPLOYMENT_CAPACITY } from "@/lib/layout/warehouse";

describe("warehouse layout", () => {
  it("has 16 racks, each 25 slots", () => {
    expect(RACKS).toHaveLength(16);
    expect(RACK_SLOTS).toBe(25);
    expect(RACKS.every((r) => r.label.length === 1)).toBe(true);
  });
  it("labels are unique", () => {
    expect(new Set(RACKS.map((r) => r.label)).size).toBe(16);
  });
  it("splits racks into two zones", () => {
    const zones = new Set(RACKS.map((r) => r.zone));
    expect(zones).toEqual(new Set(["main_warehouse", "office_den"]));
  });
  it("pre-deployment holds up to 30", () => {
    expect(PRE_DEPLOYMENT_CAPACITY).toBe(30);
    expect(PRE_DEPLOYMENT_AREA.label).toBe("Pre-Deployment");
  });
});
