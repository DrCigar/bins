import { describe, it, expect } from "vitest";
import {
  RACKS, PRE_DEPLOYMENT_AREA, RACK_SLOTS, PRE_DEPLOYMENT_CAPACITY,
  STAGING_RACKS, INBOUND_AREA, areaCapacity,
} from "@/lib/layout/warehouse";

describe("staging + areas", () => {
  it("designates I and J as staging", () => {
    expect(STAGING_RACKS).toEqual(["I", "J"]);
    expect(RACKS.filter((r) => r.isStaging).map((r) => r.label).sort()).toEqual(["I", "J"]);
  });
  it("has three open areas with the right caps", () => {
    expect(areaCapacity("Inbound")).toBe(10);
    expect(areaCapacity("Pre-Deployment")).toBe(30);
    expect(areaCapacity("Outbound")).toBeNull();
    expect(INBOUND_AREA.label).toBe("Inbound");
  });
});

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
