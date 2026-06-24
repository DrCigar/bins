import { describe, it, expect } from "vitest";
import {
  RACKS, PRE_DEPLOYMENT_AREA, PRE_DEPLOYMENT_CAPACITY,
  STAGING_RACKS, INBOUND_AREA, areaCapacity, rackCapacity, slotLabel,
} from "@/lib/layout/warehouse";

describe("staging + areas", () => {
  it("designates HH and II as staging", () => {
    expect(STAGING_RACKS.sort()).toEqual(["HH", "II"]);
    expect(RACKS.filter((r) => r.isStaging).map((r) => r.label).sort()).toEqual(["HH", "II"]);
  });
  it("has three open areas with the right caps", () => {
    expect(areaCapacity("Inbound")).toBe(10);
    expect(areaCapacity("Pre-Deployment")).toBe(30);
    expect(areaCapacity("Outbound")).toBeNull();
    expect(INBOUND_AREA.label).toBe("Inbound");
  });
});

describe("warehouse layout", () => {
  it("has 18 racks with unique labels", () => {
    expect(RACKS).toHaveLength(18);
    expect(new Set(RACKS.map((r) => r.label)).size).toBe(18);
  });
  it("retired N, O, P", () => {
    const labels = RACKS.map((r) => r.label);
    expect(labels).not.toContain("N");
    expect(labels).not.toContain("O");
    expect(labels).not.toContain("P");
  });
  it("has the right per-rack capacities", () => {
    expect(rackCapacity("M")).toBe(25); // 5x5 standard
    expect(rackCapacity("AA")).toBe(8); // 4x2
    expect(rackCapacity("EE")).toBe(8);
    expect(rackCapacity("FF")).toBe(8);
    expect(rackCapacity("HH")).toBe(16); // 4x4
    expect(rackCapacity("II")).toBe(16);
  });
  it("labels slots row.col per the rack's column count", () => {
    expect(slotLabel("M", 1)).toBe("M1.1"); // 5 cols
    expect(slotLabel("M", 6)).toBe("M2.1");
    expect(slotLabel("M", 25)).toBe("M5.5");
    expect(slotLabel("AA", 3)).toBe("AA2.1"); // 2 cols
    expect(slotLabel("HH", 5)).toBe("HH2.1"); // 4 cols
  });
  it("splits racks into two zones", () => {
    expect(new Set(RACKS.map((r) => r.zone))).toEqual(new Set(["main_warehouse", "office_den"]));
  });
  it("pre-deployment holds up to 30", () => {
    expect(PRE_DEPLOYMENT_CAPACITY).toBe(30);
    expect(PRE_DEPLOYMENT_AREA.label).toBe("Pre-Deployment");
  });
});
