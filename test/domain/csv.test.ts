import { describe, it, expect } from "vitest";
import { toCsv, toSerializationCsv } from "@/lib/domain/csv";
import type { Machine, SerializationEvent } from "@/lib/domain/types";

describe("toSerializationCsv", () => {
  it("writes a header and one row per event", () => {
    const ev: SerializationEvent = {
      id: 1, serial: "SMKP250423001", productLine: "360 Smoke", role: "Primary",
      model: "Matsuda", assembledBy: "Thang", serializedAt: new Date(Date.UTC(2025, 3, 23)),
    };
    const lines = toSerializationCsv([ev]).trim().split("\n");
    expect(lines[0]).toBe("serialized_at,serial,product_line,role,model,assembled_by");
    expect(lines[1]).toContain("SMKP250423001,360 Smoke,Primary,Matsuda,Thang");
  });
});

const base: Machine = {
  id: 1, serial: "S36250423001", model: "Matsuda", role: "Primary", status: "New",
  productLine: "360 Pro", assembledBy: null,
  notes: null, location: "A", slot: 3, destination: null, checkedOutAt: null,
  createdAt: new Date(Date.UTC(2025, 3, 23)), updatedAt: new Date(Date.UTC(2025, 3, 24)),
};

describe("toCsv", () => {
  it("writes a header and one row per machine", () => {
    const csv = toCsv([base]);
    const lines = csv.trim().split("\n");
    expect(lines[0]).toBe("serial,product_line,role,model,status,assembled_by,notes,location,slot,destination,checked_out_at,created_at,updated_at");
    expect(lines[1]).toContain("S36250423001,360 Pro,Primary,Matsuda,New,,,A,3,,");
  });

  it("escapes commas and quotes in notes", () => {
    const csv = toCsv([{ ...base, notes: 'screen cracked, "left" side' }]);
    expect(csv).toContain('"screen cracked, ""left"" side"');
  });
});
